import { initializeApp, getApps, getApp as getFirebaseAppInstance, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { firebaseConfig } from "./firebase-config";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

// Lazy initialize Firebase app
const getFirebaseApp = (): FirebaseApp => {
  if (typeof window === 'undefined') {
    throw new Error('Firebase should only be initialized on the client side');
  }
  
  if (!app) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getFirebaseAppInstance();
    }
  }
  return app;
};

// Optimized auth initialization with better error handling
export const getFirebaseAuth = (): Auth => {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth should only be accessed on the client side');
  }
  
  if (!auth) {
    const firebaseApp = getFirebaseApp();
    auth = getAuth(firebaseApp);
    
    // Enable auth persistence for better performance
    auth.settings.appVerificationDisabledForTesting = false;
  }
  return auth;
};

export { getFirebaseApp as getApp };
