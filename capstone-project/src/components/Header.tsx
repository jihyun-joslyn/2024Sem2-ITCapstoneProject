import { useState } from 'react';
import { AppBar, Toolbar, Button, Menu, MenuItem, Box, Grid2 as Grid, Container } from '@mui/material';
import { HelpOutline as HelpOutlineIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';


export type Header = {
    showDetailPane: (isShow: boolean) => void,
    onModelLoad: (data: ArrayBuffer) => void;
};


export default function Header({ onModelLoad, showDetailPane }: Header) {
    const [fileAnchorEl, setFileAnchorEl] = useState<null | HTMLElement>(null);
    const fileMenuOpen = Boolean(fileAnchorEl);
    const handleFileClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setFileAnchorEl(event.currentTarget);
    };
    const handleFileClose = () => {
        setFileAnchorEl(null);
    };

    const [settingAnchorEl, setSettingAnchorEl] = useState<null | HTMLElement>(null);
    const settingMenuOpen = Boolean(settingAnchorEl);
    const handleSettingClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setSettingAnchorEl(event.currentTarget);
    };
    const handleSettingClose = () => {
        setSettingAnchorEl(null);
    };

    const [isShowDetailPane, setIsShowDetailPane] = useState(false);

    const handleImport = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = ".stl";
        input.onchange = async (e) => {
            const target = e.target as HTMLInputElement;
            const file = target.files ? target.files[0] : null;
            if (file) {
                const reader = new FileReader();  
                reader.readAsArrayBuffer(file);
                reader.onload = () => {
                    if (reader.result instanceof ArrayBuffer) {
                        onModelLoad(reader.result);
                    }
                };
                reader.onerror = () => console.error('File read error');
            }
        };
        input.click();
    };

    return (
        <div>
            <AppBar position="static" id="header" >
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
                                MenuListProps={{
                                    'aria-labelledby': 'basic-button',
                                }}
                            >
                                <MenuItem onClick={handleImport}>Import</MenuItem>
                                <MenuItem onClick={handleFileClose}>Save</MenuItem>
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
                                MenuListProps={{
                                    'aria-labelledby': 'basic-button',
                                }}
                            >
                                <MenuItem onClick={handleSettingClose}>Preferences</MenuItem>
                            </Menu>
                        </span>
                    </Container>
                    <div >
                        <Button id="documentation-icon"><HelpOutlineIcon /></Button>
                        <Button id="detail-icon" onClick={() => { setIsShowDetailPane(!isShowDetailPane); showDetailPane(isShowDetailPane); }}><MoreVertIcon /></Button>
                    </div>
                </Toolbar>
            </AppBar>
        </div>
    );
}