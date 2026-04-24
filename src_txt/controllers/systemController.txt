import { Request, Response } from 'express';
import { systemService } from '../services/systemService';
import { AppError } from '../middleware/errorHandler';
import path from 'path';

export const systemController = {
  async backupDatabase(req: Request, res: Response) {
    try {
      const result = await systemService.backupDatabase();
      
      res.json({
        success: true,
        data: result,
        message: 'Database backup created successfully'
      });
    } catch (error) {
      throw new AppError('Failed to backup database', 500);
    }
  },

  async downloadBackup(req: Request, res: Response) {
    try {
      const { filename } = req.params;
      const backupPath = path.join(process.cwd(), 'backups', filename);
      
      res.download(backupPath, filename, (err) => {
        if (err) {
          throw new AppError('Backup file not found', 404);
        }
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to download backup', 500);
    }
  },

  async exportData(req: Request, res: Response) {
    try {
      const { format = 'csv' } = req.query;
      const result = await systemService.exportData(format as 'csv' | 'json');
      
      res.json({
        success: true,
        data: result,
        message: 'Data export created successfully'
      });
    } catch (error) {
      throw new AppError('Failed to export data', 500);
    }
  },

  async downloadExport(req: Request, res: Response) {
    try {
      const { filename } = req.params;
      const exportPath = path.join(process.cwd(), 'exports', filename);
      
      res.download(exportPath, filename, (err) => {
        if (err) {
          throw new AppError('Export file not found', 404);
        }
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to download export', 500);
    }
  },

  async getSystemLogs(req: Request, res: Response) {
    try {
      const { lines = 1000 } = req.query;
      const result = await systemService.getSystemLogs(Number(lines));
      
      res.json({
        success: true,
        data: result,
        message: 'System logs retrieved successfully'
      });
    } catch (error) {
      throw new AppError('Failed to retrieve system logs', 500);
    }
  },

  async clearCache(req: Request, res: Response) {
    try {
      const result = await systemService.clearCache();
      
      res.json({
        success: true,
        data: result,
        message: 'Cache cleared successfully'
      });
    } catch (error) {
      throw new AppError('Failed to clear cache', 500);
    }
  },

  async getSystemInfo(req: Request, res: Response) {
    try {
      const systemInfo = {
        version: process.env.npm_package_version || '1.0.0',
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        environment: process.env.NODE_ENV || 'development',
        database: 'SQLite',
        timestamp: new Date()
      };

      res.json({
        success: true,
        data: systemInfo
      });
    } catch (error) {
      throw new AppError('Failed to get system info', 500);
    }
  }
};
