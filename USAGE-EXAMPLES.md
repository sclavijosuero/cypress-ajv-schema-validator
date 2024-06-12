## Usage Examples

### Example: Using `cy.validateSchema` Command

#### Plain JSON Schema

```js
describe('API Schema Validation with Plain JSON', () => {
  it('should validate the user data using plain JSON schema', () => {
    const schema = {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "age": { "type": "number" }
      },
      "required": ["name", "age"]
    };

    cy.request('GET', 'https://awesome.api.com/users/1')
      .validateSchema(schema)
      .then(response => {
        // Further assertions
      });
  });
});
```

#### OpenAPI 3.0.1

```js
describe('API Schema Validation with OpenAPI 3.0.1', () => {
  it('should validate the user data using OpenAPI 3.0.1 schema', () => {
    const schema = {
      "openapi": "3.0.1",
      "paths": {
        "/users/{id}": {
          "get": {
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": { "$ref": "#/components/schemas/User" }
                  }
                }
              }
            }
          }
        }
      },
      "components": {
        "schemas": {
          "User": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "age": { "type": "number" }
            },
            "required": ["name", "age"]
          }
        }
      }
    };

    const path = { endpoint: '/users/{id}', method: 'GET', status: 200 };

    cy.request('GET', 'https://awesome.api.com/users/1')
      .validateSchema(schema, path)
      .then(response => {
        // Further assertions
      });
  });
});
```

#### Swagger 2.0

```js
describe('API Schema Validation with Swagger 2.0', () => {
  it('should validate the user data using Swagger 2.0 schema', () => {
    const schema = {
      "swagger": "2.0",
      "paths": {
        "/users/{id}": {
          "get": {
            "responses": {
              "200": {
                "schema": { "$ref": "#/definitions/User" }
              }
            }
          }
        }
      },
      "definitions": {
        "User": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "age": { "type": "number" }
          },
          "required": ["name", "age"]
        }
      }
    };

    const path = { endpoint: '/users/{id}', method: 'GET', status: 200 };

    cy.request('GET', 'https://awesome.api.com/users/1')
      .validateSchema(schema, path)
      .then(response => {
        // Further assertions
      });
  });
});
```

### Example: Using `validateSchema` Function

#### OpenAPI 3.0.1

```js
import validateSchema from 'cypress-ajv-schema-validator';

describe('API Schema Validation Function', () => {
  it('should validate the user data using validateSchema function', () => {
    const schema = {
      "openapi": "3.0.1",
      "paths": {
        "/users/{id}": {
          "get": {
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": { "$ref": "#/components/schemas/User" }
                  }
                }
              }
            }
          }
        }
      },
      "components": {
        "schemas": {
          "User": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "age": { "type": "number" }
            },
            "required": ["name", "age"]
          }
        }
      }
    };

    const path = { endpoint: '/users/{id}', method: 'GET', status: 200 };

    cy.request('GET', 'https://awesome.api.com/users/1').then(response => {
      const errors = validateSchema(response.body, schema, path);
      
      expect(errors).to.have.length(0); // Assertion to ensure no validation errors
    });
  });
});
```

### Example: Using `cy.api()` from Plugin `cypress-plugin-api` or `@bahmutov/cy-api`

```js
import 'cypress-plugin-api';
// or
// import '@bahmutov/cy-api'

describe('API Schema Validation using cy.api()', () => {
  it('should validate the user data using OpenAPI 3.0.1 schema', () => {
    const schema = {
      "openapi": "3.0.1",
      "paths": {
        "/users/{id}": {
          "get": {
            "responses": {
              "200": {
                "content": {
                  "application/json": {
                    "schema": { "$ref": "#/components/schemas/User" }
                  }
                }
              }
            }
          }
        }
      },
      "components": {
        "schemas": {
          "User": {
            "type": "object",
            "properties": {
              "name": { "type": "string" },
              "age": { "type": "number" }
            },
            "required": ["name", "age"]
          }
        }
      }
    };

    const path = { endpoint: '/users/{id}', method: 'GET', status: 200 };

    cy.api('/users/1').validateSchema(schema, path);
  });
});
```
