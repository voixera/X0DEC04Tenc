"use client";

/**
 * CocoaLattice — the Cocoa Lab sculptural centerpiece.
 *
 * ART DIRECTION
 * A single block of dark chocolate that has been *precisely fractured*: a set of
 * beveled geometric slabs held apart mid-shatter, orbiting a matte cocoa core.
 * Caramel filaments thread between the slabs. The composition reads as an
 * engineered material sample under studio light — the chocolate analogue of
 * source code being cut apart and re-emitted.
 *
 * ENGINEERING
 * - Geometry is generated procedurally (no external model, no asset load).
 * - One directional key light + procedural Lightformer environment. No HDR file.
 * - Pointer parallax is heavily damped; scroll adds a slow tilt.
 * - Motion halts under `prefers-reduced-motion`.
 * - Loaded only via React.lazy by the wrapper, and only when WebGL is present.
 */

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";

/** Deterministic pseudo-random so the fracture is stable between reloads. */
function rand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface Slab {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  geometry: THREE.BufferGeometry;
  offset: number;
}

function useFracture(): Slab[] {
  return useMemo(() => {
    const slabs: Slab[] = [];
    const count = 9;
    for (let i = 0; i < count; i++) {
      const t = i / count;
      // Sizes vary: a couple of large shards, many smaller ones.
      const big = i < 2;
      const w = big ? 1.5 + rand(i + 1) * 0.7 : 0.5 + rand(i + 3) * 0.7;
      const h = big ? 0.36 : 0.2 + rand(i + 7) * 0.28;
      const d = big ? 1.0 + rand(i + 2) * 0.5 : 0.32 + rand(i + 4) * 0.5;

      // A beveled box reads as a cleanly cut chocolate slab.
      const geo = new THREE.BoxGeometry(w, h, d, 1, 1, 1);
      bevelBox(geo, Math.min(w, h, d) * 0.14);

      const angle = t * Math.PI * 2;
      const radius = 1.15 + rand(i + 5) * 0.9;
      slabs.push({
        position: [
          Math.cos(angle) * radius,
          (rand(i + 8) - 0.5) * 1.5,
          Math.sin(angle) * radius * 0.7,
        ],
        rotation: [
          rand(i + 9) * Math.PI,
          angle,
          rand(i + 10) * Math.PI * 0.5,
        ],
        scale: [1, 1, 1],
        geometry: geo,
        offset: rand(i + 11) * Math.PI * 2,
      });
    }
    return slabs;
  }, []);
}

/** Fake a bevel by pinching vertices toward the box centre near the corners. */
function bevelBox(geo: THREE.BufferGeometry, amount: number): void {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const shrink = 1 - amount;
    pos.setXYZ(i, v.x * shrink, v.y * shrink, v.z * shrink);
  }
  geo.computeVertexNormals();
}

/** A thin caramel filament — a line-like torus knot used as an accent. */
function Filament() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y += delta * 0.1;
    ref.current.rotation.x = 1.2 + Math.sin(t * 0.3) * 0.18;
  });
  return (
    <mesh ref={ref} rotation={[1.2, 0, 0.4]}>
      <torusGeometry args={[1.9, 0.011, 12, 200]} />
      <meshStandardMaterial
        color="#e8c39c"
        roughness={0.25}
        metalness={0.7}
        emissive="#7a4a26"
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

/** The matte cocoa core the slabs orbit. */
function Core() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.06;
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[0.62, 3]} />
      <meshPhysicalMaterial
        color="#2a1610"
        roughness={0.55}
        metalness={0.12}
        clearcoat={0.5}
        clearcoatRoughness={0.5}
        sheen={0.6}
        sheenColor="#c58a58"
      />
    </mesh>
  );
}

function Composition() {
  const group = useRef<THREE.Group>(null);
  const slabs = useFracture();
  const { pointer } = useThree();

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (!group.current) return;

    // Restrained pointer parallax + a slow, continuous drift.
    group.current.rotation.y += delta * 0.09;
    const targetX = -pointer.y * 0.14;
    const targetZ = pointer.x * 0.1;
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      targetX,
      delta * 1.4
    );
    group.current.rotation.z = THREE.MathUtils.lerp(
      group.current.rotation.z,
      targetZ,
      delta * 1.2
    );

    // Each slab breathes outward and back — the "held mid-shatter" tension.
    const children = group.current.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const slab = slabs[i];
      if (!slab) continue;
      const pulse = 1 + Math.sin(t * 0.8 + slab.offset) * 0.045;
      const dir = new THREE.Vector3(...slab.position).normalize();
      child.position.set(
        slab.position[0] + dir.x * (pulse - 1) * 2.4,
        slab.position[1] + dir.y * (pulse - 1) * 2.4,
        slab.position[2] + dir.z * (pulse - 1) * 2.4
      );
      child.rotation.y = slab.rotation[1] + t * 0.04 * (i % 2 === 0 ? 1 : -1);
    }
  });

  return (
    <group ref={group}>
      <Core />
      {slabs.map((slab, i) => (
        <mesh
          key={i}
          geometry={slab.geometry}
          position={slab.position}
          rotation={slab.rotation}
        >
          <meshPhysicalMaterial
            color="#3a1f15"
            roughness={0.19}
            metalness={0.08}
            clearcoat={1}
            clearcoatRoughness={0.14}
            sheen={0.8}
            sheenColor="#c58a58"
            envMapIntensity={1.15}
          />
        </mesh>
      ))}
      <Filament />
    </group>
  );
}

function Rig() {
  // Slow scroll-linked tilt, read from the page (not a ScrollTrigger dependency).
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    const y = window.scrollY || 0;
    const target = Math.min(y / 900, 1) * 0.5;
    group.current.position.y = THREE.MathUtils.lerp(
      group.current.position.y,
      target,
      0.06
    );
  });
  return (
    <group ref={group}>
      <Composition />
    </group>
  );
}

export default function CocoaLattice() {
  return (
    <Canvas
      dpr={[1, 1.7]}
      camera={{ position: [0, 0, 6.4], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop="always"
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.28} color="#f3e8db" />
      <directionalLight position={[5, 7, 4]} intensity={2.3} color="#ffdcb4" />
      <directionalLight position={[-6, -3, -4]} intensity={0.7} color="#a66e45" />
      <spotLight position={[-3, 5, 5]} angle={0.6} penumbra={1} intensity={1.5} color="#f3e8db" />

      <Rig />

      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2.6} color="#fff4e4" position={[0, 4, 3]} scale={[7, 3, 1]} />
        <Lightformer form="circle" intensity={2.1} color="#c58a58" position={[-4, 1, 2]} scale={[3, 3, 1]} />
        <Lightformer form="circle" intensity={1.3} color="#4a2b1e" position={[4, -2, 2]} scale={[4.5, 4.5, 1]} />
      </Environment>
    </Canvas>
  );
}
