/// <reference types="cypress" />

import Ajv from "ajv"
import addFormats from "ajv-formats"

import hljs from 'highlight.js'

import './custom-log.js'

// Create a new Ajv instance (Show all validation errors and disable strict mode)
const ajv = new Ajv({ allErrors: true, strict: false })
// Note: When AJV property strict is true, for some reason the Openapi shema validation fails not recognizing "components" (Error: strict mode: unknown keyword: "components").
//       This does not happens in Swagger schema validation with the equivalent keyword "definitions".

// Extend Ajv supported formats (E.g.: uuid, email, etc.)
addFormats(ajv)


// ------------------------------------
// MESSAGE ICONS
// ------------------------------------

const iconPassed = '✔️'
const iconFailed = '❌'
const iconPropertyError = '🟠'
const iconPropertyMissing = '🟥'
const iconMoreErrors = '➕'

const warningDisableSchemaValidation = `⛔ API SCHEMA VALIDATION DISABLED ⛔`
const msgDisableSchemaValidation = '- The Cypress environment variable "disableSchemaValidation" has been set to true.'

// ------------------------------------
// PUBLIC CUSTOM COMMANDS
// ------------------------------------

/**
 * Custom command that validates the response body against the provided schema.
 * @public
 *
 * @param {object} schema - The schema to validate against. Supported formats are plain JSON schema, Swagger, and OpenAPI documents. See https://ajv.js.org/json-schema.html for more information.
 * @param {object} [path] - The path object to the schema definition in a Swagger or OpenAPI document. Not required if the schema is a plain JSON schema.
 * @param {string} [path.endpoint] - The endpoint path.
 * @param {string} [path.method] - The HTTP method. If not provided, it will use 'GET'.
 * @param {integer} [path.status] - The response status code. If not provided, it will use 200.
 * 
 * @returns {Cypress.Chainable} - The response object wrapped in a Cypress.Chainable.
 * @throws {Error} - If any of the required parameters are missing or if the schema or schema definition is not found.
 *
 * @example
 * const schema = {
 *   "swagger": "2.0",
 *   "paths": {
 *     "/users": {
 *       "get": {
 *         "responses": {
 *           "200": {
 *             "schema": { $ref: "#/definitions/User" }
 *           }
 *         }
 *       }
 *     }
 *   },
 *   "definitions": {
 *     "User": {
 *       "type": "object",
 *       "properties": {
 *         "name": { "type": "string" },
 *         "age": { "type": "number" }
 *       }
 *     }
 *   }
 * }
 *
 * const path = { endpoint: '/users', method: 'GET', status: '200' };
 *
 * cy.request('GET', `https://awesome.api.com/users`).validateSchema(schema, path).then(response => {});
 */
Cypress.Commands.add("validateSchema",
    { prevSubject: true },
    (response, schema, path) => {

        if (Cypress.env('disableSchemaValidation')) {
            cy.colorLog(msgDisableSchemaValidation,
                '#e0e030',
                { displayName: warningDisableSchemaValidation }
            )

            console.log(`${warningDisableSchemaValidation} ${msgDisableSchemaValidation}`)
        } else {

            const data = response.body

            // Validate the response body against the schema
            const errors = validateSchema(data, schema, path)

            // Log the validation result
            _logValidationResult(data, errors)

            // Return the response object so it can be chained with other commands
        }
        return cy.wrap(response, { log: false })
    }
)

// ------------------------------------
// PUBLIC FUNCTIONS
// ------------------------------------

