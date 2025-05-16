require('dotenv').config();
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors'); 
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const path = require('path');
const authRoutes = require('./routes/auth.routes');

require('./passport');

const app = express();

// Cấu hình CORS để hỗ trợ cả localhost:8080 và localhost:4001
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:4001'],
  credentials: true
})); 

// Phục vụ file tĩnh từ thư mục frontend
app.use(express.static(path.join(__dirname, '../../../frontend')));

// Middleware xử lý JSON
app.use(express.json());

// Cấu hình session
app.use(session({
  secret: 'supersecret',
  resave: false,
  saveUninitialized: true
}));

// Khởi tạo passport
app.use(passport.initialize());
app.use(passport.session());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/auth', authRoutes);

// Khởi động server
const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Auth Service running on http://localhost:${PORT}`);
});