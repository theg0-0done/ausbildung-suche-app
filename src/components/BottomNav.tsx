import { NavLink, Link, useLocation } from 'react-router-dom';
import { House, Heart, Clock, User } from 'lucide-react';
import './BottomNav.css';

export function BottomNav() {
  const location = useLocation();

  // Don't show bottom nav on auth or splash screens
  if (location.pathname.startsWith('/auth') || location.pathname === '/') {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bottom-nav">
      <Link to="/home" className={`bottom-nav-item ${isActive('/home') ? 'active' : ''}`}>
        <House className="bottom-nav-icon" />
        <span>Home</span>
      </Link>
      
      <NavLink to="/favorites" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Heart className="bottom-nav-icon" />
        <span>Gemerkt</span>
      </NavLink>
      
      <NavLink to="/history" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <Clock className="bottom-nav-icon" />
        <span>Verlauf</span>
      </NavLink>
      
      <NavLink to="/profile" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <User className="bottom-nav-icon" />
        <span>Profil</span>
      </NavLink>
    </nav>
  );
}
