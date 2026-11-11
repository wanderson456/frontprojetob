import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  Users,
  GitCompareArrows
} from "lucide-react";
import "./Sidebar.css";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/mapa", label: "Mapa eleitoral", icon: Map },
  { to: "/candidatos", label: "Candidatos", icon: Users },
  { to: "/comparacao", label: "Comparação", icon: GitCompareArrows },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <h2>Eleições Ceará</h2>
      <nav>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === "/"}>
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
