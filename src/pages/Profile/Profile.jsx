import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserEmail, getUserByEmail } from '../../services/tokenService';
import { getUserInfo, updateUserInfo } from '../../services/userService';
import { updateUserPassword } from '../../services/accountService';
import { uploadAvatar } from '../../services/cloudinaryService';
import AvatarCrop from '../../components/AvatarCrop';
import './Profile.css';

function Profile() {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showAvatarCrop, setShowAvatarCrop] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    // Preload user data từ cache nếu có
    const cachedUserInfo = localStorage.getItem('cachedUserInfo');
    if (cachedUserInfo) {
      try {
        const parsedUserInfo = JSON.parse(cachedUserInfo);
        console.log('Profile - Sử dụng cached user info');
        setUserInfo(parsedUserInfo);
        setFormData({
          firstName: parsedUserInfo.firstName || '',
          lastName: parsedUserInfo.lastName || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        if (parsedUserInfo.avatarUrl) {
          setAvatarUrl(parsedUserInfo.avatarUrl);
        }
      } catch (error) {
        console.log('Profile - Lỗi khi parse cached user info:', error);
      }
    }
  }, []);

  // Load thông tin người dùng
  const loadUserData = async () => {
    try {
      console.log('Profile - Bắt đầu load user data...');
      
      const userEmail = getCurrentUserEmail();
      if (!userEmail) {
        console.log('Profile - Không có user email, redirect to login');
        navigate('/login');
        return;
      }

      console.log('Profile - Đang lấy thông tin tài khoản cho email:', userEmail);
      
      // Lấy thông tin tài khoản
      const accountData = await getUserByEmail(userEmail);
      if (!accountData) {
        console.log('Profile - Không tìm thấy account data, redirect to login');
        navigate('/login');
        return;
      }

      console.log('Profile - Account data loaded:', accountData.id);
      setUser({ email: userEmail, id: accountData.id });

      // Lấy thông tin chi tiết
      console.log('Profile - Đang lấy user info...');
      const detailInfo = await getUserInfo(accountData.id);
      
      if (detailInfo) {
        console.log('Profile - User info loaded:', detailInfo);
        setUserInfo(detailInfo);
        
        // Cache user info để lần sau load nhanh hơn
        localStorage.setItem('cachedUserInfo', JSON.stringify(detailInfo));
        
        setFormData({
          firstName: detailInfo.firstName || '',
          lastName: detailInfo.lastName || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // Load avatar nếu có
        if (detailInfo.avatarUrl) {
          console.log('Profile - Avatar URL found:', detailInfo.avatarUrl);
          setAvatarUrl(detailInfo.avatarUrl);
        }
      } else {
        console.log('Profile - Không có detail info');
      }
      
      console.log('Profile - Load data hoàn tất');
    } catch (error) {
      console.error('Lỗi khi tải thông tin người dùng:', error);
      setErrors({ general: 'Không thể tải thông tin người dùng' });
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thay đổi input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Xóa error khi user typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Tên không được để trống';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Họ không được để trống';
    }

    // Validate password nếu đang thay đổi
    if (showPasswordSection) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
      }

      if (!formData.newPassword) {
        newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
      }

      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Xác nhận mật khẩu không khớp';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Lưu thông tin cá nhân
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setErrors({});
    setSuccessMessage('');

    try {
      // Cập nhật thông tin cá nhân
      await updateUserInfo(user.id, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim()
      });

      // Cập nhật mật khẩu nếu có
      if (showPasswordSection && formData.newPassword) {
        await updateUserPassword(user.email, formData.currentPassword, formData.newPassword);
        
        // Reset password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        setShowPasswordSection(false);
      }

      setSuccessMessage('Cập nhật thông tin thành công!');
      
      // Reload user data
      setTimeout(() => {
        loadUserData();
        setSuccessMessage('');
      }, 2000);

    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin:', error);
      setErrors({ general: error.message || 'Có lỗi xảy ra khi cập nhật thông tin' });
    } finally {
      setSaving(false);
    }
  };

  // Xử lý chọn file avatar
  const handleAvatarFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng file
    if (!file.type.startsWith('image/')) {
      setErrors({ avatar: 'Vui lòng chọn file ảnh' });
      return;
    }

    // Kiểm tra kích thước file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ avatar: 'Kích thước file không được vượt quá 5MB' });
      return;
    }

    setSelectedImageFile(file);
    setShowAvatarCrop(true);
    setErrors(prev => ({ ...prev, avatar: '' }));
  };

  // Xử lý sau khi crop xong
  const handleCropComplete = async (croppedFile) => {
    try {
      setSaving(true);
      setShowAvatarCrop(false);

      // Upload lên Cloudinary
      const avatarUrl = await uploadAvatar(croppedFile, user.id, user.email);

      // Cập nhật avatarUrl vào database
      await updateUserInfo(user.id, { avatarUrl });

      // Cập nhật UI
      setAvatarUrl(avatarUrl);
      setSuccessMessage('Cập nhật avatar thành công!');
      
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (error) {
      console.error('Lỗi khi upload avatar:', error);
      setErrors({ avatar: 'Không thể upload avatar. Vui lòng thử lại.' });
    } finally {
      setSaving(false);
      setSelectedImageFile(null);
    }
  };

  // Hủy crop
  const handleCropCancel = () => {
    setShowAvatarCrop(false);
    setSelectedImageFile(null);
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="profile-loading-text">Đang tải thông tin...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button 
          onClick={() => navigate('/dashboard')}
          className="profile-back-btn"
        >
          ← Quay lại Dashboard
        </button>
        <h1>Hồ sơ cá nhân</h1>
      </div>

      <form onSubmit={handleSaveProfile} className="profile-form">
        {/* Thông báo */}
        {successMessage && (
          <div className="profile-success-message">
            {successMessage}
          </div>
        )}

        {errors.general && (
          <div className="profile-error-message">
            {errors.general}
          </div>
        )}

        {/* Avatar Section */}
        <div className="profile-section">
          <h3>Avatar</h3>
          <div className="profile-avatar-section">
            <div className="profile-avatar-preview">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="profile-avatar-image"
                />
              ) : (
                <div className="profile-avatar-placeholder">
                  {userInfo ? 
                    `${userInfo.lastName.charAt(0)}${userInfo.firstName.charAt(0)}` : 
                    'U'
                  }
                </div>
              )}
            </div>
            
            <div className="profile-avatar-actions">
              <label htmlFor="avatar-upload" className="profile-avatar-upload-btn">
                {avatarUrl ? 'Thay đổi Avatar' : 'Tải lên Avatar'}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarFileSelect}
                className="profile-avatar-input"
              />
              {errors.avatar && (
                <div className="profile-field-error">{errors.avatar}</div>
              )}
            </div>
          </div>
        </div>

        {/* Thông tin cá nhân */}
        <div className="profile-section">
          <h3>Thông tin cá nhân</h3>
          
          <div className="profile-field">
            <label>Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="profile-input profile-input-disabled"
            />
          </div>

          <div className="profile-field">
            <label>Họ và tên đệm *</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className={`profile-input ${errors.lastName ? 'profile-input-error' : ''}`}
              placeholder="Nhập họ và tên đệm"
            />
            {errors.lastName && (
              <div className="profile-field-error">{errors.lastName}</div>
            )}
          </div>

          <div className="profile-field">
            <label>Tên *</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className={`profile-input ${errors.firstName ? 'profile-input-error' : ''}`}
              placeholder="Nhập tên"
            />
            {errors.firstName && (
              <div className="profile-field-error">{errors.firstName}</div>
            )}
          </div>

          <div className="profile-field">
            <label>Vai trò</label>
            <input
              type="text"
              value={userInfo?.role || 'user'}
              disabled
              className="profile-input profile-input-disabled"
            />
          </div>
        </div>

        {/* Đổi mật khẩu */}
        <div className="profile-section">
          <div className="profile-section-header">
            <h3>Đổi mật khẩu</h3>
            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="profile-toggle-btn"
            >
              {showPasswordSection ? 'Hủy' : 'Thay đổi'}
            </button>
          </div>

          {showPasswordSection && (
            <>
              <div className="profile-field">
                <label>Mật khẩu hiện tại *</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className={`profile-input ${errors.currentPassword ? 'profile-input-error' : ''}`}
                  placeholder="Nhập mật khẩu hiện tại"
                />
                {errors.currentPassword && (
                  <div className="profile-field-error">{errors.currentPassword}</div>
                )}
              </div>

              <div className="profile-field">
                <label>Mật khẩu mới *</label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className={`profile-input ${errors.newPassword ? 'profile-input-error' : ''}`}
                  placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                />
                {errors.newPassword && (
                  <div className="profile-field-error">{errors.newPassword}</div>
                )}
              </div>

              <div className="profile-field">
                <label>Xác nhận mật khẩu mới *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`profile-input ${errors.confirmPassword ? 'profile-input-error' : ''}`}
                  placeholder="Nhập lại mật khẩu mới"
                />
                {errors.confirmPassword && (
                  <div className="profile-field-error">{errors.confirmPassword}</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Submit Button */}
        <div className="profile-actions">
          <button
            type="submit"
            disabled={saving}
            className="profile-save-btn"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>

      {/* Avatar Crop Modal */}
      {showAvatarCrop && selectedImageFile && (
        <AvatarCrop
          imageFile={selectedImageFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}

export default Profile;
