import { useState } from 'react';
import { AppBar, Toolbar, Button, Menu, MenuItem, Box, Grid2 as Grid} from '@mui/material';
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
        <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" id="header" sx={{paddingLeft: '0px'}}>
            <Toolbar variant="dense" sx={{paddingLeft: '0px'}}>
            <Grid container rowSpacing={1}>
            <div><Button
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
                        <MenuItem onClick={handleClose}>Profile</MenuItem>
                        <MenuItem onClick={handleClose}>My account</MenuItem>
                        <MenuItem onClick={handleClose}>Logout</MenuItem>
                    </Menu>

                </div>
                <div><Button
                    id="setting-dropdown"
                    aria-controls={open ? 'setting-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    onClick={handleClick}>
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
                        <MenuItem onClick={handleClose}>Profile</MenuItem>
                        <MenuItem onClick={handleClose}>My account</MenuItem>
                        <MenuItem onClick={handleClose}>Logout</MenuItem>
                    </Menu></div>
                <Button><HelpOutlineIcon /></Button></Grid>
            </Toolbar>
        </AppBar></Box>
    );
}