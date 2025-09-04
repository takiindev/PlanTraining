import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Cấu hình Firebase project
const firebaseConfig = {
  apiKey: "AIzaSyDODWMiS8FcpogA35wWon3bOJ1zSxaoOGQ",
  authDomain: "sample-firebase-ai-app-26281.firebaseapp.com",
  projectId: "sample-firebase-ai-app-26281",
  storageBucket: "sample-firebase-ai-app-26281.firebasestorage.app",
  messagingSenderId: "611707542566",
  appId: "1:611707542566:web:6b690baa6f34494965dae7"
};

// Khởi tạo Firebase app
const app = initializeApp(firebaseConfig);

// Khởi tạo Firestore database
export const db = getFirestore(app);
