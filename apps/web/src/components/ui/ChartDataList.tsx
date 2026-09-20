interface ChartDataListProps {
  label: string;
  entries: { label: string; value: number; onSelect?: () => void }[];
}

export function ChartDataList({ label, entries }: ChartDataListProps) {
  return (
    <ul aria-label={label} className="flex flex-wrap gap-2 text-xs">
      {entries.map((entry) => (
        <li key={entry.label}>
          {entry.onSelect ? (
            <button type="button" className="point-toggle capitalize" onClick={entry.onSelect}>
              {entry.label}: {entry.value}
            </button>
          ) : (
            <span className="capitalize text-muted">{entry.label}: {entry.value}</span>
          )}
        </li>
      ))}
    </ul>
  );
}