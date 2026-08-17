import os
from PIL import Image

def pad_image_for_adaptive_icon(filepath, scale_factor=0.6):
    print(f"Processing {filepath}")
    img = Image.open(filepath).convert("RGBA")
    
    # Calculate the new size for the icon (scale down to 60% of original canvas to add padding)
    original_size = img.size
    
    # The new canvas size should be larger to effectively "zoom out" the image.
    # If the image is currently X by X, the new canvas will be X / scale_factor.
    # We will resize the original image to scale_factor * 1024, on a 1024x1024 canvas
    
    # Let's standardize to 1024x1024 canvas
    canvas_size = 1024
    new_img_size = int(canvas_size * scale_factor)
    
    img_resized = img.resize((new_img_size, new_img_size), Image.Resampling.LANCZOS)
    
    # Create a new transparent canvas
    new_img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    
    # Paste the resized image in the center
    offset = (canvas_size - new_img_size) // 2
    new_img.paste(img_resized, (offset, offset), img_resized)
    
    # Overwrite the original file
    new_img.save(filepath)
    print("Done padding image.")

# The foreground image needs padding so it doesn't get cropped
pad_image_for_adaptive_icon('mobile/assets/images/android-icon-foreground.png', scale_factor=0.6)
# Splash icon usually needs to be centered and not too huge either, but Expo splash handles it with imageWidth
