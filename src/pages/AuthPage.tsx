import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authApi } from "../userApi";
// import { useThemeStore } from '../store/useThemeStore';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Calendar,
  MapPin,
  Briefcase,
  Mail,
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import "../components/AppAuth.css";

type AuthMode = "login" | "register" | "forgot-password";

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  // Login Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Register Form State (3 Steps)
  const [regStep, setRegStep] = useState(1);
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regOtp, setRegOtp] = useState(["", "", "", ""]); // 4 digit simulated OTP
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regBirthday, setRegBirthday] = useState("");
  const [regLocation, setRegLocation] = useState("");
  const [regField, setRegField] = useState("ausbildung");

  // Forgot Password Form State (3 Steps)
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState(["", "", "", ""]);
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotNewPasswordConfirm, setForgotNewPasswordConfirm] = useState("");

  // OTP resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpSending, setOtpSending] = useState(false);
  const startCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      if (!credentialResponse.credential)
        throw new Error("No credential received");
      setIsLoading(true);
      const data = await authApi.googleLogin(credentialResponse.credential);
      if (data.token && data.user) {
        login(data.token, data.user);
      }
    } catch (err: any) {
      setError(err.message || "Google Login fehlgeschlagen.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Bitte füllen Sie alle Felder aus.");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const data = await authApi.login({ email, password });
      login(data.token, data.user);
      navigate("/home");
    } catch (err: any) {
      setError(
        err.message ||
          "Login fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmitStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPassword || !regConfirm) {
      setError("Bitte füllen Sie alle Felder aus.");
      return;
    }
    if (regPassword !== regConfirm) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }
    setError("");
    setOtpSending(true);
    try {
      await authApi.sendOtp(regEmail, "register");
      startCooldown();
      setRegStep(2);
    } catch (err: any) {
      setError(err.message || "Code konnte nicht gesendet werden.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleRegisterSubmitStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = regOtp.join("");
    if (code.length !== 4) {
      setError("Bitte geben Sie den vollständigen Code ein.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await authApi.verifyOtp(regEmail, code, "register");
      setRegStep(3);
    } catch (err: any) {
      setError(err.message || "Ungültiger Code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendRegOtp = async () => {
    if (resendCooldown > 0 || otpSending) return;
    setOtpSending(true);
    setError("");
    try {
      await authApi.sendOtp(regEmail, "register");
      startCooldown();
    } catch (err: any) {
      setError(err.message || "Code konnte nicht erneut gesendet werden.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleRegisterSubmitStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFirstName || !regLastName) {
      setError("Bitte geben Sie Ihren Namen an.");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      // Create user
      const registerData = await authApi.register({
        email: regEmail,
        password: regPassword,
        name: `${regFirstName} ${regLastName}`,
      });
      // Authenticate
      login(registerData.token, registerData.user);

      // In a real app we would call updateProfile here to send the rest of the metadata
      navigate("/home");
    } catch (err: any) {
      setError(err.message || "Registrierung fehlgeschlagen.");
    } finally {
      setIsLoading(false);
    }
  };

  // Switch modes and reset state
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError("");
    setRegStep(1);
    setForgotStep(1);
  };

  const handleForgotStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError("Bitte E-Mail eingeben");
      return;
    }
    setError("");
    setOtpSending(true);
    try {
      await authApi.sendOtp(forgotEmail, "reset");
      startCooldown();
      setForgotStep(2);
    } catch (err: any) {
      setError(err.message || "Code konnte nicht gesendet werden.");
    } finally {
      setOtpSending(false);
    }
  };

  const handleForgotStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = forgotOtp.join("");
    if (code.length !== 4) {
      setError("Code füllen");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await authApi.verifyOtp(forgotEmail, code, "reset");
      setForgotStep(3);
    } catch (err: any) {
      setError(err.message || "Ungültiger Code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendForgotOtp = async () => {
    if (resendCooldown > 0 || otpSending) return;
    setOtpSending(true);
    setError("");
    try {
      await authApi.sendOtp(forgotEmail, "reset");
      startCooldown();
    } catch (err: any) {
      setError(err.message || "Code konnte nicht erneut gesendet werden.");
    } finally {
      setOtpSending(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotNewPassword !== forgotNewPasswordConfirm) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }
    if (forgotNewPassword.length < 6) {
      setError("Das Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await authApi.resetPassword(forgotEmail, forgotNewPassword);
      alert("Passwort erfolgreich geändert!");
      switchMode("login");
    } catch (err: any) {
      setError(err.message || "Passwort konnte nicht geändert werden.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-header">
        {/* {mode !== 'forgot-password' && (
          <div className="brand-sparkle gradient-text">
            <Sparkles size={32} strokeWidth={2} />
          </div>
        )} */}
        {mode !== "forgot-password" ? (
          <h2 className="auth-main-title gradient-text">AusbildungSuche</h2>
        ) : (
          <h2 className="auth-main-title gradient-text">
            Passwort zurücksetzen
          </h2>
        )}
      </div>

      <div className="auth-card">
        {error && (
          <div className="error-banner" style={{ marginBottom: "1.5rem" }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

        {/* Toggle between Login and Register if not in Forgot Password mode */}
        {mode !== "forgot-password" && (
          <div className="segmented-control">
            <button
              className={`segmented-btn ${mode === "login" ? "active" : ""}`}
              onClick={() => switchMode("login")}
              type="button"
            >
              Sign in
            </button>
            <button
              className={`segmented-btn ${mode === "register" ? "active" : ""}`}
              onClick={() => switchMode("register")}
              type="button"
            >
              Register
            </button>
          </div>
        )}

        {/* =============== LOGIN FORM =============== */}
        {mode === "login" && (
          <form onSubmit={handleLoginSubmit} className="auth-form clean-form">
            <div className="form-group clean">
              <label htmlFor="email">Email address</label>
              <input
                type="email"
                id="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group clean">
              <label htmlFor="password">Password</label>
              <div className="input-with-eye">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              <div className="forgot-password-link-wrapper">
                <button
                  type="button"
                  className="link-button-clean"
                  onClick={() => switchMode("forgot-password")}
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="primary-button solid black-btn"
              disabled={isLoading}
            >
              {isLoading ? <span className="spinner-small" /> : "Sign in"}
            </button>
          </form>
        )}

        {/* =============== REGISTER FORM =============== */}
        {mode === "register" && (
          <div className="auth-steps-container">
            <div className="step-indicator">
              <div className={`step-dot ${regStep === 1 ? "active" : ""}`} />
              <div className={`step-dot ${regStep === 2 ? "active" : ""}`} />
              <div className={`step-dot ${regStep === 3 ? "active" : ""}`} />
            </div>

            {/* Step 1: Account Access Info */}
            {regStep === 1 && (
              <form
                onSubmit={handleRegisterSubmitStep1}
                className="auth-form clean-form slider-entered"
              >
                <div className="form-group clean">
                  <label>Email address</label>
                  <input
                    type="email"
                    placeholder="Your email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group clean">
                  <label>Password</label>
                  <div className="input-with-eye">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      placeholder="Password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                    >
                      {showRegPassword ? (
                        <Eye size={20} />
                      ) : (
                        <EyeOff size={20} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="form-group clean">
                  <label>Confirm Password</label>
                  <div className="input-with-eye">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="primary-button solid black-btn"
                  disabled={otpSending}
                >
                  {otpSending ? <span className="spinner-small" /> : "Register"}
                </button>
              </form>
            )}

            {/* Step 2: Email Validation (Simulated) */}
            {regStep === 2 && (
              <form
                onSubmit={handleRegisterSubmitStep2}
                className="auth-form slider-entered"
              >
                <h3 style={{ marginBottom: "0.5rem", textAlign: "center" }}>
                  Bestätige deine E-Mail
                </h3>
                <p
                  style={{
                    color: "var(--text-muted)",
                    textAlign: "center",
                    marginBottom: "1.5rem",
                    fontSize: "0.875rem",
                  }}
                >
                  Wir haben einen 4-stelligen Code an{" "}
                  <strong>{regEmail || "deine E-Mail"}</strong> gesendet.
                </p>

                <div className="otp-container">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      type="number"
                      maxLength={1}
                      style={{ fontSize: "2rem" }}
                      className="otp-input"
                      value={regOtp[index]}
                      onChange={(e) => {
                        const newOtp = [...regOtp];
                        newOtp[index] = e.target.value;
                        setRegOtp(newOtp);
                        if (e.target.value && e.target.nextElementSibling) {
                          (
                            e.target.nextElementSibling as HTMLInputElement
                          ).focus();
                        }
                      }}
                    />
                  ))}
                </div>
                <button
                  type="submit"
                  className="black-btn"
                  style={{ width: "100%", marginTop: "1rem" }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="spinner-small" />
                  ) : (
                    "Code überprüfen"
                  )}
                </button>
                <div
                  style={{
                    textAlign: "center",
                    marginTop: "1rem",
                    display: "flex",
                    justifyContent: "center",
                    gap: "1rem",
                  }}
                >
                  <button
                    type="button"
                    className="link-button-clean"
                    onClick={() => setRegStep(1)}
                  >
                    Zurück
                  </button>
                  <button
                    type="button"
                    className="link-button-clean"
                    onClick={handleResendRegOtp}
                    disabled={resendCooldown > 0 || otpSending}
                  >
                    {resendCooldown > 0
                      ? `Erneut senden (${resendCooldown}s)`
                      : "Code erneut senden"}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Profile Details */}
            {regStep === 3 && (
              <form
                onSubmit={handleRegisterSubmitStep3}
                className="slider-entered"
              >
                <h3 style={{ marginBottom: "1.5rem", textAlign: "center" }}>
                  Erzähl uns etwas über dich
                </h3>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Vorname</label>
                  <div className="input-with-icon">
                    <User className="input-icon" size={20} />
                    <input
                      type="text"
                      placeholder="Max"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Nachname</label>
                  <div className="input-with-icon">
                    <User className="input-icon" size={20} />
                    <input
                      type="text"
                      placeholder="Mustermann"
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Geburtsdatum (Optional)</label>
                  <div className="input-with-icon">
                    <Calendar className="input-icon" size={20} />
                    <input
                      type="date"
                      value={regBirthday}
                      onChange={(e) => setRegBirthday(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Standort (Optional)</label>
                  <div className="input-with-icon">
                    <MapPin className="input-icon" size={20} />
                    <input
                      type="text"
                      placeholder="Berlin, Deutschland"
                      value={regLocation}
                      onChange={(e) => setRegLocation(e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Ich suche nach...</label>
                  <div className="input-with-icon">
                    <Briefcase className="input-icon" size={20} />
                    <select
                      value={regField}
                      onChange={(e) => setRegField(e.target.value)}
                    >
                      <option value="ausbildung">Ausbildung</option>
                      <option value="dual_study">Duales Studium</option>
                      <option value="praktikum">Praktikum</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="black-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="spinner-small" />
                  ) : (
                    "Profil erstellen"
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {mode !== "forgot-password" && (
          <div className="social-login-container">
            <div className="social-sign-in-text">Or</div>
            <div className="login-btn">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google Login fehlgeschlagen.")}
                type="standard"
                theme="outline"
                size="large"
                shape="rectangular"
                text="signin_with"
                width="100%"
              />
            </div>
          </div>
        )}

        {/* =============== FORGOT PASSWORD FORM =============== */}
        {mode === "forgot-password" && (
          <div className="auth-steps-container">
            <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              Passwort zurücksetzen
            </h2>

            <div className="step-indicator">
              <div className={`step-dot ${forgotStep === 1 ? "active" : ""}`} />
              <div className={`step-dot ${forgotStep === 2 ? "active" : ""}`} />
              <div className={`step-dot ${forgotStep === 3 ? "active" : ""}`} />
            </div>

            {forgotStep === 1 && (
              <form onSubmit={handleForgotStep1} className="slider-entered">
                <p
                  style={{
                    color: "var(--text-muted)",
                    textAlign: "center",
                    marginBottom: "1.5rem",
                    fontSize: "0.875rem",
                  }}
                >
                  Gib deine E-Mail-Adresse ein, um einen Code zum Zurücksetzen
                  deines Passworts zu erhalten.
                </p>
                <div className="form-group">
                  <label>E-Mail Adresse</label>
                  <div className="input-with-icon">
                    <Mail className="input-icon" size={20} />
                    <input
                      type="email"
                      placeholder="mail@beispiel.de"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="primary-button solid black-btn"
                  style={{ width: "100%", marginTop: "1rem" }}
                  disabled={otpSending}
                >
                  {otpSending ? <span className="spinner-small" /> : "Senden"}
                </button>
                <button
                  type="button"
                  style={{ marginTop: "1rem" }}
                  className="link-button-clean"
                  onClick={() => switchMode("login")}
                >
                  Zurück zur Anmeldung
                </button>
              </form>
            )}

            {forgotStep === 2 && (
              <form
                onSubmit={handleForgotStep2}
                className="auth-form slider-entered"
              >
                <p
                  style={{
                    color: "var(--text-muted)",
                    textAlign: "center",
                    marginBottom: "1.5rem",
                    fontSize: "0.875rem",
                  }}
                >
                  Wir haben einen Bestätigungscode an{" "}
                  <strong>{forgotEmail}</strong> gesendet.
                </p>
                <div className="otp-container">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      type="number"
                      maxLength={1}
                      style={{ fontSize: "2rem" }}
                      className="otp-input"
                      value={forgotOtp[index]}
                      onChange={(e) => {
                        const newOtp = [...forgotOtp];
                        newOtp[index] = e.target.value;
                        setForgotOtp(newOtp);
                        if (e.target.value && e.target.nextElementSibling) {
                          (
                            e.target.nextElementSibling as HTMLInputElement
                          ).focus();
                        }
                      }}
                    />
                  ))}
                </div>
                <button
                  type="submit"
                  className="solid black-btn"
                  style={{ width: "100%", marginTop: "1rem" }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="spinner-small" />
                  ) : (
                    "Code überprüfen"
                  )}
                </button>
                <div
                  style={{
                    textAlign: "center",
                    marginTop: "1rem",
                    display: "flex",
                    justifyContent: "center",
                    gap: "1rem",
                  }}
                >
                  <button
                    type="button"
                    className="link-button-clean"
                    onClick={() => setForgotStep(1)}
                  >
                    Zurück
                  </button>
                  <button
                    type="button"
                    className="link-button-clean"
                    onClick={handleResendForgotOtp}
                    disabled={resendCooldown > 0 || otpSending}
                  >
                    {resendCooldown > 0
                      ? `Erneut senden (${resendCooldown}s)`
                      : "Code erneut senden"}
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={changePassword} className="slider-entered">
                <p
                  style={{
                    color: "var(--text-muted)",
                    textAlign: "center",
                    marginBottom: "1.5rem",
                    fontSize: "0.875rem",
                  }}
                >
                  Bitte gib dein neues Passwort ein.
                </p>
                <div className="form-group">
                  <label>Neues Passwort</label>
                  <div className="input-with-icon">
                    <Lock className="input-icon" size={20} />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Confirm Neues Passwort</label>
                  <div className="input-with-icon">
                    <Lock className="input-icon" size={20} />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={forgotNewPasswordConfirm}
                      onChange={(e) =>
                        setForgotNewPasswordConfirm(e.target.value)
                      }
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="solid black-btn"
                  style={{ width: "100%", marginTop: "1rem" }}
                >
                  Passw ort speichern
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
