import express from 'express';
import axios from 'axios';
import swaggerUi from 'swagger-ui-express';
import { mergeSpecs } from './merge-swagger-utils.js';

const app = express();

app.get('/swagger.json', async (req, res) => {
  try {
    const [auth] = await Promise.all([
      axios.get('http://auth-service:4001/swagger.json'),
    ]);
    const mergedSpec = mergeSpecs([auth.data]);
    res.json(mergedSpec);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch specs' });
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
