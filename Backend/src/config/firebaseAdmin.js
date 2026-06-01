import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { config } from './index.js';

const toMultilineKey = (key = '') => String(key).replace(/^"|"$/g, '').replace(/\\n/g, '\n');

const serviceAccount = {
  projectId: config.firebase.projectId,
  clientEmail: config.firebase.clientEmail,
  privateKey: toMultilineKey(config.firebase.privateKey || ''),
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
