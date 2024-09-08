/* import { createRoot } from "react-dom/client";
import Main from '../components/Main';

const container = document.getElementById('root');

const root = createRoot(container);


function main() {

  root.render(<div>
   <Main />
  </div>
  );
}

main();


 */


import React, { useState } from 'react';
import { createRoot } from "react-dom/client";
import { Box, Grid2 as Grid, Container } from '@mui/material';
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