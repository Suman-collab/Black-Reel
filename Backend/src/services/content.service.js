import Content from '../models/content.model.js';
import AppError from '../utils/AppError.js';
import { z } from 'zod';
import crypto from 'crypto';
import { validate, toBoolean } from '../utils/validate.js';
import { resolveDemoVideoUrl } from '../utils/demoVideo.js';
import { escapeRegex, normalizeSearchTerm } from '../utils/search.js';
import * as cloudinaryService from './cloudinary.service.js';

const PARENTAL_RESTRICTED_GENRES = new Set(['action', 'thriller', 'mystery', 'horror', 'originals']);
const PARENTAL_RESTRICTED_TAGS = new Set(['mature', 'explicit', '18+', 'violence']);

const contentCreateSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['Movie', 'Series']).default('Movie'),
  genre: z.string().trim().min(2, 'Genre is required'),
  tags: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return val.split(',').map(t => t.trim()).filter(Boolean); }
      }
      return val;
    },
    z.array(z.string().trim().min(1)).optional().default([])
  ),
  thumbnailUrl: z.string().trim().optional(),
  heroImageUrl: z.string().trim().optional(),
  videoUrl: z.string().trim().optional(),
  trailerUrl: z.string().trim().optional(),
  accessLevel: z.enum(['free', 'premium']).optional().default('free'),
  isFreeEpisode: z.preprocess((v) => v === 'true' || v === true, z.boolean().optional().default(false)),
  isPremium: z.preprocess((v) => v === 'true' || v === true, z.boolean().optional().default(false)),
  featured: z.preprocess((v) => v === 'true' || v === true, z.boolean().optional().default(false)),
  rating: z.preprocess((v) => v != null ? Number(v) : undefined, z.number().min(0).max(5).optional()),
  maturityRating: z.enum(['G', 'PG', 'PG-13', 'TV-14', 'R', '18+', 'TV-MA']).optional(),
  releaseYear: z.preprocess((v) => v != null && v !== '' ? Number(v) : null, z.number().nullable().optional()),
  language: z.string().trim().optional().default('English'),
  status: z.enum(['published', 'draft', 'archived']).optional().default('published'),
  // Series fields
  parentSeries: z.string().trim().optional().nullable(),
  seasonNumber: z.preprocess((v) => v != null && v !== '' ? Number(v) : null, z.number().nullable().optional()),
  episodeNumber: z.preprocess((v) => v != null && v !== '' ? Number(v) : null, z.number().nullable().optional()),
  episodeTitle: z.string().trim().optional().default(''),
});

const contentUpdateSchema = contentCreateSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: 'Please provide at least one field to update',
});

const buildContentFilters = ({ search, genre, tag, featured, status, type }, viewer) => {
  const filters = {};

  filters.status = 'published';

  if (status && status !== 'all') {
    filters.status = status;
  }

  if (genre && genre !== 'All') {
    filters.genre = genre;
  }

  if (tag) {
    filters.tags = tag;
  }

  if (type && type !== 'all') {
    filters.type = type;
  }

  const featuredFlag = toBoolean(featured);
  if (typeof featuredFlag === 'boolean') {
    filters.featured = featuredFlag;
  }

  if (search) {
    const normalizedSearch = normalizeSearchTerm(search);
    if (normalizedSearch) {
      filters.$text = { $search: normalizedSearch };
    }
  }

  if (hasParentalControlsEnabled(viewer)) {
    const blockedRatings = ['18+', 'R', 'NC-17', 'TV-MA'];
    filters.maturityRating = { $nin: blockedRatings };
  }

  // Exclude episodes from main listing (show only parent series/movies)
  if (!filters.parentSeries) {
    filters.parentSeries = null;
  }

  return filters;
};

const hasParentalControlsEnabled = (viewer) => Boolean(viewer?.preferences?.parentalControls);

