// src/components/ModelContext.tsx

import React, { createContext, useState, useContext, ReactNode } from 'react';
import * as THREE from 'three';

interface ModelType {
    tool: string;
    color: string;
    setTool: (tool: string) => void;
    setSpray: (color: string) => void;
    selectedPoints: THREE.Vector3[];
    setSelectedPoints: React.Dispatch<React.SetStateAction<THREE.Vector3[]>>;
}

interface ModelProviderProps {
    children: ReactNode;
}

const ModelContext = createContext<ModelType | undefined>(undefined);

export const ModelProvider: React.FunctionComponent<ModelProviderProps> = ({ children }) => {
    const [tool, setTool] = useState<string>('none');
    const [color, setSpray] = useState<string>('#ffffff');
    const [selectedPoints, setSelectedPoints] = useState<THREE.Vector3[]>([]);

    return (
        <ModelContext.Provider value={{ tool, color, setTool, setSpray, selectedPoints, setSelectedPoints }}>
            {children}
        </ModelContext.Provider>
    );
};

export function useModelContext() {
    const context = useContext(ModelContext);
    if (context === undefined) {
        throw new Error('ModelContext 未定义');
    }
    return context;
}

export default ModelContext;
