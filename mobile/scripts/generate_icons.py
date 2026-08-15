import os
from PIL import Image, ImageDraw

def create_icon(name, draw_fn):
    # Base canvas size for high-quality drawing
    base_size = 512
    img = Image.new('RGBA', (base_size, base_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Run custom drawing function
    draw_fn(draw, base_size)
    
    # Save sizes matching home icon: 1x (24x24), 2x (48x48), 3x (72x72)
    target_dir = r"a:\PyuNovel\mobile\assets\images\tabIcons"
    os.makedirs(target_dir, exist_ok=True)
    
    sizes = {
        "": 24,
        "@2x": 48,
        "@3x": 72
    }
    
    for suffix, size in sizes.items():
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        out_path = os.path.join(target_dir, f"{name}{suffix}.png")
        resized.save(out_path, "PNG")
        print(f"Saved {out_path} ({size}x{size})")

def draw_explore(draw, size):
    pen_color = (0, 0, 0, 255)
    width = 32
    
    # Magnifying glass circle
    # Center (220, 220), Radius 105
    draw.ellipse(
        [220 - 105, 220 - 105, 220 + 105, 220 + 105],
        outline=pen_color,
        width=width
    )
    
    # Magnifying glass handle
    # From (295, 295) to (420, 420)
    draw.line([294, 294, 420, 420], fill=pen_color, width=width + 6)

def draw_library(draw, size):
    pen_color = (0, 0, 0, 255)
    width = 32
    
    # Draw book cover outline
    # x: 130 to 382, y: 80 to 432
    draw.rounded_rectangle(
        [130, 80, 382, 432],
        radius=25,
        outline=pen_color,
        width=width
    )
    
    # Draw spine vertical separator line
    draw.line([185, 80, 185, 432], fill=pen_color, width=width)
    
    # Draw bookmark ribbon
    draw.line([270, 80, 270, 230], fill=pen_color, width=width)
    draw.line([305, 80, 305, 230], fill=pen_color, width=width)
    draw.line([270, 230, 287, 210], fill=pen_color, width=width)
    draw.line([305, 230, 287, 210], fill=pen_color, width=width)

def draw_profile(draw, size):
    pen_color = (0, 0, 0, 255)
    width = 32
    
    # Head circle
    draw.ellipse(
        [256 - 75, 175 - 75, 256 + 75, 175 + 75],
        outline=pen_color,
        width=width
    )
    
    # Shoulder arc
    draw.arc(
        [100, 290, 412, 570],
        start=180,
        end=360,
        fill=pen_color,
        width=width
    )
    
    # Bottom line connecting the shoulder edges
    draw.line([100 + (width//2), 430, 412 - (width//2), 430], fill=pen_color, width=width)

if __name__ == "__main__":
    create_icon("explore", draw_explore)
    create_icon("library", draw_library)
    create_icon("profile", draw_profile)
    print("Done generating tab icons!")
