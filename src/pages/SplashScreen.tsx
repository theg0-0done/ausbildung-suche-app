import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/ausbildungLogo.png";

export function SplashScreen() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        navigate(user ? "/home" : "/auth");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="splash-logo-container">
          <img src={logo} alt="Logo" className="splash-logo" />
        </div>
        <h3 className="splash-title">
          Ausbildungs<span className="gradient-text">Suche</span>
        </h3>
      </div>
    </div>
  );
}
