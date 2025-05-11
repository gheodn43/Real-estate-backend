require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'Auth Service running 🚀' });
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Auth service listening on port ${PORT}`);
});
