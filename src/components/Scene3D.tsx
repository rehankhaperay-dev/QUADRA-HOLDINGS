import { iconSrcSet, withBase } from '../lib/paths';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * The four corners are actual beveled, extruded geometry, built from the same
 * proportions as public/quadra-mark.svg. The still image is always rendered by
 * the server and remains available without WebGL, JS, or animation.
 */
export default function Scene3D() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas || !('ResizeObserver' in window)) return;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const small = matchMedia('(max-width: 768px)');
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    if (reduced.matches || small.matches || !finePointer.matches) return;

    const attributes: WebGLContextAttributes = { alpha: true, antialias: true, powerPreference: 'low-power' };
    let context: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    try {
      context = canvas.getContext('webgl2', attributes) || canvas.getContext('webgl', attributes);
    } catch { return; }
    if (!context) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch { return; }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.82;
    renderer.setClearColor(0xffffff, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(0, 0, 7.3);
    const hemi = new THREE.HemisphereLight(0xffffff, 0xb9d1c1, 1.6);
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(-3, 5, 7);
    const fill = new THREE.DirectionalLight(0xd3fff0, 1.0);
    fill.position.set(4, -2, 3);
    scene.add(hemi, key, fill);

    // A small procedural studio environment creates real reflections; it does
    // not download a texture or HDRI. RoomEnvironment is part of Three.js.
    let environment: THREE.WebGLRenderTarget | undefined;
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment(renderer);
      environment = pmrem.fromScene(room, 0.04);
      scene.environment = environment.texture;
      room.dispose();
      pmrem.dispose();
    } catch { /* The softly lit material still works without reflections. */ }

    const px = (x: number) => (x - 32) / 14;
    const py = (y: number) => (32 - y) / 14;
    const corner = new THREE.Shape();
    corner.moveTo(px(29), py(4));
    corner.lineTo(px(21), py(4));
    corner.quadraticCurveTo(px(4), py(4), px(4), py(21));
    corner.lineTo(px(4), py(29));
    corner.lineTo(px(12), py(29));
    corner.lineTo(px(12), py(21));
    corner.quadraticCurveTo(px(12), py(12), px(21), py(12));
    corner.lineTo(px(29), py(12));
    corner.closePath();

    const geometry = new THREE.ExtrudeGeometry(corner, {
      depth: 0.30, steps: 1, bevelEnabled: true, bevelThickness: 0.065,
      bevelSize: 0.055, bevelSegments: 3, curveSegments: 20,
    });
    const emerald = new THREE.MeshStandardMaterial({
      color: 0x034b33, metalness: 0.68, roughness: 0.25, envMapIntensity: 0.95,
    });
    const gold = new THREE.MeshStandardMaterial({
      color: 0xd6b789, metalness: 0.72, roughness: 0.29, envMapIntensity: 1.1,
    });
    const goldGeometry = new THREE.CapsuleGeometry(0.145, 1.24, 5, 16);
    const emblem = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const piece = new THREE.Mesh(geometry, emerald);
      piece.rotation.z = -i * Math.PI / 2;
      emblem.add(piece);
    }
    const tail = new THREE.Mesh(goldGeometry, gold);
    tail.position.set(1.12, -1.12, 0.39);
    tail.rotation.z = Math.PI / 4;
    emblem.add(tail);
    emblem.rotation.set(-0.10, -0.16, -0.035);
    scene.add(emblem);

    let frame = 0;
    let lastRender = 0;
    let inView = true;
    let usable = true;
    let disposed = false;
    const target = { x: 0, y: 0 };
    const canAnimate = () => !disposed && usable && inView && !document.hidden && !reduced.matches && !small.matches && finePointer.matches;
    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (usable) renderer.render(scene, camera);
    };
    const animate = (time: number) => {
      if (!canAnimate()) return;
      // A 30 fps ceiling is sufficient for this restrained motion and reduces GPU work.
      if (time - lastRender < 33) { frame = requestAnimationFrame(animate); return; }
      lastRender = time;
      emblem.rotation.x += (-0.10 + target.y * 0.11 - emblem.rotation.x) * 0.045;
      emblem.rotation.y += (-0.16 + target.x * 0.15 - emblem.rotation.y) * 0.045;
      emblem.position.y = Math.sin(time * 0.0007) * 0.045;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      const ready = usable && !reduced.matches && !small.matches && finePointer.matches && !disposed;
      host.classList.toggle('scene--ready', ready);
      if (canAnimate()) frame = requestAnimationFrame(animate);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const rect = host.getBoundingClientRect();
      target.x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
      target.y = Math.max(-1, Math.min(1, -((event.clientY - rect.top) / rect.height - 0.5) * 2));
    };
    const leave = () => { target.x = 0; target.y = 0; };
    const lost = (event: Event) => { event.preventDefault(); usable = false; sync(); };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    const intersection = 'IntersectionObserver' in window ? new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    }) : null;
    intersection?.observe(host);
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerleave', leave);
    canvas.addEventListener('webglcontextlost', lost);
    document.addEventListener('visibilitychange', sync);
    resize();
    sync();

    // Subscribe after WebGL initialization so browser media-query changes are
    // observed even when the GPU setup takes an unusually long time.
    let mediaWatchers: MediaQueryList[] = [];
    const mediaTimer = window.setTimeout(() => {
      mediaWatchers = [
        matchMedia('(prefers-reduced-motion: reduce)'),
        matchMedia('(max-width: 768px)'),
        matchMedia('(hover: hover) and (pointer: fine)'),
      ];
      mediaWatchers.forEach((watcher) => watcher.addEventListener('change', sync));
      sync();
    }, 0);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection?.disconnect();
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerleave', leave);
      canvas.removeEventListener('webglcontextlost', lost);
      window.clearTimeout(mediaTimer);
      mediaWatchers.forEach((watcher) => watcher.removeEventListener('change', sync));
      document.removeEventListener('visibilitychange', sync);
      geometry.dispose();
      goldGeometry.dispose();
      emerald.dispose();
      gold.dispose();
      environment?.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="scene" ref={hostRef} data-scene>
      <img className="scene-fallback" src={withBase("images/ai/emblem.webp")} srcSet={iconSrcSet("emblem")} sizes="(max-width: 600px) 158px, 190px" width="384" height="384" alt="" />
      <canvas className="scene-canvas" ref={canvasRef} aria-hidden="true" />

    </div>
  );
}
