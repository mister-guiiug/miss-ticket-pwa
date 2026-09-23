import { useEffect, useState } from 'react';
import { useQrScanner } from '@mister-guiiug/dev-pwa-config/react/use-qr-scanner';
import { GESTES, trackEvent } from '@mister-guiiug/dev-pwa-config/analytics';
import { initiatePairing, parseQRCode } from '../lib/pairing';
import { X, QrCode, Keyboard, Check } from 'lucide-react';
import { useI18n } from '../i18n';
import { PRIMARY_BUTTON_GRADIENT } from '../styles/theme';

interface PairingDialogProps {
  userId: string;
  onPaired: () => void;
  onCancel: () => void;
}

type Method = 'qr' | 'code';

export function PairingDialog({
  userId,
  onPaired,
  onCancel,
}: PairingDialogProps) {
  const { t } = useI18n();
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

  // LE SCAN PASSE PAR LE SOCLE. `react-qr-reader` était une `3.0.0-beta-1` de
  // février 2022, dépôt figé depuis, 149 tickets ouverts. Le hook du socle rend
  // le même service et porte deux pièges déjà payés dans mister-molkky : la
  // `<video>` qui n'existe pas encore au moment du clic, et la caméra qui reste
  // allumée si l'on oublie de l'éteindre.
  //
  // Différence de forme : `<QrReader>` démarrait tout seul en se montant ; ici
  // c'est nous qui rendons la `<video>` et appelons `start()`. D'où l'effet
  // ci-dessous, qui suit l'onglet choisi — passer à la saisie manuelle ÉTEINT
  // la caméra, ce que l'ancien composant ne faisait qu'en se démontant.
  const {
    videoRef,
    scanning,
    error: scanError,
    start,
    stop,
  } = useQrScanner({
    onScan: handleQRScan,
    preferredCamera: 'environment',
  });

  useEffect(() => {
    if (method === 'qr') start();
    else stop();
    return stop;
  }, [method, start, stop]);

  const handlePairing = async (data: string) => {
    setLoading(true);
    setError(null);

    try {
      let token = data;
      let desktopId = '';

      if (data.startsWith('missticket:pair?')) {
        const parsed = parseQRCode(data);
        if (!parsed) {
          throw new Error(t('pairing.errorInvalidQr'));
        }
        token = parsed.token;
        desktopId = parsed.desktopId;
      } else {
        throw new Error(t('pairing.errorScanQr'));
      }

      await initiatePairing(token, desktopId, userId);
      /*
       * L'APPARIEMENT EST LA PORTE D'ENTRÉE : sans poste apparié, cette PWA
       * ne commande rien. Savoir combien d'appariements aboutissent — et
       * combien butent sur un QR périmé ou illisible — est la seule mesure de
       * ce parcours.
       *
       * APRÈS `initiatePairing`, qui lève sur un jeton inconnu ou expiré. Un
       * QR mal formé, lui, lève plus haut et tombe dans le même `catch`.
       *
       * NI LE JETON, NI L'IDENTIFIANT DU POSTE, NI CELUI DE L'UTILISATEUR :
       * le jeton d'appariement EST le secret que le QR transporte.
       */
      trackEvent(GESTES.OPERATION, { nom: 'appariement', etape: 'reussie' });
      setSuccess(true);
      setTimeout(() => onPaired(), 1500);
    } catch (err) {
      trackEvent(GESTES.OPERATION, { nom: 'appariement', etape: 'echouee' });
      setError(err instanceof Error ? err.message : t('pairing.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError(t('pairing.errorCodeLength'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Pour le code manuel, utiliser le QR code pour le moment
      throw new Error(t('pairing.errorManualCode'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pairing.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={overlayStyle}>
        <div
          style={{
            ...dialogStyle,
            padding: '48px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 20px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--success), #16a34a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(34, 197, 94, 0.3)',
            }}
          >
            <Check size={32} color="#ffffff" strokeWidth={3} />
          </div>
          <h2
            style={{
              margin: '0 0 8px 0',
              fontSize: '22px',
              fontWeight: '700',
              color: 'var(--success)',
            }}
          >
            {t('pairing.successTitle')}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              color: 'var(--text-secondary)',
            }}
          >
            {t('pairing.successMessage')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <div style={dialogStyle}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <div>
            <h2
              style={{
                margin: '0 0 4px 0',
                fontSize: '20px',
                fontWeight: '700',
                color: 'var(--text-primary)',
              }}
            >
              {t('pairing.title')}
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}
            >
              {t('pairing.subtitle')}
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
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Method toggle */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '24px',
            padding: '4px',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: '12px',
          }}
        >
          <MethodButton
            active={method === 'qr'}
            icon={<QrCode size={18} />}
            label={t('pairing.methodQr')}
            onClick={() => setMethod('qr')}
          />
          <MethodButton
            active={method === 'code'}
            icon={<Keyboard size={18} />}
            label={t('pairing.methodCode')}
            onClick={() => setMethod('code')}
          />
        </div>

        {/* Content */}
        {method === 'qr' ? (
          <div>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                marginBottom: '16px',
                textAlign: 'center',
              }}
            >
              {t('pairing.qrInstruction')}
            </p>
            <div
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid var(--border-subtle)',
                backgroundColor: '#000000',
                aspectRatio: '1',
              }}
            >
              <video
                ref={videoRef}
                playsInline
                muted
                aria-label={t('pairing.qrInstruction')}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
            {scanError && (
              <p
                style={{
                  marginTop: '12px',
                  fontSize: '13px',
                  color: '#ef4444',
                  textAlign: 'center',
                }}
              >
                {scanError.message}
              </p>
            )}
            {!scanning && !scanError && (
              <p
                style={{
                  marginTop: '12px',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                }}
              >
                {t('pairing.cameraStarting')}
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleCodeSubmit}>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                marginBottom: '16px',
                textAlign: 'center',
              }}
            >
              {t('pairing.codeInstruction')}
            </p>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
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
              onFocus={e => {
                e.currentTarget.style.borderColor = 'var(--primary-500)';
              }}
              onBlur={e => {
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
                background:
                  loading || code.length !== 6
                    ? 'var(--bg-tertiary)'
                    : PRIMARY_BUTTON_GRADIENT,
                border: 'none',
                borderRadius: '12px',
                color:
                  loading || code.length !== 6
                    ? 'var(--text-tertiary)'
                    : '#ffffff',
                fontSize: '15px',
                fontWeight: '600',
                cursor:
                  loading || code.length !== 6 ? 'not-allowed' : 'pointer',
                boxShadow:
                  loading || code.length !== 6
                    ? 'none'
                    : '0 4px 12px rgba(244, 63, 94, 0.3)',
                transition: 'all 0.2s',
              }}
            >
              {loading ? t('pairing.submitLoading') : t('common.pair')}
            </button>
          </form>
        )}

        {/* Error message */}
        {error && (
          <div
            style={{
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
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div
            style={{
              marginTop: '20px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: '2px solid var(--border-default)',
                borderTopColor: 'var(--primary-500)',
                animation: 'spin 1s linear infinite',
              }}
            />
            <span>{t('pairing.inProgress')}</span>
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
        color: active ? 'var(--primary-text)' : 'var(--text-secondary)',
        fontSize: '14px',
        fontWeight: active ? '600' : '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: active ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
        }
      }}
      onMouseLeave={e => {
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
