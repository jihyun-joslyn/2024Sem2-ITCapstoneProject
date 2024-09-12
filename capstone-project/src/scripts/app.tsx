import { useState } from 'react';
import { createRoot } from "react-dom/client";
import { Box, Grid2 as Grid, Container } from '@mui/material';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import DetailPane from '../components/DetailPane';
import ModelDisplay from "../components/ModelDisplay";
import { ModelProvider } from '../components/ModelContext';

const container = document.getElementById('root');
const root = createRoot(container);

const App = () => {
  const [isShowDetailPane, setIsShowDetailPane] = useState(false);
  const [modelData, setModelData] = useState<ArrayBuffer | null>(null);

  const handleModelLoad = (data: ArrayBuffer) => {
    setModelData(data);
  };

  const showDetailPane = (isShow: boolean): void => {
    setIsShowDetailPane(isShow);
  }

  return (
    <ModelProvider>
      <Box sx={{ flexGrow: 0 }}>
        <Header showDetailPane={showDetailPane} onModelLoad={handleModelLoad} />
      </Box>
      <Grid container rowSpacing={1}>
        <Grid size="auto">
          <Sidebar />
        </Grid>
        <Grid size={8} sx={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
          {modelData && <ModelDisplay modelData={modelData} />}
        </Grid>
        <Grid size={3} offset={'auto'}>
          <DetailPane isShow={isShowDetailPane} />
        </Grid>
      </Grid>
    </ModelProvider>
  );
};

root.render(<App />);