import { useState, useRef } from 'react';
import { QrReader } from 'react-qr-reader';
import { initiatePairing, generatePairingCode, parseQRCode } from '../lib/pairing';
import { X, QrCode, Keyboard, Check } from 'lucide-react';

interface PairingDialogProps {
  userId: string;
  onPaired: () => void;
  onCancel: () => void;
}

type Method = 'qr' | 'code';

export function PairingDialog({ userId, onPaired, onCancel }: PairingDialogProps) {
  const [method, setMethod] = useState<Method>('qr');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleQRScan = (data: string | null) => {
    if (data && !loading) {
      handlePairing(data);
    }
  };

  const handlePairing = async (data: string) => {
    setLoading(true);
    setError(null);

    try {
      let token = data;
      let desktopId = '';

      if (data.startsWith('missticket:pair?')) {
        const parsed = parseQRCode(data);
        if (!parsed) {
          throw new Error('QR code invalide');
        }
        token = parsed.token;
        desktopId = parsed.desktopId;
      } else {
        throw new Error('Veuillez scanner le QR code affiché sur le desktop');
      }

      await initiatePairing(token, desktopId, userId);
      setSuccess(true);
      setTimeout(() => onPaired(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'appariement');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Le code doit faire 6 caractères');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Pour le code manuel, utiliser le QR code pour le moment
      throw new Error('Utilisez le QR code pour un appariement plus simple');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'appariement');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={overlayStyle}>
        <div style={{
          ...dialogStyle,
          padding: '48px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 20px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--success), #16a34a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(34, 197, 94, 0.3)',
          }}>
            <Check size={32} color="#ffffff" strokeWidth={3} />
          </div>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '22px',
            fontWeight: '700',
            color: 'var(--success)',
          }}>
            Appariement réussi !
          </h2>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--text-secondary)',
          }}>
            Le desktop a été appairé avec succès
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <div style={dialogStyle}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}>
          <div>
            <h2 style={{
              margin: '0 0 4px 0',
              fontSize: '20px',
              fontWeight: '700',
              color: 'var(--text-primary)',
            }}>
              Appairer un Desktop
            </h2>
            <p style={{
              margin: 0,
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}>
              Scannez le QR code ou entrez le code affiché sur votre desktop
            </p>
          </div>

          <button
            onClick={onCancel}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Method toggle */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          padding: '4px',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '12px',
        }}>
          <MethodButton
            active={method === 'qr'}
            icon={<QrCode size={18} />}
            label="QR Code"
            onClick={() => setMethod('qr')}
          />
          <MethodButton
            active={method === 'code'}
            icon={<Keyboard size={18} />}
            label="Code 6 chiffres"
            onClick={() => setMethod('code')}
          />
        </div>

        {/* Content */}
        {method === 'qr' ? (
          <div>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              marginBottom: '16px',
              textAlign: 'center',
            }}>
              Scannez le QR code affiché sur votre desktop
            </p>
            <div style={{
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid var(--border-subtle)',
              backgroundColor: '#000000',
              aspectRatio: '1',
            }}>
              <QrReader
                onResult={(result, error) => {
                  if (result) {
                    handleQRScan(result?.getText());
                  }
                }}
                constraints={{ facingMode: 'environment' }}
                videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
                videoContainerStyle={{ width: '100%', height: '100%', padding: 0 }}
              />
            </div>
          </div>
        ) : (
          <form onSubmit={handleCodeSubmit}>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              marginBottom: '16px',
              textAlign: 'center',
            }}>
              Entrez le code à 6 chiffres affiché sur votre desktop
            </p>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              autoFocus
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '28px',
                textAlign: 'center',
                letterSpacing: '8px',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1.5px solid var(--border-subtle)',
                borderRadius: '12px',
                color: 'var(--text-primary)',
                textTransform: 'uppercase',
                marginBottom: '16px',
                fontFamily: 'monospace',
                outline: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-500)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            />
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '14px',
                background: loading || code.length !== 6
                  ? 'var(--bg-tertiary)'
                  : 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                border: 'none',
                borderRadius: '12px',
                color: loading || code.length !== 6 ? 'var(--text-tertiary)' : '#ffffff',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading || code.length !== 6 ? 'not-allowed' : 'pointer',
                boxShadow: loading || code.length !== 6
                  ? 'none'
                  : '0 4px 12px rgba(244, 63, 94, 0.3)',
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Vérification...' : 'Appairer'}
            </button>
          </form>
        )}

        {/* Error message */}
        {error && (
          <div style={{
            marginTop: '20px',
            padding: '12px 16px',
            backgroundColor: 'var(--error-bg)',
            border: '1px solid var(--error)',
            borderRadius: '10px',
            color: 'var(--error)',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div style={{
            marginTop: '20px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
          }}>
            <div style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              border: '2px solid var(--border-default)',
              borderTopColor: 'var(--primary-500)',
              animation: 'spin 1s linear infinite',
            }} />
            <span>Tentative d'appariement...</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface MethodButtonProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function MethodButton({ active, icon, label, onClick }: MethodButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '10px 16px',
        backgroundColor: active ? 'var(--bg-card)' : 'transparent',
        border: 'none',
        borderRadius: '8px',
        color: active ? 'var(--primary-500)' : 'var(--text-secondary)',
        fontSize: '14px',
        fontWeight: active ? '600' : '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: active ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// Styles
const overlayStyle = {
  position: 'fixed' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'var(--overlay)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
};

const dialogStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '20px',
  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
  width: '100%',
  maxWidth: '480px',
  padding: '24px',
  animation: 'fadeIn 0.2s ease-out',
};

import { AlertTriangle } from 'lucide-react';
