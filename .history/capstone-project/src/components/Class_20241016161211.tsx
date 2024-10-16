import { TextField } from '@mui/material';
import { useState, KeyboardEvent, useEffect } from 'react';
import * as _ from "lodash";
import UpsertMenu from './UpsertMenu';
import useModelStore from './StateStore';

export type ClassProps = {
    labelArr: string[],
    labelIndex: number,
    updateLabel: (labels: string[], arrIndex: number) => void;
    deleteClass: (arrIndex: number) => void;
};

export default function Class({ labelArr, labelIndex, updateLabel, deleteClass }: ClassProps) {
    const [labels, setLabels] = useState(labelArr);
    const [className, setClassName] = useState(labelArr[0]);
    const [isEditClass, setIsEditClass] = useState(false);
    const {setCurrentClassIndex} = useModelStore();

    useEffect(() => {
        setLabels(labelArr);
        setClassName(labelArr[0]);
        setCurrentClassIndex(labelIndex);
    }, [labelArr,labelIndex]);

    const editClass = (e: KeyboardEvent<HTMLDivElement>): void => {
        const _labels: string[] = [...labels];
        if (!_.isEmpty(_.trim(className)) && e.key === "Enter") {
            _labels[0] = className;

            setLabels(_labels);
            setIsEditClass(false);

            updateLabel(_labels, labelIndex);
        }
    };

    return (
        <div className='class-list-item'>
            {labels.map((_l, i) => {
                if (i === 0) {
                    return (
                        <div key={i} style={{ paddingLeft: '0px' }}>
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
                                    {_l}
                                    <span className='upsert-button'>
                                        <UpsertMenu
                                            onClickEdit={() => setIsEditClass(true)}
                                            onClickDelete={() => deleteClass(labelIndex)}
                                            onClickAdd={() => {}}
                                            isNeedAdd={false}
                                        />
                                    </span>
                                </span>
                            )}
                        </div>
                    );
                }
                return null;
            })}
        </div>
    );
}
