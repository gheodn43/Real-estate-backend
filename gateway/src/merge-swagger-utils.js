export function mergeSpecs(specs) {
    const base = {
      ...specs[0],
      paths: { ...specs[0].paths },
      components: { ...specs[0].components, schemas: { ...(specs[0].components?.schemas || {}) } }
    };
  
    for (let i = 1; i < specs.length; i++) {
      const spec = specs[i];
  
      for (const path in spec.paths) {
        if (base.paths[path]) {
          console.warn(`Duplicate path found: ${path}, will be overwritten.`);
        }
        base.paths[path] = spec.paths[path];
      }
  
      if (spec.components?.schemas) {
        base.components.schemas = {
          ...base.components.schemas,
          ...spec.components.schemas,
        };
      }
  
      const otherComponents = ['responses', 'parameters', 'securitySchemes'];
      for (const key of otherComponents) {
        if (spec.components?.[key]) {
          base.components[key] = {
            ...(base.components[key] || {}),
            ...spec.components[key],
          };
        }
      }
    }
  
    return base;
  }
  