import { UnfoldMore as UnfoldMoreIcon } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary, List, ListItem, ListItemButton, TextField } from '@mui/material';
import * as _ from "lodash";
import { KeyboardEvent, useContext, useEffect, useState } from 'react';
import useModelStore from '../components/StateStore';
import { AnnotationType, ClassDetail } from '../datatypes/ClassDetail';
import { ModelIDFileNameMap } from '../datatypes/ModelIDFileNameMap';
import { FaceLabel } from '../datatypes/PathAnnotation';
import '../style/index.css';
import Class from './Class';
import ModelContext from './ModelContext';
import UpsertMenu from './UpsertMenu';

export type ProblemProps = {
    /**
     * The name of the problem
     */
    problemName: string;
    /**
     * The class array of the problem
     */
    classes: ClassDetail[];
    /**
     * The array index of the problem in the problem array
     */
    problemKey: number;
    /**
     * Triggered when users edit the problem name. The function updates the new problem name back into the problem array.
     * 
     * @param userInput user input for the problem name
     * @param index index of the problem in the problem array
     */
    updateProblem: (userInput: string, index: number) => void;
    /**
     * Triggered when users delete a problem
     * 
     * @param index index of the problem in the problem array
     * @error when the corresponding problem has class linked
     */
    deleteProblem: (index: number) => void;
    /**
     * Update the new class array into the problem array
     * 
     * @param classes new class array
     * @param index index of the corresponding problem
     */
    updateLabel: (labels: ClassDetail[], arrIndex: number) => void;
    /**
     * Check if there are any classes that are currently allowed for annotating
     * @returns whether there are classes having the flag isAnnotating set to true
     */
    checkIfNowCanAnnotate: () => boolean;
    /**
     * Show an error alert on UI
     * @param _title the title of the alert
     * @param _content the content of the alert
     */
    showErrorAlert: (_title: string, _content: string) => void;
    /**
     * The mapping of the modelID in model-color-state and file names
     */
    modelIDFileNameMapping: ModelIDFileNameMap[];
    /**
     * The name of the current file displaying on UI
     */
    currentFile: string | null;
};

