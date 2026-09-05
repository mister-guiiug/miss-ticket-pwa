import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Settings as SettingsIcon,
  Bell,
  Palette,
  Shield,
  Info,
  Trash2,
  ChevronRight,
  Moon,
  Monitor,
  Sun,
  Zap,
  Coffee,
  LayoutGrid,
  Languages,
} from 'lucide-react';
import {
  FamilyApps,
  ThemeToggle,
  useThemeContext,
} from '@mister-guiiug/dev-pwa-config/react';
import {
  SPONSOR_URL,
  repoUrl,
} from '@mister-guiiug/dev-pwa-config/apps-catalog';
import { useI18n, type Locale } from '../i18n';
import { createLogger } from '@mister-guiiug/dev-pwa-config/logger';

const log = createLogger('components');

/**
 * Endonymes des langues : le nom d'une langue s'affiche dans sa propre langue,
 * donc identique quelle que soit la locale courante (noms propres).
 */
const LANGUAGE_LABELS: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
};

interface SettingsProps {
  user: { displayName: string | null; uid: string };
  onClose: () => void;
}

type NotificationPreference = 'all' | 'important' | 'none';

/**
 * Le thème ne figure PLUS ici. Il vivait dans ce blob JSON *et* dans l'état
 * local de la bascule d'en-tête : deux sources, deux écritures, qui
 * divergeaient dès qu'on touchait à l'une sans l'autre. La seule source est
 * désormais `ThemeProvider`.
 */
