/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useRef, useState, HTMLAttributes } from 'react';
import { twJoin } from 'tailwind-merge';
import { useSprites } from './use-sprites';

type PixelCanvasProps = HTMLAttributes<HTMLCanvasElement> & {
  grid: {
    size: number;
    color: {
      first: string;
      second: string;
    };
    borders: {
      isEnabled: boolean;
      color: string;
    };
  };
};

type CanvasImage = {
  img: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  fadeStartTime: number;
};

const MAX_SCALE = 4;
const GAP = 5;
const MAX_WIDTH = 4000;
const MAX_HEIGHT = 4000;
const FADE_DURATION = 1000;

function PixelCanvas({ className, grid, ...props }: PixelCanvasProps) {
  const [scale, setScale] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef({ x: 0, y: 0 });
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const imagesRef = useRef<CanvasImage[]>([]);
  const scaleRef = useRef(scale);
  const rafRef = useRef<number | null>(null);
  const lastTouchDistanceRef = useRef<number | null>(null);
  const occupiedSpacesRef = useRef<
    { x: number; y: number; width: number; height: number }[]
  >([]);

  const sprites = useSprites();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    imagesRef.current = [];
    occupiedSpacesRef.current = [];

    const canPlaceImage = (
      x: number,
      y: number,
      width: number,
      height: number
    ) => {
      if (
        x + width > MAX_WIDTH / 2 ||
        y + height > MAX_HEIGHT / 2 ||
        x < -MAX_WIDTH / 2 ||
        y < -MAX_HEIGHT / 2
      ) {
        return false;
      }
      return !occupiedSpacesRef.current.some(
        space =>
          x < space.x + space.width + GAP &&
          x + width + GAP > space.x &&
          y < space.y + space.height + GAP &&
          y + height + GAP > space.y
      );
    };

    const spiralPositions = (() => {
      const positions: { x: number; y: number }[] = [];
      let x = 0,
        y = 0;
      let dx = 0,
        dy = -1;
      const maxI = (Math.max(MAX_WIDTH, MAX_HEIGHT) / GAP) ** 2;

      for (let i = 0; i < maxI; i++) {
        const scaledX = x * GAP;
        const scaledY = y * GAP;
        if (
          scaledX >= -MAX_WIDTH / 2 &&
          scaledX <= MAX_WIDTH / 2 &&
          scaledY >= -MAX_HEIGHT / 2 &&
          scaledY <= MAX_HEIGHT / 2
        ) {
          positions.push({ x: scaledX, y: scaledY });
        }
        if (x === y || (x < 0 && x === -y) || (x > 0 && x === 1 - y)) {
          const temp = dx;
          dx = -dy;
          dy = temp;
        }
        x += dx;
        y += dy;
      }

      positions.sort((a, b) => {
        const distA = a.x ** 2 + a.y ** 2;
        const distB = b.x ** 2 + b.y ** 2;
        if (distA === distB) {
          if (a.x === b.x) return a.y - b.y;
          return a.x - b.x;
        }
        return distA - distB;
      });
      return positions;
    })();

    const sortedSprites = [...sprites].sort();

    const loadImage = (src: string, index: number) => {
      const img = new Image();
      const imageSrc = src.startsWith('http')
        ? `${src}?v=${Date.now()}`
        : `${process.env.API_URL || ''}${src}?v=${Date.now()}`;
      console.log(`Loading image ${index + 1}: ${imageSrc}`);
      img.src = imageSrc;

      img.onload = () => {
        const imgWidth = img.width;
        const imgHeight = img.height;

        let position: {
          x: number;
          y: number;
          width: number;
          height: number;
        } | null = null;

        for (const { x: adjustedX, y: adjustedY } of spiralPositions) {
          if (canPlaceImage(adjustedX, adjustedY, imgWidth, imgHeight)) {
            position = {
              x: adjustedX,
              y: adjustedY,
              width: imgWidth,
              height: imgHeight,
            };
            occupiedSpacesRef.current.push({
              x: adjustedX,
              y: adjustedY,
              width: imgWidth,
              height: imgHeight,
            });
            break;
          }
        }

        if (position) {
          imagesRef.current.push({
            img,
            x: position.x,
            y: position.y,
            width: position.width,
            height: position.height,
            opacity: 0,
            fadeStartTime: Date.now(),
          });

          if (process.env.DEV === 'true') {
            console.log(`Image ${index + 1} loaded and placed at:`, position);
          }

          drawCanvas();
        } else {
          console.warn(
            `Could not place image ${index + 1}: ${src}. Size: ${imgWidth}x${imgHeight}`
          );
        }

        if (
          index === sortedSprites.length - 1 &&
          imagesRef.current.length < sortedSprites.length
        ) {
          setError(
            `Loaded ${imagesRef.current.length} of ${sortedSprites.length} images. Some images failed to load.`
          );
        }
      };

      img.onerror = () => {
        console.error(`Failed to load image ${index + 1}: ${imageSrc}`);
        if (
          index === sortedSprites.length - 1 &&
          imagesRef.current.length === 0
        ) {
          setError('Failed to load all images. Please try again later.');
        }
      };
    };

    sortedSprites.forEach((src, index) => {
      setTimeout(() => loadImage(src, index), index * 100);
    });

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawCanvas();
    };

    const drawCanvas = () => {
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const { width, height } = canvas;
        const camera = cameraRef.current;

        ctx.clearRect(0, 0, width, height);

        const gridSize = grid.size;
        const START_X = Math.floor(camera.x / gridSize) * gridSize;
        const START_Y = Math.floor(camera.y / gridSize) * gridSize;
        const endX = camera.x + width / scaleRef.current;
        const endY = camera.y + height / scaleRef.current;

        ctx.imageSmoothingEnabled = false;

        for (let x = START_X; x < endX; x += gridSize) {
          for (let y = START_Y; y < endY; y += gridSize) {
            const isDark =
              (Math.floor(x / gridSize) + Math.floor(y / gridSize)) % 2 === 0;
            ctx.fillStyle = isDark ? grid.color.first : grid.color.second;

            const renderX = Math.round((x - camera.x) * scaleRef.current);
            const renderY = Math.round((y - camera.y) * scaleRef.current);
            const renderSize = Math.round(gridSize * scaleRef.current);
            const adjustedSize = renderSize + (renderSize % 2 === 0 ? 0 : 1);
            ctx.fillRect(renderX, renderY, adjustedSize, adjustedSize);
          }
        }

        imagesRef.current.forEach(image => {
          const elapsed = Date.now() - image.fadeStartTime;
          image.opacity = Math.min(elapsed / FADE_DURATION, 1);

          const renderX = Math.round((image.x - camera.x) * scaleRef.current);
          const renderY = Math.round((image.y - camera.y) * scaleRef.current);
          const renderWidth = Math.round(image.width * scaleRef.current);
          const renderHeight = Math.round(image.height * scaleRef.current);

          ctx.globalAlpha = image.opacity;
          ctx.drawImage(image.img, renderX, renderY, renderWidth, renderHeight);

          if (grid.borders.isEnabled && image.opacity === 1) {
            ctx.globalAlpha = 1;
            ctx.strokeStyle = grid.borders.color;
            ctx.strokeRect(renderX, renderY, renderWidth, renderHeight);
          }
        });

        ctx.globalAlpha = 1;

        if (imagesRef.current.some(image => image.opacity < 1)) {
          drawCanvas();
        }
      });
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const dx = e.clientX - lastMousePosRef.current.x;
        const dy = e.clientY - lastMousePosRef.current.y;
        cameraRef.current.x -= dx / scaleRef.current;
        cameraRef.current.y -= dy / scaleRef.current;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        drawCanvas();
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      if (canvasRef.current) canvasRef.current.style.cursor = 'auto';
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        const touch = e.touches[0];
        lastMousePosRef.current = { x: touch.clientX, y: touch.clientY };
      } else if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastTouchDistanceRef.current = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDraggingRef.current) {
        const touch = e.touches[0];
        const dx = touch.clientX - lastMousePosRef.current.x;
        const dy = touch.clientY - lastMousePosRef.current.y;
        cameraRef.current.x -= dx / scaleRef.current;
        cameraRef.current.y -= dy / scaleRef.current;
        lastMousePosRef.current = { x: touch.clientX, y: touch.clientY };
        drawCanvas();
      } else if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );

        if (lastTouchDistanceRef.current !== null) {
          const oldScale = scaleRef.current;
          const scaleChange = currentDistance / lastTouchDistanceRef.current;
          const newScale = Math.min(
            Math.max(1, oldScale * scaleChange),
            MAX_SCALE
          );

          const rect = canvas.getBoundingClientRect();
          const midX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
          const midY = (touch1.clientY + touch2.clientY) / 2 - rect.top;

          const camera = cameraRef.current;
          const worldX = camera.x + midX / oldScale;
          const worldY = camera.y + midY / oldScale;

          cameraRef.current.x = worldX - midX / newScale;
          cameraRef.current.y = worldY - midY / newScale;

          scaleRef.current = newScale;
          setScale(newScale);
          lastTouchDistanceRef.current = currentDistance;
          drawCanvas();
        }
      }
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      lastTouchDistanceRef.current = null;
    };

    let scaleTimeout: NodeJS.Timeout | null = null;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 1;
      const oldScale = scaleRef.current;
      const newScale = Math.min(
        Math.max(1, oldScale - e.deltaY * 0.01 * zoomSpeed),
        MAX_SCALE
      );

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const camera = cameraRef.current;
      const worldX = camera.x + mouseX / oldScale;
      const worldY = camera.y + mouseY / oldScale;

      cameraRef.current.x = worldX - mouseX / newScale;
      cameraRef.current.y = worldY - mouseY / newScale;

      scaleRef.current = newScale;

      if (scaleTimeout) clearTimeout(scaleTimeout);
      scaleTimeout = setTimeout(() => {
        setScale(newScale);
      }, 100);

      drawCanvas();
    };

    resizeCanvas();

    cameraRef.current = {
      x: -canvas.width / (2 * scale),
      y: -canvas.height / (2 * scale),
    };

    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (scaleTimeout) clearTimeout(scaleTimeout);
    };
  }, [grid, sprites]);

  return (
    <>
      {error && <div className="error">{error}</div>}
      <canvas
        ref={canvasRef}
        className={twJoin(
          'h-full w-full cursor-auto touch-pinch-zoom',
          className
        )}
        {...props}
      />
    </>
  );
}

export { PixelCanvas };
