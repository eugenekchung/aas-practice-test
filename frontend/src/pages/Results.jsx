import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001'
  : 'https://YOUR-RAILWAY-URL.railway.app';  // Your Railway URL

const Results = () => {
  const { sessionId } = useParams();  // Get sessionId from URL
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [sessionId]);

  const loadResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/results/${sessionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load results:', error);
      setLoading(false);
    }
  };

  const startNewTest = () => {
    navigate('/test');
  };

  // ... rest of your Results component ...
  
  // Add a button to start new test
  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* ... existing results display ... */}
      
      <button
        onClick={startNewTest}
        className="mt-8 px-6 py-3 bg-[#5bb4d0] text-white rounded-lg hover:bg-[#4aa0bc]"
      >
        Start New Test
      </button>
    </div>
  );
};

export default Results;