interface SettingsState {
  notifications: NotificationPreference;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export function Settings({ user, onClose }: SettingsProps) {
  const { t, locale, setLocale, locales } = useI18n();
  // État partagé du ThemeProvider monté dans main.tsx. `resolved` (et non
  // `theme`) : c'est le schéma réellement affiché qu'on décrit ici, y compris
  // quand la préférence est « système ».
  const themeCtx = useThemeContext();
  const resolvedTheme = themeCtx?.resolved === 'light' ? 'light' : 'dark';
  const [settings, setSettings] = useState<SettingsState>(() => {
    const saved = localStorage.getItem('settings');
    if (saved) {
      // `theme` peut traîner dans le blob des versions précédentes : on le
      // laisse tomber au lieu de le laisser concurrencer le socle.
      const { theme: _legacyTheme, ...rest } = JSON.parse(saved) as Record<
        string,
        unknown
      >;
      return rest as unknown as SettingsState;
    }
    return {
      notifications: 'all',
      soundEnabled: true,
      vibrationEnabled: true,
    };
  });

  const themePreference = themeCtx?.theme ?? 'dark';
  const themeValueLabel =
    themePreference === 'system'
      ? t('common.system')
      : themePreference === 'dark'
        ? t('common.dark')
        : t('common.light');
  const themeDescription =
    themePreference === 'system'
      ? t('settings.themeSystemEnabled')
      : resolvedTheme === 'dark'
        ? t('settings.themeDarkEnabled')
        : t('settings.themeLightEnabled');

  const [showClearDialog, setShowClearDialog] = useState(false);
  const [clearingData, setClearingData] = useState(false);

  // Sauvegarder les settings
  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleClearData = async () => {
    setClearingData(true);
    try {
      // Clear localStorage except theme and settings. La clé du thème est
      // celle du socle (`dwc_theme`) : sans cette ligne, « effacer les
      // données » réinitialiserait aussi le thème, ce que l'intention
      // d'origine excluait explicitement.
      const theme = localStorage.getItem('dwc_theme');
      const settings = localStorage.getItem('settings');
      localStorage.clear();
      if (theme) localStorage.setItem('dwc_theme', theme);
      if (settings) localStorage.setItem('settings', settings);

      // Clear IndexedDB if needed
      // ...

      setShowClearDialog(false);
    } catch (err) {
      log.error('Error clearing data:', { error: err });
    } finally {
      setClearingData(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'var(--bg-primary)',
        zIndex: 1000,
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <div
        className="glass"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderBottom: '1px solid var(--header-border)',
          padding: '16px 20px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onClose}
            style={{
              width: '40px',
              height: '40px',
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
            <ArrowLeft size={20} />
          </button>

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
                  'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SettingsIcon size={20} color="#ffffff" />
            </div>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                }}
              >
                {t('settings.title')}
              </h1>
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                }}
              >
                {t('settings.subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        {/* Account Section */}
        <Section
          title={t('settings.sectionAccount')}
          icon={<Shield size={18} />}
        >
          <SettingItem
            icon={
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
                <Zap size={20} color="#ffffff" />
              </div>
            }
            label={t('settings.pseudoLabel')}
            value={user.displayName || t('common.guest')}
            description={t('settings.pseudoDescription')}
          />
          <SettingItem
            icon={
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Shield size={20} style={{ color: 'var(--text-tertiary)' }} />
              </div>
            }
            label={t('settings.userIdLabel')}
            value={user.uid.slice(-8)}
            description={t('settings.userIdDescription')}
          />
        </Section>

        {/* Appearance Section */}
        <Section
          title={t('settings.sectionAppearance')}
          icon={<Palette size={18} />}
        >
          <SettingItem
            icon={
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor:
                    resolvedTheme === 'dark'
                      ? 'var(--bg-tertiary)'
                      : 'var(--warning-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {themePreference === 'system' ? (
                  <Monitor
                    size={20}
                    style={{ color: 'var(--text-tertiary)' }}
                  />
                ) : themePreference === 'dark' ? (
                  <Moon size={20} style={{ color: 'var(--text-tertiary)' }} />
                ) : (
                  <Sun size={20} style={{ color: 'var(--warning)' }} />
                )}
              </div>
            }
            label={t('settings.themeLabel')}
            value={themeValueLabel}
            description={themeDescription}
            /* La même bascule que dans l'en-tête, et le même état : cycle
               clair → sombre → système, type="button", nom accessible qui
               annonce l'état courant. */
            action={<ThemeToggle />}
          />
        </Section>

        {/* Language Section */}
        <Section
          title={t('settings.sectionLanguage')}
          icon={<Languages size={18} />}
        >
          <SettingItem
            icon={
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--info-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Languages size={20} style={{ color: 'var(--info)' }} />
              </div>
            }
            label={t('settings.languageLabel')}
            description={t('settings.languageDescription')}
            action={
              <div
                role="group"
                aria-label={t('settings.languageLabel')}
                style={{
                  display: 'flex',
                  gap: '4px',
                  padding: '4px',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                }}
              >
                {locales.map(loc => {
                  const active = loc === locale;
                  return (
                    <button
                      key={loc}
                      type="button"
                      lang={loc}
                      aria-pressed={active}
                      onClick={() => setLocale(loc)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: active ? '600' : '500',
                        backgroundColor: active
                          ? 'var(--primary-500)'
                          : 'transparent',
                        color: active ? '#ffffff' : 'var(--text-secondary)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor =
                            'var(--bg-hover)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {LANGUAGE_LABELS[loc]}
                    </button>
                  );
                })}
              </div>
            }
          />
        </Section>

        {/* Notifications Section */}
        <Section
          title={t('settings.sectionNotifications')}
          icon={<Bell size={18} />}
        >
          <SelectSetting
            icon={
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--success-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bell size={20} style={{ color: 'var(--success)' }} />
              </div>
            }
            label={t('settings.notificationsLevelLabel')}
            value={settings.notifications}
            options={[
              { value: 'all', label: t('settings.notificationsAll') },
              {
                value: 'important',
                label: t('settings.notificationsImportant'),
              },
              { value: 'none', label: t('settings.notificationsNone') },
            ]}
            onChange={value =>
              updateSetting('notifications', value as NotificationPreference)
            }
            description={t('settings.notificationsLevelDescription')}
          />

          <ToggleSetting
            icon={
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--info-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Zap size={20} style={{ color: 'var(--info)' }} />
              </div>
            }
            label={t('settings.soundLabel')}
            checked={settings.soundEnabled}
            onChange={checked => updateSetting('soundEnabled', checked)}
            description={t('settings.soundDescription')}
          />

          <ToggleSetting
            icon={
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--warning-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Zap size={20} style={{ color: 'var(--warning)' }} />
              </div>
            }
            label={t('settings.vibrationLabel')}
            checked={settings.vibrationEnabled}
            onChange={checked => updateSetting('vibrationEnabled', checked)}
            description={t('settings.vibrationDescription')}
          />
        </Section>

        {/* Data Section */}
        <Section title={t('settings.sectionData')} icon={<Info size={18} />}>
          <SettingItem
            icon={
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--error-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trash2 size={20} style={{ color: 'var(--error)' }} />
              </div>
            }
            label={t('settings.clearLabel')}
            description={t('settings.clearDescription')}
            action={
              <button
                onClick={() => setShowClearDialog(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  backgroundColor: 'var(--error)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'var(--error)';
                }}
              >
                <Trash2 size={16} />
                <span>{t('common.clear')}</span>
              </button>
            }
          />
        </Section>

        {/* Nos autres applications — cross-promotion famille (composant partagé
            dev-pwa-config, catalogue). Styles [data-dwc] dans index.css. */}
        <Section
          title={t('settings.sectionOtherApps')}
          icon={<LayoutGrid size={18} />}
        >
          <div className="family-apps">
            <p className="family-apps__lead">{t('settings.otherAppsLead')}</p>
            <FamilyApps
              currentAppId="miss-ticket-pwa"
              showSource={false}
              showSponsor={false}
              labels={{
                otherApps: t('settings.sectionOtherApps'),
                maturity: {
                  alpha: t('settings.maturityAlpha'),
                  beta: t('settings.maturityBeta'),
                  stable: t('settings.maturityStable'),
                },
              }}
            />
          </div>
        </Section>

        {/* App Info */}
        <div
          style={{
            marginTop: '32px',
            padding: '20px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 12px',
              borderRadius: '12px',
              background:
                'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={24} color="#ffffff" />
          </div>
          <h3
            style={{
              margin: '0 0 4px 0',
              fontSize: '16px',
              fontWeight: '700',
              color: 'var(--text-primary)',
            }}
          >
            {t('common.appName')}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: '13px',
              color: 'var(--text-tertiary)',
            }}
          >
            {t('settings.version', { version: '1.0.0' })}
          </p>
        </div>
      </div>

      {/* Clear Data Dialog */}
      {showClearDialog && (
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
            zIndex: 1100,
            padding: '20px',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
            }}
          >
            <h3
              style={{
                margin: '0 0 8px 0',
                fontSize: '18px',
                fontWeight: '700',
                color: 'var(--text-primary)',
              }}
            >
              {t('settings.clearDialogTitle')}
            </h3>
            <p
              style={{
                margin: '0 0 24px 0',
                fontSize: '14px',
                color: 'var(--text-secondary)',
              }}
            >
              {t('settings.clearDialogMessage')}
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowClearDialog(false)}
                disabled={clearingData}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: clearingData ? 'not-allowed' : 'pointer',
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleClearData}
                disabled={clearingData}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: 'var(--error)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#ffffff',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: clearingData ? 'not-allowed' : 'pointer',
                  opacity: clearingData ? 0.7 : 1,
                }}
              >
                {clearingData ? t('settings.clearing') : t('common.clear')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          fontSize: '14px',
          opacity: 0.8,
        }}
      >
        <a
          href={repoUrl('miss-ticket-pwa')}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'inherit',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          <svg
            viewBox="0 0 16 16"
            width="15"
            height="15"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          {t('settings.linkSource')}
        </a>
        <a
          href={SPONSOR_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'inherit',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          <Coffee size={15} aria-hidden="true" />
          {t('settings.linkSponsor')}
        </a>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
          padding: '0 4px',
        }}
      >
        <span style={{ color: 'var(--primary-500)' }}>{icon}</span>
        <h2
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: '700',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {title}
        </h2>
      </div>
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  description?: string;
  action?: React.ReactNode;
}

