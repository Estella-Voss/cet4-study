import { useState } from 'react';
import { useStore } from '@/lib/store';
import { daysBetween, learnedCount } from '@/lib/scheduler';

function defaultExamDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  // 默认今年 12 月 15 日；若已过则取明年
  let d = `${y}-12-15`;
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  if (new Date(d + 'T00:00:00') < t) d = `${y + 1}-12-15`;
  return d;
}

export function PlanPanel() {
  const { store, bank, today, update } = useStore();
  const s = store.settings;
  const [editing, setEditing] = useState(false);
  const [examDate, setExamDate] = useState(s.examDate ?? defaultExamDate());
  const [newTarget, setNewTarget] = useState(String(s.dailyNewTarget));
  const [minutesGoal, setMinutesGoal] = useState(String(s.dailyMinutesGoal));

  const learned = learnedCount(store);
  const total = bank.length;
  const remaining = total - learned;

  const save = () => {
    const nt = Math.max(1, Math.min(500, parseInt(newTarget, 10) || 20));
    const mg = Math.max(1, Math.min(600, parseInt(minutesGoal, 10) || 30));
    update((st) => ({
      ...st,
      settings: { ...st.settings, examDate, dailyNewTarget: nt, dailyMinutesGoal: mg },
    }));
    setEditing(false);
  };

  const daysLeft = s.examDate ? daysBetween(today, s.examDate) : null;
  const required =
    daysLeft !== null && daysLeft > 0 ? Math.ceil(remaining / daysLeft) : null;
  const enough = required !== null && required <= s.dailyNewTarget;

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <header className="mb-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
        <h2 className="text-base font-bold text-slate-800">倒计时与计划</h2>
        {s.examDate && !editing && (
          <button
            onClick={() => {
              setExamDate(s.examDate!);
              setNewTarget(String(s.dailyNewTarget));
              setMinutesGoal(String(s.dailyMinutesGoal));
              setEditing(true);
            }}
            className="ml-auto rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 active:bg-slate-200"
          >
            修改
          </button>
        )}
      </header>

      {editing || !s.examDate ? (
        <div className="flex flex-1 flex-col justify-center gap-4">
          {!s.examDate && (
            <p className="text-sm text-slate-500">首次使用，先设置考试日期和每日目标：</p>
          )}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">考试日期</span>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-800"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">每日新词目标</span>
            <input
              type="number"
              min={1}
              max={500}
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              className="h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-800"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600">每日学习时长目标（分钟）</span>
            <input
              type="number"
              min={1}
              max={600}
              value={minutesGoal}
              onChange={(e) => setMinutesGoal(e.target.value)}
              className="h-12 w-full rounded-xl border border-slate-200 px-3 text-base text-slate-800"
            />
          </label>
          <button
            onClick={save}
            className="h-13 w-full rounded-xl bg-slate-800 py-3.5 text-lg font-semibold text-white active:bg-slate-700"
          >
            保存
          </button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-center gap-4">
          <div className="text-center">
            <div className="text-5xl font-extrabold text-slate-800">
              {daysLeft !== null && daysLeft >= 0 ? daysLeft : 0}
            </div>
            <div className="mt-1 text-sm text-slate-400">
              距离考试（{s.examDate}）剩余天数
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-600">
            剩余 <b className="text-slate-800">{remaining}</b> / {total} 词 ÷ {daysLeft} 天
            = 每天至少需背{' '}
            <b className={enough ? 'text-emerald-600' : 'text-rose-500'}>{required}</b> 词
            （当前目标 {s.dailyNewTarget} 词/天）
          </div>

          {daysLeft !== null && daysLeft <= 0 ? (
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-700">
              考试日期已到，记得修改考试日期以继续规划！
            </div>
          ) : enough ? (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center">
              <p className="text-sm font-bold text-emerald-600">💪 目标充足，节奏没问题</p>
              <p className="mt-0.5 text-xs text-emerald-600/80">
                照这个进度坚持下去，425 稳了！
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-rose-50 px-4 py-3 text-center">
              <p className="text-sm font-bold text-rose-600">⚠️ 当前目标赶不上考试</p>
              <p className="mt-0.5 text-xs text-rose-500">
                每天 {s.dailyNewTarget} 词到考前只能再学约 {s.dailyNewTarget * (daysLeft ?? 0)} 词
              </p>
              {required !== null && required <= 300 && (
                <button
                  onClick={() =>
                    update((st) => ({
                      ...st,
                      settings: { ...st.settings, dailyNewTarget: required },
                    }))
                  }
                  className="mt-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white active:bg-rose-400"
                >
                  把每日目标调高到 {required} 词
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
