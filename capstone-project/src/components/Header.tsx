import { useState } from 'react';
import { AppBar, Toolbar, Button, Menu, MenuItem, Container } from '@mui/material';
import { HelpOutline as HelpOutlineIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import * as _ from "lodash";
import { ProblemType } from '../datatypes/ProblemType';
import { OutputFile } from '../datatypes/OutputFile';
import { FileAnnotation } from '../datatypes/FileAnnotation';

export type HeaderProps = {
    showDetailPane: (isShow: boolean) => void;
    isShowDetailPane: boolean;
    currentFile: string | null;
    updateFileList: (_fileList: FileAnnotation[]) => void;
    stlFiles: FileAnnotation[];
    initializeCurrentFile: (_file: FileAnnotation) => void
};

export default function Header({ showDetailPane, isShowDetailPane, currentFile, stlFiles, updateFileList, initializeCurrentFile
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
                var _fileList: FileAnnotation[] = stlFiles.length == 0 ? [] : stlFiles;

                files.forEach(f => {
                    if (_fileList.length == 0 || _fileList.length > 0 && (_.findIndex(_fileList, function (x) {
                        return _.eq(x.fileName, f.name);
                    }) == -1)) {
                        var temp1: FileAnnotation = { fileName: f.name, fileObject: f, problems: [] };


                        _fileList.push(temp1);
                    }
                })

                initializeCurrentFile(_fileList[0]);

                updateFileList(_fileList);
            }

            handleFileClose();
        };
        input.click();
    };

    const handleSave = () => {
        var currFile: FileAnnotation = _.find(stlFiles, function (f) {
            return _.eq(f.fileName, currentFile);
        });

        var currProblems: string = convertToJSONFileFormat(currFile.problems);
        var currOutput: OutputFile = { fileName: currFile.fileName, problems: currProblems };

        const jsonData = JSON.stringify(currOutput, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = _.trimEnd(currFile.fileName, ".stl").concat(".json");
        link.click();
        handleFileClose();
    };

    const convertToJSONFileFormat = (problems: ProblemType[]): string => {
        var result: Record<string, any>[] = [];

        problems.forEach(p => {
            var labelMapping: Record<string, string>[] = [];
            var colorMapping: Record<string, string>[] = [];

            labelMapping.push({ "-1": "unlabelled" });

            if (!_.isEmpty(p.classes)) {
                p.classes.forEach((c, j) => {
                    var index: string = j.toString();
                    var labelName: string = c[0];
                    var colorCode: string = c.length > 1 ? c[1] : "";

                    labelMapping.push({ [index]: labelName });
                    colorMapping.push({ [index]: colorCode });
                });
            }

            var problemDetails: Record<string, any>[] = [{ "label_mapping": labelMapping }, { "color_mapping": colorMapping }];
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
                                <MenuItem onClick={handleImport}>Import</MenuItem>
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
