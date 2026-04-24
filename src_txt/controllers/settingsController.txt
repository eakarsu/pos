import { Request, Response } from 'express';
import { settingsService } from '../services/settingsService';
import { AppError } from '../middleware/errorHandler';

export const settingsController = {
  async getAllSettings(req: Request, res: Response) {
    try {
      const settings = await settingsService.getAllSettings();
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      throw new AppError('Failed to fetch settings', 500);
    }
  },

  async getSettingsByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params;
      const settings = await settingsService.getSettingsByCategory(category);
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      throw new AppError('Failed to fetch settings by category', 500);
    }
  },

  async getSettingByKey(req: Request, res: Response) {
    try {
      const { key } = req.params;
      const setting = await settingsService.getSettingByKey(key);
      
      if (!setting) {
        throw new AppError('Setting not found', 404);
      }
      
      res.json({
        success: true,
        data: setting
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch setting', 500);
    }
  },

  async updateSettingsByCategory(req: Request, res: Response) {
    try {
      const { category } = req.params;
      const settingsData = req.body;
      
      const updatedSettings = await settingsService.updateSettingsByCategory(category, settingsData);
      
      res.json({
        success: true,
        data: updatedSettings,
        message: `${category} settings updated successfully`
      });
    } catch (error) {
      throw new AppError('Failed to update settings', 500);
    }
  },

  async updateSettingByKey(req: Request, res: Response) {
    try {
      const { key } = req.params;
      const { value, type = 'string' } = req.body;
      
      const updatedSetting = await settingsService.updateSettingByKey(key, value, type);
      
      res.json({
        success: true,
        data: updatedSetting,
        message: 'Setting updated successfully'
      });
    } catch (error) {
      throw new AppError('Failed to update setting', 500);
    }
  },

  async createSetting(req: Request, res: Response) {
    try {
      const { key, value, type = 'string', category } = req.body;
      
      if (!key || value === undefined) {
        throw new AppError('Key and value are required', 400);
      }
      
      const newSetting = await settingsService.createSetting(key, value, type, category);
      
      res.status(201).json({
        success: true,
        data: newSetting,
        message: 'Setting created successfully'
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create setting', 500);
    }
  },

  async deleteSetting(req: Request, res: Response) {
    try {
      const { key } = req.params;
      
      await settingsService.deleteSetting(key);
      
      res.json({
        success: true,
        message: 'Setting deleted successfully'
      });
    } catch (error) {
      throw new AppError('Failed to delete setting', 500);
    }
  }
};
