/// <reference types="cypress" />

import StyleHandler from './StyleHandler'


/**
 * Custom comant that kogs a message in Cypress Log with a specified color.
 * Additional properties are shown in the console when the log message is clicked.
 * @public
 *
 * @param {string} message - The message to be logged.
 * @param {string} hexColor - The hexadecimal color code to be used for the log message.
 * @param {Object} options - Additional options for the log message.
 * @param {string} options.displayName - The display name for the log message.
 * @param {Object} options.$el - The element associated with the log message.
 * @param {Object} [options.info={}] - Additional info to be included in the log message.
 * 
 * @example
 * cy.colorLog('You did not pass the test!', '#FF0000',
 *   { displayName: "ERROR:", info: { comments: 'Wrong!', toDo: 'Need way more practice.' } })
 */
Cypress.Commands.add('colorLog',
    (message, hexColor, { displayName, $el, info = {}}) => {
        const name = StyleHandler.getStyleName(hexColor)
        Cypress.log({
            displayName,
            message,
            name,
            $el,
            consoleProps: () => {
                // return an object which will
                // print to dev tools console on click
                return {
                    displayName,
                    message,
                    name,
                    $el,
                    ...info
                }
            },
        })
    }
)
