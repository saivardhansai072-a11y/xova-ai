import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { AvatarState, colorToThree, createGlowDiscTexture, createPortraitTextureSet } from "./utils";

interface AvatarPortraitSceneProps {
  imageUrl: string;
  state: AvatarState;
  audioElement?: HTMLAudioElement | null;
  glowColor: string;
}

function Particles({ color, state }: { color: string; state: AvatarState }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = state === "speaking" ? 34 : state === "thinking" ? 24 : 18;

  const positions = useMemo(() => {
    const values = new Float32Array(count * 3);

    for (let index = 0; index < count; index += 1) {
      const radius = 0.9 + Math.random() * 0.55;
      const angle = Math.random() * Math.PI * 2;
      values[index * 3] = Math.cos(angle) * radius;
      values[index * 3 + 1] = (Math.random() - 0.5) * 2.6;
      values[index * 3 + 2] = Math.sin(angle) * radius * 0.45;
    }

    return values;
  }, [count]);

  const particleColor = useMemo(() => colorToThree(color), [color]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    const attribute = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const riseSpeed = state === "speaking" ? 0.85 : state === "thinking" ? 0.45 : 0.28;

    for (let index = 0; index < attribute.count; index += 1) {
      const y = attribute.getY(index) + delta * riseSpeed * (0.85 + (index % 5) * 0.1);
      const wrappedY = y > 1.45 ? -1.3 : y;
      attribute.setY(index, wrappedY);
      attribute.setX(index, attribute.getX(index) + Math.sin(wrappedY * 1.8 + index) * delta * 0.06);
    }

    attribute.needsUpdate = true;
    pointsRef.current.rotation.z += delta * 0.06;
  });

  return (
    <points ref={pointsRef} position={[0, 0.1, -0.25]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial
        color={particleColor}
        size={0.03}
        transparent
        opacity={0.45}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}

function EnergyPedestal({ color, state }: { color: string; state: AvatarState }) {
  const discRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const backAuraRef = useRef<THREE.Mesh>(null);

  const glow = useMemo(() => colorToThree(color), [color]);
  const glowTexture = useMemo(() => createGlowDiscTexture(glow), [glow]);

  useEffect(() => {
    return () => {
      glowTexture.dispose();
    };
  }, [glowTexture]);

  useFrame((_, delta) => {
    if (discRef.current) {
      const material = discRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = state === "speaking" ? 0.34 : state === "thinking" ? 0.24 : 0.18;
      discRef.current.rotation.z += delta * 0.06;
      const scale = state === "speaking" ? 1.04 + Math.sin(Date.now() * 0.007) * 0.03 : 1.01;
      discRef.current.scale.setScalar(scale);
    }

    if (ringRef.current) {
      const material = ringRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = state === "speaking" ? 0.55 : 0.34;
      ringRef.current.rotation.z -= delta * (state === "speaking" ? 0.45 : 0.18);
    }

    if (backAuraRef.current) {
      const material = backAuraRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = state === "speaking" ? 0.14 : 0.09;
      backAuraRef.current.scale.set(1, 1 + Math.sin(Date.now() * 0.004) * 0.04, 1);
    }
  });

  return (
    <group position={[0, -1.12, 0]}>
      <mesh ref={backAuraRef} position={[0, 0.17, -0.42]}>
        <planeGeometry args={[1.9, 0.7]} />
        <meshBasicMaterial
          map={glowTexture}
          color={glow}
          transparent
          opacity={0.1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={discRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.95, 64]} />
        <meshBasicMaterial
          map={glowTexture}
          color={glow}
          transparent
          opacity={0.2}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.46, 0.82, 64]} />
        <meshBasicMaterial
          color={glow}
          transparent
          opacity={0.4}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export default function AvatarPortraitScene({ imageUrl, state, audioElement, glowColor }: AvatarPortraitSceneProps) {
  const rigRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const echoRef = useRef<THREE.Mesh>(null);
  const frontRef = useRef<THREE.Mesh>(null);
  const rimRef = useRef<THREE.Mesh>(null);
  const backlightRef = useRef<THREE.Mesh>(null);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const lastAudioRef = useRef<HTMLAudioElement | null>(null);
  const timeRef = useRef(0);
  const intensityRef = useRef(0);

  const sourceTexture = useLoader(THREE.TextureLoader, imageUrl);
  const glow = useMemo(() => colorToThree(glowColor), [glowColor]);
  const textureSet = useMemo(
    () => createPortraitTextureSet(sourceTexture.image as HTMLImageElement | HTMLCanvasElement | ImageBitmap),
    [sourceTexture.image],
  );
  const glowTexture = useMemo(() => createGlowDiscTexture(glow), [glow]);

  useEffect(() => {
    return () => {
      textureSet.portraitTexture.dispose();
      textureSet.depthTexture.dispose();
      glowTexture.dispose();
    };
  }, [glowTexture, textureSet]);

  const connectAudio = useCallback((audio: HTMLAudioElement) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      if (audioContextRef.current.state === "suspended") {
        void audioContextRef.current.resume().catch(() => undefined);
      }

      if (lastAudioRef.current !== audio) {
        sourceRef.current?.disconnect();
        sourceRef.current = audioContextRef.current.createMediaElementSource(audio);
        lastAudioRef.current = audio;
      }

      analyserRef.current?.disconnect();
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.45;

      sourceRef.current?.connect(analyser);
      analyser.connect(audioContextRef.current.destination);
      analyserRef.current = analyser;
    } catch {
      analyserRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!audioElement) {
      analyserRef.current = null;
      return;
    }

    connectAudio(audioElement);

    return () => {
      try {
        analyserRef.current?.disconnect();
      } catch {
        // noop
      }
      analyserRef.current = null;
    };
  }, [audioElement, connectAudio]);

  useFrame((frameState, delta) => {
    if (!rigRef.current || !frontRef.current || !echoRef.current || !rimRef.current || !backlightRef.current || !shadowRef.current) {
      return;
    }

    timeRef.current += delta;
    const time = timeRef.current;

    let targetIntensity = 0;

    if (analyserRef.current && state === "speaking") {
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(data);
      let sum = 0;
      for (let index = 4; index < 38; index += 1) {
        sum += data[index];
      }
      targetIntensity = Math.min(1, sum / (34 * 150));
    } else if (state === "speaking") {
      targetIntensity = 0.34 + Math.sin(time * 8.4) * 0.14 + Math.sin(time * 13.5) * 0.08;
    } else if (state === "listening") {
      targetIntensity = 0.2 + Math.sin(time * 4) * 0.08;
    } else if (state === "thinking") {
      targetIntensity = 0.15 + Math.sin(time * 2.2) * 0.05;
    }

    intensityRef.current = THREE.MathUtils.lerp(intensityRef.current, targetIntensity, 0.16);
    const intensity = intensityRef.current;

    const pointerX = frameState.pointer.x * 0.2;
    const pointerY = -frameState.pointer.y * 0.09;

    const targetRotationY =
      pointerX +
      (state === "speaking" ? Math.sin(time * 1.5) * 0.08 : state === "thinking" ? Math.sin(time * 0.8) * 0.12 : Math.sin(time * 0.6) * 0.04);
    const targetRotationX =
      pointerY +
      (state === "thinking" ? -0.05 : state === "listening" ? -0.02 : 0.01 + Math.sin(time * 0.5) * 0.02);

    rigRef.current.rotation.y = THREE.MathUtils.lerp(rigRef.current.rotation.y, targetRotationY, 0.08);
    rigRef.current.rotation.x = THREE.MathUtils.lerp(rigRef.current.rotation.x, targetRotationX, 0.08);
    rigRef.current.position.y =
      Math.sin(time * 0.9) * 0.04 +
      (state === "speaking" ? Math.sin(time * 6) * 0.02 : 0) +
      (state === "celebrating" ? Math.abs(Math.sin(time * 4)) * 0.12 : 0);

    frontRef.current.position.z = THREE.MathUtils.lerp(frontRef.current.position.z, 0.12 + intensity * 0.08, 0.12);
    frontRef.current.scale.setScalar(1.02 + intensity * 0.04 + (state === "listening" ? 0.014 : 0));
    frontRef.current.rotation.z = state === "thinking" ? Math.sin(time * 1.3) * 0.018 : Math.sin(time * 1.7) * 0.008;
    (frontRef.current.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.08 + intensity * 0.14;

    echoRef.current.position.x = Math.sin(time * 1.6) * 0.018 + pointerX * 0.06;
    echoRef.current.position.y = 0.03 + Math.cos(time * 1.1) * 0.015;
    echoRef.current.position.z = -0.02 + intensity * 0.04;
    echoRef.current.scale.setScalar(1.03 + intensity * 0.03);
    (echoRef.current.material as THREE.MeshStandardMaterial).opacity = 0.28 + intensity * 0.1;

    rimRef.current.position.x = 0.04 + pointerX * 0.12;
    rimRef.current.position.y = 0.05 + pointerY * 0.08;
    rimRef.current.position.z = 0.18 + intensity * 0.04;
    (rimRef.current.material as THREE.MeshBasicMaterial).opacity = 0.08 + intensity * 0.18;

    shadowRef.current.position.x = 0.06 + pointerX * 0.2;
    shadowRef.current.position.y = -0.05 + pointerY * 0.08;
    (shadowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.14 + intensity * 0.06;

    backlightRef.current.scale.setScalar(1.08 + intensity * 0.08 + Math.sin(time * 1.1) * 0.03);
    (backlightRef.current.material as THREE.MeshBasicMaterial).opacity =
      state === "speaking" ? 0.26 + intensity * 0.2 : state === "thinking" ? 0.18 : 0.12;
  });

  return (
    <group>
      <EnergyPedestal color={glowColor} state={state} />

      <mesh ref={backlightRef} position={[0, 0.18, -0.58]}>
        <circleGeometry args={[1.24, 64]} />
        <meshBasicMaterial
          map={glowTexture}
          color={glow}
          transparent
          opacity={0.14}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      <group ref={rigRef} position={[0, 0.12, 0]}>
        <mesh ref={shadowRef} position={[0.06, -0.05, -0.18]} scale={[1.07, 1.07, 1]}>
          <planeGeometry args={[1.7, 2.14]} />
          <meshBasicMaterial
            map={textureSet.portraitTexture}
            color={0x000000}
            transparent
            opacity={0.15}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        <mesh ref={echoRef} position={[0, 0.03, -0.02]} scale={[1.03, 1.03, 1]}>
          <planeGeometry args={[1.66, 2.1, 104, 104]} />
          <meshStandardMaterial
            map={textureSet.portraitTexture}
            transparent
            alphaTest={0.12}
            displacementMap={textureSet.depthTexture}
            displacementScale={0.05}
            emissive={glow}
            emissiveIntensity={0.08}
            opacity={0.32}
            depthWrite={false}
            roughness={0.42}
            metalness={0.02}
            side={THREE.DoubleSide}
          />
        </mesh>

        <mesh ref={frontRef} position={[0, 0.02, 0.12]}>
          <planeGeometry args={[1.62, 2.06, 128, 128]} />
          <meshPhysicalMaterial
            map={textureSet.portraitTexture}
            transparent
            alphaTest={0.12}
            displacementMap={textureSet.depthTexture}
            displacementScale={0.12}
            roughness={0.34}
            metalness={0.02}
            clearcoat={0.52}
            clearcoatRoughness={0.46}
            emissive={glow}
            emissiveIntensity={0.09}
            side={THREE.DoubleSide}
          />
        </mesh>

        <mesh ref={rimRef} position={[0.04, 0.05, 0.18]} scale={[1.02, 1.02, 1]}>
          <planeGeometry args={[1.68, 2.12]} />
          <meshBasicMaterial
            map={textureSet.portraitTexture}
            color={glow}
            transparent
            opacity={0.12}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </group>

      <Particles color={glowColor} state={state} />
    </group>
  );
}