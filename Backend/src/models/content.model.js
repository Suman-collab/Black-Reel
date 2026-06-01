import mongoose from 'mongoose';

const videoQualitiesSchema = new mongoose.Schema(
  {
    p240: { type: String, default: '' },
    p360: { type: String, default: '' },
    p480: { type: String, default: '' },
    p720: { type: String, default: '' },
    p1080: { type: String, default: '' },
    p2160: { type: String, default: '' },
  },
  { _id: false }
);

const contentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['Movie', 'Series'],
      default: 'Movie',
    },
    genre: { type: String, required: true, trim: true },
    tags: [{ type: String, trim: true }],

    // ── Images ──────────────────────────────────────────
    thumbnailUrl: { type: String, required: true, trim: true },
    thumbnailPublicId: { type: String, default: '' },
    heroImageUrl: { type: String, trim: true, default: '' },
    heroImagePublicId: { type: String, default: '' },

    // ── Full video ──────────────────────────────────────
    videoUrl: { type: String, default: '' },
    videoPublicId: { type: String, default: '' },
    videoDuration: { type: Number, default: 0 },

    // ── Trailer ─────────────────────────────────────────
    trailerUrl: { type: String, default: '' },
    trailerPublicId: { type: String, default: '' },
    trailerDuration: { type: Number, default: 0 },

    // ── Multi-resolution streaming ──────────────────────
    videoQualities: {
      type: videoQualitiesSchema,
      default: () => ({}),
    },

    // ── Access control ──────────────────────────────────
    accessLevel: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free',
    },
    isFreeEpisode: { type: Boolean, default: false },

    // ── Legacy (kept for backward compat) ───────────────
    isPremium: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },

    // ── Series / Episode fields ─────────────────────────
    parentSeries: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      default: null,
    },
    seasonNumber: { type: Number, default: null },
    episodeNumber: { type: Number, default: null },
    episodeTitle: { type: String, trim: true, default: '' },

    // ── Metadata ────────────────────────────────────────
    rating: { type: Number, default: 4.5 },
    maturityRating: {
      type: String,
      enum: ['G', 'PG', 'PG-13', 'TV-14', 'R', '18+', 'TV-MA'],
      default: 'PG-13',
    },
    releaseYear: { type: Number, default: null },
    language: { type: String, trim: true, default: 'English' },

    // ── Stats ───────────────────────────────────────────
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },

    // ── Status ──────────────────────────────────────────
    status: {
      type: String,
      enum: ['published', 'draft', 'archived'],
      default: 'published',
    },
    uploadStatus: {
      type: String,
      enum: ['pending', 'processing', 'complete', 'failed'],
      default: 'complete',
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// ── Pre-delete: clean up references ────────────────────
contentSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  const contentId = this._id;

  await mongoose.model('User').updateMany(
    { watchlist: contentId },
    { $pull: { watchlist: contentId } }
  );

  await mongoose.model('Report').deleteMany({ content: contentId });

  // Cloudinary cleanup is handled in the service layer
  next();
});

// ── Indexes ────────────────────────────────────────────
contentSchema.index({ genre: 1, accessLevel: 1, featured: 1 });
contentSchema.index(
  { title: 'text', description: 'text', genre: 'text', tags: 'text' },
  {
    default_language: 'english',
    language_override: 'searchLanguage',
  }
);
contentSchema.index({ parentSeries: 1, seasonNumber: 1, episodeNumber: 1 });
contentSchema.index({ type: 1, status: 1 });

const Content = mongoose.model('Content', contentSchema);
export default Content;
