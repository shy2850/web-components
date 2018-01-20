export default class extends HTMLElement implements ModelElement {
    static option = {
        extends: 'select'
    }
    constructor() {
        super()
        const shadowRoot = this.attachShadow({mode: 'open'})
        const template = document.currentScript.ownerDocument.getElementById('MODULE_ID')
        shadowRoot.appendChild(template.content.cloneNode(true))
        $(shadowRoot).find('ul').append($(this.children))
    }
    connectedCallback () {

    }
}