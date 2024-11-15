import { Folder as FolderIcon, LocationSearching as KeypointIcon, PanTool as PanToolIcon, Timeline as TimelineIcon } from '@mui/icons-material';
import { Tab, Tabs, Tooltip, createSvgIcon } from '@mui/material';
import _ from 'lodash';
import { useCallback, useContext, useEffect, useState } from 'react';
import { ColorResult, SketchPicker } from 'react-color';
import { AnnotationType } from '../datatypes/ClassDetail';
import { FileList } from '../datatypes/FileList';
import FilePane from './FilePane';
import ModelContext from './ModelContext';

export type SidebarProps = {
  /**
   * Set whether showing the file pane on UI
   * @param isShow whether showing the file pane
   */
  showFilePane: (isShow: boolean) => void;
  /**
    * Trigger when users click on a file name. The function help set the clicked file as the current file
    * @param fileName the name of the file
    */
  onFileSelect: (fileName: string) => void;
  /**
   * Set whether showing the color selector on UI
   * @param isShow whether showing the color selector
   */
  showColorSelector: (isShow: boolean) => void;
  /**
    * The list of the name of the files being imported by users
    */
  fileList: FileList[],
  /**
    * The file name of the current file shown in UI
    */
  currentFile: string;
  /**
    * Check if there are any classes that are currently allowed for annotating
    * @returns whether there are classes having the flag isAnnotating set to true
    */
  checkIfNowCanAnnotate: () => boolean;
  /**
    * Show an error alert on UI
    * @param _title the title of the alert
    * @param _content the content of the alert
    */
  showErrorAlert: (_title: string, _content: string) => void;
  /**
   * Get the annotation tool from the class being selected
   * @returns the current annotation tool
   */
  getCurrentAnnotationTool: () => AnnotationType;
  /**
   * Get the color of the annotations of selected class
   * @returns the color code of the annotation 
   */
  getCurrentAnnotationColor: () => string
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

export default function Sidebar({ showFilePane, onFileSelect, showColorSelector, fileList, currentFile, checkIfNowCanAnnotate, showErrorAlert, getCurrentAnnotationTool, getCurrentAnnotationColor }: SidebarProps) {
  const [isShowFilePane, setIsShowFilePane] = useState(false);
  const [value, setValue] = useState(0);
  const [color, setColor] = useState("#ffffff");
  const [IsShowColorSelector, setIsShowColorSelector] = useState(false);
  const { setTool, setSpray, activateSpray, activateArrow, currentTool, tool } = useContext(ModelContext);
  const [, updateState] = useState({});
  const forceUpdate = useCallback(() => updateState({}), []);

  //triggered when the value of currentTool or tool changes
  useEffect(() => {
    // Update the selected tab based on the current tool
    switch (currentTool) {

      case 'arrow':
        setValue(1);
        break;

      case 'pan':
        setValue(2);
        break;

      case 'spray':
        setValue(3);
        break;
      case 'keypoint':
        setValue(4);
        break;
      case 'path':
        setValue(5);
        break;
      default:
        setValue(0);
        break;
    }
  }, [currentTool, tool]);

  /**
   * Trigger when users click on the icons on the sidebar. Handles the changes of the annotation tools
   * @param event ClickEvent listener
   * @param newValue the index of the clicked icon
   */
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    //if users clicked on either one of the annotation tools
    if (newValue == 3 || newValue == 4 || newValue == 5) {
      //if there is no class being selected currently
      if (!checkIfNowCanAnnotate()) {
        //show alert
        showErrorAlert("Error", "Please select a class before annotating");
        //change the selected icon to file icon
        newValue = 0;
      } else {
        //get the annotation type of the current selected class
        var currentTool: AnnotationType = getCurrentAnnotationTool();

        switch (currentTool) {
          //if the current selected class is using keypoint tool
          case AnnotationType.KEYPOINT:
            //if users choose annotation tools other than keypoint
            if (newValue != 4) {
              showErrorAlert("Error", "A class can only use one annotation tool.");
            }
            //set the selected tool back to keypoint
            newValue = 4;
            break;
          //if the current selected class is using path tool
          case AnnotationType.PATH:
            //if users choose annotation tools other than path
            if (newValue != 5) {
              showErrorAlert("Error", "A class can only use one annotation tool.");
            }
            //set the selected tool back to path 
            newValue = 5;
            break;
          //if the current selected class is using spray tool
          case AnnotationType.SPRAY:
            //if users choose annotation tools other than spray
            if (newValue != 3) {
              showErrorAlert("Error", "A class can only use one annotation tool.");
            }
            //set the selected tool back to spray
            newValue = 3;

            sprayOnClick();
            break;
          default:
            break;
        }
      }
    }

    setValue(newValue);

    switch (newValue) {

      case 1:
        setTool('arrow')
        activateArrow();
        break;
      case 2:
        setTool('pan');
        break;
      case 3:
        //set the tool to 'spray'
        activateSpray();
        //show the color selector
        setIsShowColorSelector(true);
        break;
      case 4:
        setTool('keypoint');
        //show color selector
        sprayOnClick();
        break;
      case 5:
        setTool('path');
        //show color selector
        sprayOnClick();
        break;
      default:
        setTool('none');
    }
  };

  /**
   * Trigger when users choose a color from the color selector.
   * @param _color the color that users selected
   */
  const handleColorChange = (_color: ColorResult) => {
    //if users choose a color that are not the same as the color stored in the current class, where the current class already has annotation linked
    if (!_.eq(getCurrentAnnotationColor(), _color.hex) && !_.isEmpty(getCurrentAnnotationColor())) {
      showErrorAlert("Error", "A class can only have a color.");
      //set the selected color back to the color stored in the current class
      _color.hex = getCurrentAnnotationColor();
    }

    setColor(_color.hex);
    //set the color of the spray to the selected color
    setSpray(_color.hex);
    //close the color selector
    setIsShowColorSelector(false);
    showColorSelector(!IsShowColorSelector);

    forceUpdate();
  }

  /**
   * Triggered when users clicked on the folder icon
   */
  const folderOnClick = () => {
    //show or close the file pane
    showFilePane(!isShowFilePane);
    setIsShowFilePane(!isShowFilePane);

    //close the color selector
    setIsShowColorSelector(false);
  };

  /**
   * Triggered when users click on the annotation tools. It shows the color selector on UI when triggered
   */
  const sprayOnClick = () => { //to select a color and put on a variable for annotation coloring use (spray, keypoint and path)
    showColorSelector(!IsShowColorSelector);
    setIsShowColorSelector(!IsShowColorSelector);
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
        <Tab icon={<SprayIcon />} onClick={sprayOnClick} />
        <Tab icon={<KeypointIcon sx={{ color: '#9c806c' }} />} /*onClick={sprayOnClick} */ />
        <Tab icon={<TimelineIcon sx={{ color: '#9c806c' }} />} onClick={sprayOnClick} />
      </Tabs>
      {IsShowColorSelector && (
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

