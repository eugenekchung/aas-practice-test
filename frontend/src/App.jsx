import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TestInterface from './components/TestInterface';
import Login from './pages/Login';
import Results from './pages/Results';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    // Redirect happens automatically due to state change
  };

  const handleTestComplete = (sessionId) => {
    setCurrentSessionId(sessionId);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="App">
        {isAuthenticated && (
          <div className="fixed top-4 right-4 z-50">
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        )}
        
        <Routes>
          {/* Login Route */}
          <Route 
            path="/login" 
            element={
              isAuthenticated 
                ? <Navigate to="/test" /> 
                : <Login onLogin={handleLogin} />
            } 
          />
          
          {/* Test Route */}
          <Route 
            path="/test" 
            element={
              isAuthenticated 
                ? <TestInterface onTestComplete={handleTestComplete} />
                : <Navigate to="/login" />
            } 
          />
          
          {/* Results Route */}
          <Route 
            path="/results/:sessionId" 
            element={
              isAuthenticated 
                ? <Results />
                : <Navigate to="/login" />
            } 
          />
          
          {/* Home/Default Route */}
          <Route 
            path="/" 
            element={
              isAuthenticated 
                ? <Navigate to="/test" />
                : <Navigate to="/login" />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;