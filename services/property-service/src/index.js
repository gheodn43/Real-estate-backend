import dotenv from 'dotenv';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';

import categoryRoutes from './routes/category.routes.js';
import categoryDetailRoutes from './routes/category.detail.route.js';
import amenityRoutes from './routes/amenity.routes.js';
import propertyRoutes from './routes/property.routes.js';
import uploadImageRoutes from './routes/uploadImage.routes.js';
import expressFileUpload from 'express-fileupload';
import commissionRoutes from './routes/commission.routes.js';
import saleRoutes from './routes/sale.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(expressFileUpload());

app.use('/prop/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/prop/category', categoryRoutes);
app.use('/prop/category/detail', categoryDetailRoutes);
app.use('/prop/amenity', amenityRoutes);
app.use('/prop', propertyRoutes);
app.use('/prop/upload', uploadImageRoutes);
app.use('/prop/commission', commissionRoutes);
app.use('/prop/sale', saleRoutes);
app.use('/prop/dashboard', dashboardRoutes);

const PORT = process.env.PORT || 4002;
app.listen(PORT);
