import { useEffect, useState } from 'react';
import axios from 'axios';

const Results = ({ sessionId }) => {
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

  if (loading) return <div>Loading results...</div>;
  if (!results) return <div>No results found</div>;

  const percentage = Math.round((results.score / results.questions.length) * 100);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Test Results</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-[#2c5770]">
              {results.score}/{results.questions.length}
            </div>
            <div className="text-gray-600">Questions Correct</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#2c5770]">
              {percentage}%
            </div>
            <div className="text-gray-600">Score</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#2c5770]">
              {Math.floor(results.time_spent / 60)}m
            </div>
            <div className="text-gray-600">Time Taken</div>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Review Answers</h2>
      
      <div className="space-y-4">
        {results.questions.map((q, index) => (
          <div key={q.id} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium">Question {index + 1}</h3>
              <span className={`px-2 py-1 rounded text-sm ${
                q.isCorrect 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {q.isCorrect ? 'Correct' : 'Incorrect'}
              </span>
            </div>
            
            <p className="mb-3">{q.question_text}</p>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              {q.options.map((option, i) => (
                <div
                  key={i}
                  className={`p-2 rounded border ${
                    i === q.correct_answer
                      ? 'border-green-500 bg-green-50'
                      : i === q.userAnswer
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                >
                  {option}
                  {i === q.correct_answer && ' ✓'}
                  {i === q.userAnswer && i !== q.correct_answer && ' ✗'}
                </div>
              ))}
            </div>
            
            {!q.isCorrect && (
              <div className="text-sm text-gray-600 italic">
                Explanation: {q.explanation}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Results;