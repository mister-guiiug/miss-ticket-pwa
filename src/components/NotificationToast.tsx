import { useEffect, useState } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: number;
}

interface NotificationToastProps {
  notification: Notification;
  onClose: (id: string) => void;
}

export function NotificationToast({ notification, onClose }: NotificationToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose(notification.id), 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  const colors = {
    success: { bg: 'rgba(40, 167, 69, 0.1)', border: '#28a745', icon: '✅' },
    warning: { bg: 'rgba(255, 193, 7, 0.1)', border: '#ffc107', icon: '⚠️' },
    error: { bg: 'rgba(220, 53, 69, 0.1)', border: '#dc3545', icon: '❌' },
    info: { bg: 'rgba(23, 162, 184, 0.1)', border: '#17a2b8', icon: 'ℹ️' }
  };

  const color = colors[notification.type];

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      backgroundColor: 'var(--card-bg, #1e1e2e)',
      border: `1px solid ${color.border}`,
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
      minWidth: '300px',
      maxWidth: '400px',
      zIndex: 1000,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.3s, transform 0.3s'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <span style={{ fontSize: '20px' }}>{color.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: `var(--text-primary, #e0e0e0)`,
            marginBottom: '4px'
          }}>
            {notification.title}
          </div>
          <div style={{
            fontSize: '14px',
            color: 'var(--text-secondary, #9ca3af)'
          }}>
            {notification.message}
          </div>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(() => onClose(notification.id), 300);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary, #9ca3af)',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px'
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

interface NotificationContainerProps {
  notifications: Notification[];
  onClose: (id: string) => void;
}

export function NotificationContainer({ notifications, onClose }: NotificationContainerProps) {
  return (
    <div style={{ position: 'fixed', bottom: '16px', right: '16px', zIndex: 1000 }}>
      {notifications.map((notification) => (
        <div key={notification.id} style={{ marginBottom: '8px' }}>
          <NotificationToast notification={notification} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}
