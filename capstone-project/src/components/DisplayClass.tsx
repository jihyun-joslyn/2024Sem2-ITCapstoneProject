import React, { useEffect, useState } from 'react';

type DisplayClassProps = {
  clickedPoint: { x: number; y: number; z: number }; // Coordinates of the clicked point
  modelName: string; // Name of the current model (STL file name)
  vertexID: number | 0; // ID of the vertex or zero by default
};
/* This functions is in charge of display a Class name label of annotated area of the model, 
  * it receives as parameter
  * the clicked point coordinates and also the index vertex of that clicked point and 
  * check on the stlFileData local storage by Problem and Class if the mouse clicked 
    area/point is part of an annotated class, it is used distance between 2 points as radio tolerance for considering the clicked point as part of annotated area.
  *
*/
const DisplayClass: React.FC<DisplayClassProps> = ({ clickedPoint, modelName, vertexID }) => {
  const [className, setClassName] = useState<string | null>(null);
  const [showSticker, setShowSticker] = useState<boolean>(false); // State to control sticker visibility

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

    if (modelData) {
      // Flag to control loop exit
      let found = false;

      // Loop through each problem (if any) in the modelData
      for (const problem of modelData.problems) {
        // Loop through each class in the problem
        for (const annotationClass of problem.classes) {
          // Handle different annotation types
          switch (parseInt(annotationClass.annotationType, 10)) {

            case 0: // Handle type 0 annotations (generated by KeyPoint annotation)
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
            case 1: // Handle type 1 annotations (generated by Spray Annotation) In this case we compare if the vertexID of the clicked point is on the Spray vertex list.
              if (Array.isArray(annotationClass.coordinates)) {
                // Check if the vertexID exists in the coordinates
                for (const vertex of annotationClass.coordinates) {

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
            case 2: // Handle type 2 annotations (generated by Shortest path, since it safe 3 type of annotation info, we use just Edge data to compare)
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
              break;
            default:
              break;
          }
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
