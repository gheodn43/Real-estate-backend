import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Blog Service API',
      version: '1.0.0',
      description: 'APIs documentation for the Blog Service',
    },
    servers: [
      {
        url: 'http://localhost:4005',
        description: 'Blog Review Service',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
