import * as _ from "lodash";
import { useContext, useState, useRef } from 'react';
import { createRoot } from "react-dom/client";
import { Grid2 as Grid, Box, Snackbar, Alert, AlertTitle, Button } from '@mui/material';
import DetailPane from '../components/DetailPane';
import Header from '../components/Header';
import HotkeyDialog from '../components/Hotkey';
import ModelContext, { Hotkeys, ModelProvider } from '../components/ModelContext';
import ModelDisplay from "../components/ModelDisplay";
import Sidebar from '../components/Sidebar';
import useModelStore from '../components/StateStore';
import { FileAnnotation } from '../datatypes/FileAnnotation';
import { FileList } from '../datatypes/FileList';
import { ProblemType } from '../datatypes/ProblemType';
import { Mesh, BufferGeometry, Material, Object3DEventMap } from 'three'; 

const container = document.getElementById('root');
const root = createRoot(container);
const handleConfirm = () => {
  console.log("Confirmed");
};

const handleCancel = () => {
  console.log("Cancelled");
};

//bool use to control component width
var isShowDetail: boolean = false;
var isShowColorSpray: boolean = false;
var isShowFile: boolean = false;

const AppContent = () => {
  const [isShowDetailPane, setIsShowDetailPane] = useState(false);
  const [isShowFilePane, setIsShowFilePane] = useState(false);
  const [isShowColorSpraySelector, setIsShowColorSpraySelector] = useState(false);
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
  const meshRef = useRef<Mesh<BufferGeometry, Material | Material[], Object3DEventMap>>(null);
  const FileListStoargeKey: string = "stlFileData";
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [cancelAction, setCancelAction] = useState<() => void>(() => {});


  const loadSTLFile = (file: File) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        setModelData(reader.result);
        const modelId = reader.result.byteLength.toString();
        useModelStore.getState().setModelId(modelId);
        useModelStore.getState().sessionStates[modelId] = { actions: [], currentActionIndex: -1 };
      }
    };
  };

  const updateFileList = (_stlFiles: FileAnnotation[]) => {
    setSTLFiles(_stlFiles);

    var _file: FileList[] = [];

    _stlFiles.forEach(f => {
      var temp: FileList = { fileName: f.fileName, isAnnotated: f.annotated };
      _file.push(temp);
    });

    setFileList(_file);
  }

  const updateDataLabels = (updatedProblems: ProblemType[]): void => {
    setCurrentProblems(updatedProblems);

    var _stlFiles: FileAnnotation[] = stlFiles;

    _stlFiles = updateListWithCurrentProblems(updatedProblems, _stlFiles);

    setSTLFiles(_stlFiles);
    updateLocalStoargeFileList(updatedProblems);
  }

  const updateLocalStoargeFileList = (updatedProblems: ProblemType[]) => {
    var _fileList: FileAnnotation[] = JSON.parse(localStorage.getItem(FileListStoargeKey));

    _fileList = updateListWithCurrentProblems(updatedProblems, _fileList);

    localStorage.setItem(FileListStoargeKey, JSON.stringify(_fileList));
  }

  const updateListWithCurrentProblems = (updateProblems: ProblemType[], _files: FileAnnotation[]): FileAnnotation[] => {
    var cur: number = _.findIndex(_files, function (f) {
      return _.eq(f.fileName, currentFile);
    })

    _files[cur].problems = updateProblems;

    return _files;
  }

  const handleFileSelect = (fileName: string) => {
    var currIndex = _.findIndex(stlFiles, function (f) {
      return _.eq(f.fileName, fileName);
    })

    initializeCurrentFile(stlFiles[currIndex]);
  };

  const showDetailPane = (isShow: boolean): void => {
    setIsShowDetailPane(isShow);
    isShowDetail = isShow;
    setComponentsGridWidth();
  };

  const showFilePane = (isShow: boolean): void => {
    setIsShowFilePane(isShow);
    isShowFile = isShow;

    if (isShowColorSpraySelector) {
      setIsShowColorSpraySelector(false);
      isShowColorSpray = false;
    }

    setComponentsGridWidth();
  };

  const showColorSpraySelector = (isShow: boolean): void => {
    setIsShowColorSpraySelector(isShow);
    isShowColorSpray = isShow;

    if (isShowFilePane) {
      setIsShowFilePane(false);
      isShowFile = false;
    }

    setComponentsGridWidth();
  };

  const setComponentsGridWidth = (): void => {
    switch (isShowDetail) {
      case true:
        setDetailPaneWidth(3);

        if (isShowFile) {
          if (isShowColorSpray) {
            setSidebarWidth(3);
            setModelGridWidth(6);
          } else {
            setSidebarWidth(2);
            setModelGridWidth(7);
          }
        } else {
          if (isShowColorSpray) {
            setSidebarWidth(2);
            setModelGridWidth(7);
          } else {
            setSidebarWidth(1);
            setModelGridWidth(8);
          }
        }
        break;
      case false:
        setDetailPaneWidth(0);

        if (isShowFile) {
          if (isShowColorSpray) {
            setSidebarWidth(3);
            setModelGridWidth(9);
          } else {
            setSidebarWidth(2);
            setModelGridWidth(10);
          }
        } else {
          if (isShowColorSpray) {
            setSidebarWidth(2);
            setModelGridWidth(10);
          } else {
            setSidebarWidth(1);
            setModelGridWidth(11);
          }
        }
        break;
      default:
        break;
    }
  };

  const initializeCurrentFile = (_file: FileAnnotation) => {
    setCurrentProblems(_file.problems);
    setCurrentFile(_file.fileName);
    loadSTLFile(_file.fileObject);
  }

  const openHotkeyDialog = () => {
    setIsHotkeyDialogOpen(true);
  };

  const handleHotkeySave = (newHotkeys: Hotkeys) => {
    setHotkeys(newHotkeys);
  };

  const handleCloseErrorDialog = () => {
    setIsShowErrorAlert(false);
  }

  const showErrorAlert = (
    _title: string,
    _content: string,
    onConfirm?: () => void,
    onCancel?: () => void
  ): void => {
    setAlertContent({ title: _title, content: _content });
    setIsShowErrorAlert(true);

    setConfirmAction(() => () => {
      setIsShowErrorAlert(false);
      if (onConfirm) onConfirm();
    });
  
    setCancelAction(() => () => {
      setIsShowErrorAlert(false);
      if (onCancel) onCancel();
    });
  };
  
  


