import { collection, query, orderBy, getDocs, where } from "firebase/firestore";
import { db } from "../firebase";
import { updateUserRole } from "./userService";

/**
 * Lấy tất cả users (chỉ admin có quyền)
 * @returns {Promise<Array>} Danh sách tất cả users
 */
export async function getAllUsers() {
  try {
    const q = query(
      collection(db, "users"),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const users = [];
    
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return users;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách users:", error);
    throw error;
  }
}

/**
 * Lấy users theo role
 * @param {string} role - Role cần lọc
 * @returns {Promise<Array>} Danh sách users theo role
 */
export async function getUsersByRole(role) {
  try {
    const q = query(
      collection(db, "users"),
      where("role", "==", role),
      orderBy("lastName", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const users = [];
    
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return users;
  } catch (error) {
    console.error("Lỗi khi lấy users theo role:", error);
    throw error;
  }
}

/**
 * Thăng cấp user thành member (admin có thể thực hiện)
 * @param {string} userId - ID của user
 * @returns {Promise<void>}
 */
export async function promoteToMember(userId) {
  try {
    await updateUserRole(userId, "member");
    console.log(`User ${userId} đã được thăng cấp thành member`);
  } catch (error) {
    console.error("Lỗi khi thăng cấp user:", error);
    throw error;
  }
}

/**
 * Thăng cấp member thành admin (chỉ admin hiện tại có thể thực hiện)
 * @param {string} userId - ID của member
 * @returns {Promise<void>}
 */
export async function promoteToAdmin(userId) {
  try {
    await updateUserRole(userId, "admin");
    console.log(`User ${userId} đã được thăng cấp thành admin`);
  } catch (error) {
    console.error("Lỗi khi thăng cấp admin:", error);
    throw error;
  }
}

/**
 * Hạ cấp user về role thấp hơn
 * @param {string} userId - ID của user
 * @param {string} newRole - Role mới ("user" hoặc "member")
 * @returns {Promise<void>}
 */
export async function demoteUser(userId, newRole) {
  try {
    await updateUserRole(userId, newRole);
    console.log(`User ${userId} đã được hạ cấp xuống ${newRole}`);
  } catch (error) {
    console.error("Lỗi khi hạ cấp user:", error);
    throw error;
  }
}

/**
 * Thống kê users theo role
 * @returns {Promise<Object>} Object chứa số lượng users theo từng role
 */
export async function getUserStats() {
  try {
    const allUsers = await getAllUsers();
    
    const stats = {
      total: allUsers.length,
      admin: allUsers.filter(user => user.role === "admin").length,
      member: allUsers.filter(user => user.role === "member").length,
      user: allUsers.filter(user => user.role === "user").length
    };
    
    return stats;
  } catch (error) {
    console.error("Lỗi khi lấy thống kê users:", error);
    throw error;
  }
}
