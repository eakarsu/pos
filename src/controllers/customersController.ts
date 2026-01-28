import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const customersController = {
  async createCustomer(req: Request, res: Response) {
    try {
      const { 
        firstName, 
        lastName, 
        email, 
        phone, 
        address,
        city,
        state,
        zipCode,
        dateOfBirth,
        isActive = true 
      } = req.body;

      // Validate required fields
      if (!firstName || !lastName) {
        throw new AppError('First name and last name are required', 400);
      }

      // Validate email format if provided
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AppError('Invalid email format', 400);
      }

      // Check if email already exists
      if (email) {
        const existingEmail = await prisma.customer.findUnique({
          where: { email }
        });
        if (existingEmail) {
          throw new AppError('Email already exists', 400);
        }
      }

      const customer = await prisma.customer.create({
         {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email?.trim().toLowerCase() || null,
          phone: phone?.trim() || null,
          address: address?.trim() || null,
          city: city?.trim() || null,
          state: state?.trim() || null,
          zipCode: zipCode?.trim() || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          isActive: Boolean(isActive)
        }
      });

      res.status(201).json({
        success: true,
         customer,
        message: 'Customer created successfully'
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create customer', 500);
    }
  },

  async getAllCustomers(req: Request, res: Response) {
    try {
      const customers = await prisma.customer.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.json({
        success: true,
         customers
      });
    } catch (error) {
      throw new AppError('Failed to fetch customers', 500);
    }
  },

  async getCustomerById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          orders: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 10
          }
        }
      });

      if (!customer) {
        throw new AppError('Customer not found', 404);
      }

      res.json({
        success: true,
         customer
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch customer', 500);
    }
  },

  async updateCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate email format if provided
      if (updateData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateData.email)) {
        throw new AppError('Invalid email format', 400);
      }

      // Check if email already exists (excluding current customer)
      if (updateData.email) {
        const existingEmail = await prisma.customer.findFirst({
          where: { 
            email: updateData.email,
            NOT: { id }
          }
        });
        if (existingEmail) {
          throw new AppError('Email already exists', 400);
        }
      }

      const customer = await prisma.customer.update({
        where: { id },
         {
          ...updateData,
          email: updateData.email?.toLowerCase(),
          dateOfBirth: updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : undefined
        }
      });

      res.json({
        success: true,
         customer,
        message: 'Customer updated successfully'
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update customer', 500);
    }
  },

  async deleteCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.customer.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Customer deleted successfully'
      });
    } catch (error) {
      throw new AppError('Failed to delete customer', 500);
    }
  },

  async exportCustomers(req: Request, res: Response) {
    try {
      const { format = 'csv' } = req.query;
      
      const customers = await prisma.customer.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          createdAt: true,
          isActive: true
        }
      });

      if (format === 'csv') {
        const csvHeaders = 'ID,First Name,Last Name,Email,Phone,Address,City,State,Zip Code,Created At,Active\n';
        const csvData = customers.map(customer => 
          `${customer.id},"${customer.firstName}","${customer.lastName}","${customer.email || ''}","${customer.phone || ''}","${customer.address || ''}","${customer.city || ''}","${customer.state || ''}","${customer.zipCode || ''}","${customer.createdAt.toISOString()}","${customer.isActive}"`
        ).join('\n');

        const csvContent = csvHeaders + csvData;
        const filename = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvContent);
      } else {
        const filename = `customers_export_${new Date().toISOString().split('T')[0]}.json`;
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.json({
          exportDate: new Date().toISOString(),
          totalRecords: customers.length,
           customers
        });
      }
    } catch (error) {
      throw new AppError('Failed to export customers', 500);
    }
  }
};

