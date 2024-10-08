import { useState, useContext } from 'react';
import { createSvgIcon, Tab, Tabs, Tooltip } from '@mui/material';
import { Folder as FolderIcon, PanTool as PanToolIcon, Brush as BrushIcon, LocationSearching as KeypointIcon } from '@mui/icons-material';
import FilePane from './FilePane';
import ModelContext from './ModelContext';
import { SketchPicker, ColorResult } from 'react-color';

export type SidebarProps = {
  showFilePane: (isShow: boolean) => void;
  stlFiles: { fileName: string; fileObject: File; problem: string; class: string }[];
  onFileSelect: (fileName: string) => void;
  showColorSpraySelector: (isShow: boolean) => void;
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

export default function Sidebar({ showFilePane, stlFiles, onFileSelect, showColorSpraySelector }: SidebarProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null); 
  const [isShowFilePane, setIsShowFilePane] = useState(false);
  const [value, setValue] = useState(0);
  const [color, setColor] = useState("#ffffff");
  const [showColorSelector, setColorSelector] = useState(false);
  const { setTool, setSpray } = useContext(ModelContext);

  const handleFileSelect = (fileName: string) => {
    setSelectedFile(fileName);
    onFileSelect(fileName);
  };

  const folderOnClick = () => {
    showFilePane(!isShowFilePane);
    setIsShowFilePane(!isShowFilePane);
    setColorSelector(false);
  };

  const sprayOnClick = () => {
    showColorSpraySelector(!showColorSelector);
    setColorSelector(!showColorSelector);
    setIsShowFilePane(false);
  };

  return (
    <div id="side">
      <Tabs
  orientation="vertical"
  value={value}
  onChange={(event: React.SyntheticEvent, newValue: number) => setValue(newValue)} // newValue 指定为 number 类型
  id="toolbar"
>
        <Tab icon={<FolderIcon sx={{ color: '#9c806c' }} />} aria-label="Folder" onClick={folderOnClick} />
        <Tab icon={<ArrowIcon />} />
        <Tab icon={<PanToolIcon sx={{ color: '#9c806c' }} />} />
        <Tab icon={<BrushIcon sx={{ color: '#9c806c' }} />} />
        <Tab icon={<SprayIcon />} onClick={sprayOnClick} />
        <Tab icon={<KeypointIcon sx={{ color: '#9c806c' }}/>} />
      </Tabs>
      {showColorSelector && (
        <Tooltip title="Choose color" placement="right">
          <SketchPicker color={color} onChangeComplete={(color: ColorResult) => {
            setColor(color.hex);
            setSpray(color.hex);
            setColorSelector(false);
          }} />
        </Tooltip>
      )}
      <FilePane 
        isShow={isShowFilePane} 
        stlFiles={stlFiles} 
        onFileSelect={handleFileSelect} 
        selectedFile={selectedFile || ''} 
      />
    </div>
  );
}
