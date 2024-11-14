/**
 * The information of the file to be shown on the File Pane, including file name and whether the file has a JSON associated with
 */
export type FileList = {
    /**
     * The name of the file
     */
    fileName: string;
    /**
     * Whether the file has a JSON file associated with when imported
     */
    isAnnotated: boolean;
}
