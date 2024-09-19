// src/scripts/app.tsx

import React, { useState } from 'react';
import { createRoot } from "react-dom/client";
import { Box, Grid, Container } from '@mui/material';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import DetailPane from '../components/DetailPane';
import ModelDisplay from "../components/ModelDisplay";
import { ModelProvider } from '../components/ModelContext';

const container = document.getElementById('root');
if (!container) {
    throw new Error('Root container not found');
}
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
            <Container maxWidth="xl" sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ flexGrow: 0 }}>
                    <Header showDetailPane={showDetailPane} onModelLoad={handleModelLoad} />
                </Box>
                <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                    <Grid item xs={2}>
                        <Sidebar />
                    </Grid>
                    <Grid item xs={8} sx={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
                        {modelData && <ModelDisplay modelData={modelData} />}
                    </Grid>
                    <Grid item xs={2}>
                        <DetailPane isShow={isShowDetailPane} />
                    </Grid>
                </Grid>
            </Container>
        </ModelProvider>
    );
};

root.render(<App />);
