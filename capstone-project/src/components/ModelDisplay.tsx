import { Html, Line, OrbitControls } from '@react-three/drei';
import { Canvas, ThreeEvent, extend, useThree } from '@react-three/fiber';
import * as _ from "lodash";
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BufferAttribute, BufferGeometry, LineBasicMaterial, LineSegments, Mesh, MeshStandardMaterial, Vector3, WireframeGeometry } from 'three';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils';
import useModelStore from '../components/StateStore';
import { AnnotationType } from '../datatypes/ClassDetail';
import { CoordinatesType } from '../datatypes/CoordinateType';
import { ModelIDFileNameMap } from '../datatypes/ModelIDFileNameMap';
import { FaceLabel, PathAnnotation, Point, PointCoordinates } from '../datatypes/PathAnnotation';
import { ProblemType } from '../datatypes/ProblemType';
import { PriorityQueue } from '../utils/PriorityQueue';
import ModelContext from './ModelContext';
import DisplayClass from './DisplayClass';


type HotkeyEvent = KeyboardEvent | MouseEvent | WheelEvent;

extend({ WireframeGeometry });

type ModelDisplayProps = {
  /**
   * The file content of the current STL file 
   */
  modelData: ArrayBuffer;
  /**
    * The data labels of the current file
    */
  currProblem: ProblemType[];
  /**
    * Update the new problem array into the centralized file array
    * @param updateProblems the updated problem array
    */
  updateProblems: (updateProblems: ProblemType[]) => void;
  /**
    * The name of the current file displaying on UI
    */
  currentFile: string | null;
  /**
    * Update the modelId and file name mapping array
    * @param mapping the new array
    */
  updateModelIDFileMapping: (mapping: ModelIDFileNameMap[]) => void;
  /**
    * Check if there are any classes that are currently allowed for annotating
    * @returns whether there are classes having the flag isAnnotating set to true
    */
  checkIfNowCanAnnotate: () => boolean;
  /**
   * Whether showingthe color selector
   */
  isShowColorSpraySelector: boolean;
  /**
    * Check whether there are any data in local storage that are under the given key
    * @param storageKey the key to be checked
    * @returns whether there are no data under the key in local storage
    */
  checkIfLocalStorageIsEmpty: (storageKey: string) => boolean;
};

