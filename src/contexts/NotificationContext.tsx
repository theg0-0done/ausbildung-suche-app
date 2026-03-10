import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";

type NotificationType = "success" | "error" | "warning" | "info";

interface Notification {
  title: string;
  subtitle?: string;
  type: NotificationType;
  id: number;
}

interface ConfirmState {
  message: string;
  resolve: (value: boolean) => void;
}

interface NotificationContextType {
  showNotification: (
    title: string,
    type: NotificationType,
    subtitle?: string,
  ) => void;
  showConfirm: (message: string) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const showNotification = useCallback(
    (title: string, type: NotificationType, subtitle?: string) => {
      const id = Date.now();
      setNotification({ title, type, subtitle, id });

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setNotification((current) => (current?.id === id ? null : current));
      }, 5000);
    },
    [],
  );

  const dismissNotification = () => setNotification(null);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="notification-icon" />;
      case "error":
        return <AlertCircle className="notification-icon" />;
      case "warning":
        return <AlertTriangle className="notification-icon" />;
      case "info":
        return <Info className="notification-icon" />;
    }
  };

  const handleConfirmAction = (choice: boolean) => {
    if (confirm) {
      confirm.resolve(choice);
      setConfirm(null);
    }
  };

  const showConfirm = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => {
      setConfirm({ message, resolve });
    });
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, showConfirm }}>
      {children}

      {/* Glassmorphism Notifications */}
      {notification && (
        <div className={`glass-notification-container visible`}>
          <div className={`glass-notification ${notification.type}`}>
            <div className="notification-left">
              {getIcon(notification.type)}
            </div>
            <div className="notification-center">
              <div className="notification-title">{notification.title}</div>
              {notification.subtitle && (
                <div className="notification-subtitle">
                  {notification.subtitle}
                </div>
              )}
            </div>
            <button
              className="notification-dismiss"
              onClick={dismissNotification}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Premium Confirm Modal */}
      {confirm && (
        <div className="confirm-overlay visible">
          <div className="confirm-modal">
            <h3 className="confirm-title">Bestätigen</h3>
            <p className="confirm-message">{confirm.message}</p>
            <div className="confirm-actions">
              <button
                className="confirm-btn-cancel"
                onClick={() => handleConfirmAction(false)}
              >
                Abbrechen
              </button>
              <button
                className="confirm-btn-ok"
                onClick={() => handleConfirmAction(true)}
              >
                Bestätigen
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
};
