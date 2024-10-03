import { Toolbar, Typography, List, ListItem, ListItemText } from '@mui/material';
import '../style/index.css';

export type FilePaneProps = {
    isShow: boolean;
    onFileSelect: (fileName: string) => void;
    selectedFile: string;
    fileList: string[]
};

export default function FilePane({ isShow, fileList, onFileSelect, selectedFile }: FilePaneProps) {
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
                                onClick={() => onFileSelect(file)}
                                className={selectedFile === file ? 'selected-file' : ''} 
                                sx={{ paddingLeft: '16px' }}
                            >
                                <ListItemText 
                                    primary={file}
                                    sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }} 
                                />
                            </ListItem>
                        ))}
                    </List>
                </div>
            )}
        </div>
    );
}
