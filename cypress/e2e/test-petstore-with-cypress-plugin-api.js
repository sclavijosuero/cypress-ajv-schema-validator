/// <reference types="cypress" />

// Import cypress-ajv-schema-validator plugin
import '../../src/index.js'

import 'cypress-plugin-api'

describe('Petstore API', () => {

    var petstoreAPISchema

    before(() => {
        cy.api('https://petstore.swagger.io/v2/swagger.json').its('body', { log: false }).then((schema) => {
            petstoreAPISchema = schema
        })

    })

    it('should validate the OpenAPI schema', () => {
        cy.api(
            { url: 'https://petstore.swagger.io/v2/pet/findByStatus?status=pending', headers: { 'Content-Type': 'application/json' } }).then((response) => {
                expect(response.status).to.eq(200)
            }).validateSchema(petstoreAPISchema, { endpoint: '/pet/findByStatus', method: 'get', status: 200 })
    })
})

