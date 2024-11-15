import React, { ReactNode, createContext, useContext, useRef, useState } from 'react';

import * as THREE from 'three';

interface ModelType {
    tool: string;
    color: string;
    hotkeys: Hotkeys;
    setTool: (tool: string) => void;
    setSpray: (color: string) => void;
    setHotkeys: React.Dispatch<React.SetStateAction<Hotkeys>>;
    orbitControlsRef: React.MutableRefObject<any>;
    controlsRef: React.RefObject<any>;
    setSize: (size: number) => void;
    size: number;
    currentTool: string;
    setCurrentTool: (tool: string) => void;
    activateSpray: () => void;
    activateKeypoint: () => void;
    activatePath: () => void;
    pathPoints : THREE.Vector3[];//for shortest path
    setPathPoints : React.Dispatch<React.SetStateAction<THREE.Vector3[]>>;//for shortest path
    hotkeysEnabled: boolean;
    setHotkeysEnabled: (enabled: boolean) => void;
    activateArrow: () => void;
}

/**
 * The functions that the hotkey functionality will trigger
 */
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
    keypoint: string;
    path: string;
    switchClass: string;
};

interface ModelProvider {
    children: ReactNode;
}

const ModelContext = createContext<ModelType | undefined>(undefined);

export const ModelProvider: React.FunctionComponent<ModelProvider> = ({ children }) => {
    const [tool, setTool] = useState<string>('none');
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
        keypoint: '3',
        path: '4',
        switchClass: 'TAB'
    });
    const [size, setSize] = useState<number>(1);
    const controlsRef = useRef<any>(null);
    const orbitControlsRef = useRef<any>(null);
    const [currentTool, setCurrentTool] = useState<string>('none');

    /**
     * Set the current tool to arrow tool
     */
    const activateArrow = () => {
        setCurrentTool('arrow');
        setTool('arrow');

    }

    /**
     * Set the current tool to spray tool
     */
    const activateSpray = () => {
        setCurrentTool('spray');
        setTool('spray');
    };

    
    const activateKeypoint = () => {
        setCurrentTool('keypoint');
        setTool('keypoint');
    };

    const activatePath = () => {
        setCurrentTool('path');
        setTool('path');
    };

    return (
        <ModelContext.Provider value ={{ tool, color, setTool, setSpray, pathPoints, orbitControlsRef,setPathPoints, hotkeys, activateArrow, setHotkeys, controlsRef, setSize, size, currentTool, setCurrentTool, activateSpray, activateKeypoint, activatePath,hotkeysEnabled,setHotkeysEnabled,}}>
            {children}
        </ModelContext.Provider>
    );
};

export function useModelContext() {
    const context = useContext(ModelContext);
    if (context == undefined) {
        throw new Error('Error on Model Context');
    }
    return context;
}

export default ModelContext;