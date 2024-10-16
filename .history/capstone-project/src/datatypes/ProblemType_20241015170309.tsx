export type ClassType = {
    className : string,
    annotaion : {[modeId : string]:{[vertext:number]:{color:string}}},
    annotationType : string
}

export type ProblemType = {
    name: string;
    classes: ClassType[];
}