import React, { ReactNode, createContext, useContext, useRef, useState } from 'react';

interface ModelType {
    tool : string;
    color : string;
    hotkeys: Hotkeys;
    setTool : (tool : string) => void;
    setSpray : (color : string) => void;
    setHotkeys: React.Dispatch<React.SetStateAction<Hotkeys>>;
    controlsRef: React.RefObject<any>;
    setSize: (size: number) => void;
    size: number;
}

export type Hotkeys = {
    zoomIn: string;
    zoomOut: string;
    rotateLeft: string;
    rotateRight: string;
    rotateUp: string;
    rotateDown: string;
    prevStep: string;
    nextStep: string;
    brush: string;
    spray: string;
};

interface ModelProvider {
    children:ReactNode;
}

const ModelContext = createContext<ModelType | undefined>(undefined);

export const ModelProvider: React.FunctionComponent<ModelProvider> = ({ children }) => {
    const [tool,setTool] = useState<string>('none');
    const [color, setSpray] = useState<string>('#ffffff');
    const [hotkeys, setHotkeys] = useState<Hotkeys>({
        zoomIn: 'O',
        zoomOut: 'P',
        rotateLeft: 'Q',
        rotateRight: 'E',
        rotateUp: 'R',
        rotateDown: 'F',
        prevStep: '[',
        nextStep: ']',
        brush: '1',
        spray: '2'
    });
    const [size, setSize] = useState<number>(1);
    const controlsRef = useRef<any>(null);

    return (
        <ModelContext.Provider value ={{ tool, color, setTool, setSpray, hotkeys, setHotkeys, controlsRef, setSize, size}}>
            {children}
        </ModelContext.Provider>
    );
};

export function useModelContext() {
    const context = useContext(ModelContext);
    if (context == undefined){
        throw new Error ('error');
    }
    return context;
}

export default ModelContext;