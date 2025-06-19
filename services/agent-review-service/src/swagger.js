const swaggerJsdoc = require('swagger-jsdoc');
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Agent Review Service API',
      version: '1.0.0',
      description: 'APIs documentation for the Agent Review Service',
    },
    servers: [
      {
        url: 'http://localhost:4004',
        description: 'Agent Review Service',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};
const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
