import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface ColorState {
  color: string;
}

interface KeypointState {
  position: { x: number; y: number; z: number }; // 3D position of keypoint
  color: string; // Color of the keypoint
}

interface ModelColorState {
  modelId: string;
  states: { [modelId: string]: { [vertexIndex: number]: ColorState } };// save the color of vertex
  keypoints: { [modelId: string]: KeypointState[] }; // Save keypoint annotations
  setState: (modelId: string, vertexIndex: number, color: string) => void; // get the color information
  setKeypoint: (modelId: string, position: { x: number; y: number; z: number }, color: string) => void; // Set keypoint at a specific 3D position
  setModelId: (modelId: string) => void;
}


const useModelStore = create<ModelColorState>()(
  devtools(
    persist(
      (set) => ({
        modelId: '',
        states: {},
        keypoints: {},

        // Set spray color for a vertex
        setState: (modelId, vertexIndex, color) =>
          set((state) => ({
            ...state,
            states: {
              ...state.states,
              [modelId]: {
                ...(state.states[modelId] || {}),
                [vertexIndex]: { color },
              },
            },
          })),

        // Set keypoint with position and color
        setKeypoint: (modelId, position, color) =>
          set((state) => ({
            ...state,
            keypoints: {
              ...state.keypoints,
              [modelId]: [
                ...(state.keypoints[modelId] || []),
                { position, color }, // Add new keypoint with its position and color
              ],
            },
          })),

        // Set current model ID
        setModelId: (id) =>
          set((state) => ({
            ...state,
            modelId: id,
          })),
      }),
      {
        name: 'model-colors-storage',
      }
    )
  )
);

export default useModelStore;
