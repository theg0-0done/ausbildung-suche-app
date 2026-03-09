import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// import { useThemeStore } from '../store/useThemeStore';
import logo from ".././assets/ausbildungLogo.png"

export function SplashScreen() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  // const theme = useThemeStore((state) => state.theme); // Unused variable

  useEffect(() => {
    // Only redirect if auth status check has resolved
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (user) {
          navigate('/home');
        } else {
          // Send to the new unified AuthPage
          navigate('/auth');
        }
      }, 2000); // 2 second delay for the splash animation
      
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <img 
          src={logo} 
          alt="AusbildungSuche Logo" 
          className="splash-logo"
        />
        <h1 className="splash-title">
          Ausbildungs<span className="gradient-text">Suche</span>
        </h1>
        <p className="splash-tagline">Dein Weg in die Zukunft</p>
      </div>
    </div>
  );
}
