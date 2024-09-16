import { IconButton, Menu, MenuItem, } from '@mui/material';
import { MoreHoriz as MoreHorizIcon } from '@mui/icons-material';
import { useState } from 'react';


export type UpsertMenu = {
    // onClickAdd : () => void;
    onClickEdit: () => void;
    onClickDelete: () => void;
};

export default function UpsertMenu({ onClickEdit, onClickDelete }: UpsertMenu) {

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <div>
            <IconButton
                aria-label="more"
                aria-controls={open ? 'upsert-menu' : undefined}
                aria-expanded={open ? 'true' : undefined}
                aria-haspopup="true"
                onClick={handleClick}
            >
                <MoreHorizIcon />
            </IconButton>
            <Menu
                id="upsert-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
            >
                <MenuItem onClick={handleClose}>Add</MenuItem>
                <MenuItem onClick={() => { onClickEdit(); handleClose(); }} >Edit</MenuItem>
                <MenuItem onClick={() => { onClickDelete(); handleClose(); }}>Delete</MenuItem>
            </Menu>

        </div>
    );
}