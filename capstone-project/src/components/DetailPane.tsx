import { Toolbar, Typography, Accordion, AccordionDetails, AccordionSummary, List, ListItem, } from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'


export type DetailPane = {
    // isShow: boolean
};

export default function DetailPane({}: DetailPane) {

    return (
        <div>
            {/* {isShow && ( */}
                <div id="right-pane">
                    <Toolbar id="detail-pane-header">
                        <Typography>Annotated Items</Typography>
                    </Toolbar>
                    <List sx={{ width: '100%' }} id="detail-list">
                        <ListItem>
                            <Accordion sx={{ width: '100%' }}>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls="panel1-content"
                                >
                                    Problem 1
                                </AccordionSummary>
                                <AccordionDetails sx={{ paddingY: '0px', paddingRight: '0px' }}>
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
                </div>
            {/* )} */}

        </div>
    );
}