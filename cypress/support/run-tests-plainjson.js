/// <reference types="cypress" />

import '../../src/index.js'

import schema from '../fixtures/schemas/plainjson-schema.json'


const runTestsPlainJson = (scenario) => {
    it(`Test Plain JSON Schema`, () => {
        cy.fixture(`mock-data-plainjson/${scenario}.json`).then((data) => {
            cy.wrap({ status: 200, body: data }, { log: false }).validateSchema(schema)
        })
    })

}

export default runTestsPlainJson