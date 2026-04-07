import * as THREE from "three";

export type AvatarState = "idle" | "speaking" | "listening" | "thinking" | "celebrating";

export const avatarSizeMap = {
  sm: 132,
  md: 220,
  lg: 312,
} as const;

type PortraitImageSource = HTMLImageElement | HTMLCanvasElement | ImageBitmap;

function getSourceWidth(source: PortraitImageSource) {
  return "naturalWidth" in source ? source.naturalWidth : source.width;
}

function getSourceHeight(source: PortraitImageSource) {
  return "naturalHeight" in source ? source.naturalHeight : source.height;
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function finalizeTexture(texture: THREE.CanvasTexture, colorSpace: THREE.ColorSpace) {
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.premultiplyAlpha = true;
  texture.needsUpdate = true;
  return texture;
}

function createPortraitCanvas(source: PortraitImageSource) {
  const sourceWidth = getSourceWidth(source);
  const sourceHeight = getSourceHeight(source);
  const scanCanvas = createCanvas(sourceWidth, sourceHeight);
  const scanContext = scanCanvas.getContext("2d");

  if (!scanContext) {
    return createCanvas(896, 1120);
  }

  scanContext.clearRect(0, 0, sourceWidth, sourceHeight);
  scanContext.drawImage(source, 0, 0, sourceWidth, sourceHeight);

  const { data } = scanContext.getImageData(0, 0, sourceWidth, sourceHeight);

  let minX = sourceWidth;
  let minY = sourceHeight;
  let maxX = 0;
  let maxY = 0;
  let foundOpaquePixel = false;

  for (let y = 0; y < sourceHeight; y += 1) {
    for (let x = 0; x < sourceWidth; x += 1) {
      const alpha = data[(y * sourceWidth + x) * 4 + 3];
      if (alpha <= 14) continue;

      foundOpaquePixel = true;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (!foundOpaquePixel) {
    minX = 0;
    minY = 0;
    maxX = sourceWidth;
    maxY = sourceHeight;
  }

  const boundsWidth = Math.max(1, maxX - minX);
  const boundsHeight = Math.max(1, maxY - minY);
  const padX = boundsWidth * 0.14;
  const padTop = boundsHeight * 0.12;
  const padBottom = boundsHeight * 0.08;

  const cropX = Math.max(0, Math.floor(minX - padX));
  const cropY = Math.max(0, Math.floor(minY - padTop));
  const cropWidth = Math.min(sourceWidth - cropX, Math.ceil(boundsWidth + padX * 2));
  const cropHeight = Math.min(sourceHeight - cropY, Math.ceil(boundsHeight + padTop + padBottom));

  const targetWidth = 896;
  const targetHeight = 1120;
  const portraitCanvas = createCanvas(targetWidth, targetHeight);
  const portraitContext = portraitCanvas.getContext("2d");

  if (!portraitContext) {
    return portraitCanvas;
  }

  portraitContext.clearRect(0, 0, targetWidth, targetHeight);
  portraitContext.imageSmoothingEnabled = true;
  portraitContext.imageSmoothingQuality = "high";
  portraitContext.filter = "contrast(1.06) saturate(1.08)";

  const scale = Math.min((targetWidth * 0.88) / cropWidth, (targetHeight * 0.96) / cropHeight);
  const drawWidth = cropWidth * scale;
  const drawHeight = cropHeight * scale;
  const drawX = (targetWidth - drawWidth) / 2;
  const drawY = Math.max(-18, (targetHeight - drawHeight) / 2 - targetHeight * 0.05);

  portraitContext.drawImage(source, cropX, cropY, cropWidth, cropHeight, drawX, drawY, drawWidth, drawHeight);
  portraitContext.filter = "none";

  return portraitCanvas;
}

function createDepthTexture(sourceCanvas: HTMLCanvasElement) {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const depthCanvas = createCanvas(width, height);
  const depthContext = depthCanvas.getContext("2d");
  const sourceContext = sourceCanvas.getContext("2d");

  if (!depthContext || !sourceContext) {
    return finalizeTexture(new THREE.CanvasTexture(depthCanvas), THREE.NoColorSpace);
  }

  const sourceData = sourceContext.getImageData(0, 0, width, height);
  const depthImage = depthContext.createImageData(width, height);
  const centerX = width / 2;
  const centerY = height * 0.46;
  const radiusX = width * 0.46;
  const radiusY = height * 0.56;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const alpha = sourceData.data[index + 3] / 255;
      const luminance =
        (sourceData.data[index] * 0.2126 + sourceData.data[index + 1] * 0.7152 + sourceData.data[index + 2] * 0.0722) /
        255;

      const radialDistance = Math.min(
        1,
        Math.sqrt(((x - centerX) / radiusX) ** 2 + ((y - centerY) / radiusY) ** 2),
      );
      const centerBoost = 1 - radialDistance;
      const depthValue = Math.max(0, Math.min(255, Math.round((0.16 + luminance * 0.52 + centerBoost * 0.32) * alpha * 255)));

      depthImage.data[index] = depthValue;
      depthImage.data[index + 1] = depthValue;
      depthImage.data[index + 2] = depthValue;
      depthImage.data[index + 3] = sourceData.data[index + 3];
    }
  }

  depthContext.putImageData(depthImage, 0, 0);

  const blurredCanvas = createCanvas(width, height);
  const blurredContext = blurredCanvas.getContext("2d");

  if (!blurredContext) {
    return finalizeTexture(new THREE.CanvasTexture(depthCanvas), THREE.NoColorSpace);
  }

  blurredContext.filter = "blur(16px)";
  blurredContext.drawImage(depthCanvas, 0, 0);
  blurredContext.filter = "none";

  return finalizeTexture(new THREE.CanvasTexture(blurredCanvas), THREE.NoColorSpace);
}

export function colorToThree(input: string) {
  try {
    const rgba = input.match(/rgba?\(([^)]+)\)/i);
    if (rgba) {
      const [r, g, b] = rgba[1].split(",").slice(0, 3).map((value) => Number.parseFloat(value.trim()));
      return new THREE.Color(`rgb(${r}, ${g}, ${b})`);
    }

    return new THREE.Color(input);
  } catch {
    return new THREE.Color(0xf97316);
  }
}

export function createGlowDiscTexture(color: THREE.Color) {
  const canvas = createCanvas(512, 512);
  const context = canvas.getContext("2d");

  if (!context) {
    return finalizeTexture(new THREE.CanvasTexture(canvas), THREE.SRGBColorSpace);
  }

  const gradient = context.createRadialGradient(256, 230, 24, 256, 256, 256);
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);

  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.95)`);
  gradient.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, 0.38)`);
  gradient.addColorStop(0.72, `rgba(${r}, ${g}, ${b}, 0.08)`);
  gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

  context.fillStyle = gradient;
  context.fillRect(0, 0, 512, 512);

  return finalizeTexture(new THREE.CanvasTexture(canvas), THREE.SRGBColorSpace);
}

export function createPortraitTextureSet(source: PortraitImageSource) {
  const portraitCanvas = createPortraitCanvas(source);
  const portraitTexture = finalizeTexture(new THREE.CanvasTexture(portraitCanvas), THREE.SRGBColorSpace);
  const depthTexture = createDepthTexture(portraitCanvas);

  return {
    portraitTexture,
    depthTexture,
  };
}