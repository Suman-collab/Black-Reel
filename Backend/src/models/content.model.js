import mongoose from 'mongoose';

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
    videoUrl: { type: String, default: '' },
    thumbnailUrl: { type: String, required: true, trim: true },
    heroImageUrl: { type: String, trim: true, default: '' },
    isPremium: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    rating: { type: Number, default: 4.5 },
    status: {
      type: String,
      enum: ['published', 'draft', 'archived'],
      default: 'published',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

contentSchema.index({ genre: 1, isPremium: 1, featured: 1 });
contentSchema.index({ title: 'text', description: 'text', genre: 'text', tags: 'text' });

const Content = mongoose.model('Content', contentSchema);
export default Content;
