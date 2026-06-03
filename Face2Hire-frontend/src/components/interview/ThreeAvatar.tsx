import { useEffect, useRef, useState } from 'react';
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
  const animationIdRef = useRef<number | null>(null);
  const volumeRef = useRef(0);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [audioActive, setAudioActive] = useState(false);

  const modelMap: Record<AvatarStyle, string> = {
    professional: '/models/interviewer_rigged.glb',
    friendly: '/models/interview.glb',
    strict: '/models/interview.glb',
  };
  const modelUrl = modelMap[style];

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

    // Strong lighting
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
        // ✅ FIX: rotate to face the camera
        model.rotation.y = -Math.PI / 2;

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        model.position.sub(center);

        // Massive size
        const targetHeight = 8.0;
        const scale = targetHeight / maxDim;
        model.scale.set(scale, scale, scale);

        // Lift way up
        model.position.y += 2.5;

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = false;
          }
          if (child instanceof THREE.Bone && child.name.toLowerCase().includes('jaw')) {
            jawBoneRef.current = child;
            console.log('✅ Jaw bone found:', child.name);
          }
        });

        scene.add(model);
        mixerRef.current = new THREE.AnimationMixer(model);
        if (gltf.animations.length) {
          mixerRef.current.clipAction(gltf.animations[0]).play();
        }

        const distance = targetHeight / (2 * Math.tan((camera.fov * Math.PI) / 360));
        camera.position.set(0, targetHeight * 0.55, distance * 1.2);
        controls.target.set(0, targetHeight * 0.45, 0);
        controls.update();
      },
      undefined,
      (error: unknown) => {
        console.error('Error loading 3D model:', error);
        // Fallback large head
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

    if (audioElement) {
      console.log('[ThreeAvatar] Audio element received');
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaElementSource(audioElement);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      analyserRef.current = analyser;
      audioCtx.resume().then(() => {
        console.log('[Audio] Context resumed');
        setAudioActive(true);
      });
    } else {
      console.warn('[ThreeAvatar] No audio element provided');
    }

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
        const rawVolume = Math.min(1, sum / (data.length * 128));
        volumeRef.current = volumeRef.current * 0.85 + rawVolume * 0.15;
        const jawOpen = volumeRef.current * 0.55;

        if (time - lastLogTime > 1000) {
          console.log(`[Volume] raw: ${rawVolume.toFixed(2)}, jaw: ${jawOpen.toFixed(2)}`);
          lastLogTime = time;
        }

        // ✅ FIX: jaw rotation on Y axis (as tested in Blender)
        if (jawBoneRef.current instanceof THREE.Bone) {
          jawBoneRef.current.rotation.y = jawOpen;   // or -jawOpen if needed
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
    };
  }, [modelUrl, audioElement]);

  // --- Test Jaw button (debug) ---
  const testJaw = () => {
    if (jawBoneRef.current) {
      console.log('Testing jaw on Y axis');
      jawBoneRef.current.rotation.y = 0.6;
      setTimeout(() => {
        if (jawBoneRef.current) jawBoneRef.current.rotation.y = 0;
      }, 500);
    } else {
      alert('No jaw bone found');
    }
  };

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






// =============================================================
// import { useEffect, useRef, useState } from 'react';
// import * as THREE from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import type { AvatarStyle } from '../../services/interviewService';

// interface ThreeAvatarProps {
//   style: AvatarStyle;
//   isSpeaking: boolean;
//   audioElement?: HTMLAudioElement;
// }

// export default function ThreeAvatar({ style, isSpeaking, audioElement }: ThreeAvatarProps) {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const jawBoneRef = useRef<THREE.Bone | null>(null);
//   const mixerRef = useRef<THREE.AnimationMixer | null>(null);
//   const analyserRef = useRef<AnalyserNode | null>(null);
//   const animationIdRef = useRef<number | null>(null);
//   const volumeRef = useRef(0);
//   const controlsRef = useRef<OrbitControls | null>(null);
//   const [audioActive, setAudioActive] = useState(false); // for debugging

//   const modelMap: Record<AvatarStyle, string> = {
//     professional: '/models/interview1.glb',
//     friendly: '/models/interview1.glb',
//     strict: '/models/interview1.glb',
//   };
//   const modelUrl = modelMap[style];

//   useEffect(() => {
//     if (!containerRef.current) return;

//     console.log('[ThreeAvatar] Initialising scene');

//     const scene = new THREE.Scene();
//     scene.background = null;
//     const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
//     renderer.setClearColor(0x000000, 0);
//     renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
//     renderer.shadowMap.enabled = true;
//     containerRef.current.appendChild(renderer.domElement);

