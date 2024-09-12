import { Toolbar, Typography, Accordion, AccordionDetails, AccordionSummary, List, ListItem, Button, } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Add as AddIcon, Edit as EditIcon } from '@mui/icons-material'


export type DetailPane = {
    isShow: boolean
};

export default function DetailPane({ isShow }: DetailPane) {

    // const problemArr = ['Problem 1', 'Problem 2', ['']]

    return (
        <div>
            {isShow && (
                <div id="right-pane">
                    <Toolbar id="detail-pane-header">
                        <Typography>Annotated Items</Typography>
                        <span className='upsert-button'><Button><AddIcon /></Button></span>
                    </Toolbar>
                    <List sx={{ width: '100%' }} id="detail-list">
                        <ListItem>
                            <Accordion sx={{ width: '100%' }}>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls="panel1-content"
                                >
                                    Problem 1 
                                    <span className='upsert-button'><Button><EditIcon /></Button> 
                                    <Button><AddIcon /></Button></span>
                                </AccordionSummary>
                                <AccordionDetails sx={{ paddingY: '0px', paddingRight: '0px' }}>
                                    <List sx={{ paddingLeft: '8px' }}>
                                        <ListItem>
                                            <Accordion sx={{ width: '100%' }}>
                                                <AccordionSummary
                                                    expandIcon={<ExpandMoreIcon />}
                                                    aria-controls="panel1-content"
                                                >
                                                    Class 1 <span className='upsert-button'>
                                                        <Button><EditIcon /></Button></span>
                                                </AccordionSummary>
                                                <AccordionDetails sx={{ paddingLeft: '16px' }}>
                                                    Details
                                                </AccordionDetails>
                                                <AccordionDetails sx={{ paddingLeft: '16px' }}>
                                                    Details
                                                </AccordionDetails>
                                            </Accordion>
                                        </ListItem>
                                        <ListItem>
                                            <Accordion sx={{ width: '100%' }}>
                                                <AccordionSummary
                                                    expandIcon={<ExpandMoreIcon />}
                                                    aria-controls="panel1-content"
                                                >
                                                    Class 1 <span className='upsert-button'>
                                                        <Button><EditIcon /></Button></span>
                                                </AccordionSummary>
                                                <AccordionDetails sx={{ paddingLeft: '16px' }}>
                                                    Details
                                                </AccordionDetails>
                                            </Accordion>
                                        </ListItem>
                                    </List>
                                </AccordionDetails>
                            </Accordion>
                        </ListItem>
                        <ListItem>
                            <Accordion sx={{ width: '100%' }}>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls="panel1-content"
                                >
                                    Problem 1 
                                    <span className='upsert-button'><Button><EditIcon /></Button> 
                                    <Button><AddIcon /></Button></span>
                                </AccordionSummary>
                                <AccordionDetails sx={{ paddingY: '0px', paddingRight: '0px' }}>
                                    <List sx={{ paddingLeft: '8px' }}>
                                        <ListItem>
                                            <Accordion sx={{ width: '100%' }}>
                                                <AccordionSummary
                                                    expandIcon={<ExpandMoreIcon />}
                                                    aria-controls="panel1-content"
                                                >
                                                    Class 1 <span className='upsert-button'>
                                                        <Button><EditIcon /></Button></span>
                                                </AccordionSummary>
                                                <AccordionDetails sx={{ paddingLeft: '16px' }}>
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
            )}

        </div>
    );
}

/* [Problem 1, Problem 2, Problem 3] 
    [[Class 1-1, Class 1-2, Class 1-3], [], [Class 2-1, Class 2-2]]
    [Problem 1, [Class 1-1, [Details 1-1-1, Detail 1-1-2, Detail 1-1-3]]]
    */