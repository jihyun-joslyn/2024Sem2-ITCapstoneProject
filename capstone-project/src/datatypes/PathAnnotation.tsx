export type PathAnnotation = {
    point: Point[];
    edge: PointCoordinates[];
    faces: FaceLabel[];
}

export type PointCoordinates = {
    x: Number;
    y: Number;
    z: Number;
}

export type Point =  {
    coordinates: PointCoordinates,
    color: string
}

export type FaceLabel =  {
    vertex: Number;
    color: string;
}