const ModelContent: React.FC<ModelDisplayProps> = ({ modelData, currProblem, updateProblems, currentFile, updateModelIDFileMapping, checkIfNowCanAnnotate, isShowColorSpraySelector, checkIfLocalStorageIsEmpty }) => {
  const { tool, color, hotkeys, orbitControlsRef, controlsRef, hotkeysEnabled, setTool, setSpray, activateArrow, activateSpray } = useContext(ModelContext);//get the tool and color state from siderbar
  const { camera, gl } = useThree();
  const meshRef = useRef<Mesh>(null);
  const wireframeRef = useRef<LineSegments>(null);
  const [isSpray, setIsSpray] = useState(false);
  const raycasterRef = useRef(new THREE.Raycaster());
  const modelStore = useModelStore();
  const [redPoints, setRedPoints] = useState<THREE.Vector3[]>([]);
  const [paths, setPaths] = useState<THREE.Vector3[][]>([]);
  const redSphereRef = useRef<THREE.Group>(new THREE.Group());
  const [isPathClosed, setIsPathClosed] = useState(false);
  const [closedPath, setClosedPath] = useState<THREE.Vector3[][]>([]);


  //triggered when the value of modelData changes
  useEffect(() => {
    if (!meshRef.current || !wireframeRef.current) return;

    //initialize new STL loader
    const loader = new STLLoader();
    let geometry: BufferGeometry = loader.parse(modelData);

    //set file modelID according to the length of the model data
    const modelID = modelData.byteLength.toString();

    if (!geometry.index) {
      geometry = BufferGeometryUtils.mergeVertices(geometry); // Merge the vertex to optimize performance
      geometry.computeVertexNormals();
    }

    // Use the BVH to accelerate the geometry
    geometry.computeBoundsTree = computeBoundsTree;
    geometry.disposeBoundsTree = disposeBoundsTree;
    meshRef.current.raycast = acceleratedRaycast;
    geometry.computeBoundsTree();

    modelStore.setModelId(modelID);

    //mapping for modelId and fileName;
    const ModelIDFileNameMappingKey: string = "ModelIDFileNameMapping";
    var mappingArr: ModelIDFileNameMap[] = [];
    var mapping: ModelIDFileNameMap = { modelID: modelID, fileName: currentFile };

    //if there are data under the mapping key in local storage
    if (!checkIfLocalStorageIsEmpty(ModelIDFileNameMappingKey))
      mappingArr = JSON.parse(localStorage.getItem(ModelIDFileNameMappingKey));

    //if the array does not have element related to the current file
    if (_.findIndex(mappingArr, function (m) {
      return _.eq(m.fileName, currentFile)
    }) == -1)
      mappingArr.push(mapping);

    localStorage.setItem(ModelIDFileNameMappingKey, JSON.stringify(mappingArr));
    //update the mapping array
    updateModelIDFileMapping(mappingArr);

    //initialize and display mesh and annotations according to local storage and files imported
    geometry = showAnnotationsInLoader(geometry);
    meshRef.current.geometry = geometry;
    meshRef.current.material = new MeshStandardMaterial({ vertexColors: true });

    // Add the mesh effect to model
    const wireframeGeometry = new WireframeGeometry(geometry);
    wireframeRef.current.geometry = wireframeGeometry;

    fitModel();
  }, [modelData]);

  //triggered when there are annotations changes in the 3D image
  useEffect(() => {
    meshRef.current.geometry = showAnnotationsInLoader(meshRef.current.geometry);
  }, [modelStore.keypoints, modelStore.states]);

  /**
   * Initialize the mesh for 3D image and display the annotations
   * @param geometry the mesh of the 3D image
   * @returns the updated mesh
   */
  const showAnnotationsInLoader = (geometry: BufferGeometry): BufferGeometry => {
    // Remove previous keypoint spheres
    while (meshRef.current.children.length > 0) {
      meshRef.current.children.pop();
    }

    // Get all vertices and initialize colors (default to white)
    const vertexCount = geometry.attributes.position.count;
    const colors = new Float32Array(vertexCount * 3).fill(1);

    //load the saved states of color
    const { colors: savedColors } = modelStore.getCurrentState(modelStore.modelId);

    //if the array of saved colored faces is not empty
    if (!_.isEmpty(savedColors) && savedColors) {
      Object.entries(savedColors).forEach(([index, colorState]) => {
        const color = new THREE.Color(colorState.color);
        //color the face according to the saved information
        const i = Number(index);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      });
    }

    const savedData = modelStore.states[modelStore.modelId] || {}; // Default to empty object if no saved data exists

    // Check if there are any spray annotations
    var hasSprayAnnotations = Object.keys(savedData).some(
      (index) => savedData[Number(index)]?.color // Check if color exists in any savedData entry
    );

    // If there are spray annotations, apply the colors to the vertices
    if (hasSprayAnnotations) {
      Object.keys(savedData).forEach((index) => {
        // Default to white if color is missing
        const color = new THREE.Color(savedData[Number(index)]?.color || '#ffffff');
        colors[Number(index) * 3] = color.r;
        colors[Number(index) * 3 + 1] = color.g;
        colors[Number(index) * 3 + 2] = color.b;
      });
    }

    // Load keypoints and add spheres at the saved positions
    const savedKeypoints = modelStore.keypoints[modelStore.modelId] || []; // Default to empty array if no keypoints exist

    if (savedKeypoints.length > 0) {
      savedKeypoints.forEach(({ position, color }) => {
        // Ensure both position and color are valid
        if (position && color) {
          const keypointSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.07, 16, 16),
            new THREE.MeshBasicMaterial({ color })
          );
          keypointSphere.position.set(position.x, position.y, position.z);
          //add the sphere to the mesh
          meshRef.current.add(keypointSphere);
        }
      });
    }

    //if there are linked annotations in the currProblem
    if (_.findIndex(currProblem, function (p) {
      return _.findIndex(p.classes, function (c) {
        return c.coordinates.length > 0
      }) != -1
    }) != -1) {
      currProblem.forEach(p => {
        p.classes.forEach(c => {
          //if there are annotations linked to the class
          if (c.coordinates.length > 0) {
            switch (c.annotationType) {
              case AnnotationType.SPRAY:
                //set the color according to the color of the linked annotations, else set it to white
                const color = new THREE.Color(c.color || '#ffffff');

                c.coordinates.forEach(_c => {
                  //color the face according to the color information
                  colors[Number(_c) * 3] = color.r;
                  colors[Number(_c) * 3 + 1] = color.g;
                  colors[Number(_c) * 3 + 2] = color.b;
                });
                hasSprayAnnotations = true;
                break;
              case AnnotationType.KEYPOINT:
                //initialize the sphere for keypoints
                const keypointSphere = new THREE.Mesh(
                  new THREE.SphereGeometry(0.07, 16, 16),
                  new THREE.MeshBasicMaterial({ color: c.color })
                );

                //loop the coordinates array three by three
                for (var i = 0; i < c.coordinates.length; i += 3) {
                  //set the point point using (x, y, z) coordinates
                  keypointSphere.position.set(c.coordinates[i], c.coordinates[i + 1], c.coordinates[i + 2]);
                  //add the sphere to the mesh
                  meshRef.current.add(keypointSphere);
                }
                break;
              case AnnotationType.PATH:
                //one label can only have a path annotation
                var _path: PathAnnotation = c.coordinates[0];

                //if there are colored faces in the path annotaion
                if (!_.isEmpty(_path.faces)) {
                  _path.faces.forEach(f => {
                    //set the color according to the element
                    const _color = new THREE.Color(f.color || '#ffffff');

                    //color the face
                    colors[Number(f.vertex) * 3] = _color.r;
                    colors[Number(f.vertex) * 3 + 1] = _color.g;
                    colors[Number(f.vertex) * 3 + 2] = _color.b;
                  });
                }

                //if there are more than three points for the path and the edge array is not null
                if (_path.point.length >= 3 && !_.isEmpty(_path.edge)) {
                  var _pathVertex: THREE.Vector3[] = [];

                  //create the path for the annotation
                  _path.edge.forEach(p => {
                    _pathVertex.push(new THREE.Vector3(p.x as number, p.y as number, p.z as number));
                  });

                  _pathVertex.push(new THREE.Vector3(_path.edge[0].x as number, _path.edge[0].y as number, _path.edge[0].z as number));

                  const pathGeometry = new BufferGeometry();
                  //create the line according to the path coordinates
                  pathGeometry.setFromPoints(_pathVertex);
                  //create a blue line
                  const pathMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, transparent: false, linewidth: 3 });

                  //create the line according to the created position and the color
                  const pathLine = new THREE.Line(pathGeometry, pathMaterial);
                  //add the line to the current mesh
                  meshRef.current.add(pathLine);
                } else {
                  console.warn(`Not enough points to create a closed path for class: ${c.name}`);
                }

                //if the point array is not empty
                if (!_.isEmpty(_path.point)) {
                  _path.point.forEach(p => {
                    //initialize the point sphere
                    var _sphere = new THREE.Mesh(
                      new THREE.SphereGeometry(0.07, 16, 16),
                      new THREE.MeshBasicMaterial({ color: p.color })
                    );

                    //set the point position using the (x, y, z) coordinates
                    _sphere.position.set((Number)(p.coordinates.x), (Number)(p.coordinates.y), (Number)(p.coordinates.z));
                    //add the sphere to the mesh
                    meshRef.current.add(_sphere);
                  })
                }
                break;
              default:
                break;
            }
          }
        })
      })
    }

    // add the color into geometry, each vertex use three data to record color
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return geometry;
  }

  /* Call Display Class to show a label in case where the mouse clicked is part of an annotated area
   
  */

  const [clickedPoint, setClickedPoint] = useState(null); // variable to save the click coordinates to pass to DisplayClass.tsx

  const [vertexId, setVertexId] = useState<number | null>(null); //variable to get the vertexID of the clicked point to pass to DisplayClass.tsx

  //button of the Sidebar to activate the Display Class function.
  const handleArrowClick = (event: MouseEvent) => {
    if (!meshRef.current || tool !== 'arrow') return;
    const rect = gl.domElement.getBoundingClientRect();
    const mousePosition = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    raycasterRef.current.setFromCamera(mousePosition, camera);
    const intersects = raycasterRef.current.intersectObject(meshRef.current, true);

    if (intersects.length > 0) {
      const intersection = intersects[0];
      const localPoint = intersection.point.clone();
      const inverseMatrix = new THREE.Matrix4();
      inverseMatrix.copy(meshRef.current.matrixWorld).invert();
      localPoint.applyMatrix4(inverseMatrix);

      // Find the closest vertex
      const vertexId = findClosestVertexId(localPoint, meshRef.current);
      setVertexId(vertexId);  // Set the vertexId in the state

      setClickedPoint({ x: localPoint.x, y: localPoint.y, z: localPoint.z });  // Update state
    }
  };
  //function used to get the VertexID of clicked point (in the future it could be fusioned with the one used by Shortest path function)
  const findClosestVertexId = (point: THREE.Vector3, mesh: THREE.Mesh): number => {
    const geometry = mesh.geometry;
    const positions = geometry.attributes.position.array; // This is a flat array of vertex positions (x, y, z)
    let closestVertexId = -1;
    let minDistance = Infinity;

    // Loop through the vertices array (note: it's a flat array, every 3 elements represent one vertex)
    for (let i = 0; i < positions.length; i += 3) {
      const vertex = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);

      // Calculate the distance between the point and the current vertex
      const distance = point.distanceTo(vertex);

      // If the current vertex is closer, update the closest vertex ID
      if (distance < minDistance) {
        minDistance = distance;
        closestVertexId = i / 3; // Get the vertex index (i / 3 because every vertex is 3 values: x, y, z)
      }
    }

    return closestVertexId;
  };

  // Attach handleArrowClick only when tool is 'arrow' (Display Class function)
  useEffect(() => {
    if (tool === 'arrow') {
      window.addEventListener('click', handleArrowClick);
    }

    return () => {
      window.removeEventListener('click', handleArrowClick);
    };
  }, [tool]);

  /**
   * Color the given face when the spray tool is selected
   * 
   * Triggered when the values of color, camera or modelStore changes
   */
  const spray = useCallback((position: THREE.Vector2) => {
    //if no class are being selected now
    if (!checkIfNowCanAnnotate() && (!meshRef.current || !meshRef.current.geometry.boundsTree)) return;

    const raycaster = raycasterRef.current;
    const geometry = meshRef.current.geometry as BufferGeometry;
    const colorAttributes = geometry.attributes.color as THREE.BufferAttribute;

    const newColor = new THREE.Color(color);
    raycaster.setFromCamera(position, camera);

    const intersects = raycaster.intersectObject(meshRef.current, true);

    if (intersects.length > 0) {
      intersects.forEach((intersect: THREE.Intersection) => {
        if (intersect.face) {
          const faceIndices = [intersect.face.a, intersect.face.b, intersect.face.c];

          faceIndices.forEach(index => {
            colorAttributes.setXYZ(index, newColor.r, newColor.g, newColor.b);

            modelStore.addPaintChange(modelStore.modelId, index, color);
            modelStore.setState(modelStore.modelId, index, color);

            //link the colored face to the currently selected class
            linkAnnotationToClass(index, color, CoordinatesType.FACE);
          });
          colorAttributes.needsUpdate = true;
        }
      })
    }
  }, [color, camera, modelStore]);

  /**
   * When users selected the spray tool and clicked the mouse
   */
  const handleMouseDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (tool != 'spray') return;

    event.stopPropagation();

    setIsSpray(true);

    //start recording for hotkey
    modelStore.startPaintAction(modelStore.modelId, 'spray');
  }, [tool, modelStore, gl, spray]);

  /**
   * When users move their mouse with pressing the mouse key and selected spray as the annotation tool
   */
  const handleMouseMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    //only spray when tool is spray and click the mouse
    if (!isSpray || tool !== 'spray') return;

    event.stopPropagation();

    // Get the width and height from the canvas
    const rect = gl.domElement.getBoundingClientRect();
    // Transfer to NDC
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const point = new THREE.Vector2(x, y);

    spray(point);
  }, [isSpray, gl, spray, tool]);

  /**
   * When users release the mouse key and selected spray as the annotation tool
   */
  const handleMouseUp = useCallback((event: ThreeEvent<PointerEvent>) => {
    setIsSpray(false);

    if (tool === 'spray') {
      //end recording for the hotkey
      modelStore.endPaintAction(modelStore.modelId);
    }
  }, [tool, modelStore]);

  //Starting KeyPoint Marking function.
  const KPsphereGeometry = new THREE.SphereGeometry(0.07, 16, 16); // Small sphere
  const sphereMaterial = new THREE.MeshBasicMaterial({ color: color });

  useEffect(() => {
    /**
     * When users clicked on the image with keypoint selected as the annotation tool
     * @param event MouseEvent
     */
    const handlePointerClick = (event: MouseEvent) => {
      if (!meshRef.current || tool !== 'keypoint') return;

      const rect = gl.domElement.getBoundingClientRect();
      const mousePosition = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      // Update raycaster with the mouse position and camera
      raycasterRef.current.setFromCamera(mousePosition, camera);

      // Raycast to find intersections with the mesh
      const intersects = raycasterRef.current.intersectObject(meshRef.current, true);

      if (intersects.length > 0) {
        const intersection = intersects[0];
        const localPoint = intersection.point.clone(); // The point of intersection

        // Apply object matrix world to get the correct local position
        const inverseMatrix = new THREE.Matrix4();
        inverseMatrix.copy(meshRef.current.matrixWorld).invert(); // Invert the world matrix
        localPoint.applyMatrix4(inverseMatrix); // Transform point into local coordinates

        // Create a precise sphere at the local intersection point
        const preciseSphere = new THREE.Mesh(KPsphereGeometry, sphereMaterial);
        preciseSphere.position.copy(localPoint); // Apply precise local point
        meshRef.current.add(preciseSphere); // Add sphere to the mesh in local space


        modelStore.setKeypoint(modelStore.modelId, { x: localPoint.x, y: localPoint.y, z: localPoint.z }, color);
        //start recording for the hotkey
        modelStore.startPaintAction(modelStore.modelId, 'point');
        modelStore.addPaintChange(modelStore.modelId, -1, color); // Use -1 as a special index for keypoints
        //end recording for the hotkey
        modelStore.endPaintAction(modelStore.modelId);

        //link the point annotation to the current selected class
        linkAnnotationToClass(localPoint, color, CoordinatesType.POINT);
      }
    };

    //if users selected keypoint as the annotation tool and has a class selected and finish selecting a color for the sphere
    if (tool === 'keypoint' && checkIfNowCanAnnotate() && !isShowColorSpraySelector) {
      window.addEventListener('click', handlePointerClick);
    }

    return () => {
      window.removeEventListener('click', handlePointerClick);
    };
  }, [tool, camera, gl, meshRef, modelStore, color]);


  //Starting coding for Shortest Path  
  // Add new functions to handle points of path tool
  /**
   * Triggered when users select path as the annotation tool and create points on the image (i.e. clicked on the image)
   */
  const handlePathToolClick = useCallback((event: MouseEvent, faceColor: string) => {
    if (!checkIfNowCanAnnotate() && (!meshRef.current || tool !== 'path')) return;

    const rect = gl.domElement.getBoundingClientRect();
    const mousePosition = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    raycasterRef.current.setFromCamera(mousePosition, camera);
    const intersects = raycasterRef.current.intersectObject(meshRef.current, true);

    if (intersects.length > 0) {
      const intersection = intersects[0];
      const localPoint = intersection.point.clone();
      const inverseMatrix = new THREE.Matrix4();
      inverseMatrix.copy(meshRef.current.matrixWorld).invert();
      localPoint.applyMatrix4(inverseMatrix);

      const graph = buildGraph(meshRef.current.geometry);
      //find the nearest vertex of the clicked point
      const nearestVertex = findNearestVertex(localPoint, graph);
      const nearestPoint = new THREE.Vector3(
        meshRef.current.geometry.attributes.position.getX(nearestVertex),
        meshRef.current.geometry.attributes.position.getY(nearestVertex),
        meshRef.current.geometry.attributes.position.getZ(nearestVertex)
      );

      //set the sphere color to read
      const SPHERE_COLOR: string = '#FF0000';
      // Create a red sphere and add it to the scene 
      const redSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 16, 16),
        new THREE.MeshBasicMaterial({ color: SPHERE_COLOR })
      );
      redSphere.position.copy(nearestPoint);
      redSphereRef.current.add(redSphere);

      //link the clicked point to the current selected class
      linkAnnotationToClass(nearestPoint, SPHERE_COLOR, CoordinatesType.POINT);

      setRedPoints(prevPoints => {
        const newPoints = [...prevPoints, nearestPoint];

        //users have created two or mote points on the mesh
        if (newPoints.length >= 2) {
          const lastIndex = newPoints.length - 1;
          //find the shortest path between the latest two points
          const path = findShortestPath(newPoints[lastIndex - 1], newPoints[lastIndex], meshRef.current!.geometry);
          //console.log('New path:', path);
          if (path.length >= 2) {
            setPaths(prevPaths => {
              const newPaths = [...prevPaths, path];
              //console.log('All paths:', newPaths);

              // Check if the shape is closed 
              const closed = isShapeClosed(newPaths);
              setIsPathClosed(closed);  // Update closed state

              //if the shape is closed
              if (closed) {
                //console.log('Shape is closed, creating filled shape');
                const fillingSuccess = createFilledShape(newPaths, faceColor);
                if (fillingSuccess) {
                  // Save closed paths 
                  setClosedPath(newPaths);

                  // Clear the current path and red dot
                  setTimeout(() => {
                    setRedPoints([]);
                    setPaths([]);
                  }, 100);
                }
              }

              return newPaths;
            });
          } else {
            console.warn('Invalid path found:', path);
          }
        }

        return newPoints;
      });

      //console.log(`Clicked point (nearest vertex):\nX: ${nearestPoint.x.toFixed(2)}\nY: ${nearestPoint.y.toFixed(2)}\nZ: ${nearestPoint.z.toFixed(2)}`);
    }
  }, [tool, camera, gl, meshRef]);

  // Modify the findShortestPath variable
  /**
   * Find the shortest path between two points
   * @param start the point to start
   * @param end the point to end
   * @param geometry the current mesh
   * @returns the path coordinates of the path between two points
   */
  const findShortestPath = (start: THREE.Vector3, end: THREE.Vector3, geometry: THREE.BufferGeometry) => {
    //console.log('Finding path from', start, 'to', end);
    const graph = buildGraph(geometry);
    //console.log('Graph built, size:', graph.size);

    const startVertex = findNearestVertex(start, graph);
    const endVertex = findNearestVertex(end, graph);
    //console.log('Start vertex:', startVertex, 'End vertex:', endVertex);

    const path = aStar(graph, startVertex, endVertex);

    // console.log('Raw path:', path);

    const validPath = path.map(vertexIndex => new THREE.Vector3(
      geometry.attributes.position.getX(vertexIndex),
      geometry.attributes.position.getY(vertexIndex),
      geometry.attributes.position.getZ(vertexIndex)
    ));

    // console.log('Valid path:', validPath);

    if (validPath.length < 2) {
      console.warn('No valid path found, attempting direct connection');

      const directPath = attemptDirectConnection(start, end, geometry);
      if (directPath.length >= 2) {
        //console.log('Direct connection successful:', directPath);
        return directPath;
      }

      console.warn('Direct connection failed, returning straight line');

      return [start, end];
    }

    return validPath;
  };

  // Modify the aStar function 修改 aStar 函数
  /**
   * Execute A* algorithm for finding the shortest path
   * @param graph the mapping for the mesh vertex
   * @param start the starting point for the path
   * @param goal the end point of the path
   * @returns the coordinates of the path
   */
  const aStar = (graph: Map<number, Set<number>>, start: number, goal: number) => {
    const openSet = new PriorityQueue<number>((a, b) => a[1] < b[1]);
    openSet.enqueue([start, 0]);

    // Maps to store the path and cost information
    const cameFrom: Map<number, number> = new Map(); // Tracks the optimal path
    const gScore: Map<number, number> = new Map(); // Cost from start to a given node
    gScore.set(start, 0);

    const fScore: Map<number, number> = new Map(); // Estimated cost from start to goal through a given node
    fScore.set(start, heuristic(start, goal));

    // Set a maximum number of iterations to prevent infinite loops
    const maxIterations = 10000;
    let iterations = 0;

    // Main loop of the A* algorithm
    while (!openSet.isEmpty() && iterations < maxIterations) {
      iterations++;
      const current = openSet.dequeue()![0]; // Get the node with the lowest cost

      // If the goal is reached, reconstruct the path
      if (current === goal) {
        return reconstructPath(cameFrom, current);
      }

      // Explore the neighbors of the current node
      for (const neighbor of graph.get(current) || []) {
        const tentativeGScore = gScore.get(current)! + 1; // Assume uniform cost for simplicity

        // If this path to the neighbor is better, record it
        if (!gScore.has(neighbor) || tentativeGScore < gScore.get(neighbor)!) {
          cameFrom.set(neighbor, current); // Update path to neighbor
          gScore.set(neighbor, tentativeGScore); // Update cost to neighbor
          fScore.set(neighbor, gScore.get(neighbor)! + heuristic(neighbor, goal)); // Update estimated cost to goal

          // Add the neighbor to the open set if it's not already there
          if (!openSet.includes([neighbor, fScore.get(neighbor)!])) {
            openSet.enqueue([neighbor, fScore.get(neighbor)!]);
          }
        }
      }
    }

    console.warn('A* algorithm reached maximum iterations without finding a path');
    return [];
  };

  // Modify the buildGraph function to ensure graph connectivity
  /**
   * Build the graph according to the current mesh
   * @param geometry the current mesh
   * @returns the created graph
   */
  const buildGraph = (geometry: THREE.BufferGeometry) => {
    const graph: Map<number, Set<number>> = new Map();
    const positions = geometry.attributes.position.array;
    const indices = geometry.index ? geometry.index.array : null;

    const addEdge = (v1: number, v2: number) => {
      if (!graph.has(v1)) graph.set(v1, new Set());
      if (!graph.has(v2)) graph.set(v2, new Set());
      graph.get(v1)!.add(v2);
      graph.get(v2)!.add(v1);
    };

    if (indices) {
      for (let i = 0; i < indices.length; i += 3) {
        addEdge(indices[i], indices[i + 1]);
        addEdge(indices[i + 1], indices[i + 2]);
        addEdge(indices[i + 2], indices[i]);
      }
    } else {
      for (let i = 0; i < positions.length; i += 9) {
        const v1 = i / 3, v2 = (i + 3) / 3, v3 = (i + 6) / 3;
        addEdge(v1, v2);
        addEdge(v2, v3);
        addEdge(v3, v1);
      }
    }

    return graph;
  };

  // 找到最近的顶点
  /**
   * Find the nearest vertex of the given point in the mesh
   * @param point the point for finding the nearest vertex
   * @param graph the graph created according to mesh
   * @returns the nearest vertex of the given point
   */
  const findNearestVertex = (point: THREE.Vector3, graph: Map<number, Set<number>>) => {
    let nearestVertex = -1;
    let minDistance = Infinity;

    for (const [vertex, _] of graph) {
      const vertexPosition = new THREE.Vector3(
        meshRef.current!.geometry.attributes.position.getX(vertex),
        meshRef.current!.geometry.attributes.position.getY(vertex),
        meshRef.current!.geometry.attributes.position.getZ(vertex)
      );

      const distance = point.distanceTo(vertexPosition);

      if (distance < minDistance) {
        minDistance = distance;
        nearestVertex = vertex;
      }
    }

    return nearestVertex;
  };

  // 启发式函
  /**
   * Calculate the distance between two points
   * @param a start point
   * @param b end point 
   * @returns the distance between two points
   */
  const heuristic = (a: number, b: number) => {
    const posA = new THREE.Vector3(
      meshRef.current!.geometry.attributes.position.getX(a),
      meshRef.current!.geometry.attributes.position.getY(a),
      meshRef.current!.geometry.attributes.position.getZ(a)
    );

    const posB = new THREE.Vector3(
      meshRef.current!.geometry.attributes.position.getX(b),
      meshRef.current!.geometry.attributes.position.getY(b),
      meshRef.current!.geometry.attributes.position.getZ(b)
    );

    //round the result with the same decimal points as the edge
    return Math.round(posA.distanceTo(posB) * 100) / 100;
  };
  // Reconstruction Path 重建路径
  /**
   * Reconstructing path 
   * @param cameFrom 
   * @param current 
   * @returns 
   */
  const reconstructPath = (cameFrom: Map<number, number>, current: number) => {
    const totalPath = [current];
    while (cameFrom.has(current)) {
      current = cameFrom.get(current)!;
      totalPath.unshift(current);
    }
    return totalPath;
  };
  // Add a new type definition 添加一个新的类型定义
  type EdgeToTriangles = Map<string, Set<number>>;

  // Add a useRef to the ModelContent component to store the mapping of edges to triangles 在 ModelContent 组件中添加一个 useRef 来存储边到三角形的映射
  const edgeToTrianglesRef = useRef<EdgeToTriangles>(new Map());

  // Create a mapping from edges to triangles when loading the model (added in useEffect) 在加载模型时建立边到三角形的映射关系（在 useEffect 中添加）
  useEffect(() => {
    if (!meshRef.current) return;

    const geometry = meshRef.current.geometry as BufferGeometry;
    const positions = geometry.attributes.position;
    const indices = geometry.index;

    // Create a mapping from edges to triangles 建立边到三角形的映射
    const edgeToTriangles = new Map<string, Set<number>>();

    for (let i = 0; i < indices!.count; i += 3) {
      const triangleIndex = Math.floor(i / 3);
      const ia = indices!.getX(i);
      const ib = indices!.getX(i + 1);
      const ic = indices!.getX(i + 2);

      const va = new Vector3().fromBufferAttribute(positions, ia);
      const vb = new Vector3().fromBufferAttribute(positions, ib);
      const vc = new Vector3().fromBufferAttribute(positions, ic);

      //Add a mapping for each edge of the triangle 为三角形的每条边添加映射
      const edges = [
        createEdgeKey(va, vb),
        createEdgeKey(vb, vc),
        createEdgeKey(vc, va)
      ];

      edges.forEach(edge => {
        if (!edgeToTriangles.has(edge)) {
          edgeToTriangles.set(edge, new Set());
        }
        edgeToTriangles.get(edge)!.add(triangleIndex);
      });
    }

    edgeToTrianglesRef.current = edgeToTriangles;
  }, [modelData]); // Only executed once when the model is loaded 只在模型加载时执行一次

  // Add a function to determine the direction of the path (clockwise or counterclockwise) 添加一个函数来判断路径的方向（顺时针或逆时针）
  const isClockwise = (path: THREE.Vector3[]): boolean => {
    let sum = 0;
    // Calculate the directed area of ​​a path 计算路径的有向面积
    for (let i = 0; i < path.length; i++) {
      const current = path[i];
      const next = path[(i + 1) % path.length];
      sum += (next.x - current.x) * (next.y + current.y);
    }
    return sum > 0;
  };

  // Repair triangle inside and outside judgment function 修三角形内外侧判断函数
  const isTriangleOnInnerSide = (
    triangleIndex: number,
    pathEdge: [THREE.Vector3, THREE.Vector3],
    geometry: THREE.BufferGeometry,
    isPathClockwise: boolean
  ): boolean => {
    const indices = geometry.index!;
    const positions = geometry.attributes.position;

    // Get the three vertices of a triangle 获取三角形的三个顶点
    const i = triangleIndex * 3;
    const va = new THREE.Vector3().fromBufferAttribute(positions, indices.getX(i));
    const vb = new THREE.Vector3().fromBufferAttribute(positions, indices.getX(i + 1));
    const vc = new THREE.Vector3().fromBufferAttribute(positions, indices.getX(i + 2));

    // Calculate the centroid of a triangle 计算三角形的质心
    const centroid = new THREE.Vector3()
      .add(va)
      .add(vb)
      .add(vc)
      .divideScalar(3);

    // Calculate the direction vector of the path edge 计算路径边的方向向量
    const edgeDirection = new THREE.Vector3()
      .subVectors(pathEdge[1], pathEdge[0]);

    // Calculate the vector from the path start to the triangle centroid 计算从路径起点到三角形质心的向量
    const toCentroid = new THREE.Vector3()
      .subVectors(centroid, pathEdge[0]);

    // Calculate the cross product to determine the direction 计算叉积来判断方向
    const crossProduct = new THREE.Vector3()
      .crossVectors(edgeDirection, toCentroid);

    // Determine the inside and outside according to the direction of the path (clockwise/counterclockwise) 根据路径的方向（顺时针/逆时针）来判断内外侧
    return isPathClockwise ? crossProduct.z < 0 : crossProduct.z > 0;
  };

  // Modify the function of getting adjacent triangles and use edges to determine the adjacent relationship 修改获取相邻三角形的函数，使用边来判断相邻关系
  const getAdjacentTriangles = (
    triangleIndex: number,
    geometry: THREE.BufferGeometry
  ): Set<number> => {
    const indices = geometry.index!;
    const positions = geometry.attributes.position;
    const adjacent = new Set<number>();

    // Get the three vertices of the current triangle 获取当前三角形的三个顶点
    const i = triangleIndex * 3;
    const v1 = indices.getX(i);
    const v2 = indices.getX(i + 1);
    const v3 = indices.getX(i + 2);

    // Get the positions of the three vertices 获取三个顶点的位置
    const p1 = new THREE.Vector3().fromBufferAttribute(positions, v1);
    const p2 = new THREE.Vector3().fromBufferAttribute(positions, v2);
    const p3 = new THREE.Vector3().fromBufferAttribute(positions, v3);

    // Create three edge keys 创建三条边的key
    const edges = [
      createEdgeKey(p1, p2),
      createEdgeKey(p2, p3),
      createEdgeKey(p3, p1)
    ];

    // Find adjacent triangles by edge 通过边找到相邻的三角形
    edges.forEach(edge => {
      const adjacentToEdge = edgeToTrianglesRef.current.get(edge);
      if (adjacentToEdge) {
        adjacentToEdge.forEach(adjTriangle => {
          if (adjTriangle !== triangleIndex) {
            adjacent.add(adjTriangle);
          }
        });
      }
    });

    return adjacent;
  };

  // Modify the createFilledShape function to use the color in the context 修改 createFilledShape 函数，使用 context 中的 color
  const createFilledShape = (paths: THREE.Vector3[][], faceColor: string): boolean => {
    if (!meshRef.current || paths.length < 3) return false;

    const geometry = meshRef.current.geometry as BufferGeometry;
    const positions = geometry.attributes.position;
    const indices = geometry.index;
    const colors = geometry.attributes.color || new BufferAttribute(new Float32Array(positions.count * 3), 3);

    if (!geometry.attributes.color) {
      geometry.setAttribute('color', colors);
    }

    // Merge all paths into one complete path 将所有路径合并成一个完整的路径
    const completePath = paths.reduce((acc, curr) => [...acc, ...curr], []);

    const isPathClockwise = isClockwise(completePath);

    // Collect boundary triangles 收集边界三角形
    const boundaryTriangles = new Set<number>();
    const allTrianglesToColor = new Set<number>();
    const processedTriangles = new Set<number>();


    // Modify the color judgment logic 修改颜色判断逻辑
    const fillColor = new THREE.Color(faceColor === '#ffffff' ? '#00FF00' : faceColor);  // If the default is white, use green 默认白色，则使用绿色

    // To call linkAnnotation for saving closedPath(means all vertex involved in the polygon shaped) and color of the polygon
    // Remove duplicates based on x, y, and z coordinates
    const uniqueCompletePath = completePath.filter(
      (value, index, self) =>
        index === self.findIndex((v) => v.x === value.x && v.y === value.y && v.z === value.z)
    );

    // Loop through each unique point and create a THREE.Vector3 instance
    uniqueCompletePath.forEach(point => {
      const vector3Point = new THREE.Vector3(point.x, point.y, point.z);

      // Use vector3Point in linkAnnotationToClass
      linkAnnotationToClass(vector3Point, fillColor.getHexString(), CoordinatesType.EDGE);
    });

    // First find all the bounding triangles 首先找到所有边界三角形
    paths.forEach(path => {
      for (let i = 0; i < path.length - 1; i++) {
        const edge = createEdgeKey(path[i], path[i + 1]);
        const pathEdge: [THREE.Vector3, THREE.Vector3] = [path[i], path[i + 1]];

        const adjacentTriangles = edgeToTrianglesRef.current.get(edge);
        if (adjacentTriangles) {
          adjacentTriangles.forEach(triangleIndex => {
            if (isTriangleOnInnerSide(triangleIndex, pathEdge, geometry, isPathClockwise)) {
              boundaryTriangles.add(triangleIndex);
              allTrianglesToColor.add(triangleIndex);
              processedTriangles.add(triangleIndex);
            }
          });
        }
      }
    });

    // Recursive fill function 递归填充函数
    const fillRecursively = (triangleIndex: number) => {
      const adjacentTriangles = getAdjacentTriangles(triangleIndex, geometry);

      adjacentTriangles.forEach(adjTriangle => {
        if (!processedTriangles.has(adjTriangle)) {
          processedTriangles.add(adjTriangle);

          const adjCentroid = getTriangleCentroid(adjTriangle, geometry);
          if (isPointInPolygon(adjCentroid, completePath)) {
            allTrianglesToColor.add(adjTriangle);
            // Recursively process adjacent triangles 递归处理相邻三角形
            fillRecursively(adjTriangle);
          }
        }
      });
    };

    // Recursively fill in each boundary triangle 从每个边界三角形开始递归填充
    boundaryTriangles.forEach(triangleIndex => {
      fillRecursively(triangleIndex);
    });

    // Color all the collected triangles 对所有收集到的三角形进行染色
    allTrianglesToColor.forEach(triangleIndex => {
      const i = triangleIndex * 3;
      const ia = indices!.getX(i);
      const ib = indices!.getX(i + 1);
      const ic = indices!.getX(i + 2);

      // Fill with the selected color 使用选择的颜色进行填充
      colors.setXYZ(ia, fillColor.r, fillColor.g, fillColor.b);
      colors.setXYZ(ib, fillColor.r, fillColor.g, fillColor.b);
      colors.setXYZ(ic, fillColor.r, fillColor.g, fillColor.b);

      //link annotation to the class and save the color and vertexID
      linkAnnotationToClass(ia, fillColor.getHexString(), CoordinatesType.FACE);
      linkAnnotationToClass(ib, fillColor.getHexString(), CoordinatesType.FACE);
      linkAnnotationToClass(ic, fillColor.getHexString(), CoordinatesType.FACE);

      //save in the local storage per modelID (current model)) 
      modelStore.setState(modelStore.modelId, ia, "#".concat(fillColor.getHexString()));
      modelStore.setState(modelStore.modelId, ib, "#".concat(fillColor.getHexString()));
      modelStore.setState(modelStore.modelId, ib, "#".concat(fillColor.getHexString()));
    });

    colors.needsUpdate = true;
    return true;
  };

  // Add a helper function to get the centroid of a triangle 添加获取三角形质心的辅助函数
  const getTriangleCentroid = (triangleIndex: number, geometry: THREE.BufferGeometry): THREE.Vector3 => {
    const indices = geometry.index!;
    const positions = geometry.attributes.position;

    const i = triangleIndex * 3;
    const va = new THREE.Vector3().fromBufferAttribute(positions, indices.getX(i));
    const vb = new THREE.Vector3().fromBufferAttribute(positions, indices.getX(i + 1));
    const vc = new THREE.Vector3().fromBufferAttribute(positions, indices.getX(i + 2));

    return new THREE.Vector3()
      .add(va)
      .add(vb)
      .add(vc)
      .divideScalar(3);
  };

  // Add a function to determine whether a point is inside a polygon 添加判断点是否在多边形内的函数
  const isPointInPolygon = (point: THREE.Vector3, polygon: THREE.Vector3[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;

      const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Add helper function to create edge key value 添加创建边键值的辅助函数
  const createEdgeKey = (v1: THREE.Vector3, v2: THREE.Vector3): string => {
    // To ensure the uniqueness of the edge, we always use the smaller coordinate value first. 为了确保边的唯一性，我们总是用较小的坐标值在前
    const points = [
      [v1.x, v1.y, v1.z],
      [v2.x, v2.y, v2.z]
    ].sort((a, b) => {
      if (a[0] !== b[0]) return a[0] - b[0];
      if (a[1] !== b[1]) return a[1] - b[1];
      return a[2] - b[2];
    });

    return `${points[0].join(',')}-${points[1].join(',')}`;
  };

  useEffect(() => {
    if (tool === 'path' && checkIfNowCanAnnotate() && !isShowColorSpraySelector) {
      window.addEventListener('click', e => handlePathToolClick(e, color));
    }
    return () => {
      window.removeEventListener('click', e => handlePathToolClick(e, color));
    };
  }, [tool, handlePathToolClick, color]);
  useEffect(() => {
    //console.log('Paths updated:', paths);
  }, [paths]);
  // Add this function before the return statement 在 return 语句之前添加这个函数
  const formatPathForLine = (path: THREE.Vector3[]) => {
    return path.flatMap(p => [p.x, p.y, p.z]);
  };
  // // Add this new function after other function definitions 在其他函数定义之后，添加这个新函数
  const attemptDirectConnection = (start: THREE.Vector3, end: THREE.Vector3, geometry: THREE.BufferGeometry) => {
    const direction = end.clone().sub(start);
    const distance = direction.length();
    const step = distance / 100; //Divide the path into 100 steps 将路径分成100个步骤
    const path = [start.clone()];
    const graph = buildGraph(geometry); //Build the graph structure once to avoid repeated calculations 构建图结构一次，避免重复计算

    for (let i = 1; i <= 100; i++) {
      const point = start.clone().add(direction.clone().multiplyScalar(i / 100));
      const nearestVertex = findNearestVertex(point, graph);
      if (nearestVertex !== -1) {
        path.push(new THREE.Vector3(
          geometry.attributes.position.getX(nearestVertex),
          geometry.attributes.position.getY(nearestVertex),
          geometry.attributes.position.getZ(nearestVertex)
        ));
      }
    }

    return path;
  };
  // Add a function to determine whether the figure is closed 添加判断图形是否封闭的函数
  const isShapeClosed = (paths: THREE.Vector3[][]): boolean => {
    if (paths.length < 3) return false;

    const firstPoint = paths[0][0];
    const lastPoint = paths[paths.length - 1][paths[paths.length - 1].length - 1];
    const newPoint = paths[paths.length - 1][0]; // Latest added points 最新添加的点

    const tolerance = 0.001; //You can adjust this value as needed. 可以根据需要调整这个值
    return firstPoint.distanceTo(lastPoint) < tolerance || firstPoint.distanceTo(newPoint) < tolerance;
  };

  //End Shortest Path function

  const isKeyboardEvent = (event: HotkeyEvent): event is KeyboardEvent => {
    return 'key' in event;
  };

  const isMouseEvent = (event: HotkeyEvent): event is MouseEvent => {
    return 'button' in event;
  };

  const isWheelEvent = (event: HotkeyEvent): event is WheelEvent => {
    return 'deltaY' in event;
  };

  const checkHotkey = useCallback((event: HotkeyEvent, hotkeyString: string) => {
    const hotKeyParts = hotkeyString.toUpperCase().split('+');

    const isCtrlPressed = event.ctrlKey;
    const isShiftPressed = event.shiftKey;
    const isAltPressed = event.altKey;

    const modifiers = [
      isCtrlPressed && 'CONTROL',
      isShiftPressed && 'SHIFT',
      isAltPressed && 'ALT'
    ].filter(Boolean);

    let key = '';
    if (isKeyboardEvent(event)) {
      key = event.key.toUpperCase();
    } else if (isMouseEvent(event)) {
      key = event.button === 0 ? 'LEFTCLICK' : event.button === 2 ? 'RIGHTCLICK' : '';
    } else if (isWheelEvent(event)) {
      key = (event as WheelEvent).deltaY < 0 ? 'WHEELUP' : 'WHEELDOWN';
    }

    const pressedKeys = [...modifiers, key];
    return hotKeyParts.every(part => pressedKeys.includes(part)) && pressedKeys.length === hotKeyParts.length;
  }, []);

  //updated accordying to HotKey branch
  const zoomCamera = useCallback((factor: number) => {
    if (orbitControlsRef.current) {
      const controls = orbitControlsRef.current;
      // Get the current zoom level
      const currentZoom = camera.position.distanceTo(controls.target);
      // Calculate new zoom
      const newZoom = currentZoom * factor;

      // Update camera position
      const direction = camera.position.clone().sub(controls.target).normalize();
      camera.position.copy(controls.target).add(direction.multiplyScalar(newZoom));

      controls.update();
    }
  }, [camera, orbitControlsRef]);

  const rotateHorizontal = useCallback((angle: number) => {
    if (orbitControlsRef.current) {
      const controls = orbitControlsRef.current;
      // Create a rotation matrix around the Y axis
      const rotationMatrix = new THREE.Matrix4();
      rotationMatrix.makeRotationY(angle);

      // Get vector from target to camera
      const cameraPosition = camera.position.clone().sub(controls.target);
      // Apply rotation
      cameraPosition.applyMatrix4(rotationMatrix);
      // Set new camera position
      camera.position.copy(controls.target).add(cameraPosition);

      // Update camera orientation
      camera.lookAt(controls.target);
      controls.update();
    }
  }, [camera, orbitControlsRef]);

  const rotateVertical = useCallback((angle: number) => {
    if (orbitControlsRef.current) {
      const controls = orbitControlsRef.current;
      // Get the right vector (perpendicular to up vector and camera direction)
      const right = new THREE.Vector3();
      right.crossVectors(camera.up, camera.position.clone().sub(controls.target).normalize());

      // Create rotation matrix around the right vector
      const rotationMatrix = new THREE.Matrix4();
      rotationMatrix.makeRotationAxis(right.normalize(), angle);

      // Get vector from target to camera
      const cameraPosition = camera.position.clone().sub(controls.target);
      // Apply rotation
      cameraPosition.applyMatrix4(rotationMatrix);
      // Set new camera position
      camera.position.copy(controls.target).add(cameraPosition);

      // Update camera orientation
      camera.lookAt(controls.target);
      controls.update();
    }
  }, [camera, orbitControlsRef]);

  const fitModel = () => {
    if (!meshRef.current) return;
    const box = new THREE.Box3().setFromObject(meshRef.current);
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());

    camera.position.copy(center);
    camera.position.x += size / 2.0;
    camera.position.y += size / 5.0;
    camera.position.z += size / 2.0;
    camera.lookAt(center);

    if (controlsRef.current) {
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }
  };
  // switch class
  const switchToNextClass = useCallback(() => {
    const updatedProblems = [...currProblem];
    let foundActiveClass = false;
    let switched = false;

    for (let i = 0; i < updatedProblems.length; i++) {
      const problem = updatedProblems[i];
      const classes = problem.classes;

      for (let j = 0; j < classes.length; j++) {
        if (classes[j].isAnnotating) {
          foundActiveClass = true;
          classes[j].isAnnotating = false;
          if (j < classes.length - 1) {
            classes[j + 1].isAnnotating = true;
            switched = true;
            break;
          }
        }
      }

      if (foundActiveClass && !switched && i < updatedProblems.length - 1) {
        const nextProblem = updatedProblems[i + 1];
        if (nextProblem.classes.length > 0) {
          nextProblem.classes[0].isAnnotating = true;
          switched = true;
        }
      }
      if (switched) break;
    }
    if (foundActiveClass && !switched && updatedProblems.length > 0) {
      const firstProblem = updatedProblems[0];
      if (firstProblem.classes.length > 0) {
        firstProblem.classes[0].isAnnotating = true;
      }
    }
    updateProblems(updatedProblems);
  }, [currProblem, updateProblems]);

  const updateMeshColors = useCallback(() => {
    if (!meshRef.current) return;
    const geometry = meshRef.current.geometry as BufferGeometry;
    const colorAttributes = geometry.attributes.color as THREE.BufferAttribute;
    const { colors, keypoints } = modelStore.getCurrentState(modelStore.modelId);

    // Update vertex colors
    for (let i = 0; i < colorAttributes.count; i++) {
      const color = colors[i] ? new THREE.Color(colors[i].color) : new THREE.Color(0xffffff);
      colorAttributes.setXYZ(i, color.r, color.g, color.b);
    }

    // Update keypoints
    meshRef.current.children = meshRef.current.children.filter(child => !(child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry));
    keypoints.forEach(keypoint => {
      const sphere = new THREE.Mesh(KPsphereGeometry, new THREE.MeshBasicMaterial({ color: keypoint.color }));
      sphere.position.set(keypoint.position.x, keypoint.position.y, keypoint.position.z);
      meshRef.current?.add(sphere);
    });

    colorAttributes.needsUpdate = true;
  }, [modelStore]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!hotkeysEnabled) {
        return;
      }

      // Ignore key events in the input box 忽略输入框中的按键事件
      if (document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      // Creating a Hotkey String 创建热键字符串
      const keyString = [
        event.ctrlKey && 'CONTROL',
        event.shiftKey && 'SHIFT',
        event.altKey && 'ALT',
        event.key.toUpperCase()
      ].filter(Boolean).join('+');

      // Preventing default behavior 防止默认行为
      const preventDefaultFor = [
        hotkeys.zoomIn,
        hotkeys.zoomOut,
        hotkeys.rotateLeft,
        hotkeys.rotateRight,
        hotkeys.rotateUp,
        hotkeys.rotateDown,
        hotkeys.prevStep,
        hotkeys.nextStep,
        hotkeys.brush,
        hotkeys.spray,
        hotkeys.switchClass
      ];

      if (preventDefaultFor.includes(keyString)) {
        event.preventDefault();
      }

      // Tool switching hotkey handling 工具切换热键处理
      if (keyString === hotkeys.spray) {
        activateSpray();
        setSpray('#ffffff'); // Set Default Color 设置默认颜色
        return;
      }

      // Other hotkey handling 其他热键处理
      switch (keyString) {
        case hotkeys.zoomIn:
          zoomCamera(0.9);
          break;
        case hotkeys.zoomOut:
          zoomCamera(1.1);
          break;
        case hotkeys.rotateLeft:
          rotateHorizontal(-Math.PI / 32);
          break;
        case hotkeys.rotateRight:
          rotateHorizontal(Math.PI / 32);
          break;
        case hotkeys.rotateUp:
          rotateVertical(-Math.PI / 32);
          break;
        case hotkeys.rotateDown:
          rotateVertical(Math.PI / 32);
          break;
        case hotkeys.prevStep:
          modelStore.undo(modelStore.modelId);
          updateMeshColors();
          break;
        case hotkeys.nextStep:
          modelStore.redo(modelStore.modelId);
          updateMeshColors();
          break;
        case hotkeys.switchClass:
          switchToNextClass();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    hotkeys,
    hotkeysEnabled,
    zoomCamera,
    rotateHorizontal,
    rotateVertical,
    modelStore,
    switchToNextClass,
    activateSpray,
    setSpray,
    setTool,
    updateMeshColors
  ]);



  /**
   * Function to link a Class with a type of annotation and data related to annotation by annotation type.
   * @param coordinates 
   * @param color 
   * @param type 
   * @returns 
   */
  const linkAnnotationToClass = (coordinates: any, color: string, type: CoordinatesType) => {
    if (_.findIndex(currProblem, function (p) {
      return _.findIndex(p.classes, function (c) {
        return c.isAnnotating == true;
      }) != -1;
    }) == -1) return;

    var _currProblem = currProblem;

    if (!_.startsWith(color, "#"))
      color = "#".concat(color);

    _currProblem.forEach(p => {
      p.classes.forEach(c => {
        if (c.isAnnotating) {
          switch (tool) {
            case "spray":
              if (c.annotationType != AnnotationType.SPRAY) {
                c.coordinates = [];
                c.color = "";
              }

              if (!_.includes(c.coordinates, coordinates))
                c.coordinates.push(coordinates);

              c.color = color;
              c.annotationType = AnnotationType.SPRAY;
              break;
            case "keypoint":
              if (c.annotationType != AnnotationType.KEYPOINT) {
                c.coordinates = [];
                c.color = "";
              }

              c.coordinates.push(coordinates.x);
              c.coordinates.push(coordinates.y);
              c.coordinates.push(coordinates.z);

              c.color = color;
              c.annotationType = AnnotationType.KEYPOINT;
              c.isAnnotating = false;
              break;

            case "path":
              var _coordinates: PathAnnotation = _.isEmpty(c.coordinates) ? { point: [], edge: [], faces: [] } : c.coordinates[0];

              switch (type) {
                case CoordinatesType.FACE:
                  if (_.findIndex(_coordinates.faces, function (v) {
                    return (Number)(v.vertex) == (Number)(coordinates);
                  }) == -1) {
                    var temp: FaceLabel = { vertex: coordinates, color: color };

                    _coordinates.faces.push(temp);
                  }
                  break;
                case CoordinatesType.POINT:
                  if (_.findIndex(_coordinates.point, function (p) {
                    return (Number)(p.coordinates.x) == (Number)(coordinates.x) && (Number)(p.coordinates.y) == (Number)(coordinates.y) && (Number)(p.coordinates.z) == (Number)(coordinates.z);
                  }) == -1) {
                    var temp1: PointCoordinates = { x: (Number)(coordinates.x), y: (Number)(coordinates.y), z: (Number)(coordinates.z) };

                    var temp3: Point = { coordinates: temp1, color: color };
                    _coordinates.point.push(temp3);
                  }
                  break;
                case CoordinatesType.EDGE:
                  if (_.findIndex(_coordinates.edge, function (p) {
                    return (Number)(p.x) == (Number)(coordinates.x) && (Number)(p.y) == (Number)(coordinates.y) && (Number)(p.z) == (Number)(coordinates.z);
                  }) == -1) {
                    var temp2: PointCoordinates = { x: (Number)(coordinates.x), y: (Number)(coordinates.y), z: (Number)(coordinates.z) };

                    _coordinates.edge.push(temp2);
                  }
                  break;
                default:
                  break;
              }

              c.annotationType = AnnotationType.PATH;
              c.coordinates[0] = _coordinates;
              break;
            default:
              break;
          }
        }
      })
    })

    updateProblems(_currProblem);
  }

  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 15, 10]} angle={0.3} />
      <mesh ref={meshRef} onPointerDown={handleMouseDown} onPointerMove={handleMouseMove} onPointerUp={handleMouseUp} />
      <OrbitControls
        ref={orbitControlsRef}
        enableRotate={tool === 'pan'}
        enableZoom
        enablePan
        rotateSpeed={1.0}
        zoomSpeed={1.0}
        panSpeed={1.0}
        minDistance={1}
        maxDistance={100}
      />
      <lineSegments ref={wireframeRef} material={new LineBasicMaterial({ color: 'white' })} />

      {/* Render red dots- related to Shortest Path function 渲红点 */}
      <primitive object={redSphereRef.current} />

      {/* Rendering Path -Shortest Path function 渲染路径 */}
      {paths.map((path, index) => {
        //console.log(`Rendering path ${index}:`, path);
        return path && Array.isArray(path) && path.length >= 2 && (
          <Line
            key={index}
            points={formatPathForLine(path)}
            color={isPathClosed ? "blue" : "yellow"}  // Determine the color based on the closed state 根据闭合状态决定颜色
            lineWidth={2}
          />
        );
      })}

      {/* Color the current path (Yellow) 渲染当前路径（黄色） */}
      {paths.map((path, index) => (
        path && Array.isArray(path) && path.length >= 2 && (
          <Line
            key={`current-${index}`}
            points={formatPathForLine(path)}
            color="yellow"
            lineWidth={2}
          />
        )
      ))}


      {/* Rendering a closed path (blue) 渲染已闭合的路径（蓝色） */}
      {closedPath.map((path, index) => (
        path && Array.isArray(path) && path.length >= 2 && (
          <Line
            key={`closed-${index}`}
            points={formatPathForLine(path)}
            color="blue"
            lineWidth={2}
          />
        )
      ))}

      {/* Render DisplayClass if clickedPointRef is set and tool is 'arrow', then reset clickedPointRef */}
      {tool === 'arrow' && clickedPoint && (
        <Html>
          <DisplayClass clickedPoint={clickedPoint} modelName={currentFile} vertexID={vertexId} />
        </Html>
      )}



    </>
  );
};

