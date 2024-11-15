import { Add as AddIcon } from '@mui/icons-material';
import { IconButton, List, ListItem, TextField, Toolbar, Typography } from '@mui/material';
import * as _ from "lodash";
import { KeyboardEvent, useState } from 'react';
import { ClassDetail } from '../datatypes/ClassDetail';
import { ModelIDFileNameMap } from '../datatypes/ModelIDFileNameMap';
import { ProblemType } from '../datatypes/ProblemType';
import Problem from './Problem';

export type DetailPaneProps = {
    /**
     * Whether the detail pane is showing on the UI
     */
    isShow: boolean;
    /**
     * The name of the current file displaying on UI
     */
    currentFile: string | null;
    /**
     * The data labels of the current file
     */
    currProblems: ProblemType[];
    /**
     * Update the new problem array into the centralized file array
     * @param updateProblems the updated problem array
     */
    updateProblems: (updateProblems: ProblemType[]) => void;
    /**
     * Show an error alert on UI
     * @param _title the title of the alert
     * @param _content the content of the alert
     */
    showErrorAlert: (_title: string, _content: string) => void;
    /**
     * Check if there are any classes that are currently allowed for annotating
     * @returns whether there are classes having the flag isAnnotating set to true
     */
    checkIfNowCanAnnotate: () => boolean;
    /**
     * The mapping of the modelID in model-color-state and file names
     */
    modelIDFileNameMapping: ModelIDFileNameMap[];
};

export default function DetailPane({ isShow, currentFile, currProblems, updateProblems, showErrorAlert, checkIfNowCanAnnotate, modelIDFileNameMapping }: DetailPaneProps) {
    const [userInput, setUserInput] = useState<string>("");
    const [isAddNewProblem, setIsAddNewProblem] = useState(false);

   /**
    * Triggered when users add a new problem
    * @param e KeyboardEvent listener
    */
    const onAddProblemInputChange = (e: KeyboardEvent<HTMLDivElement>): void => {
        //when the text field is not empty and users press the Enter key
        if (!_.isEmpty(_.trim(userInput)) && (e.key === "Enter")) {
            //push new problem to current problem array
            const updatedProblems: ProblemType[] = [...currProblems, { name: userInput, classes: [] }];
            updateProblems(updatedProblems);
            //reset text field to null
            setUserInput("");
            setIsAddNewProblem(false);
        }

        //when users press the Esc key
        if (e.key === "Escape") {
            //reset text field
            setUserInput("");
            setIsAddNewProblem(false);
        }
    };

    /**
     * Triggered when users edit the problem name. 
     * 
     * @param userInput user input for the problem name
     * @param index index of the problem in the problem array
     */
    const updateProblem = (userInput: string, index: number): void => {
        const updatedProblems: ProblemType[] = currProblems.map((p: ProblemType, i: number) =>
            i === index ? { ...p, name: userInput } : p
        );

        //update the problem array back to the file array
        updateProblems(updatedProblems);
    };

    /**
     * Triggered when users delete a problem
     * 
     * @param index index of the problem in the problem array
     * @error when the corresponding problem has class linked
     */
    const deleteProblem = (index: number): void => {
        //when the problem does not have class linked 
        if (_.isEmpty(currProblems.at(index).classes) || currProblems.at(index).classes.length == 0) {
            //pop the corresponding problem out of the array
            const updatedProblems: ProblemType[] = currProblems.filter((_, i: number) => i !== index);
            //update the new problem array back to the file array
            updateProblems(updatedProblems);
        } else {
            showErrorAlert("Error", "Problem can only be deleted if it has no related classes.");
        }
    };

    /**
     * Update the new class array into the problem array
     * 
     * @param classes new class array
     * @param index index of the corresponding problem
     */
    const updateLabel = (classes: ClassDetail[], index: number): void => {
        var _problems: ProblemType[] = currProblems;

        _problems[index].classes = classes;
        //update the new problem into the file array
        updateProblems(_problems);
    };

    /**
     * Triggered when users click the add button for adding new array
     * 
     * @error when there is no files imported
     */
    const addProblemBtnOnClick = () => {
        //when there is at least a file imported 
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
                                    checkIfNowCanAnnotate={checkIfNowCanAnnotate}
                                    showErrorAlert={showErrorAlert}
                                    modelIDFileNameMapping={modelIDFileNameMapping}
                                    currentFile={currentFile}
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
