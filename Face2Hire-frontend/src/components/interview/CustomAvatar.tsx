import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { AvatarStyle } from '../../services/interviewService';

interface CustomAvatarProps {
  style: AvatarStyle;
  isSpeaking: boolean;
  audioElement?: HTMLAudioElement;
}

export default function CustomAvatar({ style, isSpeaking, audioElement }: CustomAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const jawRef = useRef<THREE.Mesh | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const volumeRef = useRef(0);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Colour schemes based on avatar style
  const suitColor = style === 'friendly' ? 0x5c6bc0 : 0x1e3a8a; // light blue for friendly, dark blue for others
  const skinColor = 0xfdd7a8;
  const tieColor = style === 'friendly' ? 0xef4444 : 0x1e3a8a;

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Scene setup ---
    const scene = new THREE.Scene();
    scene.background = null; // transparent
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 1.5, 3.8);
    camera.lookAt(0, 1, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.target.set(0, 1.2, 0);
    controlsRef.current = controls;

    // --- Lighting ---
    const ambient = new THREE.AmbientLight(0x606060);
    scene.add(ambient);
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(1, 2, 1);
    mainLight.castShadow = true;
    scene.add(mainLight);
    const fillLight = new THREE.PointLight(0x88aaff, 0.5);
    fillLight.position.set(-1, 1.5, 1);
    scene.add(fillLight);
    const backLight = new THREE.PointLight(0xffaa88, 0.6);
    backLight.position.set(0, 1.5, -2);
    scene.add(backLight);

    // --- Create the avatar group ---
    const avatar = new THREE.Group();

    // Torso (suit jacket)
    const torsoGeo = new THREE.BoxGeometry(0.9, 1.0, 0.5);
    const torsoMat = new THREE.MeshStandardMaterial({ color: suitColor, roughness: 0.4 });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = -0.2;
    torso.castShadow = true;
    avatar.add(torso);

    // Tie (only for professional/strict)
    if (style !== 'friendly') {
      const tieGeo = new THREE.BoxGeometry(0.15, 0.4, 0.05);
      const tieMat = new THREE.MeshStandardMaterial({ color: tieColor });
      const tie = new THREE.Mesh(tieGeo, tieMat);
      tie.position.set(0, -0.5, 0.28);
      tie.castShadow = true;
      avatar.add(tie);
    }

    // Head
    const headGeo = new THREE.SphereGeometry(0.55, 64, 64);
    const headMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.2 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.5;
    head.castShadow = true;
    avatar.add(head);

    // Jaw (separate, will be animated)
    const jawGeo = new THREE.SphereGeometry(0.35, 48, 48);
    const jawMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.2 });
    const jaw = new THREE.Mesh(jawGeo, jawMat);
    jaw.position.set(0, -0.15, 0.55);
    jaw.castShadow = true;
    head.add(jaw);
    jawRef.current = jaw;

    // Eyes (white)
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const leftEyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 32), eyeWhiteMat);
    leftEyeWhite.position.set(-0.2, 0.2, 0.6);
    head.add(leftEyeWhite);
    const rightEyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 32), eyeWhiteMat);
    rightEyeWhite.position.set(0.2, 0.2, 0.6);
    head.add(rightEyeWhite);

    // Pupils
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.07, 32, 32), pupilMat);
    leftPupil.position.set(-0.2, 0.18, 0.72);
    head.add(leftPupil);
    const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.07, 32, 32), pupilMat);
    rightPupil.position.set(0.2, 0.18, 0.72);
    head.add(rightPupil);

    // Eyebrows (simple)
    const browMat = new THREE.MeshStandardMaterial({ color: 0x4a2c2c });
    const leftBrow = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.1), browMat);
    leftBrow.position.set(-0.2, 0.42, 0.65);
    leftBrow.rotation.z = -0.1;
    head.add(leftBrow);
    const rightBrow = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.1), browMat);
    rightBrow.position.set(0.2, 0.42, 0.65);
    rightBrow.rotation.z = 0.1;
    head.add(rightBrow);

    // Hair (simple dome)
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a });
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.58, 32, 32), hairMat);
    hair.position.y = 0.75;
    hair.scale.set(1, 0.4, 1);
    head.add(hair);

    // Arms (cylinders)
    const armMat = new THREE.MeshStandardMaterial({ color: suitColor, roughness: 0.4 });
    const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 8), armMat);
    leftArm.position.set(-0.65, 0.0, 0);
    leftArm.rotation.z = 0.3;
    leftArm.castShadow = true;
    avatar.add(leftArm);
    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 8), armMat);
    rightArm.position.set(0.65, 0.0, 0);
    rightArm.rotation.z = -0.3;
    rightArm.castShadow = true;
    avatar.add(rightArm);

    // Hands (spheres) – resting on desk
    const handMat = new THREE.MeshStandardMaterial({ color: skinColor });
    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), handMat);
    leftHand.position.set(-0.92, -0.55, 0.35);
    leftHand.castShadow = true;
    avatar.add(leftHand);
    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), handMat);
    rightHand.position.set(0.92, -0.55, 0.35);
    rightHand.castShadow = true;
    avatar.add(rightHand);

    // Desk (simple plane/box)
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7 });
    const desk = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 1.2), deskMat);
    desk.position.set(0, -0.9, 0.25);
    desk.receiveShadow = true;
    desk.castShadow = true;
    scene.add(desk);

    scene.add(avatar);

    // --- Audio analyser for lip sync ---
    if (audioElement) {
      console.log('[CustomAvatar] Audio element received');
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaElementSource(audioElement);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      analyserRef.current = analyser;
      audioCtx.resume().then(() => console.log('[Audio] Context resumed'));
    }

    // --- Animation loop ---
    let lastTime = 0;
    let lastLogTime = 0;
    const animate = (time: number) => {
      const delta = Math.min(0.033, (time - lastTime) / 1000);
      lastTime = time;

      if (controlsRef.current) controlsRef.current.update();

      // Lip sync – rotate jaw based on audio volume
      if (analyserRef.current && jawRef.current) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const rawVolume = Math.min(1, sum / (data.length * 128));
        volumeRef.current = volumeRef.current * 0.8 + rawVolume * 0.2;
        const jawOpen = volumeRef.current * 0.6; // radians (max ~0.6 rad)

        jawRef.current.rotation.x = jawOpen;

        if (time - lastLogTime > 1000) {
          console.log(`[Volume] raw: ${rawVolume.toFixed(2)}, smoothed: ${volumeRef.current.toFixed(2)}, jaw: ${jawOpen.toFixed(2)}`);
          lastLogTime = time;
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
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      if (controlsRef.current) controlsRef.current.dispose();
    };
  }, [audioElement, style]);

  return <div ref={containerRef} className="w-full h-full rounded-xl" />;
}