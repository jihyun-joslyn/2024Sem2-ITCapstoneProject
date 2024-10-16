export type ClassType = {
    className : string,
    annotation : {[vertext:number]:{color:string}},
    annotationType : string
}

export type ProblemsType = {
    modelId : string,
    name: string;
    classes: ClassType[];
}