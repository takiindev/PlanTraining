import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { updateUserRole, saveUserInfo } from "./userService";

/**
 * Kiểm tra và tạo admin đầu tiên nếu chưa có
 * @returns {Promise<void>}
 */
export async function ensureAdminExists() {
  try {
    // Kiểm tra xem đã có admin nào chưa
    const q = query(
      collection(db, "users"),
      where("role", "==", "admin")
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("Không tìm thấy admin nào trong hệ thống");
      
      // Lấy user đầu tiên để làm admin
      const allUsersQuery = query(collection(db, "users"));
      const allUsersSnapshot = await getDocs(allUsersQuery);
      
      if (!allUsersSnapshot.empty) {
        const firstUser = allUsersSnapshot.docs[0];
        const userId = firstUser.id;
        const userData = firstUser.data();
        
        // Nâng cấp user đầu tiên thành admin
        await updateUserRole(userId, "admin");
        console.log(`Đã nâng cấp user ${userData.lastName} ${userData.firstName} (${userData.email}) thành admin đầu tiên`);
        
        return {
          success: true,
          message: `${userData.lastName} ${userData.firstName} đã được nâng cấp thành admin đầu tiên`,
          userId: userId
        };
      } else {
        console.log("Không có user nào trong hệ thống");
        return {
          success: false,
          message: "Không có user nào trong hệ thống để nâng cấp thành admin"
        };
      }
    } else {
      console.log("Đã có admin trong hệ thống");
      return {
        success: true,
        message: "Hệ thống đã có admin"
      };
    }
  } catch (error) {
    console.error("Lỗi khi kiểm tra admin:", error);
    throw error;
  }
}

/**
 * Tạo một số member mẫu cho test (chỉ dùng trong development)
 * @param {Array} userIds - Danh sách ID của users cần nâng cấp thành member
 * @returns {Promise<void>}
 */
export async function createSampleMembers(userIds = []) {
  try {
    if (userIds.length === 0) {
      // Lấy một số users có role "user" để nâng cấp
      const q = query(
        collection(db, "users"),
        where("role", "==", "user")
      );
      
      const querySnapshot = await getDocs(q);
      const users = [];
      
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      
      // Nâng cấp 2 user đầu tiên thành member
      const usersToPromote = users.slice(0, 2);
      
      for (const user of usersToPromote) {
        await updateUserRole(user.id, "member");
        console.log(`Đã nâng cấp ${user.lastName} ${user.firstName} thành member`);
      }
      
      return {
        success: true,
        promoted: usersToPromote.length,
        message: `Đã tạo ${usersToPromote.length} member mẫu`
      };
    } else {
      // Nâng cấp các user được chỉ định
      for (const userId of userIds) {
        await updateUserRole(userId, "member");
      }
      
      return {
        success: true,
        promoted: userIds.length,
        message: `Đã nâng cấp ${userIds.length} user thành member`
      };
    }
  } catch (error) {
    console.error("Lỗi khi tạo member mẫu:", error);
    throw error;
  }
}

/**
 * Tạo fake users cho testing (chỉ dùng trong development)
 * @returns {Promise<void>}
 */
export async function createFakeUsers() {
  try {
    const fakeUsers = [
      {
        id: "fake_user_1",
        firstName: "Minh",
        lastName: "Nguyễn Văn",
        email: "minh.nguyen@test.com",
        role: "user"
      },
      {
        id: "fake_user_2", 
        firstName: "Hoa",
        lastName: "Trần Thị",
        email: "hoa.tran@test.com",
        role: "member"
      },
      {
        id: "fake_user_3",
        firstName: "Tuấn",
        lastName: "Lê Văn", 
        email: "tuan.le@test.com",
        role: "user"
      },
      {
        id: "fake_user_4",
        firstName: "Linh",
        lastName: "Phạm Thị",
        email: "linh.pham@test.com", 
        role: "member"
      },
      {
        id: "fake_user_5",
        firstName: "Dũng",
        lastName: "Hoàng Văn",
        email: "dung.hoang@test.com",
        role: "admin"
      }
    ];

    for (const user of fakeUsers) {
      await saveUserInfo(user.id, {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      });
      console.log(`Đã tạo fake user: ${user.lastName} ${user.firstName} (${user.role})`);
    }

    return {
      success: true,
      created: fakeUsers.length,
      message: `Đã tạo ${fakeUsers.length} fake users để testing`
    };
  } catch (error) {
    console.error("Lỗi khi tạo fake users:", error);
    throw error;
  }
}
