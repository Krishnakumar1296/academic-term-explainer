import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Prefer environment variables in production and local development (.env / .env.local).
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyAbODQuKHsPXC3ZDhGrXxFhKqyX8ciEHQI",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "vehicle-264ef.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "vehicle-264ef",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "vehicle-264ef.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "138358080107",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:138358080107:web:a96a7ed57850eb2597a72e",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-8024THF7XN",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Configured Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export default app;
