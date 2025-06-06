## Introduction to Rasterization
In digital display systems, everything is displayed in terms of pixels, the smallest unit of display. This is in contrast to our perception of the world as continuous. The space occupied by any image in a digital display system is measured in terms of pixels. Thus, we need to transform the continuous space in which we define the geometry of any figure to a discrete space for display in digital displays. This transformation is called rasterization or scan conversion.

When a polygon is transformed from a set of edges in the continuous form of y = mx + c into a set of pixels occupied by the interior of the polygon, this transformation is called polygon rasterization. The goal is to determine the set of pixels that need to be filled to represent the interior area bounded by the polygon's edges in the best possible manner.

## The Scanline Algorithm

The Scanline Algorithm is a powerful technique in computer graphics used to efficiently fill polygons or detect intersections. It operates by processing the polygon one horizontal line (or scanline) at a time. By analyzing the intersections of polygon edges with each scanline, the algorithm determines which pixels within that scanline should be filled.

## Key Concepts

### 1. Edge Table (ET)
A static data structure that stores information about all the edges of the polygon. Edges are typically grouped in the ET based on their starting y-coordinate. Each edge entry usually contains:
- Starting (x₁, y₁) and ending (x₂, y₂) coordinates
- Slope inverse (1/m): Used to efficiently calculate the x-coordinate of the edge's intersection with subsequent scanlines

### 2. Active Edge Table (AET)
A dynamic list that maintains only the edges of the polygon currently intersecting the current scanline. Edges in the AET are sorted in increasing order of their x-coordinates of intersection with the current scanline. This sorting is crucial for efficient filling.

### 3. Parity Rule
A simple rule used to determine whether a given point on the scanline lies inside or outside the polygon:
- Initially, parity is set to 0 (outside)
- Parity flips (0 → 1 or 1 → 0) whenever the scanline crosses a polygon edge
- Parity = 1 (odd): The point lies inside the polygon
- Parity = 0 (even): The point lies outside the polygon

## Steps of the Algorithm

### 1. Initialization
1. Create the Edge Table (ET):
   - Sort all edges by their starting y-coordinate
   - Calculate the slope inverse (1/m) for each edge
2. Initialize the Active Edge Table (AET) as empty

### 2. Process Scanlines
Iterate through each scanline from the lowest to the highest y-coordinate of the polygon:

a. Add Edges: Add edges from the ET to the AET if their starting y-coordinate matches the current scanline's y-coordinate

b. Remove Edges: Remove edges from the AET if their ending y-coordinate matches the current scanline's y-coordinate

c. Sort AET: Sort the edges in the AET by their x-coordinates in ascending order

### 3. Fill Spans
Use the parity rule:
1. Start with parity = 0
2. For each pair of consecutive edges in the AET:
   - If parity = 1, fill the pixels between the x-coordinates of the edges
   - Flip the parity

### 4. Update AET
For each edge in the AET:
- Update the x-coordinate of the edge's intersection with the next scanline using the slope inverse (1/m)

### 5. Repeat
Continue processing scanlines until all scanlines within the polygon's bounds have been processed

## Advantages
1. Efficiency: Particularly efficient for filling complex polygons with many edges
2. Versatility: Handles non-convex polygons, polygons with holes, and even polygons with overlapping edges

## Limitations
1. Preprocessing: Requires sorting and slope calculation as a preprocessing step
2. Self-Intersections: May require special handling for self-intersecting polygons

## Applications
1. Rasterization: Filling polygons in computer graphics rendering pipelines
2. 2D Shape Rendering: Rendering 2D shapes in games, CAD software, and other applications
3. Clipping: Can be adapted for polygon clipping algorithms

This detailed explanation provides a comprehensive understanding of the Scanline Algorithm and its key concepts, ensuring clarity for students and beginners.
