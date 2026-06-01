import multer from 'multer';
import AppError from '../utils/AppError.js';

// ── File size limits ───────────────────────────────────
const IMAGE_MAX_SIZE = 10 * 1024 * 1024;       // 10MB
const TRAILER_MAX_SIZE = 200 * 1024 * 1024;     // 200MB
const VIDEO_MAX_SIZE = 5 * 1024 * 1024 * 1024;  // 5GB

// ── Allowed MIME types ─────────────────────────────────
const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_MIMES = ['video/mp4', 'video/quicktime', 'video/webm'];

/**
 * Custom file filter factory.
 */
const createFileFilter = (allowedMimes, fieldLabel) => {
  return (_req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          `Invalid file type for ${fieldLabel}. Allowed: ${allowedMimes.join(', ')}`,
          400
        ),
        false
      );
    }
  };
};

/**
 * Memory storage for images and small files.
 */
const memoryStorage = multer.memoryStorage();

/**
 * Multer instance for content uploads.
 * Accepts multiple fields: thumbnail, heroBanner, trailer, video
 */
const contentUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: VIDEO_MAX_SIZE, // Use largest limit; per-field validation below
  },
  fileFilter: (_req, file, cb) => {
    const imageFields = ['thumbnail', 'heroBanner'];
    const videoFields = ['trailer', 'video'];

    if (imageFields.includes(file.fieldname)) {
      if (!IMAGE_MIMES.includes(file.mimetype)) {
        return cb(
          new AppError(
            `Invalid file type for ${file.fieldname}. Allowed: JPG, PNG, WEBP`,
            400
          ),
          false
        );
      }
    } else if (videoFields.includes(file.fieldname)) {
      if (!VIDEO_MIMES.includes(file.mimetype)) {
        return cb(
          new AppError(
            `Invalid file type for ${file.fieldname}. Allowed: MP4, MOV, WEBM`,
            400
          ),
          false
        );
      }
    }

    cb(null, true);
  },
});

/**
 * Middleware that handles multipart form upload for content creation/update.
 * Fields:
 *  - thumbnail  (1 image, max 10MB)
 *  - heroBanner (1 image, max 10MB)
 *  - trailer    (1 video, max 200MB)
 *  - video      (1 video, max 5GB)
 */
export const uploadContentFiles = contentUpload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'heroBanner', maxCount: 1 },
  { name: 'trailer', maxCount: 1 },
  { name: 'video', maxCount: 1 },
]);

/**
 * Post-upload validation middleware.
 * Checks individual file sizes after multer processes them.
 */
export const validateUploadSizes = (req, _res, next) => {
  if (!req.files) return next();

  const checks = [
    { field: 'thumbnail', max: IMAGE_MAX_SIZE, label: 'Thumbnail' },
    { field: 'heroBanner', max: IMAGE_MAX_SIZE, label: 'Hero Banner' },
    { field: 'trailer', max: TRAILER_MAX_SIZE, label: 'Trailer' },
    { field: 'video', max: VIDEO_MAX_SIZE, label: 'Full Video' },
  ];

  for (const { field, max, label } of checks) {
    const files = req.files[field];
    if (files && files[0] && files[0].size > max) {
      const maxMB = Math.round(max / (1024 * 1024));
      return next(
        new AppError(`${label} exceeds the maximum file size of ${maxMB}MB`, 400)
      );
    }
  }

  next();
};

/**
 * Multer error handler middleware.
 * Converts multer errors into AppError instances.
 */
export const handleMulterError = (err, _req, _res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File is too large. Please check the size limits.', 400));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new AppError(`Unexpected file field: ${err.field}`, 400));
    }
    return next(new AppError(err.message, 400));
  }

  next(err);
};
