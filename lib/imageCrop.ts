/**
 * Crops an image to the target dimensions
 * @param imageUrl - Data URL or blob URL of the image
 * @param targetWidth - Target width (default: 1280)
 * @param targetHeight - Target height (default: 720)
 * @param offsetX - Horizontal offset as percentage (0-1, default: 0.5 for center)
 * @param offsetY - Vertical offset as percentage (0-1, default: 0.5 for center)
 * @returns Promise<string> - Base64 encoded cropped image (without data URL prefix)
 */
export async function cropImageFromCenter(
  imageUrl: string,
  targetWidth: number = 1280,
  targetHeight: number = 720,
  offsetX: number = 0.5,
  offsetY: number = 0.5
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        // Create a canvas with target dimensions
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate the aspect ratios
        const targetAspectRatio = targetWidth / targetHeight;
        const imageAspectRatio = img.width / img.height;

        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = img.width;
        let sourceHeight = img.height;

        // Calculate crop dimensions to maintain aspect ratio
        if (imageAspectRatio > targetAspectRatio) {
          // Image is wider than target - crop width
          sourceWidth = img.height * targetAspectRatio;
          const maxOffset = img.width - sourceWidth;
          sourceX = maxOffset * offsetX;
        } else {
          // Image is taller than target - crop height
          sourceHeight = img.width / targetAspectRatio;
          const maxOffset = img.height - sourceHeight;
          sourceY = maxOffset * offsetY;
        }

        // Draw the cropped and scaled image
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,  // Source rectangle
          0, 0, targetWidth, targetHeight                // Destination rectangle
        );

        // Convert to base64 (without the data URL prefix)
        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1];

        resolve(base64);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageUrl;
  });
}

/**
 * Get image dimensions from a data URL or blob URL
 */
export async function getImageDimensions(imageUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageUrl;
  });
}
