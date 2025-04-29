import { CanvasImage } from './models/canvas-image';
import { CanvasProperties } from './models/canvas-properties';
import { Position } from './models/position';

const MAX_SCALE = 4;
const GAP = 5;
const MAX_WIDTH = 4000;
const MAX_HEIGHT = 4000;
const FOCUS_ZOOM = 2;
const LERP_DURATION = 1500;

const isDevelopmentMode = process.env.DEV == 'true' ? true : false;

class CanvasManager {
  public sprites: string[] = [];
  public canvasSprites: CanvasImage[] = [];

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private isDragging: boolean = false;
  private mousePosition: Position = { x: 0, y: 0 };
  private cameraPosition: Position = { x: 0, y: 0 };
  private lastCameraPosition: Position | null = null;
  private lastScale: number | null = null;
  private lastTouchDistance: number | null = null;
  private scale: number = 1;
  private scaleTimeout: NodeJS.Timeout | null = null;
  private occupiedSpaces: {
    x: number;
    y: number;
    width: number;
    height: number;
  }[] = [];
  private raf: number | null = null;
  private props: CanvasProperties;
  private fadeDuration: number = 500;
  private manualRedraw: boolean = false;
  private focusedSprite: CanvasImage | null = null;
  private targetCameraPosition: Position | null = null;
  private targetScale: number = 1;
  private lerpStartTime: number | null = null;

  private setCamera: (position: Position) => void;
  private setCursor: (position: Position) => void;
  private setError: (text: string) => void;

  constructor(
    canvas: HTMLCanvasElement,
    sprites: string[],
    preferences: CanvasProperties,
    fadeDuration: number = 500,
    setCamera: (position: Position) => void,
    setCursor: (position: Position) => void,
    setError: (text: string) => void
  ) {
    this.canvas = canvas;
    this.sprites = sprites;
    this.props = preferences;
    this.fadeDuration = fadeDuration;
    this.ctx = canvas.getContext('2d');
    this.setCamera = setCamera;
    this.setCursor = setCursor;
    this.setError = setError;

    this.initEventListeners();
    this.resizeCanvas();
    this.drawCanvas();
    this.loadSprites();
  }

  public updateProperties(
    sprites: string[],
    preferences: CanvasProperties,
    fadeDuration: number
  ) {
    const spritesChanged =
      JSON.stringify(this.sprites) !== JSON.stringify(sprites);
    const preferencesChanged =
      JSON.stringify(this.props) !== JSON.stringify(preferences);
    const fadeDurationChanged = this.fadeDuration !== fadeDuration;

    if (spritesChanged) {
      this.manualRedraw = true;
      this.sprites = sprites;
      this.canvasSprites = [];
      this.occupiedSpaces = [];
      this.focusedSprite = null;
      this.targetCameraPosition = null;
      this.lerpStartTime = null;
      this.loadSprites();
    }

    if (preferencesChanged) {
      this.manualRedraw = true;
      this.props = preferences;
    }

    if (fadeDurationChanged) {
      this.manualRedraw = true;
      this.fadeDuration = fadeDuration;
      this.canvasSprites.forEach(image => {
        image.fadeStartTime = Date.now();
      });
    }

    this.drawCanvas();
  }

  private loadSprites() {
    this.sprites.forEach((src, index) => this.loadImage(src, index));
  }

  private canPlaceImage = (
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
    return !this.occupiedSpaces.some(
      space =>
        x < space.x + space.width + GAP &&
        x + width + GAP > space.x &&
        y < space.y + space.height + GAP &&
        y + height + GAP > space.y
    );
  };