//     const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
//     camera.position.set(0, 3.0, 6.0);

//     const controls = new OrbitControls(camera, renderer.domElement);
//     controls.enableDamping = true;
//     controls.enableZoom = false;
//     controls.enablePan = true;
//     controls.target.set(0, 2.5, 0);
//     controlsRef.current = controls;

//     // Lighting
//     const ambient = new THREE.AmbientLight(0x707090);
//     scene.add(ambient);
//     const mainLight = new THREE.DirectionalLight(0xffffff, 1.8);
//     mainLight.position.set(1, 2, 1);
//     mainLight.castShadow = true;
//     scene.add(mainLight);
//     const fillLight = new THREE.PointLight(0x88aaff, 0.8);
//     fillLight.position.set(-1, 1.5, 1);
//     scene.add(fillLight);
//     const backLight = new THREE.PointLight(0xffaa88, 1.0);
//     backLight.position.set(0, 2.5, -2.5);
//     scene.add(backLight);

//     const loader = new GLTFLoader();
//     loader.load(
//       modelUrl,
//       (gltf) => {
//         console.log('[ThreeAvatar] Model loaded');
//         const model = gltf.scene;
//         // model.rotation.y = 0;
//         model.rotation.y = -Math.PI/2;   // face forward

//         // Auto‑center and scale
//         const box = new THREE.Box3().setFromObject(model);
//         const center = box.getCenter(new THREE.Vector3());
//         const size = box.getSize(new THREE.Vector3());
//         const maxDim = Math.max(size.x, size.y, size.z);
//         model.position.sub(center);
//         const targetHeight = 8.0;
//         const scale = targetHeight / maxDim;
//         model.scale.set(scale, scale, scale);
//         model.position.y += 2.5;

//         // Find jaw bone
//         let jawFound = false;
//         model.traverse((child) => {
//           if (child instanceof THREE.Mesh) {
//             child.castShadow = true;
//             child.receiveShadow = false;
//           }
//           if (child instanceof THREE.Bone && child.name.toLowerCase().includes('jaw')) {
//             jawBoneRef.current = child;
//             jawFound = true;
//             console.log('✅ Jaw bone found:', child.name);
//           }
//         });
//         if (!jawFound) {
//           console.warn('❌ No jaw bone found in model! Lip sync will not work.');
//         }

//         scene.add(model);
//         mixerRef.current = new THREE.AnimationMixer(model);
//         if (gltf.animations.length) {
//           mixerRef.current.clipAction(gltf.animations[0]).play();
//           console.log('Playing idle animation');
//         }

//         const distance = targetHeight / (2 * Math.tan((camera.fov * Math.PI) / 360));
//         camera.position.set(0, targetHeight * 0.55, distance * 1.2);
//         controls.target.set(0, targetHeight * 0.45, 0);
//         controls.update();
//       },
//       undefined,
//       (error) => console.error('Model load error:', error)
//     );

//     // --- Audio analyser for lip sync (with better logging) ---
//     if (audioElement) {
//       console.log('[ThreeAvatar] Audio element received, setting up analyser');
//       const audioCtx = new AudioContext();
//       const source = audioCtx.createMediaElementSource(audioElement);
//       const analyser = audioCtx.createAnalyser();
//       analyser.fftSize = 256;
//       source.connect(analyser);
//       analyser.connect(audioCtx.destination);
//       analyserRef.current = analyser;
//       audioCtx.resume().then(() => {
//         console.log('[Audio] Context resumed, state:', audioCtx.state);
//         setAudioActive(true);
//       });
//     } else {
//       console.warn('[ThreeAvatar] No audioElement provided');
//     }

//     // --- Animation loop with volume logging ---
//     let lastTime = 0;
//     let lastLogTime = 0;
//     const animate = (time: number) => {
//       const delta = Math.min(0.033, (time - lastTime) / 1000);
//       lastTime = time;

//       if (mixerRef.current) mixerRef.current.update(delta);
//       if (controlsRef.current) controlsRef.current.update();

//       // Process audio volume
//       if (analyserRef.current && jawBoneRef.current) {
//         const data = new Uint8Array(analyserRef.current.frequencyBinCount);
//         analyserRef.current.getByteFrequencyData(data);
//         let sum = 0;
//         for (let i = 0; i < data.length; i++) sum += data[i];
//         const rawVolume = Math.min(1, sum / (data.length * 128));
//         volumeRef.current = volumeRef.current * 0.85 + rawVolume * 0.15;
//         const jawOpen = volumeRef.current * 0.55;

