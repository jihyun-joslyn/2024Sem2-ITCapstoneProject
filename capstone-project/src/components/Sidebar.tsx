import { useState } from 'react';
import { } from '@mui/material/styles';
import { Box, createSvgIcon, Tab, Tabs } from '@mui/material';
// import FolderIcon from '@mui/icons-material/Folder';
import { Folder as FolderIcon, PanTool as PanToolIcon, Brush as BrushIcon } from '@mui/icons-material'

export type Sidebar = {

};

const ArrowIcon = createSvgIcon(
    <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="#9c806c">
        <path d="m320-410 79-110h170L320-716v306ZM551-80 406-392 240-160v-720l560 440H516l144 309-109 51ZM399-520Z" />
    </svg>,
    'arrow_selector_tool',
);

const SprayIcon = createSvgIcon(
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        height="24px"
        width="24px"
        fill="#9c806c">
        <path d="M224 32c0-17.7-14.3-32-32-32h-64c-17.7 0-32 14.3-32 32v96h128V32zm256 96c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32zm-256 32H96c-53 0-96 43-96 96v224c0 17.7 14.3 32 32 32h256c17.7 0 32-14.3 32-32V256c0-53-43-96-96-96zm-64 256c-44.2 0-80-35.8-80-80s35.8-80 80-80 80 35.8 80 80-35.8 80-80 80zM480 96c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm-96 32c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32zm-96-96c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32zm96 0c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32zm96 192c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32z" />
    </svg>,
    'spray-can',
);
/* <!--!Font Awesome Free 6.6.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--> */

export default function Sidebar({ }: Sidebar) {

    const [value, setValue] = useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        
            <Tabs
                orientation="vertical"
                value={value}
                onChange={handleChange}
                id="toolbar"
            >
                <Tab icon={<FolderIcon sx={{ color: '#9c806c'}}/>} aria-label="Folder" />
                <Tab icon={<ArrowIcon />} />
                <Tab icon={<PanToolIcon sx={{ color: '#9c806c'}}/>} />
                <Tab icon={<BrushIcon sx={{ color: '#9c806c'}}/>} />
                <Tab icon={<SprayIcon />} />
            </Tabs>

    );
}