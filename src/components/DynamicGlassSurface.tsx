"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface DynamicGlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  borderRadius?: number;
  refractionStrength?: number;
  rimIntensity?: number;
  rimSharpness?: number;
  parallaxFactor?: number;
  interactive?: boolean;
  className?: string;
}

// Vertex Shader: Fullscreen quad with normalized UV coordinates
const vertexShaderSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = (a_position + 1.0) * 0.5;
    v_uv.y = 1.0 - v_uv.y; // Flip Y for optical texture alignment
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Fragment Shader: SDF Convex Lens, Gyroscopic Tilt, Schlick Fresnel, and Thin-Film Iridescence
const fragmentShaderSource = `
  precision mediump float;
  varying vec2 v_uv;

  uniform vec2 u_resolution;
  uniform float u_radius;
  uniform vec2 u_light_pos;
  uniform vec2 u_tilt;
  uniform float u_time;
  uniform float u_refraction;
  uniform float u_rim_intensity;
  uniform float u_rim_sharpness;
  uniform float u_parallax;

  // Signed Distance Field for Rounded Rectangle
  float sdRoundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + vec2(r);
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
  }

  void main() {
    vec2 halfSize = u_resolution * 0.5;
    vec2 pixelCoord = v_uv * u_resolution;
    vec2 p = pixelCoord - halfSize;
    float r = min(u_radius, min(halfSize.x, halfSize.y));

    // Calculate signed distance to glass edge
    float dist = sdRoundedBox(p, halfSize, r);

    // Outside the rounded rectangle: discard / transparent
    if (dist > 1.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      return;
    }

    // 1. Physical Normal Estimation from SDF gradient
    float eps = 1.0;
    float dX = sdRoundedBox(p + vec2(eps, 0.0), halfSize, r) - sdRoundedBox(p - vec2(eps, 0.0), halfSize, r);
    float dY = sdRoundedBox(p + vec2(0.0, eps), halfSize, r) - sdRoundedBox(p - vec2(0.0, eps), halfSize, r);
    vec2 grad = vec2(dX, dY) / (2.0 * eps);

    // Parabolic Dome Convexity: Lens curvature increases toward center
    vec2 normP = p / halfSize;
    float domeProfile = sqrt(max(0.0, 1.0 - dot(normP, normP) * 0.45));
    float edgeDist = clamp(-dist / max(1.0, r), 0.0, 1.0);

    // 3D Surface normal: Beveled rim curvature + subtle gyroscopic tilt displacement
    float zComponent = sqrt(max(0.0, 1.0 - dot(grad, grad) * 0.75)) * domeProfile;
    vec3 normal = normalize(vec3(grad + u_tilt * 0.25 * (1.0 - edgeDist), max(0.15, zComponent)));

    // 2. Refraction Displacement Field with Tri-Channel Chromatic Dispersion
    vec2 baseDisplacement = normP * (1.0 - edgeDist) * u_refraction;
    // Radial center magnification (1.04x)
    vec2 centerMagnify = normP * 0.015 * domeProfile;
    vec2 totalDisp = baseDisplacement + centerMagnify;

    vec2 dispR = totalDisp * 1.04;
    vec2 dispG = totalDisp * 1.00;
    vec2 dispB = totalDisp * 0.96;

    // Synthetic Ambient Cinema Background Sampling with Parallax and Spectral Dispersion
    vec3 bgDeep = vec3(0.05, 0.07, 0.10);
    vec3 bgGlow = vec3(0.12, 0.16, 0.22);
    vec3 bgAmber = vec3(0.96, 0.62, 0.04) * 0.18;

    float sampleR = sin((v_uv.x + dispR.x) * 3.14159) * 0.5 + 0.5;
    float sampleG = sin((v_uv.x + dispG.x) * 3.14159) * 0.5 + 0.5;
    float sampleB = sin((v_uv.x + dispB.x) * 3.14159) * 0.5 + 0.5;
    vec3 bgColor = mix(bgDeep, bgGlow, vec3(sampleR, sampleG, sampleB));
    bgColor += bgAmber * max(0.0, 1.0 - length((v_uv + totalDisp) - vec2(0.5 + u_tilt.x * 0.05, 0.15 + u_tilt.y * 0.05)) * 2.2);

    // 3. Schlick's Fresnel Reflectivity
    // R(theta) = R0 + (1 - R0) * (1 - cos(theta))^5
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    float cosTheta = clamp(dot(normal, viewDir), 0.0, 1.0);
    float R0 = 0.045; // Optical glass refractive baseline
    float fresnel = R0 + (1.0 - R0) * pow(1.0 - cosTheta, 5.0);

    // 4. Thin-Film Spectral Iridescence along Grazing Edge
    // Thin-film interference causes spectral violet, gold, and cyan shimmer on edge chamfers
    float filmPhase = 2.0 * 3.14159 * 1.8 * (1.0 - cosTheta);
    vec3 spectralIridescence = 0.5 + 0.5 * cos(vec3(filmPhase, filmPhase + 2.094, filmPhase + 4.188));
    vec3 iridShimmer = spectralIridescence * fresnel * 0.85;

    // 5. Directional Rim Lighting illuminated by Effective Light Vector
    vec2 effectiveLightPos = u_light_pos + u_tilt * 0.2;
    vec3 lightDir = normalize(vec3(effectiveLightPos - v_uv, 0.42));
    float nDotL = max(0.0, dot(normal, lightDir));
    float rimHighlight = pow(nDotL, u_rim_sharpness) * u_rim_intensity;

    // Perimeter caustic bevel mask
    float rimMask = smoothstep(-3.0, -0.4, dist) * smoothstep(1.0, 0.0, dist);
    float innerRim = rimHighlight * rimMask;

    // 6. Moving Settling Specular Glint
    vec2 glintOffset = v_uv - effectiveLightPos;
    float glintDist = length(glintOffset);
    float glint = exp(-glintDist * 4.2) * 0.48;

    // Micro-glint sparkle (living liquid optical surface)
    float sparkle = sin(v_uv.x * 50.0 + u_time) * cos(v_uv.y * 50.0 - u_time) * 0.015;

    // 7. Composite Glass Material Optical Composition
    vec3 glassColor = bgColor * 0.82;
    glassColor += iridShimmer * rimMask;
    glassColor += vec3(1.0, 1.0, 1.0) * innerRim;
    glassColor += vec3(1.0, 0.96, 0.88) * (glint + sparkle);

    // Alpha ramp with anti-aliased perimeter edge
    float alpha = smoothstep(0.5, -0.5, dist) * 0.93;

    gl_FragColor = vec4(glassColor, alpha);
  }
`;