const ModelDisplay: React.FC<{
  /**
   * The file content of the current STL file 
   */
  modelData: ArrayBuffer;
  /**
    * The data labels of the current file
    */
  currProblem: ProblemType[];
  /**
    * Update the new problem array into the centralized file array
    * @param updateProblems the updated problem array
    */
  updateProblems: (updateProblems: ProblemType[]) => void;
  /**
    * The name of the current file displaying on UI
    */
  currentFile: string | null;
  /**
    * Update the modelId and file name mapping array
    * @param mapping the new array
    */
  updateModelIDFileMapping: (mapping: ModelIDFileNameMap[]) => void;
  /**
    * Check if there are any classes that are currently allowed for annotating
    * @returns whether there are classes having the flag isAnnotating set to true
    */
  checkIfNowCanAnnotate: () => boolean;
  /**
   * Whether showingthe color selector
   */
  isShowColorSpraySelector: boolean;
  /**
    * Check whether there are any data in local storage that are under the given key
    * @param storageKey the key to be checked
    * @returns whether there are no data under the key in local storage
    */
  checkIfLocalStorageIsEmpty: (storageKey: string) => boolean;
}> = ({ modelData, currProblem, updateProblems, currentFile, updateModelIDFileMapping, checkIfNowCanAnnotate, isShowColorSpraySelector, checkIfLocalStorageIsEmpty }) => {
  return (
    <Canvas style={{ background: 'black' }}>
      <ModelContent
        modelData={modelData}
        currProblem={currProblem}
        updateProblems={updateProblems}
        currentFile={currentFile}
        updateModelIDFileMapping={updateModelIDFileMapping}
        checkIfNowCanAnnotate={checkIfNowCanAnnotate}
        isShowColorSpraySelector={isShowColorSpraySelector}
        checkIfLocalStorageIsEmpty={checkIfLocalStorageIsEmpty}
      />
    </Canvas>
  );
};

export default ModelDisplay;
