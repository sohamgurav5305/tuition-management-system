import multer from 'multer';

const storage = multer.memoryStorage();

export const uploadSingle = (fieldName: string = 'file') => {
  return multer({
    storage,
    limits: {
      fileSize: 25 * 1024 * 1024, // 25 MB limit
    },
  }).single(fieldName);
};

export const uploadMultiple = (fieldName: string = 'files', maxCount: number = 10) => {
  return multer({
    storage,
    limits: {
      fileSize: 25 * 1024 * 1024,
    },
  }).array(fieldName, maxCount);
};

export const uploadAny = () => {
  return multer({
    storage,
    limits: {
      fileSize: 25 * 1024 * 1024,
    },
  }).any();
};
