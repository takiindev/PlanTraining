import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { checkSession } from "../services/tokenService";
import Layout from "./Layout";

/**
 * Component Route được bảo vệ - kiểm tra xác thực trước khi render children
 * @param {Object} props - Props của component
 * @param {React.ReactNode} props.children - Các component con để render nếu đã xác thực
 * @returns {React.ReactNode} Loading spinner, redirect, hoặc children
 */
function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const isValid = await checkSession();
        setIsAuthenticated(isValid);
        
        if (!isValid) {
          navigate("/login", { replace: true });
        }
      } catch (error) {
        console.error("Lỗi xác thực:", error);
        setIsAuthenticated(false);
        navigate("/login", { replace: true });
      }
    };

    verifyAuth();
  }, [navigate]);

  // Hiển thị loading trong khi kiểm tra xác thực
  if (isAuthenticated === null) {
    return (
      <Layout>
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "calc(100vh - 64px)",
          fontSize: "18px",
          color: "#4a5568"
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ 
              marginBottom: "10px",
              fontSize: "20px"
            }}>
              🔒
            </div>
            Đang xác thực...
          </div>
        </div>
      </Layout>
    );
  }

  // Nếu chưa xác thực, trả về null (sẽ redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Nếu đã xác thực, render children với Layout
  return (
    <Layout>
      {children}
    </Layout>
  );
}

export default ProtectedRoute;
