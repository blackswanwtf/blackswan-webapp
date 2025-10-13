import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function debounce<F extends (...args: any[]) => any>(
  func: F,
  waitFor: number
) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => void;
}

// Token balance formatting utility
export function formatBalance(balance: number): string {
  if (balance >= 1000000) return `${(balance / 1000000).toFixed(2)}M`;
  if (balance >= 1000) return `${(balance / 1000).toFixed(2)}K`;
  if (balance >= 1) return balance.toFixed(2);
  if (balance >= 0.01) return balance.toFixed(4);
  return balance.toFixed(6);
}

// ASCII Art Conversion Utility with transparency and detail support
export const convertImageToAscii = (
  imageSrc: string,
  maxWidth: number = 120,
  maxHeight: number = 40
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    img.onload = () => {
      // Calculate dimensions maintaining aspect ratio
      const aspectRatio = img.width / img.height;
      let width = maxWidth;
      let height = Math.floor(width / aspectRatio / 2); // Divide by 2 for character aspect ratio

      if (height > maxHeight) {
        height = maxHeight;
        width = Math.floor(height * aspectRatio * 2);
      }

      canvas.width = width;
      canvas.height = height;

      // Clear canvas with transparent background
      ctx.clearRect(0, 0, width, height);

      // Draw image to canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Get image data
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels = imageData.data;

      // Enhanced ASCII characters from darkest to lightest with more gradations
      const asciiChars = "█▉▊▋▌▍▎▏▓▒░@&#%*+=~-:;,. ";
      let asciiArt = "";

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const offset = (y * width + x) * 4;
          const r = pixels[offset];
          const g = pixels[offset + 1];
          const b = pixels[offset + 2];
          const a = pixels[offset + 3]; // Alpha channel

          // Handle transparency - if pixel is transparent, use space
          if (a < 30) {
            asciiArt += " ";
            continue;
          }

          // Improved brightness calculation using luminance formula
          const brightness = (0.299 * r + 0.587 * g + 0.114 * b) * (a / 255);

          // Map brightness to ASCII character with better distribution
          const normalizedBrightness = brightness / 255;
          const charIndex = Math.floor(
            normalizedBrightness * (asciiChars.length - 1)
          );

          // Invert the character selection (darker chars for darker pixels)
          const invertedIndex = asciiChars.length - 1 - charIndex;
          asciiArt += asciiChars[invertedIndex];
        }
        asciiArt += "\n";
      }

      resolve(asciiArt);
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.crossOrigin = "anonymous";
    img.src = imageSrc;
  });
};
