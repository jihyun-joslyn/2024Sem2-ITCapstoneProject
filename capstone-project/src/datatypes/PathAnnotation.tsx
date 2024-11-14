/**
 * The details of the path annotation, including the point and edge coordinates and the vertex indexes of the colored faces.
 * 
 * Substitude as the coordinates for the path annotation
 */
export type PathAnnotation = {
    /**
     * The coordinates of the points
     */
    point: Point[];
    /**
     * The coordinates of the edges
     */
    edge: PointCoordinates[];
    /**
     * The color and the vertex indexes of the colored faces
     */
    faces: FaceLabel[];
}

/**
 * The (x, y, z) coordinates of the point
 */
export type PointCoordinates = {
    /**
     * The x coordinate
     */
    x: Number;
    /**
     * The y coordinate
     */
    y: Number;
    /**
     * The z coordinate
     */
    z: Number;
}

/** 
 * The information of the point, including the coordinates and the color
 */
export type Point =  {
    /**
     * The coordinates of the point
     */
    coordinates: PointCoordinates,
    /**
     * The color of the point sphere
     */
    color: string
}

/**
 * The information of the colored face, including the vertex index and the color
 */
export type FaceLabel =  {
    /**
     * The vertex index of the colored face
     */
    vertex: Number;
    /**
     * The color of the colored face
     */
    color: string;
}
