export type ClassType = {
    className : string,
    annotaion : {[vertext:number]:{color:string}},
    annotationType : string
}

export type ProblemType = {
    name: string;
    classes: ClassType[];
}