const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./test_database.db');

// Initialize database tables
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Questions table
  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT,
      type TEXT,
      difficulty TEXT,
      question_text TEXT,
      options TEXT,
      correct_answer INTEGER,
      explanation TEXT,
      image_url TEXT
    )
  `);

  // Test sessions table
  db.run(`
    CREATE TABLE IF NOT EXISTS test_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      score INTEGER,
      time_spent INTEGER,
      answers TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // Progress saves table
  db.run(`
    CREATE TABLE IF NOT EXISTS progress_saves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER,
      current_question INTEGER,
      answers TEXT,
      time_remaining INTEGER,
      saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES test_sessions (id)
    )
  `);
});

// Routes

// Get all questions for a test
app.get('/api/questions', authenticateToken, (req, res) => {
  const { subject, limit = 50 } = req.query;
  
  let query = 'SELECT * FROM questions';
  const params = [];
  
  if (subject) {
    query += ' WHERE subject = ?';
    params.push(subject);
  }
  
  query += ' ORDER BY RANDOM() LIMIT ?';
  params.push(parseInt(limit));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Parse JSON fields
    const questions = rows.map(row => ({
      ...row,
      options: JSON.parse(row.options || '[]')
    }));
    
    res.json(questions);
  });
});

// Save progress
app.post('/api/sessions/save', authenticateToken, (req, res) => {
  const { sessionId, currentQuestion, answers, timeRemaining } = req.body;
  
  db.run(
    `INSERT INTO progress_saves (session_id, current_question, answers, time_remaining)
     VALUES (?, ?, ?, ?)`,
    [sessionId, currentQuestion, JSON.stringify(answers), timeRemaining],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: 'Progress saved' });
    }
  );
});

// Submit test
app.post('/api/sessions/submit', authenticateToken, (req, res) => {
  const { sessionId, answers, timeSpent } = req.body;
  const userId = req.user.id;
  
  // Calculate score
  db.all(
    'SELECT id, correct_answer FROM questions WHERE id IN (' + 
    Object.keys(answers).map(() => '?').join(',') + ')',
    Object.keys(answers),
    (err, questions) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      let score = 0;
      questions.forEach(q => {
        if (answers[q.id] === q.correct_answer) {
          score++;
        }
      });
      
      // Update session
      db.run(
        `UPDATE test_sessions 
         SET completed_at = CURRENT_TIMESTAMP, score = ?, time_spent = ?, answers = ?
         WHERE id = ?`,
        [score, timeSpent, JSON.stringify(answers), sessionId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          res.json({
            sessionId,
            score,
            totalQuestions: questions.length,
            percentage: Math.round((score / questions.length) * 100)
          });
        }
      );
    }
  );
});

// User registration
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Username already exists' });
          }
          return res.status(500).json({ error: err.message });
        }
        
        const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET);
        res.json({ token, userId: this.lastID });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  db.get(
    'SELECT * FROM users WHERE username = ?',
    [username],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const token = jwt.sign({ id: user.id, username }, JWT_SECRET);
      res.json({ token, userId: user.id });
    }
  );
});

// Get test results
app.get('/api/results/:sessionId', authenticateToken, (req, res) => {
  const { sessionId } = req.params;
  
  db.get(
    `SELECT ts.*, u.username 
     FROM test_sessions ts
     JOIN users u ON ts.user_id = u.id
     WHERE ts.id = ?`,
    [sessionId],
    (err, session) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      const answers = JSON.parse(session.answers || '{}');
      
      // Get question details for review
      db.all(
        'SELECT * FROM questions WHERE id IN (' +
        Object.keys(answers).map(() => '?').join(',') + ')',
        Object.keys(answers),
        (err, questions) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          const results = {
            ...session,
            answers: answers,
            questions: questions.map(q => ({
              ...q,
              options: JSON.parse(q.options || '[]'),
              userAnswer: answers[q.id],
              isCorrect: answers[q.id] === q.correct_answer
            }))
          };
          
          res.json(results);
        }
      );
    }
  );
});

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Seed database with sample questions (run once)
app.post('/api/admin/seed', (req, res) => {
  const sampleQuestions = [
    {
      subject: 'Mathematics',
      type: 'multiple_choice',
      difficulty: 'medium',
      question_text: 'If a train travels at 80 km/h for 2.5 hours, how far does it travel?',
      options: JSON.stringify(['180 km', '200 km', '220 km', '240 km']),
      correct_answer: 1,
      explanation: 'Distance = Speed × Time = 80 × 2.5 = 200 km'
    },
    {
      subject: 'Mathematics',
      type: 'geometry',
      difficulty: 'hard',
      question_text: 'A cone of height 12 cm is placed on top of a cylinder. The height of the cylinder is 2 cm. What is the volume of the solid figure formed?',
      options: JSON.stringify(['100π cm³', '125π cm³', '145π cm³', '150π cm³']),
      correct_answer: 3,
      explanation: 'Volume = Volume of cone + Volume of cylinder'
    },
    {
      subject: 'English',
      type: 'multiple_choice',
      difficulty: 'easy',
      question_text: 'Which word is a synonym for "ephemeral"?',
      options: JSON.stringify(['Permanent', 'Temporary', 'Solid', 'Heavy']),
      correct_answer: 1,
      explanation: 'Ephemeral means lasting for a very short time, similar to temporary'
    },
    {
      subject: 'Abstract Reasoning',
      type: 'pattern',
      difficulty: 'medium',
      question_text: 'The drawings in the boxes follow a pattern. Which drawing can continue the pattern?',
      options: JSON.stringify(['Option A', 'Option B', 'Option C', 'Option D', 'Option E']),
      correct_answer: 0,
      explanation: 'The pattern shows a rotation of elements'
    }
  ];
  
  const stmt = db.prepare(
    `INSERT INTO questions (subject, type, difficulty, question_text, options, correct_answer, explanation)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  
  sampleQuestions.forEach(q => {
    stmt.run(
      q.subject,
      q.type,
      q.difficulty,
      q.question_text,
      q.options,
      q.correct_answer,
      q.explanation
    );
  });
  
  stmt.finalize();
  
  res.json({ message: 'Database seeded with sample questions' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});