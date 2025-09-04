import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
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
    
    console.log("Thông tin người dùng đã được lưu với ID:", userId);
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
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (userDoc.exists()) {
      return {
        uid: userDoc.id, // Document ID chính là Firebase Auth UID
        id: userDoc.id,  // Giữ lại cho tương thích
        ...userDoc.data()
      };
    } else {
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
    
    console.log("Thông tin người dùng đã được cập nhật:", userId);
  } catch (error) {
    console.error("Lỗi khi cập nhật thông tin người dùng:", error);
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

    await setDoc(doc(db, "users", userId), {
      role: newRole,
      updatedAt: new Date()
    }, { merge: true });
    
    console.log(`Role của user ${userId} đã được cập nhật thành: ${newRole}`);
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
    console.log("🔍 Bắt đầu getAllUsers...");
    const usersCollection = collection(db, "users");
    console.log("📁 Users collection reference:", usersCollection);
    
    const snapshot = await getDocs(usersCollection);
    console.log("📊 Snapshot received, size:", snapshot.size);
    console.log("📊 Snapshot empty:", snapshot.empty);
    
    const users = [];
    snapshot.forEach((doc) => {
      const userData = {
        uid: doc.id, // Document ID chính là Firebase Auth UID
        id: doc.id,  // Giữ lại cho tương thích
        ...doc.data()
      };
      console.log("👤 User found:", doc.id, userData);
      users.push(userData);
    });
    
    console.log("📋 Total users before sorting:", users.length);
    
    // Sắp xếp theo role (owner > admin > member > user) rồi theo tên
    users.sort((a, b) => {
      const roleOrder = { owner: 4, admin: 3, member: 2, user: 1 };
      const roleCompare = (roleOrder[b.role] || 0) - (roleOrder[a.role] || 0);
      if (roleCompare !== 0) return roleCompare;
      
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
    
    console.log("✅ Final users array:", users);
    return users;
  } catch (error) {
    console.error("❌ Lỗi khi lấy danh sách users:", error);
    throw error;
  }
}
