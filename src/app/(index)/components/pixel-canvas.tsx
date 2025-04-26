import { useEffect, useRef, useState, HTMLAttributes } from 'react';
import { twJoin } from 'tailwind-merge';

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

function PixelCanvas({ className, grid, ...props }: PixelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const imagesRef = useRef<
    {
      img: HTMLImageElement;
      x: number;
      y: number;
      width: number;
      height: number;
    }[]
  >([]);
  const [imageSources, setImageSources] = useState<string[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [scale, setScale] = useState(2);
  const maxScale = 4;
  const scaleRef = useRef(scale);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    fetch('http://localhost:8888/api/sprites')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      })
      .then(files => {
        if (Array.isArray(files) && files.length > 0) {
          setImageSources(files.sort((a, b) => a.localeCompare(b)));
          setFetchError(null);
        } else {
          setImageSources([]);
        }
      })
      .catch(err => {
        setFetchError(`Failed to load sprites: ${err}`);
      });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    const gap = 5;
    const startX = 0;
    const startY = 0;
    const maxWidth = 2000;

    imagesRef.current = [];
    const occupiedSpaces: {
      x: number;
      y: number;
      width: number;
      height: number;
    }[] = [];
    let maxY = startY;

    const canPlaceImage = (
      x: number,
      y: number,
      width: number,
      height: number
    ) => {
      if (x + width > startX + maxWidth) return false;
      return !occupiedSpaces.some(
        space =>
          x < space.x + space.width &&
          x + width > space.x &&
          y < space.y + space.height &&
          y + height > space.y
      );
    };

    imageSources.forEach((src, index) => {
      const img = new Image();
      img.src = src.startsWith('http') ? src : `http://localhost:8888${src}`;
      img.onload = () => {
        const imgWidth = img.width;
        const imgHeight = img.height;

        let placed = false;
        let x = startX;
        let y = startY;

        for (let tryY = startY; tryY <= maxY && !placed; tryY += gap) {
          for (
            let tryX = startX;
            tryX <= startX + maxWidth - imgWidth && !placed;
            tryX += gap
          ) {
            if (canPlaceImage(tryX, tryY, imgWidth, imgHeight)) {
              x = tryX;
              y = tryY;
              placed = true;
            }
          }
        }

        if (!placed) {
          y = maxY + gap;
          x = startX;
        }

        imagesRef.current.push({
          img,
          x,
          y,
          width: imgWidth,
          height: imgHeight,
        });

        occupiedSpaces.push({
          x,
          y,
          width: imgWidth,
          height: imgHeight,
        });

        maxY = Math.max(maxY, y + imgHeight);

        drawCanvas();
      };

      img.onerror = () => {
        console.error(
          `Failed to load image ${index + 1}/${imageSources.length}: ${src}`
        );
      };
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
        const startX = Math.floor(camera.x / gridSize) * gridSize;
        const startY = Math.floor(camera.y / gridSize) * gridSize;
        const endX = camera.x + width / scaleRef.current;
        const endY = camera.y + height / scaleRef.current;

        ctx.imageSmoothingEnabled = false;
        for (let x = startX; x < endX; x += gridSize) {
          for (let y = startY; y < endY; y += gridSize) {
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

        imagesRef.current.forEach(
          ({ img, x, y, width: imgWidth, height: imgHeight }) => {
            const renderX = Math.round((x - camera.x) * scaleRef.current);
            const renderY = Math.round((y - camera.y) * scaleRef.current);
            const renderWidth = Math.round(imgWidth * scaleRef.current);
            const renderHeight = Math.round(imgHeight * scaleRef.current);
            ctx.drawImage(img, renderX, renderY, renderWidth, renderHeight);

            if (grid.borders.isEnabled) {
              ctx.strokeStyle = grid.borders.color;
              ctx.strokeRect(renderX, renderY, renderWidth, renderHeight);
            }
          }
        );
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

    let scaleTimeout: NodeJS.Timeout | null = null;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 1;
      const oldScale = scaleRef.current;
      const newScale = Math.round(
        Math.min(Math.max(1, oldScale - e.deltaY * 0.01 * zoomSpeed), maxScale)
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

    cameraRef.current = {
      x: -canvas.width / (2 * scale) + maxWidth / 2,
      y: -canvas.height / (2 * scale) + maxY / 2,
    };

    resizeCanvas();
    drawCanvas();

    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (scaleTimeout) clearTimeout(scaleTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, imageSources]);

  if (fetchError) {
    return <div className="text-red-500">{fetchError}</div>;
  }

  return (
    <canvas
      ref={canvasRef}
      className={twJoin('h-full w-full cursor-auto', className)}
      {...props}
    />
  );
}

export { PixelCanvas };