/**
 * Validates the given data against the provided schema.
 * @public
 *
 * @param {any} data - The data to be validated.
 * @param {object} schema - The schema to validate against. Supported formats are plain JSON schema, Swagger, and OpenAPI documents. See https://ajv.js.org/json-schema.html for more information.
 * @param {object} [path] - The path object to the schema definition in a Swagger or OpenAPI document. Not required if the schema is a plain JSON schema.
 * @param {string} [path.endpoint] - The endpoint path.
 * @param {string} [path.method] - The HTTP method. If not provided, it will use 'GET'.
 * @param {integer} [path.status] - The response status code. If not provided, it will use 200
 * 
 * @returns {Array} - An array of validation errors, or null if the data is valid against the schema.
 * @throws {Error} - If any of the required parameters are missing or if the schema or schema definition is not found.
 *
 * @example
 * const schema = {
 *   "swagger": "2.0",
 *   "paths": {
 *     "/users": {
 *       "get": {
 *         "responses": {
 *           "200": {
 *             "schema": { $ref: "#/definitions/User" }
 *           }
 *         }
 *       }
 *     }
 *   },
 *   "definitions": {
 *     "User": {
 *       "type": "object",
 *       "properties": {
 *         "name": { "type": "string" },
 *         "age": { "type": "number" }
 *       }
 *     }
 *   }
 * }
 *
 * const path = { endpoint: '/users', method: 'GET', status: '200' };
 * 
 * cy.request('GET', `https://awesome.api.com/users`).then(response => {
 *   const errors = validateSchema(response.body, schema, path);
 * });
 */
export const validateSchema = (data, schema, path) => {

    if (Cypress.env('disableSchemaValidation') === true) {
        // We need to check also here since validateSchema() is a public function
        console.log(warningDisableSchemaValidation)
        return null
    }

    if (schema == null) {
        throw new Error(`You must provide a valid schema parameter!`);
    }

    if (path != null) {
        path.method = path.method || 'GET'
        path.status = path.status || 200

        // Check if the schema is a Swagger or OpenAPI document,
        // otherwise the provided schema is a valid schema object (JSON schema) and can be used as is
        if (schema.swagger || schema.openapi) {
            // Extract the schema definition from the Swagger or OpenAPI document.
            schema = _getSchemaFromSpecificationDoc(schema, path)
        }
    }

    // Validate the response body against the schema
    const { errors } = _validateSchemaAJV(schema, data)

    return errors
}


// ------------------------------------
// PRIVATE FUNCTIONS
// ------------------------------------

/**
 * Retrieves the schema definition for a given endpoint, method, and status from a Swagger or OpenAPI document.
 * @private
 *
 * @param {object} schema - The Swagger or OpenAPI document.
 * @param {object} path - The path object to the schema definition in a Swagger or OpenAPI document.
 * @param {string} path.endpoint - The endpoint path.
 * @param {string} path.method - The HTTP method.
 * @param {integer} path.status - The response status code.
 * 
 * @returns {object} - The merged schema definition with the components definitions.
 * @throws {Error} - If any of the required parameters are missing or if the schema or schema definition is not found.
 *
 * @example
 * const schema = {
 *   "swagger": "2.0",
 *   "paths": {
 *     "/users": {
 *       "get": {
 *         "responses": {
 *           "200": {
 *             "schema": { $ref: "#/definitions/User" }
 *           }
 *         }
 *       }
 *     }
 *   },
 *   "definitions": {
 *     "User": {
 *       "type": "object",
 *       "properties": {
 *         "name": { "type": "string" },
 *         "age": { "type": "number" }
 *       }
 *     }
 *   }
 * }
 *
 * const path = { endpoint: '/users', method: 'GET', status: '200' };
 *
 * const result = _getSchemaFromSpecificationDoc(schema, path);
 * console.log(result);
 * // Output: 
 * // {
 * //   $id: '/users:get:200',
 * //   type: 'object', properties: { name: { type: 'string' }, age: { type: 'number' } },
 * //   definitions: { User: { type: 'object', properties: { name: { type: 'string' }, age: { type: 'number' } } } }
 * // }
 */
