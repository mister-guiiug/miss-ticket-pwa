/**
 * La carte de chiffre-clé, sortie de `SessionPanel` pour être PARTAGÉE.
 *
 * L'écran « Historique » a besoin exactement des mêmes cartes que l'écran des
 * sessions ; les recopier aurait donné deux rangées visuellement jumelles qui
 * divergeraient au premier ajustement. Le composant n'a pas changé d'un pixel
 * en changeant de fichier.
 */

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

export function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div
      style={{
        padding: '16px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          margin: '0 auto 12px',
          borderRadius: '10px',
          backgroundColor:
            color === 'var(--text-primary)'
              ? 'var(--bg-tertiary)'
              : color
                  .replace(')', ', 0.1)')
                  .replace('rgb', 'rgba')
                  .replace('var(', 'var('),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div
        style={{
          fontSize: '24px',
          fontWeight: '700',
          color,
          marginBottom: '4px',
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          fontWeight: '500',
        }}
      >
        {label}
      </div>
    </div>
  );
}
