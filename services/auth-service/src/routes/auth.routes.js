const express = require('express');
const passport = require('passport');

const router = express.Router();

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: false
  }),
  (req, res) => {
    res.json({
      message: 'Logged in with Google',
      user: req.user
    });
  }
);

module.exports = router;
