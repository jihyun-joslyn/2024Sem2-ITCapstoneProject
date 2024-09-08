import { Toolbar, Typography, Accordion, AccordionDetails, AccordionSummary, List, ListItem, Button, } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Add as AddIcon, Edit as EditIcon } from '@mui/icons-material'


export type DetailPane = {
    isShow: boolean
};

export default function DetailPane({ isShow }: DetailPane) {

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
            )}

        </div>
    );
}