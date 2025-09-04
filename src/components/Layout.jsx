import Header from "./Header";

/**
 * Layout component bao bọc Header và content
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Nội dung trang
 * @param {boolean} props.showHeader - Có hiển thị header hay không (mặc định: true)
 * @returns {React.ReactNode} Layout với header và content
 */
function Layout({ children, showHeader = true }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f7fafc" }}>
      {showHeader && <Header />}
      <main style={{ paddingTop: showHeader ? "0" : "0" }}>
        {children}
      </main>
    </div>
  );
}

export default Layout;
