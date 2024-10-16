import { Accordion, AccordionDetails, AccordionSummary, List, ListItem, TextField } from '@mui/material';
import { UnfoldMore as UnfoldMoreIcon } from '@mui/icons-material';
import { useState, KeyboardEvent, useEffect, useContext } from 'react';
import * as _ from "lodash";
import UpsertMenu from './UpsertMenu';
import Class from './Class';
import useModelStore from '../components/StateStore';
import ModelContext from "../components/ModelContext";

export type ProblemProps = {
    problemName: string;
    labelArr: string[][];
    problemKey: number;
    updateProblem: (userInput: string, index: number) => void;
    deleteProblem: (index: number) => void;
    updateLabel: (labels: string[][], arrIndex: number) => void;
};

export default function Problem({ problemName, labelArr, problemKey, updateProblem, deleteProblem, updateLabel }: ProblemProps) {
    const [problem, setProblem] = useState(problemName);
    const [isEditProblem, setIsEditProblem] = useState(false);
    const [problemInput, setProblemInput] = useState(problemName);
    const [isAddNewClass, setIsAddNewClass] = useState(false);
    const [inputNewClass, setInputNewClass] = useState("");
    const [labels, setLabels] = useState(labelArr);
    const {modelId,problems,updateProblems, deleteProblem: storeDeleteProblem,addProblem,setCurrentProblemIndex} = useModelStore();
    const {modelData} = useContext(ModelContext);
    useEffect(() => {
        setProblem(problemName);
        setProblemInput(problemName);
        setLabels(labelArr);
    }, [problemName, labelArr]);

    

    useEffect(() => {
        console.log("tets");
        setIsEditProblem(true);
        const storedProblems = problems.find(p => p.modelId === modelId);
        if(storedProblems){
            setProblem(storedProblems.name);
            setProblemInput(problemName);
            setLabels(storedProblems.classes.map(cla => [cla.className]));
            console.log(problemInput,problemKey);
            updateProblem(problemInput, problemKey);
            setIsEditProblem(false);
        }
    },[modelData]);


    useEffect(() => {
        if(!isEditProblem){
            setCurrentProblemIndex(problemKey);
            const problemData = {
                modelId : modelId,
                name : problemName,
                classes: labels.map(label => ({
                    className: label[0],
                    annotation: {},
                    annotationType: 'default'
                }))
            };
            updateProblems(problemKey,problemData);
        }
    },[isEditProblem,problem,labels,problemKey,updateProblems]);

    const editProblem = (e: KeyboardEvent<HTMLDivElement>): void => {
        if (!_.isEmpty(_.trim(problemInput)) && (e.key === "Enter")) {
            setProblem(problemInput);
            setIsEditProblem(false);
            updateProblem(problemInput, problemKey);
        }
    };

    const onAddClassInputChange = (e: KeyboardEvent<HTMLDivElement>): void => {
        if (!_.isEmpty(_.trim(inputNewClass)) && (e.key === "Enter")) {
            const newLabels = [...labels, [inputNewClass]];
            setLabels(newLabels);
            setInputNewClass("");
            setIsAddNewClass(false);
            updateLabel(newLabels, problemKey);
        }
    };

    const updateLabelArr = (classes: string[], arrIndex: number): void => {
        const newLabels = [...labels];
        newLabels[arrIndex] = classes;
        setLabels(newLabels);
        updateLabel(newLabels, problemKey);
    };

    const deleteClass = (arrIndex: number): void => {
        const newLabels = labels.filter((_, i) => i !== arrIndex);
        setLabels(newLabels);
        updateLabel(newLabels, problemKey);
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
                                labelArr={l}
                                labelIndex={j}
                                updateLabel={updateLabelArr}
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