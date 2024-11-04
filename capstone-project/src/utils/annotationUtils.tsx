import { ProblemType } from '../datatypes/ProblemType';

export const convertProblemsToRecord = (problems: ProblemType[]): { vertexStates: Record<number, string>, faceStates: Record<number, string> } => {
    const vertexStates: Record<number, string> = {};
    const faceStates: Record<number, string> = {};

    problems.forEach(problem => {
        problem.classes.forEach(classDetail => {
            classDetail.coordinates.forEach((coordIndex) => {
                vertexStates[coordIndex] = classDetail.name;
                
                const faceIndex = Math.floor(coordIndex / 3);
                faceStates[faceIndex] = classDetail.name;
            });
        });
    });

    return { vertexStates, faceStates };
};
