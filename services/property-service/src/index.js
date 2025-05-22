require('dotenv').config();
const express = require('express');

const app = express();
const propertyRoutes = require('./routes/property.routes');

app.use(express.json());
app.use('/properties', propertyRoutes);

const PORT = process.env.PORT || 4002;
console.log(process.env.PORT);

app.listen(PORT, () => {
  console.log(`Property service is running on port ${PORT}`);
});
