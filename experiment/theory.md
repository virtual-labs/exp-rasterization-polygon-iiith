
# Scanline Algorithm

The **Scanline Algorithm** is used in **computer graphics** to efficiently fill polygons or detect intersections. It processes one horizontal line (scanline) at a time and determines which sections of the scanline are inside the polygon.


## Key Concepts

1. **Active Edge Table (AET)**:
   - A dynamic list that maintains edges of the polygon currently intersecting the scanline.
   - Edges in the AET are sorted by their **x-coordinates** of intersection with the scanline.

2. **Edge Table (ET)**:
   - A static structure that stores all edges of the polygon, grouped by their starting **y-coordinate**.
   - Each entry includes:
     - Starting and ending coordinates of the edge.
     - The **slope inverse** (1/m) for calculating the next x-coordinate.

3. **Parity Rule**:
   - The **parity rule** helps determine which parts of a scanline lie inside the polygon:
     - When a scanline crosses a polygon edge, the **parity** flips (odd ↔ even).
     - Inside regions occur between pairs of edges where parity is odd.

## Parity Rule

The **parity rule** is used to determine whether a point on a scanline is inside or outside the polygon. It works by flipping the parity (even ↔ odd) each time a scanline crosses an edge of the polygon.

- **Parity = 0 (even)**: The point is outside the polygon.
- **Parity = 1 (odd)**: The point is inside the polygon.

### How the Parity Rule Works:
1. **Initial Parity**: Start with parity = 0 (outside the polygon).
2. **Intersection with edges**:
   - For each intersection of the scanline with an edge:
     - If the scanline enters the polygon (crosses from outside to inside), **increment the parity**.
     - If the scanline leaves the polygon (crosses from inside to outside), **decrement the parity**.
3. **Fill spans**: When parity is odd, the span between two intersections should be filled (inside the polygon).


## Steps of the Algorithm

### 1. **Initialization**
   - Create an **Edge Table (ET)**:
     - Sort edges by their starting **y-coordinate**.
     - Ignore horizontal edges (as they don't affect filling).
   - Initialize the **Active Edge Table (AET)** as empty.

### 2. **Process Scanlines**
   - Iterate through scanlines from the lowest to the highest **y-coordinate** of the polygon:
     1. **Add edges** to the AET:
        - Add edges from the ET that start at the current scanline.
     2. **Remove edges** from the AET:
        - Remove edges whose ending **y-coordinate** equals the current scanline.
     3. **Sort the AET**:
        - Sort edges in the AET by their x-coordinates.
     4. **Fill spans**:
        - Use the **parity rule** to identify spans (pairs of x-coordinates) and fill them.

### 3. **Update Edge Information**
   - Update the **x-coordinates** of edges in the AET for the next scanline:
     - Use the slope inverse to increment the x-coordinate.

### 4. **Repeat**
   - Continue until all scanlines are processed.


## Advantages
- Efficient for filling complex polygons.
- Handles non-convex polygons and polygons with holes.


## Limitations
- Doesn't directly handle self-intersecting polygons.
- Requires preprocessing of edges (like sorting).


## Applications
- Rasterizing polygons in computer graphics.
- Rendering 2D shapes in games and CAD systems.

