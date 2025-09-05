import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { firebaseEnvConfig, validateRequiredEnvVars, REQUIRED_FIREBASE_ENV_VARS } from "./utils/envUtils";

// Kiểm tra xem tất cả biến môi trường Firebase có được cung cấp không
validateRequiredEnvVars(REQUIRED_FIREBASE_ENV_VARS);

// Khởi tạo Firebase app với cấu hình từ biến môi trường
const app = initializeApp(firebaseEnvConfig);

// Khởi tạo Firestore database
export const db = getFirestore(app);
