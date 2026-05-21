import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const deviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      default: 'Web session',
    },
    os: {
      type: String,
      trim: true,
      default: 'Browser',
    },
    type: {
      type: String,
      enum: ['phone', 'laptop', 'tablet', 'tv', 'browser'],
      default: 'browser',
    },
    current: {
      type: Boolean,
      default: false,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const preferencesSchema = new mongoose.Schema(
  {
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
    parentalControls: {
      type: Boolean,
      default: false,
    },
    language: {
      type: String,
      default: 'English (US)',
      trim: true,
      enum: ['English (US)', 'English (UK)', 'Spanish'],
    },
  },
  { _id: false }
);

const subscriptionSchema = new mongoose.Schema(
  {
    planType: {
      type: String,
      enum: ['none', 'basic', 'standard', 'premium'],
      default: 'none',
    },
    status: {
      type: String,
      enum: ['inactive', 'pending', 'active', 'cancelled'],
      default: 'inactive',
    },
    startedAt: Date,
    renewalDate: Date,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function requiredPassword() {
        return this.authProvider === 'local';
      },
      select: false,
      minlength: 6,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'apple'],
      default: 'local',
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },
    refreshTokenHash: {
      type: String,
      select: false,
    },
    refreshTokenExpiresAt: {
      type: Date,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'banned'],
      default: 'active',
    },
    avatarUrl: {
      type: String,
      default: '/images/avatar.png',
    },
    watchlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content',
      },
    ],
    devices: {
      type: [deviceSchema],
      default: () => [
        {
          name: 'Current Browser',
          location: 'Web session',
          os: 'Browser',
          type: 'browser',
          current: true,
          lastActiveAt: new Date(),
        },
      ],
    },
    preferences: {
      type: preferencesSchema,
      default: () => ({}),
    },
    subscription: {
      type: subscriptionSchema,
      default: () => ({}),
    },
    lastLoginAt: Date,
    tokenVersion: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.password || !this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
