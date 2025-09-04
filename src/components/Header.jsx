import { useState, useEffect } from "react";
import { logout, getCurrentUserEmail, getUserByEmail } from "../services/tokenService";
import { getUserInfo } from "../services/userService";
import { useNavigate, useLocation } from "react-router-dom";
import viteLogo from "/vite.svg";
import "./Header.css";

function Header() {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Function để lấy title theo pathname
  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/role-management':
        return 'Quản lý Vai trò';
      case '/login':
        return 'Đăng nhập';
      case '/register':
        return 'Đăng ký';
      default:
        return 'PlanTraining';
    }
  };

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const userEmail = getCurrentUserEmail();
        if (userEmail) {
          // Lấy thông tin tài khoản
          const accountData = await getUserByEmail(userEmail);
          if (accountData) {
            setUser({ email: userEmail, id: accountData.id });
            
            // Lấy thông tin chi tiết người dùng
            const detailInfo = await getUserInfo(accountData.id);
            setUserInfo(detailInfo);
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải thông tin người dùng:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserInfo();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <header className="header-loading">
        <div className="header-loading-text">Đang tải...</div>
      </header>
    );
  }

  return (
    <header className="header">
      {/* Logo/Brand */}
      <div className="header-brand">
        <img 
          src={viteLogo} 
          alt="Logo" 
          className="header-logo"
        />
        <div className="header-title-container">
          <span className="header-title-main">
            PlanTraining
          </span>
          <span className="header-title-page">
            {getPageTitle(location.pathname)}
          </span>
        </div>
      </div>

      {/* User Info */}
      <div className="header-user-container">
        <div
          onClick={() => setShowDropdown(!showDropdown)}
          className={`header-user-info ${showDropdown ? 'active' : ''}`}
        >
          {/* Avatar */}
          <div className="header-avatar">
            {userInfo ? 
              `${userInfo.lastName.charAt(0)}${userInfo.firstName.charAt(0)}` : 
              user?.email?.charAt(0)?.toUpperCase() || "U"
            }
          </div>

          {/* User Info */}
          <div className="header-user-details">
            <div className="header-user-name">
              {userInfo ? `${userInfo.lastName} ${userInfo.firstName}` : user?.email}
            </div>
          </div>

          {/* Dropdown Arrow */}
          <div className={`header-dropdown-arrow ${showDropdown ? 'rotated' : ''}`}>
            ▼
          </div>
        </div>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="header-dropdown">
            {/* User Info Section */}
            <div className="header-dropdown-user-info">
              <div className="header-dropdown-user-name">
                {userInfo ? `${userInfo.lastName} ${userInfo.firstName}` : "Người dùng"}
              </div>
              <div className="header-dropdown-user-email">
                {user?.email}
              </div>
            </div>

            {/* Menu Items */}
            <div className="header-dropdown-menu">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate("/dashboard");
                }}
                className="header-dropdown-item"
              >
                🏠 Dashboard
              </button>
              
              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate("/role-management");
                }}
                className="header-dropdown-item"
              >
                👥 Quản lý Vai trò
              </button>
              
              <button
                onClick={() => {
                  setShowDropdown(false);
                  // Navigate to profile page (if exists)
                }}
                className="header-dropdown-item"
              >
                👤 Hồ sơ cá nhân
              </button>

              <hr className="header-dropdown-divider" />

              <button
                onClick={() => {
                  setShowDropdown(false);
                  handleLogout();
                }}
                className="header-dropdown-item logout"
              >
                🚪 Đăng xuất
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          onClick={() => setShowDropdown(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
        />
      )}
    </header>
  );
}

export default Header;
