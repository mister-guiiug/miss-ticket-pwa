import { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, User, Check, Loader2 } from 'lucide-react';
import { auth, db } from '../config/firebase';

interface EditProfileProps {
  currentPseudo: string;
  onSave: (newPseudo: string) => void;
  onCancel: () => void;
}

export function EditProfile({
  currentPseudo,
  onSave,
  onCancel,
}: EditProfileProps) {
  const [pseudo, setPseudo] = useState(currentPseudo);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isValid = pseudo.trim().length >= 2 && pseudo.trim().length <= 20;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;

    const trimmedPseudo = pseudo.trim();

    if (trimmedPseudo === currentPseudo) {
      onCancel();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Utilisateur non connecté');

      // Mettre à jour le profil Firebase Auth
      await updateProfile(user, { displayName: trimmedPseudo });

      // Mettre à jour le document Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        pseudo: trimmedPseudo,
        updatedAt: serverTimestamp(),
      });

      setSuccess(true);
      setTimeout(() => {
        onSave(trimmedPseudo);
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la mise à jour'
      );
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        style={{
          position: 'fixed',
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
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            padding: '48px',
            textAlign: 'center',
            minWidth: '320px',
            maxWidth: '400px',
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
            Pseudo mis à jour !
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              color: 'var(--text-secondary)',
            }}
          >
            Votre pseudo a été changé avec succès
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
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
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '440px',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background:
                  'linear-gradient(135deg, var(--primary-400), var(--primary-600))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={20} color="#ffffff" />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                }}
              >
                Modifier le pseudo
              </h2>
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                }}
              >
                Choisissez un nouveau pseudo
              </p>
            </div>
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
            <ArrowLeft size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}
            >
              Nouveau pseudo
            </label>
            <input
              type="text"
              value={pseudo}
              onChange={e => {
                setPseudo(e.target.value);
                setError(null);
              }}
              placeholder="Votre nouveau pseudo"
              maxLength={20}
              autoFocus
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
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

            {/* Character count */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '8px',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  color:
                    pseudo.trim().length > 20
                      ? 'var(--error)'
                      : 'var(--text-tertiary)',
                }}
              >
                {pseudo.trim().length}/20 caractères
              </div>
              {pseudo.trim() !== currentPseudo && pseudo.trim().length >= 2 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: 'var(--success)',
                  }}
                >
                  <Check size={12} />
                  <span>Disponible</span>
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--error-bg)',
                border: '1px solid var(--error)',
                borderRadius: '10px',
                color: 'var(--error)',
                fontSize: '14px',
                marginBottom: '20px',
              }}
            >
              {error}
            </div>
          )}

          {/* Validation hints */}
          {pseudo.trim().length > 0 && pseudo.trim().length < 2 && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'var(--warning-bg)',
                border: '1px solid var(--warning)',
                borderRadius: '8px',
                fontSize: '13px',
                color: 'var(--warning)',
                marginBottom: '20px',
              }}
            >
              Le pseudo doit contenir au moins 2 caractères
            </div>
          )}

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                color: 'var(--text-primary)',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              }}
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={!isValid || loading}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                background:
                  !isValid || loading
                    ? 'var(--bg-tertiary)'
                    : 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                border: 'none',
                borderRadius: '12px',
                color: !isValid || loading ? 'var(--text-tertiary)' : '#ffffff',
                fontSize: '15px',
                fontWeight: '600',
                cursor: !isValid || loading ? 'not-allowed' : 'pointer',
                boxShadow:
                  !isValid || loading
                    ? 'none'
                    : '0 4px 12px rgba(244, 63, 94, 0.3)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                if (isValid && !loading) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow =
                    '0 6px 16px rgba(244, 63, 94, 0.4)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                if (isValid && !loading) {
                  e.currentTarget.style.boxShadow =
                    '0 4px 12px rgba(244, 63, 94, 0.3)';
                }
              }}
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>Enregistrer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
