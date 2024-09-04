import { createRoot } from "react-dom/client";
import { Nav, NavDropdown, Row, Col, Card, ListGroup, Accordion } from "react-bootstrap";
import { FaQuestionCircle, FaMousePointer, FaHandPaper, FaPaintBrush, FaSprayCan } from "react-icons/fa";

const container = document.getElementById('root');

const root = createRoot(container);

function main() {
  root.render(<div>
    <Nav id="header">
      <NavDropdown title="File" id="file-dropdown">
        <NavDropdown.Item eventKey="4.1">Import new file</NavDropdown.Item>
        <NavDropdown.Item eventKey="4.2">Add file to workspace</NavDropdown.Item>
      </NavDropdown>
      <NavDropdown title="Settings" id="setting-dropdown">
        <NavDropdown.Item eventKey="4.1">Preferences</NavDropdown.Item>
        <NavDropdown.Item eventKey="4.2">Another action</NavDropdown.Item>
        <NavDropdown.Item eventKey="4.3">Something else here</NavDropdown.Item>
      </NavDropdown>
      <Row>
        <Col xs="auto">
          <Nav.Item id="documentation-icon" className="mr-sm-2"><FaQuestionCircle /></Nav.Item>
        </Col>
      </Row>
    </Nav>
    {/* <Row>
      <Nav className="flex-column" id="toolbar">
        <Nav.Item className="toolbar-icon"><FaMousePointer /></Nav.Item>
        <Nav.Item className="toolbar-icon"><FaHandPaper /></Nav.Item>
        <Nav.Item className="toolbar-icon"><FaPaintBrush /></Nav.Item>
        <Nav.Item className="toolbar-icon">
          <FaSprayCan />
        </Nav.Item>
      </Nav>
      <p>Testing</p>
    </Row> */}

    <Row>
      <Col md={1}><Nav className="flex-column" id="toolbar">
        <Nav.Item className="toolbar-icon"><FaMousePointer /></Nav.Item>
        <Nav.Item className="toolbar-icon"><FaHandPaper /></Nav.Item>
        <Nav.Item className="toolbar-icon"><FaPaintBrush /></Nav.Item>
        <Nav.Item className="toolbar-icon">
          <FaSprayCan />
        </Nav.Item>
      </Nav></Col>
      <Col md={{ span: 3, offset: 8 }}><Card id="right-pane">
        <Card.Header>Annotated Items</Card.Header>
        <Card.Body>
          <Accordion>
            <Accordion.Item eventKey="0">
              <Accordion.Header>Problem</Accordion.Header>
              <Accordion.Body>
              <Accordion>
                <Accordion.Item eventKey="0">
                  <Accordion.Header>Class</Accordion.Header>
                  <Accordion.Body>
                  Testing
                  </Accordion.Body>
                </Accordion.Item></Accordion></Accordion.Body></Accordion.Item>
            <Accordion.Item eventKey="1">
              <Accordion.Header>Accordion Item #2</Accordion.Header>
              <Accordion.Body>
               Testing
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
          {/* <Card.Text>
            Some quick example text to build on the card title and make up the
            bulk of the card's content.
          </Card.Text> */}
        </Card.Body>
      </Card></Col>
    </Row>
  </div>
  );
}

main();
