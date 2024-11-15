import { Alert, AlertTitle, Box, Grid2 as Grid, Snackbar } from '@mui/material';
import * as _ from "lodash";
import { useCallback, useContext, useState } from 'react';
import { createRoot } from "react-dom/client";
import DetailPane from '../components/DetailPane';
import Header from '../components/Header';
import HotkeyDialog from '../components/Hotkey';
import ModelContext, { Hotkeys, ModelProvider } from '../components/ModelContext';
import ModelDisplay from "../components/ModelDisplay";
import Sidebar from '../components/Sidebar';
import useModelStore from '../components/StateStore';
import { AnnotationType } from "../datatypes/ClassDetail";
import { FileAnnotation } from '../datatypes/FileAnnotation';
import { FileList } from '../datatypes/FileList';
import { ModelIDFileNameMap } from "../datatypes/ModelIDFileNameMap";
import { ProblemType } from '../datatypes/ProblemType';


const container = document.getElementById('root');
const root = createRoot(container);

/**
 * Whether the detail pane is showing
 */
var isShowDetail: boolean = false;
/**
 * Whether the color selector is showing
 */
var isShowSelector: boolean = false;
/**
 * Whether the file pane is showing
 */
var isShowFile: boolean = false;

const AppContent = () => {
  const [isShowDetailPane, setIsShowDetailPane] = useState(false);
  const [isShowFilePane, setIsShowFilePane] = useState(false);
  const [isShowColorSelector, setIsShowColorSelector] = useState(false);
  const [modelData, setModelData] = useState<ArrayBuffer | null>(null);
  const [modelGridWidth, setModelGridWidth] = useState(11);
  const [detailPaneWidth, setDetailPaneWidth] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(1);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [currProblems, setCurrentProblems] = useState<ProblemType[]>([]);
  const [stlFiles, setSTLFiles] = useState<FileAnnotation[]>([]);
  const [fileList, setFileList] = useState<FileList[]>([]);
  const { setHotkeys } = useContext(ModelContext);
  const [isHotkeyDialogOpen, setIsHotkeyDialogOpen] = useState(false);
  const [isShowErrorDialog, setIsShowErrorAlert] = useState(false);
  const [alertContent, setAlertContent] = useState<{ title: string, content: string }>({ title: "", content: "" });
  const [modelIDFileNameMapping, setModelIDFileNameMapping] = useState<ModelIDFileNameMap[]>([]);
  const [, updateState] = useState({});

  /**
   * Force refresh the component
   */
  const forceUpdate = useCallback(() => updateState({}), []);

  /**
  * Local storage ID for all the data of the STL files
  */
  const FileListStoargeKey: string = "stlFileData";

  /**
   * Show the 3D image of the STL file on the UI
   * @param file the STL file to display
   */
  const loadSTLFile = (file: File) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        setModelData(reader.result);
        const modelId = reader.result.byteLength.toString();
        //set the modelId of the file using the length of the ArrayBuffer
        useModelStore.getState().setModelId(modelId);
        //initializing the storage for saving user changes for undo and redo
        useModelStore.getState().sessionStates[modelId] = { actions: [], currentActionIndex: -1 };
      }
    };
  };

  /**
    * Update the centralized file list
    * @param _stlFiles the file array 
    */
  const updateFileList = (_stlFiles: FileAnnotation[]) => {
    setSTLFiles(_stlFiles);

    //initialize file list for file pane
    var _file: FileList[] = [];

    //push the files into the file list
    _stlFiles.forEach(f => {
      var temp: FileList = { fileName: f.fileName, isAnnotated: f.annotated };
      _file.push(temp);
    });

    setFileList(_file);

    //if there are no files passed into the application
    if (_.isEmpty(_file)) {
      //close the STL loader
      setModelData(null);
      //refresh the component
      forceUpdate();
    }
  }

  /**
    * Update the new problem array into the centralized file array
    * @param updateProblems the updated problem array
    */
  const updateDataLabels = (updatedProblems: ProblemType[]): void => {
    setCurrentProblems(updatedProblems);

    var _stlFiles: FileAnnotation[] = stlFiles;

    //update the file array with the new problem array
    _stlFiles = updateListWithCurrentProblems(updatedProblems, _stlFiles);

    setSTLFiles(_stlFiles);
    //update the problem array into local storage
    updateLocalStoargeFileList(updatedProblems);
    //refresh the component
    forceUpdate();
  }

  /**
   * Update local storage with the update problem array
   * @param updatedProblems the new problem array
   */
  const updateLocalStoargeFileList = (updatedProblems: ProblemType[]) => {
    //get all file data from local storage
    var _fileList: FileAnnotation[] = JSON.parse(localStorage.getItem(FileListStoargeKey));

    //update the file list with new problem array
    _fileList = updateListWithCurrentProblems(updatedProblems, _fileList);

    //update the file list in local storage with the new file list
    localStorage.setItem(FileListStoargeKey, JSON.stringify(_fileList));
  }

  /**
   * Update the file array with the new problem array
   * @param updateProblems the new problem array
   * @param _files the file array to be updated
   * @returns the updated file array
   */
  const updateListWithCurrentProblems = (updateProblems: ProblemType[], _files: FileAnnotation[]): FileAnnotation[] => {
    //get the index of current file
    var cur: number = _.findIndex(_files, function (f) {
      return _.eq(f.fileName, currentFile);
    })

    //update the new problem array into the current file element
    _files[cur].problems = updateProblems;

    return _files;
  }

  /**
    * Trigger when users click on a file name. The function help set the clicked file as the current file
    * @param fileName the name of the file
    */
  const handleFileSelect = (fileName: string) => {
    //find the index of the file in the file array according to the given file name
    var currIndex = _.findIndex(stlFiles, function (f) {
      return _.eq(f.fileName, fileName);
    })

    //set the given file as the current file
    initializeCurrentFile(stlFiles[currIndex]);
  };

  /**
    * Set whether the UI shows the file pane
    * @param isShow to show the file pane or not
    */
  const showDetailPane = (isShow: boolean): void => {
    setIsShowDetailPane(isShow);
    isShowDetail = isShow;
    //set the width of the components shown in UI
    setComponentsGridWidth();
  };

  /**
   * Set whether showing the file pane on UI
   * @param isShow whether showing the file pane
   */
  const showFilePane = (isShow: boolean): void => {
    setIsShowFilePane(isShow);
    isShowFile = isShow;

    //if the color selector is showing
    if (isShowColorSelector) {
      setIsShowColorSelector(false);
      isShowSelector = false;
    }

    //set the width of the components shown in UI
    setComponentsGridWidth();
  };

  /**
   * Set whether showing the color selector on UI
   * @param isShow whether showing the color selector
   */
  const showColorSelector = (isShow: boolean): void => {
    setIsShowColorSelector(isShow);
    isShowSelector = isShow;

    //if the file pane is showing
    if (isShowFilePane) {
      setIsShowFilePane(false);
      isShowFile = false;
    }

    //set the width of the components shown in UI
    setComponentsGridWidth();
  };

  /**
   * Set the grid width of the components show in UI according to the grid system
   */
  const setComponentsGridWidth = (): void => {
    switch (isShowDetail) {
      //if detail pane is shown
      case true:
        setDetailPaneWidth(3);

        //if file pane is shown
        if (isShowFile) {
          //if color selector is shown
          if (isShowSelector) {
            setSidebarWidth(3);
            setModelGridWidth(6);
          }
          //if color selector is not shown
          else {
            setSidebarWidth(2);
            setModelGridWidth(7);
          }
        }
        //if file pane is not shown
        else {
          //if color selector is shown
          if (isShowSelector) {
            setSidebarWidth(2);
            setModelGridWidth(7);
          }
          //if color selector is not shown
          else {
            setSidebarWidth(1);
            setModelGridWidth(8);
          }
        }
        break;
      //if detail pane is not shown
      case false:
        setDetailPaneWidth(0);

        //if file pane is shown
        if (isShowFile) {
          //if color selector is shown
          if (isShowSelector) {
            setSidebarWidth(3);
            setModelGridWidth(9);
          }
          //if color selector is not shown 
          else {
            setSidebarWidth(2);
            setModelGridWidth(10);
          }
        }
        //if file pane is not shown 
        else {
          //if color selector shown
          if (isShowSelector) {
            setSidebarWidth(2);
            setModelGridWidth(10);
          }
          //if color selector is not shown 
          else {
            setSidebarWidth(1);
            setModelGridWidth(11);
          }
        }
        break;
      default:
        break;
    }
  };

  /**
    * Set the file as the current file and display the 3D image on UI
    * @param _file the file to be shown
    */
  const initializeCurrentFile = (_file: FileAnnotation) => {
    setCurrentProblems(_file.problems);
    setCurrentFile(_file.fileName);
    loadSTLFile(_file.fileObject);
  }

  /**
    * Show hotkey dialog on UI
    */
  const openHotkeyDialog = () => {
    setIsHotkeyDialogOpen(true);
  };

  /**
   * Update the new hotkey combinations
   * @param newHotkeys the new hotkey combinations
   */
  const handleHotkeySave = (newHotkeys: Hotkeys) => {
    setHotkeys(newHotkeys);
  };

  /**
   * Close the error alert shown on UI
   */
  const handleCloseErrorAlert = () => {
    setIsShowErrorAlert(false);
  }

  /**
    * Show an error alert on UI
    * @param _title the title of the alert
    * @param _content the content of the alert
    */
  const showErrorAlert = (_title: string, _content: string) => {
    var _alertContent: { title: string, content: string } = alertContent;

    _alertContent.title = _title;
    _alertContent.content = _content;

    setAlertContent(_alertContent);
    setIsShowErrorAlert(true);
  }

  /**
    * Check if there are any classes that are currently allowed for annotating
    * @returns whether there are classes having the flag isAnnotating set to true
    */
  const checkIfNowCanAnnotate = (): boolean => {
    //find if there is any class with the flag isAnnotating set to true
    return _.findIndex(currProblems, function (p) {
      return _.findIndex(p.classes, function (c) {
        return c.isAnnotating == true;
      }) != -1;
    }) != -1 ? true : false;
  }

  /**
   * Get the annotation tool from the class being selected
   * @returns the current annotation tool
   */
  const getCurrentAnnotationTool = (): AnnotationType => {
    var currentTool: AnnotationType = AnnotationType.NONE;

    currProblems.forEach(p => {
      p.classes.forEach(c => {
        //if the class is being selected currently
        if (c.isAnnotating) {
          currentTool = c.annotationType;
          return currentTool;
        }
      })
    })

    return currentTool;
  }

  /**
   * Update the modelId and file name mapping array
   * @param mapping the new array
   */
  const updateModelIDFileMapping = (mapping: ModelIDFileNameMap[]) => {
    setModelIDFileNameMapping(mapping);
  }

  /**
    * Get the color of the annotations of selected class
    * @returns the color code of the annotation 
    */
  const getCurrentAnnotationColor = (): string => {
    var currentColor: string = "";

    currProblems.forEach(p => {
      p.classes.forEach(c => {
        //if the class is being selected currently
        if (c.isAnnotating) {
          currentColor = c.color;
          return currentColor;
        }
      })
    })

    return currentColor;
  }

  /**
    * Check whether there are any data in local storage that are under the given key
    * @param storageKey the key to be checked
    * @returns whether there are no data under the key in local storage
    */
  const checkIfLocalStorageIsEmpty = (storageKey: string): boolean => {
    //if there is no data under the key
    if (_.isUndefined(localStorage.getItem(storageKey)) || _.isNull(localStorage.getItem(storageKey)))
      return true;
    else
      return false;
  }

  return (
    <>
      <Box sx={{ flexGrow: 0 }}>
        <Header
          showDetailPane={showDetailPane}
          isShowDetailPane={isShowDetailPane}
          currentFile={currentFile}
          updateFileList={updateFileList}
          stlFiles={stlFiles}
          initializeCurrentFile={initializeCurrentFile}
          modelIDFileNameMapping={modelIDFileNameMapping}
          openHotkeyDialog={openHotkeyDialog}
          checkIfLocalStorageIsEmpty={checkIfLocalStorageIsEmpty}
          FileListStoargeKey={FileListStoargeKey} />
      </Box>
      <Grid container rowSpacing={1}>
        <Grid size={sidebarWidth}>
          <Sidebar
            showFilePane={showFilePane}
            showColorSelector={showColorSelector}
            onFileSelect={handleFileSelect}
            fileList={fileList}
            currentFile={currentFile}
            checkIfNowCanAnnotate={checkIfNowCanAnnotate}
            showErrorAlert={showErrorAlert}
            getCurrentAnnotationTool={getCurrentAnnotationTool}
            getCurrentAnnotationColor={getCurrentAnnotationColor} />
        </Grid>
        <Grid size={modelGridWidth} sx={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
          {modelData &&
            <ModelDisplay
              modelData={modelData}
              currProblem={currProblems}
              updateProblems={updateDataLabels}
              currentFile={currentFile}
              updateModelIDFileMapping={updateModelIDFileMapping}
              checkIfNowCanAnnotate={checkIfNowCanAnnotate}
              isShowColorSpraySelector={isShowColorSelector}
              checkIfLocalStorageIsEmpty={checkIfLocalStorageIsEmpty} />}
        </Grid>
        <Grid size={detailPaneWidth} offset={'auto'}>
          <DetailPane
            isShow={isShowDetailPane}
            currentFile={currentFile}
            currProblems={currProblems}
            updateProblems={updateDataLabels}
            showErrorAlert={showErrorAlert}
            checkIfNowCanAnnotate={checkIfNowCanAnnotate}
            modelIDFileNameMapping={modelIDFileNameMapping}
          />
        </Grid>
      </Grid>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={isShowErrorDialog}
        autoHideDuration={6000}
        onClose={handleCloseErrorAlert}>
        <Alert
          onClose={handleCloseErrorAlert}
          severity="error"
          sx={{ width: '100%' }}
        >
          <AlertTitle>{alertContent.title}</AlertTitle>
          {alertContent.content}
        </Alert>
      </Snackbar>
      <HotkeyDialog
        open={isHotkeyDialogOpen}
        onClose={() => setIsHotkeyDialogOpen(false)}
        onSave={handleHotkeySave}
        checkIfLocalStorageIsEmpty={checkIfLocalStorageIsEmpty}
      />
    </>
  );
};

const App = () => {
  return (
    <ModelProvider>
      <AppContent />
    </ModelProvider>
  );
};

root.render(<App />);
