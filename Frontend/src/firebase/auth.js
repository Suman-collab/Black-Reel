import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
} from 'firebase/auth';
import { firebaseAuth } from './config';

export const registerWithEmail = async ({ email, password }) => {
  const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  await sendEmailVerification(userCredential.user);
  await signOut(firebaseAuth);
  return userCredential.user;
};

export const loginWithEmail = async ({ email, password }) => {
  const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
  await userCredential.user.reload();

  if (!userCredential.user.emailVerified) {
    await signOut(firebaseAuth);
    throw new Error('Please verify your email before signing in.');
  }

  return userCredential.user;
};

export const resendCurrentUserVerification = async () => {
  const currentUser = firebaseAuth.currentUser;
  if (!currentUser) {
    throw new Error('Sign in required to resend verification email.');
  }

  await sendEmailVerification(currentUser);
};

export const requestPasswordResetEmail = async (email) => {
  await sendPasswordResetEmail(firebaseAuth, email);
};

export const logoutFirebaseUser = async () => {
  await signOut(firebaseAuth);
};

export const loginWithGooglePopup = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(firebaseAuth, provider);
  return result.user;
};
