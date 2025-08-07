const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : 'https://aas-practice-test-production.up.railway.app';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TestInterface = ({ onTestComplete}) => {
  const navigate = useNavigate();
  // State management
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(45 * 60);
  const [testStarted, setTestStarted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Connect frontend to backend
  const API_URL = import.meta.env.MODE === 'production'
    ? 'https://aas-practice-test-production.up.railway.app'
    : 'http://localhost:3001';


  // Load questions on mount
  useEffect(() => {
    loadQuestions();
  }, []);

  // Timer logic
  useEffect(() => {
    if (!testStarted || timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          submitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, timeRemaining]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!testStarted) return;
    
    const autoSave = setInterval(() => {
      saveProgress();
    }, 30000);

    return () => clearInterval(autoSave);
  }, [answers, testStarted]);

  const loadQuestions = async () => {
    try {
      const response = await axios.get('${API_URL}/api/questions');
      setQuestions(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load questions:', error);
      // Fallback to local data
      loadLocalQuestions();
    }
  };

  const loadLocalQuestions = () => {
    // Sample questions for testing
    const sampleQuestions = [
      {
        id: 1,
        type: 'multiple_choice',
        subject: 'Mathematics',
        text: 'If a train travels at 80 km/h for 2.5 hours, how far does it travel?',
        options: ['180 km', '200 km', '220 km', '240 km'],
        correctAnswer: 1
      },
      {
        id: 2,
        type: 'pattern',
        subject: 'Abstract Reasoning',
        text: 'The drawings in the boxes follow a pattern.',
        prompt: 'Which drawing can continue the pattern?',
        patterns: [/* Pattern data */],
        correctAnswer: 0
      }
    ];
    setQuestions(sampleQuestions);
    setLoading(false);
  };

  const saveProgress = async () => {
    const progress = {
      currentQuestion,
      answers,
      timeRemaining,
      timestamp: new Date().toISOString()
    };
    
    // Save to localStorage
    localStorage.setItem('testProgress', JSON.stringify(progress));
    
    // Save to backend
    try {
      await axios.post('${API_URL}/api/sessions/save', progress);
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const selectAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const navigateQuestion = (direction) => {
    const newQuestion = currentQuestion + direction;
    if (newQuestion >= 1 && newQuestion <= questions.length) {
      setCurrentQuestion(newQuestion);
    }
  };

  const submitTest = async () => {
    setTestStarted(false);
    
    const results = {
      answers,
      timeSpent: (45 * 60) - timeRemaining,
      submitted: new Date().toISOString()
    };
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/sessions/submit`, 
        results,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Navigate to results page
      navigate(`/results/${response.data.sessionId}`);
      
      // Or if onTestComplete is provided
      if (onTestComplete) {
        onTestComplete(response.data.sessionId);
      }
    } catch (error) {
      console.error('Failed to submit test:', error);
      localStorage.setItem('testResults', JSON.stringify(results));
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading questions...</div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion - 1];
  const isAnswered = answers[currentQ?.id] !== undefined;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#2c5770] text-white px-5 py-3 flex justify-between items-center">
        <div className="text-lg font-medium">
          Academic Assessment Services
          <sup className="text-xs ml-1">®</sup>
        </div>
        <div className="flex gap-5">
          <button className="hover:opacity-80">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Navigation Bar */}
      <div className="bg-[#e8f4f8] px-5 py-2 flex items-center gap-3 border-b border-[#d0e8f0]">
        <button 
          onClick={() => navigateQuestion(-1)}
          disabled={currentQuestion === 1}
          className="px-5 py-2 bg-[#5bb4d0] text-white rounded font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          ◄ Previous
        </button>
        <button 
          onClick={() => navigateQuestion(1)}
          disabled={currentQuestion === questions.length}
          className="px-5 py-2 bg-[#5bb4d0] text-white rounded font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          ► Next
        </button>
        <button 
          onClick={() => {/* Review logic */}}
          className="px-5 py-2 bg-white text-[#2c5770] border border-[#5bb4d0] rounded font-medium ml-5 hover:bg-gray-50"
        >
          Check Result
        </button>
        <button 
          onClick={() => {
            if (confirm('Are you sure you want to exit? Your progress will be saved.')) {
              saveProgress();
              window.location.href = '/';
            }
          }}
          className="px-5 py-2 bg-white text-[#2c5770] border border-[#5bb4d0] rounded font-medium hover:bg-gray-50"
        >
          Exit Test
        </button>
        <div className="ml-auto text-sm font-medium">
          Page {Math.ceil(currentQuestion / 2)} of 25
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-8">
        {!testStarted ? (
          <div className="text-center py-20">
            <h2 className="text-2xl mb-6">Ready to begin your test?</h2>
            <p className="mb-8 text-gray-600">You will have 45 minutes to complete 50 questions.</p>
            <button 
              onClick={() => setTestStarted(true)}
              className="px-8 py-3 bg-[#5bb4d0] text-white rounded-lg text-lg font-medium hover:bg-[#4aa0bc]"
            >
              Start Test
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-2xl mb-6">Question {currentQuestion}</h2>
              <p className="text-lg mb-4">{currentQ.text}</p>
              
              {/* Question Display Component */}
              {currentQ.type === 'multiple_choice' && (
                <div className="grid grid-cols-2 gap-4 mt-8">
                  {currentQ.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => selectAnswer(currentQ.id, index)}
                      className={`p-6 border-2 rounded-lg text-center transition-all ${
                        answers[currentQ.id] === index
                          ? 'border-green-500 bg-white shadow-lg'
                          : 'border-gray-400 hover:border-[#5bb4d0] hover:bg-blue-50'
                      }`}
                    >
                      {option}
                      {answers[currentQ.id] === index && (
                        <div className="mt-2 text-green-500 text-sm font-medium">
                          ✓ Your Answer
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="mt-12 text-center">
              <button 
                onClick={() => {
                  if (confirm('Are you sure you want to submit your test?')) {
                    submitTest();
                  }
                }}
                className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                Submit Test
              </button>
            </div>
          </>
        )}
      </div>

      {/* Timer */}
      {testStarted && (
        <div className="fixed top-20 right-5 bg-white border rounded-lg p-4 shadow-lg">
          <div className={`text-xl font-bold text-center ${
            timeRemaining < 300 ? 'text-red-500' : 'text-[#2c5770]'
          }`}>
            {formatTime(timeRemaining)}
          </div>
          <div className="text-xs text-gray-600 mt-1">Time Remaining</div>
        </div>
      )}

      {/* Question Palette */}
      {testStarted && (
        <div className="fixed bottom-5 right-5 bg-white border rounded-lg p-4 shadow-lg max-w-xs">
          <div className="text-sm font-medium mb-3">Question Navigation</div>
          <div className="grid grid-cols-10 gap-1">
            {questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(index + 1)}
                className={`w-6 h-6 text-xs border rounded flex items-center justify-center transition-all ${
                  currentQuestion === index + 1
                    ? 'bg-[#2c5770] text-white border-[#2c5770]'
                    : answers[q.id] !== undefined
                    ? 'bg-green-100 border-green-500'
                    : 'bg-white border-gray-300 hover:border-[#5bb4d0]'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestInterface;