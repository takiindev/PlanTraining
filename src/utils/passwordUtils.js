/**
 * Hash mật khẩu sử dụng Web Crypto API
 * @param {string} password - Mật khẩu cần hash
 * @returns {Promise<string>} Mật khẩu đã được hash
 */
export async function hashPassword(password) {
  try {
    // Chuyển password thành ArrayBuffer
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    // Hash sử dụng SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Chuyển hash thành hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  } catch (error) {
    console.error("Lỗi khi hash mật khẩu:", error);
    throw new Error("Không thể hash mật khẩu");
  }
}

/**
 * Kiểm tra mật khẩu có khớp với hash không
 * @param {string} password - Mật khẩu gốc
 * @param {string} hash - Hash để so sánh
 * @returns {Promise<boolean>} True nếu mật khẩu khớp
 */
export async function verifyPassword(password, hash) {
  try {
    const passwordHash = await hashPassword(password);
    return passwordHash === hash;
  } catch (error) {
    console.error("Lỗi khi verify mật khẩu:", error);
    return false;
  }
}

/**
 * Tạo salt ngẫu nhiên để tăng bảo mật (tùy chọn)
 * @param {number} length - Độ dài salt
 * @returns {string} Salt ngẫu nhiên
 */
export function generateSalt(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let salt = '';
  for (let i = 0; i < length; i++) {
    salt += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return salt;
}

/**
 * Hash mật khẩu với salt
 * @param {string} password - Mật khẩu gốc
 * @param {string} salt - Salt để mix với password
 * @returns {Promise<string>} Mật khẩu đã hash với salt
 */
export async function hashPasswordWithSalt(password, salt) {
  try {
    const saltedPassword = password + salt;
    return await hashPassword(saltedPassword);
  } catch (error) {
    console.error("Lỗi khi hash mật khẩu với salt:", error);
    throw error;
  }
}
