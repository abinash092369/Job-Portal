import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAMiPWouRwrPT8C9Dictc_7Y0FgqQeLegc',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'job-portal-946ea.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'job-portal-946ea',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'job-portal-946ea.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '663803490694',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:663803490694:web:528d7d553d09c62e2cbc07',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-7QTQFLECZB',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
