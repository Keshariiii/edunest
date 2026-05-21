const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8082;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const dbPath = path.join(__dirname, 'reader_data.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Initialize Tables
db.serialize(() => {
  // Highlights Table
  db.run(`
    CREATE TABLE IF NOT EXISTS highlights (
      id TEXT PRIMARY KEY,
      pdfId TEXT NOT NULL,
      pageIndex INTEGER NOT NULL,
      rects TEXT NOT NULL,       -- JSON string: Array of {top, left, width, height}
      color TEXT NOT NULL
    )
  `);

  // Bookmarks Table
  db.run(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      pdfId TEXT NOT NULL,
      pageIndex INTEGER NOT NULL
    )
  `);

  // Sticky Notes Table
  db.run(`
    CREATE TABLE IF NOT EXISTS sticky_notes (
      id TEXT PRIMARY KEY,
      pdfId TEXT NOT NULL,
      pageIndex INTEGER NOT NULL,
      x REAL NOT NULL,           
      y REAL NOT NULL,           
      color TEXT NOT NULL,       -- 'yellow' | 'green' | 'orange' | 'red'
      content TEXT NOT NULL
    )
  `);

  // Drawings Table
  db.run(`
    CREATE TABLE IF NOT EXISTS drawings (
      id TEXT PRIMARY KEY,
      pdfId TEXT NOT NULL,
      pageIndex INTEGER NOT NULL,
      pathData TEXT NOT NULL,    -- Mathematical SVG path string
      color TEXT NOT NULL,
      strokeWidth REAL NOT NULL
    )
  `);

  // Time Spent / Focus Table
  db.run(`
    CREATE TABLE IF NOT EXISTS time_spent (
      id TEXT PRIMARY KEY,       -- Format: 'timespent_YYYY-MM-DD'
      date TEXT NOT NULL,        -- Format: 'YYYY-MM-DD'
      durationSeconds INTEGER NOT NULL
    )
  `);

  // Gamified Scheduler Tasks Table
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      time TEXT DEFAULT 'No time set',
      category TEXT DEFAULT 'Study',
      priority TEXT CHECK(priority IN ('High', 'Medium', 'Low')) DEFAULT 'Medium',
      completed INTEGER DEFAULT 0 -- Boolean: 0 or 1
    )
  `);

  console.log('Successfully checked and initialized all SQLite database tables.');
});

// ==========================================
// ENDPOINTS: HIGHLIGHTS
// ==========================================
app.get('/api/highlights', (req, res) => {
  const { pdfId } = req.query;
  if (!pdfId) {
    return res.status(400).json({ error: 'pdfId query parameter is required' });
  }
  db.all('SELECT * FROM highlights WHERE pdfId = ?', [pdfId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // Parse rects JSON
    try {
      const formatted = rows.map(r => ({
        ...r,
        rects: JSON.parse(r.rects)
      }));
      res.json(formatted);
    } catch (parseErr) {
      res.status(500).json({ error: 'Failed to parse highlights rects JSON: ' + parseErr.message });
    }
  });
});

app.post('/api/highlights', (req, res) => {
  const { id, pdfId, pageIndex, rects, color } = req.body;
  if (!id || !pdfId || pageIndex === undefined || !rects || !color) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  const rectsStr = JSON.stringify(rects);
  db.run(
    'INSERT INTO highlights (id, pdfId, pageIndex, rects, color) VALUES (?, ?, ?, ?, ?)',
    [id, pdfId, pageIndex, rectsStr, color],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, highlight: { id, pdfId, pageIndex, rects, color } });
    }
  );
});

app.delete('/api/highlights/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM highlights WHERE id = ?', [id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, id });
  });
});

// ==========================================
// ENDPOINTS: BOOKMARKS
// ==========================================
app.get('/api/bookmarks', (req, res) => {
  const { pdfId } = req.query;
  if (!pdfId) {
    return res.status(400).json({ error: 'pdfId query parameter is required' });
  }
  db.all('SELECT * FROM bookmarks WHERE pdfId = ?', [pdfId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/bookmarks', (req, res) => {
  const { id, pdfId, pageIndex } = req.body;
  if (!id || !pdfId || pageIndex === undefined) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  db.run(
    'INSERT INTO bookmarks (id, pdfId, pageIndex) VALUES (?, ?, ?)',
    [id, pdfId, pageIndex],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, bookmark: { id, pdfId, pageIndex } });
    }
  );
});

app.delete('/api/bookmarks/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM bookmarks WHERE id = ?', [id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, id });
  });
});

// ==========================================
// ENDPOINTS: STICKY NOTES
// ==========================================
app.get('/api/sticky_notes', (req, res) => {
  const { pdfId } = req.query;
  if (!pdfId) {
    return res.status(400).json({ error: 'pdfId query parameter is required' });
  }
  db.all('SELECT * FROM sticky_notes WHERE pdfId = ?', [pdfId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/sticky_notes', (req, res) => {
  const { id, pdfId, pageIndex, x, y, color, content } = req.body;
  if (!id || !pdfId || pageIndex === undefined || x === undefined || y === undefined || !color || content === undefined) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  db.run(
    'INSERT INTO sticky_notes (id, pdfId, pageIndex, x, y, color, content) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, pdfId, pageIndex, x, y, color, content],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, stickyNote: { id, pdfId, pageIndex, x, y, color, content } });
    }
  );
});

app.put('/api/sticky_notes/:id', (req, res) => {
  const { id } = req.params;
  const { x, y, color, content } = req.body;
  
  db.run(
    'UPDATE sticky_notes SET x = COALESCE(?, x), y = COALESCE(?, y), color = COALESCE(?, color), content = COALESCE(?, content) WHERE id = ?',
    [x, y, color, content, id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, id });
    }
  );
});

