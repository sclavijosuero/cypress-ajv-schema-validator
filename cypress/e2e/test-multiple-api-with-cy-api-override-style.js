/// <reference types="cypress" />

// Import cypress-ajv-schema-validator plugin
import '../../src/index.js'

import '@bahmutov/cy-api'

// API Doc: https://petstore.swagger.io/
// OpenAPI: https://petstore.swagger.io/v2/swagger.json

import petstoreSchema from '../fixtures/schemas/petstore-swagger-errors.json'

const issuesStylesOverride = {
    iconPropertyError: '🟦',
    colorPropertyError: '#5178eb',
    iconPropertyMissing: '🟪',
    colorPropertyMissing: '#800080'
}


describe('Petstore API', () => {
    
    it('should validate the OpenAPI schema for GET findByStatus "pending" - Styles override', () => {
  
        const findByStatusReq = {
            url: 'https://petstore.swagger.io/v2/pet/findByStatus?status=pending',
            headers: { 'Content-Type': 'application/json' }
        }

        cy.api(findByStatusReq)
            .validateSchema(petstoreSchema, { endpoint: '/pet/findByStatus', method: 'get', status: 200 }, issuesStylesOverride)
    })

    it('should validate the OpenAPI schema for GET findByStatus "available - Styles override', () => {

        const findByStatusReq = {
            url: 'https://petstore.swagger.io/v2/pet/findByStatus?status=available',
            headers: { 'Content-Type': 'application/json' }
        }

        cy.api(findByStatusReq)
            .validateSchema(petstoreSchema, { endpoint: '/pet/findByStatus', method: 'get', status: 200 }, issuesStylesOverride)
    })

    it('should validate the OpenAPI schema for GET store inventory - Styles override', () => {

        const storeInventoryReq = {
            url: 'https://petstore.swagger.io/v2/store/inventory',
            headers: { 'Content-Type': 'application/json' }
        }

        cy.api(storeInventoryReq)
            .validateSchema(petstoreSchema, { endpoint: '/store/inventory', method: 'get', status: 200 }, issuesStylesOverride)
    })

})
