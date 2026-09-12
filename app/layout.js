import './globals.css';

export const metadata = {
  title: 'Mini POS',
  description: 'ระบบขายของร้านเล็ก Mini POS',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <header className="header">
          <div className="header-inner">
            <a href="/" className="logo">
              Mini POS
            </a>

            <nav className="nav">
              <a href="/">สินค้า</a>
              <a href="/sell">ขายสินค้า</a>
              <a href="/history">ประวัติการขาย</a>
            </nav>
          </div>
        </header>

        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}
