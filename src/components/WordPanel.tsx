import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { answerCorrect, answerWrong, buildQueue, getDay } from '@/lib/scheduler';

export function WordPanel() {
  const { store, bank, today, update } = useStore();
  const bankWords = useMemo(() => bank.map((b) => b.w), [bank]);
  const meanings = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of bank) m.set(b.w, b.m);
    return m;
  }, [bank]);

  const info = useMemo(() => buildQueue(store, bankWords, today), [store, bankWords, today]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setIdx(0);
    setRevealed(false);
  }, [today]);

  const clampedIdx = Math.min(idx, info.queue.length);
  const current = info.queue[clampedIdx];
  const day = getDay(store, today);
  const remaining = info.queue.length - clampedIdx;
  const isReview = current ? !!store.words[current] : false;
  const fam = current ? store.words[current]?.f ?? 0 : 0;

  const answer = (ok: boolean) => {
    if (!current) return;
    update((s) => (ok ? answerCorrect(s, current, today) : answerWrong(s, current, today)));
    setRevealed(false);
  };

  const total = info.queue.length;
  const done = clampedIdx;

  return (
    <section className="flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <header className="mb-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        <h2 className="text-base font-bold text-slate-800">今日单词</h2>
        <span className="ml-auto text-xs text-slate-400">艾宾浩斯复习</span>
      </header>

      {/* 顶部进度条 */}
      <div className="mb-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: total === 0 ? '100%' : `${(done / Math.max(total, 1)) * 100}%` }}
          />
        </div>
      </div>

      {!current ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
          <div className="text-4xl">🎉</div>
          <p className="text-lg font-bold text-slate-700">今日队列已清空</p>
          <p className="text-sm text-slate-400">
            {day.newDone >= store.settings.dailyNewTarget
              ? '新词目标已完成，到期复习也全部搞定'
              : '所有到期复习已完成'}
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isReview ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
              }`}
            >
              {isReview ? `复习 · 熟悉度 ${fam}/6` : '新词'}
            </span>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center py-4">
            <div className="text-4xl font-extrabold tracking-wide text-slate-800">{current}</div>
            {revealed && (
              <div className="mt-4 max-w-full rounded-xl bg-slate-50 px-5 py-3 text-center text-lg leading-relaxed text-slate-700">
                {meanings.get(current) || '（本词暂无释义）'}
              </div>
            )}
          </div>

          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="h-14 w-full rounded-xl bg-slate-800 text-lg font-semibold text-white transition active:bg-slate-700"
            >
              显示释义
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => answer(true)}
                className="h-14 rounded-xl bg-emerald-500 text-lg font-bold text-white transition active:bg-emerald-400"
              >
                ✓ 认识
              </button>
              <button
                onClick={() => answer(false)}
                className="h-14 rounded-xl bg-rose-500 text-lg font-bold text-white transition active:bg-rose-400"
              >
                ✗ 不认识
              </button>
            </div>
          )}
        </div>
      )}

      {/* 底部进度 */}
      <footer className="mt-4 grid grid-cols-3 divide-x divide-slate-100 rounded-xl bg-slate-50 py-2 text-center">
        <div>
          <div className="text-lg font-bold text-slate-800">{Math.max(remaining, 0)}</div>
          <div className="text-xs text-slate-400">剩余词数</div>
        </div>
        <div>
          <div className="text-lg font-bold text-slate-800">
            {day.newDone}
            <span className="text-sm text-slate-400"> / {store.settings.dailyNewTarget}</span>
          </div>
          <div className="text-xs text-slate-400">新词 / 目标</div>
        </div>
        <div>
          <div className="text-lg font-bold text-slate-800">
            {day.reviewDone}
            <span className="text-sm text-slate-400"> / {Math.max(day.dueTotal, 0)}</span>
          </div>
          <div className="text-xs text-slate-400">复习 / 到期</div>
        </div>
      </footer>
    </section>
  );
}
