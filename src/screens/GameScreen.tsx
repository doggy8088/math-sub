import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BlockScene, { PLACE_COLORS, type Focus } from "../components/BlockScene";
import ColumnBoard from "../components/ColumnBoard";
import NumPad from "../components/NumPad";
import Mascot, { type Mood } from "../components/Mascot";
import Confetti from "../components/Confetti";
import {
  ENCOURAGE,
  LEVELS,
  PLACE_FULL,
  PLACE_NAMES,
  PRAISES,
  effectiveTop,
  generateProblem,
  needsBorrowFull,
  pick,
  starsForMistakes,
  type ColumnState,
  type LevelId,
  type Problem,
} from "../game/logic";
import { isMuted, setMuted, sfx } from "../game/sound";

export const QUESTIONS_PER_ROUND = 5;

export interface RoundResult {
  problem: Problem;
  stars: number;
  mistakes: number;
}

interface Props {
  level: LevelId;
  onFinish: (results: RoundResult[], score: number) => void;
  onQuit: () => void;
}

const freshCols = (): ColumnState[] => Array.from({ length: 4 }, () => ({ lent: 0, got: 0, answer: null }));

export default function GameScreen({ level, onFinish, onQuit }: Props) {
  const [qIndex, setQIndex] = useState(0);
  const [problem, setProblem] = useState<Problem>(() => generateProblem(level));
  const [cols, setCols] = useState<ColumnState[]>(freshCols);
  const [currentCol, setCurrentCol] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [colMistakes, setColMistakes] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [message, setMessage] = useState("我們從個位開始算！看看個位的積木夠不夠減？");
  const [mood, setMood] = useState<Mood>("happy");
  const [shakeCol, setShakeCol] = useState<number | null>(null);
  const [focus, setFocus] = useState<Focus>("all");
  const [celebrating, setCelebrating] = useState(false);
  const [muted, setMutedState] = useState(isMuted());
  const [showHelp, setShowHelp] = useState(false);
  const timer = useRef<number | null>(null);
  const helpButtonRef = useRef<HTMLButtonElement>(null);
  const helpCloseRef = useRef<HTMLButtonElement>(null);
  const wasHelpOpen = useRef(false);

  const { aDigits, bDigits } = problem;
  const levelInfo = LEVELS.find((l) => l.id === level)!;

  // 一開始先看全景，再聚焦個位
  useEffect(() => {
    const t = window.setTimeout(() => setFocus(0), 1400);
    return () => window.clearTimeout(t);
  }, [problem]);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  // 3D 積木數量：目前的有效值，減掉已經完成的減數
  const counts = useMemo(
    () =>
      [0, 1, 2, 3].map((p) => {
        const top = effectiveTop(aDigits[p], cols[p]);
        return cols[p].answer !== null ? top - bDigits[p] : top;
      }),
    [aDigits, bDigits, cols]
  );

  const canBorrow = useCallback(
    (k: number) => {
      if (celebrating || currentCol > 3) return false;
      if (k > 2 || cols[k].answer !== null) return false;
      return needsBorrowFull(k, aDigits, bDigits, cols, currentCol);
    },
    [aDigits, bDigits, cols, currentCol, celebrating]
  );

  const triggerShake = (k: number) => {
    setShakeCol(k);
    window.setTimeout(() => setShakeCol(null), 450);
  };

  const handleBorrow = (k: number) => {
    if (!canBorrow(k)) return;
    const from = k + 1;
    const fromTop = effectiveTop(aDigits[from], cols[from]);
    if (fromTop === 0) {
      sfx.wrong();
      setMood("think");
      setFocus(from as Focus);
      setMessage(
        `${PLACE_FULL[from]}是 0，一個積木都沒有，沒辦法借！要先請${PLACE_FULL[from]}向${PLACE_FULL[from + 1]}借 1。`
      );
      return;
    }
    sfx.borrow();
    const next = cols.map((c) => ({ ...c }));
    next[from].lent += 1;
    next[k].got += 1;
    setCols(next);
    setFocus(k as Focus);
    setMood("happy");
    const nowTop = effectiveTop(aDigits[k], next[k]);
    setMessage(
      `${PLACE_FULL[from]}借 1 給${PLACE_FULL[k]}：1 個「${PLACE_NAMES[from]}」拆成 10 個「${PLACE_NAMES[k]}」！${PLACE_FULL[k]}現在有 ${nowTop} 個。` +
        (k === currentCol ? `算算看 ${nowTop} − ${bDigits[k]} 是多少？` : `接著繼續幫${PLACE_FULL[k - 1]}借位吧！`)
    );
  };

  const finishQuestion = (colPoints: number) => {
    setCelebrating(true);
    setFocus("all");
    setMood("party");
    sfx.win();
    const stars = starsForMistakes(mistakes);
    const bonus = stars * 20;
    setScore((s) => s + bonus);
    const finalScore = score + colPoints + bonus;
    setMessage(
      `${pick(PRAISES)} ${problem.a} − ${problem.b} = ${problem.a - problem.b}！獲得 ${"⭐".repeat(stars)}`
    );
    const newResults = [...results, { problem, stars, mistakes }];
    setResults(newResults);
    timer.current = window.setTimeout(() => {
      if (qIndex + 1 >= QUESTIONS_PER_ROUND) {
        onFinish(newResults, finalScore);
      } else {
        setQIndex((i) => i + 1);
        setProblem(generateProblem(level));
        setCols(freshCols());
        setCurrentCol(0);
        setMistakes(0);
        setColMistakes(0);
        setCelebrating(false);
        setMood("happy");
        setMessage("新的題目來了！一樣從個位開始，看看夠不夠減？");
      }
    }, 3200);
  };

  const handleDigit = (d: number) => {
    if (celebrating || currentCol > 3) return;
    sfx.tap();
    const k = currentCol;
    const top = effectiveTop(aDigits[k], cols[k]);
    const bottom = bDigits[k];

    if (top < bottom) {
      sfx.wrong();
      triggerShake(k);
      setMood("think");
      setMessage(
        `${PLACE_FULL[k]}只有 ${top} 個，比 ${bottom} 小，不夠減！先按「← 借 1」向${PLACE_FULL[k + 1]}借吧。`
      );
      return;
    }

    const correct = top - bottom;
    if (d === correct) {
      sfx.correct();
      const next = cols.map((c) => ({ ...c }));
      next[k].answer = d;
      setCols(next);
      const colPoints = colMistakes === 0 ? 10 : 5;
      setScore((s) => s + colPoints);
      setColMistakes(0);
      if (k === 3) {
        // 全部完成
        setCurrentCol(4);
        window.setTimeout(() => finishQuestion(colPoints), 300);
      } else {
        setCurrentCol(k + 1);
        setFocus((k + 1) as Focus);
        setMood("happy");
        const nk = k + 1;
        const ntop = effectiveTop(aDigits[nk], next[nk]);
        const nb = bDigits[nk];
        setMessage(
          `${PLACE_FULL[k]}答對了！${top} − ${bottom} = ${correct}。` +
            (ntop < nb
              ? `接著看${PLACE_FULL[nk]}：${ntop} 比 ${nb} 小，不夠減喔，需要借位！`
              : `接著看${PLACE_FULL[nk]}：${ntop} − ${nb} 是多少？`)
        );
      }
    } else {
      sfx.wrong();
      triggerShake(k);
      setMistakes((m) => m + 1);
      const cm = colMistakes + 1;
      setColMistakes(cm);
      setMood("sad");
      if (cm >= 3) {
        setMessage(
          `${pick(ENCOURAGE)} 提示：${PLACE_FULL[k]}有 ${top} 個積木，拿走 ${bottom} 個，剩下 ${correct} 個。按看看 ${correct}！`
        );
      } else {
        setMessage(
          `${pick(ENCOURAGE)} 看 3D 積木：${PLACE_FULL[k]}有 ${top} 個，要拿走 ${bottom} 個，還剩幾個呢？`
        );
      }
    }
  };

  const hintDigit =
    colMistakes >= 3 && currentCol <= 3
      ? effectiveTop(aDigits[currentCol], cols[currentCol]) - bDigits[currentCol]
      : null;

  // 實體鍵盤：數字鍵直接作答、Esc 關閉說明視窗
  const keyState = useRef({ handleDigit, showHelp });
  useEffect(() => {
    keyState.current = { handleDigit, showHelp };
  });
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const { handleDigit: onDigit, showHelp: helpOpen } = keyState.current;
      if (helpOpen) {
        if (e.key === "Escape") setShowHelp(false);
        return;
      }
      if (e.key.length === 1 && e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        onDigit(Number(e.key));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // 說明視窗的焦點管理：開啟時移到關閉鈕，關閉後回到「？」鈕
  useEffect(() => {
    if (showHelp) {
      wasHelpOpen.current = true;
      helpCloseRef.current?.focus();
    } else if (wasHelpOpen.current) {
      wasHelpOpen.current = false;
      helpButtonRef.current?.focus();
    }
  }, [showHelp]);

  const toggleMute = () => {
    const m = !muted;
    setMuted(m);
    setMutedState(m);
  };

  const currentTop = currentCol <= 3 ? effectiveTop(aDigits[currentCol], cols[currentCol]) : 0;

  return (
    <div className="flex h-full flex-col">
      {celebrating && <Confetti />}
      <h1 className="sr-only">
        積木王國：4 位數減法大冒險 — {levelInfo.name}（第 {qIndex + 1} 題）
      </h1>

      {/* 頂部列 */}
      <header className="flex items-center justify-between gap-2 px-3 py-2 sm:px-5">
        <button
          type="button"
          onClick={onQuit}
          className="rounded-full bg-white/80 px-3 py-1.5 text-sm font-black text-slate-600 shadow hover:bg-white"
        >
          ← 回主選單
        </button>
        <div className="flex items-center gap-2">
          <span className={`hidden rounded-full bg-gradient-to-r ${levelInfo.color} px-3 py-1 text-sm font-black text-white shadow sm:inline`}>
            {levelInfo.emoji} {levelInfo.name}
          </span>
          <div className="flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 shadow">
            <span aria-hidden="true" className="flex items-center gap-1">
              {Array.from({ length: QUESTIONS_PER_ROUND }, (_, i) => (
                <span
                  key={i}
                  className={`h-3 w-3 rounded-full ${
                    i < results.length ? "bg-emerald-400" : i === qIndex ? "animate-pulse bg-amber-400" : "bg-slate-200"
                  }`}
                />
              ))}
            </span>
            <span className="ml-1 text-xs font-black text-slate-600">
              第 {qIndex + 1}/{QUESTIONS_PER_ROUND} 題
            </span>
          </div>
          <span
            aria-label={`目前分數 ${score} 分`}
            className="rounded-full bg-amber-400 px-3 py-1 text-sm font-black text-amber-900 shadow"
          >
            <span aria-hidden="true">🏆</span> {score}
          </span>
          <button
            type="button"
            onClick={toggleMute}
            aria-pressed={muted}
            aria-label={muted ? "音效已關閉，點一下開啟音效" : "音效開啟中，點一下關閉音效"}
            className="rounded-full bg-white/80 px-2.5 py-1 text-sm shadow hover:bg-white"
            title={muted ? "開啟音效" : "關閉音效"}
          >
            <span aria-hidden="true">{muted ? "🔇" : "🔊"}</span>
          </button>
          <button
            type="button"
            ref={helpButtonRef}
            onClick={() => setShowHelp(true)}
            aria-label="玩法說明"
            className="rounded-full bg-white/80 px-2.5 py-1 text-sm font-black text-indigo-600 shadow hover:bg-white"
          >
            ？
          </button>
        </div>
      </header>

      {/* 主要區域 */}
      <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 px-3 pb-3 sm:px-5 lg:grid-cols-5 lg:grid-rows-[minmax(0,1fr)] lg:overflow-hidden">
        {/* 3D 場景 */}
        <div className="relative h-[42vh] overflow-hidden rounded-3xl shadow-2xl ring-4 ring-white/70 lg:col-span-3 lg:h-auto">
          <BlockScene counts={counts} activePlace={currentCol <= 3 ? currentCol : null} focus={focus} />
          {/* 鏡頭按鈕 */}
          <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFocus("all")}
              aria-pressed={focus === "all"}
              aria-label="切換到全景視角"
              className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-700 shadow hover:bg-white"
            >
              🔭 全景
            </button>
            {[3, 2, 1, 0].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setFocus(p as Focus)}
                aria-pressed={focus === p}
                aria-label={`切換到${PLACE_FULL[p]}視角`}
                className="rounded-full px-3 py-1 text-xs font-black text-slate-800 shadow ring-2 ring-white/80 hover:scale-105"
                style={{ background: PLACE_COLORS[p] }}
              >
                {PLACE_NAMES[p]}位
              </button>
            ))}
          </div>
          <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-full bg-slate-900/60 px-3 py-1 text-xs font-bold text-white">
            🖱️ 拖曳旋轉 · 滾輪縮放
          </div>
          {/* 目前算式泡泡 */}
          {currentCol <= 3 && !celebrating && (
            <div
              key={`${currentCol}-${currentTop}`}
              className="absolute bottom-3 right-3 z-10 rounded-2xl bg-white/95 px-4 py-2 animate-[pop_0.3s_ease-out]"
              style={{ boxShadow: `0 0 0 4px ${PLACE_COLORS[currentCol]}, 0 10px 25px rgba(0,0,0,0.2)` }}
            >
              <div className="text-xs font-black text-slate-500">{PLACE_FULL[currentCol]}</div>
              <div className="text-2xl font-black text-slate-800">
                {currentTop} − {bDigits[currentCol]} = <span className="text-amber-500">?</span>
              </div>
            </div>
          )}
        </div>

        {/* 右側面板 */}
        <div className="flex flex-col gap-3 lg:col-span-2 lg:overflow-y-auto">
          <Mascot mood={mood} message={message} />
          <ColumnBoard
            aDigits={aDigits}
            bDigits={bDigits}
            cols={cols}
            currentCol={currentCol}
            canBorrow={canBorrow}
            onBorrow={handleBorrow}
            shakeCol={shakeCol}
            showThousandsB={problem.b >= 1000}
          />
          <div className="rounded-3xl bg-indigo-100/80 p-3 shadow-lg ring-4 ring-white/60">
            <div className="mb-2 flex items-center justify-between text-sm font-black text-indigo-800">
              <span>
                {currentCol <= 3 ? `請填${PLACE_FULL[currentCol]}的答案` : "全部完成！"}
              </span>
              {mistakes > 0 && <span className="text-rose-500">錯誤 {mistakes} 次</span>}
            </div>
            <NumPad onDigit={handleDigit} disabled={celebrating || currentCol > 3} hint={hintDigit} />
          </div>
        </div>
      </main>

      {/* 說明視窗 */}
      {showHelp && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setShowHelp(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            className="max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-[pop_0.25s_ease-out]"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setShowHelp(false);
              // 視窗裡只有一個按鈕，把 Tab 焦點留在視窗內
              if (e.key === "Tab") {
                e.preventDefault();
                helpCloseRef.current?.focus();
              }
            }}
          >
            <h2 id="help-title" className="text-2xl font-black text-slate-800">
              借位小秘訣 💡
            </h2>
            <ul className="mt-3 space-y-2 text-sm font-bold text-slate-600">
              <li>1️⃣ 從<b className="text-amber-600">個位</b>開始，往左一位一位算。</li>
              <li>2️⃣ 上面的數字比下面小 → <b className="text-rose-600">不夠減</b>，要向左邊借 1。</li>
              <li>3️⃣ 借 1 之後：左邊少 1，自己多 10（1 個十 = 10 個一）。</li>
              <li>4️⃣ 如果左邊是 <b>0</b>，它自己也要先向更左邊借！</li>
              <li>5️⃣ 3D 積木會即時顯示每一位還有幾個，數一數就知道答案。</li>
            </ul>
            <button
              type="button"
              ref={helpCloseRef}
              onClick={() => setShowHelp(false)}
              className="mt-5 w-full rounded-2xl bg-indigo-500 py-3 text-lg font-black text-white shadow hover:bg-indigo-600"
            >
              我知道了！
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
