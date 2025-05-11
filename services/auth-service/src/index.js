require('dotenv').config();
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const authRoutes = require('./routes/auth.routes');

require('./passport');

const app = express();

app.use(session({
  secret: 'supersecret',
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Auth Service running on http://localhost:${PORT}`);
});
