import { cloudinaryConfig } from '../config/cloudinary';

/**
 * Upload avatar lên Cloudinary
 * @param {File} file - File ảnh cần upload
 * @param {string} userId - ID người dùng
 * @param {string} email - Email người dùng
 * @returns {Promise<string>} URL của ảnh trên Cloudinary
 */
export async function uploadAvatar(file, userId, email) {
  try {
    // Tạo FormData
    const formData = new FormData();
    const fileName = `avatar_${userId}_${Date.now()}`;
    
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    formData.append('public_id', fileName);
    formData.append('folder', 'avatars');
    formData.append('resource_type', 'image');

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${responseText}`);
    }

    const result = JSON.parse(responseText);
    
    return result.secure_url;
  } catch (error) {
    console.error('Upload error:', error);
    
    // Thử fallback upload
    return await uploadAvatarFallback(file, userId, email);
  }
}

/**
 * Fallback upload nếu upload chính thất bại
 */
async function uploadAvatarFallback(file, userId, email) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', cloudinaryConfig.apiKey);
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    const responseText = await response.text();

    if (response.ok) {
      const result = JSON.parse(responseText);
      return result.secure_url;
    } else {
      throw new Error(`Fallback failed: ${response.status} - ${responseText}`);
    }
  } catch (error) {
    console.error('Fallback upload failed:', error);
    throw new Error(`Không thể upload avatar. Chi tiết: ${error.message}`);
  }
}

/**
 * Tạo URL avatar từ public_id
 * @param {string} userId - ID người dùng
 * @param {string} email - Email người dùng
 * @returns {string} URL của avatar
 */
export function createAvatarUrl(userId, email) {
  const fileName = `avatar_${userId}`;
  return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/c_fill,w_150,h_150/${fileName}`;
}

/**
 * Kiểm tra xem avatar có tồn tại trên Cloudinary không
 * @param {string} avatarUrl - URL của avatar
 * @returns {Promise<boolean>}
 */
export async function checkAvatarExists(avatarUrl) {
  try {
    const response = await fetch(avatarUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Xóa avatar khỏi Cloudinary
 * @param {string} fileName - Tên file cần xóa
 * @returns {Promise<boolean>}
 */
export async function deleteAvatar(fileName) {
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_id: fileName,
          api_key: cloudinaryConfig.apiKey,
        })
      }
    );

    const result = await response.json();
    return result.result === 'ok';
  } catch (error) {
    console.error('Lỗi khi xóa avatar:', error);
    return false;
  }
}
