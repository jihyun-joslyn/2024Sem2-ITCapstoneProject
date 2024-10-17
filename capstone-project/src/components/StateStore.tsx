import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface ColorState {
  color: string;
}

interface KeypointState {
  position: { x: number; y: number; z: number }; // 3D position of keypoint
  color: string; // Color of the keypoint
}

// New interfaces for session-based actions
interface PaintAction {
  type: 'spray' | 'point';
  changes: {
    vertexIndex: number;
    color: string;
  }[];
}

interface SessionModelState {
  actions: PaintAction[];
  currentActionIndex: number;
}

interface ModelColorState {
  modelId: string;
  states: { [modelId: string]: { [vertexIndex: number]: ColorState } };// save the color of vertex
  keypoints: { [modelId: string]: KeypointState[] }; // Save keypoint annotations
  sessionStates: { [modelId: string]: SessionModelState }; // New session-based state
  setState: (modelId: string, vertexIndex: number, color: string) => void; // get the color information
  setKeypoint: (modelId: string, position: { x: number; y: number; z: number }, color: string) => void; // Set keypoint at a specific 3D position
  setModelId: (modelId: string) => void;
  
  // New methods for session-based actions
  startPaintAction: (modelId: string, type: 'spray' | 'point') => void;
  addPaintChange: (modelId: string, vertexIndex: number, color: string) => void;
  endPaintAction: (modelId: string) => void;
  undo: (modelId: string) => void;
  redo: (modelId: string) => void;
  getCurrentState: (modelId: string) => { colors: { [vertexIndex: number]: ColorState }, keypoints: KeypointState[] };
}

const useModelStore = create<ModelColorState>()(
  devtools(
    persist(
      (set, get) => ({
        modelId: '',
        states: {},
        keypoints: {},
        sessionStates: {},

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

        setKeypoint: (modelId, position, color) =>
          set((state) => ({
            ...state,
            keypoints: {
              ...state.keypoints,
              [modelId]: [
                ...(state.keypoints[modelId] || []),
                { position, color },
              ],
            },
          })),

        setModelId: (id) =>
          set((state) => ({
            ...state,
            modelId: id,
          })),

        // New methods for session-based actions
        startPaintAction: (modelId, type) => set((state) => {
          const sessionState = state.sessionStates[modelId] || { actions: [], currentActionIndex: -1 };
          const newAction: PaintAction = { type, changes: [] };
          return {
            sessionStates: {
              ...state.sessionStates,
              [modelId]: {
                actions: [...sessionState.actions.slice(0, sessionState.currentActionIndex + 1), newAction],
                currentActionIndex: sessionState.currentActionIndex + 1
              }
            }
          };
        }),

        addPaintChange: (modelId, vertexIndex, color) => set((state) => {
          const sessionState = state.sessionStates[modelId];
          if (!sessionState || sessionState.currentActionIndex === -1) return state;
          
          const currentAction = sessionState.actions[sessionState.currentActionIndex];
          currentAction.changes.push({ vertexIndex, color });
          
          return {
            sessionStates: {
              ...state.sessionStates,
              [modelId]: {
                ...sessionState,
                actions: [...sessionState.actions.slice(0, sessionState.currentActionIndex), currentAction]
              }
            }
          };
        }),

        endPaintAction: (modelId) => set((state) => state), // No-op for now

        undo: (modelId) => set((state) => {
          const sessionState = state.sessionStates[modelId];
          if (!sessionState || sessionState.currentActionIndex < 0) return state;
          
          return {
            sessionStates: {
              ...state.sessionStates,
              [modelId]: {
                ...sessionState,
                currentActionIndex: sessionState.currentActionIndex - 1
              }
            }
          };
        }),

        redo: (modelId) => set((state) => {
          const sessionState = state.sessionStates[modelId];
          if (!sessionState || sessionState.currentActionIndex >= sessionState.actions.length - 1) return state;
          
          return {
            sessionStates: {
              ...state.sessionStates,
              [modelId]: {
                ...sessionState,
                currentActionIndex: sessionState.currentActionIndex + 1
              }
            }
          };
        }),

        getCurrentState: (modelId) => {
          const state = get();
          const persistentColors = state.states[modelId] || {};
          const persistentKeypoints = state.keypoints[modelId] || [];
          const sessionState = state.sessionStates[modelId];

          let colors = { ...persistentColors };
          if (sessionState) {
            for (let i = 0; i <= sessionState.currentActionIndex; i++) {
              const action = sessionState.actions[i];
              action.changes.forEach(change => {
                colors[change.vertexIndex] = { color: change.color };
              });
            }
          }

          return { colors, keypoints: persistentKeypoints };
        },
      }),
      {
        name: 'model-colors-storage',
      }
    )
  )
);

export default useModelStore;