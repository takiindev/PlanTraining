import Header from "./Header";
import "./Layout.css";

/**
 * Layout component bao bọc Header và content
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Nội dung trang
 * @param {boolean} props.showHeader - Có hiển thị header hay không (mặc định: true)
 * @returns {React.ReactNode} Layout với header và content
 */
function Layout({ children, showHeader = true }) {
  return (
    <div className="layout">
      {showHeader && <Header />}
      <main className="layout-main">
        {children}
      </main>
    </div>
  );
}

export default Layout;
