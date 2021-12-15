class AppSelectorOptions {
    public DisplayProperty: string;
    public ValueProperty: string;
    public OnSelected: string;
    public MinLengtToSearch: string = "";
    public Modes: string[]=[""];
    public DataFunction: string = "";
}

class App_Selector extends HTMLElement {

    private TextInput: HTMLInputElement;

    private List: HTMLUListElement;
    private Activator: HTMLElement;
    private Clearer: HTMLElement;

    private _value: string;

    public get value() {
        return this._value;
    }

    public set value(val:any) {
        this.value = val;
    }

    static get observedAttributes() {
        return ["value", "label"];
    }
    constructor() {
        super();
    }
    public attributeChangedCallback(attrName, oldValue, newValue) {
        this[attrName] = newValue;
    }

    public connectedCallback() {
        var element = this;
        if (!IsNull(element.shadowRoot)) {
            return;
        }
        var sheet = GetControlSheet();
        var cssText = Array.from(sheet.cssRules).Select(i => i.cssText).join("\n");
        var html = '' +
            '<style>' + cssText + '</style>' +
            '<div class="flexcontent">' +
            '<input class="value" type="hidden"/>' +
            '<div class="controls">' +
            '<input class="textbox" type="text"/>' +
            '<span class="icon close"></span>' +
            '<span class="icon activator"></span>' +
            '</div>' +
            '</div>' +
            '<ul class="list"></ul>' +
            '';

        let shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML = html;

    }

    public SetDataItem(obj:any) {

    }

    public SetDisplayText(txt:string) {

    }

    public Clear() {

    }

    public ClearInput() {

    }

    private SelectNext() {

    }
    private SelectPrev() {

    }
    private SelectElement(el: HTMLElement) {

    }


}