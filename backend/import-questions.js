const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./test_database.db');

// Your questions from the practice tests
const questions = [
  {
    subject: 'Mathematics',
    type: 'multiple_choice',
    question: 'If a train travels at 80 km/h for 2.5 hours...',
    optionA: '180 km',
    optionB: '200 km',
    optionC: '220 km',
    optionD: '240 km',
    correct: 1
  },
  // Add more questions here
];

// Import to database
questions.forEach(q => {
  db.run(
    `INSERT INTO questions (subject, type, question_text, options, correct_answer)
     VALUES (?, ?, ?, ?, ?)`,
    [
      q.subject,
      q.type,
      q.question,
      JSON.stringify([q.optionA, q.optionB, q.optionC, q.optionD]),
      q.correct
    ]
  );
});

console.log('Questions imported!');