import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticate);

// Sales report
router.get('/sales', async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const where: any = {};
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        items: {
          include: {
            product: true
          }
        },
        customer: true,
        user: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate totals
    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
    const totalTransactions = sales.length;
    const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    // Group by date
    const salesByDate = sales.reduce((acc: any, sale) => {
      const date = sale.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          totalSales: 0,
          transactions: 0,
          items: 0
        };
      }
      acc[date].totalSales += Number(sale.totalAmount);
      acc[date].transactions += 1;
      acc[date].items += sale.items.reduce((sum, item) => sum + Number(item.quantity), 0);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        summary: {
          totalSales,
          totalTransactions,
          averageTransaction
        },
        salesByDate: Object.values(salesByDate),
        sales
      }
    });
  } catch (error) {
    next(error);
  }
});

// Inventory report
router.get('/inventory', async (req, res, next) => {
  try {
    const inventoryItems = await prisma.inventoryItem.findMany({
      include: {
        product: {
          include: {
            category: true,
            supplier: true
          }
        },
        variant: true
      }
    });

    const totalValue = inventoryItems.reduce((sum, item) => {
      const cost = Number(item.product?.cost || 0);
      return sum + (cost * item.quantity);
    }, 0);

    const lowStockItems = inventoryItems.filter(item => 
      item.quantity <= (item.product?.reorderPoint || 0)
    );

    const outOfStockItems = inventoryItems.filter(item => item.quantity === 0);

    res.json({
      success: true,
      data: {
        summary: {
          totalItems: inventoryItems.length,
          totalValue,
          lowStockCount: lowStockItems.length,
          outOfStockCount: outOfStockItems.length
        },
        inventoryItems,
        lowStockItems,
        outOfStockItems
      }
    });
  } catch (error) {
    next(error);
  }
});

// Customer report
router.get('/customers', async (req, res, next) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        sales: {
          select: {
            totalAmount: true,
            createdAt: true
          }
        },
        _count: {
          select: { sales: true }
        }
      }
    });

    const customerStats = customers.map(customer => {
      const totalSpent = customer.sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
      const lastPurchase = customer.sales.length > 0 
        ? Math.max(...customer.sales.map(sale => sale.createdAt.getTime()))
        : null;

      return {
        ...customer,
        totalSpent,
        lastPurchase: lastPurchase ? new Date(lastPurchase) : null,
        averageOrderValue: customer._count.sales > 0 ? totalSpent / customer._count.sales : 0
      };
    });

    // Sort by total spent
    customerStats.sort((a, b) => b.totalSpent - a.totalSpent);

    res.json({
      success: true,
      data: {
        summary: {
          totalCustomers: customers.length,
          activeCustomers: customers.filter(c => c.sales.length > 0).length,
          totalCustomerValue: customerStats.reduce((sum, c) => sum + c.totalSpent, 0)
        },
        customers: customerStats
      }
    });
  } catch (error) {
    next(error);
  }
});

// Product performance report
router.get('/products', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {};
    if (startDate && endDate) {
      where.sale = {
        createdAt: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      };
    }

    const saleItems = await prisma.saleItem.findMany({
      where,
      include: {
        product: {
          include: {
            category: true
          }
        },
        variant: true,
        sale: true
      }
    });

    // Group by product
    const productStats = saleItems.reduce((acc: any, item) => {
      const productId = item.productId || 'unknown';
      if (!acc[productId]) {
        acc[productId] = {
          product: item.product,
          totalQuantity: 0,
          totalRevenue: 0,
          totalTransactions: 0
        };
      }
      acc[productId].totalQuantity += Number(item.quantity);
      acc[productId].totalRevenue += Number(item.totalPrice);
      acc[productId].totalTransactions += 1;
      return acc;
    }, {});

    const productPerformance = Object.values(productStats).sort((a: any, b: any) => 
      b.totalRevenue - a.totalRevenue
    );

    res.json({
      success: true,
      data: {
        productPerformance,
        summary: {
          totalProducts: Object.keys(productStats).length,
          totalRevenue: Object.values(productStats).reduce((sum: number, p: any) => sum + p.totalRevenue, 0),
          totalQuantitySold: Object.values(productStats).reduce((sum: number, p: any) => sum + p.totalQuantity, 0)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
