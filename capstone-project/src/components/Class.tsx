import { Button, TextField } from '@mui/material';
import { useState, KeyboardEvent, useEffect } from 'react';
import * as _ from "lodash";
import UpsertMenu from './UpsertMenu';
import { ClassDetail } from '../datatypes/ClassDetail';

export type ClassProps = {
    classDetails: ClassDetail,
    labelIndex: number,
    updateLabel: (labels: ClassDetail, arrIndex: number) => void;
    deleteClass: (arrIndex: number) => void;
    setClassToBeAnnotated: (classIndex: number) => void;
};

export default function Class({ classDetails, labelIndex, updateLabel, deleteClass, setClassToBeAnnotated }: ClassProps) {
    const [details, setDetails] = useState(classDetails);
    const [className, setClassName] = useState(classDetails.name);
    const [isEditClass, setIsEditClass] = useState(false);

    useEffect(() => {
        setDetails(classDetails);
        setClassName(classDetails.name);
    }, [classDetails]);

    const editClass = (e: KeyboardEvent<HTMLDivElement>): void => {
        if (!_.isEmpty(_.trim(className)) && e.key === "Enter") {
            var _details: ClassDetail = details;

            _details.name = className;

            setDetails(_details);
            setIsEditClass(false);

            updateLabel(_details, labelIndex);
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
