import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticate);

// Get all inventory items
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, lowStock } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (search) {
      where.OR = [
        { product: { name: { contains: search as string, mode: 'insensitive' } } },
        { product: { sku: { contains: search as string, mode: 'insensitive' } } },
        { product: { barcode: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    if (lowStock === 'true') {
      where.AND = [
        { product: { isActive: true } },
        {
          OR: [
            { quantity: { lte: { product: { reorderPoint: true } } } },
            { quantity: { lte: { product: { minStock: true } } } }
          ]
        }
      ];
    }

    const [inventoryItems, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        include: {
          product: {
            include: {
              category: true,
              supplier: true
            }
          },
          variant: true,
          movements: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
              user: {
                select: { firstName: true, lastName: true }
              }
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { lastUpdated: 'desc' }
      }),
      prisma.inventoryItem.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        inventoryItems,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get inventory item by ID
router.get('/:id', async (req, res, next) => {
  try {
    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: { id: req.params.id },
      include: {
        product: {
          include: {
            category: true,
            supplier: true
          }
        },
        variant: true,
        movements: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      }
    });

    if (!inventoryItem) {
      throw new AppError('Inventory item not found', 404);
    }

    res.json({
      success: true,
      data: { inventoryItem }
    });
  } catch (error) {
    next(error);
  }
});

// Create inventory adjustment
router.post('/adjustment', authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { productId, variantId, quantity, reason, batchNumber } = req.body;
    const userId = req.user?.id;

    const result = await prisma.$transaction(async (tx) => {
      // Find or create inventory item
      let inventoryItem = await tx.inventoryItem.findFirst({
        where: {
          productId,
          variantId,
          batchNumber
        }
      });

      if (!inventoryItem) {
        inventoryItem = await tx.inventoryItem.create({
          data: {
            productId,
            variantId,
            quantity: 0,
            batchNumber
          }
        });
      }

      const oldQuantity = inventoryItem.quantity;
      const newQuantity = oldQuantity + quantity;

      // Update inventory
      const updatedItem = await tx.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: {
          quantity: newQuantity,
          lastUpdated: new Date()
        },
        include: {
          product: true,
          variant: true
        }
      });

      // Create movement record
      await tx.inventoryMovement.create({
        data: {
          inventoryId: inventoryItem.id,
          type: 'ADJUSTMENT',
          quantity,
          reason,
          userId
        }
      });

      return updatedItem;
    });

    res.status(201).json({
      success: true,
      message: 'Inventory adjustment created successfully',
      data: { inventoryItem: result }
    });
  } catch (error) {
    next(error);
  }
});

// Get low stock items
router.get('/alerts/low-stock', async (req, res, next) => {
  try {
    const lowStockItems = await prisma.inventoryItem.findMany({
      where: {
        product: {
          isActive: true
        },
        OR: [
          {
            quantity: {
              lte: prisma.product.fields.reorderPoint
            }
          }
        ]
      },
      include: {
        product: {
          include: {
            category: true,
            supplier: true
          }
        },
        variant: true
      },
      orderBy: {
        quantity: 'asc'
      }
    });

    res.json({
      success: true,
      data: { lowStockItems }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
