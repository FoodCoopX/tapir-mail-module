import React from 'react'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/dashboard';
import TemplateEditor from './pages/template-editor';
import MailPlanning from './pages/mail-planning';

function App() {
  return (
    <div className="App"> {/* this should be replaced with a layout component */}
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/mailing/new" element={<MailPlanning />} />
          <Route path="/editor/:templateName" element={<TemplateEditor />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;