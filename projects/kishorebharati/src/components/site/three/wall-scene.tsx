'use client';

/**
 * The campus tour: the school's photos hung on a curved wall around the
 * viewer. Scrolling down the page turns the wall; a sideways drag turns it
 * further. Every movement is damped, so the wall glides and never jumps.
 *
 * Photos come through Next's image optimiser at 828px wide at most, so a
 * texture is a few dozen KB. Textures, geometries and materials are freed
 * when the scene goes away. Loaded only by ./wall-stage.tsx (ssr:false).
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

export type WallPhoto = { url: string; width: number; height: number; caption: string };

export type WallSceneProps = {
  photos: WallPhoto[];
  active: boolean;
  calm: boolean;
  light: boolean;
  /** Page scroll through the tour section, 0..1. */
  progress: React.RefObject<number>;
  /** Extra turn from dragging, in radians. */
  drag: React.RefObject<number>;
  onReady: () => void;
};

const RADIUS = 6;
const HEIGHT = 1.7;

/** A small optimised copy of a site photo; outside addresses are used as they are. */
const textureUrl = (url: string, width: number) => (url.startsWith('/') ? `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=70` : url);

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  uniform float uBend;
  void main() {
    vUv = uv;
    vec3 p = position;
    // A slight bow, so each photo follows the curve of the wall.
    p.z += uBend * (p.x * p.x);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uMap;
  uniform float uFade;
  uniform float uFocus;
  void main() {
    vec4 c = texture2D(uMap, vUv);
    // A thin warm frame and a gentle vignette; photos away from the centre are dimmer.
    float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    float frame = smoothstep(0.0, 0.012, edge);
    vec3 col = mix(vec3(0.97, 0.93, 0.84), c.rgb, frame);
    float vig = smoothstep(0.85, 0.35, length(vUv - 0.5));
    col *= mix(0.55, 1.0, uFocus) * mix(0.8, 1.0, vig);
    gl_FragColor = vec4(col, uFade);
  }
`;

function Wall({ photos, calm, light, progress, drag, onReady }: Omit<WallSceneProps, 'active'>) {
  const group = useRef<THREE.Group>(null);
  const { size } = useThree();
  const turn = useRef(0);
  const time = useRef(0);

  // Even spacing on an arc; the arc grows with the number of photos but never closes into a full ring.
  const step = 0.62;
  const arc = step * Math.max(0, photos.length - 1);

  const planes = useMemo(() => {
    const loader = new THREE.TextureLoader();
    let loaded = 0;
    return photos.map((photo, i) => {
      const aspect = Math.min(1.9, Math.max(0.6, photo.width && photo.height ? photo.width / photo.height : 4 / 3));
      const w = HEIGHT * aspect;
      const geometry = new THREE.PlaneGeometry(w, HEIGHT, 16, 1);
      const uniforms = {
        uMap: { value: null as THREE.Texture | null },
        uFade: { value: 0 },
        uFocus: { value: 0 },
        uBend: { value: 0.025 },
      };
      const material = new THREE.ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms, transparent: true });
      // Never ask for more pixels than the photo has: small photos are not blown up.
      const width = Math.min(photo.width || 828, light ? 640 : 828) <= 640 ? 640 : 828;
      const texture = loader.load(textureUrl(photo.url, width), () => {
        loaded += 1;
        if (loaded === 1) onReady();
      });
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      uniforms.uMap.value = texture;
      const angle = -arc / 2 + i * step;
      // Alternate heights a little, like photos pinned by hand.
      const y = (i % 2 ? -0.22 : 0.22) * (light ? 0.6 : 1);
      return { geometry, material, texture, angle, y };
    });
    // Rebuilt only when the photos change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos, light]);

  useEffect(
    () => () => {
      for (const p of planes) {
        p.geometry.dispose();
        p.material.dispose();
        p.texture.dispose();
      }
    },
    [planes],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);
    time.current += dt * (calm ? 0.4 : 1);
    // Turning the group by -angle brings that photo straight ahead.
    const target = arc / 2 - (progress.current ?? 0) * arc + (drag.current ?? 0);
    const clamped = Math.max(-arc / 2 - 0.4, Math.min(arc / 2 + 0.4, target));
    turn.current += (clamped - turn.current) * (1 - Math.exp(-dt * (calm ? 2.2 : 3.5)));
    const g = group.current;
    if (!g) return;
    g.rotation.y = turn.current;
    g.position.y = Math.sin(time.current * 0.5) * (calm ? 0.02 : 0.05);
    for (const p of planes) {
      const u = p.material.uniforms;
      u.uFade.value = Math.min(1, u.uFade.value + dt * 0.8);
      // How close to straight ahead this photo is now.
      const off = Math.abs(p.angle + turn.current);
      const focus = Math.max(0, 1 - off / 1.1);
      u.uFocus.value += (focus - u.uFocus.value) * (1 - Math.exp(-dt * 4));
    }
  });

  // On a narrow screen the camera steps back a little so a whole photo fits.
  const portrait = size.width < size.height;

  return (
    <group ref={group} position={[0, 0, portrait ? -0.6 : 0]}>
      {planes.map((p, i) => (
        <mesh
          key={i}
          geometry={p.geometry}
          material={p.material}
          position={[Math.sin(-p.angle) * RADIUS, p.y, -Math.cos(p.angle) * RADIUS]}
          rotation={[0, p.angle, 0]}
        />
      ))}
    </group>
  );
}

export default function WallScene({ active, light, ...rest }: WallSceneProps) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={light ? [1, 1.4] : [1, 1.75]}
      camera={{ position: [0, 0, 0.01], fov: 52, near: 0.1, far: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
      aria-hidden
    >
      <Wall light={light} {...rest} />
    </Canvas>
  );
}
