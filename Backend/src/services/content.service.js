import Content from '../models/content.model.js';
import AppError from '../utils/AppError.js';
import { z } from 'zod';
import { validate, toBoolean } from '../utils/validate.js';
import { resolveDemoVideoUrl } from '../utils/demoVideo.js';
import { escapeRegex, normalizeSearchTerm } from '../utils/search.js';

const PARENTAL_RESTRICTED_GENRES = new Set(['action', 'thriller', 'mystery', 'horror', 'originals']);
const PARENTAL_RESTRICTED_TAGS = new Set(['mature', 'explicit', '18+', 'violence']);

const contentCreateSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['Movie', 'Series']).default('Movie'),
  genre: z.string().trim().min(2, 'Genre is required'),
  tags: z.array(z.string().trim().min(1)).optional().default([]),
  videoUrl: z.string().trim().optional(),
  thumbnailUrl: z.string().trim().min(1, 'Thumbnail URL is required'),
  heroImageUrl: z.string().trim().optional(),
  isPremium: z.boolean().optional().default(false),
  featured: z.boolean().optional().default(false),
  rating: z.number().min(0).max(5).optional(),
  status: z.enum(['published', 'draft', 'archived']).optional().default('published'),
});

const contentUpdateSchema = contentCreateSchema.partial().refine((data) => Object.keys(data).length > 0, {
  message: 'Please provide at least one field to update',
});

const buildContentFilters = ({ search, genre, tag, featured, status }) => {
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

  const featuredFlag = toBoolean(featured);
  if (typeof featuredFlag === 'boolean') {
    filters.featured = featuredFlag;
  }

  if (search) {
    // Fixed: sanitize and cap search terms; use text index for faster/safer search where available.
    const normalizedSearch = normalizeSearchTerm(search);
    if (normalizedSearch) {
      filters.$text = { $search: normalizedSearch };
    }
  }

  return filters;
};

const hasParentalControlsEnabled = (viewer) => Boolean(viewer?.preferences?.parentalControls);

const isRestrictedForParentalControls = (content) => {
  const genre = String(content?.genre || '').trim().toLowerCase();
  const tags = Array.isArray(content?.tags) ? content.tags : [];
  const hasMatureTag = tags.some((tag) => PARENTAL_RESTRICTED_TAGS.has(String(tag).trim().toLowerCase()));

  return Boolean(content?.isPremium || PARENTAL_RESTRICTED_GENRES.has(genre) || hasMatureTag);
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
  hero_image: content.heroImageUrl || content.thumbnailUrl,
  heroImageUrl: content.heroImageUrl || content.thumbnailUrl,
  videoUrl: resolveDemoVideoUrl(content),
  isPremium: content.isPremium,
  featured: content.featured,
  views: content.views,
  rating: content.rating,
  status: content.status,
  createdAt: content.createdAt,
  updatedAt: content.updatedAt,
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
  const filters = buildContentFilters(query);
  const content = await getPublishedContent({ ...filters, limit: query.limit });
  return content;
};

export const getContentDetails = async (id, viewer = null) => {
  const content = await Content.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true });
  if (!content) throw new AppError('Content not found', 404);

  if (hasParentalControlsEnabled(viewer) && isRestrictedForParentalControls(content)) {
    throw new AppError('This title is locked by parental controls for this profile.', 403);
  }

  return content;
};

export const createContent = async (data, adminUserId) => {
  const payload = validate(contentCreateSchema, data);
  return await Content.create({ ...payload, createdBy: adminUserId });
};

export const updateContent = async (id, data) => {
  const payload = validate(contentUpdateSchema, data);
  const content = await Content.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
  if (!content) throw new AppError('Content not found', 404);
  return content;
};

export const deleteContent = async (id) => {
  const content = await Content.findByIdAndDelete(id);
  if (!content) throw new AppError('Content not found', 404);
  return content;
};

