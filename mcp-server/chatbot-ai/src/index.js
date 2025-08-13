import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';

import chatRoutes from './routes/chat.js';
import googleMapRoutes from './routes/googleMap.js';
import kiemDuyetRoutes from './routes/kiemDuyet.js';

dotenv.config();

const app = express();
app.use(express.json());
app.set('trust proxy', true);

app.use('/agent-chat/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/agent-chat', chatRoutes);
app.use('/agent-chat/map', googleMapRoutes);
app.use('/agent-chat/censorship', kiemDuyetRoutes);

const MONGO_URL = process.env.DATABASE_URL;

mongoose
  .connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT);
