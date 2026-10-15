import { useRef, useState } from 'react';
import { useStore } from '@/lib/store';

export function BackupBar() {
  const { exportBackup, importBackup, importBank, resetAll } = useStore();
  const [msg, setMsg] = useState<string | null>(null);
  const backupInput = useRef<HTMLInputElement>(null);
  const bankInput = useRef<HTMLInputElement>(null);

  const handle = async (fn: () => Promise<string>) => {
    try {
      setMsg(await fn());
    } catch (e) {
      setMsg(e instanceof Error ? `失败：${e.message}` : '操作失败');
    }
    setTimeout(() => setMsg(null), 5000);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={exportBackup}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white active:bg-emerald-500"
      >
        导出备份
      </button>
      <button
        onClick={() => backupInput.current?.click()}
        className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 active:bg-slate-300"
      >
        导入恢复
      </button>
      <button
        onClick={() => bankInput.current?.click()}
        className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 active:bg-slate-300"
      >
        导入词表
      </button>
      <button
        onClick={() => {
          if (window.confirm('确定要清空所有学习数据并恢复默认吗？此操作不可撤销。')) resetAll();
        }}
        className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-600 active:bg-rose-200"
      >
        重置
      </button>

      <input
        ref={backupInput}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handle(() => importBackup(f));
          e.target.value = '';
        }}
      />
      <input
        ref={bankInput}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handle(() => importBank(f));
          e.target.value = '';
        }}
      />
      {msg && <span className="w-full text-xs text-slate-500">{msg}</span>}
    </div>
  );
}