function SettingItem({
  icon,
  label,
  value,
  description,
  action,
}: SettingItemProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {icon}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '15px',
            fontWeight: '500',
            color: 'var(--text-primary)',
            marginBottom: '2px',
          }}
        >
          {label}
        </div>
        {description && (
          <div
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}
          >
            {description}
          </div>
        )}
        {value && (
          <div
            style={{
              display: 'inline-block',
              marginTop: '6px',
              padding: '4px 10px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: '6px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              fontFamily: 'monospace',
            }}
          >
            {value}
          </div>
        )}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

interface ToggleSettingProps {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

function ToggleSetting({
  icon,
  label,
  checked,
  onChange,
  description,
}: ToggleSettingProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {icon}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '15px',
            fontWeight: '500',
            color: 'var(--text-primary)',
            marginBottom: '2px',
          }}
        >
          {label}
        </div>
        {description && (
          <div
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}
          >
            {description}
          </div>
        )}
      </div>

      <button
        onClick={() => onChange(!checked)}
        style={{
          position: 'relative',
          width: '48px',
          height: '28px',
          backgroundColor: checked
            ? 'var(--primary-500)'
            : 'var(--bg-tertiary)',
          border: 'none',
          borderRadius: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          if (!checked) {
            e.currentTarget.style.backgroundColor = 'var(--border-default)';
          }
        }}
        onMouseLeave={e => {
          if (!checked) {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
          }
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: checked ? '24px' : '2px',
            width: '24px',
            height: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            transition: 'all 0.2s',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          }}
        />
      </button>
    </div>
  );
}

interface SelectSettingProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  description?: string;
}

function SelectSetting({
  icon,
  label,
  value,
  options,
  onChange,
  description,
}: SelectSettingProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'relative',
      }}
    >
      {icon}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '15px',
            fontWeight: '500',
            color: 'var(--text-primary)',
            marginBottom: '2px',
          }}
        >
          {label}
        </div>
        {description && (
          <div
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}
          >
            {description}
          </div>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
          }}
        >
          <span>{options.find(o => o.value === value)?.label}</span>
          <ChevronRight
            size={16}
            style={{
              color: 'var(--text-tertiary)',
              transform: showMenu ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          />
        </button>

        {showMenu && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99,
              }}
              onClick={() => setShowMenu(false)}
            />
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                minWidth: '180px',
                overflow: 'hidden',
                zIndex: 100,
              }}
            >
              {options.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setShowMenu(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor:
                      value === option.value
                        ? 'var(--bg-hover)'
                        : 'transparent',
                    border: 'none',
                    color:
                      value === option.value
                        ? 'var(--primary-500)'
                        : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: value === option.value ? '600' : '500',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (value !== option.value) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (value !== option.value) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span>{option.label}</span>
                  {value === option.value && (
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-500)',
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
