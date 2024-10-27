import React, { createContext, useState, useContext,ReactNode } from 'react';

import * as THREE from 'three';



interface ModelType {

    tool : string;

    color : string;

    setTool : (tool : string) => void;

    setSpray : (color : string) => void;

    pathPoints : THREE.Vector3[];

    setPathPoints : React.Dispatch<React.SetStateAction<THREE.Vector3[]>>;

}



interface ModelProvider {

    children:ReactNode;

}



const ModelContext = createContext<ModelType | undefined>(undefined);



export const ModelProvider: React.FunctionComponent<ModelProvider> = ({ children }) => {

    const [tool,setTool] = useState<string>('none');

    const [color, setSpray] = useState<string>('#ffffff');

    const [pathPoints, setPathPoints] = useState<THREE.Vector3[]>([]);



    return (

        <ModelContext.Provider value ={{ tool, color, setTool, setSpray, pathPoints, setPathPoints }}>

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



