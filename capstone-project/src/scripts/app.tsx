import { createRoot } from "react-dom/client";
import Main from '../components/Main';

const container = document.getElementById('root');

const root = createRoot(container);


function main() {

  root.render(<div>
   <Main />
  </div>
  );
}

main();
