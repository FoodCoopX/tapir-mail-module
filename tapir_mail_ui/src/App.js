import React from 'react'
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom';
import './App.css';
import Dashboard from './pages/dashboard';
import Editor from './pages/editor';
import MediaLibrary from "./pages/media_library";

function App() {
  return (
    <div className="App"> {/* this should be replaced with a layout component */}
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/editor/:templateName" element={<Editor />} />
          <Route path="/media_library/" element={<MediaLibrary />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;