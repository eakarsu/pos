import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authenticate);

// Get all categories
router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
});

// Get category by ID
router.get('/:id', async (req, res, next) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        products: true
      }
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    res.json({
      success: true,
      data: { category }
    });
  } catch (error) {
    next(error);
  }
});

// Create category
router.post('/', authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const category = await prisma.category.create({
      data: {
        name,
        description
      }
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category }
    });
  } catch (error) {
    next(error);
  }
});

// Update category
router.put('/:id', authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError('Category ID is required', 400);
    }

    const category = await prisma.category.update({
      where: { id },
      data: req.body
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category }
    });
  } catch (error) {
    next(error);
  }
});

// Delete category
router.delete('/:id', authorize('ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError('Category ID is required', 400);
    }

    await prisma.category.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Category deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
