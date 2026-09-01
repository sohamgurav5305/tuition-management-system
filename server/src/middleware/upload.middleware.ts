import multer from 'multer';

const storage = multer.memoryStorage();

export const uploadSingle = (fieldName: string = 'file') => {
  return multer({
    storage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB limit
    },
  }).single(fieldName);
};

export const uploadMultiple = (fieldName: string = 'files', maxCount: number = 5) => {
  return multer({
    storage,
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  }).array(fieldName, maxCount);
};
