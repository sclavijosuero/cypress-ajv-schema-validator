/// <reference types="cypress" />

import hljs from 'highlight.js'
import { validateSchema } from 'core-ajv-schema-validator'

import './custom-log.js'


// ------------------------------------
// MESSAGE ICONS
// ------------------------------------

const iconPassed = '✔️'
const iconFailed = '❌'
const iconMoreErrors = '➕'

const issueStylesOverride = {
    iconPropertyError: '😱',
    colorPropertyError: '#ee930a',
    iconPropertyMissing: '😡',
    colorPropertyMissing: '#c10000'
}

const warningDisableSchemaValidation = `⚠️ API SCHEMA VALIDATION DISABLED ⚠️`
const msgDisableSchemaValidation = '- The Cypress environment variable "disableSchemaValidation" has been set to true.'
const errorNoValidApiResponse = 'The element chained to the cy.validateSchema() command is expected to be an API response!'
const errorResponseBodyAgainstSchema = 'The response body is not valid against the schema!'

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
            // Check if it is a valid API Response object
            if (response == null || (!response.hasOwnProperty('body') && !response.hasOwnProperty('status') && !response.hasOwnProperty('headers'))) {
                console.log(errorNoValidApiResponse)
                throw new Error(errorNoValidApiResponse)
            }

            const data = response.body

            // Validate the response body against the schema
            const validationResult = validateSchema(data, schema, path)

            // Log the validation result
            _logValidationResult(data, validationResult)

            // Return the response object so it can be chained with other commands
        }
        return cy.wrap(response, { log: false })
    }
)

/**
 * Recursively replaces specific icon properties in the provided data structure with overrides
 * based on the given issueStyles object. Supports strings, arrays, and objects.
 *
 * @param {string|Array|Object} data - The data to process. Can be a string, an array, or an object.
 * @param {Object} issueStyles - An object containing the icon properties to replace.
 * @param {string} issueStyles.iconPropertyError - The icon property to replace for errors.
 * @param {string} issueStyles.iconPropertyMissing - The icon property to replace for missing values.
 * @returns {string|Array|Object} - The processed data with replaced icon properties.
 */
const replaceIcons = (data, issueStyles) => {
    if (typeof data === 'string') {
        return data
            .replaceAll(issueStyles.iconPropertyError, issueStylesOverride.iconPropertyError)
            .replaceAll(issueStyles.iconPropertyMissing, issueStylesOverride.iconPropertyMissing);
    } else if (Array.isArray(data)) {
        return data.map(item => replaceIcons(item, issueStyles));
    } else if (typeof data === 'object' && data !== null) {
        return Object.fromEntries(
            Object.entries(data).map(([key, value]) => [key, replaceIcons(value, issueStyles)])
        );
    }
    return data;
};

/**
 * Logs the validation result and throws an error if the response body is not valid against the schema, otherwise logs a success message.
 * It shows the total number of errors and the first 'maxErrorsToShow' errors (by default 10). If there are more errors, it shows a line with the number of additional errors.
 * @private
 *
 * @param {any} data - The data to be validated.
 * @param {object} validationResults - An object containing:
 * @param {Array} validationResults.errors - An array of validation errors, or null if the data is valid against the schema.
 * @param {object} validationResults.dataMismatches - The original response data with all schema mismatches flagged directly.
 * @param {object} validationResults.issueStyles - An object with the icons and HEX colors used to flag the issues. Includes the properties: iconPropertyError, and iconPropertyMissing.
 * @param {Array} validationResults.issueStyles.iconPropertyError - The icon used to flag the property error.
 * @param {Array} validationResults.issueStyles.iconPropertyMissing - The icon used to flag the missing property.
 * @param {integer} [maxErrorsToShow=10] - The maximum number of errors to show in the log.
 * 
 * @throws {Error} - If the response body is not valid against the schema.
  */
