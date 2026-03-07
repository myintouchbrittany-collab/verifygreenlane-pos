import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBJuOXTfSw64nEKqpuptpVKGCbtrzRyVuW",
  authDomain: "verifygreenlane.firebaseapp.com",
  projectId: "verifygreenlane",
  storageBucket: "verifygreenlane.appspot.com",
  messagingSenderId: "467738121683",
  appId: "1:467738121683:web:e23df3947b1c636f4c0b26"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);