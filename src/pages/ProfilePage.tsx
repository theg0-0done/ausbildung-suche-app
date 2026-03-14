import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { userApi, favoritesApi, historyApi } from "../userApi";
import { useNavigate } from "react-router-dom";
import {
  User,
  Calendar,
  MapPin,
  Mail,
  Briefcase,
  Moon,
  Sun,
  Network,
} from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import { useNotification } from "../contexts/NotificationContext";
import { isValidEmail } from "../utils/validation";

interface Profile {
  displayName: string;
  email: string;
  bereich: string;
  jobart: string;
  birthday: string;
  location: string;
  theme?: string;
  emailNotifications?: boolean;
}

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme, setTheme } = useThemeStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  // Stats
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [historyCount, setHistoryCount] = useState(0);

  // Edit State
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: "",
    email: "",
    bereich: "",
    jobart: "",
    birthday: "",
    location: "",
    emailNotifications: true,
  });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    Promise.all([
      userApi.getProfile(),
      favoritesApi.getFavorites().catch(() => ({ data: [] })),
      historyApi.getHistory().catch(() => ({ data: [] })),
    ])
      .then(([profileData, favData, histData]) => {
        setProfile(profileData);
        setEditForm({
          displayName: profileData.displayName || "",
          email: profileData.email || "",
          bereich: profileData.bereich || "",
          jobart: profileData.jobart || "",
          birthday: profileData.birthday || "",
          location: profileData.location || "",
          emailNotifications: profileData.emailNotifications !== false,
        });
        if (
          profileData.theme &&
          profileData.theme !== useThemeStore.getState().theme
        ) {
          setTheme(profileData.theme);
        }
        setFavoritesCount(
          Array.isArray(favData.data) ? favData.data.length : 0,
        );
        setHistoryCount(
          Array.isArray(histData.data) ? histData.data.length : 0,
        );
      })
      .catch(() => {
        /* profile load failed silently */
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Email validation
    if (!isValidEmail(editForm.email)) {
      showNotification("Bitte gib eine gültige E-Mail-Adresse ein.", "error");
      return;
    }

    try {
      await userApi.updateProfile(editForm as any);
      if (profile) setProfile({ ...profile, ...editForm });
      setEditing(false);
      showNotification("Profil erfolgreich aktualisiert!", "success");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Speichern fehlgeschlagen";
      showNotification(message, "error");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth");
    } catch {
      /* logout failure handled silently */
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
    const newTheme = theme === "light" ? "dark" : "light";
    if (user) {
      userApi.updateProfile({ theme: newTheme }).catch(console.error);
    }
  };

  const handleEmailNotificationToggle = () => {
    const newVal = !(profile?.emailNotifications !== false);
    if (user) {
      userApi.updateProfile({ emailNotifications: newVal }).catch(console.error);
      if (profile) setProfile({ ...profile, emailNotifications: newVal });
      setEditForm({ ...editForm, emailNotifications: newVal } as any);
    }
  };

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: "100vh", justifyContent: "center" }}>
        <div className="spinner" />
        <p>Lade Profil...</p>
      </div>
    );
  }

  // Unauthenticated State: Show a beautiful auth gateway
  if (!user) {
    return (
      <div className="auth-gateway-page">
        <div className="gateway-content">
          <div className="gateway-logo">
            <User size={48} color="#fff" strokeWidth={1.5} />
          </div>
          <h2 className="gateway-title">Dein Profil</h2>
          <p className="gateway-subtitle">
            Melde dich an, um deine Favoriten zu speichern und deinen Verlauf zu
            sehen.
          </p>

          <div className="gateway-actions">
            <button className="btn-primary" onClick={() => navigate("/auth")}>
              Anmelden
            </button>
            <button className="btn-secondary" onClick={() => navigate("/auth")}>
              Neues Konto erstellen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated State: New Template Match
  return (
    <div className="profile-template-page">
      {!editing ? (
        <>
          <div className="profile-info-header">
            <div className="profile-avatar-circle">
              {profile?.displayName?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="profile-info-text">
              <h3 className="profile-name-text">
                {profile?.displayName || "Benutzer"}
              </h3>
              <p className="profile-email-text">{profile?.email || "-"}</p>
              <button
                className="edit-profile-btn"
                onClick={() => setEditing(true)}
              >
                Profil bearbeiten
              </button>
            </div>
          </div>

          <div className="profile-stats-row">
            <div className="stat-box">
              <div className="stat-number">{favoritesCount}</div>
              <div className="stat-label">Favoriten</div>
            </div>
            <div className="stat-box">
              <div className="stat-number">{historyCount}</div>
              <div className="stat-label">Angesehen</div>
            </div>
          </div>

          <div className="profile-user-infos">
            <h4 className="user-infos-title">Benutzerinformationen:</h4>

            <div className="info-row">
              <div className="info-icon">
                <Briefcase size={20} />
              </div>
              <div className="info-label">{profile?.bereich || "-"}</div>
            </div>
            <div className="info-row">
              <div className="info-icon">
                <Network size={20} />
              </div>
              <div className="info-label">{profile?.jobart || "-"}</div>
            </div>
            <div className="info-row">
              <div className="info-icon">
                <Calendar size={20} />
              </div>
              <div className="info-label">{profile?.birthday || "-"}</div>
            </div>
            <div className="info-row">
              <div className="info-icon">
                <MapPin size={20} />
              </div>
              <div className="info-label">{profile?.location || "-"}</div>
            </div>
            <div
              className="info-row"
              onClick={handleThemeToggle}
              style={{ cursor: "pointer" }}
            >
              <div className="info-icon">
                {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div className="info-label">Design</div>
              <div className="theme-toggle-switch-native">
                <div
                  className={`theme-toggle-knob-native ${theme === "dark" ? "active" : ""}`}
                />
              </div>
            </div>
            <div
              className="info-row"
              onClick={handleEmailNotificationToggle}
              style={{ cursor: "pointer" }}
            >
              <div className="info-icon">
                <Mail size={20} />
              </div>
              <div className="info-label">Tägliche E-Mails</div>
              <div className="theme-toggle-switch-native">
                <div
                  className={`theme-toggle-knob-native ${profile?.emailNotifications !== false ? "active" : ""}`}
                />
              </div>
            </div>
          </div>

          <div className="profile-logout-container">
            <button className="logout-pill" onClick={handleLogout}>
              Abmelden
            </button>
          </div>
        </>
      ) : (
        <div className="profile-edit-mode">
          <h4 className="user-infos-title">Profil bearbeiten</h4>
          <form onSubmit={handleSave} className="edit-profile-form">
            <div className="info-row edit">
              <div className="info-icon">
                <User size={20} />
              </div>
              <input
                value={editForm.displayName}
                onChange={(e) =>
                  setEditForm({ ...editForm, displayName: e.target.value })
                }
                placeholder="Vor- und Nachname"
                className="edit-input"
              />
            </div>
            <div className="info-row edit">
              <div className="info-icon">
                <Mail size={20} />
              </div>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
                placeholder="email@beispiel.de"
                className="edit-input"
              />
            </div>
            <div className="info-row edit">
              <div className="info-icon">
                <Briefcase size={20} />
              </div>
              <input
                value={editForm.bereich}
                onChange={(e) =>
                  setEditForm({ ...editForm, bereich: e.target.value })
                }
                placeholder="Bereich"
                className="edit-input"
              />
            </div>
            <div className="info-row edit">
              <div className="info-icon">
                <Network size={20} />
              </div>
              <input
                value={editForm.jobart}
                onChange={(e) =>
                  setEditForm({ ...editForm, jobart: e.target.value })
                }
                placeholder="Jobart"
                className="edit-input"
              />
            </div>
            <div className="info-row edit">
              <div className="info-icon">
                <Calendar size={20} />
              </div>
              <input
                value={editForm.birthday}
                onChange={(e) =>
                  setEditForm({ ...editForm, birthday: e.target.value })
                }
                placeholder="Geburtsdatum (DD.MM.YYYY)"
                className="edit-input"
              />
            </div>
            <div className="info-row edit">
              <div className="info-icon">
                <MapPin size={20} />
              </div>
              <input
                value={editForm.location}
                onChange={(e) =>
                  setEditForm({ ...editForm, location: e.target.value })
                }
                placeholder="Standort"
                className="edit-input"
              />
            </div>

            <div className="edit-actions-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEditing(false)}
              >
                Abbrechen
              </button>
              <button type="submit" className="btn-primary">
                Speichern
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
