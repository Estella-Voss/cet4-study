import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { addDays, lastNDays } from '@/lib/scheduler';

function LineChart({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const W = 300;
  const H = 84;
  const pad = 6;
  const pts = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (W - pad * 2);
      const y = H - pad - (v / max) * (H - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <polyline points={pts} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinejoin="round" />
      {values.map((v, i) => {
        const x = pad + (i / (values.length - 1)) * (W - pad * 2);
        const y = H - pad - (v / max) * (H - pad * 2);
        return <circle key={i} cx={x} cy={y} r="2.5" fill="#10b981" />;
      })}
    </svg>
  );
}

function BarChart({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  const W = 300;
  const H = 84;
  const pad = 6;
  const bw = (W - pad * 2) / values.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {values.map((v, i) => {
        const h = v <= 0 ? 2 : Math.max(3, (v / max) * (H - pad * 2));
        return (
          <rect
            key={i}
            x={pad + i * bw + bw * 0.2}
            y={H - pad - h}
            width={bw * 0.6}
            height={h}
            rx="1.5"
            fill={color}
            opacity={v <= 0 ? 0.15 : 1}
          />
        );
      })}
    </svg>
  );
}

export function ChartsPanel() {
  const { store, today } = useStore();

  const data = useMemo(() => {
    const dates = lastNDays(today, 14);
    // 累计词汇量：从窗口前推 30 天找基线，再逐日推进
    let cur = 0;
    for (let i = 30; i >= 1; i--) {
      const rec = store.days[addDays(dates[0], -i)];
      if (rec && rec.cumVocab >= 0) cur = rec.cumVocab;
    }
    const cum = dates.map((d) => {
      const rec = store.days[d];
      if (rec && rec.cumVocab >= 0) cur = rec.cumVocab;
      return cur;
    });
    const checkins = dates.map((d) => (store.days[d]?.checkedIn ? 1 : 0));
    const minutes = dates.map((d) => Math.round((store.days[d]?.seconds ?? 0) / 60));
    return { cum, checkins, minutes };
  }, [store, today]);

  const cards = [
    {
      title: `累计词汇量（${data.cum[data.cum.length - 1]} 词）`,
      chart: <LineChart values={data.cum} />,
    },
    {
      title: `近 14 天打卡（${data.checkins.reduce((a: number, b) => a + b, 0)} 天）`,
      chart: <BarChart values={data.checkins} color="#10b981" />,
    },
    {
      title: `每日学习时长（分钟）`,
      chart: <BarChart values={data.minutes} color="#0ea5e9" />,
    },
  ];

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <header className="mb-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
        <h2 className="text-base font-bold text-slate-800">成长曲线</h2>
        <span className="ml-auto text-xs text-slate-400">近 14 天</span>
      </header>
      <div className="flex flex-1 flex-col justify-around gap-3">
        {cards.map((c) => (
          <div key={c.title} className="rounded-xl bg-slate-50 p-3">
            <p className="mb-1 text-xs font-medium text-slate-500">{c.title}</p>
            {c.chart}
          </div>
        ))}
      </div>
    </section>
  );
}
