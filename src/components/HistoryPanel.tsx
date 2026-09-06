import { useMemo } from 'react';
import {
  Activity,
  AlertCircle,
  Ban,
  CheckCircle,
  Clock,
  History,
  Monitor,
  Trash2,
  XCircle,
} from 'lucide-react';
import { getDefaultLocale } from '@mister-guiiug/dev-pwa-config/format';
import type {
  SessionHistoryEntry,
  SessionOutcome,
} from '../lib/sessionHistory';
import { useWindowSize } from '../hooks/useWindowSize';
import type { HistoryFilter } from './FilterBar';
import { StatCard } from './StatCard';
import { useI18n } from '../i18n';

/**
 * L'ÉCRAN QUI RÉPOND À LA QUESTION DU PRODUIT.
 *
 * Miss Ticket sert à surveiller une file d'attente d'achat de billets : savoir
 * si la session a franchi la file EST le résultat de l'usage. Jusqu'ici, une
 * session terminée disparaissait simplement de l'écran — l'app oubliait tout.
 *
 * Ce panneau ne réécrit ni la recherche ni les filtres : la `SearchBar` et la
 * `FilterBar` du shell les portent déjà, comme pour les deux autres écrans.
 * Il reçoit leur résultat et n'a qu'un travail : trier, compter, dire.
 */

interface HistoryPanelProps {
  entries: SessionHistoryEntry[];
  searchQuery: string;
  filter: HistoryFilter;
  onClear: () => void;
}

/** Le vocabulaire d'une issue : libellé, couleur, icône. */
function useOutcomeLabels(): Record<
  SessionOutcome,
  { label: string; color: string; background: string; icon: typeof CheckCircle }
> {
  const { t } = useI18n();
  return {
    purchase: {
      label: t('history.outcomePurchase'),
      color: 'var(--success)',
      background: 'var(--success-bg)',
      icon: CheckCircle,
    },
    error: {
      label: t('history.outcomeError'),
      color: 'var(--error)',
      background: 'var(--error-bg)',
      icon: XCircle,
    },
    manual: {
      label: t('history.outcomeManual'),
      color: 'var(--warning)',
      background: 'var(--warning-bg)',
      icon: Ban,
    },
    stopped: {
      label: t('history.outcomeStopped'),
      color: 'var(--text-secondary)',
      background: 'var(--bg-tertiary)',
      icon: Clock,
    },
  };
}

