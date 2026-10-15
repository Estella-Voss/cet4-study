import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { WORDS as BUILTIN_WORDS, type Word } from '@/data/words';
import type { Store } from './types';
import { todayStr, touchToday } from './scheduler';

const STORE_KEY = 'cet4-study-v1';
const BANK_KEY = 'cet4-bank-v1';

export const BUILTIN_BANK: Word[] = BUILTIN_WORDS;

function defaultStore(): Store {
  return {
    version: 1,
    settings: { examDate: null, dailyNewTarget: 20, dailyMinutesGoal: 30 },
    words: {},
    days: {},
    training: {},
  };
}

/** 兼容旧版备份：补齐缺失字段 */
function normalizeStore(s: Store): Store {
  return { ...s, training: s.training ?? {} };
}

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 1 && parsed.settings && parsed.words && parsed.days) {
        return normalizeStore(parsed as Store);
      }
    }
  } catch {
    /* 数据损坏时回退到默认 */
  }
  return defaultStore();
}

/** 当前生效的词表：用户导入的词表优先，否则用内置词库 */
export function loadBank(): Word[] {
  try {
    const raw = localStorage.getItem(BANK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].w && parsed[0].m) {
        return parsed as Word[];
      }
    }
  } catch {
    /* ignore */
  }
  return BUILTIN_BANK;
}

interface StoreApi {
  store: Store;
  bank: Word[];
  today: string;
  update: (fn: (s: Store) => Store) => void;
  exportBackup: () => void;
  importBackup: (file: File) => Promise<string>;
  importBank: (file: File) => Promise<string>;
  resetAll: () => void;
}

const Ctx = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Store>(() => touchToday(loadStore(), todayStr()));
  const [bank, setBank] = useState<Word[]>(loadBank);
  const today = todayStr();

  // 每次状态变化都持久化到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch {
      /* 存储空间不足等情况忽略 */
    }
  }, [store]);

  // 跨天自动切换（页面长时间不关闭）
  useEffect(() => {
    const t = setInterval(() => {
      const d = todayStr();
      setStore((s) => (getDayKey(s) === d ? s : touchToday(s, d)));
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  const update = useCallback((fn: (s: Store) => Store) => {
    setStore((s) => fn(s));
  }, []);

  const exportBackup = useCallback(() => {
    const payload = {
      app: 'cet4-study',
      exportedAt: new Date().toISOString(),
      store,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `四级学习备份-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [store]);

  const importBackup = useCallback(async (file: File): Promise<string> => {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const s = parsed?.store ?? parsed; // 兼容直接导出的 store
    if (!s || s.version !== 1 || !s.settings || !s.words || !s.days) {
      throw new Error('不是有效的学习数据备份文件');
    }
    setStore(touchToday(normalizeStore(s as Store), todayStr()));
    return '恢复成功，学习数据已还原';
  }, []);

  const importBank = useCallback(async (file: File): Promise<string> => {
    const text = await file.text();
    const parsed = JSON.parse(text);
    let list: Word[] = [];
    if (Array.isArray(parsed)) {
      list = parsed
        .map((x: unknown) => {
          if (typeof x === 'string') return { w: x.toLowerCase().trim(), m: '' };
          const o = x as Record<string, unknown>;
          if (o && (o.w || o.word)) {
            return { w: String(o.w ?? o.word).toLowerCase().trim(), m: String(o.m ?? o.meaning ?? '') };
          }
          return null;
        })
        .filter((x: Word | null): x is Word => !!x && !!x.w);
    }
    if (list.length === 0) throw new Error('词表文件格式不正确，应为 [{word, meaning}] 数组');
    localStorage.setItem(BANK_KEY, JSON.stringify(list));
    setBank(list);
    // 换词表后重置单词进度，保留打卡历史与设置
    setStore((s) => ({ ...s, words: {} }));
    return `已导入 ${list.length} 个单词，单词进度已重置`;
  }, []);

  const resetAll = useCallback(() => {
    localStorage.removeItem(STORE_KEY);
    localStorage.removeItem(BANK_KEY);
    setBank(BUILTIN_BANK);
    setStore(touchToday(defaultStore(), todayStr()));
  }, []);

  const api = useMemo<StoreApi>(
    () => ({ store, bank, today, update, exportBackup, importBackup, importBank, resetAll }),
    [store, bank, today, update, exportBackup, importBackup, importBank, resetAll]
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

function getDayKey(s: Store): string {
  const keys = Object.keys(s.days);
  return keys.length ? keys[keys.length - 1] : '';
}

export function useStore(): StoreApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
