import { IconButton, Menu, MenuItem, } from '@mui/material';
import { MoreHoriz as MoreHorizIcon } from '@mui/icons-material';
import { useState } from 'react';


export type UpsertMenu = {
    /**
     * When users click the add menu item
     */
    onClickAdd: () => void;
    /**
     * When users click the edit menu item
     */
    onClickEdit: () => void;
    /**
     * When users click the delete menu item
     */
    onClickDelete: () => void;
    /**
     * Whether the item needs an add menu item
     */
    isNeedAdd: boolean;
};

export default function UpsertMenu({ onClickEdit, onClickDelete, isNeedAdd, onClickAdd }: UpsertMenu) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    /**
     * Whether the menu is open or not
     */
    const open = Boolean(anchorEl);

    /**
     * Open the menu
     * @param event 
     */
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    /**
     * Close the menu
     */
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <span>
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
                {isNeedAdd && (
                    <MenuItem onClick={() => { onClickAdd(); handleClose(); }}>Add</MenuItem>
                )}
                <MenuItem onClick={() => { onClickEdit(); handleClose(); }} >Edit</MenuItem>
                <MenuItem onClick={() => { onClickDelete(); handleClose(); }}>Delete</MenuItem>
            </Menu>

        </span>
    );
}