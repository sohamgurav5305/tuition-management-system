import { settingRepository } from '../repositories/setting.repository';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execPromise = util.promisify(exec);

export class SettingService {
  async getSettings(): Promise<Record<string, string>> {
    const settings = await settingRepository.getAll();
    return {
      instituteName: settings.instituteName || 'Apex Academy Tuition & Coaching Institute',
      currencySymbol: settings.currencySymbol || '$',
      currencyCode: settings.currencyCode || 'USD',
      contactPhone: settings.contactPhone || '+1 (555) 234-5678',
      contactEmail: settings.contactEmail || 'contact@apexacademy.edu',
      address: settings.address || '742 Evergreen Terrace, Academic District, Suite 100',
      academicYear: settings.academicYear || '2026-2027',
      website: settings.website || 'https://apexacademy.edu',
      ...settings,
    };
  }

  async updateSettings(newSettings: Record<string, string>): Promise<Record<string, string>> {
    await settingRepository.updateMany(newSettings);
    return this.getSettings();
  }

  async getBackupData() {
    return settingRepository.exportFullBackup();
  }

  async resetDemoData() {
    // Executes seed script programmatically
    const seedScript = path.resolve(__dirname, '../../prisma/seed.ts');
    try {
      // In development / local runtime
      await execPromise(`npx ts-node "${seedScript}"`, {
        cwd: path.resolve(__dirname, '../../'),
      });
      return { success: true, message: 'Demo data has been successfully reset to default initial state.' };
    } catch (err: any) {
      console.error('Reset demo data failed:', err);
      throw new Error(`Failed to reset demo data: ${err.message}`);
    }
  }
}

export const settingService = new SettingService();
