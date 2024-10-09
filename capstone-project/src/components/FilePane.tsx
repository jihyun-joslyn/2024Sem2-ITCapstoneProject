import { Toolbar, Typography, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { Done as DoneIcon } from '@mui/icons-material';
import '../style/index.css';
import { FileList } from '../datatypes/FileList';

export type FilePaneProps = {
    isShow: boolean;
    onFileSelect: (fileName: string) => void;
    currentFile: string;
    fileList: FileList[]
};

export default function FilePane({ isShow, fileList, onFileSelect, currentFile }: FilePaneProps) {
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
                                className={currentFile === file.fileName ? 'selected-file' : ''} 
                                sx={{ paddingLeft: '16px' }}
                            >
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
