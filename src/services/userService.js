import { doc, setDoc, getDoc, collection, getDocs, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Lưu thông tin người dùng vào collection users
 * @param {string} userId - ID document từ collection accounts
 * @param {Object} userInfo - Thông tin người dùng
 * @param {string} userInfo.firstName - Tên
 * @param {string} userInfo.lastName - Họ và tên đệm
 * @param {string} userInfo.email - Email
 * @param {string} userInfo.role - Vai trò người dùng (mặc định: "user")
 * @returns {Promise<void>}
 */
export async function saveUserInfo(userId, userInfo) {
  try {
    // Sử dụng setDoc với ID cụ thể thay vì addDoc
    await setDoc(doc(db, "users", userId), {
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      email: userInfo.email,
      role: userInfo.role || "user", // Mặc định là "user"
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return userId;
  } catch (error) {
    console.error("Lỗi khi lưu thông tin người dùng:", error);
    throw error;
  }
}

/**
 * Lấy thông tin người dùng từ collection users
 * @param {string} userId - ID document
 * @returns {Promise<Object|null>} Thông tin người dùng hoặc null nếu không tìm thấy
 */
export async function getUserInfo(userId) {
  try {
    console.log("UserService - Đang lấy user info cho ID:", userId);
    const startTime = Date.now();
    
    const userDoc = await getDoc(doc(db, "users", userId));
    
    const duration = Date.now() - startTime;
    console.log(`UserService - getUserInfo hoàn tất trong ${duration}ms`);
    
    if (userDoc.exists()) {
      const result = {
        uid: userDoc.id, // Document ID chính là Firebase Auth UID
        id: userDoc.id,  // Giữ lại cho tương thích
        ...userDoc.data()
      };
      console.log("UserService - User info found:", result);
      return result;
    } else {
      console.log("UserService - Không tìm thấy user info cho ID:", userId);
      return null;
    }
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error);
    throw error;
  }
}

/**
 * Cập nhật thông tin người dùng
 * @param {string} userId - ID document
 * @param {Object} updateData - Dữ liệu cần cập nhật
 * @returns {Promise<void>}
 */
export async function updateUserInfo(userId, updateData) {
  try {
    await setDoc(doc(db, "users", userId), {
      ...updateData,
      updatedAt: new Date()
    }, { merge: true });
    
    } catch (error) {
    console.error("Lỗi cập nhật user info:", error);
    throw error;
  }
}

/**
 * Cập nhật role của người dùng (chỉ admin mới có quyền)
 * @param {string} userId - ID của user cần thay đổi role
 * @param {string} newRole - Role mới ("user", "member", "admin")
 * @returns {Promise<void>}
 */
export async function updateUserRole(userId, newRole) {
  try {
    // Validate role
    const validRoles = ["user", "member", "admin"];
    if (!validRoles.includes(newRole)) {
      throw new Error("Role không hợp lệ. Chỉ cho phép: user, member, admin");
    }

    console.log(`Updating user ${userId} role to ${newRole}`);
    
    // Sử dụng updateDoc thay vì setDoc để trigger real-time listeners
    await updateDoc(doc(db, "users", userId), {
      role: newRole,
      updatedAt: new Date()
    });
    
    console.log(`Role updated successfully for user ${userId}`);
  } catch (error) {
    console.error("Lỗi khi cập nhật role:", error);
    throw error;
  }
}

/**
 * Lấy danh sách tất cả người dùng
 * @returns {Promise<Array>} Danh sách tất cả người dùng
 */
export async function getAllUsers() {
  try {
    const usersCollection = collection(db, "users");
    
    const snapshot = await getDocs(usersCollection);
    
    const users = [];
    snapshot.forEach((doc) => {
      const userData = {
        uid: doc.id, // Document ID chính là Firebase Auth UID
        id: doc.id,  // Giữ lại cho tương thích
        ...doc.data()
      };
      users.push(userData);
    });
    
    // Sắp xếp theo role (owner > admin > member > user) rồi theo tên
    users.sort((a, b) => {
      const roleOrder = { owner: 4, admin: 3, member: 2, user: 1 };
      const roleCompare = (roleOrder[b.role] || 0) - (roleOrder[a.role] || 0);
      if (roleCompare !== 0) return roleCompare;
      
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
    
    return users;
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách users:", error);
    throw error;
  }
}

/**
 * Tạo real-time listener cho danh sách users
 * @param {function} callback - Function được gọi khi dữ liệu thay đổi
 * @returns {function} Unsubscribe function
 */
export function subscribeToUsers(callback) {
  try {
    const usersCollection = collection(db, "users");
    
    const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
      const users = [];
      snapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sắp xếp theo role (owner > admin > member > user) rồi theo tên
      users.sort((a, b) => {
        const roleOrder = { owner: 4, admin: 3, member: 2, user: 1 };
        const roleCompare = (roleOrder[b.role] || 0) - (roleOrder[a.role] || 0);
        if (roleCompare !== 0) return roleCompare;
        
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      console.log("Real-time update - Users loaded:", users.length);
      callback(users);
    }, (error) => {
      console.error("Lỗi real-time listener cho users:", error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error("Lỗi khi tạo listener cho users:", error);
    throw error;
  }
}

/**
 * Tạo real-time listener cho thông tin user cụ thể
 * @param {string} userId - ID của user
 * @param {function} callback - Function được gọi khi dữ liệu thay đổi
 * @returns {function} Unsubscribe function
 */
export function subscribeToUserInfo(userId, callback) {
  try {
    const userDoc = doc(db, "users", userId);
    
    const unsubscribe = onSnapshot(userDoc, (doc) => {
      if (doc.exists()) {
        const userData = {
          uid: doc.id,
          id: doc.id,
          ...doc.data()
        };
        console.log("Real-time update - User info:", userData.firstName, userData.lastName);
        callback(userData);
      } else {
        console.log("User document does not exist");
        callback(null);
      }
    }, (error) => {
      console.error("Lỗi real-time listener cho user info:", error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error("Lỗi khi tạo listener cho user info:", error);
    throw error;
  }
}
