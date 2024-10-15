import { create } from 'zustand'; //修改添加了{}
import { devtools } from 'zustand/middleware';
import * as THREE from 'three';

interface SelectedPoint {
  index: number; // 顶点索引
  position: THREE.Vector3; // 顶点位置
}

interface PointState {
  points: SelectedPoint[]; // 存储选取的点
  addPoint: (point: SelectedPoint) => void; // 添加点的方法
  clearPoints: () => void; // 清除所有点的方法
}

const usePointStore = create<PointState>()(
  devtools(set => ({
    points: [],
    addPoint: (point: SelectedPoint) =>
      set(state => ({
        points: [...state.points, point],
      })),
    clearPoints: () => set({ points: [] }),
  }))
);

export default usePointStore;
