const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const db = new sqlite3.Database('./test_database.db');
const questions = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'questions.json'), 'utf8')
);

db.serialize(() => {
  // Clear existing questions (optional)
  db.run('DELETE FROM questions');
  
  // Prepare insert statement
  const stmt = db.prepare(`
    INSERT INTO questions 
    (subject, type, difficulty, question_text, options, correct_answer, explanation)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  // Insert each question
  questions.forEach((q, index) => {
    stmt.run(
      q.subject,
      q.type,
      q.difficulty,
      q.question_text,
      JSON.stringify(q.options),
      q.correct_answer,
      q.explanation
    );
    console.log(`Imported question ${index + 1}/${questions.length}`);
  });
  
  stmt.finalize();
  
  // Verify import
  db.get('SELECT COUNT(*) as count FROM questions', (err, row) => {
    console.log(`Total questions in database: ${row.count}`);
  });
});

db.close();