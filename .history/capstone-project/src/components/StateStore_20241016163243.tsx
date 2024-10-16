import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ProblemType } from '../datatypes/ProblemType';

interface ColorState {
  color: string;
}

interface ModelColorState {
  modelId: string;
  states: { [modelId: string]: { [vertexIndex: number]: ColorState } };// save the color of vertex
  setState: (modelId: string, vertexIndex: number, color: string) => void; // get the color information
  setModelId: (modelId: string) => void;
  problems: ProblemType[];
  addProblem:(problem : ProblemType) => void;
  updateProblem:(index : number, problme:ProblemType) => void;
  deleteProblem:(index:number) => void;
  currentClassIndex : number;
  setCurrentClassIndex : (index : number) => void;
}

const useModelStore = create<ModelColorState>()(
  devtools(
    persist(
      (set,get) => ({
        modelId: '',
        states: {},
        problems :[],
        currentClassIndex: 0,
        setCurrentClassIndex : (index) => set({currentClassIndex : index}),
        setState: (modelId, vertexIndex, color) => set(state => ({
            ...state,
            states: {
              ...state.states,
              [modelId]: {
                ...(state.states[modelId] || {}),
                [vertexIndex]: { color }
              }
            }
        })),
        setModelId: (id) => set(state => ({
            ...state,
            modelId: id
          })),
        addProblem :(problem) => set(state => ({
          problems:[...state.problems,problem]
        })),
        updateProblem: (index, problem) => set(state => {
          const newProblems = [...state.problems];
          if(index >=0 && index < newProblems.length){
            const currentStates = get().states[get().modelId] || {};
            newProblems[index] = {
              ...newProblems[index],
              classes: newProblems[index].classes.map((cls,clsIndex) =>
                clsIndex === get().currentClassIndex ? {
                  ...cls,
                  annotation: currentStates
                } : cls
            )
            };
            set({states : {}});
          }
          return {problems: newProblems};
        }),
        deleteProblem: (index) => set(state => ({
          problems: state.problems.filter((_, i) => i !== index)
        }))
      }),
      {
        name: 'model-colors-storage'
      }
    )
  )
);

export default useModelStore;