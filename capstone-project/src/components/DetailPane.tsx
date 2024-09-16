import { Toolbar, Typography, List, ListItem, TextField, IconButton } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material'
import { useState, KeyboardEvent } from 'react';
import * as _ from "lodash";
import Problem from './Problem';

export type DetailPane = {
    isShow: boolean
};

export default function DetailPane({ isShow }: DetailPane) {

    const [problemArr, setProblemArr] = useState(['Problem 1', 'Problem 2', 'Problem 3']);
    const [labelArr, setLabelArr] = useState([[['Class 1-1', 'Detail 1-1-1', 'Detail 1-1-2'], ['Class 1-2'], ['Class 1-3']], [['Class 2-1'], ['Class 2-2']], []]);
    const [userInput, setUserInput] = useState("");
    const [isAddNewProblem, setIsAddNewProblem] = useState(false);

    const onAddProblemInputChange = (e: KeyboardEvent<HTMLDivElement>): void => {
        var _problemArr: string[] = problemArr;
        var _labelArr: string[][][] = labelArr;

        if (!_.isEmpty(_.trim(userInput)) && (e.key === "Enter")) {
            _problemArr.push(userInput);
            _labelArr.push([]);

            setProblemArr(_problemArr);
            setLabelArr(_labelArr);
            setUserInput("");

            setIsAddNewProblem(false);
        }

    };

    const updateProblem = (userInput: string, arrIndex: number): void => {
        var _problemArr: string[] = problemArr;

        _problemArr[arrIndex] = userInput;
        setProblemArr(_problemArr);

    }

    const deleteProblem = (arrIndex: number) : void => {
        var _problemArr: string[] = problemArr;
        var _labelArr: string[][][] = labelArr;

        _problemArr = _.filter(_problemArr, function(p, i) {
            return i != arrIndex;
        });

        _labelArr = _.filter(_labelArr, function(p, i) {
            return i != arrIndex;
        });

        setProblemArr(_problemArr);
        setLabelArr(_labelArr);
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
                                onClick={() => { setIsAddNewProblem(true); }}
                            >
                                <AddIcon />
                            </IconButton>
                        </span>
                    </Toolbar>
                    <List sx={{ width: '100%' }} id="detail-list">
                        {problemArr.map((p, i) => {
                            var _labelArr = labelArr.at(i);

                            return (
                                <ListItem key={i} className="problem-arr">
                                    <Problem problemName={p} labelArr={_labelArr} problemKey={i} updateProblem={updateProblem} deleteProblem={deleteProblem}/>
                                </ListItem>
                            )
                        }
                        )}
                        {isAddNewProblem && (
                            <ListItem id="add-problem-input">
                                <TextField id="add-problem" label="New Problem" variant="standard" value={userInput} onChange={e => { setUserInput(e.target.value); }} onKeyDown={e => { onAddProblemInputChange(e) }} />
                            </ListItem>
                        )}
                    </List>
                </div>
            )}
        </div>
    );
}


