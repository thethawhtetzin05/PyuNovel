import os
from PIL import Image

def make_square(filepath):
    print(f"Making {filepath} square...")
    try:
        img = Image.open(filepath).convert("RGBA")
        
        # Get dimensions
        width, height = img.size
        size = max(width, height)
        
        # Create a new square transparent image
        new_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        
        # Paste the original image in the center
        offset_x = (size - width) // 2
        offset_y = (size - height) // 2
        new_img.paste(img, (offset_x, offset_y), img)
        
        # Resize to standard 1024x1024
        final_img = new_img.resize((1024, 1024), Image.Resampling.LANCZOS)
        final_img.save(filepath)
        print(f"Successfully squared and resized {filepath}")
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

make_square('mobile/assets/images/icon.png')
make_square('mobile/assets/images/splash-icon.png')
# android-icon-foreground.png was already padded to 1024x1024 by previous script, but let's run it just in case to be safe
make_square('mobile/assets/images/android-icon-foreground.png')
