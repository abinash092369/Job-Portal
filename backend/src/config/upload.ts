import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';
import { BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';

const UPLOADS_LIMIT = 5 * 1024 * 1024; // 5MB

// Configure Cloudinary if credentials are provided
const hasCloudinary = 
  !!env.CLOUDINARY_CLOUD_NAME && 
  !!env.CLOUDINARY_API_KEY && 
  !!env.CLOUDINARY_API_SECRET;

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  logger.info('☁️ Cloudinary storage configured successfully');
} else {
  logger.warn('⚠️ Cloudinary credentials missing. Falling back to local disk storage.');
}

// Multer memory storage (keeps file buffer in memory)
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedDocTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  const allowedDocExtensions = ['.pdf', '.doc', '.docx'];

  const allowedImageTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
  ];
  const allowedImageExtensions = ['.png', '.jpg', '.jpeg'];

  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === 'resume') {
    if (allowedDocTypes.includes(file.mimetype) || allowedDocExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new BadRequestError('Only PDF, DOC, and DOCX files are allowed for resumes'), false);
    }
  } else if (file.fieldname === 'logo' || file.fieldname === 'photo') {
    if (allowedImageTypes.includes(file.mimetype) || allowedImageExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new BadRequestError('Only PNG, JPG, and JPEG images are allowed'), false);
    }
  } else {
    cb(new BadRequestError('Unexpected field name for file upload'), false);
  }
};

const multerInstance = multer({
  storage,
  limits: {
    fileSize: UPLOADS_LIMIT,
  },
  fileFilter,
});

export function uploadMiddleware(fieldName: string) {
  const uploadSingle = multerInstance.single(fieldName);

  return (req: Request, res: Response, next: NextFunction): void => {
    uploadSingle(req, res, async (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new BadRequestError(`File is too large. Max limit is 5MB`));
        }
        return next(new BadRequestError(`Upload error: ${err.message}`));
      } else if (err) {
        return next(err);
      }

      if (!req.file) {
        return next();
      }

      if (hasCloudinary) {
        try {
          // Upload memory buffer directly to Cloudinary
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `job_portal/${fieldName}s`,
              resource_type: fieldName === 'resume' ? 'raw' : 'image',
            },
            (error, result) => {
              if (error) {
                logger.error(`Cloudinary Upload Error: ${error.stack || error.message}`);
                return next(new BadRequestError(`Cloudinary upload failed: ${error.message}`));
              }
              if (result) {
                logger.info(`Uploaded file successfully to Cloudinary: ${result.secure_url}`);
                
                // Override filename with the Cloudinary URL.
                // Since Phase 1 controllers construct `/uploads/resumes/${req.file.filename}`,
                // placing the Cloudinary URL here will result in `/uploads/resumes/https://res.cloudinary.com/...`
                // which our repositories intercept and clean.
                req.file!.filename = result.secure_url;
                req.file!.path = result.secure_url;
              }
              next();
            }
          );
          uploadStream.end(req.file.buffer);
        } catch (uploadErr: any) {
          logger.error(`Failed during upload streaming: ${uploadErr.stack || uploadErr.message}`);
          return next(new BadRequestError(`Cloudinary upload error: ${uploadErr.message}`));
        }
      } else {
        // Fallback local storage: write buffer to uploads directory
        try {
          let folder = 'uploads/';
          if (fieldName === 'resume') {
            folder += 'resumes';
          } else if (fieldName === 'logo') {
            folder += 'logos';
          } else if (fieldName === 'photo') {
            folder += 'photos';
          } else {
            folder += 'others';
          }
          
          fs.mkdirSync(folder, { recursive: true });

          const ext = path.extname(req.file.originalname);
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const localFilename = `${fieldName}-${uniqueSuffix}${ext}`;
          const localPath = path.join(folder, localFilename);

          fs.writeFileSync(localPath, req.file.buffer);

          // Populate the multer metadata fields to match local storage
          req.file.filename = localFilename;
          req.file.path = localPath;

          next();
        } catch (writeErr: any) {
          logger.error(`Local file fallback write failed: ${writeErr.stack || writeErr.message}`);
          return next(new BadRequestError(`Local file write failed: ${writeErr.message}`));
        }
      }
    });
  };
}
