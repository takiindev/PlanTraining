# PlanTraining

Ứng dụng quản lý lịch đào tạo với React và Firebase.

## 🚀 Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd PlanTraining
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình biến môi trường

Sao chép file `.env.example` thành `.env`:

```bash
cp .env.example .env
```

Sau đó mở file `.env` và điền các thông tin Firebase của bạn:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_firebase_app_id_here

# Application Configuration
VITE_APP_NAME=PlanTraining
VITE_APP_VERSION=1.0.0
```

### 4. Lấy thông tin Firebase Configuration

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Chọn project của bạn
3. Vào **Project Settings** (⚙️)
4. Cuộn xuống phần **Your apps** 
5. Chọn ứng dụng web hoặc tạo mới
6. Sao chép các giá trị từ `firebaseConfig` object

### 5. Chạy ứng dụng

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`

## 📁 Cấu trúc dự án

```
src/
├── components/         # React components
├── pages/             # Các trang chính
├── services/          # API services và Firebase
├── utils/             # Utility functions
├── contexts/          # React contexts
└── firebase.js        # Firebase configuration
```

## 🔒 Bảo mật

- File `.env` đã được thêm vào `.gitignore` để tránh commit thông tin nhạy cảm
- Sử dụng file `.env.example` làm template
- Không bao giờ commit file `.env` lên repository

## 🛠️ Các scripts có sẵn

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run preview` - Preview production build
- `npm run lint` - Chạy ESLint

## 📝 Ghi chú

- Đảm bảo tất cả biến môi trường được cung cấp trước khi chạy ứng dụng
- Kiểm tra console nếu có lỗi thiếu biến môi trường
- Firebase configuration sẽ được validate tự động khi khởi tạo
