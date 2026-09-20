// 簡易音效：使用 Web Audio API 合成，不需外部檔案
let ctx: AudioContext | null = null;
const MUTE_KEY = "subtraction-castle-muted";

function loadMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

let muted = loadMuted();

export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem(MUTE_KEY, m ? "1" : "0");
  } catch {
    /* 無痕模式等無法寫入時，至少記在記憶體裡 */
  }
}
export function isMuted() {
  return muted;
}

function getCtx() {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => {
        /* 瀏覽器尚未允許播放時，安靜地略過 */
      });
    }
    return ctx;
  } catch (err) {
    console.warn("音效無法啟動，遊戲會以靜音繼續。", err);
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.18) {
  const c = getCtx();
  if (!c || muted) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime + start);
  g.gain.setValueAtTime(0, c.currentTime + start);
  g.gain.linearRampToValueAtTime(vol, c.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + start);
  o.stop(c.currentTime + start + dur + 0.05);
}

export const sfx = {
  tap() {
    tone(660, 0, 0.08, "triangle", 0.1);
  },
  correct() {
    tone(523.25, 0, 0.15, "triangle");
    tone(659.25, 0.1, 0.15, "triangle");
    tone(783.99, 0.2, 0.25, "triangle");
  },
  wrong() {
    tone(220, 0, 0.2, "sawtooth", 0.08);
    tone(180, 0.15, 0.25, "sawtooth", 0.08);
  },
  borrow() {
    // 像積木「啪」一聲拆開的聲音
    tone(880, 0, 0.06, "square", 0.06);
    tone(1174, 0.06, 0.08, "square", 0.06);
    tone(1568, 0.12, 0.12, "square", 0.06);
  },
  win() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5];
    notes.forEach((n, i) => tone(n, i * 0.11, 0.22, "triangle", 0.16));
  },
};
