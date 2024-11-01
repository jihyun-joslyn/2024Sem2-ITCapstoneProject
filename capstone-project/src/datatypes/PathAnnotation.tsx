export type PathAnnotation = {
    point: Point[];
    edge: any[];
    faces: FaceLabel[];
}

export type Point = {
    x: Number;
    y: Number;
    z: Number;
    color: string;
}

export type FaceLabel =  {
    vertex: Number;
    color: string;
}
