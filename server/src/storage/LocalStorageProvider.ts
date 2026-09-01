import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { StorageProvider, UploadedFile } from './StorageProvider.interface';

export class LocalStorageProvider implements StorageProvider {
  private baseUploadDir: string;

  constructor() {
    this.baseUploadDir = path.resolve(process.cwd(), process.env.UPLOAD_PATH || 'uploads');
    if (!fs.existsSync(this.baseUploadDir)) {
      fs.mkdirSync(this.baseUploadDir, { recursive: true });
    }
  }

  async upload(file: UploadedFile, folder: string = 'general'): Promise<string> {
    const targetDir = path.join(this.baseUploadDir, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const fileExt = path.extname(file.originalname) || '.jpg';
    const fileName = `${uuidv4()}${fileExt}`;
    const targetPath = path.join(targetDir, fileName);

    if (file.buffer) {
      await fs.promises.writeFile(targetPath, file.buffer);
    } else if (file.path) {
      await fs.promises.copyFile(file.path, targetPath);
      // Clean up temporary multer disk file if needed
      try {
        await fs.promises.unlink(file.path);
      } catch {
        // ignore
      }
    } else {
      throw new Error('File data buffer or path missing');
    }

    // Return normalized relative storage path (e.g., "profile-images/abc.jpg")
    return `${folder}/${fileName}`.replace(/\\/g, '/');
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.baseUploadDir, filePath);
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  }

  getUrl(filePath: string): string {
    if (!filePath) return '';
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      return filePath;
    }
    // Normalizes to /uploads/profile-images/xyz.jpg
    const cleanedPath = filePath.replace(/^\/+/, '');
    return `/uploads/${cleanedPath}`;
  }
}
