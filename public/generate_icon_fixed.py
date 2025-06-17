# /Users/montysharma/V11M2/public/generate_icon_fixed.py
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Wedge, Circle

# Create figure with no transparency issues
fig, ax = plt.subplots(figsize=(5.12, 5.12), dpi=100)
fig.patch.set_facecolor('#3B82F6')  # Set figure background
ax.set_xlim(-256, 256)
ax.set_ylim(-256, 256)
ax.set_facecolor('#3B82F6')  # Set axes background
ax.axis('off')

# Add main circle background
circle = Circle((0, 0), 240, facecolor='#1E40AF', edgecolor='none')
ax.add_patch(circle)

# Create 5 segments for life categories
center = (0, 0)
radius = 180
segment_colors = ['#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE', '#EFF6FF']

for i in range(5):
    angle_start = 90 - i * 72
    angle_end = angle_start - 72
    wedge = Wedge(center, radius, angle_end, angle_start, 
                  facecolor=segment_colors[i], alpha=0.8, 
                  edgecolor='white', linewidth=2)
    ax.add_patch(wedge)

# Add center circle
center_circle = Circle((0, 0), 60, facecolor='white', edgecolor='#3B82F6', linewidth=3)
ax.add_patch(center_circle)

# Add simple heart shape using text (more reliable)
ax.text(0, 0, '♥', fontsize=60, color='#EF4444', ha='center', va='center', weight='bold')

# Add "MMV" text at bottom
ax.text(0, -200, 'MMV', fontsize=48, color='white', ha='center', va='center', weight='bold')

# Save without bbox_inches='tight' to avoid cropping issues
plt.savefig('icon.png', dpi=100, facecolor='#3B82F6', edgecolor='none')
plt.close()

print("Icon saved as: icon.png")
