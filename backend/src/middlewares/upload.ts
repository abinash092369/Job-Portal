import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { isCloudinaryConfigured, cloudinary } from '../config/cloudinary';
import { config } from '../config';

// Ensure local uploads folder exists as local fallback
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

export const ensureAbsoluteUrl = (fileUrlOrPath: string): string => {
  if (!fileUrlOrPath) return '';
  if (fileUrlOrPath.startsWith('http://') || fileUrlOrPath.startsWith('https://')) {
    return fileUrlOrPath;
  }
  const filename = path.basename(fileUrlOrPath);
  return `${config.backendPublicUrl}/uploads/${filename}`;
};

export const processUploadedFile = async (
  file: Express.Multer.File,
  folder = 'uploads'
): Promise<string> => {
  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder,
        resource_type: 'auto',
      });
      // Remove temporary file from local disk after upload
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error, falling back to local storage:', error);
    }
  }

  // Fallback to local disk file URL safely
  return ensureAbsoluteUrl(file.path);
};
