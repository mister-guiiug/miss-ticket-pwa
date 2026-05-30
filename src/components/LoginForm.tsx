import { useState } from 'react';
import { Zap } from 'lucide-react';

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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 24px',
            borderRadius: '16px',
            background:
              'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(244, 63, 94, 0.3)',
          }}
        >
          <Zap size={32} color="#ffffff" strokeWidth={2.5} />
        </div>

        {/* Title */}
        <h1
          style={{
            margin: '0 0 8px 0',
            fontSize: '26px',
            fontWeight: '700',
            textAlign: 'center',
            background:
              'linear-gradient(135deg, var(--primary-400), var(--primary-600))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Miss Ticket
        </h1>

        <p
          style={{
            margin: '0 0 32px 0',
            fontSize: '15px',
            color: 'var(--text-secondary)',
            textAlign: 'center',
          }}
        >
          Choisissez un pseudo pour commencer
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={pseudo}
            onChange={e => setPseudo(e.target.value)}
            placeholder="Votre pseudo"
            disabled={loading}
            maxLength={20}
            autoFocus
            style={{
              width: '100%',
              padding: '14px 16px',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1.5px solid var(--border-subtle)',
              borderRadius: '12px',
              color: 'var(--text-primary)',
              fontSize: '15px',
              outline: 'none',
              transition: 'all 0.2s',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'var(--primary-500)';
              e.currentTarget.style.boxShadow =
                '0 0 0 3px rgba(244, 63, 94, 0.1)';
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />

          <button
            type="submit"
            disabled={loading || !pseudo.trim()}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '16px',
              padding: '14px',
              background:
                loading || !pseudo.trim()
                  ? 'var(--bg-tertiary)'
                  : 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
              border: 'none',
              borderRadius: '12px',
              color:
                loading || !pseudo.trim() ? 'var(--text-tertiary)' : '#ffffff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: loading || !pseudo.trim() ? 'not-allowed' : 'pointer',
              boxShadow:
                loading || !pseudo.trim()
                  ? 'none'
                  : '0 4px 12px rgba(244, 63, 94, 0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              if (!loading && pseudo.trim()) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow =
                  '0 6px 16px rgba(244, 63, 94, 0.4)';
              }
            }}
            onMouseLeave={e => {
              if (!loading && pseudo.trim()) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow =
                  '0 4px 12px rgba(244, 63, 94, 0.3)';
              }
            }}
          >
            <Zap size={18} />
            <span>{loading ? 'Connexion...' : 'Commencer'}</span>
          </button>
        </form>

        {/* Footer */}
        <p
          style={{
            margin: '24px 0 0 0',
            fontSize: '13px',
            color: 'var(--text-tertiary)',
            textAlign: 'center',
          }}
        >
          Une connexion anonyme et sécurisée
        </p>
      </div>
    </div>
  );
}
