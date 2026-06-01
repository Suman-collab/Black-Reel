import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import streamifier from 'streamifier';
import AppError from '../utils/AppError.js';

// ── Folder constants ───────────────────────────────────
const FOLDERS = {
  thumbnails: 'ott/thumbnails',
  heroes: 'ott/heroes',
  trailers: 'ott/trailers',
  videos: 'ott/videos',
};

// ── Resolution widths for multi-quality streaming ──────
const QUALITY_WIDTHS = {
  p240: 426,
  p360: 640,
  p480: 854,
  p720: 1280,
  p1080: 1920,
  p2160: 3840,
};

/**
 * Upload a buffer to Cloudinary via stream.
 */
const uploadFromBuffer = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Upload an image file (thumbnail or hero banner).
 * @param {Buffer} fileBuffer - The file buffer from multer
 * @param {'thumbnails'|'heroes'} folder - Target folder key
 * @returns {{ url: string, publicId: string }}
 */
export const uploadImage = async (fileBuffer, folder = 'thumbnails') => {
  if (!isCloudinaryConfigured) {
    throw new AppError('Cloudinary is not configured. Please add credentials to .env', 503);
  }

  const result = await uploadFromBuffer(fileBuffer, {
    folder: FOLDERS[folder] || FOLDERS.thumbnails,
    resource_type: 'image',
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

/**
 * Upload a video file (trailer or full video).
 * @param {Buffer} fileBuffer - The file buffer from multer
 * @param {'trailers'|'videos'} folder - Target folder key
 * @returns {{ url: string, publicId: string, duration: number }}
 */
export const uploadVideo = async (fileBuffer, folder = 'videos') => {
  if (!isCloudinaryConfigured) {
    throw new AppError('Cloudinary is not configured. Please add credentials to .env', 503);
  }

  const result = await uploadFromBuffer(fileBuffer, {
    folder: FOLDERS[folder] || FOLDERS.videos,
    resource_type: 'video',
    chunk_size: 6_000_000, // 6MB chunks for large files
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    duration: result.duration || 0,
  };
};

/**
 * Upload a large video via direct URL or file path.
 * For videos > 100MB, use this instead of buffer upload.
 * @param {string} filePath - Local file path
 * @param {'trailers'|'videos'} folder - Target folder key
 * @returns {{ url: string, publicId: string, duration: number }}
 */
export const uploadLargeVideo = async (filePath, folder = 'videos') => {
  if (!isCloudinaryConfigured) {
    throw new AppError('Cloudinary is not configured. Please add credentials to .env', 503);
  }

  const result = await cloudinary.uploader.upload_large(filePath, {
    folder: FOLDERS[folder] || FOLDERS.videos,
    resource_type: 'video',
    chunk_size: 20_000_000, // 20MB chunks
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    duration: result.duration || 0,
  };
};

/**
 * Delete an asset from Cloudinary.
 * @param {string} publicId - The public ID to delete
 * @param {'image'|'video'} resourceType
 */
export const deleteAsset = async (publicId, resourceType = 'image') => {
  if (!isCloudinaryConfigured || !publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.warn(`[cloudinary] Failed to delete ${resourceType} ${publicId}:`, error.message);
  }
};

/**
 * Delete all Cloudinary assets associated with a content document.
 * @param {object} content - The content document
 */
export const deleteContentAssets = async (content) => {
  const deletions = [];

  if (content.thumbnailPublicId) {
    deletions.push(deleteAsset(content.thumbnailPublicId, 'image'));
  }
  if (content.heroImagePublicId) {
    deletions.push(deleteAsset(content.heroImagePublicId, 'image'));
  }
  if (content.trailerPublicId) {
    deletions.push(deleteAsset(content.trailerPublicId, 'video'));
  }
  if (content.videoPublicId) {
    deletions.push(deleteAsset(content.videoPublicId, 'video'));
  }

  await Promise.allSettled(deletions);
};

/**
 * Generate multi-resolution streaming URLs from a Cloudinary video public ID.
 * Uses Cloudinary's on-the-fly video transformations.
 * @param {string} publicId - The video's Cloudinary public ID
 * @returns {object} videoQualities - { p240, p360, p480, p720, p1080, p2160 }
 */
export const generateVideoQualities = (publicId) => {
  if (!publicId || !isCloudinaryConfigured) {
    return { p240: '', p360: '', p480: '', p720: '', p1080: '', p2160: '' };
  }

  const qualities = {};

  for (const [key, width] of Object.entries(QUALITY_WIDTHS)) {
    qualities[key] = cloudinary.url(publicId, {
      resource_type: 'video',
      secure: true,
      transformation: [
        { width, crop: 'scale' },
        { quality: 'auto' },
      ],
    });
  }

  return qualities;
};
