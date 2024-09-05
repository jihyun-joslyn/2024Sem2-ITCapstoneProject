import { createRoot } from "react-dom/client";
import { Box, Grid2 as Grid, Paper, styled } from '@mui/material';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import DetailPane from '../components/DetailPane';


const container = document.getElementById('root');

const root = createRoot(container);

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  ...theme.applyStyles('dark', {
    backgroundColor: '#1A2027',
  }),
}));

function main() {

  root.render(<div>
    <Box sx={{ flexGrow: 1 }}>
      <Header />
    </Box>
    {/* <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
      <Grid size={6}>
        <Item>1</Item>
      </Grid>
      <Grid size={6}>
        <Item>2</Item>
      </Grid>
      <Grid size={6}>
        <Item>3</Item>
      </Grid>
      <Grid size={6}>
        <Item>4</Item>
      </Grid>
    </Grid> */}
    <Grid container rowSpacing={1}>
      <Grid size={1}>
        <Sidebar />
      </Grid>
      <Grid size={3} offset={8}>
        <DetailPane />
      </Grid>
    </Grid>
  </div>
  );
}

main();
