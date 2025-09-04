import './Login.css'
import { useState } from "react";
import { loginAccount } from "../../services/accountService";
import { Link, useNavigate } from "react-router-dom";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        try {
            const result = await loginAccount(email, password);
            
            if (result.success) {
                alert(`Đăng nhập thành công! Chào mừng ${result.user.email}`);
                // Redirect to dashboard or home page
                navigate("/dashboard");
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err.message || "Có lỗi xảy ra khi đăng nhập!";
            alert(`Lỗi đăng nhập: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login">
            <div className="login-container">
                <h1 className="login-title">Đăng Nhập</h1>
                <form className="login-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email:</label>
                        <input
                            className="form-input"
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password:</label>
                        <input
                            className="form-input"
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button 
                        className="login-button" 
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
                    </button>
                </form>

                <p style={{ textAlign: "center", marginTop: "16px" }}>
                    Chưa có tài khoản?{" "}
                    <Link to="/register" style={{ color: "#ff7eb3", fontWeight: "600" }}>
                        Đăng ký
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Login
