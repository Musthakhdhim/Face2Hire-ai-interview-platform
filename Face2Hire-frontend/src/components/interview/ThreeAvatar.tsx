import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { AvatarStyle } from '../../services/interviewService';

interface ThreeAvatarProps {
  style: AvatarStyle;
  isSpeaking: boolean;
  audioElement?: HTMLAudioElement;
}

export default function ThreeAvatar({ style, isSpeaking, audioElement }: ThreeAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const jawBoneRef = useRef<THREE.Bone | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const volumeRef = useRef(0);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [audioActive, setAudioActive] = useState(false);

  // Fixed model map – use the same model for all styles to avoid reloading
  const modelUrl = '/models/fourth.glb'; // your working rigged model

  // --- Setup audio analyser whenever audioElement changes ---
  useEffect(() => {
    // Clean up previous audio connections
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch (e) {}
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch (e) {}
      analyserRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.warn);
      audioContextRef.current = null;
    }
    setAudioActive(false);
    volumeRef.current = 0;

    if (!audioElement) {
      console.log('[ThreeAvatar] No audio element, waiting...');
      return;
    }

    console.log('[ThreeAvatar] New audio element, setting up analyser');

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    audioContextRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    // Wait for the audio element to have a source (TTS blob)
    const setupSource = () => {
      if (!audioElement || !audioContextRef.current || !analyserRef.current) return;
      try {
        // If already connected, skip
        if (sourceRef.current) return;
        const source = audioContextRef.current.createMediaElementSource(audioElement);
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
        sourceRef.current = source;
        console.log('[ThreeAvatar] Source connected, resuming context');
        audioContextRef.current.resume().then(() => {
          setAudioActive(true);
          console.log('[ThreeAvatar] Audio context resumed');
        });
      } catch (err) {
        console.warn('[ThreeAvatar] Could not connect source, retrying...', err);
        setTimeout(setupSource, 500);
      }
    };

    // If the audio element already has a src, connect immediately.
    if (audioElement.src) {
      setupSource();
    } else {
      audioElement.addEventListener('loadedmetadata', setupSource, { once: true });
      // Also retry periodically (some blobs never fire loadedmetadata)
      const interval = setInterval(() => {
        if (audioElement.src && !sourceRef.current) setupSource();
        else if (sourceRef.current) clearInterval(interval);
      }, 500);
      return () => clearInterval(interval);
    }

    return () => {
      if (audioElement) audioElement.removeEventListener('loadedmetadata', setupSource);
    };
  }, [audioElement]);

  // --- 3D Scene setup (only once, independent of style changes) ---
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = null;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 3.0, 6.0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.enablePan = true;
    controls.target.set(0, 2.5, 0);
    controlsRef.current = controls;

    // Lighting
    const ambient = new THREE.AmbientLight(0x707090);
    scene.add(ambient);
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.8);
    mainLight.position.set(1, 2, 1);
    mainLight.castShadow = true;
    scene.add(mainLight);
    const fillLight = new THREE.PointLight(0x88aaff, 0.8);
    fillLight.position.set(-1, 1.5, 1);
    scene.add(fillLight);
    const backLight = new THREE.PointLight(0xffaa88, 1.0);
    backLight.position.set(0, 2.5, -2.5);
    scene.add(backLight);

    const loader = new GLTFLoader();
    let modelLoaded = false;
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        model.rotation.y = -Math.PI / 2;

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        model.position.sub(center);
        const targetHeight = 8.0;
        const scale = targetHeight / maxDim;
        model.scale.set(scale, scale, scale);
        model.position.y += 2.5;

        // Find jaw bone (common names: 'jaw', 'Jaw', 'jawbone')
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = false;
          }
          if (child instanceof THREE.Bone) {
            const nameLower = child.name.toLowerCase();
            if (nameLower.includes('jaw')) {
              jawBoneRef.current = child;
              console.log('✅ Jaw bone found:', child.name);
            }
          }
        });
        if (!jawBoneRef.current) {
          console.warn('❌ No jaw bone found in model');
        }

        scene.add(model);
        mixerRef.current = new THREE.AnimationMixer(model);
        if (gltf.animations.length) {
          mixerRef.current.clipAction(gltf.animations[0]).play();
        }

        // Adjust camera
        const distance = targetHeight / (2 * Math.tan((camera.fov * Math.PI) / 360));
        camera.position.set(0, targetHeight * 0.55, distance * 1.2);
        controls.target.set(0, targetHeight * 0.45, 0);
        controls.update();
        modelLoaded = true;
      },
      undefined,
      (error) => {
        console.error('Error loading 3D model:', error);
        // Fallback sphere
        const headGeo = new THREE.SphereGeometry(1.5, 64, 64);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xddbb99 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.2;
        scene.add(head);
        const jawGeo = new THREE.SphereGeometry(0.8, 32, 32);
        const jawMat = new THREE.MeshStandardMaterial({ color: 0xccaa88 });
        const jawMesh = new THREE.Mesh(jawGeo, jawMat);
        jawMesh.position.set(0, -0.4, 0.9);
        head.add(jawMesh);
        jawBoneRef.current = jawMesh as any;
        camera.position.set(0, 2.5, 6.0);
        controls.target.set(0, 1.5, 0);
        controls.update();
      }
    );

    let lastTime = 0;
    let lastLogTime = 0;
    const animate = (time: number) => {
      const delta = Math.min(0.033, (time - lastTime) / 1000);
      lastTime = time;

      if (mixerRef.current) mixerRef.current.update(delta);
      if (controlsRef.current) controlsRef.current.update();

      // Get volume from analyser
      if (analyserRef.current && jawBoneRef.current) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        let rawVolume = sum / (data.length * 128);
        // If no data, but audio element is playing, try to force context resume
        if (rawVolume < 0.01 && audioElement && !audioElement.paused) {
          if (audioContextRef.current && audioContextRef.current.state !== 'running') {
            audioContextRef.current.resume();
          }
        }
        rawVolume = Math.min(1, rawVolume);
        volumeRef.current = volumeRef.current * 0.85 + rawVolume * 0.15;
        const jawOpen = volumeRef.current * 0.55;

        if (time - lastLogTime > 1000) {
          console.log(`[Volume] raw: ${rawVolume.toFixed(2)}, smoothed: ${volumeRef.current.toFixed(2)}, jaw: ${jawOpen.toFixed(2)}`);
          lastLogTime = time;
        }

        // Apply jaw movement – try rotation.x (most common) or rotation.y
        if (jawBoneRef.current instanceof THREE.Bone) {
          // Try rotation.x first
          jawBoneRef.current.rotation.x = jawOpen;
          // Also set rotation.z for some models
          jawBoneRef.current.rotation.z = jawOpen * 0.2;
        } else {
          (jawBoneRef.current as any).scale.y = 1 + jawOpen * 0.8;
          (jawBoneRef.current as any).position.z = 0.5 + jawOpen * 0.2;
        }
      }

      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate(0);

    const handleResize = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      renderer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      if (controlsRef.current) controlsRef.current.update();
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      if (mixerRef.current) mixerRef.current.stopAllAction();
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      if (controlsRef.current) controlsRef.current.dispose();
      // Clean up audio context
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [modelUrl]); // only run once on mount

  // Debug: test jaw movement
  const testJaw = useCallback(() => {
    if (jawBoneRef.current) {
      console.log('Testing jaw rotation.x');
      jawBoneRef.current.rotation.x = 0.6;
      setTimeout(() => {
        if (jawBoneRef.current) jawBoneRef.current.rotation.x = 0;
      }, 500);
    } else {
      alert('No jaw bone found');
    }
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full rounded-xl" />
      <button
        onClick={testJaw}
        className="absolute bottom-4 left-4 z-50 bg-black/70 text-white px-3 py-1 rounded text-sm"
      >
        🧪 Test Jaw
      </button>
      {audioActive && (
        <div className="absolute bottom-4 right-4 z-50 bg-green-500/80 text-black px-2 py-1 rounded text-xs">
          🎤 Audio active
        </div>
      )}
    </div>
  );
}