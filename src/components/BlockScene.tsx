import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useReducedMotion } from "../utils/useReducedMotion";

/* ================= 材質：帶格線的積木表面 ================= */
const textureCache = new Map<string, THREE.CanvasTexture>();
function gridTexture(u: number, v: number) {
  const key = `${u}x${v}`;
  const cached = textureCache.get(key);
  if (cached) return cached;
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, size, size);
  g.strokeStyle = "rgba(0,0,0,0.28)";
  g.lineWidth = 6;
  g.strokeRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(u, v);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

const materialCache = new Map<string, THREE.MeshStandardMaterial[]>();
function gridMaterials(color: string, w: number, h: number, d: number) {
  const key = `${color}-${w}-${h}-${d}`;
  const cached = materialCache.get(key);
  if (cached) return cached;
  const make = (u: number, v: number) =>
    new THREE.MeshStandardMaterial({ color, map: gridTexture(u, v), roughness: 0.45, metalness: 0.05 });
  // BoxGeometry 面順序：+x, -x, +y, -y, +z, -z
  const mats = [make(d, h), make(d, h), make(w, d), make(w, d), make(w, h), make(w, h)];
  materialCache.set(key, mats);
  return mats;
}

/* ================= 位值設定 ================= */
export const PLACE_COLORS = ["#facc15", "#4ade80", "#60a5fa", "#c084fc"]; // 個 十 百 千
const PLACE_LABEL = ["個", "十", "百", "千"];

interface PlaceConfig {
  size: [number, number, number];
  pos: (i: number) => [number, number, number];
  labelPos: [number, number, number];
  ringPos: [number, number, number];
  ringR: number;
}

const CONFIG: PlaceConfig[] = [
  // 個位：小方塊，一排 10 個
  {
    size: [1, 1, 1],
    pos: (i) => [4 + (i % 10) * 1.4, 0.5, 14 - Math.floor(i / 10) * 1.8],
    labelPos: [10.5, 5, 13],
    ringPos: [10.3, 0.02, 13.2],
    ringR: 8.5,
  },
  // 十位：長條 1x10x1
  {
    size: [1, 10, 1],
    pos: (i) => [-22 + (i % 10) * 1.8, 5, 14 - Math.floor(i / 10) * 3],
    labelPos: [-14, 13.5, 12.5],
    ringPos: [-14, 0.02, 12.5],
    ringR: 10,
  },
  // 百位：平板 1x10x10
  {
    size: [1, 10, 10],
    pos: (i) => [14 + (i % 10) * 2.2, 5, -14 - Math.floor(i / 10) * 13],
    labelPos: [24, 14, -18],
    ringPos: [24, 0.02, -20],
    ringR: 13,
  },
  // 千位：大立方 10x10x10，3x3 排列
  {
    size: [10, 10, 10],
    pos: (i) => [-32 + (i % 3) * 12.5, 5, -12 - Math.floor(i / 3) * 12.5],
    labelPos: [-19.5, 15, -22],
    ringPos: [-19.5, 0.02, -24.5],
    ringR: 19,
  },
];

/* ================= 單一積木（帶縮放動畫） ================= */
function Block({
  position,
  size,
  materials,
  leaving,
  delay,
  onGone,
}: {
  position: [number, number, number];
  size: [number, number, number];
  materials: THREE.Material[];
  leaving: boolean;
  delay: number;
  onGone: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const scale = useRef(0);
  const born = useRef(performance.now() + delay);
  const gone = useRef(false);
  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    const target = leaving ? 0 : performance.now() < born.current ? 0 : 1;
    scale.current = THREE.MathUtils.damp(scale.current, target, 9, dt);
    const s = Math.max(0.0001, scale.current);
    m.scale.setScalar(s);
    // 出現時帶一點跳躍
    m.position.y = position[1] + (leaving ? (1 - s) * 3 : 0);
    if (leaving && s < 0.03 && !gone.current) {
      gone.current = true;
      onGone();
    }
  });
  return (
    <mesh ref={ref} position={position} material={materials} castShadow receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  );
}

