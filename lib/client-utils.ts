/**
 * Compresses an image file on the client-side before upload.
 * Resizes the image and converts it to WebP format.
 * 
 * @param file The original image file
 * @param maxWidth Maximum width in pixels
 * @param quality Quality from 0 to 1
 * @returns A Promise that resolves to a compressed Blob
 */
export async function prepareImageForUpload(
    file: File,
    maxWidth: number = 800,
    quality: number = 0.8
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        // 1. Read the file
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;

            img.onload = () => {
                // 2. Calculate new dimensions
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((maxWidth / width) * height);
                    width = maxWidth;
                }

                // 3. Draw to canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }

                // Use a nice white background for transparency fallback
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                // 4. Export as WebP
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Image compression failed'));
                        }
                    },
                    'image/webp',
                    quality
                );
            };

            img.onerror = () => reject(new Error('Failed to load image for compression'));
        };

        reader.onerror = () => reject(new Error('Failed to read image file'));
    });
}
