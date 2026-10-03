import { Outlet } from "react-router-dom";
import Navbar from "../components/marketing/Navbar.jsx";
import Footer from "../components/marketing/Footer.jsx";

export default function MarketingLayout() {
  return (
    <>
      <Navbar />
      <main id="main-content" tabIndex={-1} style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
