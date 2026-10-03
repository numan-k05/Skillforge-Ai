import { useAuth } from "../context/auth.js";
import AppNav from "../components/layout/AppNav.jsx";
import Navbar from "../components/marketing/Navbar.jsx";
import Footer from "../components/marketing/Footer.jsx";
export default function CatalogLayout({ children }) {
  const { isAuthenticated } = useAuth();
  return <div>{isAuthenticated ? <AppNav /> : <Navbar />}<main id="main-content" tabIndex={-1} className="container sf-page">{children}</main>{!isAuthenticated && <Footer />}</div>;
}
