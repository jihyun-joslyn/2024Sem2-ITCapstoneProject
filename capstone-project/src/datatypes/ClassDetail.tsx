/**
 * The details of the class, including the class name and the details of the linked annotation
 */
export type ClassDetail = {
    /**
     * The name of the class
     */
    name: string;
    /**
     * The annotation type of the linked annotation
     */
    annotationType: AnnotationType;
    /**
     * The coordinates of the linked annotation
     */
    coordinates: any[];
    /**
     * The color of the linked annotation
     */
    color: string;
    /**
     * Whether the class is being selected or not
     */
    isAnnotating: boolean;
}

/**
 * The annotation types of the annotations, more specifically, the annotation tools used to create the annotations
 */
export enum AnnotationType{
    KEYPOINT,
    SPRAY,
    PATH,
    NONE
}