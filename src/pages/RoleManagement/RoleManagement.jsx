import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllUsers, updateUserRole, getUserInfo, subscribeToUsers } from "../../services/userService";
import { checkSession, getCurrentUserEmail, getUserByEmail } from "../../services/tokenService";
import { realtimeManager } from "../../services/realtimeManager";
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
      const isValid = await checkSession();
      if (!isValid) {
        navigate("/login");
        return;
      }

      const email = getCurrentUserEmail();
      const user = await getUserByEmail(email);
      
      if (user && user.id) {
        // Sử dụng user.id thay vì user.uid vì accounts collection dùng id
        const userInfo = await getUserInfo(user.id);
        setCurrentUser(userInfo);
        
        // Kiểm tra quyền owner hoặc admin
        if (userInfo?.role !== "owner" && userInfo?.role !== "admin") {
          navigate("/dashboard");
          return;
        }
        
      }
    } catch (error) {
      console.error("Lỗi load user info:", error);
      navigate("/login");
    }
  };

  // Load all users với real-time listener
  const loadAllUsers = () => {
    setLoading(true);
    
    // Sử dụng realtimeManager để subscribe users
    realtimeManager.subscribeUsers((users) => {
      // Safety check for users array
      if (Array.isArray(users)) {
        setAllUsers(users);
      } else {
        setAllUsers([]);
      }
      
      setLoading(false);
    }, 'roleManagement-users');
  };

  // Thay đổi role của user
  const handleRoleChange = async (userId, newRole) => {
    try {
      // Kiểm tra quyền: owner hoặc admin mới có thể thay đổi role
      if (currentUser?.role !== "owner" && currentUser?.role !== "admin") {
        return;
      }

      // Không cho phép thay đổi role của chính mình
      if (userId === currentUser.id || userId === currentUser.uid) {
        return;
      }

      // Lấy thông tin user được thay đổi
      const targetUser = allUsers.find(user => user.id === userId || user.uid === userId);
      
      // Admin không được thay đổi role của owner hoặc admin khác
      if (currentUser?.role === "admin") {
        if (targetUser?.role === "owner" || targetUser?.role === "admin") {
          return;
        }
        // Admin chỉ có thể set role: user, member
        if (newRole === "admin" || newRole === "owner") {
          return;
        }
      }

      // Owner không được thay đổi role của owner khác
      if (targetUser?.role === "owner" && currentUser?.role === "owner") {
        return;
      }

      await updateUserRole(userId, newRole);
      
      // Không cần reload vì real-time listener sẽ tự động cập nhật
    } catch (error) {
      console.error("Lỗi khi thay đổi role:", error);
    }
  };

  useEffect(() => {
    loadCurrentUser();
    loadAllUsers();
    
    // Cleanup khi component unmount
    return () => {
      realtimeManager.unsubscribe('roleManagement-users');
    };
  }, []);

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
    // Safety check: ensure allUsers is array and filter out null/undefined users
    const safeAllUsers = Array.isArray(allUsers) ? allUsers.filter(user => user != null) : [];
    
    let filteredUsers = safeAllUsers.filter(user => (user.id || user.uid) !== (currentUser?.id || currentUser?.uid));
    
    // Filter theo search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user?.firstName?.toLowerCase().includes(searchLower) ||
        user?.lastName?.toLowerCase().includes(searchLower) ||
        user?.email?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter theo role
    if (selectedRole !== "all") {
      filteredUsers = filteredUsers.filter(user => user?.role === selectedRole);
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
          <strong>
            {currentUser?.role === 'owner' 
              ? 'Owner có quyền quản lý vai trò của tất cả thành viên' 
              : 'Admin có quyền quản lý vai trò User và Member'
            }
          </strong>
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
            Hiển thị {getFilteredUsers().length} trên {allUsers.filter(user => (user.id || user.uid) !== (currentUser?.id || currentUser?.uid)).length} người dùng
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Đang tải danh sách người dùng...</p>
          </div>
        ) : allUsers.length === 0 ? (
          <div className="loading-container">
            <p>Không có dữ liệu người dùng hoặc đang kết nối...</p>
            <button 
              onClick={() => {
                loadAllUsers();
              }}
              className="retry-btn"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <div className="user-list">
            {(() => {
              const filteredUsers = getFilteredUsers();
              
              if (filteredUsers.length === 0) {
                return (
                  <div className="no-results">
                    <p>
                      {searchTerm || selectedRole !== "all" 
                        ? "Không tìm thấy người dùng nào phù hợp với bộ lọc" 
                        : "Không có thành viên nào khác để quản lý"}
                    </p>
                  </div>
                );
              }
              
              return filteredUsers
                .filter(user => user != null) // Filter out null users
                .map((user) => (
              <div 
                key={user.id || user.uid}
                className="user-card"
              >
                <div className="user-info">
                  <div className="user-name" title={`${user.lastName || ''} ${user.firstName || ''}`}>
                     {user.lastName || ''} {user.firstName || ''}
                  </div>
                  <div className="user-email" title={user.email || 'Email không có'}>
                    {user.email || 'Email không có'}
                  </div>
                </div>
                
                <div className="user-actions">
                  {(user.role === "owner" || (currentUser?.role === "admin" && (user.role === "admin" || user.role === "owner"))) ? (
                    <span className="no-change-text">Không thể thay đổi</span>
                  ) : (
                    <div className="role-tab-buttons">
                      <button
                        className={`role-tab-btn ${user.role === 'user' ? 'active' : ''}`}
                        onClick={() => handleRoleChange(user.id || user.uid, 'user')}
                      >
                        User
                      </button>
                      <button
                        className={`role-tab-btn ${user.role === 'member' ? 'active' : ''}`}
                        onClick={() => handleRoleChange(user.id || user.uid, 'member')}
                      >
                        Member
                      </button>
                      {currentUser?.role === 'owner' && (
                        <>
                          <button
                            className={`role-tab-btn ${user.role === 'admin' ? 'active' : ''}`}
                            onClick={() => handleRoleChange(user.id || user.uid, 'admin')}
                          >
                            Admin
                          </button>
                        </>
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
