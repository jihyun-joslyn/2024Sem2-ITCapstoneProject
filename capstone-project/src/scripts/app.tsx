import { useState } from 'react';
import { createRoot } from "react-dom/client";
import { Grid2 as Grid, Box } from '@mui/material';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import DetailPane from '../components/DetailPane';
import ModelDisplay from "../components/ModelDisplay";
import { ModelProvider } from '../components/ModelContext';

type ProblemType = {
  name: string;
  classes: string[][];
};

const container = document.getElementById('root');
const root = createRoot(container);

var isShowDetail: boolean = false;
var isShowColorSpray: boolean = false;
var isShowFile: boolean = false;

const App = () => {
  const [isShowDetailPane, setIsShowDetailPane] = useState(false);
  const [isShowFilePane, setIsShowFilePane] = useState(false);
  const [isShowColorSpraySelector, setIsShowColorSpraySelector] = useState(false);
  const [modelData, setModelData] = useState<ArrayBuffer | null>(null);
  const [modelGridWidth, setModelGridWidth] = useState(11);
  const [detailPaneWidth, setDetailPaneWidth] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(1);
  const [stlFiles, setStlFiles] = useState<{ fileName: string, fileObject: File, problem: string, class: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [problems, setProblems] = useState<ProblemType[]>([]);

  const handleModelLoad = (data: ArrayBuffer) => {
    setModelData(data);
  };

  const loadSTLFile = (file: File) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        setModelData(reader.result);
      }
    };
  };

  const updateStlFilesWithProblems = (updatedProblems: ProblemType[], fileName: string) => {
    const updatedFiles = stlFiles.map((file) => {
      if (file.fileName === fileName) {
        return {
          ...file,
          problem: updatedProblems.map(p => `${p.name},${p.classes.flat().join(',')}`).join(';')
        };
      }
      return file;
    });
    setStlFiles(updatedFiles);
  };

  const handleFileSelect = (fileName: string) => {
    const selectedFileData = stlFiles.find(file => file.fileName === fileName);
    if (selectedFileData) {
      setSelectedFile(fileName);

      const parsedProblems: ProblemType[] = selectedFileData.problem
        .split(';')
        .map(problemStr => {
          const [name, ...classes] = problemStr.split(',');
          const classArrays = classes.map(c => [c]);
          return { name, classes: classArrays };
        });

      setProblems(parsedProblems);
      loadSTLFile(selectedFileData.fileObject);
    }
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

  return (
    <ModelProvider>
      <Box sx={{ flexGrow: 0 }}>
        <Header
          showDetailPane={showDetailPane}
          onModelLoad={handleModelLoad}
          isShowDetailPane={isShowDetailPane}
          stlFiles={stlFiles}
          setStlFiles={setStlFiles}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile} />
      </Box>
      <Grid container rowSpacing={1}>
        <Grid size={sidebarWidth}>
          <Sidebar
            showFilePane={showFilePane}
            showColorSpraySelector={showColorSpraySelector}
            stlFiles={stlFiles}
            onFileSelect={handleFileSelect} />
        </Grid>
        <Grid size={modelGridWidth} sx={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
          {modelData && <ModelDisplay modelData={modelData} />}
        </Grid>
        <Grid size={detailPaneWidth} offset={'auto'}>
          <DetailPane
            isShow={isShowDetailPane}
            selectedFile={selectedFile}
            stlFiles={stlFiles}
            setStlFiles={setStlFiles}
            onFileSelect={handleFileSelect}
            problems={problems}
            setProblems={(updatedProblems: ProblemType[]) => {
              setProblems(updatedProblems);
              if (selectedFile) {
                updateStlFilesWithProblems(updatedProblems, selectedFile);
              }
            }} />
        </Grid>
      </Grid>
    </ModelProvider>
  );
};

root.render(<App />);
