import { Request, Response } from 'express';
import { settingService } from '../services/setting.service';
import { sendSuccess, sendError } from '../utils/response.util';

export class SettingController {
  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await settingService.getSettings();
      sendSuccess(res, settings, 'Settings fetched successfully');
    } catch (error: any) {
      sendError(res, error.message, 500, error);
    }
  }

  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await settingService.updateSettings(req.body);
      sendSuccess(res, settings, 'Settings updated successfully');
    } catch (error: any) {
      sendError(res, error.message, 400, error);
    }
  }

  async exportBackup(req: Request, res: Response): Promise<void> {
    try {
      const backup = await settingService.getBackupData();
      const filename = `tuition-system-backup-${new Date().toISOString().split('T')[0]}.json`;

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(JSON.stringify(backup, null, 2));
    } catch (error: any) {
      sendError(res, error.message, 500, error);
    }
  }

  async resetDemoData(req: Request, res: Response): Promise<void> {
    try {
      const result = await settingService.resetDemoData();
      sendSuccess(res, result, 'Demo data reset successfully');
    } catch (error: any) {
      sendError(res, error.message, 500, error);
    }
  }
}

export const settingController = new SettingController();
