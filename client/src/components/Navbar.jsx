import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Menu, ShoppingBag, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const close = () => setOpen(false);

  async function handleLogout() {
    await logout();
    close();
    navigate("/");
  }

  return (
    <header className="site-header">
      <nav className="nav-shell" aria-label="Main navigation">
        <Link className="brand" to="/" onClick={close}>
          <span className="brand-icon"><ShoppingBag size={19} /></span>
          <span>campus<span className="brand-accent">cart</span></span>
        </Link>
        <button className="menu-toggle" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
        <div className={`nav-links ${open ? "nav-open" : ""}`}>
          <NavLink to="/" onClick={close}>Explore</NavLink>
          {user ? (
            <>
              <NavLink to="/dashboard" onClick={close}>
                <LayoutDashboard size={14} style={{ marginRight: 4, verticalAlign: -2 }} />
                Dashboard
              </NavLink>
              {user.role === "admin" && <NavLink to="/admin" onClick={close}>Admin</NavLink>}
              <span className="nav-user">Hi, {user.name.split(" ")[0]}</span>
              <button className="nav-text-button" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <NavLink to="/login" onClick={close}>Log in</NavLink>
              <Link className="button button-small" to="/register" onClick={close}>Join CampusCart</Link>
            </>
          )}
          {user && <Link className="button button-small" to="/sell" onClick={close}>＋ Sell an item</Link>}
        </div>
      </nav>
    </header>
  );
}
