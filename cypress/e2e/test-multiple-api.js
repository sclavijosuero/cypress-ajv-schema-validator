/// <reference types="cypress" />

// Import cypress-ajv-schema-validator plugin
import '../../src/index.js'

// import 'cypress-plugin-api'
import '@bahmutov/cy-api'


// API Doc: https://petstore.swagger.io/
// OpenAPI: https://petstore.swagger.io/v2/swagger.json

import petstoreSchema from '../fixtures/schemas/petstore-swagger-errors.json'


describe('Petstore API', () => {
    
    it('should validate the OpenAPI schema for GET findByStatus "pending"', () => {
  
        const findByStatusReq = {
            url: 'https://petstore.swagger.io/v2/pet/findByStatus?status=pending',
            headers: { 'Content-Type': 'application/json' }
        }

        cy.api(findByStatusReq)
            .validateSchema(petstoreSchema, { endpoint: '/pet/findByStatus', method: 'get', status: 200 } )
    })

    it('should validate the OpenAPI schema for GET findByStatus "available', () => {

        const findByStatusReq = {
            url: 'https://petstore.swagger.io/v2/pet/findByStatus?status=available',
            headers: { 'Content-Type': 'application/json' }
        }

        cy.api(findByStatusReq)
            .validateSchema(petstoreSchema, { endpoint: '/pet/findByStatus', method: 'get', status: 200 })
    })

    it('should validate the OpenAPI schema for GET store inventory', () => {

        const storeInventoryReq = {
            url: 'https://petstore.swagger.io/v2/store/inventory',
            headers: { 'Content-Type': 'application/json' }
        }

        cy.api(storeInventoryReq)
            .validateSchema(petstoreSchema, { endpoint: '/store/inventory', method: 'get', status: 200 })
    })

})