  private spiralPositions = (() => {
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

  private loadImage = (src: string, index: number) => {
    try {
      const img = new Image();
      const imageSrc = src.startsWith('http')
        ? `${src}`
        : `${process.env.API_URL || ''}${src}`;
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

        for (const { x: adjustedX, y: adjustedY } of this.spiralPositions) {
          if (this.canPlaceImage(adjustedX, adjustedY, imgWidth, imgHeight)) {
            position = {
              x: adjustedX,
              y: adjustedY,
              width: imgWidth,
              height: imgHeight,
            };
            this.occupiedSpaces.push({
              x: adjustedX,
              y: adjustedY,
              width: imgWidth,
              height: imgHeight,
            });
            break;
          }
        }

        if (position) {
          this.canvasSprites.push({
            img,
            x: position.x,
            y: position.y,
            width: position.width,
            height: position.height,
            opacity: 0,
            fadeStartTime: Date.now(),
          });
          this.drawCanvas();
        }
      };

      img.onerror = () => {
        console.error(`Failed to load image ${index + 1}: ${imageSrc}`);
        this.setError(`Failed to load image ${index + 1}: ${imageSrc}`);
      };
    } catch (e) {
      console.error(e);
      this.setError(JSON.stringify(e));
    }
  };

  private updateCameraPosition(newPosition: Position) {
    this.cameraPosition = newPosition;
    this.setCamera(this.cameraPosition);
  }

  private updateMousePosition(newPosition: Position) {
    this.mousePosition = newPosition;
    this.setCursor(this.mousePosition);
  }

  private centerCamera = () => {
    const newPosition = {
      x: -this.canvas.width / (2 * this.scale),
      y: -this.canvas.height / (2 * this.scale),
    };
    this.updateCameraPosition(newPosition);
  };

  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  private focusSprite(sprite: CanvasImage) {
    this.focusedSprite = sprite;
    this.targetCameraPosition = {
      x: Math.round(
        sprite.x + sprite.width / 2 - this.canvas.width / (2 * FOCUS_ZOOM)
      ),
      y: Math.round(
        sprite.y + sprite.height / 2 - this.canvas.height / (2 * FOCUS_ZOOM)
      ),
    };
    this.targetScale = FOCUS_ZOOM;
    this.lerpStartTime = Date.now();
    this.drawCanvas();
  }

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
    }

    if (e.button === 1) {
      this.isDragging = true;
      this.updateMousePosition({ x: e.clientX, y: e.clientY });
      if (this.canvas) this.canvas.style.cursor = 'grab';
      this.manualRedraw = true;
      this.focusedSprite = null;
      this.targetCameraPosition = null;
      this.targetScale = 1;
      this.lerpStartTime = Date.now();
      this.drawCanvas();
      return;
    }

    if (e.button === 0) {
      const rect = this.canvas.getBoundingClientRect();
      const clickX =
        (e.clientX - rect.left) / this.scale + this.cameraPosition.x;
      const clickY =
        (e.clientY - rect.top) / this.scale + this.cameraPosition.y;

      const clickedSprite = this.canvasSprites.find(
        sprite =>
          clickX >= sprite.x &&
          clickX <= sprite.x + sprite.width &&
          clickY >= sprite.y &&
          clickY <= sprite.y + sprite.height
      );

      if (clickedSprite) {
        this.focusSprite(clickedSprite);
      }
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button === 1) {
      this.isDragging = false;
      if (this.canvas) this.canvas.style.cursor = 'auto';
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (this.isDragging) {
      const dx = e.clientX - this.mousePosition.x;
      const dy = e.clientY - this.mousePosition.y;
      const newCameraPosition = {
        x: this.cameraPosition.x - dx / this.scale,
        y: this.cameraPosition.y - dy / this.scale,
      };
      this.updateCameraPosition(newCameraPosition);
      this.focusedSprite = null;
      this.targetCameraPosition = null;
      this.targetScale = 1;
      this.lerpStartTime = Date.now();
      this.drawCanvas();
    }

    this.updateMousePosition({ x: e.clientX, y: e.clientY });
  };

