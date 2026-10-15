import { useEffect, useRef, useState } from 'react';
import { StoreProvider, useStore } from '@/lib/store';
import { getDay, learnedCount } from '@/lib/scheduler';
import { WordPanel } from '@/components/WordPanel';
import { TasksPanel } from '@/components/TasksPanel';
import { ChartsPanel } from '@/components/ChartsPanel';
import { PlanPanel } from '@/components/PlanPanel';
import { TrainingPanel } from '@/components/TrainingPanel';
import { BackupBar } from '@/components/BackupBar';

/** 自动统计学习时长：页面可见时累计，每满 15 秒写入一次 */
function useTimeTracker() {
  const { today, update } = useStore();
  const todayRef = useRef(today);
  todayRef.current = today;

  useEffect(() => {
    let acc = 0;
    let last = Date.now();
    const iv = setInterval(() => {
      const now = Date.now();
      if (!document.hidden) acc += now - last;
      last = now;
      if (acc >= 15_000) {
        const chunk = Math.floor(acc / 1000);
        acc -= chunk * 1000;
        const d = todayRef.current;
        update((s) => {
          const day = { ...getDay(s, d) };
          day.seconds += chunk;
          day.cumVocab = day.cumVocab >= 0 ? day.cumVocab : learnedCount(s);
          return { ...s, days: { ...s.days, [d]: day } };
        });
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [update]);
}

function Dashboard() {
  useTimeTracker();
  const { store, bank } = useStore();
  const learned = learnedCount(store);
  const [tab, setTab] = useState<'home' | 'train'>('home');

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 pb-16 text-slate-800">
      <header className="flex flex-wrap items-center gap-3 px-4 pt-5 md:px-6">
        <div className="mr-auto">
          <h1 className="text-xl font-extrabold tracking-tight">四级冲刺 425</h1>
          <p className="text-xs text-slate-400">
            词库 {bank.length} 词 · 已掌握 {learned} 词
          </p>
        </div>
        <BackupBar />
      </header>

      {tab === 'home' ? (
        <>
          {/* 移动端纵向堆叠；桌面端 2×2 四等分 */}
          <main className="grid flex-1 grid-cols-1 gap-4 p-4 md:grid-cols-2 md:grid-rows-2 md:gap-5 md:p-6 md:h-[calc(100vh-14.5rem)]">
            <WordPanel />
            <TasksPanel />
            <ChartsPanel />
            <PlanPanel />
          </main>

          <footer className="px-4 pb-2 text-center text-xs text-slate-400 md:px-6">
            数据仅保存在本机浏览器中，建议每周导出一次备份，防止误清理丢失。
          </footer>
        </>
      ) : (
        <main className="flex flex-1 flex-col">
          <TrainingPanel />
        </main>
      )}

      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 grid h-14 grid-cols-2 border-t border-slate-200 bg-white">
        <button
          onClick={() => setTab('home')}
          className={`text-sm font-bold transition ${
            tab === 'home' ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          ⌂ 首页
        </button>
        <button
          onClick={() => setTab('train')}
          className={`text-sm font-bold transition ${
            tab === 'train' ? 'text-emerald-600' : 'text-slate-400'
          }`}
        >
          ☰ 训练
        </button>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Dashboard />
    </StoreProvider>
  );
}