const isRestrictedForParentalControls = (content) => {
  const genre = String(content?.genre || '').trim().toLowerCase();
  const tags = Array.isArray(content?.tags) ? content.tags : [];
  const hasMatureTag = tags.some((tag) => PARENTAL_RESTRICTED_TAGS.has(String(tag).trim().toLowerCase()));
  const isMatureRating = ['18+', 'R', 'NC-17', 'TV-MA'].includes(content?.maturityRating);

  return Boolean(
    content?.accessLevel === 'premium' ||
    content?.isPremium ||
    PARENTAL_RESTRICTED_GENRES.has(genre) ||
    hasMatureTag ||
    isMatureRating
  );
};

const getBufferDigest = (buffer) =>
  crypto.createHash('sha256').update(buffer).digest('hex');

const assertTrailerAndVideoAreDifferent = ({ payload, files }) => {
  const trailerFile = files?.trailer?.[0];
  const videoFile = files?.video?.[0];

  if (trailerFile?.buffer && videoFile?.buffer) {
    const trailerDigest = getBufferDigest(trailerFile.buffer);
    const videoDigest = getBufferDigest(videoFile.buffer);
    if (trailerDigest === videoDigest) {
      throw new AppError('Trailer and full episode/video must be different files.', 400);
    }
  }

  if (payload?.trailerUrl && payload?.videoUrl) {
    if (String(payload.trailerUrl).trim() === String(payload.videoUrl).trim()) {
      throw new AppError('Trailer URL and full episode/video URL must be different.', 400);
    }
  }
};

export const mapContent = (content) => ({
  id: content._id,
  title: content.title,
  description: content.description,
  desc: content.description,
  type: content.type,
  genre: content.genre,
  tags: content.tags || [],
  image: content.thumbnailUrl,
  thumbnailUrl: content.thumbnailUrl,
  thumbnailPublicId: content.thumbnailPublicId || '',
  hero_image: content.heroImageUrl || content.thumbnailUrl,
  heroImageUrl: content.heroImageUrl || content.thumbnailUrl,
  heroImagePublicId: content.heroImagePublicId || '',
  videoUrl: content.playbackBlocked ? '' : resolveDemoVideoUrl(content),
  videoPublicId: content.videoPublicId || '',
  videoDuration: content.videoDuration || 0,
  trailerUrl: content.trailerUrl || '',
  trailerPublicId: content.trailerPublicId || '',
  trailerDuration: content.trailerDuration || 0,
  videoQualities: content.videoQualities || {},
  accessLevel: content.accessLevel || 'free',
  isFreeEpisode: content.isFreeEpisode || false,
  isPremium: content.isPremium || content.accessLevel === 'premium',
  featured: content.featured,
  parentSeries: content.parentSeries || null,
  seasonNumber: content.seasonNumber || null,
  episodeNumber: content.episodeNumber || null,
  episodeTitle: content.episodeTitle || '',
  views: content.views,
  likes: content.likes || 0,
  rating: content.rating,
  maturityRating: content.maturityRating || 'PG-13',
  releaseYear: content.releaseYear || null,
  language: content.language || 'English',
  status: content.status,
  uploadStatus: content.uploadStatus || 'complete',
  createdAt: content.createdAt,
  updatedAt: content.updatedAt,
  playbackBlocked: content.playbackBlocked || false,
});

export const getPublishedContent = async (queryFilters = {}) => {
  const { limit, ...filters } = queryFilters;
  const parsedLimit = Number.parseInt(limit, 10);

  let query = Content.find(filters).sort({ featured: -1, views: -1, createdAt: -1 });

  if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
    query = query.limit(parsedLimit);
  }

  return await query;
};

export const getContentList = async (query, viewer = null) => {
  const filters = buildContentFilters(query, viewer);
  let content = await getPublishedContent({ ...filters, limit: query.limit });

  if (hasParentalControlsEnabled(viewer)) {
    content = content.filter((item) => !isRestrictedForParentalControls(item));
  } else if (!viewer) {
    content = content.filter((item) => !isRestrictedForParentalControls(item));
  }

  return content;
};

