import { ClassDetail } from "./ClassDetail";

/**
 * The labels and the name of the problem
 */
export type ProblemType = {
    /**
     * The problem name
     */
    name: string;
    /**
     * The classes associated 
     */
    classes: ClassDetail[];
}