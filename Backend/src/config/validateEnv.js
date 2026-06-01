
export const validateEnv = () => {
  const requiredVars = [
    'NODE_ENV',
    'PORT',
    'APP_URL',
    'CLIENT_URL',
    'ADMIN_URL',
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'SESSION_SECRET',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'CONFIG_API_SECRET',
    'ADMIN_SECRET_KEY',
  ];

  
  if (process.env.NODE_ENV === 'production') {
    requiredVars.push(
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'RAZORPAY_KEY_ID',
      'RAZORPAY_KEY_SECRET',
      'SMTP_HOST',
      'SMTP_USER',
      'SMTP_PASSWORD'
    );
  }

  requiredVars.forEach((key) => {
    const value = process.env[key];
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      throw new Error(
        `\n[ENV ERROR] Missing required environment variable: ${key}\n` +
        `Copy .env.example to .env and fill in all values.\n`
      );
    }
  });
};
