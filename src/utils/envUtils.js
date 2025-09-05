/**
 * Utility functions để quản lý biến môi trường
 */

/**
 * Lấy giá trị biến môi trường với validation
 * @param {string} key - Tên biến môi trường
 * @param {string} defaultValue - Giá trị mặc định (optional)
 * @returns {string} Giá trị biến môi trường
 */
export function getEnvVar(key, defaultValue = null) {
  const value = import.meta.env[key];
  
  if (!value && !defaultValue) {
    console.error(`Biến môi trường "${key}" không được định nghĩa`);
    return '';
  }
  
  return value || defaultValue;
}

/**
 * Kiểm tra xem tất cả biến môi trường cần thiết có được cung cấp không
 * @param {string[]} requiredVars - Danh sách các biến môi trường cần thiết
 * @returns {boolean} True nếu tất cả biến môi trường đều có giá trị
 */
export function validateRequiredEnvVars(requiredVars) {
  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Thiếu các biến môi trường cần thiết:', missingVars.join(', '));
    console.error('Vui lòng kiểm tra file .env và đảm bảo tất cả biến môi trường được cung cấp');
    return false;
  }
  
  return true;
}

/**
 * Cấu hình Firebase từ biến môi trường
 */
export const firebaseEnvConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID')
};

/**
 * Cấu hình ứng dụng từ biến môi trường
 */
export const appConfig = {
  name: getEnvVar('VITE_APP_NAME', 'PlanTraining'),
  version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE
};

/**
 * Cấu hình Cloudinary từ biến môi trường
 */
export const cloudinaryConfig = {
  cloudName: getEnvVar('VITE_CLOUDINARY_CLOUD_NAME'),
  apiKey: getEnvVar('VITE_CLOUDINARY_API_KEY'),
  apiSecret: getEnvVar('VITE_CLOUDINARY_API_SECRET'),
  uploadPreset: getEnvVar('VITE_CLOUDINARY_UPLOAD_PRESET', 'avatar_upload')
};

/**
 * Danh sách tất cả biến môi trường cần thiết cho Firebase
 */
export const REQUIRED_FIREBASE_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

/**
 * Danh sách tất cả biến môi trường cần thiết cho Cloudinary
 */
export const REQUIRED_CLOUDINARY_ENV_VARS = [
  'VITE_CLOUDINARY_CLOUD_NAME',
  'VITE_CLOUDINARY_API_KEY'
];
