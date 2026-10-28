import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Activity, Zap, TrendingUp, ShieldCheck } from 'lucide-react';

export const ThreeHeroAthlete: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGL(false);
        return;
      }
    } catch {
      setHasWebGL(false);
      return;
    }

    const container = containerRef.current;
    const width = container.clientWidth || 550;
    const height = container.clientHeight || 550;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 22;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group for all rotating elements
    const athleteGroup = new THREE.Group();
    scene.add(athleteGroup);

    // 1. Central Kinetic Athletic Core (Icosahedron wireframe)
    const coreGeo = new THREE.IcosahedronGeometry(4.2, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.9,
      emissive: 0x052e16,
      emissiveIntensity: 0.4,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    athleteGroup.add(coreMesh);

    // 2. Inner dense anatomical silhouette node sphere
    const innerGeo = new THREE.SphereGeometry(2.6, 16, 16);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.3,
      metalness: 0.8,
      transparent: true,
      opacity: 0.45,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    athleteGroup.add(innerMesh);

    // 3. Orbiting Energy Rings (Toruses with sports-tech angles)
    const ring1Geo = new THREE.TorusGeometry(6.2, 0.08, 16, 100);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.75 });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    athleteGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(7.6, 0.06, 16, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.55 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    ring2.rotation.x = -Math.PI / 6;
    athleteGroup.add(ring2);

    const ring3Geo = new THREE.TorusGeometry(8.8, 0.05, 16, 100);
    const ring3Mat = new THREE.MeshBasicMaterial({ color: 0xa3e635, transparent: true, opacity: 0.4 });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.z = Math.PI / 5;
    athleteGroup.add(ring3);

    // 4. Floating Workout Particles (Points)
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 26;
      posArray[i + 1] = (Math.random() - 0.5) * 26;
      posArray[i + 2] = (Math.random() - 0.5) * 20;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.18,
      color: 0x86efac,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const particlesMesh = new THREE.Points(particleGeo, particleMat);
    scene.add(particlesMesh);

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x22c55e, 3, 50);
    pointLight1.position.set(12, 10, 15);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x06b6d4, 2, 50);
    pointLight2.position.set(-12, -10, -10);
    scene.add(pointLight2);

    // Mouse parallax tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      targetX = (x / rect.width) * 1.5;
      targetY = -(y / rect.height) * 1.5;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera parallax interpolation
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;
      camera.position.x = mouseX * 2.5;
      camera.position.y = mouseY * 2.5;
      camera.lookAt(0, 0, 0);

      // Rotations
      coreMesh.rotation.y = elapsedTime * 0.25;
      coreMesh.rotation.x = elapsedTime * 0.15;

      ring1.rotation.z = elapsedTime * 0.4;
      ring2.rotation.x = elapsedTime * 0.3;
      ring3.rotation.y = elapsedTime * 0.2;

      particlesMesh.rotation.y = -elapsedTime * 0.06;
      particlesMesh.rotation.x = elapsedTime * 0.04;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full max-w-[560px] h-[520px] md:h-[580px] flex items-center justify-center mx-auto">
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full relative z-10" />

      {/* CSS Fallback if WebGL unavailable */}
      {!hasWebGL && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 rounded-full border-2 border-emerald-500/40 animate-spin border-dashed flex items-center justify-center">
            <div className="w-48 h-48 rounded-full border border-cyan-400/40 animate-ping flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-emerald-500/20 backdrop-blur-xl flex items-center justify-center">
                <Activity className="w-12 h-12 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Athletic Metric Cards (Surrounding with depth and subtle float) */}
      {/* Card 1: 12-Week Adaptive Plan (Top Left) */}
      <motion.div
        animate={{ y: [0, -8, 0], x: [0, 4, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-6 -left-4 md:-left-8 z-20 glass-card px-4 py-3 rounded-2xl flex items-center gap-3 border border-emerald-500/30 shadow-xl"
      >
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-zinc-400 font-medium">Periodized Cycle</div>
          <div className="text-sm font-bold text-white tracking-wide">12-Week Adaptive Plan</div>
        </div>
      </motion.div>

      {/* Card 2: Recovery 86% (Top Right) */}
      <motion.div
        animate={{ y: [0, 9, 0], x: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        className="absolute top-10 -right-4 md:-right-6 z-20 glass-card px-4 py-3 rounded-2xl flex items-center gap-3 border border-emerald-500/30 shadow-xl"
      >
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-zinc-400 font-medium">Autonomic HRV</div>
          <div className="text-sm font-bold text-emerald-400 tracking-wide flex items-center gap-1">
            Recovery 86%
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
          </div>
        </div>
      </motion.div>

      {/* Card 3: 5K PR 24:15 (Bottom Left) */}
      <motion.div
        animate={{ y: [0, -10, 0], x: [0, -4, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        className="absolute bottom-10 -left-6 md:-left-10 z-20 glass-card px-4 py-3 rounded-2xl flex items-center gap-3 border border-cyan-500/30 shadow-xl"
      >
        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-zinc-400 font-medium">Threshold Engine</div>
          <div className="text-sm font-bold text-white tracking-wide">5K PR 24:15</div>
        </div>
      </motion.div>

      {/* Card 4: Strength Progression (Bottom Right) */}
      <motion.div
        animate={{ y: [0, 8, 0], x: [0, 5, 0] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 1.8 }}
        className="absolute bottom-8 -right-4 md:-right-8 z-20 glass-card px-4 py-3 rounded-2xl flex items-center gap-3 border border-lime-500/30 shadow-xl"
      >
        <div className="w-10 h-10 rounded-xl bg-lime-500/20 border border-lime-500/40 flex items-center justify-center text-lime-400">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-zinc-400 font-medium">Mechanical Overload</div>
          <div className="text-sm font-bold text-white tracking-wide">Strength +14.2%</div>
        </div>
      </motion.div>

      {/* Subtle radial backdrop glow */}
      <div className="absolute inset-0 bg-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none rounded-full blur-2xl" />
    </div>
  );
};
