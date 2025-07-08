import dotenv from 'dotenv';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/blogs/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/blogs', blogReviewRoutes);

const PORT = process.env.PORT || 4005;
app.listen(PORT);
