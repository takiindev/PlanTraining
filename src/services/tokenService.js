import { doc, getDoc, updateDoc, query, collection, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Tạo token xác thực mới sử dụng crypto.randomUUID()
 * @returns {string} Token UUID mới
 */
export function generateToken() {
  return crypto.randomUUID();
}

/**
 * Lưu token vào localStorage
 * @param {string} token - Token xác thực cần lưu
 */
export function saveTokenToStorage(token) {
  localStorage.setItem("authToken", token);
}

/**
 * Lấy token từ localStorage
 * @returns {string|null} Token đã lưu hoặc null nếu không tìm thấy
 */
export function getTokenFromStorage() {
  return localStorage.getItem("authToken");
}

/**
 * Lấy email người dùng hiện tại từ localStorage
 * @returns {string|null} Email đã lưu hoặc null nếu không tìm thấy
 */
export function getCurrentUserEmail() {
  return localStorage.getItem("userEmail");
}

/**
 * Lưu email người dùng vào localStorage
 * @param {string} email - Email người dùng cần lưu
 */
export function saveUserEmailToStorage(email) {
  localStorage.setItem("userEmail", email);
}

/**
 * Xóa tất cả dữ liệu xác thực từ localStorage
 */
export function clearAuthStorage() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("userEmail");
}

/**
 * Lấy thông tin người dùng theo email từ Firestore
 * @param {string} email - Email người dùng cần tìm
 * @returns {Promise<Object|null>} Document người dùng có id hoặc null nếu không tìm thấy
 */
export async function getUserByEmail(email) {
  try {
    const startTime = Date.now();
    
    const q = query(collection(db, "accounts"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    const duration = Date.now() - startTime;
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Trả về document đầu tiên tìm thấy cùng với ID
    const doc = querySnapshot.docs[0];
    const result = {
      id: doc.id,
      ...doc.data()
    };
    
    return result;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng theo email:", error);
    throw error;
  }
}

/**
 * Cập nhật token người dùng trong Firestore
 * @param {string} userId - ID document người dùng
 * @param {string} token - Token mới cần lưu
 */
export async function updateUserToken(userId, token) {
  try {
    const userRef = doc(db, "accounts", userId);
    await updateDoc(userRef, {
      token: token,
      lastLogin: new Date()
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật token người dùng:", error);
    throw error;
  }
}

/**
 * Kiểm tra tính hợp lệ của phiên làm việc hiện tại bằng cách so sánh token localStorage với token Firestore
 * @returns {Promise<boolean>} True nếu phiên hợp lệ, false nếu không
 */
export async function checkSession() {
  try {
    // Lấy token và email từ localStorage
    const localToken = getTokenFromStorage();
    const userEmail = getCurrentUserEmail();
    
    // Nếu không có token hoặc email local, phiên không hợp lệ
    if (!localToken || !userEmail) {
      clearAuthStorage();
      return false;
    }
    
    // Lấy document người dùng từ Firestore
    const userDoc = await getUserByEmail(userEmail);
    
    // Nếu người dùng không tồn tại trong Firestore, xóa storage và trả về false
    if (!userDoc) {
      clearAuthStorage();
      return false;
    }
    
    // So sánh token
    if (userDoc.token === localToken) {
      return true; // Phiên hợp lệ
    } else {
      // Token không khớp - người dùng đã đăng nhập từ thiết bị khác
      clearAuthStorage();
      return false;
    }
    
  } catch (error) {
    console.error("Lỗi khi kiểm tra phiên:", error);
    // Khi có lỗi, xóa storage và trả về false để bảo mật
    clearAuthStorage();
    return false;
  }
}

/**
 * Kiểm tra xem người dùng hiện tại có đang đăng nhập hay không (có phiên hợp lệ)
 * @returns {Promise<boolean>} True nếu người dùng đang đăng nhập với phiên hợp lệ
 */
export async function isLoggedIn() {
  return await checkSession();
}

/**
 * Đăng xuất người dùng bằng cách xóa localStorage và xóa token từ Firestore
 */
export async function logout() {
  try {
    const userEmail = getCurrentUserEmail();
    
    if (userEmail) {
      // Xóa token từ Firestore
      const userDoc = await getUserByEmail(userEmail);
      if (userDoc) {
        await updateUserToken(userDoc.id, ""); // Xóa token
      }
    }
    
    // Xóa localStorage
    clearAuthStorage();
    
  } catch (error) {
    console.error("Lỗi khi đăng xuất:", error);
    // Ngay cả khi cập nhật Firestore thất bại, vẫn xóa localStorage
    clearAuthStorage();
  }
}
