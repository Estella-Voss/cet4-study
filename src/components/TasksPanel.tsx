import { useStore } from '@/lib/store';
import { getDay, streak } from '@/lib/scheduler';

function Bar({
  label,
  value,
  target,
  color,
  suffix,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
  suffix: string;
}) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : value > 0 ? 100 : 0;
  const full = target > 0 && value >= target;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <span className={`text-sm font-bold ${full ? 'text-emerald-600' : 'text-slate-700'}`}>
          {value}
          <span className="text-xs font-normal text-slate-400"> / {target}</span> {suffix}
          {full && ' ✓'}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function TasksPanel() {
  const { store, today } = useStore();
  const day = getDay(store, today);
  const s = store.settings;
  const minutes = Math.floor(day.seconds / 60);
  const checked = day.checkedIn;
  const st = streak(store, today);

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <header className="mb-4 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
        <h2 className="text-base font-bold text-slate-800">今日任务</h2>
      </header>

      <div className="flex flex-1 flex-col justify-center gap-5">
        <Bar
          label="新词学习"
          value={day.newDone}
          target={s.dailyNewTarget}
          color="bg-sky-500"
          suffix="词"
        />
        <Bar
          label="到期复习"
          value={day.reviewDone}
          target={Math.max(day.dueTotal, 0)}
          color="bg-amber-500"
          suffix="词"
        />
        <Bar
          label="学习时长"
          value={minutes}
          target={s.dailyMinutesGoal}
          color="bg-violet-500"
          suffix="分钟"
        />
      </div>

      <div
        className={`mt-5 rounded-xl px-4 py-3 text-center ${
          checked ? 'bg-emerald-50' : 'bg-slate-50'
        }`}
      >
        {checked ? (
          <div>
            <p className="text-lg font-bold text-emerald-600">✓ 打卡成功</p>
            <p className="mt-0.5 text-sm text-slate-500">
              已连续打卡 <span className="font-bold text-emerald-600">{st}</span> 天
              {st >= 7 ? '，状态火热！' : st >= 3 ? '，继续保持！' : '，好的开始！'}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            新词达标且到期复习全部完成后将自动打卡
          </p>
        )}
      </div>
    </section>
  );
}
