// import { useEffect, useRef } from 'react';
// import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import type { AvatarStyle } from '../../services/interviewService';

// interface RealisticAvatarProps {
//   style: AvatarStyle;
//   isSpeaking: boolean;
//   audioElement?: HTMLAudioElement;
// }

// export default function RealisticAvatar({ style, isSpeaking, audioElement }: RealisticAvatarProps) {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const jawRef = useRef<THREE.Object3D | null>(null);
//   const analyserRef = useRef<AnalyserNode | null>(null);
//   const animationIdRef = useRef<number | null>(null);
//   const volumeRef = useRef(0);
//   const controlsRef = useRef<OrbitControls | null>(null);

//   // Colors
//   const skinColor = 0xf8d7b0;
//   const skinColorDark = 0xe0b88a;
//   const suitColor = style === 'friendly' ? 0x4a6fa5 : 0x1a2a4a;
//   const suitLapelColor = style === 'friendly' ? 0x3a5a8a : 0x0f1f3a;
//   const shirtColor = 0xf0f0f0;
//   const tieColor = style === 'friendly' ? 0xc41e3a : 0x2c3e50;
//   const hairColor = 0x3a2a1a;
//   const eyeWhiteColor = 0xf8f8f8;
//   const irisColor = 0x4a6741;
//   const pupilColor = 0x000000;
//   const woodColor = 0x8b5a2b;

//   useEffect(() => {
//     if (!containerRef.current) return;

//     // --- Scene setup ---
//     const scene = new THREE.Scene();
//     scene.background = null; // transparent for gradient background
//     scene.fog = new THREE.FogExp2(0x000000, 0.008);

//     const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
//     renderer.setClearColor(0x000000, 0);
//     renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
//     renderer.shadowMap.enabled = true;
//     renderer.shadowMap.type = THREE.PCFSoftShadowMap;
//     containerRef.current.appendChild(renderer.domElement);

//     const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
//     camera.position.set(0, 1.4, 3.2);
//     camera.lookAt(0, 1.1, 0);

//     const controls = new OrbitControls(camera, renderer.domElement);
//     controls.enableDamping = true;
//     controls.enableZoom = true;
//     controls.enablePan = false;
//     controls.target.set(0, 1.2, 0);
//     controlsRef.current = controls;

//     // --- Lighting (studio quality) ---
//     const ambient = new THREE.AmbientLight(0x4a4a6a);
//     scene.add(ambient);
//     const keyLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
//     keyLight.position.set(1, 1.5, 1);
//     keyLight.castShadow = true;
//     keyLight.shadow.mapSize.width = 1024;
//     keyLight.shadow.mapSize.height = 1024;
//     scene.add(keyLight);
//     const fillLight = new THREE.PointLight(0x88aaff, 0.5);
//     fillLight.position.set(-0.8, 1, 1.2);
//     scene.add(fillLight);
//     const rimLight = new THREE.PointLight(0xffaa66, 0.6);
//     rimLight.position.set(0, 1.2, -1.5);
//     scene.add(rimLight);
//     const backLight = new THREE.PointLight(0x6688aa, 0.3);
//     backLight.position.set(0.5, 1.5, -2);
//     scene.add(backLight);
//     const underLight = new THREE.PointLight(0xccaa88, 0.2);
//     underLight.position.set(0, -0.5, 0.8);
//     scene.add(underLight);

//     // --- Helper: create a rounded box (for suit jacket, lapels) ---
//     function roundedBox(width: number, height: number, depth: number, radius: number, color: number): THREE.Mesh {
//       const shape = new THREE.Shape();
//       const x = 0, y = 0;
//       shape.moveTo(x + radius, y);
//       shape.lineTo(x + width - radius, y);
//       shape.quadraticCurveTo(x + width, y, x + width, y + radius);
//       shape.lineTo(x + width, y + height - radius);
//       shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
//       shape.lineTo(x + radius, y + height);
//       shape.quadraticCurveTo(x, y + height, x, y + height - radius);
//       shape.lineTo(x, y + radius);
//       shape.quadraticCurveTo(x, y, x + radius, y);
//       const geometry = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 });
//       geometry.computeVertexNormals();
//       geometry.center();
//       const material = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, metalness: 0.1 });
//       const mesh = new THREE.Mesh(geometry, material);
//       mesh.castShadow = true;
//       mesh.receiveShadow = false;
//       return mesh;
//     }

//     // --- Create avatar group ---
//     const avatar = new THREE.Group();

//     // ---- Torso (suit jacket) ----
//     const torsoGeo = new THREE.CylinderGeometry(0.45, 0.55, 1.0, 12);
//     const torsoMat = new THREE.MeshStandardMaterial({ color: suitColor, roughness: 0.2, metalness: 0.05 });
//     const torso = new THREE.Mesh(torsoGeo, torsoMat);
//     torso.position.y = -0.15;
//     torso.castShadow = true;
//     avatar.add(torso);

