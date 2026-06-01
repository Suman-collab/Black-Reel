import { v2 as cloudinary } from 'cloudinary';
import { config } from './index.js';

const cloudName = config.cloudinary.cloudName;
const apiKey = config.cloudinary.apiKey;
const apiSecret = config.cloudinary.apiSecret;

const configured = Boolean(cloudName && apiKey && apiSecret);

if (configured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export const isCloudinaryConfigured = configured;
export default cloudinary;
