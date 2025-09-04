import './Register.css'
import { useState } from "react";
import { saveAccount } from "../../services/accountService";
import { Link } from "react-router-dom";

function Register() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        // Kiểm tra các trường bắt buộc
        if (!firstName.trim() || !lastName.trim()) {
            setMessage("Vui lòng nhập đầy đủ họ tên!");
            return;
        }

        if (password !== confirmPassword) {
            setMessage("Mật khẩu nhập lại không khớp!");
            return;
        }

        setLoading(true);
        setMessage("");
        try {
            const id = await saveAccount(email, password, firstName.trim(), lastName.trim());
            setMessage(`Đăng ký thành công! Tài khoản đã được tạo với ID: ${id}. Bạn có thể đăng nhập ngay bây giờ.`);
            // Reset form
            setFirstName("");
            setLastName("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
        } catch (err) {
            console.error(err);
            // Show more specific error message
            const errorMessage = err.message || "Có lỗi xảy ra khi đăng ký!";
            setMessage(`Lỗi đăng ký: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register">
            <div className="register-container">
                <h1 className="register-title">Đăng Ký</h1>
                <form className="register-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="lastName">Họ và tên đệm:</label>
                        <input
                            className="form-input"
                            type="text"
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Ví dụ: Nguyễn Văn"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="firstName">Tên:</label>
                        <input
                            className="form-input"
                            type="text"
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Ví dụ: An"
                            required
                        />
                    </div>
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
                    <div className="form-group">
                        <label className="form-label" htmlFor="confirmPassword">Confirm Password:</label>
                        <input
                            className="form-input"
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button className="register-button" type="submit" disabled={loading}>
                        {loading ? "Registering..." : "Register"}
                    </button>
                    
                    {message && (
                        <div className="message" style={{ 
                            color: message.includes('thành công') ? 'green' : 'red', 
                            textAlign: 'center', 
                            marginTop: '10px' 
                        }}>
                            {message}
                        </div>
                    )}
                </form>

                <p style={{ textAlign: "center", marginTop: "16px" }}>
                    Đã có tài khoản?{" "}
                    <Link to="/login" style={{ color: "#ff7eb3", fontWeight: "600" }}>
                        Đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default Register;
