export function Loading({ text = "Lade Profil..." }: { text?: string }) {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loader-circle"></div>
        <p className="loading-text">{text}</p>
      </div>
    </div>
  );
}
