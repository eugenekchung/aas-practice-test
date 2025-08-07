import React from 'react';

const QuestionDisplay = ({ question, selectedAnswer, onSelectAnswer }) => {
  // Render different question types
  switch (question.type) {
    case 'pattern':
      return <PatternQuestion {...question} />;
    case 'geometry':
      return <GeometryQuestion {...question} />;
    default:
      return <MultipleChoiceQuestion {...question} />;
  }
};

const PatternQuestion = ({ question, options, selectedAnswer, onSelect }) => {
  return (
    <div>
      <div className="pattern-grid">
        {/* Show pattern sequence */}
        {question.patterns?.map((pattern, i) => (
          <PatternBox key={i} pattern={pattern} />
        ))}
        <div className="question-mark-box">?</div>
      </div>
      
      <h3 className="mt-8 text-lg font-medium">
        Which drawing can continue the pattern?
      </h3>
      
      <div className="options-grid mt-6">
        {options.map((option, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`pattern-option ${
              selectedAnswer === i ? 'selected' : ''
            }`}
          >
            <PatternBox pattern={option.pattern} />
            {selectedAnswer === i && (
              <span className="answer-badge">✓ Your Answer</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuestionDisplay;