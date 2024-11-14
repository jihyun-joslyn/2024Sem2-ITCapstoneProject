/**
 * The file format for the exported JSON file
 */
export type OutputFile = {
    /**
     * The name of the file
     */
    fileName: string;
    /**
     * The JSON string of the associated problems
     */
    problems: string;
}
