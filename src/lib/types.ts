export interface WordState {
  /** 熟悉度 0-6，答对 +1，答错归零 */
  f: number;
  /** 下次到期复习日期 YYYY-MM-DD */
  due: string;
  /** 是否曾经答对（计入累计词汇量） */
  learned: boolean;
}

export interface DayRecord {
  /** 今日已学新词数 */
  newDone: number;
  /** 今日已完成复习数 */
  reviewDone: number;
  /** 今日到期复习总数（当天首次进入时锁定） */
  dueTotal: number;
  /** 今日学习时长（秒） */
  seconds: number;
  /** 是否已自动打卡 */
  checkedIn: boolean;
  /** 当日累计词汇量快照 */
  cumVocab: number;
}

export interface Settings {
  examDate: string | null;
  dailyNewTarget: number;
  dailyMinutesGoal: number;
}

export interface Store {
  version: 1;
  settings: Settings;
  /** 有状态的单词（已学过/已排期的） */
  words: Record<string, WordState>;
  /** 按日期记录的学习数据 */
  days: Record<string, DayRecord>;
  /** 按日期记录的训练数据（听力/阅读/写作/翻译） */
  training: Record<string, TrainingRecord>;
}

/** 每日四个板块的训练次数 */
export interface TrainingRecord {
  listening: number;
  reading: number;
  writing: number;
  translation: number;
}

export const EMPTY_TRAINING: TrainingRecord = {
  listening: 0,
  reading: 0,
  writing: 0,
  translation: 0,
}

export const EMPTY_DAY: DayRecord = {
  newDone: 0,
  reviewDone: 0,
  dueTotal: -1, // -1 表示尚未锁定
  seconds: 0,
  checkedIn: false,
  cumVocab: -1,
};
