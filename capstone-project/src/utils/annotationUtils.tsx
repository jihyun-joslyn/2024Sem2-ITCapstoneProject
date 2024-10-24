import { ProblemType } from '../datatypes/ProblemType';

export const convertProblemsToRecord = (problems: ProblemType[]): Record<number, string> => {
    const result: Record<number, string> = {};

    problems.forEach(problem => {
        problem.classes.forEach(classDetail => {
            classDetail.coordinates.forEach((coordIndex) => {
                result[coordIndex] = classDetail.name;
            });
        });
    });

    return result;
};
