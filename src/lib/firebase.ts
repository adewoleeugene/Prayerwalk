import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  projectId: "praysmart",
  appId: "1:194925693704:web:b1440f274a22c8fa94babd",
  storageBucket: "praysmart.firebasestorage.app",
  apiKey: "AIzaSyCXbZotQkt-sWoQIDqk70_D4197np3xMcI",
  authDomain: "praysmart.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "194925693704"
};

function getFirebaseApp(): FirebaseApp {
    if (getApps().length) {
      return getApp();
    }
    return initializeApp(firebaseConfig);
}

export const app = getFirebaseApp();
export const auth = getAuth(app);
