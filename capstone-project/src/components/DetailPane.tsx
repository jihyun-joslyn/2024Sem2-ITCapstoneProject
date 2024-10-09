import { Toolbar, Typography, List, ListItem, TextField, IconButton } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useState, useEffect, KeyboardEvent } from 'react';
import * as _ from "lodash";
import Problem from './Problem';
import { ProblemType } from '../datatypes/ProblemType';

/* {
        name: "Problem 1",
        classes: [["class1", color, coordinates], "class2"]
    },
    {
        name: "Problem 2",
        classes: ["class3", "class4"]
} */

export type DetailPaneProps = {
    isShow: boolean;
    currentFile: string | null;
    currProblems: ProblemType[];
    updateProblems: (updateProblems: ProblemType[]) => void;
};

export default function DetailPane({ isShow, currentFile, currProblems, updateProblems }: DetailPaneProps) {
    const [userInput, setUserInput] = useState<string>("");
    const [isAddNewProblem, setIsAddNewProblem] = useState(false);

    // useEffect(() => {
    //     if (selectedFile) {
    //         updateStlFile(problems);
    //     }
    // }, [problems, selectedFile]);

    const onAddProblemInputChange = (e: KeyboardEvent<HTMLDivElement>): void => {
        if (!_.isEmpty(_.trim(userInput)) && (e.key === "Enter")) {
            const updatedProblems: ProblemType[] = [...currProblems, { name: userInput, classes: [] }];
            updateProblems(updatedProblems);
            setUserInput("");
            setIsAddNewProblem(false);
        }
    };

    const updateProblem = (userInput: string, index: number): void => {
        const updatedProblems: ProblemType[] = currProblems.map((p: ProblemType, i: number) =>
            i === index ? { ...p, name: userInput } : p
        );
        updateProblems(updatedProblems);
    };

    const deleteProblem = (index: number): void => {
        const updatedProblems: ProblemType[] = currProblems.filter((_, i: number) => i !== index);
        updateProblems(updatedProblems);

        //to-do: add validation (true if have class)
    };

    const updateLabel = (labels: string[][], index: number): void => {
        const updatedProblems: ProblemType[] = currProblems.map((p: ProblemType, i: number) =>
            i === index ? { ...p, classes: labels } : p
        );
        updateProblems(updatedProblems);
    };

    return (
        <div>
            {isShow && (
                <div id="right-pane">
                    <Toolbar id="detail-pane-header">
                        <Typography>Annotated Items</Typography>
                        <span className='upsert-button'>
                            <IconButton
                                aria-label="add-new-problem"
                                onClick={() => { if (currentFile) setIsAddNewProblem(true); }}
                            >
                                <AddIcon />
                            </IconButton>
                        </span>
                    </Toolbar>
                    <List sx={{ width: '100%' }} id="detail-list">
                        {currProblems.map((p: ProblemType, i: number) => (
                            <ListItem key={i} className="problem-arr">
                                <Problem
                                    problemName={p.name}
                                    labelArr={p.classes}
                                    problemKey={i}
                                    updateProblem={updateProblem}
                                    deleteProblem={deleteProblem}
                                    updateLabel={updateLabel}
                                />
                            </ListItem>
                        ))}
                        {isAddNewProblem && (
                            <ListItem id="add-problem-input">
                                <TextField
                                    id="add-problem"
                                    label="New Problem"
                                    variant="standard"
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    onKeyDown={onAddProblemInputChange}
                                />
                            </ListItem>
                        )}
                    </List>
                </div>
            )}
        </div>
    );
}
