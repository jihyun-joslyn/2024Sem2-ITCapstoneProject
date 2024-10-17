import { Toolbar, Typography, List, ListItem, TextField, IconButton } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useState, KeyboardEvent } from 'react';
import * as _ from "lodash";
import Problem from './Problem';
import { ProblemType } from '../datatypes/ProblemType';
import { ClassDetail } from '../datatypes/ClassDetail';

export type DetailPaneProps = {
    isShow: boolean;
    currentFile: string | null;
    currProblems: ProblemType[];
    updateProblems: (updateProblems: ProblemType[]) => void;
    showErrorAlert: (_title: string, _content: string) => any
};

export default function DetailPane({ isShow, currentFile, currProblems, updateProblems, showErrorAlert }: DetailPaneProps) {
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
        if (_.isEmpty(currProblems.at(index).classes) || currProblems.at(index).classes.length == 0) {
            const updatedProblems: ProblemType[] = currProblems.filter((_, i: number) => i !== index);
            updateProblems(updatedProblems);
        } else {
            showErrorAlert("Error", "Problem can only be deleted if it has no related classes.");
        }
    };

    const updateLabel = (classes: ClassDetail[], index: number): void => {
        var _problems: ProblemType[] = currProblems;

        _problems[index].classes = classes;
        updateProblems(_problems);
    };

    const addProblemBtnOnClick = () => {
        if (currentFile)
            setIsAddNewProblem(true);
        else
            showErrorAlert("Error", "Problems can only be added after STL files are imported");
    }

    const setClassToBeAnnotated = (problemIndex: number, classIndex: number): void => {
        var _problems: ProblemType[] = currProblems;

        if (_problems[problemIndex].classes[classIndex].isAnnotating)
            _problems[problemIndex].classes[classIndex].isAnnotating = false;
        else {
            var isHasOtherAnnotating: boolean = false;

            isHasOtherAnnotating = _.findIndex(_problems, function (p) {
                return _.findIndex(p.classes, function (c) {
                    return c.isAnnotating == true;
                }) != -1;
            }) != -1 ? true : false;

            if (isHasOtherAnnotating)
                showErrorAlert("Error", "Only one class can be annotated at a time.");
            else
                _problems[problemIndex].classes[classIndex].isAnnotating = true;
        }

        console.log(_problems);

        updateProblems(_problems);
    }

    return (
        <div>
            {isShow && (
                <div id="right-pane">
                    <Toolbar id="detail-pane-header">
                        <Typography>Annotated Items</Typography>
                        <span className='upsert-button'>
                            <IconButton
                                aria-label="add-new-problem"
                                onClick={addProblemBtnOnClick}
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
                                    classes={p.classes}
                                    problemKey={i}
                                    updateProblem={updateProblem}
                                    deleteProblem={deleteProblem}
                                    updateLabel={updateLabel}
                                    setClassToBeAnnotated={setClassToBeAnnotated}
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
