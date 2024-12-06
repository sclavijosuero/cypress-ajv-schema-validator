/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      /**
       * Validates the response body against the provided JSON schema.
       *
       * @param schema - JSON schema object, Swagger 2 schema document, or OpenAPI 3 schema document to validate against.
       * @param path - Endpoint, method and status information to locate the schema within the Swager or OpenAPI schema document. Only needed when `schema` is a Swagger or OpenAPI documents. Status is optional, by default 200.
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
          method: string;
          status?: number;
        }
      ): Chainable<Subject>;
    }
  }
}
export {};
