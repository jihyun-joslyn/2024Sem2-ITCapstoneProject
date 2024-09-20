import { Accordion, AccordionDetails, AccordionSummary, TextField, } from '@mui/material';
import { UnfoldMore as UnfoldMoreIcon } from '@mui/icons-material';
import { useState, KeyboardEvent, useEffect } from 'react';
import * as _ from "lodash";
import UpsertMenu from './UpsertMenu';


export type Class = {
    labelArr: string[],
    labelIndex: number,
    updateLabel: (labels: string[], arrIndex: number) => void;
    deleteClass: (arrIndex: number) => void;
};

export default function Class({ labelArr, labelIndex, updateLabel, deleteClass }: Class) {
    const [labels, setLabels] = useState(labelArr);
    const [className, setClassName] = useState(labelArr[0]);
    const [isEditClass, setIsEditClass] = useState(false);

    useEffect(() => {
        setLabels(labelArr);
        setClassName(labelArr[0]);
    })

    const editClass = (e: KeyboardEvent<HTMLDivElement>): void => {
        var _labels: string[] = labels;
        if (!_.isEmpty(_.trim(className)) && (e.key === "Enter")) {
            _labels[0] = className;

            setLabels(_labels);
            setIsEditClass(false);

            updateLabel(labels, labelIndex);
        }
    }


    return (
        <div className='class-list-item'>
            {labels.map((_l, i) => {
                if (i == 0) {
                    return (
                        <p
                            style={{ border: '0px', paddingLeft: '0px' }}
                            key={i}
                        >
                            {isEditClass && (
                                <TextField
                                    id="edit-class"
                                    label="Edit Class"
                                    variant="standard"
                                    value={className}
                                    onChange={e => { setClassName(e.target.value); }}
                                    onKeyDown={e => { editClass(e) }}
                                />
                            )}
                            {!isEditClass && (
                                <span>
                                    {_l}
                                    <span className='upsert-button'>
                                        <UpsertMenu
                                            onClickEdit={() => { setIsEditClass(true); }}
                                            onClickDelete={() => { deleteClass(labelIndex); }}
                                            onClickAdd={() => { }}
                                            isNeedAdd={false}
                                        />
                                    </span>
                                </span>
                            )}
                        </p>
                    )
                }

            })}
        </div>
    );
}