"use client";

import { useState } from "react";

type Point = { date: string; visitors: number; briefs: number };

const WIDTH = 760;
const HEIGHT = 200;
const BRIEFS_HEIGHT = 56;
const PAD = { top: 12, right: 12, bottom: 24, left: 40 };

const dayLabel = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", timeZone: "UTC" });
const fullDay = new Intl.DateTimeFormat("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const format = (date: string, formatter: Intl.DateTimeFormat) => formatter.format(new Date(`${date}T00:00:00Z`));

/** A tidy axis maximum: 1, 2 or 5 × a power of ten. */
function niceMax(value: number) {
    if (value <= 4) return 4;
    const power = 10 ** Math.floor(Math.log10(value));
    return ([1, 2, 5, 10].find((step) => step * power >= value) ?? 10) * power;
}

/**
 * Visitors per day (line) with briefs sent per day underneath (bars) — two
 * measures, so two charts sharing the dates rather than two y-axes. Hover or
 * focus a day for exact numbers.
 */
export function TrendChart({ points }: { points: Point[] }) {
    const [active, setActive] = useState<number | null>(null);
    if (points.length === 0) return null;

    const innerWidth = WIDTH - PAD.left - PAD.right;
    const innerHeight = HEIGHT - PAD.top - PAD.bottom;
    const max = niceMax(Math.max(...points.map((point) => point.visitors)));
    const briefMax = Math.max(1, ...points.map((point) => point.briefs));
    const step = points.length > 1 ? innerWidth / (points.length - 1) : 0;
    const x = (index: number) => PAD.left + index * step;
    const y = (value: number) => PAD.top + innerHeight - (value / max) * innerHeight;
    const path = points.map((point, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${y(point.visitors).toFixed(1)}`).join(" ");
    const ticks = [0, max / 2, max];
    // About six date labels whatever the range.
    const labelEvery = Math.max(1, Math.ceil(points.length / 6));
    const barWidth = Math.max(2, Math.min(14, step * 0.6));
    const hovered = active === null ? null : points[active];

    const onMove = (event: React.PointerEvent<SVGRectElement>) => {
        const box = event.currentTarget.getBoundingClientRect();
        const ratio = (event.clientX - box.left) / box.width;
        setActive(Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1)))));
    };

    return (
        <div>
        {/* On narrow screens the chart keeps a readable size and scrolls sideways within its card. */}
        <div className="-mx-2 overflow-x-auto px-2">
        <div className="relative min-w-[560px]">
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT + BRIEFS_HEIGHT}`} className="h-auto w-full" role="img" aria-label="Visitors and briefs per day">
                {/* Gridlines and y-axis (recessive) */}
                {ticks.map((tick) => (
                    <g key={tick}>
                        <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--color-line)" strokeWidth="1" />
                        <text x={PAD.left - 8} y={y(tick) + 4} textAnchor="end" fontSize="11" fill="var(--color-faint)">{Math.round(tick).toLocaleString()}</text>
                    </g>
                ))}
                {/* Visitors line */}
                <path d={path} fill="none" stroke="var(--color-green)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                {/* Date labels */}
                {points.map((point, index) => {
                    const last = index === points.length - 1;
                    // Every few days plus the last one, skipping any that would crowd the last label.
                    const shown = last || (index % labelEvery === 0 && points.length - 1 - index >= labelEvery * 0.6);
                    if (!shown) return null;
                    return (
                        <text
                            key={point.date}
                            x={x(index)}
                            y={HEIGHT - 6}
                            textAnchor={index === 0 ? "start" : last ? "end" : "middle"}
                            fontSize="11"
                            fill="var(--color-faint)"
                        >
                            {format(point.date, dayLabel)}
                        </text>
                    );
                })}
                {/* Briefs per day, a separate small chart below */}
                {points.some((point) => point.briefs) ? (
                    <text x={PAD.left - 8} y={HEIGHT + 14} textAnchor="end" fontSize="11" fill="var(--color-faint)">{briefMax}</text>
                ) : (
                    <text x={PAD.left} y={HEIGHT + BRIEFS_HEIGHT - 14} fontSize="12" fill="var(--color-faint)">No briefs sent in this period</text>
                )}
                <line x1={PAD.left} x2={WIDTH - PAD.right} y1={HEIGHT + BRIEFS_HEIGHT - 4} y2={HEIGHT + BRIEFS_HEIGHT - 4} stroke="var(--color-line)" strokeWidth="1" />
                {points.map((point, index) => {
                    if (!point.briefs) return null;
                    const height = (point.briefs / briefMax) * (BRIEFS_HEIGHT - 16);
                    return (
                        <rect
                            key={point.date}
                            x={x(index) - barWidth / 2}
                            y={HEIGHT + BRIEFS_HEIGHT - 4 - height}
                            width={barWidth}
                            height={height}
                            rx="2"
                            fill="var(--color-green)"
                            opacity="0.75"
                        />
                    );
                })}
                {/* Crosshair */}
                {hovered && active !== null && (
                    <g>
                        <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={HEIGHT + BRIEFS_HEIGHT - 4} stroke="var(--color-muted)" strokeWidth="1" strokeDasharray="3 3" />
                        <circle cx={x(active)} cy={y(hovered.visitors)} r="5" fill="var(--color-green)" stroke="var(--color-surface)" strokeWidth="2" />
                    </g>
                )}
                {/* Hover target, larger than the marks */}
                <rect
                    x={PAD.left - step / 2}
                    y={0}
                    width={innerWidth + step}
                    height={HEIGHT + BRIEFS_HEIGHT}
                    fill="transparent"
                    onPointerMove={onMove}
                    onPointerLeave={() => setActive(null)}
                />
            </svg>

            {hovered && active !== null && (
                <div
                    role="status"
                    className="pointer-events-none absolute top-2 rounded-xl border border-line bg-ink-raised px-3 py-2 text-sm shadow-[0_10px_30px_#00000080]"
                    style={{ left: `clamp(0px, calc(${(x(active) / WIDTH) * 100}% - 70px), calc(100% - 150px))` }}
                >
                    <p className="font-semibold text-white">{format(hovered.date, fullDay)}</p>
                    <p className="text-soft">{hovered.visitors.toLocaleString()} {hovered.visitors === 1 ? "visitor" : "visitors"}</p>
                    <p className="text-soft">{hovered.briefs.toLocaleString()} {hovered.briefs === 1 ? "brief" : "briefs"} sent</p>
                </div>
            )}
        </div>
        </div>

            <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
                <span><span aria-hidden="true" className="mr-1.5 inline-block h-0.5 w-4 bg-green align-middle" />Visitors per day</span>
                <span><span aria-hidden="true" className="mr-1.5 inline-block h-2.5 w-2 rounded-sm bg-green/75 align-middle" />Briefs sent per day (below)</span>
            </p>

            <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-muted hover:text-white">Show as a table</summary>
                <div className="mt-3 max-h-72 overflow-auto rounded-xl border border-line">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-ink-raised text-xs uppercase tracking-[0.1em] text-faint">
                            <tr><th className="px-3 py-2 font-medium">Day</th><th className="px-3 py-2 text-right font-medium">Visitors</th><th className="px-3 py-2 text-right font-medium">Briefs</th></tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {[...points].reverse().map((point) => (
                                <tr key={point.date}>
                                    <td className="px-3 py-1.5 text-soft">{format(point.date, fullDay)}</td>
                                    <td className="px-3 py-1.5 text-right tabular-nums">{point.visitors.toLocaleString()}</td>
                                    <td className="px-3 py-1.5 text-right tabular-nums">{point.briefs.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        </div>
    );
}
