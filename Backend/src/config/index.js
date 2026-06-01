const parseCsv = (value = '') =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const config = {
  app: {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT) || 5000,
    name: process.env.APP_NAME || 'MyApp',
    url: process.env.NODE_ENV === 'production'
      ? process.env.APP_URL
      : process.env.APP_URL || process.env.APP_BASE_URL || 'http://localhost:5000',
    clientUrl: process.env.NODE_ENV === 'production'
      ? process.env.CLIENT_URL
      : process.env.CLIENT_URL || 'http://localhost:5173',
    adminUrl: process.env.NODE_ENV === 'production'
      ? process.env.ADMIN_URL
      : process.env.ADMIN_URL || 'https://blackreeladmin.vercel.app/',
  },
  cors: {
    allowedOrigins: parseCsv(process.env.ALLOWED_ORIGINS),
  },
  db: {
    url: process.env.DATABASE_URL || process.env.MONGO_URI || '',
    fallbackUrl: process.env.MONGO_FALLBACK_URI || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ||
      (process.env.NODE_ENV === 'production'
        ? `${String(process.env.APP_URL || '').replace(/\/$/, '')}/api/v1/auth/google/callback`
        : `${String(process.env.APP_BASE_URL || process.env.APP_URL || 'http://localhost:5000').replace(/\/$/, '')}/api/v1/auth/google/callback`),
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/^"|"$/g, '').replace(/\\n/g, '\n') || '',
    webApiKey: process.env.VITE_FIREBASE_API_KEY || '',
    webAuthDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    webProjectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  },
  payment: {
    mode: process.env.PAYMENT_MODE || 'dummy',
    dummySuccessRate: Number(process.env.DUMMY_PAYMENT_SUCCESS_RATE) || 80,
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    },
    razorpay: {
      keyId: process.env.RAZORPAY_KEY_ID,
      keySecret: process.env.RAZORPAY_KEY_SECRET,
    },
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || process.env.API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET || '',
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || '',
    allowMockPayments: process.env.ALLOW_MOCK_PAYMENTS === 'true',
  },
  admin: {
    secretKey: process.env.ADMIN_SECRET_KEY || '',
    email: process.env.ADMIN_EMAIL || '',
  },
  configApi: {
    secret: process.env.CONFIG_API_SECRET || '',
    allowedClients: parseCsv(process.env.ALLOWED_CONFIG_CLIENTS || 'frontend,admin'),
    publicConfigUrl: process.env.VITE_CONFIG_URL || '',
    adminConfigUrl: process.env.VITE_ADMIN_CONFIG_URL || '',
  },
  frontend: {
    url: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : process.env.FRONTEND_URL || 'http://localhost:5173',
    apiBaseUrl: process.env.NODE_ENV === 'production'
      ? process.env.VITE_API_URL || process.env.VITE_API_BASE_URL
      : process.env.VITE_API_BASE_URL || process.env.VITE_API_URL || 'http://localhost:5000/api',
    appName: process.env.VITE_APP_NAME || process.env.APP_NAME || 'MyApp',
    googleClientId: process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
  },
  seed: {
    enabled:
      process.env.SEED_ON_STARTUP === 'true' ||
      (String(process.env.NODE_ENV || 'development') !== 'production' && process.env.SEED_ON_STARTUP !== 'false'),
    adminName: process.env.SEED_ADMIN_NAME || '',
    adminEmail: String(process.env.SEED_ADMIN_EMAIL || '').toLowerCase(),
    adminPassword: process.env.SEED_ADMIN_PASSWORD || '',
    userName: process.env.SEED_USER_NAME || '',
    userEmail: String(process.env.SEED_USER_EMAIL || '').toLowerCase(),
    userPassword: process.env.SEED_USER_PASSWORD || '',
  },
};

