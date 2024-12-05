/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject = any> {
    /**
     * Validates the response body against the provided JSON schema.
     *
     * @param schema - JSON schema object to validate against.
     * @param options - Endpoint and method information for the schema, with optional path and status.
     *
     * @example
     * ```js
     * cy.validateSchema(schema, {
     *   endpoint: '/movies',
     *   method: 'POST'
     * })
     * ```
     *
     * You can optionally specify `path` and `status`:
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
      options: {
        path?: string;
        endpoint: string;
        method: string;
        status?: string | number;
      }
    ): Chainable<Subject>;
  }
}

export {};
