import { useEffect, useRef } from "react";

interface ElectricLogoProps {
  src: string;
  color?: string;
  glowColor?: string;
  sparkColor?: string;
  edgeMode?: "alpha" | "luminance";
  drawSource?: boolean;
}

interface EdgeSegment {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  normalX: number;
  normalY: number;
}

function findOuterEdge(
  imageData: ImageData,
  edgeMode: "alpha" | "luminance",
): EdgeSegment[] {
  const { data, width, height } = imageData;
  const pixelCount = width * height;
  const foreground = new Uint8Array(pixelCount);
  const outside = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;

  for (let index = 0; index < pixelCount; index += 1) {
    const offset = index * 4;
    if (data[offset + 3] < 128) continue;
    const luminance =
      data[offset] * 0.2126 +
      data[offset + 1] * 0.7152 +
      data[offset + 2] * 0.0722;
    if (edgeMode === "alpha" || luminance >= 64) foreground[index] = 1;
  }

  const addOutsidePixel = (index: number) => {
    if (outside[index] || foreground[index]) return;
    outside[index] = 1;
    queue[tail++] = index;
  };

  for (let x = 0; x < width; x += 1) {
    addOutsidePixel(x);
    addOutsidePixel((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    addOutsidePixel(y * width);
    addOutsidePixel(y * width + width - 1);
  }

  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    if (x > 0) addOutsidePixel(index - 1);
    if (x + 1 < width) addOutsidePixel(index + 1);
    if (index >= width) addOutsidePixel(index - width);
    if (index + width < pixelCount) addOutsidePixel(index + width);
  }

  const edges: EdgeSegment[] = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      if (!foreground[index]) continue;

      if (y === 0 || outside[index - width]) {
        edges.push({ startX: x, startY: y, endX: x + 1, endY: y, normalX: 0, normalY: -1 });
      }
      if (x === width - 1 || outside[index + 1]) {
        edges.push({ startX: x + 1, startY: y, endX: x + 1, endY: y + 1, normalX: 1, normalY: 0 });
      }
      if (y === height - 1 || outside[index + width]) {
        edges.push({ startX: x + 1, startY: y + 1, endX: x, endY: y + 1, normalX: 0, normalY: 1 });
      }
      if (x === 0 || outside[index - 1]) {
        edges.push({ startX: x, startY: y + 1, endX: x, endY: y, normalX: -1, normalY: 0 });
      }
    }
  }

  return edges;
}

export function ElectricLogo({
  src,
  color = "#00e5ff",
  glowColor = color,
  sparkColor = "#bdf9ff",
  edgeMode = "alpha",
  drawSource = true,
}: ElectricLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let active = true;
    let animationFrame = 0;
    let lastFrameTime = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const image = new Image();

    const renderFrame = (timestamp: number, edges: EdgeSegment[]) => {
      if (!context || !canvas) return;
      const { width, height } = canvas;
      const hovered = hoverRef.current;
      const luminanceEdges = edgeMode === "luminance";
      const effectStrength = luminanceEdges ? 1.8 : 1;
      const normalAlpha = luminanceEdges ? 0.8 : 0.65;
      const hoverAlpha = luminanceEdges ? 1 : 0.9;
      context.clearRect(0, 0, width, height);
      if (drawSource) context.drawImage(image, 0, 0, width, height);
      context.save();
      context.globalCompositeOperation = "screen";
      context.beginPath();
      for (const edge of edges) {
        context.moveTo(edge.startX, edge.startY);
        context.lineTo(edge.endX, edge.endY);
      }
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = color;
      context.globalAlpha = hovered ? hoverAlpha : normalAlpha;
      context.lineWidth = (hovered ? 2 : 1.4) * effectStrength;
      context.shadowColor = glowColor;
      context.shadowBlur = (hovered ? 16 : 10) * effectStrength;
      context.stroke();
      context.globalAlpha = 1;

      if (!reducedMotion) {
        const sparkCount = hovered ? 14 : 7;
        context.beginPath();
        for (let spark = 0; spark < sparkCount; spark += 1) {
          const edge = edges[Math.floor(Math.random() * edges.length)];
          if (!edge) continue;

          let x = (edge.startX + edge.endX) / 2;
          let y = (edge.startY + edge.endY) / 2;
          const tangentX = -edge.normalY;
          const tangentY = edge.normalX;
          context.moveTo(x, y);

          const length = 8 + Math.random() * (hovered ? 28 : 18);
          const segments = 2 + Math.floor(Math.random() * 3);
          for (let step = 1; step <= segments; step += 1) {
            const progress = step / segments;
            const jitter = (Math.random() - 0.5) * 12;
            x =
              (edge.startX + edge.endX) / 2 +
              edge.normalX * length * progress +
              tangentX * jitter;
            y =
              (edge.startY + edge.endY) / 2 +
              edge.normalY * length * progress +
              tangentY * jitter;
            context.lineTo(x, y);
          }
        }

        context.strokeStyle = sparkColor;
        context.lineWidth = (hovered ? 1.8 : 1.2) * effectStrength;
        context.shadowBlur = 12 * effectStrength;
        context.stroke();
      }

      context.restore();
      if (!reducedMotion && active) {
        lastFrameTime = timestamp;
        animationFrame = window.requestAnimationFrame((nextTimestamp) => {
          if (nextTimestamp - lastFrameTime < 30) {
            animationFrame = window.requestAnimationFrame((laterTimestamp) =>
              renderFrame(laterTimestamp, edges),
            );
            return;
          }
          renderFrame(nextTimestamp, edges);
        });
      }
    };

    image.onload = () => {
      if (!active) return;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = image.naturalWidth;
      sourceCanvas.height = image.naturalHeight;
      const imageContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
      if (!imageContext) return;
      imageContext.drawImage(image, 0, 0);
      const edges = findOuterEdge(
        imageContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height),
        edgeMode,
      );
      renderFrame(0, edges);
    };

    image.onerror = () => {
      if (active) {
        console.error(`Unable to load logo image: ${src}`);
      }
    };
    image.src = src;

    return () => {
      active = false;
      window.cancelAnimationFrame(animationFrame);
      image.onload = null;
      image.onerror = null;
    };
  }, [color, drawSource, edgeMode, glowColor, sparkColor, src]);

  return (
    <span
      className="electric-logo-mark"
      aria-hidden="true"
      onPointerEnter={() => {
        hoverRef.current = true;
      }}
      onPointerLeave={() => {
        hoverRef.current = false;
      }}
    >
      <canvas ref={canvasRef} className="electric-logo-canvas" />
    </span>
  );
}
