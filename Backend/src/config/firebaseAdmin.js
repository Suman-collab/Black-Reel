import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const toMultilineKey = (key = '') => String(key).replace(/\\n/g, '\n');

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: toMultilineKey(process.env.FIREBASE_PRIVATE_KEY || ''),
};

const hasFirebaseServiceAccount =
  Boolean(serviceAccount.projectId) &&
  Boolean(serviceAccount.clientEmail) &&
  Boolean(serviceAccount.privateKey);

if (hasFirebaseServiceAccount && getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export const isFirebaseAdminConfigured = hasFirebaseServiceAccount;
export const firebaseAuthAdmin = hasFirebaseServiceAccount ? getAuth() : null;
