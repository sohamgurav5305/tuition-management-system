import { StorageProvider } from './StorageProvider.interface';
import { LocalStorageProvider } from './LocalStorageProvider';
import { S3StorageProvider } from './S3StorageProvider';

let storageInstance: StorageProvider;

export function getStorageProvider(): StorageProvider {
  if (!storageInstance) {
    const driver = (process.env.STORAGE_DRIVER || 'local').toLowerCase();
    if (driver === 's3') {
      storageInstance = new S3StorageProvider();
    } else {
      storageInstance = new LocalStorageProvider();
    }
  }
  return storageInstance;
}

export const storage = getStorageProvider();
export * from './StorageProvider.interface';
