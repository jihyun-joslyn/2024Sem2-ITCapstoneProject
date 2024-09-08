import React, { useState } from 'react';
import { createRoot } from "react-dom/client";
import { Box, Grid, Container } from '@mui/material';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import DetailPane from '../components/DetailPane';
import ModelDisplay from "../components/ModelDisplay";

const container = document.getElementById('root');
const root = createRoot(container);

const App = () => {
  const [modelData, setModelData] = useState<ArrayBuffer | null>(null);

  const handleModelLoad = (data: ArrayBuffer) => {
    setModelData(data);
  };

  return (
    <Container maxWidth="xl" sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flexGrow: 0 }}>
        <Header onModelLoad={handleModelLoad} />
      </Box>
      <Grid container spacing={2} sx={{ flexGrow: 1 }}>
        <Grid item xs={2}>
          <Sidebar />
        </Grid>
        <Grid item xs={8} sx={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
          {modelData && <ModelDisplay modelData={modelData} />}
        </Grid>
        <Grid item xs={2}>
          <DetailPane />
        </Grid>
      </Grid>
    </Container>
  );
};

root.render(<App />);