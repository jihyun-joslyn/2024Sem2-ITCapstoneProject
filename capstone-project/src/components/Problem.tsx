import { Accordion, AccordionDetails, AccordionSummary, IconButton, Menu, MenuItem, } from '@mui/material';
import { UnfoldMore as UnfoldMoreIcon } from '@mui/icons-material';
import { useState } from 'react';
import UpsertMenu from './UpsertMenu';


export type Problem = {
    problemName: string,
    labelArr: string[][]
};

export default function Problem({ problemName, labelArr }: Problem) {

    return (
        <Accordion sx={{ width: '100%' }}>
            <AccordionSummary
                expandIcon={<UnfoldMoreIcon sx={{ color: '#9c806c' }} />}
            >
                {problemName}
                <span className='upsert-button'>
                    <UpsertMenu />
                </span>
            </AccordionSummary>
            <AccordionDetails sx={{ paddingY: '0px', paddingRight: '0px', border: '0px' }}>
                {labelArr.map((l, j) => {
                    return (
                        <Accordion sx={{}} key={j} className='class-list-item'>
                            {l.map((_l, x) => {
                                switch (x) {
                                    case 0:
                                        return (
                                            <AccordionSummary
                                                expandIcon={<UnfoldMoreIcon sx={{ color: '#9c806c' }} />}
                                                sx={{ border: '0px' }} 
                                                key={x}
                                            >
                                                {_l}
                                                <span className='upsert-button'>
                                                    <UpsertMenu />
                                                </span>
                                            </AccordionSummary>
                                        )
                                    default:
                                        return (
                                            <AccordionDetails
                                                sx={{ paddingLeft: '16px' }}
                                                className='class-detail'
                                                key={x}
                                            >
                                                {_l}
                                            </AccordionDetails>
                                        )
                                }

                            })}
                        </Accordion>
                    )

                })}
            </AccordionDetails>
        </Accordion>
    );
}