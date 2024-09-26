import { Toolbar, Typography, List, ListItem, TextField, IconButton } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useState, useEffect, KeyboardEvent } from 'react';
import * as _ from "lodash";
import Problem from './Problem';

export type ProblemType = {
    name: string;
    classes: string[][];
};

export type DetailPaneProps = {
    isShow: boolean;
    selectedFile: string | null;
    stlFiles: { fileName: string; fileObject?: File; problem: string; class: string }[];
    setStlFiles: React.Dispatch<React.SetStateAction<{ fileName: string; fileObject?: File; problem: string; class: string }[]>>;
    onFileSelect: (fileName: string) => void;
    problems: ProblemType[];
    setProblems: React.Dispatch<React.SetStateAction<ProblemType[]>>;
};

export default function DetailPane({ isShow, selectedFile, stlFiles, setStlFiles, problems, setProblems }: DetailPaneProps) {
    const [userInput, setUserInput] = useState<string>("");
    const [isAddNewProblem, setIsAddNewProblem] = useState(false);

    useEffect(() => {
        if (selectedFile) {
            const selectedFileData = stlFiles.find(file => file.fileName === selectedFile);
            if (selectedFileData) {
                const loadedProblems = selectedFileData.problem
                    .split(';')
                    .map(problemStr => {
                        const [name, ...classes] = problemStr.split(',');
                        return { name, classes: classes.map(c => [c]) };
                    });

                if (!_.isEqual(loadedProblems, problems)) {
                    setProblems(loadedProblems);
                }
            }
        }
    }, [selectedFile, stlFiles, problems, setProblems]);

    useEffect(() => {
        if (selectedFile) {
            updateStlFile(problems);
        }
    }, [problems, selectedFile]);

    const onAddProblemInputChange = (e: KeyboardEvent<HTMLDivElement>): void => {
        if (!_.isEmpty(_.trim(userInput)) && (e.key === "Enter")) {
            const updatedProblems: ProblemType[] = [...problems, { name: userInput, classes: [] }];
            setProblems(updatedProblems);
            setUserInput("");
            setIsAddNewProblem(false);
        }
    };

    const updateProblem = (userInput: string, index: number): void => {
        const updatedProblems: ProblemType[] = problems.map((p: ProblemType, i: number) =>
            i === index ? { ...p, name: userInput } : p
        );
        setProblems(updatedProblems);
    };

    const deleteProblem = (index: number): void => {
        const updatedProblems: ProblemType[] = problems.filter((_, i: number) => i !== index);
        setProblems(updatedProblems);
    };

    const updateLabel = (labels: string[][], index: number): void => {
        const updatedProblems: ProblemType[] = problems.map((p: ProblemType, i: number) =>
            i === index ? { ...p, classes: labels } : p
        );
        setProblems(updatedProblems);
    };

    const updateStlFile = (updatedProblems: ProblemType[]): void => {
        const updatedFiles = stlFiles.map((file) => {
            if (file.fileName === selectedFile) {
                return {
                    ...file,
                    problem: updatedProblems.map(p => `${p.name},${p.classes.flat().join(',')}`).join(';'),
                };
            }
            return file;
        });
        setStlFiles(updatedFiles);
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
                                onClick={() => setIsAddNewProblem(true)}
                            >
                                <AddIcon />
                            </IconButton>
                        </span>
                    </Toolbar>
                    <List sx={{ width: '100%' }} id="detail-list">
                        {problems.map((p: ProblemType, i: number) => (
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
