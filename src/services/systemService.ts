import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import archiver from 'archiver';
import { createWriteStream, createReadStream } from 'fs';

const prisma = new PrismaClient();
const execAsync = promisify(exec);

export const systemService = {
  async backupDatabase() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(process.cwd(), 'backups');
      const backupFile = path.join(backupDir, `backup-${timestamp}.db`);
      
      // Ensure backup directory exists
      await fs.mkdir(backupDir, { recursive: true });
      
      // Copy the SQLite database file
      const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
      await fs.copyFile(dbPath, backupFile);
      
      // Create a compressed backup
      const zipFile = `${backupFile}.zip`;
      await this.createZipArchive(backupFile, zipFile);
      
      // Remove the uncompressed backup
      await fs.unlink(backupFile);
      
      return {
        success: true,
        filename: path.basename(zipFile),
        path: zipFile,
        size: (await fs.stat(zipFile)).size,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Database backup failed:', error);
      throw new Error('Failed to backup database');
    }
  },

  async exportData(format: 'csv' | 'json' = 'csv') {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportDir = path.join(process.cwd(), 'exports');
      await fs.mkdir(exportDir, { recursive: true });

      if (format === 'json') {
        return await this.exportToJSON(exportDir, timestamp);
      } else {
        return await this.exportToCSV(exportDir, timestamp);
      }
    } catch (error) {
      console.error('Data export failed:', error);
      throw new Error('Failed to export data');
    }
  },

  async exportToJSON(exportDir: string, timestamp: string) {
    const exportFile = path.join(exportDir, `export-${timestamp}.json`);
    
    // Export all major tables
    const data = {
      users: await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          employeeId: true,
          phone: true,
          createdAt: true
        }
      }),
      customers: await prisma.customer.findMany(),
      products: await prisma.product.findMany({
        include: {
          category: true,
          supplier: true
        }
      }),
      sales: await prisma.sale.findMany({
        include: {
          items: true,
          payments: true,
          customer: true
        }
      }),
      inventory: await prisma.inventoryItem.findMany({
        include: {
          product: true
        }
      }),
      categories: await prisma.category.findMany(),
      suppliers: await prisma.supplier.findMany(),
      settings: await prisma.systemSetting.findMany()
    };

    await fs.writeFile(exportFile, JSON.stringify(data, null, 2));
    
    // Create compressed export
    const zipFile = `${exportFile}.zip`;
    await this.createZipArchive(exportFile, zipFile);
    await fs.unlink(exportFile);

    return {
      success: true,
      filename: path.basename(zipFile),
      path: zipFile,
      size: (await fs.stat(zipFile)).size,
      format: 'json',
      timestamp: new Date()
    };
  },

  async exportToCSV(exportDir: string, timestamp: string) {
    const csvDir = path.join(exportDir, `csv-export-${timestamp}`);
    await fs.mkdir(csvDir, { recursive: true });

    // Export each table to separate CSV files
    const tables = [
      { name: 'users', data: await prisma.user.findMany() },
      { name: 'customers', data: await prisma.customer.findMany() },
      { name: 'products', data: await prisma.product.findMany() },
      { name: 'sales', data: await prisma.sale.findMany() },
      { name: 'inventory', data: await prisma.inventoryItem.findMany() },
      { name: 'categories', data: await prisma.category.findMany() },
      { name: 'suppliers', data: await prisma.supplier.findMany() }
    ];

    for (const table of tables) {
      if (table.data.length > 0) {
        const csvContent = this.convertToCSV(table.data);
        await fs.writeFile(path.join(csvDir, `${table.name}.csv`), csvContent);
      }
    }

    // Create compressed export
    const zipFile = path.join(exportDir, `csv-export-${timestamp}.zip`);
    await this.createZipArchive(csvDir, zipFile);
    
    // Clean up temporary directory
    await fs.rmdir(csvDir, { recursive: true });

    return {
      success: true,
      filename: path.basename(zipFile),
      path: zipFile,
      size: (await fs.stat(zipFile)).size,
      format: 'csv',
      timestamp: new Date()
    };
  },

  async getSystemLogs(lines: number = 1000) {
    try {
      const logDir = path.join(process.cwd(), 'logs');
      const logFiles = await fs.readdir(logDir).catch(() => []);
      
      if (logFiles.length === 0) {
        return {
          success: true,
          logs: 'No log files found',
          timestamp: new Date()
        };
      }

      // Get the most recent log file
      const latestLogFile = logFiles
        .filter(file => file.endsWith('.log'))
        .sort()
        .reverse()[0];

      if (!latestLogFile) {
        return {
          success: true,
          logs: 'No log files found',
          timestamp: new Date()
        };
      }

      const logPath = path.join(logDir, latestLogFile);
      const logContent = await fs.readFile(logPath, 'utf-8');
      
      // Get last N lines
      const logLines = logContent.split('\n').slice(-lines).join('\n');

      return {
        success: true,
        logs: logLines,
        filename: latestLogFile,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to read system logs:', error);
      
      // Fallback to console logs or process info
      return {
        success: true,
        logs: `System uptime: ${process.uptime()} seconds\nMemory usage: ${JSON.stringify(process.memoryUsage(), null, 2)}\nNode version: ${process.version}\nPlatform: ${process.platform}`,
        timestamp: new Date()
      };
    }
  },

  async clearCache() {
    try {
      const results = [];
      
      // Clear temp directory
      const tempDir = path.join(process.cwd(), 'temp');
      try {
        await fs.rmdir(tempDir, { recursive: true });
        await fs.mkdir(tempDir, { recursive: true });
        results.push('Cleared temp directory');
      } catch (error) {
        results.push('Temp directory not found or already clean');
      }

      // Clear uploads temp files (keep uploads but clear temp processing files)
      const uploadsTemp = path.join(process.cwd(), 'uploads', 'temp');
      try {
        await fs.rmdir(uploadsTemp, { recursive: true });
        await fs.mkdir(uploadsTemp, { recursive: true });
        results.push('Cleared uploads temp directory');
      } catch (error) {
        results.push('Uploads temp directory not found or already clean');
      }

      // Clear old log files (keep last 10)
      const logDir = path.join(process.cwd(), 'logs');
      try {
        const logFiles = await fs.readdir(logDir);
        const logFilesSorted = logFiles
          .filter(file => file.endsWith('.log'))
          .sort()
          .reverse();
        
        if (logFilesSorted.length > 10) {
          const filesToDelete = logFilesSorted.slice(10);
          for (const file of filesToDelete) {
            await fs.unlink(path.join(logDir, file));
          }
          results.push(`Deleted ${filesToDelete.length} old log files`);
        } else {
          results.push('No old log files to clean');
        }
      } catch (error) {
        results.push('Log directory not found or already clean');
      }

      // Clear old backups (keep last 5)
      const backupDir = path.join(process.cwd(), 'backups');
      try {
        const backupFiles = await fs.readdir(backupDir);
        const backupFilesSorted = backupFiles
          .filter(file => file.endsWith('.zip'))
          .sort()
          .reverse();
        
        if (backupFilesSorted.length > 5) {
          const filesToDelete = backupFilesSorted.slice(5);
          for (const file of filesToDelete) {
            await fs.unlink(path.join(backupDir, file));
          }
          results.push(`Deleted ${filesToDelete.length} old backup files`);
        } else {
          results.push('No old backup files to clean');
        }
      } catch (error) {
        results.push('Backup directory not found or already clean');
      }

      // Clear old exports (keep last 3)
      const exportDir = path.join(process.cwd(), 'exports');
      try {
        const exportFiles = await fs.readdir(exportDir);
        const exportFilesSorted = exportFiles
          .filter(file => file.endsWith('.zip'))
          .sort()
          .reverse();
        
        if (exportFilesSorted.length > 3) {
          const filesToDelete = exportFilesSorted.slice(3);
          for (const file of filesToDelete) {
            await fs.unlink(path.join(exportDir, file));
          }
          results.push(`Deleted ${filesToDelete.length} old export files`);
        } else {
          results.push('No old export files to clean');
        }
      } catch (error) {
        results.push('Export directory not found or already clean');
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        results.push('Forced garbage collection');
      }

      return {
        success: true,
        results,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Cache clearing failed:', error);
      throw new Error('Failed to clear cache');
    }
  },

  convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  },

  async createZipArchive(sourcePath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', (err) => reject(err));

      archive.pipe(output);
      
      const stats = require('fs').statSync(sourcePath);
      if (stats.isDirectory()) {
        archive.directory(sourcePath, false);
      } else {
        archive.file(sourcePath, { name: path.basename(sourcePath) });
      }
      
      archive.finalize();
    });
  }
};
