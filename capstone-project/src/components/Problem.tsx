import { Accordion, AccordionDetails, AccordionSummary, TextField, } from '@mui/material';
import { UnfoldMore as UnfoldMoreIcon } from '@mui/icons-material';
import { useState, KeyboardEvent, useEffect } from 'react';
import * as _ from "lodash";
import UpsertMenu from './UpsertMenu';


export type Problem = {
    problemName: string,
    labelArr: string[][],
    problemKey: number,
    updateProblem: (userInput: string, arrIndex: number) => void;
    deleteProblem: (arrIndex: number) => void;
};

export default function Problem({ problemName, labelArr, problemKey, updateProblem, deleteProblem }: Problem) {
    const [problem, setProblem] = useState(problemName);
    const [isEditProblem, setIsEditProblem] = useState(false);
    const [problemInput, setProblemInput] = useState(problemName);

    useEffect(() => {
        setProblem(problemName);
        setProblemInput(problemName);
    })

    const editProblem = (e: KeyboardEvent<HTMLDivElement>): void => {
        if (!_.isEmpty(_.trim(problemInput)) && (e.key === "Enter")) {
            setProblem(problemInput);

            setIsEditProblem(false);
            updateProblem(problemInput, problemKey);
        }
    }

   

    return (
        <Accordion sx={{ width: '100%' }}>
            <AccordionSummary
                expandIcon={<UnfoldMoreIcon sx={{ color: '#9c806c' }} />}
            >
                {!isEditProblem && problem}
                {isEditProblem && (
                    <TextField id="edit-problem" label="Edit Problem" variant="standard" value={problemInput} onChange={e => { setProblemInput(e.target.value); }} onKeyDown={e => { editProblem(e) }} />
                )}

                <span className='upsert-button'>
                    <UpsertMenu onClickEdit={() => { setIsEditProblem(true); }} onClickDelete={() => { deleteProblem(problemKey); setProblem(problemName); setProblemInput(problemName); }} />
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
                                                    {/* <UpsertMenu /> */}
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