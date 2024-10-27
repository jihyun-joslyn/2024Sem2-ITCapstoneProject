import { HelpOutline as HelpOutlineIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import { AppBar, Button, Container, Menu, MenuItem, Toolbar } from '@mui/material';
import * as _ from "lodash";
import { useState, useRef, MutableRefObject } from 'react';
import { FileAnnotation } from '../datatypes/FileAnnotation';
import { OutputFile } from '../datatypes/OutputFile';
import { ProblemType } from '../datatypes/ProblemType';
import { AnnotationType, ClassDetail } from '../datatypes/ClassDetail';
import * as THREE from 'three';
import { Mesh } from 'three';
import { convertProblemsToRecord } from '../utils/annotationUtils';


export type HeaderProps = {
    showDetailPane: (isShow: boolean) => void;
    isShowDetailPane: boolean;
    currentFile: string | null;
    updateFileList: (_fileList: FileAnnotation[]) => void;
    stlFiles: FileAnnotation[];
    initializeCurrentFile: (_file: FileAnnotation) => void
    openHotkeyDialog: () => void;
    meshRef: MutableRefObject<Mesh | null>//hotkey page
};

export default function Header({ showDetailPane, isShowDetailPane, currentFile, stlFiles, updateFileList, initializeCurrentFile,openHotkeyDialog, meshRef
}: HeaderProps) {
    const [fileAnchorEl, setFileAnchorEl] = useState<null | HTMLElement>(null);
    const [settingAnchorEl, setSettingAnchorEl] = useState<null | HTMLElement>(null);

    const fileMenuOpen = Boolean(fileAnchorEl);
    const settingMenuOpen = Boolean(settingAnchorEl);
    const FileListStoargeKey: string = "stlFileData";

    const handleFileClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setFileAnchorEl(event.currentTarget);
    };

    const handleFileClose = () => {
        setFileAnchorEl(null);
    };

    const handleSettingClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setSettingAnchorEl(event.currentTarget);
    };

    const handleSettingClose = () => {
        setSettingAnchorEl(null);
    };

    const handleImport = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = ".stl";
        input.multiple = true;
        input.onchange = async (e) => {

            const target = e.target as HTMLInputElement;
            const files = target.files ? Array.from(target.files) : [];

            if (files.length > 0) {
                await processFileList(files);
            }

            handleFileClose();
        };
        input.click();
    };

    const handleImportDirectory = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;

        input.onchange = async (e) => {
            const target = e.target as HTMLInputElement;
            const files = target.files ? Array.from(target.files) : [];

            if (files.length > 0) {
                _.remove(files, function (f) {
                    return (!(_.endsWith(_.toLower(_.toString(f.name)), ".json")) && !(_.endsWith(_.toLower(_.toString(f.name)), ".stl")))
                });

                await processFileList(files);
            }
        }

        handleFileClose();

        input.click();
    }

    const processFileList = async (files: File[]) => {
        var _fileList: FileAnnotation[] = stlFiles.length == 0 ? [] : stlFiles;

        new Promise(async (resolve) => {
            for await (const f of files) {
                if ((_.endsWith(_.toLower(_.toString(f.name)), ".stl"))) {
                    if (_fileList.length == 0 || _fileList.length > 0 && (_.findIndex(_fileList, function (x) {
                        return _.eq(x.fileName, f.name);
                    }) == -1)) {
                        var temp1: FileAnnotation = { fileName: f.name, fileObject: f, problems: [], annotated: isAnnotated(files, f.name) };

                        if (checkIfFileExistsInLocalStorage(f.name)) { 
                            temp1.problems = getFileDataFromLocalStorage(f.name);

                            //reset current class
                            temp1.problems.forEach(p => {
                                p.classes.forEach(c => {
                                    c.isAnnotating = false;
                                })
                            })
                        }
                        else {
                            if (isAnnotated(files, f.name))
                                temp1.problems = await getJSONContent(_.find(files, function (_f) {
                                    var _name: string = _.trimEnd(_.toLower(f.name), '.stl');

                                    return _.startsWith(_.toLower(_f.name), _name) && _.endsWith(_.toLower(_f.name), '.json');
                                }))
                        }
                        _fileList.push(temp1);
                    }
                }
            }

            if (checkIfLocalStorageIsEmpty(FileListStoargeKey))
                localStorage.setItem(FileListStoargeKey, JSON.stringify(_fileList));
            else 
                addFileToLocalStorage(_fileList);

            initializeCurrentFile(_fileList[0]);

            updateFileList(_fileList);

            resolve(_fileList);
        })
    }

    const addFileToLocalStorage = (_files: FileAnnotation[]) => {
        if (checkIfLocalStorageIsEmpty(FileListStoargeKey))
            return;

        var _fileList: FileAnnotation[] = JSON.parse(localStorage.getItem(FileListStoargeKey));

        _files.forEach(f => {
            if (_.findIndex(_fileList, function(_f) {
                return _.eq(_f.fileName, f.fileName)
            }) == -1) {
                _fileList.push(f);
            }
        });

        localStorage.setItem(FileListStoargeKey, JSON.stringify(_fileList));
    }

    const checkIfLocalStorageIsEmpty = (storageKey: string): boolean => {
        if (_.isUndefined(localStorage.getItem(storageKey)) || _.isNull(localStorage.getItem(storageKey)))
            return true;
        else
            return false;
    }

    const checkIfFileExistsInLocalStorage = (fileName: string): boolean => {
        if (checkIfLocalStorageIsEmpty(FileListStoargeKey))
            return false;

        var _fileList: FileAnnotation[] = JSON.parse(localStorage.getItem(FileListStoargeKey));

        return _.findIndex(_fileList, function (f) {
            return _.eq(f.fileName, fileName);
        }) != -1;
    }

    const getFileDataFromLocalStorage = (fileName: string): ProblemType[] => {
        var _fileList: FileAnnotation[] = JSON.parse(localStorage.getItem(FileListStoargeKey));
        var _file : FileAnnotation = _.find(_fileList, function (f) {
            return _.eq(f.fileName, fileName);
        });

        return _file.problems;
    }

    const isAnnotated = (files: File[], currFileName: string): boolean => {
        var _name: string = _.trimEnd(_.toLower(currFileName), '.stl');

        return _.findIndex(files, function (f) {
            return _.startsWith(_.toLower(f.name), _name) && _.endsWith(_.toLower(f.name), '.json');
        }) == -1 ? false : true;
    }

    const readFileContent = async (_file: File, content: string): Promise<any> => {
        var r: any;
        const reader = new FileReader();

        switch (content) {
            case "text":
            default:
                reader.readAsText(_file);
                break;
        }

        return new Promise(async (resolve) => {
            reader.onload = async () => {
                r = reader.result;
                resolve(await r);
            }
        })
    }

    const getJSONContent = async (_file: File): Promise<ProblemType[]> => {
        var fileContent: string;
        var problem: ProblemType[] = [];

        await readFileContent(_file, "text").then((res) => {
            fileContent = _.toString(res);
        })

        var jsonObj = JSON.parse(fileContent);

        var _problems: any = jsonObj["problems"];

        for (var i in _problems) {
            var temp: ProblemType = { name: "", classes: [] };

            for (var j in _problems[i]) {
                temp.name = j;

                var _className: string[] = [];
                var _color: string[] = [];
                var spray: any[][] = [];
                var keypoint: any[] = [];

                for (var x in _problems[i][j]) {
                    for (var y in _problems[i][j][x]) {
                        var _mapping: any = _problems[i][j][x][y];

                        if (_.eq(_.toString(y), "label_mapping")) {
                            for (var z in Object.values(_mapping)) {
                                var tempClassName: string = _.toString(Object.values(_mapping[z])[0]);

                                if (!_.eq((_.toString(Object.keys(_mapping[z])[0])), "-1")) {
                                    _className.push(tempClassName);
                                }
                            }
                        } else if (_.eq(_.toString(y), "color_mapping")) {
                            for (var z in Object.values(_mapping)) {
                                if (!_.eq((_.toString(Object.keys(_mapping[z])[0])), "-1")) {
                                    _color.push(_.toString(Object.values(_mapping[z])[0]));
                                }
                            }
                        } else if (_.eq(_.toString(y), "face_labels")) {
                            for (var z in Object.values(_mapping)) {
                                var sprayVertex: any[] = _.eq((_.toString(Object.values(_mapping[z])[0])), "-1") ? [] : _.toString(Object.values(_mapping[z])[0]).split(", ");

                                if (!_.isEmpty(sprayVertex))
                                    sprayVertex.forEach(v => {
                                        v = parseInt(v.toString());
                                    })

                                spray.push(sprayVertex);
                            }
                        } else if (_.eq(_.toString(y), "point_labels")) {
                            for (var z in Object.values(_mapping)) {
                                var point: any[] = _.eq((_.toString(Object.values(_mapping[z])[0])), "-1") ? [] : _.toString(Object.values(_mapping[z])[0]).split(", ");

                                if (!_.isEmpty(point))
                                    point.forEach(v => {
                                        v = parseFloat(v.toString());
                                    })

                                keypoint.push(point);
                            }
                        }
                    }
                }

                _className.forEach((c, x) => {
                    var _class: ClassDetail = { name: c, annotationType: AnnotationType.NONE, coordinates: [], color: _color.at(x), isAnnotating: false };

                    if (spray.at(x).length > 0) {
                        _class.coordinates = spray.at(x);

                        _class.annotationType = AnnotationType.SPRAY
                    } else if (keypoint.at(x).length > 0) {
                        _class.coordinates = keypoint.at(x);

                        _class.annotationType = AnnotationType.KEYPOINT;
                    }

                    temp.classes.push(_class);
                })
            }

            problem.push(temp);
        }

        return problem;
    }

    const removeFileFromLocalStorage = (fileName: string) => {
        var _stlFiles: FileAnnotation[] = stlFiles;

        _.remove(_stlFiles, function(f) {
            return _.eq(f.fileName, fileName);
        })

        localStorage.setItem(FileListStoargeKey, JSON.stringify(_stlFiles));
    }

    const validateAnnotations = (geometry: THREE.BufferGeometry, states: Record<number, string>) => {
        const totalVertices = geometry.attributes.position.count;
        const unannotatedVertices: number[] = [];
    
        for (let i = 0; i < totalVertices; i++) {
            if (!states[i]) {
                unannotatedVertices.push(i);
            }
        }
    
        return unannotatedVertices;
    };
    
    const checkAndWarnAnnotations = (
        geometry: THREE.BufferGeometry,
        states: Record<number, string>,
        onContinue: () => void,
        onCancel: () => void
    ) => {
        const unannotatedVertices = validateAnnotations(geometry, states);
    
        if (unannotatedVertices.length > 0) {
            const proceed = window.confirm(`Warning: There are unannotated vertices. Do you want to continue ?`);
            if (proceed) {
                onContinue();
            } else {
                onCancel();
            }
        } else {
            onContinue();
        }
    };
    
    const generateJsonWithUnlabeled = (
        geometry: THREE.BufferGeometry,
        states: Record<number, string>,
        fileName: string,
        problems: ProblemType[]
      ) => {
        const totalVertices = geometry.attributes.position.count;
        const jsonOutput: any = {
          filename: fileName,
          problems: {}
        };
      
        problems.forEach(problem => {
          const problemName = problem.name;
          const labelMapping: Record<string, string> = { "-1": "unlabelled" }; 
          const pointLabels: number[] = []; 
          const loops: number[] = []; 
    
          problem.classes.forEach((cls, index) => {
            const classKey = index.toString();  
            labelMapping[classKey] = cls.name;
          });
    
          for (let i = 0; i < totalVertices; i++) {
            const vertexState = states[i];
            if (vertexState && vertexState !== "-1") {
              pointLabels.push(i);
            }
          }
    
          jsonOutput.problems[problemName] = {
            label_mapping: labelMapping,
            point_labels: pointLabels,
            loops: loops
          };
        });
    
        const jsonData = JSON.stringify(jsonOutput, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName.replace(".stl", ".json");
        link.click();
    
        return jsonOutput;
      };

      const handleSave = () => {
        const currFile: FileAnnotation | undefined = _.find(stlFiles, function (f) {
            return _.eq(f.fileName, currentFile);
        });
    
        if (!currFile) {
            console.error('Current file not found');
            return;
        }
    
        if (!meshRef.current) {
            console.error('Mesh reference not found');
            return;
        }
    
        const geometry = meshRef.current.geometry;
        if (!geometry) {
            console.error('Geometry not found on mesh');
            return;
        }
    
        console.log("Geometry loaded:", geometry);
        console.log("Current file problems:", currFile.problems);
    
        const problemsRecord = convertProblemsToRecord(currFile.problems);
        console.log("Converted problems record:", problemsRecord);
    
        checkAndWarnAnnotations(
            geometry,
            problemsRecord,
            () => {
               
                var currProblems: string = convertToJSONFileFormat(currFile.problems);
                var currOutput: OutputFile = { fileName: currFile.fileName, problems: currProblems };
    
                const jsonData = JSON.stringify(currOutput, null, 2);
                const blob = new Blob([jsonData], { type: 'application/json' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = _.trimEnd(currFile.fileName, ".stl").concat(".json");
                link.click();
    
                // Optionally remove the file from local storage if required
                removeFileFromLocalStorage(currentFile);
    
                console.log("Generated JSON output:", currOutput);
                console.log("User chose to continue. Proceeding...");
            },
            () => {
                console.log("User chose to cancel. Continue annotating...");
            }
        );
    
        handleFileClose();
    };
    
    const convertToJSONFileFormat = (problems: ProblemType[]): string => {
        var result: Record<string, any>[] = [];
    
        problems.forEach(p => {
            var labelMapping: Record<string, string>[] = [];
            var colorMapping: Record<string, string>[] = [];
            var pointLabels: Record<string, string>[] = [];
            var faceLabels: Record<string, string>[] = [];
    
            labelMapping.push({ "-1": "unlabelled" });
    
            if (!_.isEmpty(p.classes)) {
                p.classes.forEach((c, j) => {
                    var index: string = j.toString();
                    var labelName: string = c.name;
                    var colorCode: string = _.isEmpty(c.color) ? "" : c.color;
    
                    labelMapping.push({ [index]: labelName });
                    colorMapping.push({ [index]: colorCode });
    
                    switch (c.annotationType) {
                        case AnnotationType.KEYPOINT:
                            faceLabels.push({ [index]: "-1" });
    
                            for (let i = 0; i < c.coordinates.length; i += 3) {
                                var temp: any[] = [(c.coordinates)[i], (c.coordinates)[i + 1], (c.coordinates)[i + 2]];
    
                                pointLabels.push({ [index]: _.join(temp, ", ") });
                            }
                            break;
                        case AnnotationType.SPRAY:
                            pointLabels.push({ [index]: "-1" })
    
                            faceLabels.push({ [index]: _.join(c.coordinates, ", ") });
                            break;
                        case AnnotationType.PATH:
                        case AnnotationType.NONE:
                        default:
                            pointLabels.push({ [index]: "-1" });
                            faceLabels.push({ [index]: "-1" });
                            break;
                    }
                });
            }
    
            var problemDetails: Record<string, any>[] = [{ "label_mapping": labelMapping }, { "color_mapping": colorMapping }, { "face_labels": faceLabels }, { "point_labels": pointLabels }];
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
