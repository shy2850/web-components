declare const $

interface ModelElement {
    createShadowRoot?: Function
    connectedCallback?: Function
    disconnectedCallback?: Function
    attributeChangedCallback?: Function
    adoptedCallback?: Function
}

interface Document {
    registerElement: Function
}
interface Element {
    dataset
    content
}