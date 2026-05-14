import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication middleware to all dashboard routes
router.use(authenticateToken);

// GET /api/v1/dashboard/stats - Real database statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run all queries in parallel
    const [
      todaySalesAgg,
      totalCustomers,
      lowStockCount,
      thisWeekAgg,
      lastWeekAgg,
      thisMonthAgg,
      lastMonthAgg,
    ] = await Promise.all([
      // Today's sales total and count
      prisma.sale.aggregate({
        _sum: { totalAmount: true },
        _count: { id: true },
        where: {
          createdAt: { gte: todayStart, lt: todayEnd },
          status: { not: 'CANCELLED' },
        },
      }),
      // Total active customers
      prisma.customer.count({ where: { isActive: true } }),
      // Low stock count: inventory items below their product's reorderPoint
      prisma.inventoryItem.count({
        where: {
          product: { isNot: null },
          quantity: { lte: 0 },
        },
      }),
      // This week revenue
      prisma.sale.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: weekStart, lt: todayEnd },
          status: { not: 'CANCELLED' },
        },
      }),
      // Last week revenue
      prisma.sale.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: prevWeekStart, lt: weekStart },
          status: { not: 'CANCELLED' },
        },
      }),
      // This month revenue
      prisma.sale.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: monthStart, lt: todayEnd },
          status: { not: 'CANCELLED' },
        },
      }),
      // Last month revenue
      prisma.sale.aggregate({
        _sum: { totalAmount: true },
        where: {
          createdAt: { gte: prevMonthStart, lt: prevMonthEnd },
          status: { not: 'CANCELLED' },
        },
      }),
    ]);

    const todaySales = todaySalesAgg._sum.totalAmount ?? 0;
    const todayTransactions = todaySalesAgg._count.id ?? 0;

    const thisWeekRevenue = thisWeekAgg._sum.totalAmount ?? 0;
    const lastWeekRevenue = lastWeekAgg._sum.totalAmount ?? 0;
    const weeklyGrowth =
      lastWeekRevenue === 0
        ? 0
        : ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100;

    const thisMonthRevenue = thisMonthAgg._sum.totalAmount ?? 0;
    const lastMonthRevenue = lastMonthAgg._sum.totalAmount ?? 0;
    const monthlyGrowth =
      lastMonthRevenue === 0
        ? 0
        : ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;

    const stats = {
      todaySales,
      todayTransactions,
      totalCustomers,
      lowStockCount,
      weeklyGrowth: Math.round(weeklyGrowth * 10) / 10,
      monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
    };

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
});

// GET /api/v1/dashboard/recent-sales - Last 10 real transactions
router.get('/recent-sales', async (req: Request, res: Response) => {
  try {
    const sales = await prisma.sale.findMany({
      where: { status: { not: 'CANCELLED' } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        customer: { select: { firstName: true, lastName: true } },
        items: { select: { id: true } },
      },
    });

    const recentSales = sales.map((s) => ({
      id: s.id,
      saleNumber: s.saleNumber,
      total: s.totalAmount,
      items: s.items.length,
      customer: s.customer
        ? `${s.customer.firstName} ${s.customer.lastName}`
        : null,
      status: s.status,
      paymentStatus: s.paymentStatus,
      timestamp: s.createdAt.toISOString(),
    }));

    res.status(200).json({ success: true, data: recentSales });
  } catch (error) {
    console.error('Recent sales error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recent sales' });
  }
});

// GET /api/v1/dashboard/low-stock - Real inventory items at or below reorder point
router.get('/low-stock', async (req: Request, res: Response) => {
  try {
    const lowStockItems = await prisma.inventoryItem.findMany({
      where: {
        product: { isNot: null },
      },
      include: {
        product: { select: { id: true, name: true, sku: true, reorderPoint: true, minStock: true } },
      },
      orderBy: { quantity: 'asc' },
      take: 20,
    });

    // Filter items where quantity <= reorderPoint
    const filtered = lowStockItems
      .filter((item) => item.product && item.quantity <= (item.product.reorderPoint ?? item.product.minStock ?? 0))
      .map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.product!.name,
        sku: item.product!.sku,
        currentStock: item.quantity,
        reorderPoint: item.product!.reorderPoint,
        minStock: item.product!.minStock,
        location: item.location,
        lastUpdated: item.lastUpdated.toISOString(),
      }));

    res.status(200).json({ success: true, data: filtered });
  } catch (error) {
    console.error('Low stock error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch low stock items' });
  }
});

// GET /api/v1/dashboard/top-products - Top products by quantity sold today
router.get('/top-products', async (req: Request, res: Response) => {
  try {
    const { days = '7' } = req.query;
    const daysNum = Math.min(Number(days) || 7, 90);
    const since = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

    const topItems = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, totalPrice: true },
      _count: { id: true },
      where: {
        productId: { not: null },
        sale: {
          createdAt: { gte: since },
          status: { not: 'CANCELLED' },
        },
      },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    // Fetch product details for the top items
    const productIds = topItems.map((item) => item.productId!).filter(Boolean);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true, price: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const result = topItems.map((item) => ({
      productId: item.productId,
      product: productMap.get(item.productId!) ?? null,
      quantitySold: item._sum.quantity ?? 0,
      revenue: item._sum.totalPrice ?? 0,
      transactions: item._count.id,
    }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Top products error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch top products' });
  }
});

// GET /api/v1/dashboard/hourly-sales - Hourly sales chart for today
router.get('/hourly-sales', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const sales = await prisma.sale.findMany({
      where: {
        createdAt: { gte: todayStart, lt: todayEnd },
        status: { not: 'CANCELLED' },
      },
      select: { createdAt: true, totalAmount: true },
    });

    // Group by hour
    const hourlyMap: Record<number, { hour: number; sales: number; revenue: number }> = {};
    for (let h = 0; h < 24; h++) {
      hourlyMap[h] = { hour: h, sales: 0, revenue: 0 };
    }

    for (const sale of sales) {
      const hour = sale.createdAt.getHours();
      hourlyMap[hour].sales += 1;
      hourlyMap[hour].revenue += sale.totalAmount;
    }

    const hourlyData = Object.values(hourlyMap).map((entry) => ({
      ...entry,
      label: `${String(entry.hour).padStart(2, '0')}:00`,
      revenue: Math.round(entry.revenue * 100) / 100,
    }));

    res.status(200).json({ success: true, data: hourlyData });
  } catch (error) {
    console.error('Hourly sales error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch hourly sales' });
  }
});

export default router;
