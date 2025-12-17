// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCTDVOh8cYivImlLvOazXsr2FExfen1dh8",
  authDomain: "kumarishop-2d77c.firebaseapp.com",
  projectId: "kumarishop-2d77c",
  storageBucket: "kumarishop-2d77c.firebasestorage.app",
  messagingSenderId: "300401735048",
  appId: "1:300401735048:web:48279fa9694bc79e14363d",
  measurementId: "G-K7XZHC271V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };
