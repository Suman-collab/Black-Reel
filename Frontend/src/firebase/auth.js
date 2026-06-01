import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  confirmPasswordReset,
  sendEmailVerification,
} from 'firebase/auth';
import { auth, googleProvider } from './config';

export const loginWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(
      auth, email, password
    );
    return result.user;
  } catch (error) {
    throw error;
  }
};

export const signupWithEmail = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(
      auth, email, password
    );
    try {
      await sendEmailVerification(result.user);
    } catch (e) {
      console.error('Failed to send verification email during signup:', e);
    }
    return result.user;
  } catch (error) {
    throw error;
  }
};

export const loginWithGoogle = async () => {
  try {
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      return null;
    }

    if (error?.code === 'auth/network-request-failed') {
      throw new Error('Network error. Check your connection.');
    }

    if (error?.code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
};

export const resetPasswordWithCode = async ({ oobCode, newPassword }) => {
  try {
    await confirmPasswordReset(auth, oobCode, newPassword);
  } catch (error) {
    throw error;
  }
};

export const onAuthChange = (callback) => {
  try {
    return onAuthStateChanged(auth, callback);
  } catch (error) {
    throw error;
  }
};
