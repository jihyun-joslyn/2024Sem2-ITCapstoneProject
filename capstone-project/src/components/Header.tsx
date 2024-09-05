import { useState } from 'react';
import { AppBar, Toolbar, Button, Menu, MenuItem, Box, Grid2 as Grid, Container } from '@mui/material';
import { HelpOutline as HelpOutlineIcon } from '@mui/icons-material';


export type Header = {

};

export default function Header({ }: Header) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };


    return (
        <AppBar position="static" id="header" >
            <Toolbar variant="dense" sx={{ flexGrow: 1 }}>
                <Container sx={{ flexGrow: 1, display: 'block'  }}>
                <span>
                    <Button
                        id="file-dropdown"
                        aria-controls={open ? 'file-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined}
                        onClick={handleClick}
                        
                    >
                        File
                    </Button>
                    <Menu
                        id="file-menu"
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        MenuListProps={{
                            'aria-labelledby': 'basic-button',
                        }}
                    >
                        <MenuItem onClick={handleClose}>Import</MenuItem>
                        <MenuItem onClick={handleClose}>Save</MenuItem>
                    </Menu>

                </span>
                <span>
                    <Button
                        id="setting-dropdown"
                        aria-controls={open ? 'setting-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined}
                        onClick={handleClick}
                        >
                        Settings
                    </Button>
                    <Menu
                        id="setting-menu"
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        MenuListProps={{
                            'aria-labelledby': 'basic-button',
                        }}
                    >
                        <MenuItem onClick={handleClose}>Preferences</MenuItem>
                    </Menu>
                </span>
                </Container>
                <div >
                    <Button id="documentation-icon"><HelpOutlineIcon /></Button>
                </div>
            </Toolbar>
        </AppBar>
    );
}