  private handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      this.isDragging = true;
      const touch = e.touches[0];
      this.updateMousePosition({ x: touch.clientX, y: touch.clientY });
    } else if (e.touches.length === 2) {
      const to = e.touches[0];
      const tu = e.touches[1];
      this.lastTouchDistance = Math.hypot(
        to.clientX - tu.clientX,
        to.clientY - tu.clientY
      );
    }
  };

  private handleTouchEnd = () => {
    this.isDragging = false;
    this.lastTouchDistance = null;
  };

  private handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && this.isDragging) {
      const touch = e.touches[0];
      const dx = touch.clientX - this.mousePosition.x;
      const dy = touch.clientY - this.mousePosition.y;
      const newCameraPosition = {
        x: this.cameraPosition.x - dx / this.scale,
        y: this.cameraPosition.y - dy / this.scale,
      };
      this.updateCameraPosition(newCameraPosition);
      this.updateMousePosition({ x: touch.clientX, y: touch.clientY });
      this.focusedSprite = null;
      this.targetCameraPosition = null;
      this.targetScale = 1;
      this.lerpStartTime = Date.now();
      this.drawCanvas();
    } else if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );

      if (this.lastTouchDistance !== null) {
        const oldScale = this.scale;
        const scaleChange = currentDistance / this.lastTouchDistance;
        const newScale = Math.min(
          Math.max(1, oldScale * scaleChange),
          MAX_SCALE
        );

        const rect = this.canvas.getBoundingClientRect();
        const midX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
        const midY = (touch1.clientY + touch2.clientY) / 2 - rect.top;

        const worldX = this.cameraPosition.x + midX / oldScale;
        const worldY = this.cameraPosition.y + midY / oldScale;

        const newCameraPosition = {
          x: worldX - midX / newScale,
          y: worldY - midY / newScale,
        };
        this.updateCameraPosition(newCameraPosition);
        this.scale = newScale;
        this.lastTouchDistance = currentDistance;
        this.focusedSprite = null;
        this.targetCameraPosition = null;
        this.targetScale = 1;
        this.lerpStartTime = Date.now();
        this.drawCanvas();
      }
    }
  };

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 1;
    const oldScale = this.scale;
    const newScale = Math.min(
      Math.max(1, oldScale - e.deltaY * 0.01 * zoomSpeed),
      MAX_SCALE
    );

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = this.cameraPosition.x + mouseX / oldScale;
    const worldY = this.cameraPosition.y + mouseY / oldScale;

    const newCameraPosition = {
      x: worldX - mouseX / newScale,
      y: worldY - mouseY / newScale,
    };
    this.updateCameraPosition(newCameraPosition);
    this.scale = newScale;
    this.focusedSprite = null;
    this.targetCameraPosition = null;
    this.targetScale = 1;
    this.lerpStartTime = Date.now();

    if (this.scaleTimeout) clearTimeout(this.scaleTimeout);
    this.scaleTimeout = setTimeout(() => {
      this.scale = newScale;
    }, 100);

    this.drawCanvas();
  };

  private initEventListeners = () => {
    window.addEventListener('resize', this.resizeCanvas);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('wheel', this.handleWheel);
    this.canvas.addEventListener('touchstart', this.handleTouchStart, {
      passive: false,
    });
    this.canvas.addEventListener('touchmove', this.handleTouchMove, {
      passive: false,
    });
    this.canvas.addEventListener('touchend', this.handleTouchEnd);
  };

  public cleanup = () => {
    window.removeEventListener('resize', this.resizeCanvas);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
  };

  public drawCanvas = () => {
    if (this.raf) return;

    this.raf = requestAnimationFrame(() => {
      if (!this.ctx) return;

      this.raf = null;
      const { width, height } = this.canvas;

      let isCameraAnimated = false;
      if (this.lerpStartTime !== null && this.targetCameraPosition) {
        const elapsed = Date.now() - this.lerpStartTime;
        const t = Math.min(elapsed / LERP_DURATION, 1);

        this.cameraPosition.x = this.lerp(
          this.cameraPosition.x,
          this.targetCameraPosition.x,
          t
        );
        this.cameraPosition.y = this.lerp(
          this.cameraPosition.y,
          this.targetCameraPosition.y,
          t
        );
        this.scale = this.lerp(this.scale, this.targetScale, t);

        if (t < 1) {
          isCameraAnimated = true;
        } else {
          this.lerpStartTime = null;
          this.cameraPosition.x = Math.round(this.cameraPosition.x);
          this.cameraPosition.y = Math.round(this.cameraPosition.y);
        }
        this.setCamera(this.cameraPosition);
      }

      const needsRedraw =
        this.canvasSprites.some(image => image.opacity < 1) ||
        this.cameraPosition.x !== this.lastCameraPosition?.x ||
        this.cameraPosition.y !== this.lastCameraPosition?.y ||
        this.scale !== this.lastScale ||
        this.focusedSprite !== null ||
        isCameraAnimated;

      if (!needsRedraw && !this.manualRedraw) return;

      if (isDevelopmentMode) {
        console.info(
          `[${new Date().toLocaleTimeString()}]`,
          'pixel-canvas is redrawed'
        );
      }

      this.manualRedraw = false;
      this.lastCameraPosition = { ...this.cameraPosition };
      this.lastScale = this.scale;

      this.ctx.save();
      this.ctx.clearRect(0, 0, width, height);

      this.ctx.scale(this.scale, this.scale);
      this.ctx.translate(-this.cameraPosition.x, -this.cameraPosition.y);

      const gridSize = this.props.size;
      const START_X = Math.floor(this.cameraPosition.x / gridSize) * gridSize;
      const START_Y = Math.floor(this.cameraPosition.y / gridSize) * gridSize;
      const endX = this.cameraPosition.x + width / this.scale;
      const endY = this.cameraPosition.y + height / this.scale;

      for (let x = START_X; x < endX; x += gridSize) {
        for (let y = START_Y; y < endY; y += gridSize) {
          const isDark =
            (Math.floor(x / gridSize) + Math.floor(y / gridSize)) % 2 === 0;
          this.ctx.fillStyle = isDark
            ? this.props.color.first
            : this.props.color.second;
          this.ctx.fillRect(x, y, gridSize, gridSize);
        }
      }

      this.ctx.restore();
      this.ctx.imageSmoothingEnabled = false;

      this.canvasSprites.forEach(image => {
        if (!this.ctx) return;

        const elapsed = Date.now() - image.fadeStartTime;
        image.opacity = Math.min(elapsed / this.fadeDuration, 1);

        const renderX = Math.round(
          (image.x - this.cameraPosition.x) * this.scale
        );
        const renderY = Math.round(
          (image.y - this.cameraPosition.y) * this.scale
        );
        const renderWidth = Math.round(image.width * this.scale);
        const renderHeight = Math.round(image.height * this.scale);

        // this.ctx.globalAlpha = 1;
        // // this.focusedSprite && image !== this.focusedSprite
        // //   ? image.opacity * 0.3
        // //   : image.opacity;

        this.ctx.drawImage(
          image.img,
          renderX,
          renderY,
          renderWidth,
          renderHeight
        );

        if (this.props.borders.isEnabled) {
          this.ctx.globalAlpha = 1;
          this.ctx.strokeStyle = this.props.borders.color;
          this.ctx.strokeRect(renderX, renderY, renderWidth, renderHeight);
        }
      });

      this.ctx.globalAlpha = 1;

      if (
        this.canvasSprites.some(image => image.opacity < 1) ||
        isCameraAnimated
      ) {
        this.drawCanvas();
        this.updateCameraPosition({
          x: this.cameraPosition.x,
          y: this.cameraPosition.y,
        });
      }
    });
  };

  public resizeCanvas = () => {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.drawCanvas();
    this.centerCamera();
  };

  public getCameraPosition = (): Position => {
    return this.cameraPosition;
  };

  public getCursorPosition = (): Position => {
    return this.mousePosition;
  };
}

export { CanvasManager };
