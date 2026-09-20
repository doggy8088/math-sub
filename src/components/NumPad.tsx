import { cn } from "../utils/cn";

interface Props {
  onDigit: (d: number) => void;
  disabled?: boolean;
  hint?: number | null; // 提示答案時高亮該按鍵
}

export default function NumPad({ onDigit, disabled, hint }: Props) {
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
  return (
    <div
      className="grid grid-cols-5 gap-2"
      role="group"
      aria-label="答案數字鍵盤，也可以用實體鍵盤的數字鍵作答"
    >
      {digits.map((d) => (
        <button
          key={d}
          type="button"
          disabled={disabled}
          onClick={() => onDigit(d)}
          aria-label={hint === d ? `輸入 ${d}（提示答案）` : `輸入 ${d}`}
          className={cn(
            "h-14 rounded-2xl border-b-4 text-2xl font-black transition-all active:translate-y-1 active:border-b-0 disabled:opacity-40",
            hint === d
              ? "animate-bounce border-emerald-600 bg-emerald-400 text-white"
              : "border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50"
          )}
        >
          {d}
        </button>
      ))}
    </div>
  );
}
