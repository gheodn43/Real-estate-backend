import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Property Service API',
      version: '1.0.0',
      description: 'API documentation for the Property Service',
    },
    servers: [
      {
        url: 'https://api.propintel.id.vn',
        description: 'Mail server',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
