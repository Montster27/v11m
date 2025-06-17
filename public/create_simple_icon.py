# /Users/montysharma/V11M2/public/create_simple_icon.py
from PIL import Image, ImageDraw, ImageFont
import math

# Create a 512x512 image with blue background
size = 512
img = Image.new('RGB', (size, size), '#3B82F6')
draw = ImageDraw.Draw(img)

# Draw 5 segments (pie chart style)
center = (size//2, size//2)
radius = 180
colors = ['#1E40AF', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD']

for i in range(5):
    start_angle = i * 72 - 90  # Start from top
    end_angle = (i + 1) * 72 - 90
    draw.pieslice([center[0]-radius, center[1]-radius, 
                   center[0]+radius, center[1]+radius], 
                  start_angle, end_angle, fill=colors[i])

# Draw white center circle
center_radius = 80
draw.ellipse([center[0]-center_radius, center[1]-center_radius,
              center[0]+center_radius, center[1]+center_radius], 
             fill='white')

# Draw heart shape manually (simple approach)
heart_size = 30
heart_x, heart_y = center[0], center[1] - 10

# Two circles for heart top
draw.ellipse([heart_x-heart_size, heart_y-heart_size//2,
              heart_x, heart_y+heart_size//2], fill='#EF4444')
draw.ellipse([heart_x, heart_y-heart_size//2,
              heart_x+heart_size, heart_y+heart_size//2], fill='#EF4444')

# Triangle for heart bottom
points = [(heart_x-heart_size, heart_y),
          (heart_x+heart_size, heart_y),
          (heart_x, heart_y+heart_size)]
draw.polygon(points, fill='#EF4444')

# Add text "MMV" - use default font
try:
    # Try to use a nice font
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 60)
except:
    # Fallback to default font
    font = ImageFont.load_default()

text = "MMV"
# Get text size
bbox = draw.textbbox((0, 0), text, font=font)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]

# Position text at bottom
text_x = center[0] - text_width//2
text_y = center[1] + 120

draw.text((text_x, text_y), text, fill='white', font=font)

# Save the image
img.save('icon.png')
print("Icon created successfully as icon.png")
