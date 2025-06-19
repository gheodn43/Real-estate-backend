const express = require('express');
const agentReviewRoutes = require('./routes/agentReview.routes');
const app = express();
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.json());
app.use('/agent-reviews', agentReviewRoutes);

const PORT = process.env.PORT || 4004;
app.listen(PORT, () => {
  console.log(`Agent Review Service running on port ${PORT}`);
});
