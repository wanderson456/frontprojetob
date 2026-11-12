
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./MainLayout.css";

export default function MainLayout() {
  const { pathname } = useLocation();
  const isMapaEleitoral = pathname.startsWith("/mapa");

  return (
    <div
      className={`main-layout ${
        isMapaEleitoral ? "main-layout--mapa" : ""
      }`}
    >
      <Sidebar />

      <main
        className={`main-content ${
          isMapaEleitoral ? "main-content--mapa" : ""
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}
