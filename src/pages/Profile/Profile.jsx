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

  // Helper function để hiển thị tên vai trò
  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'owner':
        return 'Chủ sở hữu';
      case 'admin':
        return 'Quản trị viên';
      case 'mentor':
        return 'Mentor';
      case 'user':
        return 'Thành viên';
      default:
        return 'Thành viên';
    }
  };

  // Helper function để lấy chữ cái đầu
  const getInitials = () => {
    if (userInfo?.firstName && userInfo?.lastName) {
      return `${userInfo.lastName.charAt(0)}${userInfo.firstName.charAt(0)}`;
    }
    return 'U';
  };

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    // Preload user data từ cache nếu có
    const cachedUserInfo = localStorage.getItem('cachedUserInfo');
    if (cachedUserInfo) {
      try {
        const parsedUserInfo = JSON.parse(cachedUserInfo);
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
      }
    }
  }, []);

  // Load thông tin người dùng
  const loadUserData = async () => {
    try {
      
      const userEmail = getCurrentUserEmail();
      if (!userEmail) {
        navigate('/login');
        return;
      }

      
      // Lấy thông tin tài khoản
      const accountData = await getUserByEmail(userEmail);
      if (!accountData) {
        navigate('/login');
        return;
      }

      setUser({ email: userEmail, id: accountData.id });

      // Lấy thông tin chi tiết
      const detailInfo = await getUserInfo(accountData.id);
      
      if (detailInfo) {
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
          setAvatarUrl(detailInfo.avatarUrl);
        }
      } else {
      }
      
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

  // Validate form thông tin cá nhân
  const validatePersonalInfo = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Tên không được để trống';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Họ không được để trống';
    }

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // Validate form đổi mật khẩu
  const validatePassword = () => {
    const newErrors = {};

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

    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  // Lưu thông tin cá nhân
  const handleSavePersonalInfo = async (e) => {
    e.preventDefault();
    
    if (!validatePersonalInfo()) {
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

      setSuccessMessage('Cập nhật thông tin cá nhân thành công!');
      
      // Reload user data
      setTimeout(() => {
        loadUserData();
        setSuccessMessage('');
      }, 2000);

    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin cá nhân:', error);
      setErrors({ general: error.message || 'Có lỗi xảy ra khi cập nhật thông tin cá nhân' });
    } finally {
      setSaving(false);
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }

    setSaving(true);
    setErrors({});
    setSuccessMessage('');

    try {
      // Cập nhật mật khẩu
      await updateUserPassword(user.email, formData.currentPassword, formData.newPassword);
      
      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      setSuccessMessage('Đổi mật khẩu thành công!');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 2000);

    } catch (error) {
      console.error('Lỗi khi đổi mật khẩu:', error);
      setErrors({ general: error.message || 'Có lỗi xảy ra khi đổi mật khẩu' });
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

      // Cập nhật UI local
      setAvatarUrl(avatarUrl);
      
      // Cập nhật cached user info để Header refresh
      const cachedUserInfo = localStorage.getItem('cachedUserInfo');
      if (cachedUserInfo) {
        try {
          const parsedUserInfo = JSON.parse(cachedUserInfo);
          parsedUserInfo.avatarUrl = avatarUrl;
          localStorage.setItem('cachedUserInfo', JSON.stringify(parsedUserInfo));
        } catch (error) {
        }
      }
      
      // Trigger re-load user data để sync với Header
      setTimeout(() => {
        loadUserData();
      }, 1000);
      
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

  // Xóa avatar
  const handleDeleteAvatar = async () => {
    if (!avatarUrl) {
      return; // Không có avatar để xóa
    }

    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa avatar này không?');
    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);

      // Xóa avatarUrl khỏi database (set về null/empty)
      await updateUserInfo(user.id, { avatarUrl: null });

      // Cập nhật UI local
      setAvatarUrl('');

      // Cập nhật cached user info để Header refresh
      const cachedUserInfo = localStorage.getItem('cachedUserInfo');
      if (cachedUserInfo) {
        try {
          const parsedUserInfo = JSON.parse(cachedUserInfo);
          delete parsedUserInfo.avatarUrl; // Xóa avatarUrl khỏi cache
          localStorage.setItem('cachedUserInfo', JSON.stringify(parsedUserInfo));
        } catch (error) {
        }
      }

      // Trigger re-load user data để sync với Header
      setTimeout(() => {
        loadUserData();
      }, 1000);

      setSuccessMessage('Đã xóa avatar thành công!');
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (error) {
      console.error('Lỗi khi xóa avatar:', error);
      setErrors({ avatar: 'Không thể xóa avatar. Vui lòng thử lại.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="profile-loading-spinner"></div>
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header Section */}
      <div className="page-header">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="back-btn"
        >
          ← Quay lại Dashboard
        </button>
        <h1>Thông tin cá nhân</h1>
      </div>

      {/* Main Content */}
      <div className="page-content">
        <div className="profile-container">
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
          
          {/* Profile Card */}
          <div className="profile-card">

            {/* Main Content Grid */}
            <div className="profile-main-grid">
              
              {/* Left Column - Avatar & Personal Info */}
              <div className="profile-left-column">
                
                {/* Avatar Section */}
                <div className="profile-section">
                  <h3 className="profile-section-title">Avatar</h3>
                  <div className="profile-avatar-section">
                    <div className="profile-avatar-preview">
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt="Avatar" 
                          className="profile-avatar-image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="profile-avatar-placeholder"
                        style={{ 
                          display: avatarUrl ? 'none' : 'flex' 
                        }}
                      >
                        {userInfo ? 
                          `${userInfo.lastName.charAt(0)}${userInfo.firstName.charAt(0)}` : 
                          'U'
                        }
                      </div>
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
                      
                      {/* Nút xóa avatar - chỉ hiển thị khi có avatar */}
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={handleDeleteAvatar}
                          disabled={saving}
                          className="profile-avatar-delete-btn"
                        >
                          {saving ? 'Đang xóa...' : 'Xóa Avatar'}
                        </button>
                      )}
                      
                      {errors.avatar && (
                        <div className="profile-field-error">{errors.avatar}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Personal Info Section */}
                <div className="profile-section">
                  <h3 className="profile-section-title">Thông tin cá nhân</h3>
                  
                  <form onSubmit={handleSavePersonalInfo} className="profile-personal-form">
                    <div className="profile-form-grid">
                      <div className="profile-field">
                        <label htmlFor="firstName">Tên</label>
                        <input
                          id="firstName"
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
                        <label htmlFor="lastName">Họ và tên đệm</label>
                        <input
                          id="lastName"
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
                    </div>

                    <div className="profile-field">
                      <label htmlFor="email">Email</label>
                      <input
                        id="email"
                        type="email"
                        value={user?.email || ''}
                        className="profile-input profile-input-disabled"
                        disabled
                      />
                      <div className="profile-field-note">Email không thể thay đổi</div>
                    </div>

                    <div className="profile-field">
                      <label htmlFor="role">Vai trò</label>
                      <input
                        id="role"
                        type="text"
                        value={getRoleDisplayName(userInfo?.role || 'user')}
                        className="profile-input profile-input-disabled"
                        disabled
                      />
                      <div className="profile-field-note">Vai trò được quản lý bởi quản trị viên</div>
                    </div>

                    {/* Personal Info Submit Button */}
                    <div className="profile-form-actions">
                      <button
                        type="submit"
                        disabled={saving}
                        className="profile-save-btn"
                      >
                        {saving ? 'Đang lưu...' : 'Cập nhật thông tin'}
                      </button>
                    </div>
                  </form>
                </div>
                
              </div>
              
              {/* Right Column - Password Section */}
              <div className="profile-right-column">
                
                {/* Password Section */}
                <div className="profile-section">
                  <h3 className="profile-section-title">Đổi mật khẩu</h3>

                  <form onSubmit={handleChangePassword} className="profile-password-form">
                    <div className="profile-field">
                      <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
                      <input
                        id="currentPassword"
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

                    <div className="profile-form-grid">
                      <div className="profile-field">
                        <label htmlFor="newPassword">Mật khẩu mới</label>
                        <input
                          id="newPassword"
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
                        <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
                        <input
                          id="confirmPassword"
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
                    </div>

                    {/* Password Submit Button */}
                    <div className="profile-form-actions">
                      <button
                        type="submit"
                        disabled={saving}
                        className="profile-save-btn profile-password-btn"
                      >
                        {saving ? 'Đang đổi...' : 'Đổi mật khẩu'}
                      </button>
                    </div>
                  </form>
                </div>
                
              </div>
              
            </div>

          </div>
        </div>
      </div>

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
