import { useState } from 'react';

interface LoginFormProps {
  onLogin: (pseudo: string) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [pseudo, setPseudo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pseudo.trim()) {
      setLoading(true);
      try {
        await onLogin(pseudo.trim());
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f0f1a',
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: '#1e1e2e',
        padding: '32px',
        borderRadius: '16px',
        border: '1px solid #2d2d44',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{
          color: '#ff6b6b',
          margin: '0 0 24px 0',
          textAlign: 'center',
          fontSize: '28px'
        }}>
          🎫 Miss Ticket
        </h1>
        <p style={{
          color: '#9ca3af',
          textAlign: 'center',
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          Choisissez un pseudo pour commencer
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder="Votre pseudo"
            disabled={loading}
            maxLength={20}
            autoFocus
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#0f0f1a',
              border: '1px solid #2d2d44',
              borderRadius: '8px',
              color: '#e0e0e0',
              fontSize: '16px',
              boxSizing: 'border-box',
              marginBottom: '16px'
            }}
          />

          <button
            type="submit"
            disabled={loading || !pseudo.trim()}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading || !pseudo.trim() ? '#2d2d44' : '#ff6b6b',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading || !pseudo.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !pseudo.trim() ? 0.5 : 1
            }}
          >
            {loading ? 'Connexion...' : 'Commencer'}
          </button>
        </form>
      </div>
    </div>
  );
}
