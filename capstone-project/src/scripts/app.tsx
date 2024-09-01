// import { createRoot } from 'react-dom/client';

// const root = createRoot(document.body);
// root.render(<h2>Hello from React!</h2>);

import { createRoot } from "react-dom/client";
// import { Layout } from "./components/Layout";
// import { Home } from "./components/views/Home";

const container = document.getElementById('root');

const root = createRoot(container);

function main() {
  root.render(<h2>Hello from React!</h2>);
}

main();
