import { createRoot } from "react-dom/client";
import { Box, Grid2 as Grid } from '@mui/material';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import DetailPane from '../components/DetailPane';


const container = document.getElementById('root');

const root = createRoot(container);


function main() {

  root.render(<div>
    <Box sx={{ flexGrow: 1 }}>
      <Header />
    </Box>
    
    <Grid container rowSpacing={1}>
      <Grid size="auto">
        <Sidebar />
      </Grid>
      <Grid size={3} offset={ 'auto' }>
        <DetailPane />
      </Grid>
    </Grid>
  </div>
  );
}

main();
