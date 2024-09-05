import { useState } from 'react';
import { AppBar, Toolbar, Button, Menu, MenuItem, Typography, Accordion, AccordionDetails, AccordionSummary, List, ListItem, } from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'


export type DetailPane = {

};

export default function DetailPane({ }: DetailPane) {



    return (
        <div id="right-pane">
            <Toolbar id="detail-pane-header">
                <Typography variant="h6">Annotated Items</Typography>
            </Toolbar>
            <List sx={{ width: '100%' }}>
                <ListItem>
                    <Accordion sx={{ width: '100%' }}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1-content"

                        >
                            Problem 1
                        </AccordionSummary>
                        <AccordionDetails sx={{paddingY: '0px', paddingRight: '0px' }}>
                            <List sx={{ paddingLeft: '8px' }}>
                                <ListItem>
                                    <Accordion sx={{ width: '100%' }}>
                                        <AccordionSummary
                                            expandIcon={<ExpandMoreIcon />}
                                            aria-controls="panel1-content"

                                        >
                                            Class 1
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            Details
                                        </AccordionDetails>
                                    </Accordion>
                                </ListItem>
                            </List>
                        </AccordionDetails>
                    </Accordion>
                </ListItem>
            </List>
            {/* <Accordion className="accordion">
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                >
                    Problem 1
                </AccordionSummary>
                <AccordionDetails>
                    <Accordion>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1-content"
                            id="panel1-header"
                        >
                            Class 1
                        </AccordionSummary>
                        <AccordionDetails>
                            Details
                        </AccordionDetails>
                    </Accordion>
                </AccordionDetails>
            </Accordion> */}
        </div>
    );
}