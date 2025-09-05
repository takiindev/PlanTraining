import { cloudinaryConfig } from '../utils/envUtils';

/**
 * Service để quản lý upload avatar lên Cloudinary
 */

/**
 * Upload avatar lên Cloudinary
 * @param {File} file - File ảnh đã được crop
 * @param {string} userId - ID người dùng
 * @param {string} email - Email người dùng
 * @returns {Promise<string>} URL của ảnh trên Cloudinary
 */
export async function uploadAvatar(file, userId, email) {
  try {
    // Tạo FormData để upload
    const formData = new FormData();
    
    // Tên file theo format: userId_email.jpg
    const fileName = `${userId}_${email.replace('@', '_at_').replace('.', '_')}`;
    
    formData.append('file', file);
    formData.append('upload_preset', 'unsigned_upload'); // Cần tạo unsigned preset trên Cloudinary
    formData.append('folder', 'avatar');
    formData.append('public_id', fileName);
    formData.append('format', 'jpg');
    formData.append('quality', 'auto');
    formData.append('fetch_format', 'auto');

    // Upload lên Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Avatar uploaded to Cloudinary:', result.secure_url);
    
    return result.secure_url;
  } catch (error) {
    console.error('Lỗi khi upload avatar:', error);
    throw error;
  }
}

/**
 * Tạo URL avatar từ public_id
 * @param {string} userId - ID người dùng
 * @param {string} email - Email người dùng
 * @returns {string} URL của avatar
 */
export function getAvatarUrl(userId, email) {
  const fileName = `${userId}_${email.replace('@', '_at_').replace('.', '_')}`;
  return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/f_auto,q_auto,w_150,h_150,c_fill/avatar/${fileName}`;
}

/**
 * Kiểm tra xem avatar có tồn tại trên Cloudinary không
 * @param {string} userId - ID người dùng  
 * @param {string} email - Email người dùng
 * @returns {Promise<boolean>} True nếu avatar tồn tại
 */
export async function checkAvatarExists(userId, email) {
  try {
    const avatarUrl = getAvatarUrl(userId, email);
    const response = await fetch(avatarUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.log('Avatar không tồn tại:', error.message);
    return false;
  }
}

/**
 * Xóa avatar cũ trên Cloudinary (nếu cần)
 * @param {string} userId - ID người dùng
 * @param {string} email - Email người dùng
 */
export async function deleteAvatar(userId, email) {
  try {
    const fileName = `${userId}_${email.replace('@', '_at_').replace('.', '_')}`;
    
    // Tạo signature để xóa (cần API secret)
    // Chức năng này sẽ cần server-side implementation hoặc signed upload preset
    console.log('Xóa avatar:', fileName);
  } catch (error) {
    console.error('Lỗi khi xóa avatar:', error);
  }
}
