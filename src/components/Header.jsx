import { useState, useEffect } from "react";
import { logout, getCurrentUserEmail, getUserByEmail } from "../services/tokenService";
import { getUserInfo } from "../services/userService";
import { useNavigate } from "react-router-dom";

function Header() {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

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
      <header style={{
        background: "#fff",
        borderBottom: "1px solid #e2e8f0",
        padding: "0 20px",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end"
      }}>
        <div style={{ color: "#718096" }}>Đang tải...</div>
      </header>
    );
  }

  return (
    <header style={{
      background: "#fff",
      borderBottom: "1px solid #e2e8f0",
      padding: "0 20px",
      height: "64px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 1000,
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
    }}>
      {/* Logo/Brand */}
      <div style={{
        fontSize: "20px",
        fontWeight: "bold",
        color: "#2d3748"
      }}>
        MyApp
      </div>

      {/* User Info */}
      <div style={{ position: "relative" }}>
        <div
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "8px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "background-color 0.2s",
            background: showDropdown ? "#f7fafc" : "transparent"
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = "#f7fafc"}
          onMouseLeave={(e) => e.target.style.backgroundColor = showDropdown ? "#f7fafc" : "transparent"}
        >
          {/* Avatar */}
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: "bold",
            fontSize: "16px"
          }}>
            {userInfo ? 
              `${userInfo.lastName.charAt(0)}${userInfo.firstName.charAt(0)}` : 
              user?.email?.charAt(0)?.toUpperCase() || "U"
            }
          </div>

          {/* User Info */}
          <div style={{ textAlign: "left" }}>
            <div style={{
              fontWeight: "600",
              color: "#2d3748",
              fontSize: "14px"
            }}>
              {userInfo ? `${userInfo.lastName} ${userInfo.firstName}` : user?.email}
            </div>
          </div>

          {/* Dropdown Arrow */}
          <div style={{
            color: "#718096",
            fontSize: "12px",
            transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s"
          }}>
            ▼
          </div>
        </div>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div style={{
            position: "absolute",
            top: "100%",
            right: "0",
            marginTop: "8px",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
            minWidth: "200px",
            zIndex: 1001
          }}>
            {/* User Info Section */}
            <div style={{
              padding: "16px",
              borderBottom: "1px solid #e2e8f0"
            }}>
              <div style={{ fontWeight: "600", color: "#2d3748", marginBottom: "4px" }}>
                {userInfo ? `${userInfo.lastName} ${userInfo.firstName}` : "Người dùng"}
              </div>
              <div style={{ fontSize: "12px", color: "#718096" }}>
                {user?.email}
              </div>
            </div>

            {/* Menu Items */}
            <div style={{ padding: "8px 0" }}>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  navigate("/dashboard");
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  background: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#4a5568"
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#f7fafc"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
              >
                🏠 Dashboard
              </button>
              
              <button
                onClick={() => {
                  setShowDropdown(false);
                  // Navigate to profile page (if exists)
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  background: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#4a5568"
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#f7fafc"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
              >
                👤 Hồ sơ cá nhân
              </button>

              <hr style={{ margin: "8px 0", border: "none", borderTop: "1px solid #e2e8f0" }} />

              <button
                onClick={() => {
                  setShowDropdown(false);
                  handleLogout();
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  background: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#e53e3e"
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#fed7d7"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
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