const _logValidationResult = (data, validationResults, maxErrorsToShow = 10) => {

    let { errors, dataMismatches, issueStyles } = validationResults

    dataMismatches = replaceIcons(dataMismatches, issueStyles);

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

        const { iconPropertyError, colorPropertyError, iconPropertyMissing, colorPropertyMissing } = issueStylesOverride

        if (cy_api_type === "filip") {
            // Filip's API View needs it's own processing to show the mismatches (similar logic as for package core-ajv-schema-validator)

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

                if (enableMismatchesOnUI && $elem && $elem.length) {
                    // Show in the API View the data with the mismatches
                    showDataMismatchesApiViewFilip($elem, instancePathArray, errorDescription, error, 0)
                }
            })
        }

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
            { displayName: `${iconFailed} FAILED -`, info: { number_of_schema_errors: errors.length, ajv_errors: errors, data_mismatches: dataMismatches } }
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
            const colorError = (error.keyword) === 'required' ? colorPropertyMissing : colorPropertyError

            cy.colorLog(`${JSON.stringify(error, "", 1)}`,
                colorError,
                { displayName: iconError, info: { schema_error: error } }
            )
        })

        // Show in Cypress Log the rest of errors if there are more than 'maxErrorsToShow' as provided by AJV
        if (rest_of_errors) {
            cy.colorLog(`...and ${errors.length - maxErrorsToShow} more errors.`,
                colorPropertyMissing,
                { displayName: iconMoreErrors, info: { rest_of_errors } }
            )
        }

        // Throw an error to fail the test
        cy.then(() => {
            console.log(errorResponseBodyAgainstSchema)
            throw new Error(errorResponseBodyAgainstSchema)
        })
    }
}



/**
 * Transforms a JSON object into an HTML string with syntax highlighting and custom styles for specific properties.
 *
 * @param {Object} jsonObject - The JSON object to be transformed into HTML.

 * @returns {string} - An HTML string with syntax-highlighted JSON and custom styles applied.
 */
const transformDataToHtmlGleb = (jsonObject) => {
    const { iconPropertyError, colorPropertyError, iconPropertyMissing, colorPropertyMissing } = issueStylesOverride

    const fontStyles = `font-weight: bold; font-size: 1.3em;`
    let jsonString = JSON.stringify(jsonObject, null, 4)

    let json = hljs.highlight(jsonString, {
        language: 'json',
    }).value

    const regexpError = RegExp(`>&quot;${iconPropertyError}`, 'g')
    json = json.replaceAll(regexpError, (match) => {
        return ` style="${fontStyles} color: ${colorPropertyError};"${match}`
    });

    const regexpMissing = RegExp(`>&quot;${iconPropertyMissing}`, 'g')
    json = json.replaceAll(regexpMissing, (match) => {
        return ` style="${fontStyles}; color: ${colorPropertyMissing};"${match}`
    });

    return `<pre class="hljs">${json}</pre>`
};


/**
 * Recursively traverses and displays data mismatches in an API view, highlighting errors in arrays, objects, or properties.
 *
 * @param {JQuery<HTMLElement>} $content - The current DOM element being processed.
 * @param {string[]} instancePathArray - An array representing the path to the current data point in the JSON structure.
 * @param {string} errorDescription - A description of the error to display.
 * @param {Object} error - The error object containing details about the validation error.
 * @param {number} depth - The current depth of recursion, used for indentation and styling.
 */
const showDataMismatchesApiViewFilip = ($content, instancePathArray, errorDescription, error, depth) => {
    const { colorPropertyError, colorPropertyMissing } = issueStylesOverride

    const fontStyles = `font-weight: bold; font-size: 1.3em;`
    let path0 = instancePathArray.shift()

    if ($content.hasClass('bracket')) {
        // It's an Array
        const $elem = $content.siblings(`details`).eq(parseInt(path0))

        if ($elem.length === 0) {
            Cypress.$(`<span style="${fontStyles} padding-left: 15px; color: ${colorPropertyError};">👉 Array ${error.message} </span>`).insertAfter($content.parent().next())
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
            Cypress.$(`<br><span class="line-number text-slate-700 select-none contents align-top">      </span><span style="${fontStyles} padding-left: ${25 + (depth - 1) * 14}px; color: ${colorPropertyMissing};">"${error.params.missingProperty}": ${errorDescription} </span>`).insertAfter($content)
        } else {
            let $value = $elem.next().next()
            if ($value.is('details')) {
                $value = $value.children('summary')
            }

            showDataMismatchesApiViewFilip($value, instancePathArray, errorDescription, error, depth + 1)
        }
    } else {
        // Error in a property
        Cypress.$(`<span style="${fontStyles} padding-left: 15px; color: ${colorPropertyError};">${errorDescription} </span>`).insertAfter($content)
    }
}

/**
 * Determines whether mismatches should be enabled on the UI.
 * This is based on the Cypress configuration and environment variables.
 *
 * @returns {boolean} - Returns `true` if the Cypress environment is interactive
 * and the `enableMismatchesOnUI` environment variable is set; otherwise, `false`.
 */
const mustEnableMismatchesOnUI = () => {
    return Cypress.config('isInteractive') && Cypress.env('enableMismatchesOnUI')
}