//         // Log volume every second
//         if (time - lastLogTime > 1000) {
//           console.log(`[Volume] raw: ${rawVolume.toFixed(2)}, smoothed: ${volumeRef.current.toFixed(2)}, jaw: ${jawOpen.toFixed(2)}`);
//           lastLogTime = time;
//         }

//         // Apply rotation to jaw bone
//         // Apply rotation to jaw bone – now using Y axis
//       if (jawBoneRef.current instanceof THREE.Bone) {
//         jawBoneRef.current.rotation.y = jawOpen;   // or -jawOpen if needed
//       } else {
//         (jawBoneRef.current as any).scale.y = 1 + jawOpen * 0.8;
//       }
//       } else if (analyserRef.current && !jawBoneRef.current && time - lastLogTime > 5000) {
//         console.warn('[LipSync] No jaw bone – skipping animation');
//         lastLogTime = time;
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
//       if (mixerRef.current) mixerRef.current.stopAllAction();
//       window.removeEventListener('resize', handleResize);
//       if (containerRef.current && renderer.domElement) {
//         containerRef.current.removeChild(renderer.domElement);
//       }
//       renderer.dispose();
//       if (controlsRef.current) controlsRef.current.dispose();
//     };
//   }, [modelUrl, audioElement]);

//   // --- Debug button to test jaw movement ---
//  const testJaw = () => {
//   if (jawBoneRef.current) {
//     console.log('Test: setting jaw rotation.y to 0.5');
//     jawBoneRef.current.rotation.y = 0.5;
//     setTimeout(() => {
//       if (jawBoneRef.current) {
//         console.log('Test: resetting jaw rotation.y to 0');
//         jawBoneRef.current.rotation.y = 0;
//       }
//     }, 1000);
//   } else {
//     console.error('No jaw bone reference');
//     alert('Jaw bone not found!');
//   }
// };

//   return (
//     <div className="relative w-full h-full">
//       <div ref={containerRef} className="w-full h-full rounded-xl" />
//       {/* Debug button – visible only in development */}
//       <button
//         onClick={testJaw}
//         className="absolute bottom-4 left-4 z-50 bg-black/70 text-white px-3 py-1 rounded text-sm"
//       >
//         🧪 Test Jaw
//       </button>
//       {/* Visual indicator that audio is being received */}
//       {audioActive && (
//         <div className="absolute bottom-4 right-4 z-50 bg-green-500/80 text-black px-2 py-1 rounded text-xs">
//           🎤 Audio active
//         </div>
//       )}
//     </div>
//   );
// }

















//=============original working version without lip syncing
// import { useEffect, useRef } from 'react';
// import * as THREE from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import type { AvatarStyle } from '../../services/interviewService';

// interface ThreeAvatarProps {
//   style: AvatarStyle;
//   isSpeaking: boolean;
//   audioElement?: HTMLAudioElement;
// }

// export default function ThreeAvatar({ style, isSpeaking, audioElement }: ThreeAvatarProps) {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const jawBoneRef = useRef<THREE.Bone | null>(null);
//   const mixerRef = useRef<THREE.AnimationMixer | null>(null);
//   const analyserRef = useRef<AnalyserNode | null>(null);
//   const animationIdRef = useRef<number | null>(null);
//   const volumeRef = useRef(0);
//   const controlsRef = useRef<OrbitControls | null>(null);

//   const modelMap: Record<AvatarStyle, string> = {
//     professional: '/models/interview.glb',
//     friendly: '/models/interview.glb',
//     strict: '/models/interview.glb',
//   };
//   const modelUrl = modelMap[style];

//   useEffect(() => {
//     if (!containerRef.current) return;

//     const scene = new THREE.Scene();
//     scene.background = null;

//     const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
//     renderer.setClearColor(0x000000, 0);
//     renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
//     renderer.shadowMap.enabled = true;
//     containerRef.current.appendChild(renderer.domElement);

//     const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
//     camera.position.set(0, 3.0, 6.0);

//     const controls = new OrbitControls(camera, renderer.domElement);
//     controls.enableDamping = true;
//     controls.dampingFactor = 0.05;
//     controls.enableZoom = false;
//     controls.enablePan = true;
//     controls.target.set(0, 2.5, 0);
//     controlsRef.current = controls;

//     // Strong lighting
//     const ambient = new THREE.AmbientLight(0x707090);
//     scene.add(ambient);
//     const mainLight = new THREE.DirectionalLight(0xffffff, 1.8);
//     mainLight.position.set(1, 2, 1);
//     mainLight.castShadow = true;
//     scene.add(mainLight);
//     const fillLight = new THREE.PointLight(0x88aaff, 0.8);
//     fillLight.position.set(-1, 1.5, 1);
//     scene.add(fillLight);
//     const backLight = new THREE.PointLight(0xffaa88, 1.0);
//     backLight.position.set(0, 2.5, -2.5);
//     scene.add(backLight);

