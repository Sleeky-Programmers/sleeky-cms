// Ranked horizontal bars with the value written beside each one (one hue, so
// colour never carries meaning on its own).

type Item = { label: string; value: number; detail?: string };

export function BarList({ items, unit, empty = "No data for this period yet." }: { items: Item[]; unit: string; empty?: string }) {
    if (items.length === 0) return <p className="text-sm text-muted">{empty}</p>;
    const max = Math.max(...items.map((item) => item.value), 1);
    return (
        <ul className="space-y-2.5">
            {items.map((item, index) => (
                <li key={`${item.label}-${index}`} title={`${item.label}: ${item.value.toLocaleString()} ${unit}`}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate text-soft">
                            {item.label || "(not set)"}
                            {item.detail && <span className="text-faint"> · {item.detail}</span>}
                        </span>
                        <span className="shrink-0 tabular-nums text-white">{item.value.toLocaleString()}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-chip">
                        <div className="h-1.5 rounded-full bg-green" style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }} />
                    </div>
                </li>
            ))}
        </ul>
    );
}