export const getContentDetails = async (id, viewer = null) => {
  const content = await Content.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
  if (!content) throw new AppError('Content not found', 404);

  if (hasParentalControlsEnabled(viewer) && isRestrictedForParentalControls(content)) {
    throw new AppError('This title is locked by parental controls for this profile.', 403);
  }

  if (viewer) {
    if (viewer.status === 'banned') {
      throw new AppError('Your account has been banned. Please contact customer support.', 403);
    }

    const isSubscribed = viewer.subscription?.status === 'active';
    const isFreeContent = content.accessLevel === 'free' || content.isFreeEpisode;

    if (!isSubscribed && !isFreeContent) {
      // Premium content — block full video for non-subscribers
      content.playbackBlocked = true;
    } else if (!isSubscribed && !isFreeContent) {
      const watchedStrings = (viewer.watchedVideos || []).map(String);
      const alreadyWatchedThis = watchedStrings.includes(String(id));
      if (watchedStrings.length > 0 && !alreadyWatchedThis) {
        content.playbackBlocked = true;
      }
    }
  } else {
    // Guest user — block all premium content
    if (content.accessLevel === 'premium' && !content.isFreeEpisode) {
      content.playbackBlocked = true;
    }
  }

  return content;
};

/**
 * Create content with Cloudinary file uploads.
 */
export const createContent = async (data, adminUserId, files = {}) => {
  const payload = validate(contentCreateSchema, data);
  assertTrailerAndVideoAreDifferent({ payload, files });
  const uploadData = {};

  // Upload thumbnail
  if (files.thumbnail && files.thumbnail[0]) {
    const result = await cloudinaryService.uploadImage(files.thumbnail[0].buffer, 'thumbnails');
    uploadData.thumbnailUrl = result.url;
    uploadData.thumbnailPublicId = result.publicId;
  }

  // Upload hero banner
  if (files.heroBanner && files.heroBanner[0]) {
    const result = await cloudinaryService.uploadImage(files.heroBanner[0].buffer, 'heroes');
    uploadData.heroImageUrl = result.url;
    uploadData.heroImagePublicId = result.publicId;
  }

  // Upload trailer
  if (files.trailer && files.trailer[0]) {
    const result = await cloudinaryService.uploadVideo(files.trailer[0].buffer, 'trailers');
    uploadData.trailerUrl = result.url;
    uploadData.trailerPublicId = result.publicId;
    uploadData.trailerDuration = result.duration;
  }

  // Upload full video
  if (files.video && files.video[0]) {
    const result = await cloudinaryService.uploadVideo(files.video[0].buffer, 'videos');
    uploadData.videoUrl = result.url;
    uploadData.videoPublicId = result.publicId;
    uploadData.videoDuration = result.duration;

    // Generate multi-resolution URLs
    uploadData.videoQualities = cloudinaryService.generateVideoQualities(result.publicId);
    uploadData.uploadStatus = 'complete';
  }

  // If isPremium is set, also set accessLevel for backward compat
  if (payload.isPremium && !payload.accessLevel) {
    payload.accessLevel = 'premium';
  }

  // Auto-set Episode 1 as free
  if (payload.type === 'Series' && payload.episodeNumber === 1 && payload.isFreeEpisode === undefined) {
    uploadData.isFreeEpisode = true;
  }

  const heroImageUrl = uploadData.heroImageUrl || payload.heroImageUrl || uploadData.thumbnailUrl || payload.thumbnailUrl;

  const contentDoc = await Content.create({
    ...payload,
    ...uploadData,
    heroImageUrl,
    createdBy: adminUserId,
  });

  return contentDoc;
};

/**
 * Update content with optional new file uploads.
 */
