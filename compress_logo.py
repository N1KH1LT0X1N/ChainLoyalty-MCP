from PIL import Image
import os

img_path = r"C:\Users\admin\.gemini\antigravity\brain\840fff2b-41e9-446f-af18-d6fd8ef6ce53\chainloyalty_logo_1775360016454.png"
out_path = r"C:\Dev\GitGoneWild\packages\ChainLoyalty\ChainLoyalty-MCP\logo.png"

with Image.open(img_path) as img:
    # Ensure it's square
    w, h = img.size
    min_dim = min(w, h)
    
    # Crop to center
    left = (w - min_dim) / 2
    top = (h - min_dim) / 2
    right = (w + min_dim) / 2
    bottom = (h + min_dim) / 2
    img = img.crop((left, top, right, bottom))
    
    # Resize to 256x256
    img = img.resize((256, 256), Image.Resampling.LANCZOS)
    
    # Convert and quantize to ensure small file size
    img = img.convert('P', palette=Image.ADAPTIVE, colors=16)
    
    # Save optimized
    img.save(out_path, format="PNG", optimize=True)

size_kb = os.path.getsize(out_path) / 1024
print(f"Saved size: {size_kb:.2f} KB, dimensions: {img.size}")
