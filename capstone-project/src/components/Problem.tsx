import { Accordion, AccordionDetails, AccordionSummary, List, ListItem, TextField, } from '@mui/material';
import { UnfoldMore as UnfoldMoreIcon } from '@mui/icons-material';
import { useState, KeyboardEvent, useEffect } from 'react';
import * as _ from "lodash";
import UpsertMenu from './UpsertMenu';
import Class from './Class';


export type Problem = {
    problemName: string,
    labelArr: string[][],
    problemKey: number,
    updateProblem: (userInput: string, arrIndex: number) => void;
    deleteProblem: (arrIndex: number) => void;
    updateLabel: (labels: string[][], arrIndex: number) => void;
};

export default function Problem({ problemName, labelArr, problemKey, updateProblem, deleteProblem, updateLabel }: Problem) {
    const [problem, setProblem] = useState(problemName);
    const [isEditProblem, setIsEditProblem] = useState(false);
    const [problemInput, setProblemInput] = useState(problemName);
    const [isAddNewClass, setIsAddNewClass] = useState(false);
    const [inputNewClass, setInputNewClass] = useState("");
    const [labels, setLabels] = useState(labelArr);

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

    const onAddClassInputChange = (e: KeyboardEvent<HTMLDivElement>): void => {
        var _labels: string[][] = labels;

        if (!_.isEmpty(_.trim(inputNewClass)) && (e.key === "Enter")) {
            _labels.push([inputNewClass]);

            setLabels(_labels);
            setInputNewClass("");

            setIsAddNewClass(false);
            updateLabel(labels, problemKey);
        }

    };

    const updateLabelArr = (classes: string[], arrIndex: number): void => {
        var _labels: string[][] = labels;

        _labels[arrIndex] = classes;
        setLabels(_labels);
        updateLabel(labels, problemKey);
    }

    const deleteClass = (arrIndex: number): void => {
        var _labels: string[][] = [];

        labels.forEach((l, i) => {
            if (i != arrIndex)
                _labels.push(l);
        })

        setLabels(_labels);
        updateLabel(_labels, problemKey);
    }

    return (
        <Accordion sx={{ width: '100%' }}>
            <AccordionSummary
                expandIcon={<UnfoldMoreIcon sx={{ color: '#9c806c' }} />}
            >
                {!isEditProblem && (
                    <span>
                        {problem}
                        <span className='upsert-button'>
                            <UpsertMenu
                                onClickEdit={() => { setIsEditProblem(true); }}
                                onClickDelete={() => { deleteProblem(problemKey); }}
                                onClickAdd={() => { setIsAddNewClass(true); }}
                                isNeedAdd={true}
                            />
                        </span>
                    </span>
                )}
                {isEditProblem && (
                    <TextField
                        id="edit-problem"
                        label="Edit Problem"
                        variant="standard"
                        value={problemInput}
                        onChange={e => { setProblemInput(e.target.value); }}
                        onKeyDown={e => { editProblem(e) }}
                    />
                )}
            </AccordionSummary>
            <AccordionDetails sx={{ paddingY: '0px', paddingRight: '0px', border: '0px' }}>
                <List >
                    {labels.map((l, j) => {
                        return (
                            <ListItem sx={{ paddingY: '0px', paddingRight: '0px', border: '0px' }} key={j}>
                                <Class labelArr={l} labelIndex={j} updateLabel={updateLabelArr} deleteClass={deleteClass} />
                            </ListItem>
                        )

                    })}
                    {isAddNewClass && (
                        <ListItem sx={{ paddingY: '0px', paddingRight: '0px', border: '0px' }}>
                            <TextField
                                id="add-new-class"
                                label="New Class"
                                variant="standard"
                                value={inputNewClass}
                                onChange={e => { setInputNewClass(e.target.value); }}
                                onKeyDown={e => { onAddClassInputChange(e) }}
                            />

                        </ListItem>
                    )}
                </List>
            </AccordionDetails>

        </Accordion>
    );
}