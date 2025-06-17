import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Wedge

# Create canvas
fig, ax = plt.subplots(figsize=(5.12, 5.12), dpi=100)
ax.set_xlim(0, 512)
ax.set_ylim(0, 512)
ax.axis('off')

# Background - lighter blue
ax.add_patch(plt.Rectangle((0, 0), 512, 512, color='#3B82F6'))

# Radial chart segments (5 segments, 72° each) - lighter chart color
center = (256, 256)
radius = 200
colors = ['#BFDBFE', '#BFDBFE', '#BFDBFE', '#BFDBFE', '#BFDBFE']  # lighter variant
opacity = 0.6

for i in range(5):
    angle_start = 90 - i * 72
    angle_end = angle_start - 72
    wedge = Wedge(center, radius, angle_end, angle_start, facecolor=colors[i], alpha=opacity, edgecolor='none')
    ax.add_patch(wedge)

# Heart shape (parametric): adjust scale for visibility
t = np.linspace(0, 2 * np.pi, 1000)
x_heart = 256 + 75 * (16 * np.sin(t)**3)
y_heart = 256 + 75 * (13 * np.cos(t) - 5 * np.cos(2*t) - 2 * np.cos(3*t) - np.cos(4*t))

ax.fill(x_heart, y_heart, color='white')
ax.plot(x_heart, y_heart, color='white')

# Add "MMV alpha" text - use a slightly larger font and white color
plt.text(256, 100, "MMV alpha", color='white', fontsize=36, fontweight='bold', fontname='DejaVu Sans',
         ha='center', va='center')

# Save and display
output_path = "/mnt/data/mmv_alpha_icon_variation1_lighter.png"
plt.savefig(output_path, dpi=100, bbox_inches='tight', pad_inches=0)
plt.close()

output_path