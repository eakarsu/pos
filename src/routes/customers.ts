import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// Get all customers
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          sales: {
            select: {
              id: true,
              totalAmount: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          _count: {
            select: { sales: true }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        customers,
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

// Get customer by ID
router.get('/:id', async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        sales: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        loyaltyTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    res.json({
      success: true,
      data: { customer }
    });
  } catch (error) {
    next(error);
  }
});

// Create customer
router.post('/', async (req, res, next) => {
  try {
    const {
      email,
      phone,
      firstName,
      lastName,
      dateOfBirth,
      address,
      city,
      state,
      zipCode
    } = req.body;

    const customer = await prisma.customer.create({
      data: {
        email,
        phone,
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address,
        city,
        state,
        zipCode
      }
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: { customer }
    });
  } catch (error) {
    next(error);
  }
});

// Update customer
router.put('/:id', async (req, res, next) => {
  try {
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : undefined
      }
    });

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: { customer }
    });
  } catch (error) {
    next(error);
  }
});

// Delete customer
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.customer.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Customer deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Add loyalty points
router.post('/:id/loyalty', async (req, res, next) => {
  try {
    const { points, description, referenceId } = req.body;

    const [customer] = await prisma.$transaction([
      prisma.customer.update({
        where: { id: req.params.id },
        data: {
          loyaltyPoints: {
            increment: points
          }
        }
      }),
      prisma.loyaltyTransaction.create({
        data: {
          customerId: req.params.id,
          points,
          type: points > 0 ? 'EARNED' : 'REDEEMED',
          description,
          referenceId
        }
      })
    ]);

    res.json({
      success: true,
      message: 'Loyalty points updated successfully',
      data: { customer }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
