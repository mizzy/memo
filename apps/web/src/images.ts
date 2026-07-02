const MAX_IMAGE_SIDE = 2048;
const WEBP_QUALITY = 0.85;

type Size = {
  width: number;
  height: number;
};

type CanvasTarget = OffscreenCanvas | HTMLCanvasElement;

export function calcResizedSize(
  width: number,
  height: number,
  max: number
): Size {
  if (width <= 0 || height <= 0 || max <= 0) {
    throw new Error("Image size must be positive");
  }

  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function createCanvas(width: number, height: number): CanvasTarget {
  if ("OffscreenCanvas" in globalThis) {
    return new OffscreenCanvas(width, height);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function canvasToBlob(canvas: CanvasTarget): Promise<Blob> {
  if ("convertToBlob" in canvas) {
    return canvas.convertToBlob({
      type: "image/webp",
      quality: WEBP_QUALITY,
    });
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to encode image"));
      },
      "image/webp",
      WEBP_QUALITY
    );
  });
}

export async function resizeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const size = calcResizedSize(bitmap.width, bitmap.height, MAX_IMAGE_SIDE);
    const canvas = createCanvas(size.width, size.height);
    const context = canvas.getContext("2d");
    if (!context || !("drawImage" in context)) {
      throw new Error("Canvas 2D context is unavailable");
    }

    context.drawImage(bitmap, 0, 0, size.width, size.height);
    return await canvasToBlob(canvas);
  } finally {
    bitmap.close();
  }
}
