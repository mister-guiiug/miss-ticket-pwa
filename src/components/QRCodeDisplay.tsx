import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, X, Copy } from 'lucide-react';

interface QRCodeDisplayProps {
  onPaired?: (userId: string) => void;
  onClose?: () => void;
}

interface PairingResponse {
  token_id: string;
  qr_data: string;
  pairing_code: string;
}

export function QRCodeDisplay({ onPaired, onClose }: QRCodeDisplayProps) {
  const [qrData, setQrData] = useState<string>('');
  const [pairingCode, setPairingCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [paired, setPaired] = useState(false);

  useEffect(() => {
    startPairing();
  }, []);

  const startPairing = async () => {
    try {
      // Appeler la commande Tauri pour démarrer l'appariement
      const response = await (window as any).__TAURI__.invoke('pairing_start') as PairingResponse;

      setQrData(response.qr_data);
      setPairingCode(response.pairing_code);
      setLoading(false);

      // Poll pour vérifier si l'appariement est terminé
      checkPairingStatus(response.token_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération du QR code');
      setLoading(false);
    }
  };

  const checkPairingStatus = async (tokenId: string) => {
    const interval = setInterval(async () => {
      try {
        const isPaired = await (window as any).__TAURI__.invoke('pairing_is_paired') as boolean;

        if (isPaired) {
          clearInterval(interval);
          setPaired(true);
          const userId = await (window as any).__TAURI__.invoke('pairing_get_user_id') as string;
          onPaired?.(userId);
        }
      } catch (err) {
        console.error('Error checking pairing status:', err);
      }
    }, 2000);

    // Nettoyer l'intervalle après 5 minutes
    setTimeout(() => clearInterval(interval), 300000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pairingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (paired) {
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
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
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
            color: '#22c55e',
          }}>
            Appariement réussi !
          </h2>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--text-secondary, #9ca3af)',
          }}>
            Votre desktop est maintenant connecté
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
          <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: '700',
            color: 'var(--text-primary, #e5e7eb)',
          }}>
            Appairer ce Desktop
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-tertiary, #1f2937)',
                border: '1px solid var(--border-subtle, #374151)',
                color: 'var(--text-secondary, #9ca3af)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{
            padding: '60px 0',
            textAlign: 'center',
            color: 'var(--text-secondary, #9ca3af)',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              margin: '0 auto 16px',
              borderRadius: '50%',
              border: '3px solid var(--border-default, #374151)',
              borderTopColor: '#f43f5e',
              animation: 'spin 1s linear infinite',
            }} />
            <p>Génération du QR code...</p>
          </div>
        ) : error ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#ef4444',
          }}>
            <p>{error}</p>
            <button
              onClick={startPairing}
              style={{
                marginTop: '16px',
                padding: '12px 24px',
                backgroundColor: '#f43f5e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Réessayer
            </button>
          </div>
        ) : (
          <>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary, #9ca3af)',
              marginBottom: '24px',
              textAlign: 'center',
            }}>
              Scannez ce QR code avec votre mobile ou entrez le code ci-dessous
            </p>

            {/* QR Code */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '24px',
            }}>
              <div style={{
                padding: '16px',
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              }}>
                <QRCodeSVG
                  value={qrData}
                  size={200}
                  level="M"
                  includeMargin={false}
                />
              </div>
            </div>

            {/* Code à 6 chiffres */}
            <div style={{
              textAlign: 'center',
              marginBottom: '16px',
            }}>
              <p style={{
                fontSize: '13px',
                color: 'var(--text-secondary, #9ca3af)',
                marginBottom: '8px',
              }}>
                Ou entrez ce code sur votre mobile :
              </p>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 20px',
                backgroundColor: 'var(--bg-tertiary, #1f2937)',
                border: '1px solid var(--border-subtle, #374151)',
                borderRadius: '12px',
              }}>
                <span style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  letterSpacing: '6px',
                  color: 'var(--text-primary, #e5e7eb)',
                  fontFamily: 'monospace',
                }}>
                  {pairingCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: copied ? '#22c55e' : 'var(--bg-hover, #374151)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                  title="Copier le code"
                >
                  <Copy size={18} />
                </button>
              </div>
              {copied && (
                <p style={{
                  fontSize: '12px',
                  color: '#22c55e',
                  marginTop: '8px',
                }}>
                  Code copié !
                </p>
              )}
            </div>

            {/* Info */}
            <div style={{
              padding: '12px',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <p style={{
                fontSize: '13px',
                color: '#22c55e',
                margin: 0,
              }}>
                En attente de扫描 du QR code...
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Styles
const overlayStyle = {
  position: 'fixed' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px',
};

const dialogStyle = {
  backgroundColor: 'var(--bg-card, #111827)',
  border: '1px solid var(--border-subtle, #374151)',
  borderRadius: '20px',
  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
  width: '100%',
  maxWidth: '420px',
  padding: '24px',
};

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
if (!document.head.querySelector('style[data-spin]')) {
  style.setAttribute('data-spin', 'true');
  document.head.appendChild(style);
}
