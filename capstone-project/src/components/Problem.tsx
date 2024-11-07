import { Accordion, AccordionDetails, AccordionSummary, List, ListItem, ListItemButton, TextField } from '@mui/material';
import { UnfoldMore as UnfoldMoreIcon } from '@mui/icons-material';
import { useState, KeyboardEvent, useEffect, useContext } from 'react';
import * as _ from "lodash";
import { AnnotationType, ClassDetail } from '../datatypes/ClassDetail';
import { ModelIDFileNameMap } from '../datatypes/ModelIDFileNameMap';
import '../style/index.css';
import Class from './Class';
import UpsertMenu from './UpsertMenu';
import useModelStore from '../components/StateStore';
import ModelContext from './ModelContext';
import { FaceLabel } from '../datatypes/PathAnnotation';

export type ProblemProps = {
    problemName: string;
    classes: ClassDetail[];
    problemKey: number;
    updateProblem: (userInput: string, index: number) => void;
    deleteProblem: (index: number) => void;
    updateLabel: (labels: ClassDetail[], arrIndex: number) => void;
    checkIfNowCanAnnotate: () => boolean;
    showErrorAlert: (_title: string, _content: string) => any;
    modelIDFileNameMapping: ModelIDFileNameMap[];
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

    useEffect(() => {
        setProblem(problemName);
        setProblemInput(problemName);
        setLabels(classes);
    }, [problemName, classes, labels]);

    const editProblem = (e: KeyboardEvent<HTMLDivElement>): void => {
        if (!_.isEmpty(_.trim(problemInput)) && (e.key === "Enter")) {
            setProblem(problemInput);
            handleEditEnd();
            updateProblem(problemInput, problemKey);
        }

        if (e.key === "Escape") {
            setProblem(problemName);
            handleEditEnd();
        }
    };

    const onAddClassInputChange = (e: KeyboardEvent<HTMLDivElement>): void => {
        if (!_.isEmpty(_.trim(inputNewClass)) && (e.key === "Enter")) {
            var _labels: ClassDetail[] = labels;
            var newClass: ClassDetail = { name: inputNewClass, annotationType: AnnotationType.NONE, coordinates: [], color: "", isAnnotating: false };

            if (!checkIfNowCanAnnotate())
                newClass.isAnnotating = true;

            _labels.push(newClass);

            setLabels(_labels);
            setInputNewClass("");
            setIsAddNewClass(false);
            updateLabel(_labels, problemKey);
        }

        if (e.key === "Escape") {
            setInputNewClass("");
            setIsAddNewClass(false);
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

        var deletedClass: ClassDetail = _labels.at(arrIndex);

        if (deletedClass.isAnnotating) {
            showErrorAlert("Error", "Please de-select the class before deleting the class");
            return;
        }

        _.remove(_labels, function (c, i) {
            return i == arrIndex;
        });

        var currModelID: string = _.find(modelIDFileNameMapping, function (m) {
            return _.eq(m.fileName, currentFile);
        }).modelID;

        switch (deletedClass.annotationType) {
            case AnnotationType.KEYPOINT:
                var _keypoint: any[] = keypoints[currModelID];
                var _point: { x: Number, y: Number, z: Number } = { x: (Number)(deletedClass.coordinates[0]), y: (Number)(deletedClass.coordinates[1]), z: (Number)(deletedClass.coordinates[2]) };

                if (!_.isEmpty(_keypoint)) {
                    _.remove(_keypoint, function (k) {
                        return k["position"]["x"] == _point.x && k["position"]["y"] == _point.y && k["position"]["z"] == _point.z;
                    });
                }

                setModelKeypoint(currModelID, _keypoint);

                break;
            case AnnotationType.SPRAY:
                var _spray: any = states[currModelID];
                var _vertex: Number[] = deletedClass.coordinates;

                if (!_.isEmpty(_state)) {
                    Object.keys(_spray).forEach(v => {
                        if (_.includes(_vertex, (Number)(v)))
                            delete _spray[v];
                    });
                }

                setModelSpray(currModelID, _spray);
                break;
            case AnnotationType.PATH:
                var _state: any = states[currModelID];
                var _faces: FaceLabel[] = deletedClass.coordinates[0].faces;

                if (!_.isEmpty(_state)) {
                    Object.keys(_state).forEach(v => {
                        if (_.findIndex(_faces, function (f) {
                            return f.vertex == (Number)(v);
                        }) != -1)
                            delete _state[v];
                    });
                }

                setModelSpray(currModelID, _state);
                break;
            case AnnotationType.NONE:
                break;
        }

        setLabels(_labels);
        updateLabel(_labels, problemKey);
    };

    const setClassToBeAnnotated = (classIndex: number): void => {
        var _labels: ClassDetail[] = labels;

        if (_labels[classIndex].isAnnotating) {
            _labels[classIndex].isAnnotating = false;
            setTool('none');
            setCurrentTool('none');
        }
        else {
            if (checkIfNowCanAnnotate())
                showErrorAlert("Error", "Only one class can be annotated at a time.");
            else
                _labels[classIndex].isAnnotating = true;
        }

        setLabels(_labels);
        updateLabel(_labels, problemKey);
    }

    const handleEditStart = () => {
        setHotkeysEnabled(false);
        setIsEditProblem(true);
    };

    const handleEditEnd = () => {
        setHotkeysEnabled(true);
        setIsEditProblem(false);
    };

    const handleAddClassStart = () => {
        setHotkeysEnabled(false);
        setIsAddNewClass(true);
    };


    const handleAddClassEnd = () => {
        setHotkeysEnabled(true);
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
