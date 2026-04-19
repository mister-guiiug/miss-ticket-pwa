import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

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

  const getConfig = () => {
    switch (notification.type) {
      case 'success':
        return {
          icon: <CheckCircle size={20} />,
          bgColor: 'var(--success-bg)',
          borderColor: 'var(--success)',
          iconColor: 'var(--success)',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={20} />,
          bgColor: 'var(--warning-bg)',
          borderColor: 'var(--warning)',
          iconColor: 'var(--warning)',
        };
      case 'error':
        return {
          icon: <AlertCircle size={20} />,
          bgColor: 'var(--error-bg)',
          borderColor: 'var(--error)',
          iconColor: 'var(--error)',
        };
      default:
        return {
          icon: <Info size={20} />,
          bgColor: 'var(--info-bg)',
          borderColor: 'var(--info)',
          iconColor: 'var(--info)',
        };
    }
  };

  const config = getConfig();

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: 'var(--bg-card)',
      border: `1px solid ${config.borderColor}`,
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
      minWidth: '320px',
      maxWidth: '400px',
      zIndex: 1000,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'opacity 0.3s, transform 0.3s',
      overflow: 'hidden',
    }}>
      {/* Colored accent bar */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '4px',
        backgroundColor: config.borderColor,
      }} />

      <div style={{ padding: '16px 16px 16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          {/* Icon */}
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: config.bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ color: config.iconColor }}>{config.icon}</span>
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '15px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '4px',
            }}>
              {notification.title}
            </div>
            <div style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: '1.4',
            }}>
              {notification.message}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => {
              setVisible(false);
              setTimeout(() => onClose(notification.id), 300);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
          >
            <X size={16} />
          </button>
        </div>
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
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={onClose}
        />
      ))}
    </div>
  );
}
