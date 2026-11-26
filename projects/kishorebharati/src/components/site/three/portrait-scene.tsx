'use client';

/**
 * The intro's halftone portrait: the Headmaster's photo sampled into a grid,
 * one square dot per cell, sized by how bright the photo is there. The dots
 * fly in from all round, settle into the face, breathe, shy away from the
 * pointer and spring back, then scatter outwards.
 *
 * All motion is in the vertex shader, driven by four uniforms (progress,
 * scatter, time, pointer); JavaScript never loops over the dots per frame.
 * Loaded only by ../intro-loader.tsx (next/dynamic, ssr:false).
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

export type Grid = { cols: number; rows: number; lum: Float32Array };

export type PortraitProps = {
  grid: Grid;
  calm: boolean;
  /** Seconds the dots take to assemble, how long the face holds, and when they scatter. */
  timeline: { assemble: number; hold: number; scatter: number };
  onDone: () => void;
  /** Called on the first frame the dots are drawn. */
  onStart?: () => void;
};

const VERTEX = /* glsl */ `
  uniform float uProgress;
  uniform float uScatter;
  uniform float uTime;
  uniform float uPixel;
  uniform float uCell;
  uniform vec2 uPointer;
  uniform float uPush;
  attribute vec3 aStart;
  attribute float aLum;
  attribute float aSeed;
  varying float vLum;
  varying float vSeed;
  varying float vRefr;

  float hash(vec2 q) { return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 q) {
    vec2 i = floor(q);
    vec2 f = fract(q);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  void main() {
    vec3 target = position;
    // Each dot leaves at its own moment, so the face assembles in a wave, not all at once.
    float delay = aSeed * 0.4;
    float p = clamp((uProgress - delay) / 0.6, 0.0, 1.0);
    p = 1.0 - pow(1.0 - p, 3.0);
    vec3 pos = mix(aStart, target, p);

    // Breathing: a slow ripple across the face.
    float r = length(target.xy);
    pos.z += sin(r * 7.0 - uTime * 2.2) * 0.018 * p;

    // Refraction, part 1: the whole face sits under moving water. Two drifting
    // noise fields bend every dot a little, all the time, so no part is still.
    vec2 flow = target.xy * 2.4;
    vec2 bend = vec2(
      noise(flow + vec2(uTime * 0.32, -uTime * 0.21)),
      noise(flow + vec2(17.3 - uTime * 0.27, 4.1 + uTime * 0.24))
    ) - 0.5;
    pos.xy += bend * 0.055 * p;
    pos.z += (bend.x + bend.y) * 0.08 * p;

    // Refraction, part 2: a band of glass sweeps slowly across the face on a
    // slant, magnifying and bending the dots it passes over.
    vec2 dir = normalize(vec2(1.0, 0.42));
    float sweep = mod(uTime * 0.42, 3.4) - 1.7;
    float s = dot(target.xy, dir) - sweep;
    float lens = exp(-s * s * 20.0) * p;
    pos.xy += dir * s * lens * 0.55;
    pos.z += lens * 0.14;
    vRefr = clamp(lens + length(bend) * 1.6 * p, 0.0, 1.0);

    // The pointer pushes dots aside; they spring back as it leaves.
    vec2 d = pos.xy - uPointer;
    float near = exp(-dot(d, d) * 18.0) * uPush;
    pos.xy += normalize(d + 0.0001) * near * 0.12;
    pos.z += near * 0.15;

    // Scatter: outwards from the centre, faster for the brighter dots.
    vec2 out2 = normalize(target.xy + vec2(0.0001, 0.0002));
    pos.xy += out2 * uScatter * (0.8 + aSeed * 2.4);
    pos.z += uScatter * (aSeed - 0.5) * 3.0;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = uCell * (0.18 + aLum * 0.95) * (1.0 + near * 0.6 + lens * 0.7);
    gl_PointSize = max(1.0, size * uPixel / -mv.z);
    vLum = aLum;
    vSeed = aSeed;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uScatter;
  uniform float uProgress;
  varying float vLum;
  varying float vSeed;
  varying float vRefr;
  void main() {
    // Square dots with softened edges, like a halftone screen.
    vec2 q = abs(gl_PointCoord - 0.5);
    float edge = 1.0 - smoothstep(0.38, 0.5, max(q.x, q.y));
    // A faint scanline shimmer that runs down the screen.
    float scan = 0.88 + 0.12 * sin(gl_FragCoord.y * 1.4 - uTime * 9.0);
    vec3 cream = vec3(0.97, 0.94, 0.85);
    vec3 flame = vec3(1.0, 0.78, 0.24);
    vec3 navy = vec3(0.42, 0.5, 0.95);
    vec3 col = mix(navy, cream, smoothstep(0.15, 0.6, vLum));
    col = mix(col, flame, smoothstep(0.82, 1.0, vLum) * 0.55);
    // Where the glass bends the light: a cool-to-warm colour fringe and a lift in brightness.
    vec3 fringe = mix(vec3(0.55, 0.85, 1.0), vec3(1.0, 0.82, 0.45), gl_PointCoord.x);
    col = mix(col, fringe, vRefr * 0.45) + vRefr * 0.18;
    float alpha = edge * scan * (0.35 + vLum * 0.75 + vRefr * 0.25) * (1.0 - uScatter) * smoothstep(0.0, 0.15, uProgress + vSeed * 0.1);
    gl_FragColor = vec4(col, alpha);
  }
`;

