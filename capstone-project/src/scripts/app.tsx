import { createRoot } from "react-dom/client";
import { Nav, NavDropdown, Row, Col } from "react-bootstrap";
import { FaQuestionCircle, FaMousePointer, FaHandPaper, FaPaintBrush, FaSprayCan } from "react-icons/fa";

const container = document.getElementById('root');

const root = createRoot(container);

function main() {
  root.render(<div>
  <Nav id="header">
    <NavDropdown title="File" id="file-dropdown">
      <NavDropdown.Item eventKey="4.1">Action</NavDropdown.Item>
      <NavDropdown.Item eventKey="4.2">Another action</NavDropdown.Item>
      <NavDropdown.Item eventKey="4.3">Something else here</NavDropdown.Item>
    </NavDropdown>
    <NavDropdown title="Settings" id="setting-dropdown">
      <NavDropdown.Item eventKey="4.1">Action</NavDropdown.Item>
      <NavDropdown.Item eventKey="4.2">Another action</NavDropdown.Item>
      <NavDropdown.Item eventKey="4.3">Something else here</NavDropdown.Item>
    </NavDropdown>
    <Row>
      <Col xs="auto">
      <Nav.Item id="documentation-icon" className="mr-sm-2"><FaQuestionCircle /></Nav.Item>
      </Col>
    </Row>
  </Nav>
  <Nav className="flex-column" id="toolbar">
      <Nav.Item className="toolbar-icon"><FaMousePointer /></Nav.Item>
      <Nav.Item className="toolbar-icon"><FaHandPaper /></Nav.Item>
      <Nav.Item className="toolbar-icon"><FaPaintBrush /></Nav.Item>
      <Nav.Item className="toolbar-icon">
        <FaSprayCan />
      </Nav.Item>
    </Nav>
  </div>
  );
}

main();
