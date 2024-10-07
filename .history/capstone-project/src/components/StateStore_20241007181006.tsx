import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface ColorState {
  color: string;
}

interface ModelColorState {
  modelId: string;
  states: { [modelId: string]: { [vertexIndex: number]: ColorState } };// save the color of vertex
  setState: (modelId: string, vertexIndex: number, color: string) => void; // get the color information
  setModelId: (modelId: string) => void;
}

const useModelStore = create<ModelColorState>()(
  devtools(
    persist(
      (set) => ({
        modelId: '',
        states: {},
        setState: (modelId, vertexIndex, color) =>
          set(state => ({
            ...state,
            states: {
              ...state.states,
              [modelId]: {
                ...(state.states[modelId] || {}),
                [vertexIndex]: { color }
              }
            }
          })),
        setModelId: (id) =>
          set(state => ({
            ...state,
            modelId: id
          }))
      }),
      {
        name: 'model-colors-storage'
      }
    )
  )
);

export default useModelStore;