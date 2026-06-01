import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const requiredKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

console.log('[Firebase debug info]:', requiredKeys.reduce((acc, key) => {
  acc[key] = import.meta.env[key] ? 'LOADED' : 'MISSING';
  return acc;
}, {}));

const missingKeys = requiredKeys.filter(
  key => !import.meta.env[key]
);

if (missingKeys.length > 0) {
  console.error(
    '[Firebase] Missing environment variables:\n' +
    missingKeys.join('\n') +
    '\nOpen D:\\Black_Reel\\.env and fill in all ' +
    'VITE_FIREBASE_* values, then restart the dev server.'
  );
}

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};  


const app = getApps().length === 0 
  ? initializeApp(firebaseConfig) 
  : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
