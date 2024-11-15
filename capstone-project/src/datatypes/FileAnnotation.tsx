import { ProblemType } from "./ProblemType";

/**
 * The information of the file, including the file name and the associated problems
 */
export type FileAnnotation = {
    /**
     * The name of the files
     */
    fileName: string;
    /**
     * The file object of the file
     */
    fileObject: File;
    /**
     * The associated problems
     */
    problems: ProblemType[];
    /**
     * Whether the file has a JSON file associated with when imported
     */
    annotated: boolean;
}