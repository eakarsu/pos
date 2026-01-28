import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const inventoryController = {
  async createAdjustment(req: Request, res: Response) {
    try {
      const { 
        productId, 
        adjustmentType, 
        quantity, 
        reason, 
        notes 
      } = req.body;

      // Validate required fields
      if (!productId || !adjustmentType || !quantity) {
        throw new AppError('Product ID, adjustment type, and quantity are required', 400);
      }

      // Validate adjustment type
      const validTypes = ['IN', 'OUT', 'ADJUSTMENT'];
      if (!validTypes.includes(adjustmentType)) {
        throw new AppError('Invalid adjustment type. Must be IN, OUT, or ADJUSTMENT', 400);
      }

      // Validate quantity
      const adjustmentQuantity = parseInt(quantity);
      if (isNaN(adjustmentQuantity) || adjustmentQuantity <= 0) {
        throw new AppError('Quantity must be a positive number', 400);
      }

      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new AppError('Product not found', 404);
      }

      // Calculate new stock quantity
      let newStockQuantity = product.stockQuantity;
      if (adjustmentType === 'IN') {
        newStockQuantity += adjustmentQuantity;
      } else if (adjustmentType === 'OUT') {
        newStockQuantity -= adjustmentQuantity;
        if (newStockQuantity < 0) {
          throw new AppError('Insufficient stock for this adjustment', 400);
        }
      } else if (adjustmentType === 'ADJUSTMENT') {
        newStockQuantity = adjustmentQuantity;
      }

      // Create adjustment record and update product stock in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create inventory adjustment record
        const adjustment = await tx.inventoryAdjustment.create({
           {
            productId,
            adjustmentType,
            quantity: adjustmentQuantity,
            previousQuantity: product.stockQuantity,
            newQuantity: newStockQuantity,
            reason: reason?.trim() || null,
            notes: notes?.trim() || null
          },
          include: {
            product: true
          }
        });

        // Update product stock quantity
        await tx.product.update({
          where: { id: productId },
           { stockQuantity: newStockQuantity }
        });

        return adjustment;
      });

      res.status(201).json({
        success: true,
         result,
        message: 'Inventory adjustment created successfully'
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create inventory adjustment', 500);
    }
  },

  async getAllAdjustments(req: Request, res: Response) {
    try {
      const adjustments = await prisma.inventoryAdjustment.findMany({
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json({
        success: true,
         adjustments
      });
    } catch (error) {
      throw new AppError('Failed to fetch inventory adjustments', 500);
    }
  },

  async getAdjustmentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const adjustment = await prisma.inventoryAdjustment.findUnique({
        where: { id },
        include: {
          product: true
        }
      });

      if (!adjustment) {
        throw new AppError('Inventory adjustment not found', 404);
      }

      res.json({
        success: true,
         adjustment
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch inventory adjustment', 500);
    }
  },

  async getInventoryReport(req: Request, res: Response) {
    try {
      const products = await prisma.product.findMany({
        select: {
          id: true,
          name: true,
          sku: true,
          stockQuantity: true,
          minStockLevel: true,
          price: true,
          cost: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      // Add low stock indicators
      const inventoryReport = products.map(product => ({
        ...product,
        isLowStock: product.stockQuantity <= product.minStockLevel,
        stockValue: product.stockQuantity * (product.cost || 0)
      }));

      res.json({
        success: true,
         inventoryReport,
        summary: {
          totalProducts: products.length,
          lowStockItems: inventoryReport.filter(p => p.isLowStock).length,
          totalStockValue: inventoryReport.reduce((sum, p) => sum + p.stockValue, 0)
        }
      });
    } catch (error) {
      throw new AppError('Failed to generate inventory report', 500);
    }
  }
};

