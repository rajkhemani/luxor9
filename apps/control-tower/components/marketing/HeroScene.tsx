"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { Group, Mesh } from "three";
import { useOptionalMarketingStore } from "./marketing-store";

function Chamber() {
  const group = useRef<Group>(null);
  const spine = useRef<Mesh>(null);
  const store = useOptionalMarketingStore();
  const nodes = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        y: 2.2 - i * 0.85,
        active: false,
        key: i,
      })),
    [],
  );

  useFrame(({ clock, pointer }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.rotation.y = pointer.x * 0.12 + Math.sin(t * 0.15) * 0.04;
    group.current.rotation.x = -pointer.y * 0.06 + 0.18;
    if (spine.current) {
      const progress = store?.routeBroken ? 0 : store?.routeProgress ?? 0.15;
      spine.current.scale.y = 0.35 + progress * 0.9;
    }
  });

  // Match AccountableRoute selection: progress 0..1 across 6 states → light 1..6 nodes.
  const lit = store?.routeBroken
    ? -1
    : Math.min(
        5,
        Math.max(0, Math.round((store?.routeProgress ?? 0) * 5)),
      );

  return (
    <group ref={group} position={[0.4, 0.1, 0]}>
      <mesh ref={spine} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.05, 5.2, 12]} />
        <meshStandardMaterial color="#2EC4B6" emissive="#2EC4B6" emissiveIntensity={0.35} />
      </mesh>
      {[-1.4, 1.4].map((x) => (
        <mesh key={x} position={[x, 0, -0.4]}>
          <boxGeometry args={[0.18, 4.8, 0.18]} />
          <meshStandardMaterial color="#14181F" metalness={0.4} roughness={0.55} />
        </mesh>
      ))}
      {nodes.map((n, i) => (
        <Float key={n.key} speed={1.2} rotationIntensity={0.1} floatIntensity={0.15}>
          <mesh position={[0, n.y, 0.12]}>
            <sphereGeometry args={[0.11, 16, 16]} />
            <meshStandardMaterial
              color={i <= lit && !store?.routeBroken ? "#2EC4B6" : "#8B93A7"}
              emissive={i <= lit && !store?.routeBroken ? "#2EC4B6" : "#000000"}
              emissiveIntensity={i <= lit && !store?.routeBroken ? 0.55 : 0}
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

export function HeroScene() {
  return (
    <div className="hero-scene" aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.2, 5.2], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#0B0D10"]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 4, 2]} intensity={1.1} color="#F3EFE6" />
        <directionalLight position={[-3, -1, -2]} intensity={0.35} color="#2EC4B6" />
        <Chamber />
      </Canvas>
    </div>
  );
}
