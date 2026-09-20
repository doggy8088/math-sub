import { LEVELS, type LevelId } from "../game/logic";
import type { RoundResult } from "./GameScreen";
import Confetti from "../components/Confetti";
import SiteFooter from "../components/SiteFooter";

interface Props {
  level: LevelId;
  results: RoundResult[];
  score: number;
  onReplay: () => void;
  onNext: () => void;
  onHome: () => void;
}

export default function SummaryScreen({ level, results, score, onReplay, onNext, onHome }: Props) {
  const totalStars = results.reduce((s, r) => s + r.stars, 0);
  const maxStars = results.length * 3;
  const levelInfo = LEVELS.find((l) => l.id === level)!;
  const nextLevel = LEVELS.find((l) => l.id === level + 1);
  const ratio = totalStars / maxStars;
  const title = ratio === 1 ? "完美通關！減法大師！" : ratio >= 0.7 ? "太棒了！你越來越厲害！" : "完成挑戰！再練習會更好！";
  const face = ratio === 1 ? "🏆" : ratio >= 0.7 ? "🎉" : "💪";

  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col items-center px-4 py-8">
      {ratio >= 0.7 && <Confetti count={90} />}
      <div className="w-full rounded-3xl bg-white/90 p-6 text-center shadow-2xl ring-4 ring-white/70 animate-[pop_0.4s_ease-out]">
        <div className="text-7xl animate-[wiggle_1s_ease-in-out_infinite]" aria-hidden="true">
          {face}
        </div>
        <h1 className="mt-2 text-3xl font-black text-slate-800">{title}</h1>
        <p className="mt-1 font-bold text-slate-500">
          {levelInfo.emoji} {levelInfo.name} · 完成 {results.length} 題
        </p>

        <div className="mt-5 flex justify-center gap-4">
          <div className="rounded-2xl bg-amber-100 px-6 py-3">
            <div className="text-xs font-black text-amber-700">獲得星星</div>
            <div className="text-3xl font-black text-amber-600">
              ⭐ {totalStars}/{maxStars}
            </div>
          </div>
          <div className="rounded-2xl bg-indigo-100 px-6 py-3">
            <div className="text-xs font-black text-indigo-700">總分</div>
            <div className="text-3xl font-black text-indigo-600">🏆 {score}</div>
          </div>
        </div>

        <div className="mt-6 space-y-2 text-left">
          {results.map((r, i) => (
            <div key={i} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2 ring-2 ring-slate-100">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm font-black text-white">
                  {i + 1}
                </span>
                <span className="text-xl font-black tabular-nums text-slate-700">
                  {r.problem.a} − {r.problem.b} = <span className="text-emerald-600">{r.problem.a - r.problem.b}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                {r.mistakes > 0 && <span className="text-xs font-bold text-rose-400">錯 {r.mistakes} 次</span>}
                <span className="text-lg">
                  {"⭐".repeat(r.stars)}
                  <span className="opacity-20">{"⭐".repeat(3 - r.stars)}</span>
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onReplay}
            className="rounded-2xl bg-indigo-500 px-6 py-3 text-lg font-black text-white shadow-lg hover:bg-indigo-600 active:scale-95"
          >
            🔁 再玩一次
          </button>
          {nextLevel && (
            <button
              type="button"
              onClick={onNext}
              className={`rounded-2xl bg-gradient-to-r ${nextLevel.color} px-6 py-3 text-lg font-black text-white shadow-lg hover:brightness-110 active:scale-95`}
            >
              {nextLevel.emoji} 挑戰下一關
            </button>
          )}
          <button
            type="button"
            onClick={onHome}
            className="rounded-2xl bg-white px-6 py-3 text-lg font-black text-slate-600 shadow-lg ring-2 ring-slate-200 hover:bg-slate-50 active:scale-95"
          >
            🏠 回主選單
          </button>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
