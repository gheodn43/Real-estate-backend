const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const propertyRoutes = require('./routes/property.routes');

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
