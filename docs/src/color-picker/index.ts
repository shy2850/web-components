const colors = [
    '#000000',
    '#c23531',
    '#2f4554',
    '#61a0a8',
    '#d48265',
    '#91c7ae',
    '#749f83',
    '#ca8622',
    '#bda29a',
    '#6e7074',
    '#546570',
    '#c4ccd3'
]
export default class extends HTMLElement implements ModelElement {
    static option = {
        extends: 'input'
    }
    static get observedAttributes() {
        return ['value']
    }
    color
    set value (v) {
        $(this).css({background: v})
        this.color = v
    }
    get value () {
        return this.color
    }
    connectedCallback() {
        const _t = this
        const t = $(this)
        _t.value = t.attr('value')
        t.css({background: _t.value})
        t.on('mouseout', e => {
            t.css({background: _t.value})
        })

        const shadowRoot = this.attachShadow({mode: 'open'})
        const template = document.currentScript.ownerDocument.getElementById('MODULE_ID')
        shadowRoot.appendChild(template.content.cloneNode(true))
        
        const ul = $(shadowRoot).find('ul')
        ul.html(colors.map((c) => `<li style="background: ${c}" data-color="${c}"></li>`).join(''))
        ul.on('mouseover', 'li', function (e) {
            let target = $(e.target)
            t.css({background: target.data('color')})
        }).on('click', 'li', function (e) {
            let target = $(e.target)
            _t.value = target.data('color')
            t.trigger('change', e)
        })
    }
    attributeChangedCallback (attrName, oldVal, newVal) {
        console.log({attrName, oldVal, newVal})
    }
}