//     const loader = new GLTFLoader();
//     loader.load(
//       modelUrl,
//       (gltf) => {
//         const model = gltf.scene;
//         model.rotation.y = 0;

//         const box = new THREE.Box3().setFromObject(model);
//         const center = box.getCenter(new THREE.Vector3());
//         const size = box.getSize(new THREE.Vector3());
//         const maxDim = Math.max(size.x, size.y, size.z);

//         model.position.sub(center);

//         // Massive size
//         const targetHeight = 8.0;
//         const scale = targetHeight / maxDim;
//         model.scale.set(scale, scale, scale);

//         // Lift way up
//         model.position.y += 2.5;

//         model.traverse((child) => {
//           if (child instanceof THREE.Mesh) {
//             child.castShadow = true;
//             child.receiveShadow = false;
//           }
//           if (child instanceof THREE.Bone && child.name.toLowerCase().includes('jaw')) {
//             jawBoneRef.current = child;
//             console.log('✅ Jaw bone found:', child.name);
//           }
//         });

//         scene.add(model);
//         mixerRef.current = new THREE.AnimationMixer(model);
//         if (gltf.animations.length) {
//           mixerRef.current.clipAction(gltf.animations[0]).play();
//         }

//         const distance = targetHeight / (2 * Math.tan((camera.fov * Math.PI) / 360));
//         camera.position.set(0, targetHeight * 0.55, distance * 1.2);
//         controls.target.set(0, targetHeight * 0.45, 0);
//         controls.update();
//       },
//       undefined,
//       (error: unknown) => {
//         console.error('Error loading 3D model:', error);
//         // Fallback large head
//         const headGeo = new THREE.SphereGeometry(1.5, 64, 64);
//         const headMat = new THREE.MeshStandardMaterial({ color: 0xddbb99 });
//         const head = new THREE.Mesh(headGeo, headMat);
//         head.position.y = 1.2;
//         scene.add(head);
//         const jawGeo = new THREE.SphereGeometry(0.8, 32, 32);
//         const jawMat = new THREE.MeshStandardMaterial({ color: 0xccaa88 });
//         const jawMesh = new THREE.Mesh(jawGeo, jawMat);
//         jawMesh.position.set(0, -0.4, 0.9);
//         head.add(jawMesh);
//         jawBoneRef.current = jawMesh as any;
//         camera.position.set(0, 2.5, 6.0);
//         controls.target.set(0, 1.5, 0);
//         controls.update();
//       }
//     );

//     if (audioElement) {
//       const audioCtx = new AudioContext();
//       const source = audioCtx.createMediaElementSource(audioElement);
//       const analyser = audioCtx.createAnalyser();
//       analyser.fftSize = 256;
//       source.connect(analyser);
//       analyser.connect(audioCtx.destination);
//       analyserRef.current = analyser;
//       audioCtx.resume();
//     }

//     let lastTime = 0;
//     const animate = (time: number) => {
//       const delta = Math.min(0.033, (time - lastTime) / 1000);
//       lastTime = time;

//       if (mixerRef.current) mixerRef.current.update(delta);
//       if (controlsRef.current) controlsRef.current.update();

//       if (analyserRef.current && jawBoneRef.current) {
//         const data = new Uint8Array(analyserRef.current.frequencyBinCount);
//         analyserRef.current.getByteFrequencyData(data);
//         let sum = 0;
//         for (let i = 0; i < data.length; i++) sum += data[i];
//         const rawVolume = Math.min(1, sum / (data.length * 128));
//         volumeRef.current = volumeRef.current * 0.8 + rawVolume * 0.2;
//         const jawOpen = volumeRef.current * 0.5;

//         if (jawBoneRef.current instanceof THREE.Bone) {
//           jawBoneRef.current.rotation.x = jawOpen;
//         } else {
//           (jawBoneRef.current as any).scale.y = 1 + jawOpen * 0.8;
//           (jawBoneRef.current as any).position.z = 0.5 + jawOpen * 0.2;
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
//       if (mixerRef.current) mixerRef.current.stopAllAction();
//       window.removeEventListener('resize', handleResize);
//       if (containerRef.current && renderer.domElement) {
//         containerRef.current.removeChild(renderer.domElement);
//       }
//       renderer.dispose();
//       if (controlsRef.current) controlsRef.current.dispose();
//     };
//   }, [modelUrl, audioElement]);

// //   return <div ref={containerRef} className="w-full h-full min-h-[300px] rounded-xl" />;
// return <div ref={containerRef} className="w-full h-full rounded-xl" />;
// }