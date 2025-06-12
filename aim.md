This experiment aims to demonstrate the implementation of the Scan-Line Polygon Fill algorithm for rasterizing polygons in computer graphics. The specific objectives are:

1. To implement the Scan-Line algorithm for filling polygon interiors with pixels
2. To understand how the algorithm processes polygon edges and determines interior pixels
3. To analyze the efficiency of the algorithm in handling complex polygon shapes

The experiment focuses on the Scan-Line algorithm as it provides an efficient solution for polygon rasterization, particularly for complex shapes with multiple edges.

In digital display systems, everything that is displayed, is displayed in terms of a smallest unit of display, which is called a pixel. This is in contrast to what we perceive the world to be as continuous. The space occupied by any image in digital display system is measured in terms of pixels. Thus we need to transform the continuous space in which we define he geometry of any figure to a discrete space for display in digital displays. This transformation is called **rasterization** or **scan conversion**   

When a polygon is transformed from a set of edges in the continuous form of y = mx + c into a set of pixels occupied by the interior of the polygon, this transformation is called **polygon rasterization**. Thus when we apply polygon rasterization technique on a polygon, we obtain the set of pixels that are required to be filled in order to fill the entire interior area bounded by the edges of the polygon in the best possible manner. Some common algorithms to perform polygon rasterization are as follows:    

  a. Scan-Line Polygon Fill algorithm  
  b. Seed Fill or Boundary Fill algorithm    

Here we have discussed only the Scan-Line Polygon Fill algorithm.     