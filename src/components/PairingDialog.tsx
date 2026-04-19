import { useState, useRef } from 'react';
import { QrReader } from 'react-qr-reader';
import { initiatePairing, generatePairingCode, parseQRCode } from '../lib/pairing';

interface PairingDialogProps {
  userId: string;
  onPaired: () => void;
  onCancel: () => void;
}

export function PairingDialog({ userId, onPaired, onCancel }: PairingDialogProps) {
  const [method, setMethod] = useState<'qr' | 'code'>('qr');
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
      // Si c'est un QR code, le parser
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
        // C'est un code 6 chiffres
        // Pour le code manuel, on ne peut pas deviner le desktopId
        // Dans ce cas, le desktop doit avoir été scanné avant
        // On va utiliser une approche différente : le desktop crée d'abord le token
        throw new Error('Veuillez scanner le QR code ou utiliser le code affiché sur le desktop');
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
      // Pour le code manuel, on doit d'abord récupérer le token depuis Firestore
      // et obtenir le desktopId associé
      throw new Error('Utilisez le QR code pour un appariement plus simple');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'appariement');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: '#1e1e2e',
          padding: '48px',
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ color: '#4ade80', margin: 0 }}>Desktop appairé !</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#1e1e2e',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid #2d2d44',
        width: '100%',
        maxWidth: '500px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>Apparier un Desktop</h2>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              fontSize: '24px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setMethod('qr')}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: method === 'qr' ? '#ff6b6b' : '#2d2d44',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            QR Code
          </button>
          <button
            onClick={() => setMethod('code')}
            style={{
              flex: 1,
              padding: '8px',
              backgroundColor: method === 'code' ? '#ff6b6b' : '#2d2d44',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Code 6 chiffres
          </button>
        </div>

        {method === 'qr' ? (
          <div>
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>
              Scannez le QR code affiché sur votre desktop
            </p>
            <div style={{
              backgroundColor: '#000',
              borderRadius: '8px',
              overflow: 'hidden',
              aspectRatio: '1'
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
            <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>
              Entrez le code à 6 chiffres affiché sur votre desktop
            </p>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '24px',
                textAlign: 'center',
                letterSpacing: '8px',
                backgroundColor: '#0f0f1a',
                border: '1px solid #2d2d44',
                borderRadius: '8px',
                color: '#e0e0e0',
                textTransform: 'uppercase',
                marginBottom: '16px'
              }}
            />
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: loading || code.length !== 6 ? '#2d2d44' : '#ff6b6b',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: loading || code.length !== 6 ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Vérification...' : 'Apparier'}
            </button>
          </form>
        )}

        {error && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#7f1d1d',
            border: '1px solid #dc2626',
            borderRadius: '8px',
            color: '#fecaca',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{
            marginTop: '16px',
            textAlign: 'center',
            color: '#9ca3af'
          }}>
            Tentative d'appariement...
          </div>
        )}
      </div>
    </div>
  );
}
