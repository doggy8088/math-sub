import { useState } from "react";
import HomeScreen from "./screens/HomeScreen";
import GameScreen, { type RoundResult } from "./screens/GameScreen";
import SummaryScreen from "./screens/SummaryScreen";
import type { LevelId } from "./game/logic";

type Screen = "home" | "game" | "summary";

const STORAGE_KEY = "subtraction-castle-best";
const MAX_STARS_PER_LEVEL = 15;

/** 讀取本機最佳成績；資料毀損或格式不對時一律回到空狀態。 */
function loadBest(): Record<number, number> {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const best: Record<number, number> = {};
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      const lv = Number(key);
      if (!Number.isInteger(lv) || lv < 1 || lv > 5) continue;
      if (typeof value !== "number" || !Number.isFinite(value)) continue;
      best[lv] = Math.min(MAX_STARS_PER_LEVEL, Math.max(0, Math.round(value)));
    }
    return best;
  } catch {
    return {};
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [level, setLevel] = useState<LevelId>(1);
  const [gameKey, setGameKey] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [score, setScore] = useState(0);
  const [bestStars, setBestStars] = useState<Record<number, number>>(loadBest);

  const startGame = (lv: LevelId) => {
    setLevel(lv);
    setGameKey((k) => k + 1);
    setScreen("game");
  };

  const finishGame = (r: RoundResult[], s: number) => {
    setResults(r);
    setScore(s);
    const stars = r.reduce((sum, x) => sum + x.stars, 0);
    setBestStars((prev) => {
      const next = { ...prev, [level]: Math.max(prev[level] ?? 0, stars) };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    setScreen("summary");
  };

  return (
    <div className="h-full overflow-y-auto lg:overflow-hidden">
      {screen === "home" && <HomeScreen onStart={startGame} bestStars={bestStars} />}
      {screen === "game" && (
        <GameScreen key={gameKey} level={level} onFinish={finishGame} onQuit={() => setScreen("home")} />
      )}
      {screen === "summary" && (
        <SummaryScreen
          level={level}
          results={results}
          score={score}
          onReplay={() => startGame(level)}
          onNext={() => startGame(Math.min(5, level + 1) as LevelId)}
          onHome={() => setScreen("home")}
        />
      )}
    </div>
  );
}
