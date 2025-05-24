import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';
import propertyRoutes from './routes/property.routes.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: [
      'https://app.propintel.id.vn',
      'http://gateway:4000',
      'http://auth-service:4001',
      'http://localhost:3000',
    ],
    credentials: true,
  })
);

app.use('/prop/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/prop', propertyRoutes);
const PORT = process.env.PORT || 4002;
app.listen(PORT);
