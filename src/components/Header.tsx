import { useState } from 'react';
import { AppBar, Toolbar, Button, Menu, MenuItem, Container } from '@mui/material';
import { HelpOutline as HelpOutlineIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import DetailPane from './DetailPane';

export type HeaderProps = {
    showDetailPane: (isShow: boolean) => void;
    isShowDetailPane: boolean;
    onModelLoad: (data: ArrayBuffer) => void;
    stlFiles: { fileName: string; fileObject: File; problem: string; class: string }[];  
    setStlFiles: React.Dispatch<React.SetStateAction<{ fileName: string; fileObject: File; problem: string; class: string }[]>>;  
    selectedFile: string | null;  
    setSelectedFile: React.Dispatch<React.SetStateAction<string | null>>; 
};

export default function Header({
    showDetailPane,
    isShowDetailPane,
    onModelLoad,
    stlFiles,   
    setStlFiles,   
    selectedFile,   
    setSelectedFile   
}: HeaderProps) {
    const [fileAnchorEl, setFileAnchorEl] = useState<null | HTMLElement>(null);
    const [settingAnchorEl, setSettingAnchorEl] = useState<null | HTMLElement>(null);

    const fileMenuOpen = Boolean(fileAnchorEl);
    const settingMenuOpen = Boolean(settingAnchorEl);

    const handleFileClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setFileAnchorEl(event.currentTarget);
    };

    const handleFileClose = () => {
        setFileAnchorEl(null);
    };

    const handleSettingClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setSettingAnchorEl(event.currentTarget);
    };

    const handleSettingClose = () => {
        setSettingAnchorEl(null);
    };

    const handleImport = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = ".stl";
        input.multiple = true;  // 允许选择多个文件
        input.onchange = async (e) => {
            const target = e.target as HTMLInputElement;
            const files = target.files ? Array.from(target.files) : [];
    
            const newFileData = files.map(file => ({
                fileName: file.name,
                fileObject: file,
                problem: '',
                class: ''
            }));
    
            setStlFiles(prevFiles => [...prevFiles, ...newFileData]);
    
            if (files.length > 0) {
                setSelectedFile(files[0].name);
                loadSTLFile(files[0]);  
            }
    
            handleFileClose();
        };
        input.click();
    };
    

    const handleFileSelect = (fileName: string) => {
        const selectedFileData = stlFiles.find(file => file.fileName === fileName);
        if (selectedFileData) {
            setSelectedFile(fileName);   
            loadSTLFile(selectedFileData.fileObject);
        }
    };

    const loadSTLFile = (file: File) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
                onModelLoad(reader.result); 
            }
        };
    };

    const handleSave = () => {
        const jsonData = JSON.stringify(stlFiles, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'annotated_items.json';
        link.click();
        handleFileClose(); 
    };

    return (
        <div>
            <AppBar position="static" id="header">
                <Toolbar variant="dense" sx={{ flexGrow: 1 }}>
                    <Container sx={{ flexGrow: 1, display: 'block' }}>
                        <span>
                            <Button
                                id="file-dropdown"
                                aria-controls={fileMenuOpen ? 'file-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={fileMenuOpen ? 'true' : undefined}
                                onClick={handleFileClick}
                            >
                                File
                            </Button>
                            <Menu
                                id="file-menu"
                                anchorEl={fileAnchorEl}
                                open={fileMenuOpen}
                                onClose={handleFileClose}
                            >
                                <MenuItem onClick={handleImport}>Import</MenuItem>
                                <MenuItem onClick={handleSave}>Save</MenuItem>
                            </Menu>
                        </span>
                        <span>
                            <Button
                                id="setting-dropdown"
                                aria-controls={settingMenuOpen ? 'setting-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={settingMenuOpen ? 'true' : undefined}
                                onClick={handleSettingClick}
                            >
                                Settings
                            </Button>
                            <Menu
                                id="setting-menu"
                                anchorEl={settingAnchorEl}
                                open={settingMenuOpen}
                                onClose={handleSettingClose}
                            >
                                <MenuItem onClick={handleSettingClose}>Preferences</MenuItem>
                            </Menu>
                        </span>
                    </Container>
                    <div>
                        <Button id="documentation-icon">
                            <HelpOutlineIcon />
                        </Button>
                        <Button id="detail-icon" onClick={() => {
                            showDetailPane(!isShowDetailPane);  
                        }}>
                            <MoreVertIcon />
                        </Button>
                    </div>
                </Toolbar>
            </AppBar>

            
        </div>
    );
}