/**
 * Dynamic Optical Glass Engine
 * 
 * Implements full optical physics:
 * 1. Refraction: Signed-Distance Field (SDF) convex center magnification and chromatic dispersion.
 * 2. Directional Rim Lighting: Surface normal derived from SDF gradient illuminated by simulated light direction.
 * 3. Gyroscope & Accelerometer Parallax: Reactive specular glints responding to device physical tilt.
 * 4. Schlick's Fresnel Reflectivity: Physically based reflectivity increasing at grazing angles.
 * 5. Thin-Film Spectral Iridescence: Anti-reflective coating rainbow shimmer along rounded bevel edges.
 */
export function DynamicGlassSurface({
  children,
  borderRadius = 24,
  refractionStrength = 0.035,
  rimIntensity = 1.2,
  rimSharpness = 32.0,
  parallaxFactor = 0.08,
  interactive = true,
  className = "",
  style,
  ...props
}: DynamicGlassSurfaceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Animation and physics state
  const animFrameRef = useRef<number | null>(null);
  const isAnimatingRef = useRef<boolean>(false);
  const lightPosRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0.35,
    y: 0.22,
    targetX: 0.35,
    targetY: 0.22,
  });
  const tiltRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });
  const scrollOffsetRef = useRef<number>(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Initialize WebGL pipeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false });
    } catch {
      gl = null;
    }

    if (!gl) return;
    glRef.current = gl;

    const compile = (type: number, src: string): WebGLShader | null => {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, src);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.warn("[DYNAMIC-GLASS] Shader compile error:", gl!.getShaderInfoLog(shader));
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compile(gl.VERTEX_SHADER, vertexShaderSource);
    const fs = compile(gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("[DYNAMIC-GLASS] Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);
    programRef.current = program;

    // Geometry: Fullscreen quad
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posAttr = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      isAnimatingRef.current = false;
    };
    canvas.addEventListener("webglcontextlost", handleContextLost, false);

    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      if (gl) {
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.deleteBuffer(quadBuffer);
      }
    };
  }, []);

  // Single render frame execution
  const renderFrame = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;
    if (!gl || !program || !canvas || dimensions.width === 0 || dimensions.height === 0) {
      isAnimatingRef.current = false;
      return;
    }

    // Critical-damping interpolation of light position & tilt
    const light = lightPosRef.current;
    const tilt = tiltRef.current;
    const springFactor = 0.12;

    const dx = light.targetX - light.x;
    const dy = light.targetY - light.y;
    light.x += dx * springFactor;
    light.y += dy * springFactor;

    const dtx = tilt.targetX - tilt.x;
    const dty = tilt.targetY - tilt.y;
    tilt.x += dtx * springFactor;
    tilt.y += dty * springFactor;

    // Sync CSS properties to container for child/fallback CSS rendering
    if (containerRef.current) {
      containerRef.current.style.setProperty("--tilt-x", `${(tilt.x * 20).toFixed(2)}deg`);
      containerRef.current.style.setProperty("--tilt-y", `${(-tilt.y * 20).toFixed(2)}deg`);
      containerRef.current.style.setProperty("--glint-x", `${(light.x * 100).toFixed(1)}%`);
      containerRef.current.style.setProperty("--glint-y", `${(light.y * 100).toFixed(1)}%`);
    }

    gl.useProgram(program);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const uRes = gl.getUniformLocation(program, "u_resolution");
    const uRadius = gl.getUniformLocation(program, "u_radius");
    const uLightPos = gl.getUniformLocation(program, "u_light_pos");
    const uTilt = gl.getUniformLocation(program, "u_tilt");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uRefract = gl.getUniformLocation(program, "u_refraction");
    const uRimInt = gl.getUniformLocation(program, "u_rim_intensity");
    const uRimSharp = gl.getUniformLocation(program, "u_rim_sharpness");
    const uParallax = gl.getUniformLocation(program, "u_parallax");

    gl.uniform2f(uRes, dimensions.width * dpr, dimensions.height * dpr);
    gl.uniform1f(uRadius, borderRadius * dpr);
    gl.uniform2f(uLightPos, light.x, light.y);
    gl.uniform2f(uTilt, tilt.x, tilt.y);
    gl.uniform1f(uTime, (Date.now() - startTimeRef.current) * 0.001);
    gl.uniform1f(uRefract, refractionStrength);
    gl.uniform1f(uRimInt, rimIntensity);
    gl.uniform1f(uRimSharp, rimSharpness);
    gl.uniform1f(uParallax, scrollOffsetRef.current * parallaxFactor);

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Continue loop until velocity dampens below threshold (idle sleep)
    const velocity = Math.hypot(dx, dy) + Math.hypot(dtx, dty);
    if (velocity > 0.0005) {
      animFrameRef.current = requestAnimationFrame(renderFrame);
    } else {
      isAnimatingRef.current = false;
    }
  }, [dimensions, borderRadius, refractionStrength, rimIntensity, rimSharpness, parallaxFactor]);

  const triggerRender = useCallback(() => {
    if (!isAnimatingRef.current) {
      isAnimatingRef.current = true;
      animFrameRef.current = requestAnimationFrame(renderFrame);
    }
  }, [renderFrame]);

  // Update canvas size on container resize
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      setDimensions({ width: w, height: h });

      if (canvasRef.current && glRef.current) {
        canvasRef.current.width = w * dpr;
        canvasRef.current.height = h * dpr;
        glRef.current.viewport(0, 0, w * dpr, h * dpr);
        triggerRender();
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);

    return () => observer.disconnect();
  }, [triggerRender]);

  // Pointer interaction: update target glint and tilt position
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!interactive || dimensions.width === 0 || dimensions.height === 0) return;
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const normX = Math.max(0.0, Math.min(1.0, (e.clientX - rect.left) / rect.width));
      const normY = Math.max(0.0, Math.min(1.0, (e.clientY - rect.top) / rect.height));

      lightPosRef.current.targetX = normX;
      lightPosRef.current.targetY = normY;
      tiltRef.current.targetX = (normX - 0.5) * 1.6;
      tiltRef.current.targetY = (normY - 0.5) * 1.6;
      triggerRender();
    },
    [interactive, dimensions, triggerRender]
  );

  const handlePointerLeave = useCallback(() => {
    // Settle back to natural resting top-left highlight and flat tilt
    lightPosRef.current.targetX = 0.35;
    lightPosRef.current.targetY = 0.22;
    tiltRef.current.targetX = 0;
    tiltRef.current.targetY = 0;
    triggerRender();
  }, [triggerRender]);

  // Device orientation (Gyroscope & Accelerometer) Parallax
  useEffect(() => {
    if (!interactive) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null && e.beta === null) return;
      // gamma: left-to-right tilt in [-90, 90]
      // beta: front-to-back tilt in [-180, 180] (phone held naturally around 45 degrees)
      const gx = Math.max(-1.0, Math.min(1.0, (e.gamma || 0) / 35.0));
      const by = Math.max(-1.0, Math.min(1.0, ((e.beta || 45) - 45.0) / 35.0));

      tiltRef.current.targetX = gx;
      tiltRef.current.targetY = by;
      lightPosRef.current.targetX = 0.5 + gx * 0.35;
      lightPosRef.current.targetY = 0.3 + by * 0.35;

      triggerRender();
    };

    window.addEventListener("deviceorientation", handleOrientation, { passive: true });
    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, [interactive, triggerRender]);

  // Parallax: Track window scroll
  useEffect(() => {
    const handleScroll = () => {
      scrollOffsetRef.current = window.scrollY || document.documentElement.scrollTop;
      triggerRender();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [triggerRender]);

  useEffect(() => {
    triggerRender();
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [triggerRender]);

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`relative isolate overflow-hidden ${className}`}
      style={{
        borderRadius: `${borderRadius}px`,
        ...style,
      }}
      {...props}
    >
      {/* Real-time WebGL Refraction, Fresnel, and Rim Shader Canvas */}
      <canvas
        ref={canvasRef}
        hidden
        aria-hidden="true"
        className="!block absolute inset-0 w-full h-full pointer-events-none -z-10 !m-0"
        style={{
          borderRadius: `${borderRadius}px`,
        }}
      />

      {children}
    </div>
  );
}
