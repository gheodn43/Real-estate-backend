require('dotenv').config();
const express = require('express');
const app = express();
const propertyRoutes = require('./routes/property.routes');

app.use(express.json());
app.use('/properties', propertyRoutes);

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
  console.log(`Property service is running on port ${PORT}`);
});
