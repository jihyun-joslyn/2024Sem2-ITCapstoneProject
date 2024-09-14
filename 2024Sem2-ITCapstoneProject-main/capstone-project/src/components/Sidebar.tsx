import { useState, useContext} from 'react';
import { createSvgIcon, Tab, Tabs, IconButton, Tooltip } from '@mui/material';
import { Folder as FolderIcon, PanTool as PanToolIcon, Brush as BrushIcon ,ColorLens as ColorLensIcon} from '@mui/icons-material';
import FilePane from './FilePane';
import ModelContext from './ModelContext';
import { SketchPicker, ColorResult } from 'react-color';

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
    const [color, setColor] = useState("#ffffff");
    const [showColorSelector, setColorSelector] = useState(false);
    const {setTool, setSpray} = useContext(ModelContext);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
        switch (newValue){
            case 2:
                setTool('pan');
                break;
            case 4:
                setTool('spray');
                setColorSelector(true);
                break;
            default:
                setTool('none');
        }
    };

    const [open, setOpen] = useState(false);

    const handleColorChange = (color : ColorResult) =>{
        setColor(color.hex);
        setSpray(color.hex);
        setColorSelector(false);   
    }

    return (
        <div id="side">
            <FilePane isShow={open}/>
            <Tabs
                orientation="vertical"
                value={value}
                onChange={handleChange}
                id="toolbar"
            >
                <Tab icon={<FolderIcon sx={{ color: '#9c806c' }} />} aria-label="Folder" onClick={() => { setOpen(!open); }} />
                <Tab icon={<ArrowIcon />} />
                <Tab icon={<PanToolIcon sx={{ color: '#9c806c' }} />} />
                <Tab icon={<BrushIcon sx={{ color: '#9c806c' }} />} />
                <Tab icon={<SprayIcon />} onClick={() => setColorSelector(!showColorSelector)} />
            </Tabs>
            {showColorSelector && (
                <Tooltip title="Choose color" placement="right">
                    <>
                    <IconButton onClick={() => setColorSelector(false)}>
                        <ColorLensIcon />
                    </IconButton>
                    <SketchPicker color={color} onChangeComplete={handleColorChange} />
                    </>
                </Tooltip>
            )}
        </div>
    );
}