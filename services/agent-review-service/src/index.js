import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import agentReviewRoutes from './routes/agentReview.routes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';

const app = express();
app.use(express.json());

app.use('/review/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/review/agent-reviews', agentReviewRoutes);

const PORT = process.env.PORT || 4004;
app.listen(PORT, () => {
  console.log(`Agent Review Service running on port ${PORT}`);
});
