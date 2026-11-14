
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./MainLayout.css";

export default function MainLayout() {
  const { pathname } = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);

  const isMapaEleitoral = pathname.startsWith("/mapa");
  const isDashboard =
    pathname === "/" || pathname.startsWith("/dashboard");

  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  return (
    <div
      className={`main-layout
        ${isMapaEleitoral ? "main-layout--mapa" : ""}
        ${isDashboard ? "main-layout--dashboard" : ""}
        ${menuAberto ? "main-layout--menu-open" : ""}
      `}
    >
      {/* Menu mobile disponível em todas as páginas */}
      <button
        type="button"
        className="mobile-menu-toggle"
        onClick={() => setMenuAberto((atual) => !atual)}
        aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
        aria-expanded={menuAberto}
        aria-controls="sidebar-principal"
      >
        {menuAberto ? "×" : "☰"}
      </button>

      {menuAberto && (
        <button
          type="button"
          className="mobile-menu-backdrop"
          onClick={() => setMenuAberto(false)}
          aria-label="Fechar menu"
        />
      )}

      <div id="sidebar-principal">
        <Sidebar />
      </div>

      <main
        className={`main-content
          ${isMapaEleitoral ? "main-content--mapa" : ""}
          ${isDashboard ? "main-content--dashboard" : ""}
        `}
      >
        <Outlet />
      </main>
    </div>
  );
}
