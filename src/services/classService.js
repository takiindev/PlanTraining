import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, deleteDoc, doc } from "firebase/firestore";
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
    
    console.log("Lớp học được tạo với ID:", docRef.id);
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
    
    console.log("Lớp học đã được cập nhật:", classId);
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
    console.log("Lớp học đã được xóa:", classId);
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
    
    console.log("Danh sách mentors:", mentors); // Debug log
    return mentors;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách mentor:", error);
    throw error;
  }
}
