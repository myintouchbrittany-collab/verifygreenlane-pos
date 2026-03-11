import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBJuOXTfSw64nEKqquptpVKGCbtrzRyvUw",
  authDomain: "verifygreenlane.firebaseapp.com",
  projectId: "verifygreenlane",
  storageBucket: "verifygreenlane.firebasestorage.app",
  messagingSenderId: "467738121683",
  appId: "1:467738121683:web:e23df3947b1c636f4c0b26"
};
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);