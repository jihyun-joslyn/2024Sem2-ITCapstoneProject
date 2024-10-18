import React, { createContext, useState, useContext,ReactNode } from 'react';

interface ModelType {
    tool : string;
    color : string;
    sphereSize: number; // Add sphereSize to the context

    setTool : (tool : string) => void;
    setSpray : (color : string) => void;
    setSphereSize: (size: number) => void; // Add setSphereSize function
}

interface ModelProvider {
    children:ReactNode;
}

const ModelContext = createContext<ModelType | undefined>(undefined);

export const ModelProvider: React.FunctionComponent<ModelProvider> = ({ children }) => {
    const [tool,setTool] = useState<string>('none');
    const [color, setSpray] = useState<string>('#ffffff');
    const [sphereSize, setSphereSize] = useState<number>(0.05); // Default size

    return (
        <ModelContext.Provider value ={{ tool, color, sphereSize, setTool, setSpray,setSphereSize }}>
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