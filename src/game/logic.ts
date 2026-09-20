// 4 位數減法遊戲核心邏輯
// 位值索引：0 = 個位, 1 = 十位, 2 = 百位, 3 = 千位

export const PLACE_NAMES = ["個", "十", "百", "千"] as const;
export const PLACE_FULL = ["個位", "十位", "百位", "千位"] as const;

export type LevelId = 1 | 2 | 3 | 4 | 5;

export interface LevelInfo {
  id: LevelId;
  name: string;
  desc: string;
  emoji: string;
  color: string;
}

export const LEVELS: LevelInfo[] = [
  { id: 1, name: "暖身村", desc: "不用借位，先熟悉直式", emoji: "🌱", color: "from-emerald-400 to-green-500" },
  { id: 2, name: "借位森林", desc: "只需要借位一次", emoji: "🌳", color: "from-sky-400 to-blue-500" },
  { id: 3, name: "連借山谷", desc: "需要借位兩次以上", emoji: "⛰️", color: "from-amber-400 to-orange-500" },
  { id: 4, name: "跨零城堡", desc: "遇到 0 要連續借位", emoji: "🏰", color: "from-fuchsia-400 to-purple-500" },
  { id: 5, name: "混合競技場", desc: "什麼題型都會出現", emoji: "🏟️", color: "from-rose-400 to-red-500" },
];

export interface Problem {
  a: number; // 被減數
  b: number; // 減數
  aDigits: number[]; // [個, 十, 百, 千]
  bDigits: number[];
  answerDigits: number[];
  borrowCount: number;
  chainBorrow: boolean; // 是否有跨零借位
}

export function toDigits(n: number): number[] {
  return [n % 10, Math.floor(n / 10) % 10, Math.floor(n / 100) % 10, Math.floor(n / 1000) % 10];
}

export function fromDigits(d: number[]): number {
  return d[0] + d[1] * 10 + d[2] * 100 + d[3] * 1000;
}

function analyze(a: number, b: number) {
  const ad = toDigits(a);
  const bd = toDigits(b);
  let carry = 0;
  let borrowCount = 0;
  let chain = false;
  for (let i = 0; i < 4; i++) {
    const top = ad[i] - carry;
    if (top < bd[i]) {
      borrowCount++;
      // 若下一位是 0（且不是千位），會需要跨零借位
      if (i + 1 < 4 && ad[i + 1] === 0) chain = true;
      carry = 1;
    } else {
      carry = 0;
    }
  }
  return { borrowCount, chain };
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function build(a: number, b: number): Problem {
  const { borrowCount, chain } = analyze(a, b);
  return {
    a,
    b,
    aDigits: toDigits(a),
    bDigits: toDigits(b),
    answerDigits: toDigits(a - b),
    borrowCount,
    chainBorrow: chain,
  };
}

export function generateProblem(level: LevelId): Problem {
  for (let attempt = 0; attempt < 5000; attempt++) {
    const a = randInt(1200, 9999);
    // 減數：多半是 4 位數，偶爾是 3 位數
    const b = Math.random() < 0.75 ? randInt(1000, a - 1) : randInt(100, Math.min(999, a - 1));
    if (b >= a) continue;
    const p = build(a, b);
    switch (level) {
      case 1:
        if (p.borrowCount === 0 && b >= 1000) return p;
        break;
      case 2:
        if (p.borrowCount === 1 && !p.chainBorrow) return p;
        break;
      case 3:
        if (p.borrowCount >= 2 && !p.chainBorrow) return p;
        break;
      case 4:
        if (p.chainBorrow) return p;
        break;
      case 5:
        if (p.borrowCount >= 1) return p;
        break;
    }
  }
  return build(5432, 1234);
}

// ===== 遊戲中的欄位狀態 =====
export interface ColumnState {
  lent: number; // 借給右邊 1 → 自己少 1
  got: number; // 從左邊借來 1 → 自己多 10
  answer: number | null; // 已填入的答案
}

export function effectiveTop(orig: number, col: ColumnState) {
  return orig - col.lent + col.got * 10;
}

/** 完整判斷：第 k 位是否需要借位（包含跨零的連鎖情況） */
export function needsBorrowFull(
  k: number,
  aDigits: number[],
  bDigits: number[],
  cols: ColumnState[],
  currentCol: number
): boolean {
  if (k < currentCol || k > 3) return false;
  const top = effectiveTop(aDigits[k], cols[k]);
  if (k === currentCol) return top < bDigits[k];
  // k > currentCol：如果自己是 0 且右邊需要借，那自己也必須先借
  if (top === 0 && needsBorrowFull(k - 1, aDigits, bDigits, cols, currentCol)) return true;
  return false;
}

export function starsForMistakes(m: number) {
  if (m === 0) return 3;
  if (m <= 2) return 2;
  return 1;
}

export const PRAISES = [
  "太棒了！你真是減法小天才！",
  "答對了！積木都聽你的話！",
  "好厲害！繼續保持！",
  "完美！貓頭鷹博士為你鼓掌！👏",
  "耶！又解開一題！",
];

export const ENCOURAGE = [
  "沒關係，再想一想！",
  "差一點點，再試一次！",
  "別急，看看 3D 積木提示！",
  "加油！你一定可以的！",
];

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
