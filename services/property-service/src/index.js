require('dotenv').config();
const express = require('express');
const app = express();
const propertyRoutes = require('./routes/property.routes');
app.use(express.json());
app.use('/properties', propertyRoutes);
