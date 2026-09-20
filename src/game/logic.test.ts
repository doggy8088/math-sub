import { describe, expect, it } from "vitest";
import {
  effectiveTop,
  fromDigits,
  generateProblem,
  needsBorrowFull,
  starsForMistakes,
  toDigits,
  type ColumnState,
  type LevelId,
  type Problem,
} from "./logic";

const LEVELS: LevelId[] = [1, 2, 3, 4, 5];
const freshCols = (): ColumnState[] =>
  Array.from({ length: 4 }, () => ({ lent: 0, got: 0, answer: null }));

function makeProblem(a: number, b: number): Problem {
  return {
    a,
    b,
    aDigits: toDigits(a),
    bDigits: toDigits(b),
    answerDigits: toDigits(a - b),
    borrowCount: 0,
    chainBorrow: false,
  };
}

describe("toDigits / fromDigits", () => {
  it("來回轉換保持一致", () => {
    for (const n of [0, 7, 42, 909, 1000, 5432, 9999]) {
      expect(fromDigits(toDigits(n))).toBe(n);
    }
  });

  it("索引 0 是個位", () => {
    expect(toDigits(5432)).toEqual([2, 3, 4, 5]);
  });
});

describe("generateProblem", () => {
  it("五個關卡都產生 4 位數、結果為正的題目", () => {
    for (const level of LEVELS) {
      for (let i = 0; i < 200; i++) {
        const p = generateProblem(level);
        expect(p.a).toBeGreaterThanOrEqual(1200);
        expect(p.a).toBeLessThanOrEqual(9999);
        expect(p.b).toBeGreaterThan(0);
        expect(p.a - p.b).toBeGreaterThan(0);
        expect(fromDigits(p.aDigits)).toBe(p.a);
        expect(fromDigits(p.bDigits)).toBe(p.b);
        expect(fromDigits(p.answerDigits)).toBe(p.a - p.b);
      }
    }
  });

  it("關卡 1 完全不需要借位，且減數是 4 位數", () => {
    for (let i = 0; i < 200; i++) {
      const p = generateProblem(1);
      expect(p.borrowCount).toBe(0);
      expect(p.b).toBeGreaterThanOrEqual(1000);
    }
  });

  it("關卡 2 剛好借位一次且不跨零", () => {
    for (let i = 0; i < 200; i++) {
      const p = generateProblem(2);
      expect(p.borrowCount).toBe(1);
      expect(p.chainBorrow).toBe(false);
    }
  });

  it("關卡 3 需要借位兩次以上且不跨零", () => {
    for (let i = 0; i < 200; i++) {
      const p = generateProblem(3);
      expect(p.borrowCount).toBeGreaterThanOrEqual(2);
      expect(p.chainBorrow).toBe(false);
    }
  });

  it("關卡 4 一定需要跨零借位", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateProblem(4).chainBorrow).toBe(true);
    }
  });

  it("關卡 5 至少需要借位一次", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateProblem(5).borrowCount).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("effectiveTop", () => {
  it("借出會少 1、借入會多 10", () => {
    expect(effectiveTop(5, { lent: 0, got: 0, answer: null })).toBe(5);
    expect(effectiveTop(5, { lent: 1, got: 0, answer: null })).toBe(4);
    expect(effectiveTop(0, { lent: 0, got: 1, answer: null })).toBe(10);
  });
});

describe("needsBorrowFull", () => {
  const p = makeProblem(5432, 1299); // 個位、十位都要借，但不用跨零
  const chain = makeProblem(5002, 1234); // 個位借不到，要一路借過兩個 0

  it("目前位數不夠減時需要借位", () => {
    expect(needsBorrowFull(0, p.aDigits, p.bDigits, freshCols(), 0)).toBe(true);
  });

  it("不需要跨零時，左邊的位不會被要求借位", () => {
    expect(needsBorrowFull(1, p.aDigits, p.bDigits, freshCols(), 0)).toBe(false);
    expect(needsBorrowFull(2, p.aDigits, p.bDigits, freshCols(), 0)).toBe(false);
  });

  it("中間是 0 時，左邊的位也必須先借位", () => {
    const cols = freshCols();
    expect(needsBorrowFull(0, chain.aDigits, chain.bDigits, cols, 0)).toBe(true);
    expect(needsBorrowFull(1, chain.aDigits, chain.bDigits, cols, 0)).toBe(true);
    expect(needsBorrowFull(2, chain.aDigits, chain.bDigits, cols, 0)).toBe(true);
    expect(needsBorrowFull(3, chain.aDigits, chain.bDigits, cols, 0)).toBe(false);
  });

  it("已經借過的位不會再被要求借位", () => {
    const cols = freshCols();
    cols[0].got = 1;
    cols[1].lent = 1;
    expect(needsBorrowFull(0, chain.aDigits, chain.bDigits, cols, 0)).toBe(false);
  });

  it("不會往回要求已經算完的位", () => {
    expect(needsBorrowFull(0, chain.aDigits, chain.bDigits, freshCols(), 2)).toBe(false);
  });
});

describe("starsForMistakes", () => {
  it("依錯誤次數給星", () => {
    expect(starsForMistakes(0)).toBe(3);
    expect(starsForMistakes(2)).toBe(2);
    expect(starsForMistakes(3)).toBe(1);
  });
});
