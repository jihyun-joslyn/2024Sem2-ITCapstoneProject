import { Button, TextField } from '@mui/material';
import * as _ from "lodash";
import { KeyboardEvent, useContext, useEffect, useState } from 'react';
import { ClassDetail } from '../datatypes/ClassDetail';
import ModelContext from './ModelContext';
import UpsertMenu from './UpsertMenu';

export type ClassProps = {
    /**
     * The details of the class, including class name, linked annotation type and coordinates of the linked annotation
     */
    classDetails: ClassDetail,
    /**
     * The index of the class in the corresponding problem array
     */
    labelIndex: number,
    /**
     * Update the new class details into the corresponding problem array
     * @param labels the update class details
     * @param arrIndex the array index of the class in the problem array
     */
    updateLabel: (labels: ClassDetail, arrIndex: number) => void;
    /**
     * Delete the class in the problem array
     * @param arrIndex the index of the class to be deleted in the problem array
     */
    deleteClass: (arrIndex: number) => void;
    /**
     * Set the class to current annotating class or the opposite
     * @param classIndex the index of the class in problem array
     */
    setClassToBeAnnotated: (classIndex: number) => void;
};

export default function Class({ classDetails, labelIndex, updateLabel, deleteClass, setClassToBeAnnotated }: ClassProps) {
    const [details, setDetails] = useState(classDetails);
    const [className, setClassName] = useState(classDetails.name);
    const [isEditClass, setIsEditClass] = useState(false);
    const { setHotkeysEnabled } = useContext(ModelContext);

    //update component when classDetail changes
    useEffect(() => {
        setDetails(classDetails);
        setClassName(classDetails.name);
    }, [classDetails]);

    /**
     * Triggered when users start to edit class name 
     */
    const handleEditStart = () => {
        setHotkeysEnabled(false);
        setIsEditClass(true);
    };

    /**
     * Triggered when users finish editing the class
    */
    const handleEditEnd = () => {
        setHotkeysEnabled(true);
        setIsEditClass(false);
    };

    /**
     * Triggered when users finish editing class and press the enter key
     * 
     * @param e KeyboardEvent
      */
    const editClass = (e: KeyboardEvent<HTMLDivElement>): void => {
        //when the text field is not empty and users press the Enter key
        if (!_.isEmpty(_.trim(className)) && e.key === "Enter") {
            var _details: ClassDetail = details;

            //update user input to class name
            _details.name = className;

            setDetails(_details);
            setIsEditClass(false);

            //update the class in the problem array
            updateLabel(_details, labelIndex);
        }

        //when users press the Esc key
        if (e.key === "Escape") {
            setClassName(classDetails.name);
            handleEditEnd();
        }
    };

    return (
        <div className='class-list-item'>
            <div style={{ paddingLeft: '0px' }} >
                {isEditClass ? (
                    <TextField
                        id="edit-class"
                        label="Edit Class"
                        variant="standard"
                        value={className}
                        onChange={e => setClassName(e.target.value)}
                        onKeyDown={e => editClass(e)}
                        onFocus={handleEditStart}
                        onBlur={handleEditEnd}
                    />
                ) : (
                    <span>
                        <Button variant="text" onClick={e => { setClassToBeAnnotated(labelIndex); }}>{className}</Button>
                        <span className='upsert-button'>
                            <UpsertMenu
                                onClickEdit={() => setIsEditClass(true)}
                                onClickDelete={() => deleteClass(labelIndex)}
                                onClickAdd={() => { }}
                                isNeedAdd={false}
                            />
                        </span>
                    </span>
                )}
            </div>
        </div>
    );
}
