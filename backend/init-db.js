const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./test_database.db');

console.log('Initializing database...');

db.serialize(() => {
  // Create all tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

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

  // Add a default test user
  const defaultPassword = bcrypt.hashSync('test123', 10);
  db.run(
    `INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`,
    ['testuser', defaultPassword]
  );

  console.log('Database initialized successfully!');
});

db.close();