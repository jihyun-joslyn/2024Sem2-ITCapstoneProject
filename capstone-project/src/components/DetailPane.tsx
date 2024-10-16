import { Toolbar, Typography, List, ListItem, TextField, IconButton, Alert, Snackbar, AlertTitle } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useState, KeyboardEvent } from 'react';
import * as _ from "lodash";
import Problem from './Problem';
import { ProblemType } from '../datatypes/ProblemType';
import { ClassDetail } from '../datatypes/ClassDetail';

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
    const [isShowErrorDialog, setIsShowErrorAlert] = useState(false);
    const [alertContent, setAlertContent] = useState<{ title: string, content: string }>({ title: "", content: "" });

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

    const handleCloseErrorDialog = () => {
        setIsShowErrorAlert(false);
    }

    const showErrorAlert = (_title: string, _content: string): any => {
        var _alertContent: { title: string, content: string } = alertContent;

        _alertContent.title = _title;
        _alertContent.content = _content;

        setAlertContent(_alertContent);
        setIsShowErrorAlert(true);
    }

    const addProblemBtnOnClick = () => {
        if (currentFile)
            setIsAddNewProblem(true);
        else
            showErrorAlert("Error", "Problems can only be added after STL files are imported");
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
                    <Snackbar
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                        open={isShowErrorDialog}
                        autoHideDuration={6000}
                        onClose={handleCloseErrorDialog}>
                        <Alert
                            onClose={handleCloseErrorDialog}
                            severity="error"
                            sx={{ width: '100%' }}
                        >
                            <AlertTitle>{alertContent.title}</AlertTitle>
                            {alertContent.content}
                        </Alert>
                    </Snackbar>
                </div>
            )}
        </div>
    );
}
