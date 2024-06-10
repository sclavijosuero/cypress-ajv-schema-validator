/// <reference types="cypress" />

import '../../src/index.js'

import openApiSchema from '../fixtures/schemas/openapi-schema.json'
import swaggerSchema from '../fixtures/schemas/swagger-schema.json'
import tests from '../fixtures/mock-data-openapi-swagger/tests.json'


const runTestsOpenapiSwagger = (scenario) => {

    [openApiSchema, swaggerSchema].forEach(schema => {

        const schemaSpecVersion = schema.swagger ? `Swagger ${schema.swagger}` : `OpenAPI ${schema.openapi}`

        context(`Schema Validation for ${schemaSpecVersion}`, () => {

            tests.forEach(test => {

                it(`${test.method} ${test.endpoint} (${test.status} Response)`, () => {
                    cy.fixture(`mock-data-openapi-swagger/${scenario}/${test.method}${test.endpoint}_${test.status}.json`).then((data) => {
                        cy.wrap({ status: test.status, body: data }, { log: false }).validateSchema(schema, { endpoint: test.endpoint, method: test.method, status: test.status })
                    })
                })

            })
        })
    })
}

export default runTestsOpenapiSwagger