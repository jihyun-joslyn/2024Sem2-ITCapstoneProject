import { createRoot } from "react-dom/client";
import { Box, Grid2 as Grid } from '@mui/material';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import DetailPane from '../components/DetailPane';
import Main from '../components/Main';
import { useState } from 'react';

const container = document.getElementById('root');

const root = createRoot(container);


function main() {

  root.render(<div>
   <Main />
  </div>
  );
}

main();