//     // Shirt front (white)
//     const shirtGeo = new THREE.BoxGeometry(0.65, 0.8, 0.08);
//     const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.4 });
//     const shirt = new THREE.Mesh(shirtGeo, shirtMat);
//     shirt.position.set(0, 0.05, 0.48);
//     shirt.castShadow = true;
//     avatar.add(shirt);

//     // Tie
//     const tieGroup = new THREE.Group();
//     const tieTopGeo = new THREE.BoxGeometry(0.12, 0.25, 0.03);
//     const tieMat = new THREE.MeshStandardMaterial({ color: tieColor, roughness: 0.2, metalness: 0.1 });
//     const tieTop = new THREE.Mesh(tieTopGeo, tieMat);
//     tieTop.position.y = 0.05;
//     tieGroup.add(tieTop);
//     const tieBodyGeo = new THREE.BoxGeometry(0.1, 0.45, 0.03);
//     const tieBody = new THREE.Mesh(tieBodyGeo, tieMat);
//     tieBody.position.y = -0.2;
//     tieGroup.add(tieBody);
//     const tieKnotGeo = new THREE.SphereGeometry(0.07, 16, 16);
//     const tieKnot = new THREE.Mesh(tieKnotGeo, tieMat);
//     tieKnot.position.y = 0.18;
//     tieGroup.add(tieKnot);
//     tieGroup.position.set(0, -0.2, 0.52);
//     avatar.add(tieGroup);

//     // Suit lapels (simple angled boxes)
//     const lapelMat = new THREE.MeshStandardMaterial({ color: suitLapelColor });
//     const leftLapel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.05), lapelMat);
//     leftLapel.position.set(-0.35, 0.1, 0.48);
//     leftLapel.rotation.z = 0.2;
//     avatar.add(leftLapel);
//     const rightLapel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.05), lapelMat);
//     rightLapel.position.set(0.35, 0.1, 0.48);
//     rightLapel.rotation.z = -0.2;
//     avatar.add(rightLapel);

//     // ---- Head (more realistic shape: ellipsoid) ----
//     const headGeo = new THREE.SphereGeometry(0.52, 64, 64);
//     const headMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.2, metalness: 0.02 });
//     const head = new THREE.Mesh(headGeo, headMat);
//     head.position.y = 0.65;
//     head.castShadow = true;
//     avatar.add(head);

//     // Jaw (lower face) – separate object for lip sync
//     const jawGeo = new THREE.SphereGeometry(0.38, 48, 48);
//     const jawMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.2 });
//     const jaw = new THREE.Mesh(jawGeo, jawMat);
//     jaw.position.set(0, 0.15, 0.58);
//     jaw.castShadow = true;
//     head.add(jaw);
//     jawRef.current = jaw;

//     // Mouth line (simple dark cylinder)
//     const mouthGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.03, 8);
//     const mouthMat = new THREE.MeshStandardMaterial({ color: 0xaa7a5a });
//     const mouth = new THREE.Mesh(mouthGeo, mouthMat);
//     mouth.rotation.x = Math.PI / 2;
//     mouth.position.set(0, -0.05, 0.72);
//     jaw.add(mouth);

//     // Nose (pyramid-like)
//     const noseGeo = new THREE.ConeGeometry(0.12, 0.15, 16);
//     const noseMat = new THREE.MeshStandardMaterial({ color: skinColorDark });
//     const nose = new THREE.Mesh(noseGeo, noseMat);
//     nose.position.set(0, 0.25, 0.72);
//     head.add(nose);
//     const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), noseMat);
//     noseTip.position.set(0, 0.18, 0.82);
//     head.add(noseTip);

//     // Eyes – detailed (white, iris, pupil, cornea)
//     const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.1, metalness: 0.1 });
//     const irisMat = new THREE.MeshStandardMaterial({ color: irisColor, roughness: 0.2 });
//     const pupilMat = new THREE.MeshStandardMaterial({ color: pupilColor });
//     const corneaMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x224466, emissiveIntensity: 0.1, transparent: true, opacity: 0.3 });

//     function addEye(x: number) {
//       const eyeGroup = new THREE.Group();
//       const white = new THREE.Mesh(new THREE.SphereGeometry(0.12, 48, 48), eyeWhiteMat);
//       white.castShadow = true;
//       eyeGroup.add(white);
//       const iris = new THREE.Mesh(new THREE.SphereGeometry(0.07, 32, 32), irisMat);
//       iris.position.z = 0.06;
//       eyeGroup.add(iris);
//       const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 32, 32), pupilMat);
//       pupil.position.z = 0.1;
//       eyeGroup.add(pupil);
//       const cornea = new THREE.Mesh(new THREE.SphereGeometry(0.09, 48, 48), corneaMat);
//       cornea.position.z = 0.08;
//       eyeGroup.add(cornea);
//       eyeGroup.position.set(x, 0.38, 0.65);
//       head.add(eyeGroup);
//     }
//     addEye(-0.2);
//     addEye(0.2);

