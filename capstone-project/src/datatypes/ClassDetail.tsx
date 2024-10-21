export type ClassDetail = {
    name: string;
    annotationType: AnnotationType;
    coordinates: any[];
    color: string;
}

export enum AnnotationType{
    KEYPOINT,
    SPRAY,
    PATH,
    NONE
}