const checkIfNowCanAnnotate = (): boolean => {
  return _.findIndex(currProblems, (p) => {
    return _.findIndex(p.classes, (c) => c.isAnnotating === true) !== -1;
  }) !== -1;
};



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
          openHotkeyDialog={openHotkeyDialog} 
          meshRef={meshRef}
          showErrorAlert={showErrorAlert} />
      </Box>
      <Grid container rowSpacing={1}>
        <Grid size={sidebarWidth}>
          <Sidebar
            showFilePane={showFilePane}
            showColorSpraySelector={showColorSpraySelector}
            onFileSelect={handleFileSelect}
            fileList={fileList}
            currentFile={currentFile} 
            checkIfNowCanAnnotate={checkIfNowCanAnnotate}
            showErrorAlert={showErrorAlert} />
        </Grid>
        <Grid size={modelGridWidth} sx={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
          {modelData && <ModelDisplay meshRef={meshRef} modelData={modelData} currProblem={currProblems} updateProblems={updateDataLabels} />}
        </Grid>
        <Grid size={detailPaneWidth} offset={'auto'}>
          <DetailPane
            isShow={isShowDetailPane}
            currentFile={currentFile}
            currProblems={currProblems}
            updateProblems={updateDataLabels}
            showErrorAlert={showErrorAlert}
          />
        </Grid>
      </Grid>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={isShowErrorDialog}
        autoHideDuration={null} 
        
        onClose={handleCloseErrorDialog}>
        <Alert
    onClose={handleCloseErrorDialog}
    severity="warning"
    action={
      <>
        <Button color="inherit" size="small" onClick={confirmAction}>
          OK
        </Button>
        <Button color="inherit" size="small" onClick={cancelAction}>
          Cancel
        </Button>
      </>
    }
  >
    <AlertTitle>{alertContent.title}</AlertTitle>
    {alertContent.content}
  </Alert>
</Snackbar>
      <HotkeyDialog
        open={isHotkeyDialogOpen}
        onClose={() => setIsHotkeyDialogOpen(false)}
        onSave={handleHotkeySave}
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