export default function Problem({ problemName, classes, problemKey, updateProblem, deleteProblem, updateLabel, checkIfNowCanAnnotate, showErrorAlert, modelIDFileNameMapping, currentFile }: ProblemProps) {
    const [problem, setProblem] = useState(problemName);
    const [isEditProblem, setIsEditProblem] = useState(false);
    const [problemInput, setProblemInput] = useState(problemName);
    const [isAddNewClass, setIsAddNewClass] = useState(false);
    const [inputNewClass, setInputNewClass] = useState("");
    const [labels, setLabels] = useState(classes);
    const { states, keypoints, setModelKeypoint, setModelSpray } = useModelStore();
    const { setTool, setCurrentTool, setHotkeysEnabled } = useContext(ModelContext);

    //triggered when the values of problemName, classes or labels changes
    useEffect(() => {
        setProblem(problemName);
        setProblemInput(problemName);
        setLabels(classes);
    }, [problemName, classes, labels]);

    /**
     * Trigger when users editing the problem. This function updates the problem name.
     * @param e Keyboard event
     */
    const editProblem = (e: KeyboardEvent<HTMLDivElement>): void => {
        //if the text field is not empty and users press the Enter key
        if (!_.isEmpty(_.trim(problemInput)) && (e.key === "Enter")) {
            setProblem(problemInput);
            //close the text field and set hotkeys become enabled again
            handleEditEnd();
            //update the new problem name back into the problem array
            updateProblem(problemInput, problemKey);
        }

        //if users press the Escape key
        if (e.key === "Escape") {
            setProblem(problemName);
            //reset the text field
            setProblemInput(problemName);
            //close the text field and set hotkeys become enabled again
            handleEditEnd();
        }
    };

    /**
     * Triggered when users add a new class. This function adds a new class into the class array
     * @param e KeyboardEvent
     */
    const onAddClassInputChange = (e: KeyboardEvent<HTMLDivElement>): void => {
        //if the text field is not empty and users press the Enter key
        if (!_.isEmpty(_.trim(inputNewClass)) && (e.key === "Enter")) {
            var _labels: ClassDetail[] = labels;
            //create a new empty class using the new class name
            var newClass: ClassDetail = { name: inputNewClass, annotationType: AnnotationType.NONE, coordinates: [], color: "", isAnnotating: false };

            //if there is no class selected currently
            if (!checkIfNowCanAnnotate()) {
                //set the new class as isAnnotating (i.e. selected class)
                newClass.isAnnotating = true;
            }

            //push the new class into the array
            _labels.push(newClass);

            setLabels(_labels);
            //reset the text field and set hotkeys as enabled
            handleAddClassEnd();
            //update the new class array to the problem array
            updateLabel(_labels, problemKey);
        }

        //if users press the Esc key
        if (e.key === "Escape") {
            //reset the text field and set hotkeys as enabled
            handleAddClassEnd();
        }
    };

    /**
     * Update the new class details into the corresponding problem array
     * @param _class the update class details
     * @param arrIndex the array index of the class in the problem array
     */
    const updateClassArr = (_class: ClassDetail, arrIndex: number): void => {
        var _labels: ClassDetail[] = labels;

        //set the element to the new class details
        _labels[arrIndex] = _class;

        setLabels(_labels);
        //update the new class array to the problem array
        updateLabel(_labels, problemKey);
    };

    /**
     * Delete the class in the problem array
     * @param arrIndex the index of the class to be deleted in the problem array
     * @error when the class is being selected
     */
    const deleteClass = (arrIndex: number): void => {
        var _labels: ClassDetail[] = labels;

        //get the class element
        var deletedClass: ClassDetail = _labels.at(arrIndex);

        //if the class is selected
        if (deletedClass.isAnnotating) {
            showErrorAlert("Error", "Please de-select the class before deleting the class");
            return;
        }

        //pop the class to delete from the array
        _.remove(_labels, function (c, i) {
            return i == arrIndex;
        });

        //get the modelId of the current file
        var currModelID: string = _.find(modelIDFileNameMapping, function (m) {
            return _.eq(m.fileName, currentFile);
        }).modelID;

        //delete associated annotations stored in model-color-state
        switch (deletedClass.annotationType) {
            case AnnotationType.KEYPOINT:
                //get the stored keypoints of the current file
                var _keypoint: any[] = keypoints[currModelID];
                //get the (x, y, z) coordinates of the deleted class
                var _point: { x: Number, y: Number, z: Number } = { x: (Number)(deletedClass.coordinates[0]), y: (Number)(deletedClass.coordinates[1]), z: (Number)(deletedClass.coordinates[2]) };

                //if _keypoint is not empty
                if (!_.isEmpty(_keypoint)) {
                    //pop the point from the array 
                    _.remove(_keypoint, function (k) {
                        return k["position"]["x"] == _point.x && k["position"]["y"] == _point.y && k["position"]["z"] == _point.z;
                    });
                }

                //update the list in model-color-state
                setModelKeypoint(currModelID, _keypoint);
                break;
            case AnnotationType.SPRAY:
                //get the stored spray of the current file
                var _spray: any = states[currModelID];
                var _vertex: Number[] = deletedClass.coordinates;

                //if _spray is not empty
                if (!_.isEmpty(_state)) {
                    Object.keys(_spray).forEach(v => {
                        //delete the index from the array if found in the array
                        if (_.includes(_vertex, (Number)(v)))
                            delete _spray[v];
                    });
                }

                //update the list in model-color-state
                setModelSpray(currModelID, _spray);
                break;
            case AnnotationType.PATH:
                //get the stored colored faces of the current file
                var _state: any = states[currModelID];
                var _faces: FaceLabel[] = deletedClass.coordinates[0].faces;

                //if _state is not empty
                if (!_.isEmpty(_state)) {
                    Object.keys(_state).forEach(v => {
                        //delete the index from the array if found
                        if (_.findIndex(_faces, function (f) {
                            return f.vertex == (Number)(v);
                        }) != -1)
                            delete _state[v];
                    });
                }

                //update the list in model-color-state
                setModelSpray(currModelID, _state);
                break;
            case AnnotationType.NONE:
            default:
                break;
        }

        setLabels(_labels);
        //update the new class array into the problem array
        updateLabel(_labels, problemKey);
    };

    /**
     * Set the class to current annotating class or the opposite
     * @param classIndex the index of the class in problem array
     * @error if there is other class being selected currently
     */
    const setClassToBeAnnotated = (classIndex: number): void => {
        var _labels: ClassDetail[] = labels;

        //if the class is being selected
        if (_labels[classIndex].isAnnotating) {
            _labels[classIndex].isAnnotating = false;
            setTool('none');
            setCurrentTool('none');
        }
        else {
            //if there is other class being selected currently
            if (checkIfNowCanAnnotate())
                showErrorAlert("Error", "Only one class can be annotated at a time.");
            else
                _labels[classIndex].isAnnotating = true;
        }

        setLabels(_labels);
        //update the new class array into the problem array
        updateLabel(_labels, problemKey);
    }

    /**
     * When users start editting the problem name
     */
    const handleEditStart = () => {
        setHotkeysEnabled(false);
        setIsEditProblem(true);
    };

    /**
     * When users finish editting the problem name
     */
    const handleEditEnd = () => {
        setHotkeysEnabled(true);
        setIsEditProblem(false);
    };

    /**
     * When users start adding a new class
     */
    const handleAddClassStart = () => {
        setHotkeysEnabled(false);
        setIsAddNewClass(true);
    };

    /**
     * When users finish adding a new class 
     */
    const handleAddClassEnd = () => {
        setHotkeysEnabled(true);
        setInputNewClass("");
        setIsAddNewClass(false);
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
                                onClickAdd={() => { handleAddClassStart(); }}
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
                        onFocus={handleEditStart}
                        onBlur={handleEditEnd}
                    />
                )}
            </AccordionSummary>
            <AccordionDetails sx={{ paddingY: '0px', paddingRight: '0px', border: '0px' }}>
                <List>
                    {labels.map((l, j) => (
                        <ListItemButton sx={{ paddingY: '0px', paddingRight: '0px', border: '0px' }} key={j} className={l.isAnnotating ? 'selected-class' : ''}>
                            <Class
                                classDetails={l}
                                labelIndex={j}
                                updateLabel={updateClassArr}
                                deleteClass={deleteClass}
                                setClassToBeAnnotated={setClassToBeAnnotated}
                            />
                        </ListItemButton>
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
        </Accordion >
    );
}
