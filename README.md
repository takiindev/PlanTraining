# PlanTraining

Ứng dụng quản lý kế hoạch đào tạo được xây dựng với React + Vite + Firebase.

## Tính năng

- 🔐 Xác thực người dùng (Đăng ký/Đăng nhập)
- 📊 Dashboard tổng quan
- 👥 Quản lý vai trò người dùng
- 🔒 Route bảo mật
- 📱 Giao diện responsive

## Công nghệ sử dụng

- **Frontend**: React 19, Vite, React Router DOM
- **Backend**: Firebase (Authentication, Firestore)
- **Deployment**: Vercel

## Cài đặt và chạy local

```bash
# Clone repository
git clone <repository-url>
cd PlanTraining

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build cho production
npm run build

# Preview build
npm run preview
```

## Deploy lên Vercel

### Cách 1: Deploy trực tiếp từ GitHub

1. Truy cập [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import repository từ GitHub
4. Vercel sẽ tự động detect Vite framework
5. Click "Deploy"

### Cách 2: Deploy bằng Vercel CLI

```bash
# Cài đặt Vercel CLI globally
npm i -g vercel

# Login vào Vercel
vercel login

# Deploy (lần đầu)
npm run vercel

# Deploy production
npm run deploy
```

### Cách 3: Truy cập nhanh (One-click deploy)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/takiindev/PlanTraining)

## Cấu hình Environment Variables

Trong Vercel Dashboard, thêm các environment variables sau:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Scripts có sẵn

- `npm run dev` - Chạy development server
- `npm run build` - Build cho production
- `npm run preview` - Preview build local
- `npm run vercel` - Deploy lên Vercel (preview)
- `npm run deploy` - Deploy production lên Vercel

## Cấu trúc thư mục

```
src/
├── components/          # React components
├── pages/              # Các trang chính
├── services/           # API services
├── utils/              # Utilities
└── firebase.js         # Firebase configuration
```

## License

MIT License
