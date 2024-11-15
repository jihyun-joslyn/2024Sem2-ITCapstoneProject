import React, { useEffect, useState } from 'react';

type DisplayClassProps = {
  clickedPoint: { x: number; y: number; z: number }; // Coordinates of the clicked point
  modelName: string; // Name of the current model (STL file name)
  vertexID: number | 0; // ID of the vertex (or null if not available)
};

const DisplayClass: React.FC<DisplayClassProps> = ({ clickedPoint, modelName, vertexID }) => {
  const [className, setClassName] = useState<string | null>(null);
  const [showSticker, setShowSticker] = useState<boolean>(false); // State to control sticker visibility

  console.log("I am in DisplayClass, vertexID: ", vertexID);

  // Helper function to calculate the Euclidean distance between two points
  const distanceBetweenPoints = (
    pointA: { x: number; y: number; z: number } | null,
    pointB: { x: number; y: number; z: number } | null
  ) => {
    if (!pointA || !pointB) return Infinity; // Return a large value if either point is null

    return Math.sqrt(
      Math.pow(pointA.x - pointB.x, 2) +
      Math.pow(pointA.y - pointB.y, 2) +
      Math.pow(pointA.z - pointB.z, 2)
    );
  };

  // Set a threshold distance (e.g., 0.2 units) for considering a click to be "close enough"
  const THRESHOLD = 0.8;

  // Search in local storage for STL file data and find the annotation class containing the clicked point
  useEffect(() => {
    if (!clickedPoint) return; // Exit if clickedPoint is null

    const stlFileData = JSON.parse(localStorage.getItem('stlFileData') || '[]');

    // Find the specific model data from the stlFileData array
    const modelData = stlFileData.find((file: any) => file.fileName === modelName);
    console.log("finding model data: ", modelData);

    if (modelData) {
      // Flag to control loop exit
      let found = false;

      // Loop through each problem (if any) in the modelData
      for (const problem of modelData.problems) {
        // Loop through each class in the problem
        for (const annotationClass of problem.classes) {
          console.log("type of annotation: ", annotationClass.annotationType);


          // Handle different annotation types
          switch (parseInt(annotationClass.annotationType, 10)) {

            case 0: // Handle type 0 annotations (single coordinate)
              if (Array.isArray(annotationClass.coordinates)) {
                // Convert coordinates from string to number
                const x = parseFloat(annotationClass.coordinates[0]);
                const y = parseFloat(annotationClass.coordinates[1]);
                const z = parseFloat(annotationClass.coordinates[2]);

                // Create a point object for the coordinate
                const coordinate = { x, y, z };

                // Check if the clicked point is within the threshold distance
                if (distanceBetweenPoints(clickedPoint, coordinate) <= THRESHOLD) {
                  setClassName(annotationClass.name);
                  setShowSticker(true);
                  setTimeout(() => {
                    setShowSticker(false);
                  }, 3000);
                  found = true; // Mark that a match was found
                  return; // Exit once a match is found
                }
              }
              break;

            case 1: // Handle type 1 annotations (faces or vertex indices)

              if (Array.isArray(annotationClass.coordinates)) {
                // Check if the vertexID exists in the coordinates
                for (const vertex of annotationClass.coordinates) {
                  console.log("vertex of local: ", vertex);

                  // Compare vertexID with the value in coordinates (no need for index)
                  if (vertexID === vertex) {// Check if the vertexID matches the index in the annotation class
                    setClassName(annotationClass.name);
                    setShowSticker(true);
                    setTimeout(() => {
                      setShowSticker(false);
                    }, 3000);
                    found = true;
                    break; // Exit the loop when a match is found
                  }
                }
              }
              break;

            case 2: // Handle type 2 annotations (edges, faces, and points)
              if (annotationClass.coordinates) {
                // Handle edge points
                for (const coordinate of annotationClass.coordinates) {
                  if (coordinate.edge) {
                    for (const edgePoint of coordinate.edge) {
                      if (distanceBetweenPoints(clickedPoint, edgePoint) <= THRESHOLD) {
                        setClassName(annotationClass.name);
                        setShowSticker(true);
                        setTimeout(() => setShowSticker(false), 3000);
                        found = true;
                        break; // Break out of the edge loop
                      }
                    }
                  }
                  if (found) break; // Exit the loop if found
                }
              }

            /*if (!found && annotationClass.faces) {
              // Handle faces (vertex indices)
              for (const face of annotationClass.faces) {
                const vertexCoordinates = modelData.vertices.filter((vertex: any) =>
                  face.vertex.includes(vertex.index)
                );
                for (const vertex of vertexCoordinates) {
                  if (distanceBetweenPoints(clickedPoint, vertex) <= THRESHOLD) {
                    setClassName(annotationClass.name);
                    setShowSticker(true);
                    setTimeout(() => {
                      setShowSticker(false);
                    }, 3000);
                    found = true;
                    break; // Break out of the vertex loop
                  }
                }
                if (found) break; // Exit the loop if found
              }
            }*/

            /*if (!found && annotationClass.point) {
              // Handle points
              for (const point of annotationClass.point) {
                if (distanceBetweenPoints(clickedPoint, point.coordinates) <= THRESHOLD) {
                  setClassName(annotationClass.name);
                  setShowSticker(true);
                  setTimeout(() => {
                    setShowSticker(false);
                  }, 3000);
                  found = true;
                  break; // Break out of the point loop
                }
              }
            }
            break;*/

            default:
              break;
          }
          //if (found) break; // Exit the outer loop if found
        }
        if (found) break; // Exit the outer loop if found
      }
    }
  }, [clickedPoint, modelName]);

  return (
    <div>
      {showSticker && className && (
        <div
          className="sticker"
          style={{
            top: `${clickedPoint.y + 1}px`, // Adjust based on clickedPoint
            left: `${clickedPoint.x + 1}px`, // Adjust based on clickedPoint
          }}
        >
          {className} {/* Display the class name as a sticker */}
        </div>
      )}
    </div>
  );
};

export default DisplayClass;
