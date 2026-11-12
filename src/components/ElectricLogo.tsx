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
    if (edgeMode === "alpha" || luminance >= 50) foreground[index] = 1;
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
  color = "#f0c66a",
  glowColor = "#e9b957",
  sparkColor = "#fff7d6",
  edgeMode = "luminance",
  drawSource = false,
}: ElectricLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let active = true;
    let animationFrame = 0;
    const image = new Image();

    const startAnimation = (edges: EdgeSegment[]) => {
      if (edges.length === 0) return;

      const render = (time: number) => {
        if (!active || !canvas || !context) return;
        const { width, height } = canvas;
        const hovered = hoverRef.current;
        const scale = Math.max(1, width / 250);

        context.clearRect(0, 0, width, height);
        if (drawSource) context.drawImage(image, 0, 0, width, height);

        context.save();
        context.globalCompositeOperation = "screen";

        // Voltage flicker calculation
        const voltage = 0.8 + Math.random() * 0.2;

        // 1. Base luminous edge outline
        context.beginPath();
        for (let i = 0; i < edges.length; i += 2) {
          const edge = edges[i];
          context.moveTo(edge.startX, edge.startY);
          context.lineTo(edge.endX, edge.endY);
        }
        context.lineCap = "round";
        context.lineJoin = "round";
        context.strokeStyle = color;
        context.globalAlpha = (hovered ? 0.95 : 0.75) * voltage;
        context.lineWidth = (hovered ? 2.8 : 1.8) * scale;
        context.shadowColor = glowColor;
        context.shadowBlur = (hovered ? 24 : 14) * scale;
        context.stroke();

        // 2. Traveling high-voltage pulses along contour
        const pulseCycle = (time * 0.001) % 1;
        const pulseCount = 4;
        context.beginPath();
        for (let p = 0; p < pulseCount; p += 1) {
          const centerRatio = (pulseCycle + p / pulseCount) % 1;
          const centerIdx = Math.floor(centerRatio * edges.length);
          const range = Math.floor(edges.length * 0.035);

          for (let step = -range; step <= range; step += 1) {
            const idx = (centerIdx + step + edges.length) % edges.length;
            const edge = edges[idx];
            context.moveTo(edge.startX, edge.startY);
            context.lineTo(edge.endX, edge.endY);
          }
        }
        context.strokeStyle = "#ffffff";
        context.globalAlpha = 0.85 * voltage;
        context.lineWidth = 2.4 * scale;
        context.shadowColor = glowColor;
        context.shadowBlur = 18 * scale;
        context.stroke();

        // 3. Dynamic crackling lightning sparks (24-40 bolts dancing each frame)
        const sparkCount = hovered ? 38 : 24;
        context.beginPath();
        for (let s = 0; s < sparkCount; s += 1) {
          const edge = edges[Math.floor(Math.random() * edges.length)];
          if (!edge) continue;

          let currentX = (edge.startX + edge.endX) / 2;
          let currentY = (edge.startY + edge.endY) / 2;
          const tangentX = -edge.normalY;
          const tangentY = edge.normalX;

          context.moveTo(currentX, currentY);

          const arcLength = (12 + Math.random() * (hovered ? 38 : 22)) * scale;
          const steps = 3 + Math.floor(Math.random() * 3);

          for (let step = 1; step <= steps; step += 1) {
            const progress = step / steps;
            const jitter = (Math.random() - 0.5) * 16 * scale;
            currentX =
              (edge.startX + edge.endX) / 2 +
              edge.normalX * arcLength * progress +
              tangentX * jitter;
            currentY =
              (edge.startY + edge.endY) / 2 +
              edge.normalY * arcLength * progress +
              tangentY * jitter;
            context.lineTo(currentX, currentY);
          }
        }

        // Golden aura on lightning
        context.strokeStyle = sparkColor;
        context.lineWidth = (hovered ? 2.5 : 1.6) * scale;
        context.shadowColor = glowColor;
        context.shadowBlur = 16 * scale;
        context.globalAlpha = 1;
        context.stroke();

        // Hot white core
        context.strokeStyle = "#ffffff";
        context.lineWidth = 1.0 * scale;
        context.stroke();

        context.restore();

        animationFrame = window.requestAnimationFrame(render);
      };

      animationFrame = window.requestAnimationFrame(render);
    };

    const processImage = () => {
      if (!active || !canvas) return;
      canvas.width = image.naturalWidth || 1365;
      canvas.height = image.naturalHeight || 768;

      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = canvas.width;
      sourceCanvas.height = canvas.height;
      const imageContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
      if (!imageContext) return;

      imageContext.drawImage(image, 0, 0);
      const edgeData = imageContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
      const edges = findOuterEdge(edgeData, edgeMode);
      startAnimation(edges);
    };

    image.crossOrigin = "anonymous";
    image.onload = processImage;
    image.src = src;

    // Handle cached image immediately
    if (image.complete && image.naturalWidth > 0) {
      processImage();
    }

    return () => {
      active = false;
      window.cancelAnimationFrame(animationFrame);
      image.onload = null;
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
