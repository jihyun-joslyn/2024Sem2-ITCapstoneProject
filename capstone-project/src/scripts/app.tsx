import { useState } from 'react';
import { createRoot } from "react-dom/client";
import { Grid2 as Grid } from '@mui/material';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import DetailPane from '../components/DetailPane';
import ModelDisplay from "../components/ModelDisplay";
import { ModelProvider } from '../components/ModelContext';

const container = document.getElementById('root');
const root = createRoot(container);

var isShowDetail: boolean = false;
var isShowFile: boolean = false;

const App = () => {
  const [isShowDetailPane, setIsShowDetailPane] = useState(false);
  const [isShowFilePane, setIsShowFilePane] = useState(false);
  const [modelData, setModelData] = useState<ArrayBuffer | null>(null);
  const [modelGridWidth, setModelGridWidth] = useState(11);
  const [detailPaneWidth, setDetailPaneWidth] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(1);

  const handleModelLoad = (data: ArrayBuffer) => {
    setModelData(data);
  };

  const showDetailPane = (isShow: boolean): void => {
    setIsShowDetailPane(isShow);
    isShowDetail = isShow;

    setComponentsGridWidth();
  }

  const showFilePane = (isShow: boolean): void => {
    setIsShowFilePane(isShow);
    isShowFile = isShow;

    setComponentsGridWidth();
  }

  const setComponentsGridWidth = (): void => {
    switch (isShowDetail) {
      case true:
        setDetailPaneWidth(3);

        if (isShowFile) {
          setSidebarWidth(2);
          setModelGridWidth(7);
        } else {
          setSidebarWidth(1);
          setModelGridWidth(8);
        }

        break;
      case false:
        setDetailPaneWidth(0);

        if (isShowFile) {
          setSidebarWidth(2);
          setModelGridWidth(10);
        } else {
          setSidebarWidth(1);
          setModelGridWidth(11);
        }

        break;
      default:
        break;
    }
  }

  return (
    <ModelProvider>
      <Box sx={{ flexGrow: 0 }}>
        <Header showDetailPane={showDetailPane} onModelLoad={handleModelLoad} />
      </Box>
      <Grid container rowSpacing={1}>
        <Grid size={sidebarWidth}>
          <Sidebar showFilePane={showFilePane} />
        </Grid>
        <Grid size={modelGridWidth} sx={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
          {modelData && <ModelDisplay modelData={modelData} />}
        </Grid>
        <Grid size={detailPaneWidth} offset={'auto'}>
          <DetailPane isShow={isShowDetailPane} />
        </Grid>
      </Grid>
    </ModelProvider>
  );
};

root.render(<App />);