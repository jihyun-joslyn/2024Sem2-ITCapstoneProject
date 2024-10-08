import { ProblemType } from "./ProblemType";

export type FileAnnotation = {
    fileName: string;
    fileObject: File;
    problems: ProblemType[];
    annotated: Boolean;
}