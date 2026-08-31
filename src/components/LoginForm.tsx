import { useState } from 'react';
import { Zap } from 'lucide-react';
import { useActionGuard } from '@mister-guiiug/dev-wpa-config/react/use-action-guard';
import { useI18n } from '../i18n';

interface LoginFormProps {
  onLogin: (pseudo: string) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const { t } = useI18n();
  const [pseudo, setPseudo] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * LE DÉFAUT LE PLUS COÛTEUX DE L'APP, ET LE PLUS SILENCIEUX.
   *
   * `signInWithPseudo` commence par `signInAnonymously`, qui hors connexion
   * REJETTE (`auth/network-request-failed`). Or `handleSubmit` n'a qu'un
   * `finally`, pas de `catch` : la promesse rejetée partait en
   * `unhandledrejection`, le bouton reprenait son état normal, et il ne se
   * passait RIEN. Aucun message, aucune erreur à l'écran. L'utilisateur
   * appuie, réappuie, et s'en va.
   *
   * `online: true` sans aucune autre vérification : la connexion est le seul
   * motif de blocage ici — le pseudo vide est déjà couvert par le bouton, et
   * n'a pas besoin d'être expliqué (le champ est juste au-dessus, vide).
   */
  const guard = useActionGuard({ online: true });

  const login = async () => {
    if (!pseudo.trim()) return;
    setLoading(true);
    try {
      await onLogin(pseudo.trim());
    } finally {
      setLoading(false);
    }
  };

  /**
   * `preventDefault` AVANT la garde, jamais après : `wrap` rend la fonction
   * inerte, et une soumission inerte qui n'a pas annulé l'événement laisse le
   * navigateur recharger la page. Le clavier (touche Entrée) passe par ici
   * aussi — garder seulement le bouton laisserait la porte ouverte.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void guard.wrap(login)();
  };

  const blocked = loading || !pseudo.trim() || guard.disabled;

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
          {t('common.appName')}
        </h1>

        <p
          style={{
            margin: '0 0 32px 0',
            fontSize: '15px',
            color: 'var(--text-secondary)',
            textAlign: 'center',
          }}
        >
          {t('login.tagline')}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={pseudo}
            onChange={e => setPseudo(e.target.value)}
            placeholder={t('login.pseudoPlaceholder')}
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
            disabled={blocked}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '16px',
              padding: '14px',
              background: blocked
                ? 'var(--bg-tertiary)'
                : 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
              border: 'none',
              borderRadius: '12px',
              color: blocked ? 'var(--text-tertiary)' : '#ffffff',
              fontSize: '15px',
              fontWeight: '600',
              cursor: blocked ? 'not-allowed' : 'pointer',
              boxShadow: blocked ? 'none' : '0 4px 12px rgba(244, 63, 94, 0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              if (!blocked) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow =
                  '0 6px 16px rgba(244, 63, 94, 0.4)';
              }
            }}
            onMouseLeave={e => {
              if (!blocked) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow =
                  '0 4px 12px rgba(244, 63, 94, 0.3)';
              }
            }}
          >
            <Zap size={18} />
            <span>
              {loading ? t('login.submitLoading') : t('login.submit')}
            </span>
          </button>

          {/* Le motif, sous le bouton qu'il explique. Un bouton grisé sans
              explication est le même cul-de-sac qu'avant, en plus poli. */}
          {guard.reason && (
            <p
              role="status"
              style={{
                margin: '12px 0 0 0',
                fontSize: '13px',
                color: 'var(--warning)',
                textAlign: 'center',
              }}
            >
              {guard.reason}
            </p>
          )}
        </form>

        {/* Footer — text-secondary (pas tertiary) : contraste ≥ 4.5:1
            requis par axe color-contrast sur ce fond. */}
        <p
          style={{
            margin: '24px 0 0 0',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            textAlign: 'center',
          }}
        >
          {t('login.footer')}
        </p>
      </div>
    </div>
  );
}
