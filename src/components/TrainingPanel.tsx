import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { EMPTY_TRAINING, type TrainingRecord } from '@/lib/types';

const SECTIONS: { key: keyof TrainingRecord; label: string; icon: string; color: string; ring: string }[] = [
  { key: 'listening', label: '听力', icon: '🎧', color: 'bg-sky-500', ring: '#0ea5e9' },
  { key: 'reading', label: '阅读', icon: '📖', color: 'bg-emerald-500', ring: '#10b981' },
  { key: 'writing', label: '写作', icon: '✏️', color: 'bg-amber-500', ring: '#f59e0b' },
  { key: 'translation', label: '翻译', icon: '🌐', color: 'bg-rose-500', ring: '#f43f5e' },
];

function Donut({ values, colors }: { values: number[]; colors: string[] }) {
  const total = values.reduce((a, b) => a + b, 0);
  const R = 42;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg viewBox="0 0 120 120" className="mx-auto w-44">
      <circle cx="60" cy="60" r={R} fill="none" stroke="#f1f5f9" strokeWidth="16" />
      {total > 0 &&
        values.map((v, i) => {
          if (v <= 0) return null;
          const frac = v / total;
          const seg = (
            <circle
              key={i}
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke={colors[i]}
              strokeWidth="16"
              strokeDasharray={`${(frac * C).toFixed(2)} ${C.toFixed(2)}`}
              strokeDashoffset={(-offset * C).toFixed(2)}
              transform="rotate(-90 60 60)"
            />
          );
          offset += frac;
          return seg;
        })}
      <text x="60" y="56" textAnchor="middle" className="fill-slate-800" fontSize="24" fontWeight="700">
        {total}
      </text>
      <text x="60" y="74" textAnchor="middle" className="fill-slate-400" fontSize="10">
        今日总次数
      </text>
    </svg>
  );
}

export function TrainingPanel() {
  const { store, today, update } = useStore();

  const todayRec = store.training[today] ?? EMPTY_TRAINING;
  const totals = useMemo(() => {
    const t: Record<keyof TrainingRecord, number> = { ...EMPTY_TRAINING };
    for (const d in store.training) {
      for (const s of SECTIONS) t[s.key] += store.training[d][s.key] ?? 0;
    }
    return t;
  }, [store.training]);

  const add = (key: keyof TrainingRecord) =>
    update((s) => {
      const rec = { ...(s.training[today] ?? EMPTY_TRAINING) };
      rec[key] += 1;
      return { ...s, training: { ...s.training, [today]: rec } };
    });

  const undo = (key: keyof TrainingRecord) =>
    update((s) => {
      const rec = { ...(s.training[today] ?? EMPTY_TRAINING) };
      if (rec[key] <= 0) return s;
      rec[key] -= 1;
      return { ...s, training: { ...s.training, [today]: rec } };
    });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 p-4 md:p-6">
      <div className="grid grid-cols-2 gap-4">
        {SECTIONS.map((s) => (
          <div
            key={s.key}
            className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-base font-bold text-slate-700">
                {s.icon} {s.label}
              </span>
              <span className="text-xs text-slate-400">累计 {totals[s.key]}</span>
            </div>
            <div className="py-3 text-4xl font-extrabold text-slate-800">{todayRec[s.key]}</div>
            <div className="text-xs text-slate-400">今日次数</div>
            <button
              onClick={() => add(s.key)}
              className={`mt-3 h-14 w-full rounded-xl text-2xl font-extrabold text-white transition active:opacity-80 ${s.color}`}
              aria-label={`记录一次${s.label}训练`}
            >
              +1
            </button>
            <button
              onClick={() => undo(s.key)}
              disabled={todayRec[s.key] <= 0}
              className="mt-2 rounded-lg px-3 py-1 text-xs font-medium text-slate-400 active:text-slate-600 disabled:opacity-30"
            >
              撤销
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="mb-3 text-center text-sm font-medium text-slate-500">今日训练占比</p>
        <Donut values={SECTIONS.map((s) => todayRec[s.key])} colors={SECTIONS.map((s) => s.ring)} />
        <div className="mt-3 flex justify-center gap-4 text-xs text-slate-500">
          {SECTIONS.map((s) => (
            <span key={s.key} className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.ring }} />
              {s.label} {todayRec[s.key]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
