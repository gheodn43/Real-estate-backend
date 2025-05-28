import dotenv from 'dotenv';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';
import categoryRoutes from './routes/category.routes.js';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/prop/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/prop/category', categoryRoutes);
const PORT = process.env.PORT || 4002;
app.listen(PORT);