//     // Eyelids (simple curved cylinders)
//     const eyelidMat = new THREE.MeshStandardMaterial({ color: skinColorDark });
//     const upperLidLeft = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.04, 16, 32, Math.PI), eyelidMat);
//     upperLidLeft.rotation.x = -0.3;
//     upperLidLeft.position.set(-0.2, 0.45, 0.72);
//     head.add(upperLidLeft);
//     const upperLidRight = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.04, 16, 32, Math.PI), eyelidMat);
//     upperLidRight.rotation.x = -0.3;
//     upperLidRight.position.set(0.2, 0.45, 0.72);
//     head.add(upperLidRight);

//     // Eyebrows
//     const browMat = new THREE.MeshStandardMaterial({ color: 0x4a2c2c });
//     const leftBrow = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.1), browMat);
//     leftBrow.position.set(-0.22, 0.55, 0.68);
//     leftBrow.rotation.z = -0.15;
//     head.add(leftBrow);
//     const rightBrow = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.1), browMat);
//     rightBrow.position.set(0.22, 0.55, 0.68);
//     rightBrow.rotation.z = 0.15;
//     head.add(rightBrow);

//     // Ears
//     const earMat = new THREE.MeshStandardMaterial({ color: skinColorDark });
//     const leftEar = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 24), earMat);
//     leftEar.position.set(-0.55, 0.45, 0);
//     leftEar.scale.set(0.5, 1, 0.8);
//     head.add(leftEar);
//     const rightEar = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 24), earMat);
//     rightEar.position.set(0.55, 0.45, 0);
//     rightEar.scale.set(0.5, 1, 0.8);
//     head.add(rightEar);

//     // Hair – complex styling (multiple toruses and cylinders)
//     const hairMatMain = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.6 });
//     const hairBase = new THREE.Mesh(new THREE.SphereGeometry(0.54, 32, 32), hairMatMain);
//     hairBase.position.y = 0.85;
//     hairBase.scale.set(1, 0.45, 1);
//     head.add(hairBase);
//     // Top hair strands
//     for (let i = -4; i <= 4; i++) {
//       const strand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.2, 6), hairMatMain);
//       strand.position.set(i * 0.1, 0.93, -0.1);
//       strand.rotation.x = 0.3;
//       head.add(strand);
//     }
//     // Side hair
//     const sideHairLeft = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), hairMatMain);
//     sideHairLeft.position.set(-0.55, 0.72, -0.1);
//     sideHairLeft.scale.set(0.6, 0.8, 0.6);
//     head.add(sideHairLeft);
//     const sideHairRight = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), hairMatMain);
//     sideHairRight.position.set(0.55, 0.72, -0.1);
//     sideHairRight.scale.set(0.6, 0.8, 0.6);
//     head.add(sideHairRight);

//     // ---- Arms and hands (with fingers) ----
//     const armMat = new THREE.MeshStandardMaterial({ color: suitColor, roughness: 0.3 });
//     const shirtArmMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.4 });
//     const handMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.3 });

//     // Left arm (sleeve)
//     const leftArmSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.7, 8), armMat);
//     leftArmSleeve.position.set(-0.68, 0.1, 0);
//     leftArmSleeve.rotation.z = 0.35;
//     leftArmSleeve.castShadow = true;
//     avatar.add(leftArmSleeve);
//     // Shirt cuff
//     const leftCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 8), shirtArmMat);
//     leftCuff.position.set(-0.86, -0.2, 0.15);
//     leftCuff.rotation.z = 0.35;
//     avatar.add(leftCuff);
//     // Left hand (with fingers)
//     const leftHand = new THREE.Group();
//     const palm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.22), handMat);
//     palm.position.set(0, 0, 0);
//     leftHand.add(palm);
//     // Fingers (simple cylinders)
//     const fingerGeo = new THREE.CylinderGeometry(0.04, 0.035, 0.12, 6);
//     for (let i = -1; i <= 1; i++) {
//       const finger = new THREE.Mesh(fingerGeo, handMat);
//       finger.position.set(i * 0.055, 0.07, 0.1);
//       finger.rotation.x = 0.2;
//       leftHand.add(finger);
//     }
//     const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.11, 6), handMat);
//     thumb.position.set(-0.09, -0.02, 0.12);
//     thumb.rotation.z = -0.4;
//     leftHand.add(thumb);
//     leftHand.position.set(-0.88, -0.35, 0.32);
//     leftHand.rotation.z = 0.1;
//     leftHand.castShadow = true;
//     avatar.add(leftHand);

