import { Accordion, AccordionDetails, AccordionSummary, List, ListItem, TextField } from '@mui/material';
import { UnfoldMore as UnfoldMoreIcon } from '@mui/icons-material';
import { useState, KeyboardEvent, useEffect } from 'react';
import * as _ from "lodash";
import UpsertMenu from './UpsertMenu';
import Class from './Class';
import { ProblemType } from '../datatypes/ProblemType';
import { AnnotationType, ClassDetail } from '../datatypes/ClassDetail';

export type ProblemProps = {
    problemName: string;
    classes: ClassDetail[];
    problemKey: number;
    updateProblem: (userInput: string, index: number) => void;
    deleteProblem: (index: number) => void;
    updateLabel: (labels: ClassDetail[], arrIndex: number) => void;
};

export default function Problem({ problemName, classes, problemKey, updateProblem, deleteProblem, updateLabel }: ProblemProps) {
    const [problem, setProblem] = useState(problemName);
    const [isEditProblem, setIsEditProblem] = useState(false);
    const [problemInput, setProblemInput] = useState(problemName);
    const [isAddNewClass, setIsAddNewClass] = useState(false);
    const [inputNewClass, setInputNewClass] = useState("");
    const [labels, setLabels] = useState(classes);

    useEffect(() => {
        setProblem(problemName);
        setProblemInput(problemName);
        setLabels(classes);
    }, [problemName, classes]);

    const editProblem = (e: KeyboardEvent<HTMLDivElement>): void => {
        if (!_.isEmpty(_.trim(problemInput)) && (e.key === "Enter")) {
            setProblem(problemInput);
            setIsEditProblem(false);
            updateProblem(problemInput, problemKey);
        }
    };

    const onAddClassInputChange = (e: KeyboardEvent<HTMLDivElement>): void => {
        if (!_.isEmpty(_.trim(inputNewClass)) && (e.key === "Enter")) {
        const newClass: ClassDetail = {name: inputNewClass, annotationType: AnnotationType.NONE, coordinates: [], color: ""};
        const updatedLabels = [...labels, newClass]; 

        setLabels(updatedLabels);
        setInputNewClass("");
        setIsAddNewClass(false);
        updateLabel(updatedLabels, problemKey);
        }
    };

    const updateClassArr = (_class: ClassDetail, arrIndex: number): void => {
        var _labels: ClassDetail[] = labels;
        
        _labels[arrIndex] = _class;
       
        setLabels(_labels);
        updateLabel(_labels, problemKey);
    };

    const deleteClass = (arrIndex: number): void => {
        var _labels: ClassDetail[] = labels;

        _labels = _.dropWhile(_labels, function(c, i) {
            return i != arrIndex;
        });

        setLabels(_labels);
        updateLabel(_labels, problemKey);
    };

    return (
        <Accordion sx={{ width: '100%' }}>
            <AccordionSummary expandIcon={<UnfoldMoreIcon sx={{ color: '#9c806c' }} />}>
                {!isEditProblem ? (
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
                ) : (
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
                <List>
                    {labels.map((l, j) => (
                        <ListItem sx={{ paddingY: '0px', paddingRight: '0px', border: '0px' }} key={j}>
                            <Class
                                classDetails={l}
                                labelIndex={j}
                                updateLabel={updateClassArr}
                                deleteClass={deleteClass}
                            />
                        </ListItem>
                    ))}
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
