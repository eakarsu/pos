import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all dashboard routes
router.use(authenticateToken);

// GET /api/v1/dashboard/stats - Get dashboard statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Mock data for now - replace with actual database queries
    const stats = {
      todaySales: 1250.75,
      todayTransactions: 23,
      totalCustomers: 156,
      lowStockCount: 8,
      weeklyGrowth: 12.5,
      monthlyGrowth: 8.3
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats'
    });
  }
});

// GET /api/v1/dashboard/recent-sales - Get recent sales
router.get('/recent-sales', async (req: Request, res: Response) => {
  try {
    // Mock data for now - replace with actual database queries
    const recentSales = [
      {
        id: '1',
        total: 45.50,
        items: 3,
        customer: 'John Doe',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() // 15 minutes ago
      },
      {
        id: '2',
        total: 23.75,
        items: 2,
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
      },
      {
        id: '3',
        total: 67.25,
        items: 5,
        customer: 'Jane Smith',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() // 45 minutes ago
      },
      {
        id: '4',
        total: 12.99,
        items: 1,
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
      },
      {
        id: '5',
        total: 89.50,
        items: 7,
        customer: 'Bob Johnson',
        timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString() // 1.5 hours ago
      }
    ];

    res.status(200).json({
      success: true,
      data: recentSales
    });
  } catch (error) {
    console.error('Recent sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent sales'
    });
  }
});

// GET /api/v1/dashboard/low-stock - Get low stock items
router.get('/low-stock', async (req: Request, res: Response) => {
  try {
    // Mock data for now - replace with actual database queries
    const lowStockItems = [
      {
        id: '1',
        name: 'Coffee Beans',
        currentStock: 5,
        minStock: 20
      },
      {
        id: '2',
        name: 'Paper Cups',
        currentStock: 12,
        minStock: 50
      },
      {
        id: '3',
        name: 'Sandwich Bread',
        currentStock: 3,
        minStock: 15
      },
      {
        id: '4',
        name: 'Milk',
        currentStock: 8,
        minStock: 25
      },
      {
        id: '5',
        name: 'Sugar Packets',
        currentStock: 15,
        minStock: 100
      }
    ];

    res.status(200).json({
      success: true,
      data: lowStockItems
    });
  } catch (error) {
    console.error('Low stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock items'
    });
  }
});

export default router;
