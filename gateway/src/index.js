import dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';
import swaggerUi from 'swagger-ui-express';
import { mergeSpecs } from './merge-swagger-utils.js';

dotenv.config();
const app = express();

app.get('/swagger.json', async (req, res) => {
  try {
    const [auth, property, agentReview, blog, agentChat] = await Promise.all([
      axios.get('http://auth-service:4001/swagger.json'),
      axios.get('http://property-service:4002/swagger.json'),
      axios.get('http://agent-review-service:4004/swagger.json'),
      axios.get('http://blog-service:4005/swagger.json'),
      axios.get('http://agent-chat-service:3000/swagger.json'),
    ]);
    const mergedSpec = mergeSpecs([
      auth.data,
      property.data,
      agentReview.data,
      blog.data,
      agentChat.data,
    ]);

    mergedSpec.info = {
      title: 'Merged API Documentation',
      version: '1.0.0',
      description: 'This is the merged Swagger documentation.',
    };
    mergedSpec.servers = [
      {
        url: process.env.SERVER_URL,
        description: 'Propintel  server',
      },
    ];
    res.json(mergedSpec);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch specs ' });
  }
});

app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerUrl: '/swagger.json',
  })
);
const PORT = process.env.PORT || 4000;
app.listen(PORT);
