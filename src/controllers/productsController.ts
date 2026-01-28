import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const productsController = {
  async createProduct(req: Request, res: Response) {
    try {
      const { 
        name, 
        description, 
        price, 
        cost, 
        sku, 
        barcode, 
        categoryId, 
        stockQuantity = 0,
        minStockLevel = 0,
        isActive = true 
      } = req.body;

      // Validate required fields
      if (!name || !price) {
        throw new AppError('Name and price are required', 400);
      }

      // Validate price is a positive number
      if (isNaN(price) || price < 0) {
        throw new AppError('Price must be a positive number', 400);
      }

      // Check if SKU already exists
      if (sku) {
        const existingSku = await prisma.product.findUnique({
          where: { sku }
        });
        if (existingSku) {
          throw new AppError('SKU already exists', 400);
        }
      }

      const product = await prisma.product.create({
         {
          name: name.trim(),
          description: description?.trim() || null,
          price: parseFloat(price),
          cost: cost ? parseFloat(cost) : null,
          sku: sku?.trim() || null,
          barcode: barcode?.trim() || null,
          categoryId: categoryId || null,
          stockQuantity: parseInt(stockQuantity) || 0,
          minStockLevel: parseInt(minStockLevel) || 0,
          isActive: Boolean(isActive)
        },
        include: {
          category: true
        }
      });

      res.status(201).json({
        success: true,
         product,
        message: 'Product created successfully'
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create product', 500);
    }
  },

  async getAllProducts(req: Request, res: Response) {
    try {
      const products = await prisma.product.findMany({
        include: {
          category: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json({
        success: true,
         products
      });
    } catch (error) {
      throw new AppError('Failed to fetch products', 500);
    }
  },

  async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          category: true
        }
      });

      if (!product) {
        throw new AppError('Product not found', 404);
      }

      res.json({
        success: true,
         product
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch product', 500);
    }
  },

  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate price if provided
      if (updateData.price && (isNaN(updateData.price) || updateData.price < 0)) {
        throw new AppError('Price must be a positive number', 400);
      }

      // Check if SKU already exists (excluding current product)
      if (updateData.sku) {
        const existingSku = await prisma.product.findFirst({
          where: { 
            sku: updateData.sku,
            NOT: { id }
          }
        });
        if (existingSku) {
          throw new AppError('SKU already exists', 400);
        }
      }

      const product = await prisma.product.update({
        where: { id },
         {
          ...updateData,
          price: updateData.price ? parseFloat(updateData.price) : undefined,
          cost: updateData.cost ? parseFloat(updateData.cost) : undefined,
          stockQuantity: updateData.stockQuantity ? parseInt(updateData.stockQuantity) : undefined,
          minStockLevel: updateData.minStockLevel ? parseInt(updateData.minStockLevel) : undefined
        },
        include: {
          category: true
        }
      });

      res.json({
        success: true,
         product,
        message: 'Product updated successfully'
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update product', 500);
    }
  },

  async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.product.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      throw new AppError('Failed to delete product', 500);
    }
  }
};

