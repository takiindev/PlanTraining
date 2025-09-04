import { useState, useEffect } from "react";
import { getAllUsers, updateUserRole } from "../services/userService";
import "./RoleManagement.css";

function RoleManagement({ isOpen, onClose, currentUser }) {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load tất cả users cho role management
  const loadAllUsers = async () => {
    try {
      setLoading(true);
      const users = await getAllUsers();
      setAllUsers(users);
    } catch (error) {
      console.error("Lỗi load users:", error);
      alert("Lỗi load danh sách users: " + error.message);
    } finally {
      setLoading(false);
    }
  };

    // Thay đổi role của user
  const handleRoleChange = async (userId, newRole) => {
    try {
      // Kiểm tra quyền: chỉ owner mới có thể thay đổi role
      if (currentUser?.role !== "owner") {
        alert("Chỉ owner mới có quyền quản lý vai trò!");
        return;
      }

      // Không cho phép thay đổi role của chính mình
      if (userId === currentUser.uid) {
        alert("Không thể thay đổi role của chính mình!");
        return;
      }

      // Không cho phép thay đổi role của owner khác
      const targetUser = allUsers.find(user => user.uid === userId);
      if (targetUser?.role === "owner") {
        alert("Không thể thay đổi role của Owner!");
        return;
      }

      await updateUserRole(userId, newRole);
      
      // Reload danh sách users
      loadAllUsers();
    } catch (error) {
      console.error("Lỗi cập nhật role:", error);
      alert("Lỗi cập nhật role: " + error.message);
    }
  };

  // Load users khi modal mở
  useEffect(() => {
    if (isOpen) {
      loadAllUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content role-management-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Quản lý vai trò người dùng</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="role-management-info">
            <strong>Chỉ Owner mới có quyền quản lý vai trò của tất cả thành viên</strong>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#a0aec0" }}>
              Đang tải danh sách người dùng...
            </div>
          ) : (
            <div className="user-list">
              {allUsers
                .filter(user => user.uid !== currentUser?.uid) // Ẩn current user
                .map((user) => (
                <div 
                  key={user.uid}
                  className="user-card"
                >
                  <div className="user-info">
                    <div className="user-name">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="user-email">
                      {user.email}
                    </div>
                  </div>
                  
                  <div className="user-actions">
                    {user.role === "owner" ? (
                      <span className="no-change-text">Không thể thay đổi</span>
                    ) : (
                      <div className="role-tab-buttons">
                        <button
                          className={`role-tab-btn ${user.role === 'user' ? 'active' : ''}`}
                          onClick={() => handleRoleChange(user.uid, 'user')}
                        >
                          User
                        </button>
                        <button
                          className={`role-tab-btn ${user.role === 'member' ? 'active' : ''}`}
                          onClick={() => handleRoleChange(user.uid, 'member')}
                        >
                          Member
                        </button>
                        {currentUser.role === 'owner' && (
                          <button
                            className={`role-tab-btn ${user.role === 'admin' ? 'active' : ''}`}
                            onClick={() => handleRoleChange(user.uid, 'admin')}
                          >
                            Admin
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoleManagement;
