
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { checkSession, getCurrentUserEmail, getUserByEmail } from "../../services/tokenService";
import { getUserInfo, subscribeToUserInfo } from "../../services/userService";
import { getClassesByMonth, createClass, getMentors, updateClass, deleteClass, subscribeToClassesByMonth } from "../../services/classService";
import { ensureAdminExists, createSampleMembers } from "../../services/setupService";
import { useNotification } from "../../contexts/NotificationContext";
import { realtimeManager } from "../../services/realtimeManager";
import "./Dashboard.css";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month"); // month, week
  const [classes, setClasses] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateForDetail, setSelectedDateForDetail] = useState(new Date()); // Ngày được chọn để xem chi tiết
  const [editingClass, setEditingClass] = useState(null);
  const { triggerNotificationRefresh } = useNotification();
  const navigate = useNavigate();

  // Helper function để format ngày hôm nay
  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Helper function để format ngày thành string YYYY-MM-DD (local time)
  const formatDateToString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function để reset form với ngày được chọn
  const resetForm = (useSelectedDate = true) => {
    const dateToUse = useSelectedDate && selectedDateForDetail 
      ? formatDateToString(selectedDateForDetail)
      : getTodayDateString();
      
    setFormData({
      topic: "",
      mentor: "",
      supportMentors: [],
      manager: "",
      date: dateToUse,
      startTime: "",
      endTime: "",
      type: "online",
      location: "",
      meetingLink: "",
      description: ""
    });
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClass(null);
    resetForm(false); // Không sử dụng ngày được chọn khi đóng modal
  };

  // Handle tạo lớp học mới với ngày được chọn
  const handleCreateClass = () => {
    setSelectedDate(selectedDateForDetail);
    setEditingClass(null);
    setFormData({
      topic: "",
      mentor: "",
      supportMentors: [],
      manager: userInfo.id,
      date: formatDateToString(selectedDateForDetail),
      startTime: "",
      endTime: "",
      type: "online",
      location: "",
      meetingLink: "",
      description: ""
    });
    setShowModal(true);
  };

  // Form data cho tạo/sửa lớp học
  const [formData, setFormData] = useState({
    topic: "",
    mentor: "",
    supportMentors: [], // Thay đổi thành array để chứa nhiều mentor hỗ trợ
    manager: "",
    date: getTodayDateString(), // Ngày mặc định là hôm nay
    startTime: "",
    endTime: "",
    type: "online",
    location: "",
    meetingLink: "",
    description: ""
  });

  useEffect(() => {
    const verifySession = async () => {
      try {
        const isValidSession = await checkSession();
        
        if (isValidSession) {
          const userEmail = getCurrentUserEmail();
          const accountData = await getUserByEmail(userEmail);
          if (accountData) {
            setUser({ email: userEmail, id: accountData.id });
            const detailInfo = await getUserInfo(accountData.id);
            setUserInfo(detailInfo);
          }
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Lỗi khi xác thực phiên:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [navigate]);

  useEffect(() => {
    if (userInfo) {
      setupRealTimeListeners();
      loadMentors();
      
      // Kiểm tra nếu có ngày được chọn từ thông báo
      const selectedDateFromNotification = localStorage.getItem('selectedDate');
      if (selectedDateFromNotification) {
        const notificationDate = new Date(selectedDateFromNotification);
        setSelectedDateForDetail(notificationDate);
        setCurrentDate(notificationDate); // Cập nhật tháng hiện tại nếu cần
        localStorage.removeItem('selectedDate'); // Xóa sau khi sử dụng
      }
    }
  }, [userInfo, currentDate]);

  // Setup all real-time listeners using realtimeManager
  const setupRealTimeListeners = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Real-time subscribe classes
    realtimeManager.subscribeClasses(year, month, (classesData) => {
      setClasses(classesData);
    }, 'dashboard-classes');

    // Subscribe to current user info
    if (userInfo?.id) {
      realtimeManager.subscribeUserInfo(userInfo.id, (updatedUserInfo) => {
        if (updatedUserInfo) {
          setUserInfo(updatedUserInfo);
        }
      });
    }
  };

  // Cleanup all listeners khi component unmount
  useEffect(() => {
    return () => {
      realtimeManager.unsubscribeAll();
    };
  }, []);

  const loadMentors = async () => {
    try {
      const mentorData = await getMentors();
      setMentors(mentorData);
    } catch (error) {
      console.error("Lỗi khi tải danh sách mentor:", error);
    }
  };

  const handleSetupRoles = async () => {
    try {
      const adminResult = await ensureAdminExists();
      const memberResult = await createSampleMembers();
      
      // Reload mentor list
      await loadMentors();
      
    } catch (error) {
      console.error("Lỗi setup roles:", error);
    }
  };

  // Helper function để kiểm tra quyền tạo/quản lý lớp học
  const canManageClasses = () => {
    return userInfo?.role === "admin" || userInfo?.role === "owner";
  };

  // Functions để quản lý mentor hỗ trợ
  const addSupportMentor = () => {
    // Kiểm tra xem đã chọn mentor chính chưa
    if (!formData.mentor) {
      return;
    }

    // Kiểm tra xem tất cả mentor hỗ trợ hiện tại đã được chọn chưa
    const hasEmptySupportMentor = formData.supportMentors.some(mentor => mentor === "");
    if (hasEmptySupportMentor) {
      return;
    }

    // Kiểm tra còn mentor khả dụng không
    if (getAvailableMentors().length === 0) {
      return;
    }

    setFormData({
      ...formData,
      supportMentors: [...formData.supportMentors, ""]
    });
  };

  const removeSupportMentor = (index) => {
    const newSupportMentors = formData.supportMentors.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      supportMentors: newSupportMentors
    });
  };

  // Function để kiểm tra có thể thêm mentor hỗ trợ không
  const canAddSupportMentor = () => {
    // Phải có mentor chính
    if (!formData.mentor) return false;
    
    // Tất cả mentor hỗ trợ hiện tại phải được chọn
    const hasEmptySupportMentor = formData.supportMentors.some(mentor => mentor === "");
    if (hasEmptySupportMentor) return false;
    
    // Phải còn mentor khả dụng
    return getAvailableMentors().length > 0;
  };

  // Function để lấy thông báo tại sao không thể thêm mentor
  const getAddMentorMessage = () => {
    if (!formData.mentor) {
      return "Chọn mentor chính trước";
    }
    
    const hasEmptySupportMentor = formData.supportMentors.some(mentor => mentor === "");
    if (hasEmptySupportMentor) {
      return "Hoàn thiện mentor hỗ trợ hiện tại";
    }
    
    if (getAvailableMentors().length === 0) {
      return "Không còn mentor khả dụng";
    }
    
    return "+ Thêm mentor hỗ trợ";
  };

  const updateSupportMentor = (index, value) => {
    const newSupportMentors = [...formData.supportMentors];
    newSupportMentors[index] = value;
    setFormData({
      ...formData,
      supportMentors: newSupportMentors
    });
  };

  // Function để xử lý chọn ngày để xem chi tiết
  const handleDaySelect = (date) => {
    setSelectedDateForDetail(date);
  };

  const handleDayClick = (date) => {
    // Cập nhật ngày được chọn để xem chi tiết
    setSelectedDateForDetail(date);
    
    // Chỉ admin và owner mới có thể tạo lớp học khi double click hoặc có modifier key
    if (canManageClasses()) {
      // Tạo lớp học mới
      setSelectedDate(date);
      setEditingClass(null);
      setFormData({
        topic: "",
        mentor: "",
        supportMentors: [],
        manager: userInfo.id,
        date: formatDateToString(date), // Sử dụng helper function mới
        startTime: "",
        endTime: "",
        type: "online",
        location: "",
        meetingLink: "",
        description: ""
      });
      setShowModal(true);
    }
  };

  const handleClassClick = (classItem, event) => {
    if (userInfo?.role !== "admin" && userInfo?.role !== "owner") {
      return;
    }
    
    // Mở modal edit với thông tin class đã điền sẵn
    setEditingClass(classItem);
    setFormData({
      topic: classItem.topic,
      mentor: classItem.mentor,
      supportMentors: classItem.supportMentors || [],
      manager: classItem.manager,
      date: classItem.date.toDate ? classItem.date.toDate().toISOString().split('T')[0] : classItem.date,
      startTime: classItem.startTime,
      endTime: classItem.endTime,
      type: classItem.type,
      location: classItem.location || "",
      meetingLink: classItem.meetingLink || "",
      description: classItem.description || ""
    });
    setShowModal(true);
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation: Không cho phép submit nếu có mentor hỗ trợ trống
    const hasEmptySupportMentor = formData.supportMentors.some(mentor => mentor === "");
    if (hasEmptySupportMentor) {
      return;
    }
    
    try {
      const classData = {
        ...formData,
        date: new Date(formData.date),
        // Lọc bỏ các supportMentor trống (double check)
        supportMentors: formData.supportMentors.filter(mentor => mentor !== "")
      };

      if (editingClass) {
        await updateClass(editingClass.id, classData);
      } else {
        await createClass(classData);
      }
      
      handleCloseModal(); // Sử dụng function mới để close và reset
      // Không cần gọi loadClasses() nữa vì real-time listener sẽ tự động cập nhật
      
      // Không cần trigger notification refresh nữa vì real-time listener sẽ tự động cập nhật
    } catch (error) {
      console.error("Lỗi khi lưu lớp học:", error);
    }
  };

  const handleDelete = async () => {
    if (!editingClass) return;
    
    if (window.confirm("Bạn có chắc muốn xóa lớp học này?")) {
      try {
        await deleteClass(editingClass.id);
        handleCloseModal(); // Sử dụng function mới để close và reset
        // Không cần gọi loadClasses() nữa vì real-time listener sẽ tự động cập nhật
        
        // Không cần trigger notification refresh nữa vì real-time listener sẽ tự động cập nhật
      } catch (error) {
        console.error("Lỗi khi xóa lớp học:", error);
      }
    }
  };

  const handleDeleteClass = async (classId) => {
    try {
      await deleteClass(classId);
      // Không cần gọi loadClasses() nữa vì real-time listener sẽ tự động cập nhật
      
      // Không cần trigger notification refresh nữa vì real-time listener sẽ tự động cập nhật
    } catch (error) {
      console.error("Lỗi khi xóa lớp học:", error);
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const getMentorName = (mentorId) => {
    const mentor = mentors.find(m => m.id === mentorId);
    if (mentor) {
      return `${mentor.lastName} ${mentor.firstName}`;
    }
    // Nếu không tìm thấy mentor trong danh sách (có thể là user role), hiển thị "Người dùng chưa phân quyền"
    return "Người dùng";
  };

  const getSupportMentorNames = (supportMentors) => {
    if (!supportMentors || supportMentors.length === 0) return "";
    
    const names = supportMentors.map(mentorId => {
      const mentor = mentors.find(m => m.id === mentorId);
      return mentor ? `${mentor.lastName} ${mentor.firstName}` : "N/A";
    });
    
    return names.join(", ");
  };

  // Function để lấy danh sách mentor khả dụng (chưa được chọn)
  const getAvailableMentors = (excludeIndex = -1) => {
    const selectedMentorIds = [
      formData.mentor, // Mentor chính
      ...formData.supportMentors.filter((_, index) => index !== excludeIndex) // Mentor hỗ trợ khác
    ].filter(id => id !== ""); // Loại bỏ các giá trị trống
    
    return mentors.filter(mentor => !selectedMentorIds.includes(mentor.id));
  };

  // Function để lấy mentor khả dụng cho mentor chính
  const getAvailableMentorsForMain = () => {
    const selectedSupportMentorIds = formData.supportMentors.filter(id => id !== "");
    return mentors.filter(mentor => !selectedSupportMentorIds.includes(mentor.id));
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const getClassesForDate = (date) => {
    return classes.filter(cls => {
      const classDate = cls.date.toDate ? cls.date.toDate() : new Date(cls.date);
      return classDate.toDateString() === date.toDateString();
    });
  };

  // Function để lấy buổi dạy cho ngày được chọn xem chi tiết, sắp xếp theo thời gian
  const getClassesForSelectedDate = () => {
    const selectedClasses = getClassesForDate(selectedDateForDetail);
    return selectedClasses.sort((a, b) => {
      return a.startTime.localeCompare(b.startTime);
    });
  };

  // Function để kiểm tra ngày có buổi dạy không (để hiển thị dấu chấm cam)
  const hasClassesOnDate = (date) => {
    return getClassesForDate(date).length > 0;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: 'long'
    });
  };

  const formatWeek = (date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return `${startOfWeek.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "calc(100vh - 64px)",
        fontSize: "18px"
      }}>
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  const displayDays = view === "month" ? getDaysInMonth() : getWeekDays();

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Lịch Dạy Học</h1>
          <p className="dashboard-subtitle">
            Quản lý lịch dạy và mentor
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Role Management Button - chỉ hiện với owner */}
          {userInfo?.role === "owner" && (
            <button 
              onClick={() => navigate('/role-management')}
              className="role-management-btn"
            >
              Quản lý vai trò
            </button>
          )}
          <div className={`role-badge ${
            userInfo?.role === "owner" ? "role-owner" : 
            userInfo?.role === "admin" ? "role-admin" : 
            userInfo?.role === "member" ? "role-member" : "role-user"
          }`}>
            {userInfo?.role === "owner" ? "OWNER" : 
             userInfo?.role === "admin" ? "ADMIN" : 
             userInfo?.role === "member" ? "MEMBER" : "USER"}
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="main-layout">
        {/* Right Panel - Compact Calendar (shows first on mobile) */}
        <div className="right-panel">
          <div className="calendar-header" style={{ marginBottom: "16px" }}>
            <div className="current-period" style={{ fontSize: "16px", fontWeight: "600", textAlign: "center", marginBottom: "12px" }}>
              {view === "month" ? formatDate(currentDate) : formatWeek(currentDate)}
            </div>
            
            <div className="calendar-controls">
              <button 
                className="nav-button"
                onClick={() => view === "month" ? navigateMonth(-1) : navigateWeek(-1)}
              >
                ←
              </button>
              
              <div className="view-toggle">
                <button 
                  className={`view-button ${view === "month" ? "active" : ""}`}
                  onClick={() => setView("month")}
                  style={{ fontSize: "12px", padding: "4px 8px" }}
                >
                  Tháng
                </button>
                <button 
                  className={`view-button ${view === "week" ? "active" : ""}`}
                  onClick={() => setView("week")}
                  style={{ fontSize: "12px", padding: "4px 8px" }}
                >
                  Tuần
                </button>
              </div>
              
              <button 
                className="nav-button"
                onClick={() => view === "month" ? navigateMonth(1) : navigateWeek(1)}
              >
                →
              </button>
            </div>
          </div>

          {/* Compact Calendar Grid */}
          <div className="compact-calendar-grid">
            {/* Day Headers */}
            {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
              <div key={day} style={{ 
                padding: "8px 4px", 
                textAlign: "center", 
                fontSize: "12px", 
                fontWeight: "600", 
                color: "#718096",
                background: "#f7fafc"
              }}>
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {displayDays.map((date, index) => (
              <div
                key={index}
                className={`compact-day ${
                  selectedDateForDetail.toDateString() === date.toDateString() ? 'selected' : ''
                } ${
                  !isCurrentMonth(date) && view === "month" ? 'other-month' : ''
                } ${
                  isToday(date) ? 'today' : ''
                }`}
                onClick={() => handleDaySelect(date)}
                onDoubleClick={() => canManageClasses() && handleDayClick(date)}
              >
                {date.getDate()}
                {hasClassesOnDate(date) && (
                  <div className="day-indicator"></div>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ marginTop: "16px", fontSize: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f56500" }}></div>
              <span style={{ color: "#718096" }}>Có buổi dạy</span>
            </div>
            {canManageClasses() && (
              <div style={{ color: "#718096", fontSize: "11px", marginTop: "8px" }}>
                💡 Double-click vào ngày để tạo buổi dạy mới
              </div>
            )}
          </div>
        </div>

        {/* Left Panel - Class Details (shows second on mobile) */}
        <div className="left-panel">
          <div style={{ marginBottom: "16px", borderBottom: "2px solid #e2e8f0", paddingBottom: "12px" }}>
            <h3 className="detail-title" style={{ margin: "0", color: "#2d3748", fontSize: "18px" }}>
              Chi tiết ngày {selectedDateForDetail.toLocaleDateString('vi-VN')}
            </h3>
            <p className="class-count" style={{ margin: "4px 0 0 0", color: "#718096", fontSize: "14px" }}>
              {getClassesForSelectedDate().length} buổi dạy
            </p>
          </div>
          
          <div style={{ overflowY: "auto", height: "calc(100% - 80px)" }}>
            {getClassesForSelectedDate().length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#a0aec0",
                fontSize: "16px"
              }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📅</div>
                <div>Không có buổi dạy nào trong ngày này</div>
              </div>
            ) : (
              getClassesForSelectedDate().map((cls, index) => (
                <div
                  key={cls.id}
                  style={{
                    padding: "16px",
                    marginBottom: "12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    background: cls.type === "online" ? "#f0f9ff" : "#fef2f2",
                    borderLeft: `4px solid ${cls.type === "online" ? "#4299e1" : "#f56565"}`,
                    cursor: canManageClasses() ? "pointer" : "default",
                    transition: "all 0.2s"
                  }}
                  onClick={(e) => canManageClasses() && handleClassClick(cls, e)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: "0 0 4px 0", color: "#2d3748", fontSize: "16px", fontWeight: "600" }}>
                        {cls.topic}
                        {canManageClasses() && (
                          <span style={{ 
                            marginLeft: "8px", 
                            fontSize: "12px", 
                            color: "#718096",
                            fontWeight: "400"
                          }}>
                            ✏️ Click để chỉnh sửa
                          </span>
                        )}
                      </h4>
                      <div style={{ fontSize: "14px", color: "#4a5568", marginBottom: "8px" }}>
                        <span style={{ fontWeight: "600" }}>⏰ {cls.startTime} - {cls.endTime}</span>
                        <span style={{ 
                          marginLeft: "12px", 
                          padding: "2px 8px", 
                          background: cls.type === "online" ? "#dbeafe" : "#fee2e2",
                          color: cls.type === "online" ? "#1e40af" : "#dc2626",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "500"
                        }}>
                          {cls.type === "online" ? "🖥️ Online" : "🏫 Trực tiếp"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: "13px", color: "#6b7280" }}>
                    <div style={{ marginBottom: "4px" }}>
                      <strong>👨‍🏫 Mentor chính:</strong> {getMentorName(cls.mentor)}
                    </div>
                    {cls.supportMentors && cls.supportMentors.length > 0 && (
                      <div style={{ marginBottom: "4px" }}>
                        <strong>🤝 Mentor hỗ trợ:</strong> {getSupportMentorNames(cls.supportMentors)}
                      </div>
                    )}
                    {cls.type === "online" && cls.meetingLink && (
                      <div style={{ marginBottom: "4px" }}>
                        <strong>🔗 Link:</strong> 
                        <a href={cls.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: "#4299e1", marginLeft: "4px" }}>
                          Tham gia meeting
                        </a>
                      </div>
                    )}
                    {cls.type === "offline" && cls.location && (
                      <div style={{ marginBottom: "4px" }}>
                        <strong>📍 Địa điểm:</strong> {cls.location}
                      </div>
                    )}
                    {cls.description && (
                      <div>
                        <strong>📝 Mô tả:</strong> {cls.description}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {/* Nút tạo buổi dạy mới luôn hiển thị phía dưới */}
            {canManageClasses() && (
              <div style={{
                textAlign: "center",
                padding: "20px",
                borderTop: getClassesForSelectedDate().length > 0 ? "1px solid #e2e8f0" : "none",
                marginTop: getClassesForSelectedDate().length > 0 ? "16px" : "0"
              }}>
                <button
                  onClick={handleCreateClass}
                  style={{
                    padding: "12px 20px",
                    background: "#4299e1",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    transition: "background 0.2s"
                  }}
                  onMouseOver={(e) => e.target.style.background = "#3182ce"}
                  onMouseOut={(e) => e.target.style.background = "#4299e1"}
                >
                  + Tạo buổi dạy mới
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && canManageClasses() && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingClass ? "Chỉnh sửa lớp học" : "Tạo lớp học mới"}
              </h2>
              <button className="close-button" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Chủ đề buổi học *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.topic}
                  onChange={(e) => setFormData({...formData, topic: e.target.value})}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Mentor chính *</label>
                  <select
                    className="form-select"
                    value={formData.mentor}
                    onChange={(e) => setFormData({...formData, mentor: e.target.value})}
                    required
                  >
                    <option value="">
                      {getAvailableMentorsForMain().length > 0 ? "Chọn mentor" : "Không có mentor khả dụng"}
                    </option>
                    {getAvailableMentorsForMain().map((mentor) => (
                      <option key={mentor.id} value={mentor.id}>
                        {mentor.lastName} {mentor.firstName} 
                        {mentor.role && ` (${mentor.role.toUpperCase()})`}
                      </option>
                    ))}
                  </select>
                  {mentors.length === 0 && (
                    <div style={{ fontSize: "12px", color: "#e53e3e", marginTop: "4px" }}>
                      Chỉ member và admin mới có thể làm mentor
                    </div>
                  )}
                  {mentors.length > 0 && getAvailableMentorsForMain().length === 0 && (
                    <div style={{ fontSize: "12px", color: "#e53e3e", marginTop: "4px" }}>
                      Tất cả mentor đã được chọn làm mentor hỗ trợ
                    </div>
                  )}
                </div>
              </div>

              {/* Mentor hỗ trợ - Dynamic fields */}
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label className="form-label">Mentor hỗ trợ</label>
                  <button
                    type="button"
                    onClick={addSupportMentor}
                    disabled={!canAddSupportMentor()}
                    style={{
                      padding: "4px 12px",
                      background: canAddSupportMentor() ? "#4299e1" : "#a0aec0",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "12px",
                      cursor: canAddSupportMentor() ? "pointer" : "not-allowed",
                      transition: "all 0.2s"
                    }}
                    title={!canAddSupportMentor() ? getAddMentorMessage() : ""}
                  >
                    {getAddMentorMessage()}
                  </button>
                </div>
                
                {formData.supportMentors.length === 0 && (
                  <div style={{ 
                    padding: "12px", 
                    background: "#f7fafc", 
                    border: "2px dashed #e2e8f0", 
                    borderRadius: "6px",
                    textAlign: "center",
                    color: "#718096",
                    fontSize: "14px"
                  }}>
                    {!formData.mentor 
                      ? "Chọn mentor chính trước để thêm mentor hỗ trợ"
                      : getAvailableMentors().length > 0 
                        ? 'Chưa có mentor hỗ trợ. Click "Thêm mentor hỗ trợ" để thêm.'
                        : 'Không có mentor khả dụng để làm mentor hỗ trợ.'
                    }
                  </div>
                )}

                {formData.supportMentors.map((supportMentor, index) => {
                  const availableMentorsForThisSlot = getAvailableMentors(index);
                  
                  return (
                    <div key={index} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                      <select
                        className="form-select"
                        value={supportMentor}
                        onChange={(e) => updateSupportMentor(index, e.target.value)}
                        style={{ flex: 1 }}
                      >
                        <option value="">
                          {availableMentorsForThisSlot.length > 0 
                            ? `Chọn mentor hỗ trợ ${index + 1}` 
                            : "Không có mentor khả dụng"
                          }
                        </option>
                        {availableMentorsForThisSlot.map((mentor) => (
                          <option key={mentor.id} value={mentor.id}>
                            {mentor.lastName} {mentor.firstName}
                            {mentor.role && ` (${mentor.role.toUpperCase()})`}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeSupportMentor(index)}
                        style={{
                          padding: "8px 12px",
                          background: "#f56565",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          fontSize: "12px",
                          cursor: "pointer"
                        }}
                      >
                        Xóa
                      </button>
                      {availableMentorsForThisSlot.length === 0 && (
                        <div style={{ 
                          fontSize: "10px", 
                          color: "#e53e3e", 
                          alignSelf: "center",
                          whiteSpace: "nowrap"
                        }}>
                          Đã hết mentor
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ngày học *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
              </div>

              {/* Loại lớp học - Radio buttons */}
              <div className="form-group">
                <label className="form-label">Loại lớp học *</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="classType"
                      value="online"
                      checked={formData.type === "online"}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      required
                    />
                    <span className="radio-label">🖥️ Học Online</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="classType"
                      value="offline"
                      checked={formData.type === "offline"}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      required
                    />
                    <span className="radio-label">🏫 Học Trực tiếp</span>
                  </label>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Giờ bắt đầu *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Giờ kết thúc *</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    required
                  />
                </div>
              </div>

              {formData.type === "offline" && (
                <div className="form-group">
                  <label className="form-label">Địa điểm</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Nhập địa điểm dạy"
                  />
                </div>
              )}

              {formData.type === "online" && (
                <div className="form-group">
                  <label className="form-label">Link meeting</label>
                  <input
                    type="url"
                    className="form-input"
                    value={formData.meetingLink}
                    onChange={(e) => setFormData({...formData, meetingLink: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Mô tả thêm</label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Mô tả chi tiết về buổi học..."
                />
              </div>

              <div className="modal-actions">
                {editingClass && (
                  <button type="button" className="btn btn-secondary" onClick={handleDelete}>
                    Xóa
                  </button>
                )}
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingClass ? "Cập nhật" : "Tạo lớp"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard