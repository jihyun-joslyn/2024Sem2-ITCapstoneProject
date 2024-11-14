import { Done as DoneIcon } from '@mui/icons-material';
import { List, ListItem, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';
import { FileList } from '../datatypes/FileList';
import '../style/index.css';

export type FilePaneProps = {
    /**
     * Whether the file pane is showing in UI
     */
    isShow: boolean;
    /**
     * Trigger when users click on a file name. The function help set the clicked file as the current file
     * @param fileName the name of the file
     */
    onFileSelect: (fileName: string) => void;
    /**
     * The file name of the current file shown in UI
     */
    currentFile: string;
    /**
     * The list of the name of the files being imported by users
     */
    fileList: FileList[]
};

export default function FilePane({ isShow, fileList, onFileSelect, currentFile }: FilePaneProps) {
    //when the file is not showing
    if (!isShow) {
        return null;
    }
    
    return (
        <div>
            {isShow && (
                <div id="file-pane">
                    <Toolbar id="file-pane-header">
                        <Typography>File Pane</Typography>
                    </Toolbar>
                    <List>
                        {fileList.map((file, index) => (
                            <ListItem
                                component="button"
                                key={index}
                                onClick={() => onFileSelect(file.fileName)}
                                className={currentFile === file.fileName ? 'selected-file' : ''} //highlight the file if the file is selected
                                sx={{ paddingLeft: '16px' }}
                            >
                                {/* show a tick next to the file name if the file has a JSON exported */}
                                {file.isAnnotated && (
                                    <ListItemIcon className="file-pane-icon">
                                        <DoneIcon fontSize="small" />
                                    </ListItemIcon>
                                )}
                                <ListItemText primary={file.fileName}
                                    sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }} />
                            </ListItem>

                        ))}
                    </List>
                </div>
            )}
        </div>
    );
}
