import { useState } from 'react';
import { AppBar, Toolbar, Button, Menu, MenuItem, Box, Grid2 as Grid, Container } from '@mui/material';
import { HelpOutline as HelpOutlineIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';


export type Header = {

};

export default function Header({ }: Header) {
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
                                <MenuItem onClick={handleFileClose}>Import</MenuItem>
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
                        <Button id="detail-icon"><MoreVertIcon /></Button>
                    </div>
                </Toolbar>
            </AppBar>
        </div>
    );
}