app.delete('/api/sticky_notes/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM sticky_notes WHERE id = ?', [id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, id });
  });
});

// ==========================================
// ENDPOINTS: DRAWINGS
// ==========================================
app.get('/api/drawings', (req, res) => {
  const { pdfId } = req.query;
  if (!pdfId) {
    return res.status(400).json({ error: 'pdfId query parameter is required' });
  }
  db.all('SELECT * FROM drawings WHERE pdfId = ?', [pdfId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/drawings', (req, res) => {
  const { id, pdfId, pageIndex, pathData, color, strokeWidth } = req.body;
  if (!id || !pdfId || pageIndex === undefined || !pathData || !color || strokeWidth === undefined) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  db.run(
    'INSERT INTO drawings (id, pdfId, pageIndex, pathData, color, strokeWidth) VALUES (?, ?, ?, ?, ?, ?)',
    [id, pdfId, pageIndex, pathData, color, strokeWidth],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, drawing: { id, pdfId, pageIndex, pathData, color, strokeWidth } });
    }
  );
});

app.delete('/api/drawings/clear', (req, res) => {
  const { pdfId, pageIndex } = req.query;
  if (!pdfId || pageIndex === undefined) {
    return res.status(400).json({ error: 'pdfId and pageIndex query parameters are required' });
  }
  db.run('DELETE FROM drawings WHERE pdfId = ? AND pageIndex = ?', [pdfId, parseInt(pageIndex)], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, message: `Drawings cleared for pageIndex ${pageIndex}` });
  });
});

app.delete('/api/drawings/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM drawings WHERE id = ?', [id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, id });
  });
});

// ==========================================
// ENDPOINTS: TIME SPENT / FOCUS TRACKING
// ==========================================
app.get('/api/time_spent', (req, res) => {
  db.all('SELECT * FROM time_spent ORDER BY date ASC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/time_spent', (req, res) => {
  const { date, durationSeconds } = req.body;
  if (!date || durationSeconds === undefined) {
    return res.status(400).json({ error: 'date and durationSeconds are required' });
  }

  const id = `timespent_${date}`;

  // Check if date already has a focus duration record
  db.get('SELECT * FROM time_spent WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row) {
      // Date exists, let's increment it!
      const newDuration = row.durationSeconds + durationSeconds;
      db.run('UPDATE time_spent SET durationSeconds = ? WHERE id = ?', [newDuration, id], (err2) => {
        if (err2) {
          return res.status(500).json({ error: err2.message });
        }
        res.json({ success: true, timeSpent: { id, date, durationSeconds: newDuration } });
      });
    } else {
      // Date does not exist, let's insert a fresh record!
      db.run(
        'INSERT INTO time_spent (id, date, durationSeconds) VALUES (?, ?, ?)',
        [id, date, durationSeconds],
        (err2) => {
          if (err2) {
            return res.status(500).json({ error: err2.message });
          }
          res.json({ success: true, timeSpent: { id, date, durationSeconds } });
        }
      );
    }
  });
});

// ==========================================
// ENDPOINTS: GAMIFIED SCHEDULER TASKS
// ==========================================
app.get('/api/tasks', (req, res) => {
  db.all('SELECT * FROM tasks', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/tasks', (req, res) => {
  const { id, title, time, category, priority, completed } = req.body;
  if (!id || !title) {
    return res.status(400).json({ error: 'id and title are required' });
  }
  
  const finalTime = time || 'No time set';
  const finalCategory = category || 'Study';
  const finalPriority = priority || 'Medium';
  const finalCompleted = completed ? 1 : 0;

  db.run(
    'INSERT INTO tasks (id, title, time, category, priority, completed) VALUES (?, ?, ?, ?, ?, ?)',
    [id, title, finalTime, finalCategory, finalPriority, finalCompleted],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({
        success: true,
        task: {
          id,
          title,
          time: finalTime,
          category: finalCategory,
          priority: finalPriority,
          completed: finalCompleted
        }
      });
    }
  );
});

app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, time, category, priority, completed } = req.body;

  let query = 'UPDATE tasks SET ';
  const params = [];
  const updates = [];

  if (title !== undefined) {
    updates.push('title = ?');
    params.push(title);
  }
  if (time !== undefined) {
    updates.push('time = ?');
    params.push(time);
  }
  if (category !== undefined) {
    updates.push('category = ?');
    params.push(category);
  }
  if (priority !== undefined) {
    updates.push('priority = ?');
    params.push(priority);
  }
  if (completed !== undefined) {
    updates.push('completed = ?');
    params.push(completed ? 1 : 0);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  query += updates.join(', ') + ' WHERE id = ?';
  params.push(id);

  db.run(query, params, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, id });
  });
});

app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM tasks WHERE id = ?', [id], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, id });
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`EduQuest Express SQLite3 API is running on http://localhost:${PORT}`);
});
