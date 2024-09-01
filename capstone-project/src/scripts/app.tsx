import { createRoot } from "react-dom/client";

const container = document.getElementById('root');

const root = createRoot(container);

function main() {
  root.render(<h2>Hello from React!</h2>);
}

main();
