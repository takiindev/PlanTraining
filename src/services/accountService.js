import { collection, addDoc, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { 
  generateToken, 
  saveTokenToStorage, 
  saveUserEmailToStorage,
  getUserByEmail,
  updateUserToken 
} from "./tokenService";
import { saveUserInfo } from "./userService";
import { hashPassword, verifyPassword, generateSalt } from "../utils/passwordUtils";

/**
 * Lưu tài khoản mới vào Firestore và tạo thông tin người dùng
 * @param {string} email - Email người dùng
 * @param {string} password - Mật khẩu người dùng (sẽ được hash)
 * @param {string} firstName - Tên
 * @param {string} lastName - Họ và tên đệm
 * @returns {Promise<string>} ID document của tài khoản được tạo
 */
export async function saveAccount(email, password, firstName, lastName) {
  try {
    // Kiểm tra xem tài khoản đã tồn tại chưa
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      throw new Error("Tài khoản với email này đã tồn tại");
    }

    // Tạo salt và hash mật khẩu
    const salt = generateSalt();
    const hashedPassword = await hashPassword(password + salt);

    // Tạo document tài khoản mới trong collection accounts
    const docRef = await addDoc(collection(db, "accounts"), {
      email,
      password: hashedPassword, // Lưu mật khẩu đã hash
      salt: salt, // Lưu salt để verify sau
      token: "", // Khởi tạo với token rỗng
      createdAt: new Date(),
      lastLogin: null
    });
    
    // Lưu thông tin chi tiết người dùng vào collection users với cùng ID
    await saveUserInfo(docRef.id, {
      firstName,
      lastName,
      email,
      role: "user" // Thiết lập role mặc định là "user" cho tài khoản mới
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Lỗi khi tạo tài khoản:", error);
    throw error;
  }
}

/**
 * Đăng nhập người dùng với email và mật khẩu
 * @param {string} email - Email người dùng
 * @param {string} password - Mật khẩu người dùng
 * @returns {Promise<Object>} Kết quả đăng nhập với trạng thái thành công và dữ liệu người dùng
 */
export async function loginAccount(email, password) {
  try {
    // Lấy document người dùng từ Firestore
    const userDoc = await getUserByEmail(email);
    
    // Kiểm tra xem người dùng có tồn tại không
    if (!userDoc) {
      throw new Error("Không tìm thấy tài khoản");
    }
    
    // Kiểm tra mật khẩu với hash và salt
    const saltedPassword = password + userDoc.salt;
    const isPasswordValid = await verifyPassword(saltedPassword, userDoc.password);
    
    if (!isPasswordValid) {
      throw new Error("Mật khẩu không đúng");
    }
    
    // Tạo token xác thực mới
    const newToken = generateToken();
    
    // Cập nhật token trong Firestore (điều này sẽ vô hiệu hóa các phiên khác)
    await updateUserToken(userDoc.id, newToken);
    
    // Lưu token và email vào localStorage
    saveTokenToStorage(newToken);
    saveUserEmailToStorage(email);
    
    return {
      success: true,
      user: {
        id: userDoc.id,
        email: userDoc.email,
        createdAt: userDoc.createdAt
      },
      token: newToken
    };
    
  } catch (error) {
    console.error("Lỗi khi đăng nhập:", error);
    throw error;
  }
}

/**
 * Lấy tất cả tài khoản
 * @returns {Promise<Array>} Mảng tất cả document tài khoản
 */
export async function getAllAccounts() {
  try {
    const querySnapshot = await getDocs(collection(db, "accounts"));
    const accounts = [];
    
    querySnapshot.forEach((doc) => {
      accounts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return accounts;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách tài khoản:", error);
    throw error;
  }
}

/**
 * Tạo real-time listener cho danh sách accounts
 * @param {function} callback - Function được gọi khi dữ liệu thay đổi
 * @returns {function} Unsubscribe function
 */
export function subscribeToAccounts(callback) {
  try {
    const accountsCollection = collection(db, "accounts");
    
    const unsubscribe = onSnapshot(accountsCollection, (snapshot) => {
      const accounts = [];
      snapshot.forEach((doc) => {
        accounts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log("Real-time update - Accounts loaded:", accounts.length);
      callback(accounts);
    }, (error) => {
      console.error("Lỗi real-time listener cho accounts:", error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error("Lỗi khi tạo listener cho accounts:", error);
    throw error;
  }
}
