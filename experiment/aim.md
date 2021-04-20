In digital display systems, everything that is displayed, is displayed in terms of a smallest unit of display, which is called a pixel. This is in contrast to what we perceive the world to be as continuous. The space occupied by any image in digital display system is measured in terms of pixels. Thus we require to transform the continuous space in which we define he geometry of any figure to a discrete space for display in digital displays. This transformation is called **rasterization** or **scan conversion**

When a polygon is transformed from a set of edges in the continous form of y = mx + c into a set of pixels occupied by the interior of the polygon, this transformation is called **polygon rasterization**. Thus when we apply polygon rasterization technique on a polygon, we obtain the set of pixels that are required to be filled in order to fill the entire interior area bounded by the edges of the polygon in the best possible manner. Some common algorithms to perform polygon rasterization are as follows:

  a. Scan-Line Polygon Fill algorithm
  b. Seed Fill or Boundary Fill algorithm

Here we have discussed only the Scan-Line Polygon Fill algorithm. 