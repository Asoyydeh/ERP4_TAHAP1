import sys
import os
from PIL import Image

def process_original_logo(input_path, output_path):
    print(f"Processing original logo from: {input_path}")
    img = Image.open(input_path).convert("RGBA")
    
    # Process background white pixels to transparent
    datas = img.getdata()
    new_data = []
    
    for item in datas:
        r, g, b, a = item
        # If pixel is white or very light background
        if r > 230 and g > 230 and b > 230:
            avg = (r + g + b) / 3.0
            if avg > 248:
                new_data.append((255, 255, 255, 0))
            else:
                # Soft feathering
                alpha = int(255 * (248 - avg) / 18.0)
                new_data.append((r, g, b, max(0, min(255, alpha))))
        else:
            new_data.append((r, g, b, a))
            
    img.putdata(new_data)
    
    # Crop bounding box of visible content
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(output_path, "PNG")
    print(f"Successfully processed logo from {input_path} -> {output_path} (Final dimensions: {img.size})")

if __name__ == "__main__":
    src_logo = r"c:\PROJECT\assetmenagemen\LOGO\MJK.png"
    dest_logo = r"c:\PROJECT\assetmenagemen\frontend\public\mjk_logo.png"
    if os.path.exists(src_logo):
        process_original_logo(src_logo, dest_logo)
    else:
        print(f"Source file not found at {src_logo}")
