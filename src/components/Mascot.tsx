export type Mood = "happy" | "think" | "sad" | "party";

const FACE: Record<Mood, string> = {
  happy: "🦉",
  think: "🤔",
  sad: "😅",
  party: "🥳",
};

export default function Mascot({ mood, message, compact }: { mood: Mood; message: string; compact?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-orange-300 shadow-lg ring-4 ring-white ${
          compact ? "h-12 w-12 text-2xl" : "h-16 w-16 text-4xl"
        } ${mood === "party" ? "animate-bounce" : "animate-[float_3s_ease-in-out_infinite]"}`}
      >
        {FACE[mood]}
      </div>
      <div
        role="status"
        aria-live="polite"
        className="relative flex-1 rounded-2xl rounded-tl-none bg-white px-4 py-3 text-base font-bold leading-snug text-slate-700 shadow-lg ring-2 ring-amber-200"
      >
        <span className="absolute -left-2 top-0 h-0 w-0 border-b-[10px] border-r-[10px] border-b-transparent border-r-white" />
        <span className="mr-1 text-xs font-black text-amber-500">貓頭鷹博士：</span>
        <span key={message} className="inline-block animate-[pop_0.25s_ease-out]">
          {message}
        </span>
      </div>
    </div>
  );
}
