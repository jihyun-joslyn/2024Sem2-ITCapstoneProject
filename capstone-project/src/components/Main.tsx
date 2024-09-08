import { Toolbar, Typography, Accordion, AccordionDetails, AccordionSummary, List, ListItem, Grid2 as Grid, } from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import DetailPane from './DetailPane';
import Header from './Header';
import Sidebar from './Sidebar';
import { useState } from 'react';



export type Main = {

};

export default function Main({ }: Main) {
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
}