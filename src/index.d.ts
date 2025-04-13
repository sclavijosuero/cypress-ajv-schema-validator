/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      /**
       * Validates the response body against the provided JSON schema.
       *
       * @param {object} schema - The schema to validate against. Supported formats are plain JSON schema, Swagger, and OpenAPI documents. See https://ajv.js.org/json-schema.html for more information.
       * @param {object} [path] - The path object to the schema definition in a Swagger or OpenAPI document. Not required if the schema is a plain JSON schema.
       * @param {string} [path.endpoint] - The endpoint path. Required if the schema is a Swagger or OpenAPI document.
       * @param {string} [path.method] - The HTTP method. If not provided, it will use 'GET'.
       * @param {integer} [path.status] - The response status code. If not provided, it will use 200.
       * 
       * @returns {Cypress.Chainable} - The response object wrapped in a Cypress.Chainable.
       * @throws {Error} - If any of the required parameters are missing or if the schema or schema definition is not found.
       *
       * @example
       * ```js
       * cy.validateSchema(schema, {
       *   endpoint: '/movies',
       *   method: 'POST'
       * })
       * ```
       *
       * You can optionally specify `status`:
       *
       * @example
       * ```js
       * cy.validateSchema(schema, {
       *   endpoint: '/movies',
       *   method: 'POST',
       *   status: 201 // Defaults to 200 if not provided
       * })
       * ```
       */
      validateSchema(
        schema: Record<string, any>,
        path?: {
          endpoint: string;
          method?: string;
          status?: number;
        }
      ): Chainable<Subject>;
    }
  }
}
export {};
