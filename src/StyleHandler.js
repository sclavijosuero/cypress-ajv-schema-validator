/**
 * Class representing a StyleHandler.
 */
export default class StyleHandler {

    /**
     * A Set to store the cached styles.
     * @private
     * 
     * @type {Set}
     */
    static _cachedStyles = new Set()

    /**
     * Get the style name for the given hex color.
     * @public
     * 
     * @param {string} hexColor - The hex color code.
     * 
     * @returns {string} The style name.
     */
    static getStyleName = (hexColor = '#FFFFFF') => {
        const styleName = `colorLog${hexColor.replace("#", "-")}`

        if (!StyleHandler._cachedStyles.has(styleName)) {
            StyleHandler._createStyle(styleName, hexColor) // Create style element in the document
            StyleHandler._cachedStyles.add(styleName) // Cache the style name
        }

        return styleName
    }

    /**
     * Create a style element in the web document.
     * @private
     * 
     * @param {string} styleName - The style name.
     * @param {string} hexColor - The hex color code.
     */
    static _createStyle = (styleName, hexColor) => {
        const style = document.createElement('style')

        style.textContent = `
            .command.command-name-${styleName} span.command-method {
                color: ${hexColor} !important;
                text-transform: uppercase;
                font-weight: bold;
                background-color: none;
                border-color: none;
            }
    
            .command.command-name-${styleName} span.command-message{
                color: ${hexColor} !important;
                font-weight: normal;
                background-color: none;
                border-color: none;
            }
    
            .command.command-name-${styleName} span.command-message strong,
            .command.command-name-${styleName} span.command-message em { 
                color: ${hexColor} !important;
                background-color: none;
                border-color: none;
            }
        `
        
        Cypress.$(window.top.document.head).append(style)
    }
}