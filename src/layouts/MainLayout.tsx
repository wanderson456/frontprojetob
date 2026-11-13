
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./MainLayout.css";

export default function MainLayout() {
  const { pathname } = useLocation();

  const isMapaEleitoral = pathname.startsWith("/mapa");
  const isDashboard = pathname === "/" || pathname.startsWith("/dashboard");

  return (
    <div
      className={`main-layout ${
        isMapaEleitoral ? "main-layout--mapa" : ""
      } ${isDashboard ? "main-layout--dashboard" : ""}`}
    >
      <Sidebar />

      <main
        className={`main-content ${
          isMapaEleitoral ? "main-content--mapa" : ""
        } ${isDashboard ? "main-content--dashboard" : ""}`}
      >
        <Outlet />
      </main>
    </div>
  );
}
