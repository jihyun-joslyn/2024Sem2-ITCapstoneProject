import { Toolbar, Typography, Accordion, AccordionDetails, AccordionSummary, List, ListItem, Button } from '@mui/material';
import { Add as AddIcon, UnfoldMore as UnfoldMoreIcon } from '@mui/icons-material'
import { useState } from 'react';
import UpsertMenu from './UpsertMenu';
import Problem from './Problem';

export type DetailPane = {
    isShow: boolean
};

export default function DetailPane({ isShow }: DetailPane) {

    const problemArr = ['Problem 1', 'Problem 2', 'Problem 3'];
    const labelArr = [[['Class 1-1', 'Detail 1-1-1', 'Detail 1-1-2'], ['Class 1-2'], ['Class 1-3']], [['Class 2-1'], ['Class 2-2']], []];

    const addProblem = (): void => {

    };

    const editProblem = (userInput: string, problemIndex: number) : void => {
        
    };

    return (
        <div>
            {isShow && (
                <div id="right-pane">
                    <Toolbar id="detail-pane-header">
                        <Typography>Annotated Items</Typography>
                        <span className='upsert-button'><Button><AddIcon /></Button></span>
                    </Toolbar>
                    <List sx={{ width: '100%' }} id="detail-list">
                        {problemArr.map((p, i) => {
                            var _labelArr = labelArr.at(i);

                            return (
                                <ListItem key={i}>
                                    <Problem problemName={p} labelArr={_labelArr} />
                                </ListItem>
                            )
                        }
                        )}

                    </List>
                </div>
            )}
        </div>
    );
}