function formatDate(timestamp: number): string {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString(getDefaultLocale(), {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function HistoryPanel({
  entries,
  searchQuery,
  filter,
  onClear,
}: HistoryPanelProps) {
  const { t } = useI18n();
  const { isMobile } = useWindowSize();
  const outcomes = useOutcomeLabels();

  const filtered = useMemo(() => {
    let result = entries;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        entry =>
          entry.email.toLowerCase().includes(query) ||
          entry.concertUrl.toLowerCase().includes(query) ||
          entry.desktopName.toLowerCase().includes(query) ||
          entry.lastStatus.toLowerCase().includes(query)
      );
    }

    if (filter !== 'all') {
      result = result.filter(entry => entry.outcome === filter);
    }

    return result;
  }, [entries, searchQuery, filter]);

  const stats = useMemo(
    () => ({
      total: entries.length,
      purchase: entries.filter(e => e.outcome === 'purchase').length,
      error: entries.filter(e => e.outcome === 'error').length,
    }),
    [entries]
  );

  const handleClear = () => {
    if (confirm(t('history.confirmClear'))) onClear();
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2
          style={{
            margin: '0 0 4px 0',
            fontSize: '22px',
            fontWeight: '700',
            color: 'var(--text-primary)',
          }}
        >
          {t('history.title')}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--text-secondary)',
          }}
        >
          {t('history.subtitle')}
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <StatCard
          label={t('history.statTotal')}
          value={stats.total}
          icon={<History size={18} />}
          color="var(--text-primary)"
        />
        <StatCard
          label={t('history.statPurchase')}
          value={stats.purchase}
          icon={<CheckCircle size={18} />}
          color="var(--success)"
        />
        <StatCard
          label={t('history.statError')}
          value={stats.error}
          icon={<XCircle size={18} />}
          color="var(--error)"
        />
      </div>

      {/* La PORTÉE de ce qui est affiché, dite à l'utilisateur : cet appareil,
          et ce que la télécommande a pu voir. Sans cette phrase, un historique
          incomplet passerait pour un historique faux. */}
      <p
        style={{
          margin: '0 0 24px 0',
          fontSize: '13px',
          color: 'var(--text-tertiary)',
        }}
      >
        {t('history.localOnly')}
      </p>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {entries.length > 0 && (
          <button
            onClick={handleClear}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              backgroundColor: 'var(--error)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Trash2 size={16} />
            <span>{t('history.clear')}</span>
          </button>
        )}

        {filtered.length !== entries.length && (
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: '8px',
              fontSize: '14px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Activity size={16} />
            <span>
              {entries.length > 1
                ? t('history.filteredCountMany', {
                    shown: filtered.length,
                    total: entries.length,
                  })
                : t('history.filteredCountOne', {
                    shown: filtered.length,
                    total: entries.length,
                  })}
            </span>
          </div>
        )}
      </div>

      {entries.length === 0 ? (
        <div
          style={{
            padding: '48px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 20px',
              borderRadius: '20px',
              backgroundColor: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <History size={36} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <h3
            style={{
              margin: '0 0 8px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--text-primary)',
            }}
          >
            {t('history.emptyTitle')}
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              color: 'var(--text-secondary)',
            }}
          >
            {t('history.emptyMessage')}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            padding: '48px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            textAlign: 'center',
          }}
        >
          <AlertCircle
            size={48}
            style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }}
          />
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              color: 'var(--text-secondary)',
            }}
          >
            {t('history.noMatch')}
          </p>
        </div>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
          }}
        >
          {filtered.map((entry, index) => (
            <HistoryItem
              key={`${entry.instanceId}-${entry.endedAt}`}
              entry={entry}
              outcome={outcomes[entry.outcome]}
              isLast={index === filtered.length - 1}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

interface HistoryItemProps {
  entry: SessionHistoryEntry;
  outcome: ReturnType<typeof useOutcomeLabels>[SessionOutcome];
  isLast: boolean;
}

function HistoryItem({ entry, outcome, isLast }: HistoryItemProps) {
  const { t } = useI18n();
  const OutcomeIcon = outcome.icon;

  return (
    <li
      style={{
        padding: '16px',
        borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '12px',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            backgroundColor: outcome.background,
            color: outcome.color,
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
          }}
        >
          <OutcomeIcon size={12} />
          <span>{outcome.label}</span>
        </span>

        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}
        >
          <Monitor size={12} />
          <span>{entry.desktopName}</span>
        </span>
      </div>

      <div
        style={{
          fontSize: '15px',
          fontWeight: '600',
          color: 'var(--text-primary)',
          marginBottom: '4px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {entry.email}
      </div>

      <div
        style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginBottom: '8px',
        }}
      >
        {entry.concertUrl}
      </div>

      {/* La position finale dans la file : le chiffre qu'on regardait quand la
          session s'est arrêtée. Absent quand la file n'en a jamais annoncé. */}
      {entry.queuePosition && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--warning)',
            padding: '4px 10px',
            backgroundColor: 'var(--warning-bg)',
            borderRadius: '6px',
            fontWeight: '500',
            marginBottom: '8px',
          }}
        >
          <Clock size={12} />
          <span>
            {t('history.finalQueuePosition', { position: entry.queuePosition })}
          </span>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '11px',
          color: 'var(--text-tertiary)',
          flexWrap: 'wrap',
        }}
      >
        <span>{t('history.endedAt', { date: formatDate(entry.endedAt) })}</span>
        {entry.startedAt > 0 && (
          <span>
            {t('history.startedAt', { date: formatDate(entry.startedAt) })}
          </span>
        )}
      </div>
    </li>
  );
}
