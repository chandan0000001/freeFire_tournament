/**
 * Firebase Web Client Configuration for Rahul Esports Odisha
 * Project: Rahul-Esports-odisha
 */

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'rahul-esports-odisha.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'rahul-esports-odisha',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'rahul-esports-odisha.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export default firebaseConfig;
