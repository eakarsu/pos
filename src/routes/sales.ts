import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// Get all sales
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, status, userId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId as string;
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          customer: true,
          user: {
            select: { id: true, firstName: true, lastName: true, username: true }
          },
          items: {
            include: {
              product: true,
              variant: true
            }
          },
          payments: true
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.sale.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        sales,
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

// Get sale by ID
router.get('/:id', async (req, res, next) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        user: {
          select: { id: true, firstName: true, lastName: true, username: true }
        },
        items: {
          include: {
            product: true,
            variant: true
          }
        },
        payments: true,
        returns: true
      }
    });

    if (!sale) {
      throw new AppError('Sale not found', 404);
    }

    res.json({
      success: true,
      data: { sale }
    });
  } catch (error) {
    next(error);
  }
});

// Create sale
router.post('/', async (req, res, next) => {
  try {
    const {
      customerId,
      userId,
      items,
      payments,
      discountAmount = 0,
      notes
    } = req.body;

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    const saleItems = items.map((item: any) => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemDiscount = item.discount || 0;
      const itemTax = (itemTotal - itemDiscount) * (item.taxRate || 0) / 100;
      
      subtotal += itemTotal - itemDiscount;
      taxAmount += itemTax;

      return {
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: itemDiscount,
        taxRate: item.taxRate || 0,
        totalPrice: itemTotal - itemDiscount + itemTax
      };
    });

    const totalAmount = subtotal + taxAmount - discountAmount;

    // Generate sale number
    const saleCount = await prisma.sale.count();
    const saleNumber = `SALE-${String(saleCount + 1).padStart(6, '0')}`;

    // Create sale with transaction
    const sale = await prisma.$transaction(async (tx) => {
      // Create sale
      const newSale = await tx.sale.create({
        data: {
          saleNumber,
          customerId,
          userId,
          subtotal,
          taxAmount,
          discountAmount,
          totalAmount,
          notes,
          items: {
            create: saleItems
          }
        },
        include: {
          items: {
            include: {
              product: true,
              variant: true
            }
          }
        }
      });

      // Create payments
      if (payments && payments.length > 0) {
        await tx.payment.createMany({
          data: payments.map((payment: any) => ({
            saleId: newSale.id,
            amount: payment.amount,
            method: payment.method,
            status: 'PAID',
            reference: payment.reference,
            notes: payment.notes
          }))
        });
      }

      // Update inventory
      for (const item of saleItems) {
        if (item.productId) {
          const inventoryItem = await tx.inventoryItem.findFirst({
            where: {
              productId: item.productId,
              variantId: item.variantId
            }
          });

          if (inventoryItem) {
            await tx.inventoryItem.update({
              where: { id: inventoryItem.id },
              data: {
                quantity: {
                  decrement: item.quantity
                }
              }
            });

            // Create inventory movement
            await tx.inventoryMovement.create({
              data: {
                inventoryId: inventoryItem.id,
                type: 'OUT',
                quantity: -item.quantity,
                reason: 'Sale',
                referenceId: newSale.id,
                userId
              }
            });
          }
        }
      }

      return newSale;
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('sale-created', { sale });

    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: { sale }
    });
  } catch (error) {
    next(error);
  }
});

// Update sale status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;

    const sale = await prisma.sale.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        customer: true,
        user: {
          select: { id: true, firstName: true, lastName: true }
        },
        items: {
          include: {
            product: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Sale status updated successfully',
      data: { sale }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
