import { useState, useEffect } from "react";
import type { JobDetail } from "../types";
import { fetchJobDetail, getJobUrl, getLogoUrl } from "../api";
import { useAuth } from "../contexts/AuthContext";
import { favoritesApi, historyApi } from "../userApi";
import DetailSection from "../components/DetailSection";
import MetadataGrid from "../components/MetadataGrid";
import RichContentRenderer from "../components/RichContentRenderer";
import RecursiveFieldRenderer from "../components/RecursiveFieldRenderer";
import { MapPin, Calendar, Network, Clock } from "lucide-react";
import { useNotification } from "../contexts/NotificationContext";

interface DetailPageProps {
  refnr: string;
  onBack: () => void;
}

// ── helpers ──────────────────────────────────────────────

function formatDate(d?: string) {
  if (!d) return undefined;
  try {
    return new Date(d).toLocaleDateString("de-DE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function formatCurrency(n?: number) {
  if (n === undefined || n === null) return undefined;
  return `${n.toLocaleString("de-DE")} €`;
}

const VERGUETUNG_MAP: Record<string, string> = {
  AUSBILDUNGSVERGUETUNG_NACH_JAHREN: "Nach Lehrjahr gestaffelt",
  KEINE_ANGABEN: "Keine Angaben",
};

/** Keys rendered in dedicated sections OR internal / hidden */
const KNOWN_KEYS = new Set([
  "stellenangebotsTitel",
  "stellenangebotsBeschreibung",
  "hauptberuf",
  "referenznummer",
  "firma",
  "stellenangebotsart",
  "ausbildungsart",
  "stellenlokationen",
  "eintrittszeitraum",
  "veroeffentlichungszeitraum",
  "datumErsteVeroeffentlichung",
  "geforderterBildungsabschluss",
  "arbeitszeitVollzeit",
  "arbeitszeitTeilzeitVormittag",
  "arbeitszeitTeilzeitNachmittag",
  "arbeitszeitTeilzeitAbend",
  "arbeitszeitTeilzeitFlexibel",
  "arbeitszeitHeimarbeitTelearbeit",
  "arbeitszeitSchichtNachtWochenende",
  "verguetungsangabe",
  "ausbildungsverguetungJahr1",
  "ausbildungsverguetungJahr2",
  "ausbildungsverguetungJahr3",
  "ausbildungsverguetungJahr4",
  "vertragsdauer",
  "allianzpartnerUrl",
  "allianzpartnerName",
  "arbeitgeberKundennummerHash",
  "istBetreut",
  "aenderungsdatum",
  "istGeringfuegigeBeschaeftigung",
  "istBehinderungGefordert",
  "externeUrl",
  "externeURL",
]);

// ── Component ────────────────────────────────────────────

export default function DetailPage({ refnr, onBack }: DetailPageProps) {
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);
    setLogoFailed(false);

    async function load() {
      try {
        const data = await fetchJobDetail(refnr);
        if (!cancelled) {
          setDetail(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Fehler beim Laden der Details",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refnr]);

  const d = detail ?? ({} as JobDetail);
  const title = d.stellenangebotsTitel || refnr;
  const employer = d.firma || "";
  const jobUrl = getJobUrl(d.referenznummer || refnr);  

  // Logo
  const logoHash = d.arbeitgeberKundennummerHash as string | undefined;
  const logoUrl = logoHash ? getLogoUrl(logoHash) : null;

  // Location
  const primaryLoc = d.stellenlokationen?.[0]?.adresse;
  const locationStr = primaryLoc
    ? [
        [primaryLoc.strasse, primaryLoc.hausnummer].filter(Boolean).join(" "),
        primaryLoc.plz,
        primaryLoc.ort,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  // Working time
  const workingTimes: string[] = [];
  if (d.arbeitszeitVollzeit) workingTimes.push("Vollzeit");
  if (d.arbeitszeitTeilzeitFlexibel) workingTimes.push("Teilzeit");
  if (d.arbeitszeitHeimarbeitTelearbeit) workingTimes.push("Homeoffice");
  if (d.arbeitszeitSchichtNachtWochenende) workingTimes.push("Schichtarbeit");

  // Salary per year
  const salaryEntries = [
    {
      label: "1. Lehrjahr",
      value: formatCurrency(d.ausbildungsverguetungJahr1),
    },
    {
      label: "2. Lehrjahr",
      value: formatCurrency(d.ausbildungsverguetungJahr2),
    },
    {
      label: "3. Lehrjahr",
      value: formatCurrency(d.ausbildungsverguetungJahr3),
    },
    {
      label: "4. Lehrjahr",
      value: formatCurrency(d.ausbildungsverguetungJahr4),
    },
  ].filter((e) => e.value !== undefined);

  const hasSalary = salaryEntries.length > 0 || d.verguetungsangabe;

  // Try to find the external apply link
  const bewerbungsUrl =
    typeof d.externeUrl === "string"
      ? d.externeUrl
      : typeof d.externeURL === "string"
        ? d.externeURL
        : typeof d.allianzpartnerUrl === "string"
          ? d.allianzpartnerUrl
          : jobUrl;

  useEffect(() => {
    // Add to history once the detail implies a successful load
    if (user && detail?.referenznummer) {
      historyApi
        .addHistoryObject({
          refnr: String(detail.referenznummer || refnr),
          title: String(detail.stellenangebotsTitel || title || ""),
          employer: String(detail.firma || employer || ""),
        })
        .catch(console.error);
    }
  }, [user, detail, title, employer]);

  useEffect(() => {
    // Check if favorite
    if (user && refnr) {
      favoritesApi
        .checkFavorite(refnr)
        .then((res) => setIsFavorite(res.isFavorite))
        .catch(console.error);
    }
  }, [user, refnr]);

  const toggleFavorite = async () => {
    if (!user) {
      showNotification(
        "Bitte melde dich an, um Favoriten zu speichern.",
        "error",
      );
      return;
    }

    try {
      if (isFavorite) {
        await favoritesApi.removeFavorite(refnr);
        setIsFavorite(false);
      } else {
        await favoritesApi.addFavorite({
          refnr: refnr,
          title: title || "",
          employer: employer || "",
          location: locationStr || "",
        });
        setIsFavorite(true);
      }
    } catch (err) {
      console.error(err);
      showNotification("Aktion fehlgeschlagen", "error");
    }
  };

  // Loading state – show skeleton
  if (loading) {
    return (
      <div className="detail-page">
        <button className="back-btn" onClick={onBack}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Zurück zur Suche
        </button>
        <article className="detail-card" style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="loading-container">
            <div className="spinner" />
            <p>Lade Anzeige...</p>
          </div>
        </article>
      </div>
    );
  }

  // Error state
  if (error && !detail) {
    return (
      <div className="detail-page">
        <button className="back-btn" onClick={onBack}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Zurück zur Suche
        </button>
        <article className="detail-card">
          <div className="error-banner">
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
          <section className="detail-section detail-cta">
            <a
              href={jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="external-link-btn"
            >
              Auf Arbeitsagentur.de ansehen
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </section>
        </article>
      </div>
    );
  }  

  return (
    <div className="detail-page">
      <button className="back-btn" onClick={onBack}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Zurück zur Suche
      </button>

      <article className="detail-card">
        {/* ── Hero Header ── */}
        <header className="detail-header">
          <div className="detail-logo">
            {logoUrl && !logoFailed ? (
              <img
                src={logoUrl}
                alt={`${employer} Logo`}
                className="detail-logo-img"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <div className="logo-placeholder large">
                {employer?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
          </div>
          <div className="detail-header-info">
            <div className="detail-header-top">
              <h1>{title}</h1>
              <button
                className={`favorite-btn large ${isFavorite ? "active" : ""}`}
                onClick={toggleFavorite}
                aria-label={
                  isFavorite
                    ? "Von Favoriten entfernen"
                    : "Zu Favoriten hinzufügen"
                }
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill={isFavorite ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              </button>
            </div>
            {employer && <p className="detail-company">{employer}</p>}
            {/* Meta info removed from header and moved to tags row below */}
          </div>
        </header>

        {/* ── Tags ── */}
        <div className="detail-tags">
          <span className="tag">
            <Network className="small-icon" />
            {d.stellenangebotsart === "AUSBILDUNG" || !d.stellenangebotsart
              ? "Ausbildung"
              : d.stellenangebotsart}
          </span>
          {d.eintrittszeitraum?.von && (
            <span className="tag">
              <Calendar className="small-icon" /> Ab{" "}
              {formatDate(d.eintrittszeitraum.von)}
            </span>
          )}
          {locationStr && (
            <span className="tag">
              <MapPin className="small-icon" />
              {locationStr}
            </span>
          )}
          {workingTimes.length > 0 && (
            <span className="tag">
              <Clock className="small-icon" /> {workingTimes.join(" · ")}
            </span>
          )}
        </div>

        {/* ── Stellenbeschreibung (Markdown) ── */}
        {d.stellenangebotsBeschreibung && (
          <DetailSection title="Stellenbeschreibung">
            <RichContentRenderer content={d.stellenangebotsBeschreibung} />
          </DetailSection>
        )}

        {/* ── Vergütung ── */}
        {hasSalary && (
          <DetailSection title="Vergütung">
            {d.verguetungsangabe && (
              <p className="detail-subtitle">
                {VERGUETUNG_MAP[d.verguetungsangabe] || d.verguetungsangabe}
              </p>
            )}
            {salaryEntries.length > 0 && <MetadataGrid items={salaryEntries} />}
          </DetailSection>
        )}

        {/* ── Additional Stellenlokationen ── */}
        {d.stellenlokationen && d.stellenlokationen.length > 1 && (
          <DetailSection title="Weitere Arbeitsorte">
            <div className="extra-locations">
              {d.stellenlokationen.slice(1).map((loc, i) => {
                const addr = loc.adresse;
                return (
                  <div key={i} className="tag">
                    {addr
                      ? [
                          [addr.strasse, addr.hausnummer]
                            .filter(Boolean)
                            .join(" "),
                          addr.plz,
                          addr.ort,
                        ]
                          .filter(Boolean)
                          .join(", ")
                      : `Standort ${i + 2}`}
                  </div>
                );
              })}
            </div>
          </DetailSection>
        )}

        {/* ── Weitere Informationen (fallback for unknown fields) ── */}
        {detail &&
          (() => {
            const remaining: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(detail)) {
              if (
                !KNOWN_KEYS.has(k) &&
                v !== null &&
                v !== undefined &&
                v !== "" &&
                v !== false
              ) {
                remaining[k] = v;
              }
            }
            if (Object.keys(remaining).length === 0) return null;
            return (
              <DetailSection
                title="Weitere Informationen"
                className="extra-section"
              >
                <RecursiveFieldRenderer data={remaining} />
              </DetailSection>
            );
          })()}

        {/* ── CTA ── */}
        <section className="detail-section detail-cta">
          <a
            href={jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="external-link-btn"
          >
            Arbeitsagentur.de öffnen
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
          <a
            href={bewerbungsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="external-link-btn"
          >
            Jetzt bewerben
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </section>
      </article>
    </div>
  );
}
