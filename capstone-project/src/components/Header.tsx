import { HelpOutline as HelpOutlineIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import { AppBar, Button, Container, Menu, MenuItem, Toolbar } from '@mui/material';
import * as _ from "lodash";
import { useState } from 'react';
import { AnnotationType, ClassDetail } from '../datatypes/ClassDetail';
import { FileAnnotation } from '../datatypes/FileAnnotation';
import { ModelIDFileNameMap } from '../datatypes/ModelIDFileNameMap';
import { OutputFile } from '../datatypes/OutputFile';
import { FaceLabel, PathAnnotation, PointCoordinates } from '../datatypes/PathAnnotation';
import { ProblemType } from '../datatypes/ProblemType';
import useModelStore from './StateStore';

export type HeaderProps = {
    /**
     * Set whether the UI shows the file pane
     * @param isShow to show the file pane or not
     */
    showDetailPane: (isShow: boolean) => void;
    /**
     * Whether the file pane is showing on the UI or not
     */
    isShowDetailPane: boolean;
    /**
     * The file name of the current file displaying on the UI
     */
    currentFile: string | null;
    /**
     * Update the centralized file list
     * @param _fileList the file array 
     */
    updateFileList: (_fileList: FileAnnotation[]) => void;
    /**
     * The file array storing all the information of the imported files, including file name, data labels and linked annotations
     */
    stlFiles: FileAnnotation[];
    /**
     * Set the file as the current file and display the 3D image on UI
     * @param _file the file to be shown
     */
    initializeCurrentFile: (_file: FileAnnotation) => void;
    /**
     * Show hotkey dialog on UI
     */
    openHotkeyDialog: () => void;//hotkey page
    /**
     * The mapping of the modelId in model-color-state and the file name
     */
    modelIDFileNameMapping: ModelIDFileNameMap[];
    /**
     * Check whether there are any data in local storage that are under the given key
     * @param storageKey the key to be checked
     * @returns whether there are no data under the key in local storage
     */
    checkIfLocalStorageIsEmpty: (storageKey: string) => boolean;
    /**
     * Local storage ID for all the data of the STL files
     */
    FileListStoargeKey: string;
};

export default function Header({ showDetailPane, isShowDetailPane, currentFile, stlFiles, updateFileList, initializeCurrentFile, openHotkeyDialog, modelIDFileNameMapping, checkIfLocalStorageIsEmpty, FileListStoargeKey }: HeaderProps) {
    const [fileAnchorEl, setFileAnchorEl] = useState<null | HTMLElement>(null);
    const [settingAnchorEl, setSettingAnchorEl] = useState<null | HTMLElement>(null);
    const { removeModel } = useModelStore();

    const fileMenuOpen = Boolean(fileAnchorEl);
    const settingMenuOpen = Boolean(settingAnchorEl);

    /**
     * Triggered when users click the file menu. Show the file menu items when triggered
     * 
     * @param event MouseEvent
     */
    const handleFileClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setFileAnchorEl(event.currentTarget);
    };

    /**
     * Close the file menu
     */
    const handleFileClose = () => {
        setFileAnchorEl(null);
    };

    /**
     * Triggered when users click the settings menu. Show the setting menu items when triggered
     * 
     * @param event MouseEvent
     */
    const handleSettingClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setSettingAnchorEl(event.currentTarget);
    };

    /**
     * Close the settings menu
     */
    const handleSettingClose = () => {
        setSettingAnchorEl(null);
    };

    /**
     * Triggered when users click the 'Import file' menu item. It helps to import more than one STL file into the application.
     */
    const handleImport = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        //only accept stl file type
        input.accept = ".stl";
        //allow choosing more than one file
        input.multiple = true;
        input.onchange = async (e) => {
            const target = e.target as HTMLInputElement;
            //get the files that users chose
            const files = target.files ? Array.from(target.files) : [];

            //when users chose one or more files
            if (files.length > 0) {
                //process the file content 
                await processFileList(files);
            }

            //close the file menu
            handleFileClose();
        };

        input.click();
    };

    /**
     * Triggered when users click the 'Import directory' menu item. It helps to import STL files inside a directory into the application.
     */
    const handleImportDirectory = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        //accept directory
        input.webkitdirectory = true;

        input.onchange = async (e) => {
            const target = e.target as HTMLInputElement;
            //the files in the directory users chose
            const files = target.files ? Array.from(target.files) : [];

            if (files.length > 0) {
                //remove files from the array which is not JSON file or STL file
                _.remove(files, function (f) {
                    return (!(_.endsWith(_.toLower(_.toString(f.name)), ".json")) && !(_.endsWith(_.toLower(_.toString(f.name)), ".stl")))
                });

                //process the file contents
                await processFileList(files);
            }
        }

        //close the file menu
        handleFileClose();

        input.click();
    }

    /**
     * Process the file content being passed to the function. The file data will be saved in a file array.
     * 
     * @param files List of STL and JSON files
     */
    const processFileList = async (files: File[]) => {
        //files that are imported before and files that are processed
        var _fileList: FileAnnotation[] = stlFiles.length == 0 ? [] : stlFiles;

        new Promise(async (resolve) => {
            //loop through each element in the file list passed into the function
            for await (const f of files) {
                //if the file is a STL file
                if ((_.endsWith(_.toLower(_.toString(f.name)), ".stl"))) {
                    //if the file is not processed yet (i.e. cannot found in _fileList)
                    if (_fileList.length == 0 || (_fileList.length > 0 && (_.findIndex(_fileList, function (x) {
                        return _.eq(x.fileName, f.name);
                    }) == -1))) {
                        var temp1: FileAnnotation = { fileName: f.name, fileObject: f, problems: [], annotated: isAnnotated(files, f.name) };

                        //if the file has data in the local storage
                        if (checkIfFileExistsInLocalStorage(f.name)) {
                            //get corresponding data from local storage
                            temp1.problems = getFileDataFromLocalStorage(f.name);

                            //reset current class
                            temp1.problems.forEach(p => {
                                p.classes.forEach(c => {
                                    c.isAnnotating = false;
                                })
                            })
                        }
                        //if the file has no data in local storage
                        else {
                            //if the file has a JSON in the directory with the same name
                            if (isAnnotated(files, f.name)) {
                                //get file from the JSON file
                                temp1.problems = await getJSONContent(_.find(files, function (_f) {
                                    //get the name of the STL file
                                    var _name: string = _.trimEnd(_.toLower(f.name), '.stl');

                                    //find the JSON file with the same name as the STL file
                                    return _.startsWith(_.toLower(_f.name), _name) && _.endsWith(_.toLower(_f.name), '.json');
                                }));
                            }
                        }

                        //push the file element into the file array
                        _fileList.push(temp1);
                    }
                }
            }

            //add filelist into local storage without overwritting the current file contents in local stroage
            addFileToLocalStorage(_fileList);

            //display the first file in the filelist and set it as the current file
            initializeCurrentFile(_fileList[0]);

            //update the global file array and the file list in the File Pane
            updateFileList(_fileList);

            //end function when the file list has data in it
            resolve(_fileList);
        })
    }

    /**
     * Add file data including file name and data labels into the local storage
     * 
     * @param _files Array of files that are already processed
     */
    const addFileToLocalStorage = (_files: FileAnnotation[]) => {
        //get data from local storage if local storage have file data, else get from passed variable
        var _fileList: FileAnnotation[] = checkIfLocalStorageIsEmpty(FileListStoargeKey) ? _files : JSON.parse(localStorage.getItem(FileListStoargeKey));

        _files.forEach(f => {
            //if the file is not exist in _fileList
            if (_.findIndex(_fileList, function (_f) {
                //return true if both file name are the same
                return _.eq(_f.fileName, f.fileName)
            }) == -1) {
                //push the file element into _fileList
                _fileList.push(f);
            }
        });

        //store the updated file array into local storage under the FileListStorageKey
        localStorage.setItem(FileListStoargeKey, JSON.stringify(_fileList));
    }

    /**
     * Check if the specific file have data in local storage
     * 
     * @param fileName the name of the file  
     * @returns whether the specific file have data in local storage
     */
    const checkIfFileExistsInLocalStorage = (fileName: string): boolean => {
        //if the local storage has no any file data
        if (checkIfLocalStorageIsEmpty(FileListStoargeKey))
            return false;

        //get the file array from local storage
        var _fileList: FileAnnotation[] = JSON.parse(localStorage.getItem(FileListStoargeKey));

        //return true if the file exists in the file array in local storage
        return _.findIndex(_fileList, function (f) {
            return _.eq(f.fileName, fileName);
        }) != -1;
    }

    /**
     * Get the data labels and annotations of the corresponding file from local storage
     * @param fileName the file name of the file
     * @returns the data labels and the linked annotation of the file
     */
    const getFileDataFromLocalStorage = (fileName: string): ProblemType[] => {
        //get all file data from local storage
        var _fileList: FileAnnotation[] = JSON.parse(localStorage.getItem(FileListStoargeKey));
        //find the corrsponding array element from the file array by file name
        var _file: FileAnnotation = _.find(_fileList, function (f) {
            return _.eq(f.fileName, fileName);
        });

        return _file.problems;
    }

    /**
     * Checking whether the corresponding file is annotated (i.e. having a JSON file associated with the same name) 
     * @param files the file object array that are imported by users
     * @param currFileName the file to check for 
     * @returns whether the file has a JSON file associated with the same name
     */
    const isAnnotated = (files: File[], currFileName: string): boolean => {
        //get the file name to check for
        var _name: string = _.trimEnd(_.toLower(currFileName), '.stl');

        //check whether there is a JSON file in the array that is the same name as the STL file
        return _.findIndex(files, function (f) {
            return _.startsWith(_.toLower(f.name), _name) && _.endsWith(_.toLower(f.name), '.json');
        }) == -1 ? false : true;
    }

    /**
     * Read the content of the file
     * @param _file the file object
     * @param content the type of the file content (e.g. text)
     * @returns the content of the file in ArrayBuffer or string
     */
    const readFileContent = async (_file: File, content: string): Promise<any> => {
        var r: any;
        const reader = new FileReader();

        //check the type of the content
        switch (content) {
            case "text":
            default:
                reader.readAsText(_file);
                break;
        }

        return new Promise(async (resolve) => {
            reader.onload = async () => {
                r = reader.result;
                //terminate the process until the reader result is written into r
                resolve(await r);
            }
        })
    }

    /**
     * Read the stored data labels and linked annotations in the JSON file
     * @param _file the file object of the JSON file
     * @returns the stored data labels and linked annotations
     */
    const getJSONContent = async (_file: File): Promise<ProblemType[]> => {
        var fileContent: string;
        var problem: ProblemType[] = [];

        //read the content in the JSON file
        await readFileContent(_file, "text").then((res) => {
            fileContent = _.toString(res);
        })

        //parse the read content into JSON
        var jsonObj = JSON.parse(fileContent);

        //get the data labels part
        var _problems: any = jsonObj["problems"];

        for (var i in _problems) {
            var temp: ProblemType = { name: "", classes: [] };

            for (var j in _problems[i]) {
                //get the name of the problem
                temp.name = j;

                var _className: string[] = [];
                var _color: string[] = [];
                var spray: any[][] = [];
                var keypoint: any[] = [];
                var edge: any[] = [];

                for (var x in _problems[i][j]) {
                    for (var y in _problems[i][j][x]) {
                        var _mapping: any = _problems[i][j][x][y];

                        //if the key is 'label_mapping'
                        if (_.eq(_.toString(y), "label_mapping")) {
                            for (var z in Object.values(_mapping)) {
                                //get the name of the class
                                var tempClassName: string = _.toString(Object.values(_mapping[z])[0]);

                                //push the class name into the class name array if the key of the current JSON object is not '-1'
                                if (!_.eq((_.toString(Object.keys(_mapping[z])[0])), "-1")) {
                                    _className.push(tempClassName);
                                }
                            }
                            //if the key is 'color_mapping'
                        } else if (_.eq(_.toString(y), "color_mapping")) {
                            for (var z in Object.values(_mapping)) {
                                //push the color value of the label into the color array if the key is not '-1'
                                if (!_.eq((_.toString(Object.keys(_mapping[z])[0])), "-1")) {
                                    _color.push(_.toString(Object.values(_mapping[z])[0]));
                                }
                            }
                            //if the key is 'face_labels'
                        } else if (_.eq(_.toString(y), "face_labels")) {
                            for (var z in Object.values(_mapping)) {
                                //get the vertex stored in the file and transform it into array if the key is not '-1', else just initialize the array 
                                var sprayVertex: any[] = _.eq((_.toString(Object.values(_mapping[z])[0])), "-1") ? [] : _.toString(Object.values(_mapping[z])[0]).split(", ");

                                //if sprayVertex is not empty
                                if (!_.isEmpty(sprayVertex)) {
                                    sprayVertex.forEach(v => {
                                        //change the datatype of each element to int
                                        v = parseInt(v.toString());
                                    });
                                }

                                spray.push(sprayVertex);
                            }
                            //if the key is 'point_labels'
                        } else if (_.eq(_.toString(y), "point_labels")) {
                            for (var z in Object.values(_mapping)) {
                                //get the coordinates stored in the file and transform it into array if the key is not '-1', else just initialize the array
                                var point: any[] = _.eq((_.toString(Object.values(_mapping[z])[0])), "-1") ? [] : _.toString(Object.values(_mapping[z])[0]).split(", ");

                                //if point is not empty
                                if (!_.isEmpty(point)) {
                                    point.forEach(v => {
                                        //change the datatype of each element to float
                                        v = parseFloat(v.toString());
                                    });
                                }

                                keypoint.push(point);
                            }
                            //if the key is 'edge_labels'
                        } else if (_.eq(_.toString(y), "edge_labels")) {
                            for (var z in Object.values(_mapping)) {
                                //get the coordinates stored in the file and transform it into array if the key is not '-1', else just initialize the array
                                var _edge: any[] = _.eq((_.toString(Object.values(_mapping[z])[0])), "-1") ? [] : _.toString(Object.values(_mapping[z])[0]).split(", ");

                                //if the edge is not empty
                                if (!_.isEmpty(_edge)) {
                                    _edge.forEach(v => {
                                        //change the datatype of each element to float
                                        v = parseFloat(v.toString());
                                    });
                                }

                                edge.push(_edge);
                            }
                        }
                    }
                }

                _className.forEach((c, x) => {
                    //initalize the label using the name and color
                    var _class: ClassDetail = { name: c, annotationType: AnnotationType.NONE, coordinates: [], color: _color.at(x), isAnnotating: false };

                    //if the edge array is not empty and the array of the current element of edge array is not empty
                    if (!_.isEmpty(edge) && edge.at(x).length > 0) {
                        var _path: PathAnnotation = { point: [], edge: [], faces: [] };

                        if (!_.isEmpty(keypoint) && keypoint.at(x).length > 0) {
                            //loop through the corresponding array element of keypoint array three by three (x, y, z coordinates)
                            for (var i = 0; i < keypoint.at(x).length; i += 3) {
                                //get the point of the path annotations and the (x, y, z) coordinates of the point
                                var _point: PointCoordinates = { x: (Number)(keypoint.at(x)[i]), y: (Number)(keypoint.at(x)[i + 1]), z: (Number)(keypoint.at(x)[i + 2]) };

                                //push the point into the point array into the path annotation and set the point color as red
                                _path.point.push({ coordinates: _point, color: "#FF0000" });
                            }
                        }

                        //loop through the corresponding array element of edge array three by three
                        for (var i = 0; i < edge.at(x).length; i += 3) {
                            //get the(x, y, z) coordinates of the edge of the path 
                            var _edge: PointCoordinates = { x: (Number)(edge.at(x)[i]), y: (Number)(edge.at(x)[i + 1]), z: (Number)(edge.at(x)[i + 2]) };

                            //push the edge coordinates into the edge array of the path annotation
                            _path.edge.push(_edge);
                        }

                        if (!_.isEmpty(spray) && spray.at(x).length > 0) {
                            //loop through the corresponding array element element of the spray array
                            spray.at(x).forEach(f => {
                                //get the vertex index and color of the faces 
                                var _face: FaceLabel = { vertex: (Number)(f), color: _class.color };

                                //push the vertex indexes into the face array of the path annotation
                                _path.faces.push(_face);
                            })
                        }

                        //push the path annotation into the coordinates attribute of the label
                        _class.coordinates.push(_path);
                        //set the annotation type of the label to path
                        _class.annotationType = AnnotationType.PATH;
                        //if the spray array is not empty and the array of the current element of the spray element is not empty
                    } else if (!_.isEmpty(spray) && spray.at(x).length > 0) {
                        //push the vertex indexes into the coordinates attribute of the label
                        _class.coordinates = spray.at(x);

                        //set the annotation type of the label to spray
                        _class.annotationType = AnnotationType.SPRAY;
                        //if the keypoint array is not empty and the array of the current element of the keypoint array is not empty
                    } else if (!_.isEmpty(keypoint) && keypoint.at(x).length > 0) {
                        //push the point array into the coordinates attribute o the label
                        _class.coordinates = keypoint.at(x);

                        //set the annotation type of the label to keypoint
                        _class.annotationType = AnnotationType.KEYPOINT;
                    }

                    //push the label into the problem
                    temp.classes.push(_class);
                })
            }

            //push the problem into the problem array
            problem.push(temp);
        }

        return problem;
    }

    /**
     * Removed the corresponding file from the file list and local storage after users generate a JSON file for the file 
     * @param fileName the name of the file that the JSON file from
     */
    const removeFile = (fileName: string) => {
        var _stlFiles: FileAnnotation[] = stlFiles;

        //get the index of the corresponding from the file array
        var index = _.findIndex(_stlFiles, function (f) {
            return _.eq(f.fileName, fileName);
        });

        //remove the corresponding file from file array by checking the file name
        _.remove(_stlFiles, function (f) {
            return _.eq(f.fileName, fileName);
        });

        //update the file array 
        updateFileList(_stlFiles);

        //if the file array is not empty
        if (_stlFiles.length > 0) {
            //set the first file in the file array as the current file
            initializeCurrentFile(_stlFiles.at(0));
        }

        //remove the file from the file array in local storage
        removeFileFromLocalStorage(fileName);
    }

    /**
     * Remove file data of the corresponding file from local storage
     * @param fileName the name of the file need to be removed
     */
    const removeFileFromLocalStorage = (fileName: string) => {
        //get the modelId of the file
        var currModelID: string = _.find(modelIDFileNameMapping, function (m) {
            return _.eq(m.fileName, currentFile);
        }).modelID;

        //remove the file data from the local storage 'model-color-state'
        removeModel(currModelID);

        //check if local storage have any data under the key 'stlFileData', if no, early terminate
        if (checkIfLocalStorageIsEmpty(FileListStoargeKey))
            return;

        //get the file array from local stroage 
        var _fileList: FileAnnotation[] = JSON.parse(localStorage.getItem(FileListStoargeKey));

        //pop the corresponding file element from the array by checking the file name
        _.remove(_fileList, function (f) {
            return _.eq(f.fileName, fileName)
        });

        //update the new file array to local storage
        localStorage.setItem(FileListStoargeKey, JSON.stringify(_fileList));
    }

    /**
     * Trigger when users click the 'Save' menu item. Generates a JSON file for the current file.
     */
    const handleSave = () => {
        //get the current file element from the file array by file name
        var currFile: FileAnnotation = _.find(stlFiles, function (f) {
            return _.eq(f.fileName, currentFile);
        });

        //get the JSON string of the data labels and linked annotations of the current file
        var currProblems: string = convertToJSONFileFormat(currFile.problems);
        //format the JSON file content 
        var currOutput: OutputFile = { fileName: currFile.fileName, problems: currProblems };

        //get the JSON string of the processed file content
        const jsonData = JSON.stringify(currOutput, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const link = document.createElement('a');

        link.href = URL.createObjectURL(blob);
        //create the file name using the file name of the current file
        link.download = _.trimEnd(currFile.fileName, ".stl").concat(".json");
        link.click();

        //remove the file from the file list and local storage
        removeFile(currentFile);
        //close the file menu
        handleFileClose();
    };

    /**
     * Convert the data labels and linked annotations to JSON string for generating JSON file 
     * @param problems the data labels to be saved
     * @returns the converted JSON string
     */
    const convertToJSONFileFormat = (problems: ProblemType[]): string => {
        var result: Record<string, any>[] = [];

        problems.forEach(p => {
            var labelMapping: Record<string, string>[] = [];
            var colorMapping: Record<string, string>[] = [];
            var pointLabels: Record<string, string>[] = [];
            var faceLabels: Record<string, string>[] = [];
            var edgeLabels: Record<string, string>[] = [];

            //create a class for unlabelled coordinates
            labelMapping.push({ "-1": "unlabelled" });

            //if the current problem has classes associated
            if (!_.isEmpty(p.classes)) {
                p.classes.forEach((c, j) => {
                    var index: string = j.toString();
                    var labelName: string = c.name;
                    var colorCode: string = _.isEmpty(c.color) ? "" : c.color;

                    switch (c.annotationType) {
                        //if the annotation type of the current label is keypoint
                        case AnnotationType.KEYPOINT:
                            //no annotations for face labels and edge labels
                            faceLabels.push({ [index]: "-1" });
                            edgeLabels.push({ [index]: "-1" });

                            var _points: string = "";

                            for (let i = 0; i < c.coordinates.length; i += 3) {
                                var temp: any[] = [(c.coordinates)[i], (c.coordinates)[i + 1], (c.coordinates)[i + 2]];

                                //link all coordinates together using comma
                                _points = _points.concat(_.join(temp, ", "), (i + 3) == c.coordinates.length ? "" : ", ");
                            }

                            pointLabels.push({ [index]: _points });
                            break;
                        //if the annotation type of the current label is spray
                        case AnnotationType.SPRAY:
                            //no annotations for point labels and edge labels
                            pointLabels.push({ [index]: "-1" });
                            edgeLabels.push({ [index]: "-1" });

                            //link all vertex indexes together using comman
                            faceLabels.push({ [index]: _.join(c.coordinates, ", ") });
                            break;
                        //if the annotation type of the current label path
                        case AnnotationType.PATH:
                            //one label could only have one annotation
                            var _path: PathAnnotation = c.coordinates[0];

                            var _pathPoints: string = "";

                            _path.point.forEach((_p, i) => {
                                var temp1: any[] = [_p.coordinates.x, _p.coordinates.y, _p.coordinates.z];
                                
                                //link all point coordinates using comma
                                _pathPoints = _pathPoints.concat(_.join(temp1, ", "), (i + 1) == _path.point.length ? "" : ", ");
                            });

                            pointLabels.push({ [index]: _pathPoints });

                            var _edgePoints: string = "";

                            _path.edge.forEach((e, i) => {
                                var temp2: any[] = [e.x, e.y, e.z];

                                //link all edge coordinates using comma
                                _edgePoints = _edgePoints.concat(_.join(temp2, ", "), (i + 1) == _path.edge.length ? "" : ", ");
                            });

                            edgeLabels.push({ [index]: _edgePoints });

                            var _faceVertex: string = "";

                            _path.faces.forEach((f, i) => {
                                //link all face vertex indexes using comma
                                _faceVertex = _faceVertex.concat(f.vertex.toString(), (i + 1) == _path.faces.length ? "" : ", ");
                            });

                            faceLabels.push({ [index]: _faceVertex });

                            //set the color of the annotation according to the color of the faces colored
                            colorCode = _path.faces[0].color;
                            break;
                        case AnnotationType.NONE:
                        default:
                            //no annotations 
                            pointLabels.push({ [index]: "-1" });
                            faceLabels.push({ [index]: "-1" });
                            edgeLabels.push({ [index]: "-1" })
                            break;
                    }

                    labelMapping.push({ [index]: labelName });
                    colorMapping.push({ [index]: colorCode });
                });
            }

            var problemDetails: Record<string, any>[] = [{ "label_mapping": labelMapping }, { "color_mapping": colorMapping },
            { "face_labels": faceLabels }, { "point_labels": pointLabels }, { "edge_labels": edgeLabels }];
            var _problemName: string = p.name;

            result.push({ [_problemName]: problemDetails });
        });

        return JSON.parse(JSON.stringify(result));
    }

    return (
        <div>
            <AppBar position="static" id="header">
                <Toolbar variant="dense" sx={{ flexGrow: 1 }}>
                    <Container sx={{ flexGrow: 1, display: 'block' }}>
                        <span>
                            <Button
                                id="file-dropdown"
                                aria-controls={fileMenuOpen ? 'file-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={fileMenuOpen ? 'true' : undefined}
                                onClick={handleFileClick}
                            >
                                File
                            </Button>
                            <Menu
                                id="file-menu"
                                anchorEl={fileAnchorEl}
                                open={fileMenuOpen}
                                onClose={handleFileClose}
                            >
                                <MenuItem onClick={handleImport}>Import File</MenuItem>
                                <MenuItem onClick={handleImportDirectory}>Import Directory</MenuItem>
                                <MenuItem onClick={handleSave}>Save</MenuItem>
                            </Menu>
                        </span>
                        <span>
                            <Button
                                id="setting-dropdown"
                                aria-controls={settingMenuOpen ? 'setting-menu' : undefined}
                                aria-haspopup="true"
                                aria-expanded={settingMenuOpen ? 'true' : undefined}
                                onClick={handleSettingClick}
                            >
                                Settings
                            </Button>
                            <Menu
                                id="setting-menu"
                                anchorEl={settingAnchorEl}
                                open={settingMenuOpen}
                                onClose={handleSettingClose}
                            >
                                <MenuItem onClick={openHotkeyDialog}>Preferences</MenuItem>
                            </Menu>
                        </span>
                    </Container>
                    <div>
                        <Button id="documentation-icon">
                            <HelpOutlineIcon />
                        </Button>
                        <Button id="detail-icon" onClick={() => {
                            showDetailPane(!isShowDetailPane);
                        }}>
                            <MoreVertIcon />
                        </Button>
                    </div>
                </Toolbar>
            </AppBar>


        </div>
    );
}