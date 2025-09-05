import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Tạo lớp học mới
 * @param {Object} classData - Dữ liệu lớp học
 * @param {string} classData.topic - Chủ đề buổi học
 * @param {string} classData.mentor - Mentor chính
 * @param {string} classData.supportMentor - Mentor hỗ trợ
 * @param {string} classData.manager - Người xếp lịch
 * @param {Date} classData.date - Ngày học
 * @param {string} classData.startTime - Giờ bắt đầu
 * @param {string} classData.endTime - Giờ kết thúc
 * @param {string} classData.type - Loại lớp (online/offline)
 * @param {string} classData.location - Địa điểm (nếu offline)
 * @param {string} classData.meetingLink - Link meeting (nếu online)
 * @param {string} classData.description - Mô tả thêm
 * @returns {Promise<string>} ID của lớp học được tạo
 */
export async function createClass(classData) {
  try {
    const docRef = await addDoc(collection(db, "classes"), {
      ...classData,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "scheduled" // scheduled, completed, cancelled
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Lỗi khi tạo lớp học:", error);
    throw error;
  }
}

/**
 * Lấy danh sách lớp học theo tháng
 * @param {number} year - Năm
 * @param {number} month - Tháng (0-11)
 * @returns {Promise<Array>} Danh sách lớp học
 */
export async function getClassesByMonth(year, month) {
  try {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);
    
    const q = query(
      collection(db, "classes"),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const classes = [];
    
    querySnapshot.forEach((doc) => {
      classes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return classes;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách lớp học:", error);
    throw error;
  }
}

/**
 * Lấy danh sách lớp học theo tuần
 * @param {Date} startDate - Ngày bắt đầu tuần
 * @param {Date} endDate - Ngày kết thúc tuần
 * @returns {Promise<Array>} Danh sách lớp học trong tuần
 */
export async function getClassesByWeek(startDate, endDate) {
  try {
    const q = query(
      collection(db, "classes"),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const classes = [];
    
    querySnapshot.forEach((doc) => {
      classes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return classes;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách lớp học theo tuần:", error);
    throw error;
  }
}

/**
 * Cập nhật thông tin lớp học
 * @param {string} classId - ID lớp học
 * @param {Object} updateData - Dữ liệu cần cập nhật
 * @returns {Promise<void>}
 */
export async function updateClass(classId, updateData) {
  try {
    const classRef = doc(db, "classes", classId);
    await updateDoc(classRef, {
      ...updateData,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật lớp học:", error);
    throw error;
  }
}

/**
 * Xóa lớp học
 * @param {string} classId - ID lớp học
 * @returns {Promise<void>}
 */
export async function deleteClass(classId) {
  try {
    await deleteDoc(doc(db, "classes", classId));
  } catch (error) {
    console.error("Lỗi khi xóa lớp học:", error);
    throw error;
  }
}

/**
 * Lấy danh sách mentor
 * @returns {Promise<Array>} Danh sách mentor
 */
export async function getMentors() {
  try {
    // Lấy tất cả users trước, sau đó filter trong JavaScript
    const q = query(
      collection(db, "users"),
      orderBy("lastName", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const mentors = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      // Chỉ lấy users có role là member, admin hoặc owner
      if (userData.role === "member" || userData.role === "admin" || userData.role === "owner") {
        mentors.push({
          id: doc.id,
          ...userData
        });
      }
    });
    
    return mentors;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách mentor:", error);
    throw error;
  }
}

/**
 * Lấy danh sách lớp học mà user có liên quan (làm mentor chính, mentor hỗ trợ hoặc manager)
 * @param {string} userId - ID của user
 * @returns {Promise<Array>} Danh sách lớp học có liên quan đến user
 */
export async function getUserRelatedClasses(userId) {
  try {
    // Lấy tất cả classes từ tháng trước đến 2 tháng sau để đảm bảo không bỏ sót
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0, 23, 59, 59);
    
    console.log("Searching classes from", startDate, "to", endDate); // Debug log
    
    const q = query(
      collection(db, "classes"),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    const userClasses = [];
    
    querySnapshot.forEach((doc) => {
      const classData = { id: doc.id, ...doc.data() };
      
      // Kiểm tra xem user có liên quan đến class này không
      const isMainMentor = classData.mentor === userId;
      const isSupportMentor = classData.supportMentors && classData.supportMentors.includes(userId);
      const isManager = classData.manager === userId;
      
      if (isMainMentor || isSupportMentor || isManager) {
        userClasses.push({
          ...classData,
          userRole: isMainMentor ? 'mentor' : isSupportMentor ? 'support' : 'manager'
        });
        console.log("Found user class:", classData.topic, "Role:", isMainMentor ? 'mentor' : isSupportMentor ? 'support' : 'manager'); // Debug log
      }
    });
    
    console.log("Total user classes found:", userClasses.length); // Debug log
    return userClasses;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách lớp học của user:", error);
    throw error;
  }
}

/**
 * Tạo real-time listener cho classes theo tháng
 * @param {number} year - Năm
 * @param {number} month - Tháng (0-11)
 * @param {function} callback - Function được gọi khi dữ liệu thay đổi
 * @returns {function} Unsubscribe function
 */
export function subscribeToClassesByMonth(year, month, callback) {
  try {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);
    
    const q = query(
      collection(db, "classes"),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "asc")
    );
    
    // Tạo real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const classes = [];
      querySnapshot.forEach((doc) => {
        classes.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log("Real-time update - Classes loaded:", classes.length);
      callback(classes);
    }, (error) => {
      console.error("Lỗi real-time listener cho classes:", error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error("Lỗi khi tạo listener cho classes:", error);
    throw error;
  }
}

/**
 * Tạo real-time listener cho user related classes
 * @param {string} userId - ID của user
 * @param {function} callback - Function được gọi khi dữ liệu thay đổi
 * @returns {function} Unsubscribe function
 */
export function subscribeToUserRelatedClasses(userId, callback) {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0, 23, 59, 59);
    
    const q = query(
      collection(db, "classes"),
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "asc")
    );
    
    // Tạo real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userClasses = [];
      
      querySnapshot.forEach((doc) => {
        const classData = { id: doc.id, ...doc.data() };
        
        // Kiểm tra xem user có liên quan đến class này không
        const isMainMentor = classData.mentor === userId;
        const isSupportMentor = classData.supportMentors && classData.supportMentors.includes(userId);
        const isManager = classData.manager === userId;
        
        if (isMainMentor || isSupportMentor || isManager) {
          userClasses.push({
            ...classData,
            userRole: isMainMentor ? 'mentor' : isSupportMentor ? 'support' : 'manager'
          });
        }
      });
      
      console.log("Real-time update - User classes:", userClasses.length);
      callback(userClasses);
    }, (error) => {
      console.error("Lỗi real-time listener cho user classes:", error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error("Lỗi khi tạo listener cho user classes:", error);
    throw error;
  }
}
