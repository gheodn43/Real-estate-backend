import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Property Service API',
      version: '1.0.0',
      description: 'APIs documentation for the Property Service',
    },
    servers: [
      {
        url: 'http://api.propintel.id.vn',
        description: 'Property server',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
