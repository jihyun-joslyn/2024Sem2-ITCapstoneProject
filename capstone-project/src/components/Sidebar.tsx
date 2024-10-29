import { Brush as BrushIcon, Folder as FolderIcon, LocationSearching as KeypointIcon, PanTool as PanToolIcon,Timeline as TimelineIcon } from '@mui/icons-material';
import { Tab, Tabs, Tooltip, createSvgIcon } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import FilePane from './FilePane';
import ModelContext from './ModelContext';
import { SketchPicker, ColorResult } from 'react-color';
import { FileList } from '../datatypes/FileList';
import _ from 'lodash';
import { AnnotationType } from '../datatypes/ClassDetail';

export type SidebarProps = {
  showFilePane: (isShow: boolean) => void;
  onFileSelect: (fileName: string) => void;
  showColorSpraySelector: (isShow: boolean) => void;
  fileList: FileList[],
  currentFile: string;
  checkIfNowCanAnnotate: () => boolean;
  showErrorAlert: (_title: string, _content: string) => any;
  getCurrentAnnotationTool: () => AnnotationType

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

export default function Sidebar({ showFilePane, onFileSelect, showColorSpraySelector, fileList, currentFile, checkIfNowCanAnnotate, showErrorAlert, getCurrentAnnotationTool }: SidebarProps) {
  const [isShowFilePane, setIsShowFilePane] = useState(false);
  const [value, setValue] = useState(0);
  const [color, setColor] = useState("#ffffff");
  const [showColorSelector, setColorSelector] = useState(false);
  const { setTool, setSpray, activateBrush, activateSpray, currentTool } = useContext(ModelContext);

  useEffect(() => {
    // Update the selected tab based on the current tool
    switch (currentTool) {
        case 'pan':
            setValue(2);
            break;
        case 'brush':
            setValue(3);
            break;
        case 'spray':
            setValue(4);
            break;
        case 'keypoint':
            setValue(5);
            break;
        case 'path':
            setValue(6);
            break;

        default:
            setValue(0);
    }
}, [currentTool]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    if (newValue == 4 || newValue == 5 || newValue == 6) {
      if (!checkIfNowCanAnnotate()) {
        showErrorAlert("Error", "Please select a class before annotating");
        newValue = 0;
      } else {
        var currentTool : AnnotationType = getCurrentAnnotationTool();

        switch(currentTool) {

          case AnnotationType.KEYPOINT: 
            if (newValue != 5) {
              showErrorAlert("Error", "A class can only use one annotation tool.");
            }
            newValue = 5;
            break;

          case AnnotationType.PATH:
            if (newValue != 6) {
              showErrorAlert("Error", "A class can only use one annotation tool.");
            }
            newValue = 6;
            break;

          case AnnotationType.SPRAY:
            if (newValue != 4) {
              showErrorAlert("Error", "A class can only use one annotation tool.");
            }
            newValue = 4;

            sprayOnClick();
            break;

          default: 
           
          break;
        }
      }
    }

    setValue(newValue);

    switch (newValue) {
      case 2:
          setTool('pan');
          break;
      case 3:
          activateBrush();
          break;
      case 4:
          activateSpray();
          setColorSelector(true);
          break;
      case 5:
          setTool('keypoint');
          sprayOnClick();
          break;
      case 6:
          setTool('path');
          sprayOnClick;
          break;
      default:
          setTool('none');
  }
};

  const handleColorChange = (color: ColorResult) => {
    setColor(color.hex);
    setSpray(color.hex);
    setColorSelector(false);
    showColorSpraySelector(!showColorSelector);
  }

  const folderOnClick = () => {
    showFilePane(!isShowFilePane);
    setIsShowFilePane(!isShowFilePane);
    setColorSelector(false);
  };

  const sprayOnClick = () => { //to select a color and put on a variable for annotation coloring use (spray, keypoint and path)
    showColorSpraySelector(!showColorSelector);
    setColorSelector(!showColorSelector);
    setIsShowFilePane(false);
  };

  return (
    <div id="side">
      <Tabs
        orientation="vertical"
        value={value}
        onChange={handleChange}
        id="toolbar"
      >
        <Tab icon={<FolderIcon sx={{ color: '#9c806c' }} />} aria-label="Folder" onClick={folderOnClick} />
        <Tab icon={<ArrowIcon />} />
        <Tab icon={<PanToolIcon sx={{ color: '#9c806c' }} />} />
        <Tab icon={<BrushIcon sx={{ color: '#9c806c' }} />} />
        <Tab icon={<SprayIcon />} onClick={sprayOnClick} />
        <Tab icon={<KeypointIcon sx={{ color: '#9c806c' }} />} /*onClick={sprayOnClick} *//>
        <Tab icon={<TimelineIcon sx={{ color: '#9c806c' }} />} onClick={sprayOnClick } />
      </Tabs>
      {showColorSelector && (
        <Tooltip title="Choose color" placement="right">
          <>
            <SketchPicker color={color} onChangeComplete={handleColorChange} />
          </>
        </Tooltip>
      )}
      <FilePane isShow={isShowFilePane} onFileSelect={onFileSelect} fileList={fileList} currentFile={currentFile} />
    </div>
  );
}