//     // Right arm (sleeve)
//     const rightArmSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.7, 8), armMat);
//     rightArmSleeve.position.set(0.68, 0.1, 0);
//     rightArmSleeve.rotation.z = -0.35;
//     rightArmSleeve.castShadow = true;
//     avatar.add(rightArmSleeve);
//     // Shirt cuff
//     const rightCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 8), shirtArmMat);
//     rightCuff.position.set(0.86, -0.2, 0.15);
//     rightCuff.rotation.z = -0.35;
//     avatar.add(rightCuff);
//     // Right hand
//     const rightHand = new THREE.Group();
//     const palmR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.22), handMat);
//     palmR.position.set(0, 0, 0);
//     rightHand.add(palmR);
//     for (let i = -1; i <= 1; i++) {
//       const finger = new THREE.Mesh(fingerGeo, handMat);
//       finger.position.set(i * 0.055, 0.07, 0.1);
//       finger.rotation.x = 0.2;
//       rightHand.add(finger);
//     }
//     const thumbR = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.11, 6), handMat);
//     thumbR.position.set(0.09, -0.02, 0.12);
//     thumbR.rotation.z = 0.4;
//     rightHand.add(thumbR);
//     rightHand.position.set(0.88, -0.35, 0.32);
//     rightHand.rotation.z = -0.1;
//     rightHand.castShadow = true;
//     avatar.add(rightHand);

//     // ---- Desk (wooden) ----
//     const deskMatWood = new THREE.MeshStandardMaterial({ color: woodColor, roughness: 0.7, metalness: 0.05 });
//     const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 1.4), deskMatWood);
//     deskTop.position.set(0, -0.85, 0.3);
//     deskTop.receiveShadow = true;
//     deskTop.castShadow = true;
//     scene.add(deskTop);
//     const deskFront = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 0.08), deskMatWood);
//     deskFront.position.set(0, -0.62, 0.82);
//     deskFront.receiveShadow = true;
//     scene.add(deskFront);

//     scene.add(avatar);

//     // --- Audio analyser for lip sync ---
//     if (audioElement) {
//       const audioCtx = new AudioContext();
//       const source = audioCtx.createMediaElementSource(audioElement);
//       const analyser = audioCtx.createAnalyser();
//       analyser.fftSize = 256;
//       source.connect(analyser);
//       analyser.connect(audioCtx.destination);
//       analyserRef.current = analyser;
//       audioCtx.resume();
//       console.log('[RealisticAvatar] Audio analyser ready');
//     }

//     // --- Animation loop ---
//     let lastTime = 0;
//     let lastLog = 0;
//     const animate = (time: number) => {
//       const delta = Math.min(0.033, (time - lastTime) / 1000);
//       lastTime = time;

//       if (controlsRef.current) controlsRef.current.update();

//       if (analyserRef.current && jawRef.current) {
//         const data = new Uint8Array(analyserRef.current.frequencyBinCount);
//         analyserRef.current.getByteFrequencyData(data);
//         let sum = 0;
//         for (let i = 0; i < data.length; i++) sum += data[i];
//         const rawVolume = Math.min(1, sum / (data.length * 128));
//         volumeRef.current = volumeRef.current * 0.8 + rawVolume * 0.2;
//         const jawOpen = volumeRef.current * 0.55;
//         jawRef.current.rotation.x = jawOpen;
//         if (time - lastLog > 1000) {
//           console.log(`[Volume] ${rawVolume.toFixed(2)} → jaw ${jawOpen.toFixed(2)}`);
//           lastLog = time;
//         }
//       }

//       renderer.render(scene, camera);
//       animationIdRef.current = requestAnimationFrame(animate);
//     };
//     animate(0);

//     const handleResize = () => {
//       if (!containerRef.current) return;
//       const { clientWidth, clientHeight } = containerRef.current;
//       renderer.setSize(clientWidth, clientHeight);
//       camera.aspect = clientWidth / clientHeight;
//       camera.updateProjectionMatrix();
//       if (controlsRef.current) controlsRef.current.update();
//     };
//     window.addEventListener('resize', handleResize);
//     handleResize();

//     return () => {
//       if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
//       window.removeEventListener('resize', handleResize);
//       if (containerRef.current && renderer.domElement) containerRef.current.removeChild(renderer.domElement);
//       renderer.dispose();
//       if (controlsRef.current) controlsRef.current.dispose();
//     };
//   }, [audioElement, style]);

//   return <div ref={containerRef} className="w-full h-full rounded-xl" style={{ position: 'relative' }} />;
// }