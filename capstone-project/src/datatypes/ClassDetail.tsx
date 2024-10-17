export type ClassDetail = {
    name: string;
    annotationType: AnnotationType;
    coordinates: any[];
    color: string;
    isAnnotating: boolean;
}

export enum AnnotationType{
    KEYPOINT,
    SPRAY,
    PATH,
    NONE
}