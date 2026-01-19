"use client";

import { useRef, useMemo, ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { useFBO, Html, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { Item } from "@/components/ui/item";

import dispersionVertexShader from "../shaders/dispersionVertexShader.glsl";
import dispersionFragmentShader from "../shaders/dispersionFragmentShader.glsl";

const DISPERSION_CONFIG = {
  IOR: {
    RED: 1.15,
    YELLOW: 1.16,
    GREEN: 1.18,
    CYAN: 1.22,
    BLUE: 1.24,
    PURPLE: 1.28,
  },
  REFRACTION_POWER: 0.2,
  CHROMATIC_ABERRATION: 0.3,
  SATURATION: 1.1,
  SHININESS: 60.0,
  DIFFUSENESS: 0.3,
  FRESNEL_POWER: 3.0,
  LIGHT_POSITION: new THREE.Vector3(2.0, 2.0, 2.0),
} as const;

const FRAME_DEFAULTS = {
  DEPTH: 0.1,
  BORDER_RADIUS: 1,
  SMOOTHNESS: 5,
  MAX_PIXEL_RATIO: 5,
} as const;

interface GlassFrameProps {
  width: number;
  height: number;
  depth?: number;
  children?: ReactNode;
}

export const GlassFrame = ({
  width,
  height,
  depth = FRAME_DEFAULTS.DEPTH,
  children,
}: GlassFrameProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const mainRenderTarget = useFBO();
  const backRenderTarget = useFBO();

  const uniforms = useMemo(
    () => ({
      uTexture: { value: null },
      winResolution: {
        value: new THREE.Vector2(
          typeof window !== 'undefined' ? window.innerWidth : 1920,
          typeof window !== 'undefined' ? window.innerHeight : 1080
        ).multiplyScalar(
          typeof window !== 'undefined'
            ? Math.min(window.devicePixelRatio, FRAME_DEFAULTS.MAX_PIXEL_RATIO)
            : 1
        ),
      },
      uIorR: { value: DISPERSION_CONFIG.IOR.RED },
      uIorY: { value: DISPERSION_CONFIG.IOR.YELLOW },
      uIorG: { value: DISPERSION_CONFIG.IOR.GREEN },
      uIorC: { value: DISPERSION_CONFIG.IOR.CYAN },
      uIorB: { value: DISPERSION_CONFIG.IOR.BLUE },
      uIorP: { value: DISPERSION_CONFIG.IOR.PURPLE },
      uRefractPower: { value: DISPERSION_CONFIG.REFRACTION_POWER },
      uChromaticAberration: { value: DISPERSION_CONFIG.CHROMATIC_ABERRATION },
      uSaturation: { value: DISPERSION_CONFIG.SATURATION },
      uShininess: { value: DISPERSION_CONFIG.SHININESS },
      uDiffuseness: { value: DISPERSION_CONFIG.DIFFUSENESS },
      uFresnelPower: { value: DISPERSION_CONFIG.FRESNEL_POWER },
      uLight: { value: DISPERSION_CONFIG.LIGHT_POSITION },
    }),
    []
  );

  useFrame((state) => {
    const { gl, scene, camera } = state;

    if (!meshRef.current) return;

    renderBackside(gl, scene, camera, meshRef.current, backRenderTarget);
    renderFrontside(gl, scene, camera, meshRef.current, mainRenderTarget);

    gl.setRenderTarget(null);
  });

  return (
    <>
      <RoundedBox
        ref={meshRef}
        args={[width, height, depth]}
        radius={FRAME_DEFAULTS.BORDER_RADIUS}
        smoothness={FRAME_DEFAULTS.SMOOTHNESS}
      >
        <shaderMaterial
          vertexShader={dispersionVertexShader}
          fragmentShader={dispersionFragmentShader}
          uniforms={uniforms}
        />
      </RoundedBox>

      {children && (
        <Html center transform distanceFactor={5}>
          <Item variant="default" className="border-0">
            {children}
          </Item>
        </Html>
      )}
    </>
  );
};

function renderBackside(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  mesh: THREE.Mesh,
  renderTarget: THREE.WebGLRenderTarget
) {
  mesh.visible = false;

  gl.setRenderTarget(renderTarget);
  gl.render(scene, camera);

  // @ts-ignore - ShaderMaterial uniforms are not properly typed in Three.js types
  // The material is guaranteed to be ShaderMaterial at runtime, but TypeScript doesn't know this
  mesh.material.uniforms.uTexture.value = renderTarget.texture;
  // @ts-ignore - ShaderMaterial side property exists but isn't in the base Material type
  mesh.material.side = THREE.BackSide;
  mesh.visible = true;
}

function renderFrontside(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  mesh: THREE.Mesh,
  renderTarget: THREE.WebGLRenderTarget
) {
  gl.setRenderTarget(renderTarget);
  gl.render(scene, camera);

  // @ts-ignore - ShaderMaterial uniforms are not properly typed in Three.js types
  // The material is guaranteed to be ShaderMaterial at runtime, but TypeScript doesn't know this
  mesh.material.uniforms.uTexture.value = renderTarget.texture;
  // @ts-ignore - ShaderMaterial side property exists but isn't in the base Material type
  mesh.material.side = THREE.FrontSide;
}