/* ================= 一個位值的積木群 ================= */
function PlaceGroup({
  place,
  count,
  active,
  still,
}: {
  place: number;
  count: number;
  active: boolean;
  still: boolean;
}) {
  const cfg = CONFIG[place];
  const materials = useMemo(() => gridMaterials(PLACE_COLORS[place], ...cfg.size), [place, cfg.size]);
  const [rendered, setRendered] = useState(count);
  const countRef = useRef(count);
  const prevCount = useRef(count);
  const [bump, setBump] = useState(0);

  useEffect(() => {
    countRef.current = count;
    if (count > prevCount.current) setRendered((r) => Math.max(r, count));
    if (count !== prevCount.current) setBump((b) => b + 1);
    prevCount.current = count;
  }, [count]);

  const handleGone = useCallback(() => {
    setRendered((r) => Math.max(countRef.current, r - 1));
  }, []);

  const blocks = [];
  for (let i = 0; i < rendered; i++) {
    blocks.push(
      <Block
        key={`${place}-${i}`}
        position={cfg.pos(i)}
        size={cfg.size}
        materials={materials}
        leaving={i >= count}
        delay={(i % 10) * 45}
        onGone={handleGone}
      />
    );
  }

  return (
    <group>
      {blocks}
      {active && <PulseRing position={cfg.ringPos} radius={cfg.ringR} color={PLACE_COLORS[place]} still={still} />}
      <Html position={cfg.labelPos} center zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
        <div
          key={bump}
          className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-black text-white shadow-lg whitespace-nowrap select-none animate-[bump_0.5s_ease-out] ${
            active ? "ring-4 ring-white/80 scale-110" : "opacity-80"
          }`}
          style={{ background: PLACE_COLORS[place] }}
        >
          <span className="text-slate-900">{PLACE_LABEL[place]}位</span>
          <span className="rounded-full bg-slate-900/80 px-2 text-white">{count}</span>
        </div>
      </Html>
    </group>
  );
}

/* ================= 地面上的閃爍光圈 ================= */
function PulseRing({
  position,
  radius,
  color,
  still,
}: {
  position: [number, number, number];
  radius: number;
  color: string;
  still: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m || still) return;
    const t = clock.getElapsedTime();
    const s = 1 + Math.sin(t * 3) * 0.06;
    m.scale.set(s, s, s);
    (m.material as THREE.MeshBasicMaterial).opacity = 0.45 + Math.sin(t * 3) * 0.2;
  });
  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 0.9, radius, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ================= 裝飾：小樹與雲 ================= */
function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.7, 3, 8]} />
        <meshStandardMaterial color="#a16207" />
      </mesh>
      <mesh position={[0, 5, 0]} castShadow>
        <coneGeometry args={[3, 6, 8]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
      <mesh position={[0, 8.5, 0]} castShadow>
        <coneGeometry args={[2.2, 4.5, 8]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
    </group>
  );
}

function Cloud({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const offset = useMemo(() => Math.random() * 100, []);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.x = position[0] + Math.sin(clock.getElapsedTime() * 0.15 + offset) * 4;
  });
  return (
    <group ref={ref} position={position}>
      {[
        [0, 0, 0, 3],
        [3, 0.5, 0, 2.4],
        [-3, 0.3, 0, 2.2],
        [1, 1.5, 0, 2],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[r, 16, 16]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  );
}

/* ================= 鏡頭導演 ================= */
export type Focus = 0 | 1 | 2 | 3 | "all";

const PRESETS: Record<string, { pos: [number, number, number]; target: [number, number, number] }> = {
  all: { pos: [0, 48, 78], target: [0, 4, -2] },
  0: { pos: [10, 16, 40], target: [10, 1, 13] },
  1: { pos: [-14, 18, 44], target: [-14, 4, 12] },
  2: { pos: [24, 22, 22], target: [24, 5, -18] },
  3: { pos: [-20, 28, 26], target: [-20, 5, -22] },
};

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function CameraRig({ focus, instant }: { focus: Focus; instant: boolean }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const anim = useRef<{
    from: THREE.Vector3;
    fromT: THREE.Vector3;
    to: THREE.Vector3;
    toT: THREE.Vector3;
    t: number;
  } | null>(null);

  useEffect(() => {
    const p = PRESETS[String(focus)];
    if (!p || !controls.current) return;
    if (instant) {
      // 減少動態效果：直接跳到位，不做鏡頭飛行
      camera.position.set(...p.pos);
      controls.current.target.set(...p.target);
      controls.current.update();
      anim.current = null;
      return;
    }
    anim.current = {
      from: camera.position.clone(),
      fromT: controls.current.target.clone(),
      to: new THREE.Vector3(...p.pos),
      toT: new THREE.Vector3(...p.target),
      t: 0,
    };
  }, [focus, camera, instant]);

  useFrame((_, dt) => {
    const a = anim.current;
    const c = controls.current;
    if (!a || !c || instant) return;
    a.t = Math.min(1, a.t + dt / 1.3);
    const e = easeInOut(a.t);
    camera.position.lerpVectors(a.from, a.to, e);
    c.target.lerpVectors(a.fromT, a.toT, e);
    c.update();
    if (a.t >= 1) anim.current = null;
  });

  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      minDistance={12}
      maxDistance={140}
      maxPolarAngle={Math.PI / 2 - 0.08}
      onStart={() => {
        anim.current = null;
      }}
    />
  );
}

/* ================= 主場景 ================= */
export interface BlockSceneProps {
  counts: number[]; // [個, 十, 百, 千] 目前的積木數量
  activePlace: number | null;
  focus: Focus;
}

export default function BlockScene({ counts, activePlace, focus }: BlockSceneProps) {
  const reducedMotion = useReducedMotion();
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.5]}
      camera={{ position: [0, 48, 78], fov: 42, near: 0.5, far: 400 }}
      style={{ background: "linear-gradient(180deg,#bae6fd 0%,#e0f2fe 45%,#dcfce7 100%)" }}
    >
      <ambientLight intensity={0.75} />
      {/* 1024 就很夠這種大色塊風格用，比 2048 少 3/4 的陰影貼圖成本（行動裝置很有感） */}
      <directionalLight
        position={[30, 50, 20]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-far={160}
      />
      <hemisphereLight args={["#ffffff", "#86efac", 0.4]} />

      {/* 地面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[90, 64]} />
        <meshStandardMaterial color="#a7f3d0" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[91, 64]} />
        <meshStandardMaterial color="#6ee7b7" />
      </mesh>

      {/* 裝飾 */}
      <Tree position={[-62, 0, 10]} scale={1.3} />
      <Tree position={[58, 0, 12]} scale={1.1} />
      <Tree position={[-50, 0, -50]} scale={1.6} />
      <Tree position={[55, 0, -45]} scale={1.4} />
      <Tree position={[0, 0, -60]} scale={1.2} />
      <Cloud position={[-30, 40, -60]} />
      <Cloud position={[35, 46, -70]} />
      <Cloud position={[0, 44, -90]} />

      {[3, 2, 1, 0].map((p) => (
        <PlaceGroup key={p} place={p} count={counts[p]} active={activePlace === p} still={reducedMotion} />
      ))}

      <CameraRig focus={focus} instant={reducedMotion} />
    </Canvas>
  );
}
