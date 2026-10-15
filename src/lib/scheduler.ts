import type { DayRecord, Store, WordState } from './types';
import { EMPTY_DAY } from './types';

/** 熟悉度 0-6 对应的复习间隔（天） */
export const INTERVALS = [1, 2, 4, 7, 15, 30, 30];

export function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return todayStr(d);
}

export function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000
  );
}

export function getDay(store: Store, dateStr: string): DayRecord {
  return store.days[dateStr] ?? EMPTY_DAY;
}

/** 累计词汇量 = 曾答对的单词数 */
export function learnedCount(store: Store): number {
  let n = 0;
  for (const k in store.words) if (store.words[k].learned) n++;
  return n;
}

/** 到期复习词（learned 且 due <= 指定日期），按到期日、熟悉度排序 */
export function dueReviews(store: Store, dateStr: string): string[] {
  const list: { w: string; due: string; f: number }[] = [];
  for (const w in store.words) {
    const s = store.words[w];
    if (s.learned && s.due <= dateStr) list.push({ w, due: s.due, f: s.f });
  }
  list.sort((a, b) => (a.due !== b.due ? (a.due < b.due ? -1 : 1) : a.f - b.f));
  return list.map((x) => x.w);
}

/** 新词（无任何学习状态的词），按词表顺序 */
export function newWords(store: Store, bank: string[], dateStr: string): string[] {
  const quota = Math.max(0, store.settings.dailyNewTarget - getDay(store, dateStr).newDone);
  const out: string[] = [];
  for (const w of bank) {
    if (!store.words[w]) {
      out.push(w);
      if (out.length >= quota) break;
    }
  }
  return out;
}

export interface QueueInfo {
  /** 今日队列：到期复习在前，新词补足 */
  queue: string[];
  reviewTotal: number;
  newTotal: number;
}

export function buildQueue(store: Store, bank: string[], dateStr: string): QueueInfo {
  const reviews = dueReviews(store, dateStr);
  const news = newWords(store, bank, dateStr);
  return { queue: [...reviews, ...news], reviewTotal: reviews.length, newTotal: news.length };
}

export function answerCorrect(store: Store, w: string, dateStr: string): Store {
  const prev = store.words[w];
  const f = Math.min(6, (prev?.f ?? 0) + 1);
  const ws: WordState = {
    f,
    due: addDays(dateStr, INTERVALS[f]),
    learned: true,
  };
  const words = { ...store.words, [w]: ws };
  const day = { ...getDay(store, dateStr) };
  const isNew = !prev;
  if (isNew) day.newDone += 1;
  else day.reviewDone += 1;
  day.cumVocab = learnedCount({ ...store, words });
  return finalizeDay({ ...store, words, days: { ...store.days, [dateStr]: day } }, dateStr);
}

export function answerWrong(store: Store, w: string, dateStr: string): Store {
  const prev = store.words[w];
  const ws: WordState = { f: 0, due: addDays(dateStr, 1), learned: prev?.learned ?? false };
  const words = { ...store.words, [w]: ws };
  const day = { ...getDay(store, dateStr) };
  if (!prev) day.newDone += 1;
  else day.reviewDone += 1;
  return finalizeDay({ ...store, words, days: { ...store.days, [dateStr]: day } }, dateStr);
}

/** 锁定今日 dueTotal（当天第一次进入时），并在达标时自动打卡 */
function finalizeDay(store: Store, dateStr: string): Store {
  const day = { ...getDay(store, dateStr) };
  if (day.dueTotal < 0) day.dueTotal = dueReviews(store, dateStr).length + day.reviewDone;
  if (day.cumVocab < 0) day.cumVocab = learnedCount(store);
  const target = store.settings.dailyNewTarget;
  if (!day.checkedIn && day.newDone >= target && day.reviewDone >= day.dueTotal) {
    day.checkedIn = true;
  }
  return { ...store, days: { ...store.days, [dateStr]: day } };
}

/** 每次启动/日期变化时确保今日记录已初始化并锁定 dueTotal */
export function touchToday(store: Store, dateStr: string): Store {
  const day = getDay(store, dateStr);
  if (day.dueTotal >= 0 && day.cumVocab >= 0) return store;
  return finalizeDay(store, dateStr);
}

/** 连续打卡天数 */
export function streak(store: Store, dateStr: string): number {
  let n = 0;
  let d = dateStr;
  const today = getDay(store, dateStr);
  if (!today.checkedIn) d = addDays(d, -1); // 今天还没打卡，从昨天往前数
  while (getDay(store, d).checkedIn) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/** 近 n 天日期列表（含今天） */
export function lastNDays(dateStr: string, n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(dateStr, -i));
  return out;
}
