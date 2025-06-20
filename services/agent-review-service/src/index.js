import express from 'express';
import agentReviewRoutes from './routes/agentReview.routes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';

const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.json());
app.use('/agent-reviews', agentReviewRoutes);

const PORT = process.env.PORT || 4004;
app.listen(PORT, () => {
  console.log(`Agent Review Service running on port ${PORT}`);
});