const _getSchemaFromSpecificationDoc = (schema, { endpoint, method, status }) => {

    if (endpoint == null || method == null || status == null) {
        throw new Error(`You must provide valid schema parameters (missing 'endpoint', 'method' or 'status' params)!`);
    }

    // Normalize the method to lowercase for Swagger and OpenAPI documents
    method = method.toLowerCase()

    // Need to create a unique $id for each schema definition in AJV
    let $id = `${_random()}:${endpoint}:${method}:${status}`

    // Property name for the schema definition in the Swagger or OpenAPI document
    let schemaProperty
    // Object with the components (for a OpenAPI document) or the definitions (for a Swagger document) when there are $ref in the schema
    let componentsDefinitions

    if (schema.swagger) {
        schemaProperty = 'schema'
        componentsDefinitions = { definitions: schema.definitions }
    } else if (schema.openapi) {
        schemaProperty = 'content.application/json.schema'
        componentsDefinitions = { components: schema.components }
    }

    // Paths where to find the response definition for the given endpoint, method and status
    let pathStatus = `paths.${endpoint}.${method}.responses.${status}`
    // Try "default" status if status is not found
    let pathDefault = `paths.${endpoint}.${method}.responses.default`

    // Get the response definition for the given endpoint, method and status
    let responseDef = Cypress._.get(
        schema,
        pathStatus,
        Cypress._.get(schema, pathDefault) // Try "default" status if status is not found
    )
    if (responseDef === undefined) {
        throw new Error(`No response definition found for path '${pathStatus}' or ${pathDefault}'!`);
    }

    // Get the schema definition for the given endpoint, method and status
    const schemaDef = Cypress._.get(
        responseDef,
        schemaProperty
    )
    if (schemaDef === undefined) {
        throw new Error(`No schema definition found for path '${pathStatus}.${schemaProperty}'!`);
    }

    // Merge the schema definition with the components definitions as needed by AJV when there are $ref in the schema
    schema = {
        $id,
        ...schemaDef,
        ...componentsDefinitions
    }

    return schema
}


/**
 * Validates data against a JSON schema using AJV Schema validator.
 * @private
 *
 * @param {object} schema - The JSON schema to validate against.
 * @param {object} data - The data to be validated.
 * 
 * @returns {object} - An object containing the validation result and any errors: { valid, errors }.
 * 
 * @example
 * const schema = {
 *   "type": "object",
 *   "properties": {
 *     "name": { "type": "string" },
 *     "age": { "type": "number" }
 *   },
 *   "required": ["name"]
 * }
 *
 * const data = {
 *   name: 'John Wick',
 *   age: 49
 * }
 *
 * const validationResult = _validateSchemaAJV(schema, data)
 * console.log(validationResult.valid) // true
 * console.log(validationResult.errors) // null
 */
const _validateSchemaAJV = (schema, data) => {
    // Generate validating function from the schema
    const validate = ajv.compile(schema)
    // Validate the data using passed schema
    const valid = validate(data)

    return { valid, errors: validate.errors }
}


/**
 * Logs the validation result and throws an error if the response body is not valid against the schema, otherwise logs a success message.
 * It shows the total number of errors and the first 'maxErrorsToShow' errors (by default 10). If there are more errors, it shows a line with the number of additional errors.
 * @private
 *
 * @param {any} data - The data to be validated.
 * @param {Array} errors - An array of validation errors provided by AJV schema validator.
 * @param {integer} [maxErrorsToShow=10] - The maximum number of errors to show in the log.
 * 
 * @throws {Error} - If the response body is not valid against the schema.
 *
 * @example
 * _logValidationResult(null);
 * // Logs: "✔️ PASSED - THE RESPONSE BODY IS VALID AGAINST THE SCHEMA."
 *
 * _logValidationResult([{ message: 'Invalid property: name' }]);
 * // Logs: "❌ FAILED - THE RESPONSE BODY IS NOT VALID AGAINST THE SCHEMA (Number of errors: 1)."
 * // Throws an error: The response body is not valid against the schema!
 */
