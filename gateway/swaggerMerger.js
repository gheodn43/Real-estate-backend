const axios = require('axios');

async function fetchSwaggerDocs(services) {
  const merged = {
    openapi: '3.0.0',
    info: {
      title: 'Gateway API Docs',
      version: '1.0.0',
    },
    paths: {},
    components: {
      schemas: {},
      securitySchemes: {}
    },
  };
  for (const service of services) {
      const res = await axios.get(service.url);
      const doc = res.data;
      Object.assign(merged.paths, doc.paths);
      if (doc.components && doc.components.schemas) {
        Object.assign(merged.components.schemas, doc.components.schemas);
      }
      if (doc.components && doc.components.securitySchemes) {
        Object.assign(merged.components.securitySchemes, doc.components.securitySchemes);
      }
  }
  return merged;
}
module.exports = fetchSwaggerDocs;
