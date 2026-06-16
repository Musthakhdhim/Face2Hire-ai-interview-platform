import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { AvatarStyle } from '../../services/interviewService';

interface ThreeAvatarProps {
  style: AvatarStyle;
  isSpeaking: boolean;
  audioElement?: HTMLAudioElement;
}

export default function ThreeAvatar({ style: _style, isSpeaking: _isSpeaking, audioElement }: ThreeAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const jawBoneRef = useRef<THREE.Bone | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const volumeRef = useRef(0);
  const controlsRef = useRef<OrbitControls | null>(null);

  const modelUrl = '/models/sixth.glb'; 

  useEffect(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {
        // ignore
      }
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {
        // ignore
      }
      analyserRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.warn);
      audioContextRef.current = null;
    }
    // removed setAudioActive(false) – no longer needed
    volumeRef.current = 0;

    if (!audioElement) {
      console.log('[ThreeAvatar] No audio element, waiting...');
      return;
    }

    console.log('[ThreeAvatar] New audio element, setting up analyser');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    audioContextRef.current = ctx;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const setupSource = () => {
      if (!audioElement || !audioContextRef.current || !analyserRef.current) return;
      try {
        if (sourceRef.current) return;
        const source = audioContextRef.current.createMediaElementSource(audioElement);
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
        sourceRef.current = source;
        console.log('[ThreeAvatar] Source connected, resuming context');
        audioContextRef.current.resume().then(() => {
          console.log('[ThreeAvatar] Audio context resumed');
        });
      } catch (err) {
        console.warn('[ThreeAvatar] Could not connect source, retrying...', err);
        setTimeout(setupSource, 500);
      }
    };

    if (audioElement.src) {
      setupSource();
    } else {
      audioElement.addEventListener('loadedmetadata', setupSource, { once: true });
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = null;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 3.0, 6.0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.enablePan = true;
    controls.target.set(0, 2.5, 0);
    controlsRef.current = controls;

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

        let jawFound = false;
        model.traverse((child) => {
          if (child instanceof THREE.Bone) {
            if (child.name.toLowerCase() === 'jaw') {
              jawBoneRef.current = child;
              jawFound = true;
              console.log('[ThreeAvatar] Jaw bone found:', child.name);
            }
          }
        });
        if (!jawFound) {
          console.warn('[ThreeAvatar] Jaw bone not found – lip sync disabled');
        }

        scene.add(model);

        if (gltf.animations && gltf.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          mixerRef.current = mixer;
          const idleAction = mixer.clipAction(gltf.animations[0]);
          idleAction.setLoop(THREE.LoopRepeat, Infinity);
          idleAction.play();
          console.log('[ThreeAvatar] Idle animation playing');
        }

        const distance = targetHeight / (2 * Math.tan((camera.fov * Math.PI) / 360));
        camera.position.set(0, targetHeight * 0.55, distance * 1.2);
        controls.target.set(0, targetHeight * 0.45, 0);
        controls.update();
      },
      undefined,
      (error) => {
        console.error('Error loading 3D model:', error);
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
        jawBoneRef.current = jawMesh as unknown as THREE.Bone;
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

      if (analyserRef.current && jawBoneRef.current) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        let rawVolume = sum / (data.length * 128);
        if (rawVolume < 0.01 && audioElement && !audioElement.paused) {
          if (audioContextRef.current && audioContextRef.current.state !== 'running') {
            audioContextRef.current.resume();
          }
        }
        rawVolume = Math.min(1, rawVolume);
        volumeRef.current = volumeRef.current * 0.85 + rawVolume * 0.15;
        const jawOpen = Math.min(1, volumeRef.current * 1.2);
        const jawRotationX = -0.25 * jawOpen; // -0.25 rad ≈ -14 degrees (fully open)

        if (time - lastLogTime > 1000) {
          console.log(`[Volume] raw: ${rawVolume.toFixed(2)}, jawOpen: ${jawOpen.toFixed(2)}, rot: ${jawRotationX.toFixed(3)}`);
          lastLogTime = time;
        }

        if (jawBoneRef.current instanceof THREE.Bone) {
          jawBoneRef.current.rotation.x = jawRotationX;
        } else {
          (jawBoneRef.current as unknown as THREE.Mesh).scale.y = 1 + jawOpen * 0.8;
          (jawBoneRef.current as unknown as THREE.Mesh).position.z = 0.5 + jawOpen * 0.2;
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
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      if (controlsRef.current) controlsRef.current.dispose();
      if (audioContextRef.current) audioContextRef.current.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelUrl]);



  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full rounded-xl" />
    </div>
  );
}