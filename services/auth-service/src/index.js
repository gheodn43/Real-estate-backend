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

// Middleware xử lý JSON
app.use(express.json());

// Cấu hình session
app.use(
  session({
    secret: 'supersecret',
    resave: false,
    saveUninitialized: true,
  })
);

// Khởi tạo passport
app.use(passport.initialize());
app.use(passport.session());
app.use('/auth/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
// Routes
app.use('/auth', authRoutes);
app.use('/auth/admin', adminRoutes);

// Khởi động server
const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Auth Service running on http://auth-service:${PORT}`);
});
