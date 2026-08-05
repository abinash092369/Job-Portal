import { v2 as cloudinary } from 'cloudinary';
import { config } from './index';

let isCloudinaryConfigured = false;

if (
  config.cloudinary.cloudName &&
  config.cloudinary.apiKey &&
  config.cloudinary.apiSecret
) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
  isCloudinaryConfigured = true;
}

export { cloudinary, isCloudinaryConfigured };
