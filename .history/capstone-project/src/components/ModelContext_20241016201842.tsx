import React, { createContext, useState, useContext,ReactNode } from 'react';

interface ModelType {
    tool : string;
    color : string;
    setTool : (tool : string) => void;
    setSpray : (color : string) => void;
    modelData: ArrayBuffer | null;
    setModelData: (data: ArrayBuffer) => void;
}

interface ModelProvider {
    children:ReactNode;
}

const ModelContext = createContext<ModelType | undefined>(undefined);

export const ModelProvider: React.FunctionComponent<ModelProvider> = ({ children }) => {
    const [tool,setTool] = useState<string>('none');
    const [color, setSpray] = useState<string>('#ffffff');
    const [modelData, setModelData] = useState<ArrayBuffer | null>(null);

    return (
        <ModelContext.Provider value ={{ tool, color, setTool, setSpray,modelData,setModelData }}>
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