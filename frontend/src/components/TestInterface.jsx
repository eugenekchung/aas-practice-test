import React, { useState } from 'react';

const TestInterface = () => {
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  
  // Hard-coded questions for testing
  const questions = [
    {
      id: 1,
      question_text: 'What is 2 + 2?',
      options: ['3', '4', '5', '6']
    },
    {
      id: 2,
      question_text: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid']
    }
  ];

  const selectAnswer = (questionId, answerIndex) => {
    setAnswers({...answers, [questionId]: answerIndex});
  };

  if (!testStarted) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl mb-4">Test Ready</h1>
        <button 
          onClick={() => setTestStarted(true)}
          className="px-6 py-3 bg-blue-500 text-white rounded"
        >
          Start Test
        </button>
      </div>
    );
  }

  const q = questions[currentQuestion];

  return (
    <div className="p-8">
      <h2 className="text-xl mb-4">Question {currentQuestion + 1}</h2>
      <p className="mb-6">{q.question_text}</p>
      
      <div className="space-y-2">
        {q.options.map((option, i) => (
          <button
            key={i}
            onClick={() => selectAnswer(q.id, i)}
            className={`block w-full p-4 border rounded ${
              answers[q.id] === i ? 'bg-blue-100 border-blue-500' : 'border-gray-300'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      
      <div className="mt-8 flex gap-4">
        <button 
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
          className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50"
        >
          Previous
        </button>
        <button 
          onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
          disabled={currentQuestion === questions.length - 1}
          className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TestInterface;