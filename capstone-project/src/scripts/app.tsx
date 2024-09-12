import { useState } from 'react';
import { createRoot } from "react-dom/client";
import { Grid2 as Grid } from '@mui/material';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import DetailPane from '../components/DetailPane';

const container = document.getElementById('root');
const root = createRoot(container);

const App = () => {
  const [isShowDetailPane, setIsShowDetailPane] = useState(false);

    const showDetailPane = (isShow: boolean): void => {
        setIsShowDetailPane(isShow);
    }
    return (
        <div>
            <Header showDetailPane={showDetailPane} />

            <Grid container rowSpacing={1}>
                <Grid size="auto">
                    <Sidebar />
                </Grid>
                <Grid size={3} offset={'auto'}>
                    <DetailPane isShow={isShowDetailPane} />
                </Grid>
            </Grid>

        </div>
    );
};

root.render(<App />);