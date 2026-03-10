import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import { favoritesApi } from "../userApi";

/**
 * Shared hook for favorite toggle logic.
 * Eliminates duplicate code between JobCard and DetailPage.
 */
export function useFavorite(refnr: string) {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (user && refnr) {
      favoritesApi
        .checkFavorite(refnr)
        .then((res) => setIsFavorite(res.isFavorite))
        .catch(() => {
          /* silently fail for non-critical check */
        });
    }
  }, [user, refnr]);

  const toggleFavorite = useCallback(
    async (jobData?: {
      title?: string;
      employer?: string;
      location?: string;
    }) => {
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
            refnr,
            title: jobData?.title || "",
            employer: jobData?.employer || "",
            location: jobData?.location || "",
          });
          setIsFavorite(true);
        }
      } catch {
        showNotification("Aktion fehlgeschlagen", "error");
      }
    },
    [user, refnr, isFavorite, showNotification],
  );

  return { isFavorite, toggleFavorite };
}
