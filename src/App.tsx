import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import CreateForm from "./CreateForm";
import ListForm from "./ListForm";
import "./App.css";
import Survey from "./Survey";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/create" element={<CreateForm />} />
        <Route path="/" element={<ListForm />} />
        <Route path="/survey/:surveyId" element={<Survey />} />
      </Routes>
    </Router>
  );
}

export default App;
