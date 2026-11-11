"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Mesh } from "three";
import { useReducedMotion } from "framer-motion";

const LAYERS = ["Memory", "Reasoning", "Agents", "Tools", "Policy", "Verification"] as const;

function Rings() {
  const token = useRef<Mesh>(null);
  const radii = useMemo(() => [0.7, 1.05, 1.4, 1.75, 2.1, 2.45], []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (token.current) {
      const r = 1.75;
      token.current.position.x = Math.cos(t * 0.7) * r;
      token.current.position.z = Math.sin(t * 0.7) * r;
      token.current.position.y = Math.sin(t * 1.4) * 0.15;
    }
  });

  return (
    <group rotation={[0.55, 0.4, 0]}>
      {radii.map((r, i) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r, 0.018, 8, 64]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#2EC4B6" : "#C4A574"}
            emissive={i % 2 === 0 ? "#2EC4B6" : "#C4A574"}
            emissiveIntensity={0.2}
            metalness={0.5}
            roughness={0.4}
          />
        </mesh>
      ))}
      <mesh ref={token}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color="#F3EFE6" emissive="#2EC4B6" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

function usePreferCanvas(): boolean {
  const reduce = useReducedMotion();
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return !reduce && wide;
}

export function SignalRouteDiagram() {
  const showCanvas = usePreferCanvas();
  return (
    <section className="mkt-section signal-route" id="signal-route-3d">
      <h2>Control across the systems you already run.</h2>
      <p className="mkt-support">
        Context, agents, tools, policy, verification, and evidence — one governable path.
      </p>
      <div className="signal-frame">
        {showCanvas ? (
          <Canvas
            className="signal-canvas"
            dpr={[1, 1.4]}
            camera={{ position: [0, 2.4, 5.2], fov: 40 }}
            gl={{ antialias: true, alpha: true }}
          >
            <ambientLight intensity={0.4} />
            <directionalLight position={[2, 4, 3]} intensity={1} />
            <Rings />
          </Canvas>
        ) : (
          <div className="signal-fallback" aria-hidden />
        )}
        <ul className="signal-labels">
          {LAYERS.map((label) => (
            <li key={label}>{label}</li>
          ))}
        </ul>
      </div>
      <p className="muted">LUXOR9 Execution — Governed / observable / verifiable</p>
      <p className="muted">KNOW → THINK → ACT → PROVE → LEARN</p>
      <p>
        <a className="capability-link" href="/agents">
          View agents
        </a>
      </p>
    </section>
  );
}
