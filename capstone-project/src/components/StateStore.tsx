import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import * as THREE from 'three';

interface ColorState {
  color: string;
}

interface SelectedPoint {
  id: number;
  position: THREE.Vector3;
}

interface ModelColorState {
  modelId: string;
  states: { [modelId: string]: { [vertexIndex: number]: ColorState } }; // 保存顶点颜色
  selectedPoints: SelectedPoint[]; // 新增：选定点的列表
  setState: (modelId: string, vertexIndex: number, color: string) => void;
  setModelId: (modelId: string) => void;
  addSelectedPoint: (point: SelectedPoint) => void; // 新增：添加选定点
  clearSelectedPoints: () => void; // 新增：清除选定点
}

const useModelStore = create<ModelColorState>()(
  devtools(
    persist(
      (set) => ({
        modelId: '',
        states: {},
        selectedPoints: [],
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
        setModelId: (id) =>
          set((state) => ({
            ...state,
            modelId: id,
          })),
        addSelectedPoint: (point) =>
          set((state) => ({
            ...state,
            selectedPoints: [...state.selectedPoints, point],
          })),
        clearSelectedPoints: () =>
          set((state) => ({
            ...state,
            selectedPoints: [],
          })),
      }),
      {
        name: 'model-colors-storage',
      }
    )
  )
);

export default useModelStore;