// src/components/Sidebar.tsx

import { useState, useContext } from 'react';
import { createSvgIcon, Tab, Tabs } from '@mui/material';
import { Folder as FolderIcon, PanTool as PanToolIcon, Brush as BrushIcon, ColorLens as ColorLensIcon } from '@mui/icons-material';
import FilePane from './FilePane';
import ModelContext from './ModelContext';
import { SketchPicker, ColorResult } from 'react-color';

// 自定义箭头图标
const ArrowIcon = createSvgIcon(
    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#9c806c">
        <path d="m320-410 79-110h170L320-716v306ZM551-80 406-392 240-160v-720l560 440H516l144 309-109 51ZM399-520Z" />
    </svg>,
    'arrow_selector_tool',
);

// 自定义喷漆罐图标
const SprayIcon = createSvgIcon(
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" height="24px" width="24px" fill="#9c806c">
        <path d="M224 32c0-17.7-14.3-32-32-32h-64c-17.7 0-32 14.3-32 32v96h128V32zm256 96c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32zm-256 32H96c-53 0-96 43-96 96v224c0 17.7 14.3 32 32 32h256c17.7 0 32-14.3 32-32V256c0-53-43-96-96-96zm-64 256c-44.2 0-80-35.8-80-80s35.8-80 80-80 80 35.8 80 80-35.8 80-80 80zM480 96c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm-96 32c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32zm-96-96c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32zm96 0c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32zm96 192c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32z" />
    </svg>,
    'spray-can',
);

// 自定义路径标注图标
const PathIcon = createSvgIcon(
    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#9c806c">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 1.41.45 2.72 1.22 3.82L3 17l4.18-3.22C8.28 14.55 9.59 15 11 15c3.87 0 7-3.13 7-7s-3.13-6-6-6zm0 10c-1.66 0-3-1.34-3-3S10.34 6 12 6s3 1.34 3 3-1.34 3-3 3z" />
    </svg>,
    'PathAnnotation',
);

export default function Sidebar() {
    const [value, setValue] = useState(0);
    const [color, setColor] = useState("#ffffff");
    const [showColorSelector, setColorSelector] = useState(false);
    const { setTool, setSpray } = useContext(ModelContext);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
        switch (newValue) {
            case 0:
                // Folder tab点击事件已经在onClick处理
                setTool('none');
                break;
            case 1:
                setTool('none'); // 示例，您可以根据需求修改
                break;
            case 2:
                setTool('pan');
                break;
            case 3:
                setTool('brush');
                break;
            case 4:
                setTool('spray');
                setColorSelector(true);
                break;
            case 5:
                setTool('path');
                break;
            default:
                setTool('none');
        }
    };

    const [open, setOpen] = useState(false);

    const handleColorChange = (color: ColorResult) => {
        setColor(color.hex);
        setSpray(color.hex);
        setColorSelector(false);
    };

    return (
        <div id="side">
            <FilePane isShow={open} />
            <Tabs
                orientation="vertical"
                value={value}
                onChange={handleChange}
                id="toolbar"
            >
                <Tab
                    icon={<FolderIcon sx={{ color: '#9c806c' }} />}
                    aria-label="Folder"
                    onClick={() => { setOpen(!open); }}
                />
                <Tab icon={<ArrowIcon />} aria-label="Arrow" />
                <Tab icon={<PanToolIcon sx={{ color: '#9c806c' }} />} aria-label="Pan Tool" />
                <Tab icon={<BrushIcon sx={{ color: '#9c806c' }} />} aria-label="Brush" />
                <Tab icon={<SprayIcon />} aria-label="Spray" />
                {/* 新增的路径标注工具按钮 */}
                <Tab icon={<PathIcon />} aria-label="Path Annotation" />
            </Tabs>
            {showColorSelector && (
                <div id="color-picker" style={{ position: 'absolute', top: '50px', left: '0' }}>
                    <ColorLensIcon />
                    <SketchPicker color={color} onChangeComplete={handleColorChange} />
                </div>
            )}
        </div>
    );
}
