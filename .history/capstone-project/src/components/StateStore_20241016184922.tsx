import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ProblemsType } from '../datatypes/ProblemsType';

interface ColorState {
  color: string;
}

interface ModelColorState {
  modelId: string;
  states: { [modelId: string]: { [vertexIndex: number]: ColorState } };// save the color of vertex
  setState: (modelId: string, vertexIndex: number, color: string) => void; // get the color information
  setModelId: (modelId: string) => void;
  problems: ProblemsType[];
  addProblem:(problem : ProblemsType) => void;
  updateProblems:(index : number, problme:ProblemsType) => void;
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
        updateProblems: (index:number, problem:ProblemsType) => set(state => {
          const {modelId,currentClassIndex} = get();
          const newProblems = [...state.problems];
          if(index >=0 && index < newProblems.length){
            console.log(currentClassIndex);
            const currentStates = state.states[modelId] || {};
            newProblems[index] = {
              modelId : modelId,
              name : problem.name,
              classes: problem.classes.map((cls,clsIndex) => 
                clsIndex === currentClassIndex ? {
                  ...cls,
                  annotation: currentStates
                } : cls
            )
            };
            const {[modelId] : _,...remainingStates} = state.states;
            return {
              problems: newProblems,
              states: remainingStates
            };
          }
          return {problems:newProblems};
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