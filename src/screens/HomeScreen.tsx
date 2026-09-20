import { LEVELS, type LevelId } from "../game/logic";
import { PLACE_COLORS } from "../components/BlockScene";
import SiteFooter from "../components/SiteFooter";

interface Props {
  onStart: (level: LevelId) => void;
  bestStars: Record<number, number>;
}

export default function HomeScreen({ onStart, bestStars }: Props) {
  return (
    <main className="mx-auto flex min-h-full max-w-5xl flex-col items-center px-4 py-8">
      {/* 標題 */}
      <div className="mb-6 text-center">
        <div className="mb-2 flex justify-center gap-2 text-5xl">
          <span className="animate-[float_3s_ease-in-out_infinite]">🧱</span>
          <span className="animate-[float_3s_ease-in-out_infinite_0.3s]">🦉</span>
          <span className="animate-[float_3s_ease-in-out_infinite_0.6s]">🏰</span>
        </div>
        <h1 className="bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-orange-500 bg-clip-text text-4xl font-black text-transparent sm:text-5xl">
          積木王國：4 位數減法大冒險
        </h1>
        <p className="mt-3 text-lg font-bold text-slate-600">
          用 3D 積木看懂「借位」，一起打敗減法大魔王！
        </p>
      </div>

      {/* 積木說明 */}
      <div className="mb-8 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { p: 3, name: "千", shape: "大立方體", icon: "🧊", eq: "1 千 = 10 百" },
          { p: 2, name: "百", shape: "平板", icon: "🟦", eq: "1 百 = 10 十" },
          { p: 1, name: "十", shape: "長條", icon: "📏", eq: "1 十 = 10 個" },
          { p: 0, name: "個", shape: "小方塊", icon: "🎲", eq: "最小的積木" },
        ].map((b) => (
          <div
            key={b.p}
            className="flex items-center gap-3 rounded-2xl bg-white/80 p-3 shadow-md ring-2 ring-white"
          >
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl shadow-inner"
              style={{ background: PLACE_COLORS[b.p] }}
            >
              {b.icon}
            </div>
            <div>
              <div className="font-black text-slate-800">
                {b.name}位 · {b.shape}
              </div>
              <div className="text-xs font-bold text-slate-500">{b.eq}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 關卡 */}
      <h2 className="mb-3 text-2xl font-black text-slate-700">選擇關卡 🗺️</h2>
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LEVELS.map((lv) => {
          const best = bestStars[lv.id] ?? 0;
          return (
            <button
              key={lv.id}
              type="button"
              onClick={() => onStart(lv.id)}
              aria-label={`開始第 ${lv.id} 關：${lv.name}。${lv.desc}。最佳成績 ${best}/15 星`}
              className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${lv.color} p-5 text-left text-white shadow-xl ring-4 ring-white/70 transition-all hover:-translate-y-1 hover:shadow-2xl active:scale-95`}
            >
              <div className="absolute -right-4 -top-4 text-8xl opacity-20 transition-transform group-hover:rotate-12 group-hover:scale-110">
                {lv.emoji}
              </div>
              <div className="relative">
                <div className="text-sm font-black opacity-90">第 {lv.id} 關</div>
                <div className="text-2xl font-black">
                  {lv.emoji} {lv.name}
                </div>
                <div className="mt-1 text-sm font-bold opacity-95">{lv.desc}</div>
                <div className="mt-3 flex items-center gap-1 text-lg">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={best > i * 5 ? "" : "opacity-30 grayscale"}>
                      ⭐
                    </span>
                  ))}
                  <span className="ml-1 text-xs font-bold opacity-90">最佳 {best}/15 星</span>
                </div>
              </div>
            </button>
          );
        })}

        {/* 怎麼玩 */}
        <div className="rounded-3xl bg-white/85 p-5 shadow-xl ring-4 ring-white/70">
          <h2 className="text-xl font-black text-slate-800">怎麼玩？📖</h2>
          <ol className="mt-2 space-y-2 text-sm font-bold text-slate-600">
            <li className="flex gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs text-white">1</span>
              從<b className="text-amber-600">個位</b>開始算，按數字鍵盤填答案（電腦上也可以直接按鍵盤的 0～9）。
            </li>
            <li className="flex gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs text-white">2</span>
              不夠減時，按「<b className="text-rose-600">← 借 1</b>」，看 3D 積木怎麼拆成 10 個！
            </li>
            <li className="flex gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs text-white">3</span>
              用滑鼠或手指拖曳可以旋轉 3D 場景，滾輪可以放大縮小。
            </li>
          </ol>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
