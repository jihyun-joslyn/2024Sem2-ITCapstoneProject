import { useState, useRef, MutableRefObject } from 'react';
import { AppBar, Toolbar, Button, Menu, MenuItem, Container } from '@mui/material';
import { HelpOutline as HelpOutlineIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import * as _ from "lodash";
import { ProblemType } from '../datatypes/ProblemType';
import { OutputFile } from '../datatypes/OutputFile';
import { FileAnnotation } from '../datatypes/FileAnnotation';
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
    initializeCurrentFile: (_file: FileAnnotation) => void;
    meshRef: MutableRefObject<Mesh | null>; 
};

export default function Header({ showDetailPane, isShowDetailPane, currentFile, stlFiles, updateFileList, initializeCurrentFile, meshRef
}: HeaderProps) {
    const [fileAnchorEl, setFileAnchorEl] = useState<null | HTMLElement>(null);
    const [settingAnchorEl, setSettingAnchorEl] = useState<null | HTMLElement>(null);

    const fileMenuOpen = Boolean(fileAnchorEl);
    const settingMenuOpen = Boolean(settingAnchorEl);

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

                        if (isAnnotated(files, f.name))
                            temp1.problems = await getJSONContent(_.find(files, function (_f) {
                                var _name: string = _.trimEnd(_.toLower(f.name), '.stl');

                                return _.startsWith(_.toLower(_f.name), _name) && _.endsWith(_.toLower(_f.name), '.json');
                            }))

                        _fileList.push(temp1);
                    }
                }
            }

            initializeCurrentFile(_fileList[0]);

            updateFileList(_fileList);

            resolve(_fileList);
        })
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
                        }
                    }
                }

                _className.forEach((c, x) => {
                    var _class: ClassDetail = { name: c, annotationType: AnnotationType.NONE, coordinates: [], color: _color.at(x) };

                    temp.classes.push(_class);
                })
            }

            problem.push(temp);
        }

        return problem;
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
                const jsonOutput = generateJsonWithUnlabeled(geometry, problemsRecord, currFile.fileName, currFile.problems);
    
                if (!jsonOutput) {
                    console.error("Failed to generate JSON output");
                    return;
                }
    
                console.log("Generated JSON output:", jsonOutput);
                console.log("User chose to continue. Proceeding...");
            },
            () => {
                console.log("User chose to cancel. Continue annotating...");
            }
        );
    
        handleFileClose();
    };    

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
                                <MenuItem onClick={handleSettingClose}>Preferences</MenuItem>
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
