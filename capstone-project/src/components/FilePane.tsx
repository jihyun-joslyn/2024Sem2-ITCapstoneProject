import { Toolbar, Typography, List, ListItem, ListItemText } from '@mui/material';
import '../style/index.css';

export type FilePaneProps = {
    isShow: boolean;
    stlFiles: { fileName: string; fileObject: File; problem: string; class: string }[];
    onFileSelect: (fileName: string) => void;
    selectedFile: string;
};

export default function FilePane({ isShow, stlFiles, onFileSelect, selectedFile }: FilePaneProps) {
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
                        {stlFiles.map((file, index) => (
                            <ListItem 
                                component="button" 
                                key={index}
                                onClick={() => onFileSelect(file.fileName)}
                                className={selectedFile === file.fileName ? 'selected-file' : ''} 
                                sx={{ paddingLeft: '16px' }}
                            >
                                <ListItemText 
                                    primary={file.fileName}
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
