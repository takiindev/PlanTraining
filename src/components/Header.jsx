import { useState, useEffect } from "react";
import { logout, getCurrentUserEmail, getUserByEmail } from "../services/tokenService";
import { getUserInfo, subscribeToUserInfo } from "../services/userService";
import { getUserRelatedClasses, subscribeToUserRelatedClasses } from "../services/classService";
import { useNotification } from "../contexts/NotificationContext";
import { realtimeManager } from "../services/realtimeManager";
import { appConfig } from "../utils/envUtils";
import { useNavigate, useLocation } from "react-router-dom";
import viteLogo from "/vite.svg";
import "./Header.css";

function Header() {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [forceUpdate, setForceUpdate] = useState(0);
  const { refreshTrigger } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (userInfo) {
      setForceUpdate(prev => prev + 1);
    }
  }, [userInfo]);

  // Function để lấy title theo pathname
  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/role-management':
        return 'Quản lý Vai trò';
      case '/profile':
        return 'Hồ sơ cá nhân';
      case '/login':
        return 'Đăng nhập';
      case '/register':
        return 'Đăng ký';
      default:
        return appConfig.name;
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
            
            // Setup real-time listeners cho user info và notifications
            setupRealTimeListeners(accountData.id);
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

  // Setup all real-time listeners using realtimeManager
  const setupRealTimeListeners = (userId) => {
    // Subscribe to user info changes
    realtimeManager.subscribeUserInfo(userId, (updatedUserInfo) => {
      if (updatedUserInfo) {
        setUserInfo(updatedUserInfo);
        
        // Force re-render nếu có avatar mới
        if (updatedUserInfo.avatarUrl && updatedUserInfo.avatarUrl !== userInfo?.avatarUrl) {
          // Trigger component re-render
          setUserInfo({...updatedUserInfo});
        }
      }
    }, `header-userInfo-${userId}`);

    // Subscribe to user related classes for notifications
    realtimeManager.subscribeUserClasses(userId, (userClasses) => {
      
      // Lọc các buổi dạy từ hôm nay đến 7 ngày tới
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const upcomingClasses = userClasses.filter(cls => {
        const classDate = cls.date.toDate ? cls.date.toDate() : new Date(cls.date);
        classDate.setHours(0, 0, 0, 0);
        return classDate >= today && classDate <= nextWeek;
      });
      
      setNotifications(upcomingClasses);
    }, `header-userClasses-${userId}`);
  };

  // Cleanup all listeners khi component unmount
  useEffect(() => {
    return () => {
      // Clean up header-specific listeners
      if (user?.id) {
        realtimeManager.unsubscribe(`header-userInfo-${user.id}`);
        realtimeManager.unsubscribe(`header-userClasses-${user.id}`);
      }
    };
  }, [user?.id]);  // Cleanup listener khi component unmount
  
  // Listen for storage changes để update khi avatar thay đổi
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'cachedUserInfo') {
        try {
          const newUserInfo = JSON.parse(e.newValue);
          if (newUserInfo && newUserInfo.avatarUrl !== userInfo?.avatarUrl) {
            setUserInfo(newUserInfo);
          }
        } catch (error) {
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [userInfo?.avatarUrl]);
  
  useEffect(() => {
    return () => {
      if (window.notificationsUnsubscribe) {
        window.notificationsUnsubscribe();
      }
    };
  }, []);

  // Thêm effect để refresh thông báo mỗi 5 phút
  useEffect(() => {
    if (user?.id) {
      const interval = setInterval(() => {
        loadNotifications(user.id);
      }, 5 * 60 * 1000); // 5 phút

      return () => clearInterval(interval);
    }
  }, [user?.id]);

  // Effect để refresh thông báo khi có trigger từ context
  useEffect(() => {
    if (user?.id && refreshTrigger > 0) {
      loadNotifications(user.id);
    }
  }, [refreshTrigger, user?.id]);

  // Thêm effect để refresh thông báo mỗi 5 phút (backup cho trường hợp listener bị lỗi)
  useEffect(() => {
    if (user?.id) {
      const interval = setInterval(() => {
        // Chỉ làm backup, real-time listener sẽ xử lý chính
      }, 5 * 60 * 1000); // 5 phút

      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const handleNotificationClick = (classItem) => {
    // Đóng dropdown thông báo
    setShowNotifications(false);
    
    // Chuyển đến dashboard và set ngày được chọn
    const classDate = classItem.date.toDate ? classItem.date.toDate() : new Date(classItem.date);
    
    // Sử dụng localStorage để truyền thông tin ngày được chọn
    localStorage.setItem('selectedDate', classDate.toISOString());
    
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
    } else {
      // Nếu đã ở dashboard, reload trang để trigger effect
      window.location.reload();
    }
  };

  const getRoleText = (userRole) => {
    switch (userRole) {
      case 'mentor': return 'Mentor chính';
      case 'support': return 'Mentor hỗ trợ';
      case 'manager': return 'Người xếp lịch';
      default: return '';
    }
  };

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
            {appConfig.name}
          </span>
          <span className="header-title-page">
            {getPageTitle(location.pathname)}
          </span>
        </div>
      </div>

      {/* User Info */}
      <div className="header-user-container">
        {/* Notification Bell */}
        <div className="header-notifications">
          <div
            onClick={() => setShowNotifications(!showNotifications)}
            className={`notification-bell ${showNotifications ? 'active' : ''}`}
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {notifications.length > 0 && (
              <span className="notification-badge">{notifications.length}</span>
            )}
          </div>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <h4>Buổi dạy sắp tới</h4>
                <span className="notifications-count">
                  {notifications.length} thông báo
                </span>
              </div>
              
              <div className="notifications-list">
                {notifications.length === 0 ? (
                  <div className="no-notifications">
                    <span>📅</span>
                    <p>Không có buổi dạy nào trong tuần tới</p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const classDate = notification.date.toDate ? notification.date.toDate() : new Date(notification.date);
                    return (
                      <div
                        key={notification.id}
                        className="notification-item"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="notification-content">
                          <div className="notification-title">
                            {notification.topic}
                          </div>
                          <div className="notification-details">
                            <span className="notification-date">
                              📅 {classDate.toLocaleDateString('vi-VN')}
                            </span>
                            <span className="notification-time">
                              ⏰ {notification.startTime} - {notification.endTime}
                            </span>
                          </div>
                          <div className="notification-role">
                            {getRoleText(notification.userRole)}
                          </div>
                        </div>
                        <div className="notification-arrow">→</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div
          onClick={() => setShowDropdown(!showDropdown)}
          className={`header-user-info ${showDropdown ? 'active' : ''}`}
        >
          {/* Avatar */}
          <div className="header-avatar">
            {userInfo?.avatarUrl ? (
              <img 
                src={userInfo.avatarUrl} 
                alt="Avatar" 
                className="header-avatar-image"
                key={userInfo.avatarUrl} // Force re-render when URL changes
                onLoad={() => {
                }}
                onError={(e) => {
                  // Fallback về text initials nếu ảnh load lỗi
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="header-avatar-text"
              style={{ 
                display: userInfo?.avatarUrl ? 'none' : 'flex' 
              }}
            >
              {userInfo ? 
                `${userInfo.lastName.charAt(0)}${userInfo.firstName.charAt(0)}` : 
                user?.email?.charAt(0)?.toUpperCase() || "U"
              }
            </div>
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
              
              {/* Chỉ hiển thị "Quản lý Vai trò" khi user có role owner hoặc admin */}
              {(() => {
                return userInfo?.role === 'owner' || userInfo?.role === 'admin';
              })() && (
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    navigate("/role-management");
                  }}
                  className="header-dropdown-item"
                >
                  👥 Quản lý Vai trò
                </button>
              )}
              
              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate("/profile");
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
      {(showDropdown || showNotifications) && (
        <div
          onClick={() => {
            setShowDropdown(false);
            setShowNotifications(false);
          }}
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