export const updateContent = async (id, data, files = {}) => {
  const payload = validate(contentUpdateSchema, data);
  assertTrailerAndVideoAreDifferent({ payload, files });
  const existing = await Content.findById(id);
  if (!existing) throw new AppError('Content not found', 404);

  const uploadData = {};

  // Replace thumbnail
  if (files.thumbnail && files.thumbnail[0]) {
    if (existing.thumbnailPublicId) {
      await cloudinaryService.deleteAsset(existing.thumbnailPublicId, 'image');
    }
    const result = await cloudinaryService.uploadImage(files.thumbnail[0].buffer, 'thumbnails');
    uploadData.thumbnailUrl = result.url;
    uploadData.thumbnailPublicId = result.publicId;
  }

  // Replace hero banner
  if (files.heroBanner && files.heroBanner[0]) {
    if (existing.heroImagePublicId) {
      await cloudinaryService.deleteAsset(existing.heroImagePublicId, 'image');
    }
    const result = await cloudinaryService.uploadImage(files.heroBanner[0].buffer, 'heroes');
    uploadData.heroImageUrl = result.url;
    uploadData.heroImagePublicId = result.publicId;
  }

  // Replace trailer
  if (files.trailer && files.trailer[0]) {
    if (existing.trailerPublicId) {
      await cloudinaryService.deleteAsset(existing.trailerPublicId, 'video');
    }
    const result = await cloudinaryService.uploadVideo(files.trailer[0].buffer, 'trailers');
    uploadData.trailerUrl = result.url;
    uploadData.trailerPublicId = result.publicId;
    uploadData.trailerDuration = result.duration;
  }

  // Replace full video
  if (files.video && files.video[0]) {
    if (existing.videoPublicId) {
      await cloudinaryService.deleteAsset(existing.videoPublicId, 'video');
    }
    const result = await cloudinaryService.uploadVideo(files.video[0].buffer, 'videos');
    uploadData.videoUrl = result.url;
    uploadData.videoPublicId = result.publicId;
    uploadData.videoDuration = result.duration;
    uploadData.videoQualities = cloudinaryService.generateVideoQualities(result.publicId);
    uploadData.uploadStatus = 'complete';
  }

  const content = await Content.findByIdAndUpdate(
    id,
    { ...payload, ...uploadData },
    { new: true, runValidators: true }
  );

  return content;
};

/**
 * Delete content with Cloudinary asset cleanup.
 */
export const deleteContent = async (id) => {
  const content = await Content.findById(id);
  if (!content) throw new AppError('Content not found', 404);

  // Clean up Cloudinary assets
  await cloudinaryService.deleteContentAssets(content);

  // Delete episodes if this is a parent series
  if (content.type === 'Series' && !content.parentSeries) {
    const episodes = await Content.find({ parentSeries: id });
    for (const episode of episodes) {
      await cloudinaryService.deleteContentAssets(episode);
      await episode.deleteOne();
    }
  }

  await content.deleteOne();
  return content;
};

/**
 * Get episodes for a series.
 */
export const getEpisodesBySeries = async (seriesId) => {
  const series = await Content.findById(seriesId);
  if (!series) throw new AppError('Series not found', 404);
  if (series.type !== 'Series' || series.parentSeries) {
    throw new AppError('This content is not a parent series', 400);
  }

  const episodes = await Content.find({ parentSeries: seriesId })
    .sort({ seasonNumber: 1, episodeNumber: 1 });

  return episodes;
};

export const registerWatchEvent = async (contentId, user) => {
  const content = await Content.findById(contentId);
  if (!content) throw new AppError('Content not found', 404);

  if (user.status === 'banned') {
    throw new AppError('Your account has been banned. Please contact customer support.', 403);
  }

  const isSubscribed = user.subscription?.status === 'active';
  const isFreeContent = content.accessLevel === 'free' || content.isFreeEpisode;

  if (isSubscribed || isFreeContent) {
    if (!user.watchedVideos.map(String).includes(String(contentId))) {
      user.watchedVideos.push(contentId);
      await user.save();
    }
    return { success: true, allowed: true, watchedVideos: user.watchedVideos };
  }

  const watchedStrings = (user.watchedVideos || []).map(String);
  const alreadyWatchedThis = watchedStrings.includes(String(contentId));

  if (watchedStrings.length === 0 || alreadyWatchedThis) {
    if (!alreadyWatchedThis) {
      user.watchedVideos.push(contentId);
      await user.save();
    }
    return { success: true, allowed: true, watchedVideos: user.watchedVideos };
  }

  if (user.status === 'suspended') {
    throw new AppError('Free limit exhausted. Your account is currently suspended and cannot purchase a subscription. Please contact support.', 403);
  } else {
    throw new AppError('Free limit exhausted. Please purchase a subscription to continue watching.', 403);
  }
};
