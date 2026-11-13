import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Dashboard from "../pages/Dashboard";
import MapaEleitoral from "../pages/MapaEleitoral";
import Comparacao from "../pages/Comparacao";
import NaoEncontrada from "../pages/NaoEncontrada";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/mapa" element={<MapaEleitoral />} />
          <Route path="/comparacao" element={<Comparacao />} />
        </Route>
        <Route path="*" element={<NaoEncontrada />} />
      </Routes>
    </BrowserRouter>
  );
}
