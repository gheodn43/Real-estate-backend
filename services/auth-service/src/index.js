require('dotenv').config();
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');

require('./passport');

const app = express();

app.use(
  cors({
    origin: [
      'https://app.propintel.id.vn',
      'http://gateway:4000',
      'http://property-service:4002',
      'http://localhost:3000',
    ],
    credentials: true,
  })
);
app.use(express.json());

app.use(
  session({
    secret: 'supersecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      sameSite: 'none',
      domain: '.propintel.id.vn',
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use('/auth/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/auth', authRoutes);
app.use('/auth/admin', adminRoutes);

const PORT = process.env.PORT || 4001;
app.listen(PORT);
