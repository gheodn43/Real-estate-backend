import dotenv from 'dotenv';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';
import authMailRoutes from './routes/authMail.routes.js';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/mail/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/mail/auth', authMailRoutes);

const PORT = process.env.PORT || 4003;
app.listen(PORT);
