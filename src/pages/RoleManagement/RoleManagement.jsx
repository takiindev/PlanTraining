import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllUsers, updateUserRole, getUserInfo } from "../../services/userService";
import { checkSession, getCurrentUserEmail, getUserByEmail } from "../../services/tokenService";
import "./RoleManagement.css";

function RoleManagement() {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const navigate = useNavigate();

  // Load current user info
  const loadCurrentUser = async () => {
    try {
      console.log("Loading current user...");
      const isValid = await checkSession();
      if (!isValid) {
        console.log("Session invalid, redirecting to login");
        navigate("/login");
        return;
      }

      const email = getCurrentUserEmail();
      console.log("Current user email:", email);
      const user = await getUserByEmail(email);
      console.log("User from token service:", user);
      
      if (user && user.id) {
        // Sử dụng user.id thay vì user.uid vì accounts collection dùng id
        const userInfo = await getUserInfo(user.id);
        console.log("User info from userService:", userInfo);
        setCurrentUser(userInfo);
        
        // Kiểm tra quyền owner
        if (userInfo?.role !== "owner") {
          console.log("User role:", userInfo?.role, "- Not owner, redirecting");
          alert("Chỉ owner mới có quyền truy cập trang này!");
          navigate("/dashboard");
          return;
        }
        
        console.log("User is owner, proceeding...");
      } else {
        console.log("No user found or no ID");
      }
    } catch (error) {
      console.error("Lỗi load user info:", error);
      navigate("/login");
    }
  };

  // Load tất cả users cho role management
  const loadAllUsers = async () => {
    try {
      setLoading(true);
      console.log("Loading all users...");
      const users = await getAllUsers();
      console.log("Loaded users:", users);
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

  // Load users khi component mount
  useEffect(() => {
    loadCurrentUser();
  }, []);

  // Load users khi có currentUser
  useEffect(() => {
    if (currentUser) {
      loadAllUsers();
    }
  }, [currentUser]);

  // Filter users dựa trên search term và role
  const getFilteredUsers = () => {
    let filteredUsers = allUsers.filter(user => user.uid !== currentUser?.uid);
    
    // Filter theo search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter theo role
    if (selectedRole !== "all") {
      filteredUsers = filteredUsers.filter(user => user.role === selectedRole);
    }
    
    return filteredUsers;
  };

  return (
    <div className="role-management-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Quay lại
        </button>
        <h1>Quản lý vai trò người dùng</h1>
      </div>

      <div className="page-content">
        <div className="role-management-info">
          <strong>Chỉ Owner mới có quyền quản lý vai trò của tất cả thành viên</strong>
        </div>

        {/* Search và Filter Controls */}
        <div className="search-filter-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="clear-search-btn"
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>
          
          <div className="filter-box">
            <label htmlFor="role-filter">Lọc theo vai trò:</label>
            <select
              id="role-filter"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="role-filter-select"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="user">User</option>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          
          {(searchTerm || selectedRole !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedRole("all");
              }}
              className="clear-all-btn"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Results counter */}
        {!loading && allUsers.length > 0 && (
          <div className="results-counter">
            Hiển thị {getFilteredUsers().length} trên {allUsers.filter(user => user.uid !== currentUser?.uid).length} người dùng
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            Đang tải danh sách người dùng...
          </div>
        ) : (
          <div className="user-list">
            {(() => {
              const filteredUsers = getFilteredUsers();
              console.log("All users:", allUsers.length, "Filtered users:", filteredUsers.length, "Current user UID:", currentUser?.uid);
              
              if (allUsers.length === 0) {
                return (
                  <div className="loading-container">
                    Đang tải danh sách người dùng...
                  </div>
                );
              }
              
              if (filteredUsers.length === 0) {
                return (
                  <div className="loading-container">
                    {searchTerm || selectedRole !== "all" 
                      ? "Không tìm thấy người dùng nào phù hợp với bộ lọc" 
                      : "Không có thành viên nào khác để quản lý"}
                  </div>
                );
              }
              
              return filteredUsers.map((user) => (
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
              ));
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

export default RoleManagement;
