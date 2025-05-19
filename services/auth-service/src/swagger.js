const express = require('express');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth Service API',
      version: '1.0.0',
      description: 'API documentation for the authentication service',
    },
    servers: [
      {
        url: 'http://api.propintel.id.vn/auth',
        description: 'prod server',
      },
    ],
  },
  apis: [__dirname + '/routes/*.js'], 
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
