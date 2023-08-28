import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import { AlertProvider } from './contexts/alerts';
import Dashboard from './pages/dashboard';
import MailPlanning from './pages/mail-planning';
import MediaLibrary from "./pages/media_library";
import TemplateEditor from './pages/template-editor';

function App() {
  return (
    <div className="App"> {/* this should be replaced with a layout component */}
      <AlertProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/mailing/new" element={<MailPlanning />} />
            <Route path="/editor/:templateId" element={<TemplateEditor />} />
            <Route path="/editor" element={<TemplateEditor />} />
            <Route path="/media_library" element={<MediaLibrary />} />
          </Routes>
        </Router>
      </AlertProvider>
    </div>
  );
}

export default App;