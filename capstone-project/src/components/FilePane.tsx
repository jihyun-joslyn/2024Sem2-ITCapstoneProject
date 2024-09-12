import { Toolbar, Typography, } from '@mui/material';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';

export type FilePane = {
    isShow: Boolean

};

export default function FilePane({ isShow }: FilePane) {
    return (
        <div>
            {isShow && (
                <div id="file-pane">
                    <Toolbar id="file-pane-header">
                        <Typography>File Pane</Typography>
                    </Toolbar>
                    <SimpleTreeView>
                        <TreeItem itemId="grid" label="Data Grid">
                            <TreeItem itemId="grid-community" label="@mui/x-data-grid" />
                            <TreeItem itemId="grid-pro" label="@mui/x-data-grid-pro" />
                            <TreeItem itemId="grid-premium" label="@mui/x-data-grid-premium" />
                        </TreeItem>
                        <TreeItem itemId="pickers" label="Date and Time Pickers">
                            <TreeItem itemId="pickers-community" label="@mui/x-date-pickers" />
                            <TreeItem itemId="pickers-pro" label="@mui/x-date-pickers-pro" />
                        </TreeItem>
                        <TreeItem itemId="charts" label="Charts">
                            <TreeItem itemId="charts-community" label="@mui/x-charts" />
                        </TreeItem>
                        <TreeItem itemId="tree-view" label="Tree View">
                            <TreeItem itemId="tree-view-community" label="@mui/x-tree-view" />
                        </TreeItem>
                    </SimpleTreeView>
                </div>
            )}

        </div>
    );
}