const _logValidationResult = (data, errors, maxErrorsToShow = 10) => {

    if (!errors) {
        // PASSED

        // Show in Cypress Log an message saying that the schema validation passed
        cy.colorLog(`**THE RESPONSE BODY IS VALID AGAINST THE SCHEMA.**`,
            '#66d966',
            { displayName: `${iconPassed} PASSED -` }
        )
    } else {
        // FAILED
        let cy_api_type

        let $original, $cloned, $elem
        const enableMismatchesOnUI = mustEnableMismatchesOnUI()

        if (enableMismatchesOnUI) {
            $original = Cypress.$('[id="api-plugin-root"] [id="api-view"]')
            if ($original.length !== 0) {
                cy_api_type = "filip"
                // Create clone of the DOM tree
                $cloned = $original.clone()
                // Find the last section in the clone to add the mismatches
                $elem = $cloned.find('section:last-of-type [data-cy="responseBody"] code > details > summary')
            } else {
                $original = Cypress.$('.cy-api-response:last-of-type pre')
                if ($original.length !== 0) {
                    cy_api_type = "gleb"
                }
            }
        }

        // Create a copy of the data validated to show the mismatches
        const dataMismatches = Cypress._.cloneDeep(data)

        errors.forEach(error => {
            let instancePathArray = error.instancePath.replace(/^\//, '').split('/') // Remove the first '/' from the instance path "/0/name" => "0/name"
            let instancePath = instancePathArray.join('.')

            let errorDescription
            let value = Cypress._.get(data, instancePath)

            if (error.keyword === 'required') {
                const missingProperty = error.params.missingProperty
                instancePath = (instancePath === "") ? missingProperty : `${instancePath}.${missingProperty}`

                errorDescription = `${iconPropertyMissing} Missing property '${missingProperty}'`
            } else {
                const message = error.message
                errorDescription = `${iconPropertyError} ${String(JSON.stringify(value)).replaceAll("\"", "'")} ${message}` // We also use String() to handle the case of undefined values
            }
            Cypress._.set(dataMismatches, instancePath, errorDescription)

            if (enableMismatchesOnUI && $elem && $elem.length) {
                // Show in the API View the data with the mismatches
                if (cy_api_type === "filip") {
                    showDataMismatchesApiViewFilip($elem, instancePathArray, errorDescription, error, 0)
                }
            }
        })

        if (enableMismatchesOnUI) {
            // Replace the original DOM tree with the cloned one with the mismatches
            if (cy_api_type === "filip") {
                $original.replaceWith($cloned)
            } else if (cy_api_type === "gleb") {
                $original.replaceWith(Cypress.$(transformDataToHtmlGleb(dataMismatches)))
            }
        }

        // Show in Cypress Log an error message saying that the schema validation failed and total number of errors
        // On click, it will show in the console:
        //   - Total number of errors
        //   - Full list of errors as provided by AJV
        //   - User friendly representation of the mismatches in the data ❤️
        cy.colorLog(`**THE RESPONSE BODY IS NOT VALID AGAINST THE SCHEMA (Number of schema errors: ${errors.length}).**`,
            '#e34040',
            { displayName: `${iconFailed} FAILED -`, info: { number_of_schema_errors: errors.length, schema_errors: errors, mismatches_in_data: dataMismatches } }
        )

        // Logic to create two group of errors: the first 'maxErrorsToShow' and the rest of errors (to avoid showing a huge amount of errors in the Cypress Log)
        // Note that if the total number of errors is 'maxErrorsToShow'+1 it will show all the errors since there will anyway one more line
        let errorsToShow, rest_of_errors

        if (errors.length > maxErrorsToShow + 1) {
            errorsToShow = errors.slice(0, maxErrorsToShow)
            rest_of_errors = errors.slice(maxErrorsToShow)
        } else {
            errorsToShow = errors
        }

        // Show in Cypress Log the first 'maxErrorsToShow' as provided by AJV
        errorsToShow.forEach(error => {
            const iconError = (error.keyword) === 'required' ? iconPropertyMissing : iconPropertyError
            const colorError = (error.keyword) === 'required' ? '#f58e8e' : '#ee930a'

            cy.colorLog(`${JSON.stringify(error, "", 1)}`,
                colorError,
                { displayName: iconError, info: { schema_error: error } }
            )
        })

        // Show in Cypress Log the rest of errors if there are more than 'maxErrorsToShow' as provided by AJV
        if (rest_of_errors) {
            cy.colorLog(`...and ${errors.length - maxErrorsToShow} more errors.`,
                '#f58e8e',
                { displayName: iconMoreErrors, info: { rest_of_errors } }
            )
        }

        // Throw an error to fail the test
        cy.then(() => {
            throw new Error('The response body is not valid against the schema!')
        })
    }
}



const transformDataToHtmlGleb = (jsonObject) => {
    const fontStyles = `font-weight: bold; font-size: 1.3em;`

    let json = hljs.highlight(JSON.stringify(jsonObject, null, 4), {
        language: 'json',
    }).value

    const regexpError = RegExp(`>&quot;${iconPropertyError}`, 'g')
    json = json.replaceAll(regexpError, (match) => {
        return ` style="${fontStyles} color: #ee930a;"${match}`
    });

    const regexpMissing = RegExp(`>&quot;${iconPropertyMissing}`, 'g')
    json = json.replaceAll(regexpMissing, (match) => {
        return ` style="${fontStyles}; color: #c10000;"${match}`
    });

    return `<pre class="hljs">${json}</pre>`
};


const showDataMismatchesApiViewFilip = ($content, instancePathArray, errorDescription, error, depth) => {
    const fontStyles = `font-weight: bold; font-size: 1.3em;`
    let path0 = instancePathArray.shift()

    if ($content.hasClass('bracket')) {
        // It's an Array
        const $elem = $content.siblings(`details`).eq(parseInt(path0))

        if ($elem.length === 0) {
            Cypress.$(`<span style="${fontStyles} padding-left: 15px; color: #ffcc80;">👉 Array ${error.message} </span>`).insertAfter($content.parent().next())
        } else {
            showDataMismatchesApiViewFilip($elem.children('summary'), instancePathArray, errorDescription, error, depth + 1)
        }
    }
    else if ($content.hasClass('brace')) {
        // It's an Object
        const $elem = $content.siblings(`.token.property:contains(\"${path0}\")`).filter((i, e) => {  // For exact match
            return Cypress.$(e).text() === `"${path0}"`
        })

        if ($elem.length === 0) {
            // Missing property
            Cypress.$(`<br><span class="line-number text-slate-700 select-none contents align-top">      </span><span style="${fontStyles} padding-left: ${25 + (depth - 1) * 14}px; color: #ff4d4d;">"${error.params.missingProperty}": ${errorDescription} </span>`).insertAfter($content)
        } else {
            let $value = $elem.next().next()
            if ($value.is('details')) {
                $value = $value.children('summary')
            }

            showDataMismatchesApiViewFilip($value, instancePathArray, errorDescription, error, depth + 1)
        }
    } else {
        // Error in a property
        Cypress.$(`<span style="${fontStyles} padding-left: 15px; color: orange;">${errorDescription} </span>`).insertAfter($content)
    }
}

const mustEnableMismatchesOnUI = () => {
    return Cypress.config('isInteractive') && Cypress.env('enableMismatchesOnUI')
}

/**
 * Generates a random string with 10 characters.
 * @private
 *
 * @returns {string} A random string.
 * 
 * @example
 * const randomString = _random();
 * console.log(randomString); // Output: "3hj7k9da1e"
 */
const _random = () => {
    return Math.random().toString(36).substring(10)

}