import React from 'react'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/dashboard';
import Editor from './pages/editor';

function App() {
  return (
    <div className="App"> {/* this should be replaced with a layout component */}
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/editor/:templateName" element={<Editor />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;