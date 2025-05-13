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

// Route logout
router.get('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { return res.status(500).json({ message: 'Logout failed', error: err }); }
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });
});

module.exports = router;
