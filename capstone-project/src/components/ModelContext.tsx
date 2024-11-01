import React, { ReactNode, createContext, useContext, useRef, useState } from 'react';

import * as THREE from 'three';

interface ModelType {
    tool : string;
    color : string;
    hotkeys: Hotkeys;
    setTool : (tool : string) => void;
    setSpray : (color : string) => void;
    setHotkeys: React.Dispatch<React.SetStateAction<Hotkeys>>;
    orbitControlsRef: React.MutableRefObject<any>;
    controlsRef: React.RefObject<any>;
    setSize: (size: number) => void;
    size: number;
    currentTool: string;
    setCurrentTool: (tool: string) => void;
    activateBrush: () => void;
    activateSpray: () => void;
    pathPoints : THREE.Vector3[];//for shortest path
    setPathPoints : React.Dispatch<React.SetStateAction<THREE.Vector3[]>>;//for shortest path
    hotkeysEnabled: boolean;
    setHotkeysEnabled: (enabled: boolean) => void;
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
    switchClass: string;
};

interface ModelProvider {
    children:ReactNode;
}

const ModelContext = createContext<ModelType | undefined>(undefined);

export const ModelProvider: React.FunctionComponent<ModelProvider> = ({ children }) => {
    const [tool,setTool] = useState<string>('none');
    const [color, setSpray] = useState<string>('#ffffff');
    const [pathPoints, setPathPoints] = useState<THREE.Vector3[]>([]);//shortest path 
    const [hotkeysEnabled, setHotkeysEnabled] = useState<boolean>(true);
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
        spray: '2',
        switchClass: 'Tab'
    });
    const [size, setSize] = useState<number>(1);
    const controlsRef = useRef<any>(null);
    const orbitControlsRef = useRef<any>(null);
    const [currentTool, setCurrentTool] = useState<string>('none');

    const activateBrush = () => {
        setCurrentTool('brush');
        setTool('brush');
    };

    const activateSpray = () => {
        setCurrentTool('spray');
        setTool('spray');
    };

    return (
        <ModelContext.Provider value ={{ tool, color, setTool, setSpray, pathPoints, orbitControlsRef,setPathPoints, hotkeys, setHotkeys, controlsRef, setSize, size, currentTool, setCurrentTool, activateBrush, activateSpray, hotkeysEnabled,setHotkeysEnabled,}}>
            {children}
        </ModelContext.Provider>
    );
};

export function useModelContext() {
    const context = useContext(ModelContext);
    if (context == undefined){
        throw new Error ('Error on Model Context');
    }
    return context;
}

export default ModelContext;