import { PLACE_NAMES, effectiveTop, type ColumnState } from "../game/logic";
import { PLACE_COLORS } from "./BlockScene";
import { cn } from "../utils/cn";

interface Props {
  aDigits: number[];
  bDigits: number[];
  cols: ColumnState[];
  currentCol: number;
  canBorrow: (k: number) => boolean;
  onBorrow: (k: number) => void;
  shakeCol: number | null;
  showThousandsB: boolean;
}

export default function ColumnBoard({
  aDigits,
  bDigits,
  cols,
  currentCol,
  canBorrow,
  onBorrow,
  shakeCol,
  showThousandsB,
}: Props) {
  const places = [3, 2, 1, 0];
  return (
    <div className="rounded-3xl bg-white/90 p-4 shadow-xl ring-4 ring-white/60 backdrop-blur">
      <div className="grid grid-cols-[2.5rem_repeat(4,minmax(0,1fr))] gap-x-1">
        {/* 位值標籤 */}
        <div />
        {places.map((p) => (
          <div key={p} className="flex justify-center pb-1">
            <span
              className={cn(
                "rounded-full px-3 py-0.5 text-sm font-black text-slate-800 transition-all",
                p === currentCol ? "scale-110 ring-4 ring-slate-800/20" : "opacity-70"
              )}
              style={{ background: PLACE_COLORS[p] }}
            >
              {PLACE_NAMES[p]}位
            </span>
          </div>
        ))}

        {/* 借位按鈕列 */}
        <div />
        {places.map((p) => (
          <div key={p} className="relative flex h-10 items-end justify-center">
            {p < 3 && canBorrow(p) && (
              <button
                type="button"
                onClick={() => onBorrow(p)}
                aria-label={`從${PLACE_NAMES[p + 1]}位借 1 到${PLACE_NAMES[p]}位`}
                className="absolute -left-3 bottom-0 z-10 flex animate-bounce items-center gap-0.5 rounded-full bg-gradient-to-r from-rose-500 to-orange-400 px-2.5 py-1 text-xs font-black text-white shadow-lg ring-2 ring-white hover:scale-110 active:scale-95"
                title={`向${PLACE_NAMES[p + 1]}位借 1`}
              >
                ← 借 1
              </button>
            )}
            {cols[p].lent > 0 && (
              <span className="text-2xl font-black leading-none text-rose-500">
                {effectiveTop(aDigits[p], cols[p])}
              </span>
            )}
          </div>
        ))}

        {/* 被減數列 */}
        <div />
        {places.map((p) => (
          <div key={p} className="relative flex h-16 items-center justify-center">
            {cols[p].got > 0 && (
              <span className="absolute left-1 top-0 text-lg font-black text-sky-600 sm:left-3">1</span>
            )}
            <span
              className={cn(
                "text-5xl font-black tabular-nums transition-all",
                cols[p].lent > 0 ? "text-slate-300 line-through decoration-rose-500 decoration-4" : "text-slate-800",
                p === currentCol && "drop-shadow-[0_2px_0_rgba(0,0,0,0.15)]"
              )}
            >
              {aDigits[p]}
            </span>
            {cols[p].got > 0 && (
              <span className="absolute -bottom-1 rounded-full bg-sky-100 px-2 text-xs font-black text-sky-700">
                = {effectiveTop(aDigits[p], cols[p])}
              </span>
            )}
          </div>
        ))}

        {/* 減數列 */}
        <div className="flex h-16 items-center justify-center text-4xl font-black text-slate-500">−</div>
        {places.map((p) => (
          <div key={p} className="flex h-16 items-center justify-center text-5xl font-black tabular-nums text-slate-800">
            {p === 3 && !showThousandsB ? "" : bDigits[p]}
          </div>
        ))}

        {/* 橫線 */}
        <div className="col-span-5 my-1 h-1.5 rounded-full bg-slate-800" />

        {/* 答案列 */}
        <div />
        {places.map((p) => {
          const c = cols[p];
          const isCurrent = p === currentCol;
          return (
            <div key={p} className="flex h-16 items-center justify-center">
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl border-4 text-4xl font-black tabular-nums transition-all",
                  c.answer !== null
                    ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                    : isCurrent
                    ? "animate-pulse border-amber-400 bg-amber-50 text-amber-400"
                    : "border-dashed border-slate-200 text-slate-300",
                  shakeCol === p && "animate-[shake_0.4s_ease-in-out] border-rose-400 bg-rose-50"
                )}
              >
                {c.answer !== null ? c.answer : isCurrent ? "?" : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