function Dots({ grid, calm, timeline, onDone, onStart }: PortraitProps) {
  const { gl, size, viewport } = useThree();
  const start = useRef<number | null>(null);
  const done = useRef(false);
  const fit = useRef({ scale: 1, lift: 0 });
  const pointer = useRef({ x: 0, y: 0, target: new THREE.Vector2(9, 9), push: 0, aim: 0 });

  const { geometry, material } = useMemo(() => {
    const { cols, rows, lum } = grid;
    const count = cols * rows;
    const target = new Float32Array(count * 3);
    const startPos = new Float32Array(count * 3);
    const lums = new Float32Array(count);
    const seeds = new Float32Array(count);
    const width = 2;
    const height = (width * rows) / cols;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        target[i * 3] = (x / (cols - 1) - 0.5) * width;
        target[i * 3 + 1] = (0.5 - y / (rows - 1)) * height;
        target[i * 3 + 2] = 0;
        const a = Math.random() * Math.PI * 2;
        const r = 2.2 + Math.random() * 2.5;
        startPos[i * 3] = Math.cos(a) * r;
        startPos[i * 3 + 1] = Math.sin(a) * r;
        startPos[i * 3 + 2] = (Math.random() - 0.5) * 3;
        lums[i] = lum[i];
        seeds[i] = Math.random();
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(target, 3));
    g.setAttribute('aStart', new THREE.BufferAttribute(startPos, 3));
    g.setAttribute('aLum', new THREE.BufferAttribute(lums, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20);
    const m = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uProgress: { value: 0 },
        uScatter: { value: 0 },
        uTime: { value: 0 },
        uPixel: { value: 1 },
        uCell: { value: width / cols },
        uPointer: { value: new THREE.Vector2(9, 9) },
        uPush: { value: 0 },
      },
    });
    return { geometry: g, material: m };
  }, [grid]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useEffect(() => {
    const el = gl.domElement;
    const onMove = (e: PointerEvent) => {
      const box = el.getBoundingClientRect();
      const nx = ((e.clientX - box.left) / box.width) * 2 - 1;
      const ny = -(((e.clientY - box.top) / box.height) * 2 - 1);
      // Into the portrait's own units: undo its scale and its lift.
      const { scale: k, lift } = fit.current;
      pointer.current.target.set((nx * viewport.width) / 2 / k, ((ny * viewport.height) / 2 - lift) / k);
      pointer.current.aim = 1;
    };
    const onLeave = () => (pointer.current.aim = 0);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [gl, viewport.width, viewport.height]);

  // Fit the portrait to the screen: up to 62% of the height and 86% of the width.
  const aspect = grid.rows / grid.cols;
  const scale = Math.min((viewport.height * 0.62) / (2 * aspect), (viewport.width * 0.86) / 2);
  fit.current = { scale, lift: viewport.height * 0.06 };

  useFrame((state, delta) => {
    const now = state.clock.elapsedTime;
    if (start.current === null) {
      start.current = now;
      onStart?.();
    }
    const t = now - start.current;
    const u = material.uniforms;
    const { assemble, hold, scatter } = timeline;
    u.uTime.value += Math.min(delta, 1 / 20) * (calm ? 0.5 : 1);
    // Pixels per world unit at distance 1: half the drawing height over tan(half the field of view).
    const fov = ((state.camera as THREE.PerspectiveCamera).fov * Math.PI) / 180;
    u.uPixel.value = (gl.getPixelRatio() * size.height * 0.5) / Math.tan(fov / 2);
    u.uCell.value = (2 / grid.cols) * scale;
    u.uProgress.value = Math.min(1, t / assemble);
    const s = Math.max(0, (t - assemble - hold) / scatter);
    // Ease-in, so the scatter starts gently and then speeds away.
    u.uScatter.value = Math.min(1, s * s);
    // The pointer target is damped twice (position and strength), so nothing snaps.
    const p = pointer.current;
    const k = 1 - Math.exp(-delta * (calm ? 4 : 7));
    (u.uPointer.value as THREE.Vector2).lerp(p.target, k);
    p.push += (p.aim * (calm ? 0.6 : 1) - p.push) * k;
    u.uPush.value = p.push;
    if (!done.current && t >= assemble + hold + scatter) {
      done.current = true;
      onDone();
    }
  });

  return <points geometry={geometry} material={material} scale={[scale, scale, scale]} position={[0, fit.current.lift, 0]} />;
}

export default function PortraitScene(props: PortraitProps) {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 5], fov: 40 }} gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }} style={{ position: 'absolute', inset: 0 }} aria-hidden>
      <Dots {...props} />
    </Canvas>
  );
}
