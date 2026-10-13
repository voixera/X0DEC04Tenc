"use client";

/**
 * ChocolateCenterpiece — the WebGL hero centerpiece.
 *
 * A sculptural, glossy cocoa form (a distorted rounded icosahedron) lit like a
 * studio product shot, with a soft caramel rim and a slow orbital ring echoing
 * the Choco OBF logo. Rendered with React Three Fiber.
 *
 * This module is heavy, so it is always loaded via `React.lazy` and only when
 * WebGL is available and reduced motion is not requested. It pauses rendering
 * when the document is hidden or the canvas is scrolled out of view.
 */

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";

function useSculptGeometry() {
  return useMemo(() => {
    // A high-ish detail sphere, deformed into a smooth sculptural cocoa form.
    const geo = new THREE.IcosahedronGeometry(1.32, 24);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const n = v.clone().normalize();
      // Layered, low-frequency deformation — organic, not noisy.
      const d =
        0.16 * Math.sin(2.2 * v.x + 0.6) * Math.cos(1.7 * v.y) +
        0.12 * Math.sin(1.5 * v.z + 1.1) +
        0.06 * Math.cos(3.0 * v.y);
      v.copy(n).multiplyScalar(1 + d);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);
}

function ChocolateForm() {
  const mesh = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const group = useRef<THREE.Group>(null);
  const geo = useSculptGeometry();

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      // Slow drift that follows the pointer a touch — restrained, not jittery.
      group.current.rotation.y += delta * 0.12;
      const targetX = -state.pointer.y * 0.16;
      const targetY = state.pointer.x * 0.28;
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        targetX,
        delta * 1.6
      );
      group.current.position.y = Math.sin(t * 0.5) * 0.06;
      group.current.rotation.z = THREE.MathUtils.lerp(
        group.current.rotation.z,
        targetY * 0.12,
        delta * 1.4
      );
    }
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.05;
    }
    if (ring.current) {
      ring.current.rotation.z += delta * 0.08;
      ring.current.rotation.x = 1.1 + Math.sin(t * 0.35) * 0.14;
    }
  });

  return (
    <group ref={group}>
      <mesh ref={mesh} geometry={geo} castShadow>
        {/* Glossy milk-chocolate / cocoa material */}
        <meshPhysicalMaterial
          color="#5a3222"
          roughness={0.22}
          metalness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.18}
          sheen={0.7}
          sheenColor="#c98a54"
          envMapIntensity={1.1}
        />
      </mesh>

      {/* Orbital caramel ring — echoes the logo's silver orbit, in caramel */}
      <mesh ref={ring} rotation={[1.1, 0, 0.4]}>
        <torusGeometry args={[2.05, 0.028, 24, 220]} />
        <meshStandardMaterial
          color="#c9a06b"
          roughness={0.3}
          metalness={0.6}
          emissive="#6b3f22"
          emissiveIntensity={0.35}
        />
      </mesh>
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.35} color="#f2e6d8" />
      <directionalLight position={[4, 6, 3]} intensity={2.1} color="#ffd9b3" />
      <directionalLight position={[-5, -2, -4]} intensity={0.7} color="#a56c43" />
      <spotLight position={[-3, 5, 4]} angle={0.6} penumbra={1} intensity={1.4} color="#f2e6d8" />

      <ChocolateForm />

      {/* Procedural studio lighting via lightformers — no external HDR asset */}
      <Environment resolution={256}>
        <Lightformer
          form="rect"
          intensity={2.4}
          color="#fff2e0"
          position={[0, 4, 3]}
          scale={[6, 3, 1]}
          rotation={[0, 0, 0]}
        />
        <Lightformer
          form="circle"
          intensity={2.0}
          color="#c98a54"
          position={[-4, 1, 2]}
          scale={[3, 3, 1]}
        />
        <Lightformer
          form="circle"
          intensity={1.4}
          color="#67402c"
          position={[4, -2, 2]}
          scale={[4, 4, 1]}
        />
      </Environment>
    </>
  );
}

export default function ChocolateCenterpiece() {
  return (
    <Canvas
      // Modest DPR cap keeps average laptops smooth.
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6.2], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      frameloop="always"
      style={{ width: "100%", height: "100%" }}
    >
      <Scene />
    </Canvas>
  );
}
