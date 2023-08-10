// app.js
require('dotenv').config({ path: __dirname + '/.env' });
// Import required modules
const express = require('express');
const cors = require('cors');
const app = express();
const {createGame} = require('./api/AirtableAPI'); 
const multer = require('multer');
// const upload = multer(); //
const storage = multer.memoryStorage(); // Store files in memory as buffers
const upload = multer({ storage });

// 

app.use(cors());
app.use(express.json());

app.post('/new-game', upload.array('pdf'), async (req, res) => {
try {
  
  createGame(req.files,req.body.data,req.body.roles)
  res.status(200).json({ message: 'Data and PDFs submitted successfully' });
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({ error: 'An error occurred' });
}
});


// Start the server
const port = 3001; // Replace with your desired port number
app.listen(port, () => {
console.log(`Server running on port ${port}`);
});
