//@keyattribute
class Controls {
    public static DateFormat = "yyyy-MM-dd";
}

class Diff
{
    public Property: string;
    public Val1: any
    public Val2: any;
    public Ref1: any;
    public Ref2: any;
    public Children: Diff[] = [];


}
class AttributeDiff extends Diff {
    public Container1: any
    public Container2: any;


}
class DiffOptions
{
    public keeporderontarget?: boolean = false;
    public excludedelements?: Element[] = [];
    public excludednodes?: Node[] = [];
    public excludedselectors?: string[] = [];
}
class DomDiff
{
    public static Test()
    {
        var e1 = _SelectFirst(".div1");
        var e2 = _SelectFirst(".div2");
        var d = DomDiff.CompareElements(<any>e1, <any>e2, new DiffOptions());
        console.log(d);
    }

    public Difflist: Diff[] = [];
    public static CompareElements(element1: Node, element2: Node, options: DiffOptions): Diff[]
    {
        var me =this;
        var result: Diff[] = [];
       
        var childnodes1 = Array.from(element1.childNodes);
        var childnodes2 = Array.from(element2.childNodes);
        if (options.excludedelements.length > 0) {
            childnodes1 = childnodes1.Where(i => (<Node[]>options.excludedelements).indexOf(i) == -1);
        }
        var matched2 = [];
        var matched1 = [];
        var keyatrxr = ":scope > [" + keyattribute + "=\"";
        for (var ix = 0; ix < childnodes1.length; ix++) {
            var node = childnodes1[ix];
            var matching = childnodes2.FirstOrDefault(i => i.nodeName == node.nodeName && matched2.indexOf(i) == -1);
            var key = DomDiff.Attribute(node,keyattribute);
            if (!IsNull(key)) {
                //matching = childnodes2.FirstOrDefault(i => DomDiff.Attribute(i, keyattribute) == key);
                matching = Array.from((<Element>element2).querySelectorAll(keyatrxr + key + "\"]")).FirstOrDefault(i => matched2.indexOf(i) == -1);
                if (!options.keeporderontarget && matching!=null) {
                    //var ix1 = Array.from(node.parentNode.childNodes).indexOf(<any>node);
                    //var ix2 = Array.from(matching.parentNode.childNodes).indexOf(<any>matching);
                    var ix1 = childnodes1.indexOf(<any>node);
                    var ix2 = childnodes2.indexOf(<any>matching);
                    if (ix1 != ix2) {
                        var diff = new Diff();
                        diff.Property = "NodeIndex";
                        diff.Val1 = ix1;
                        diff.Val2 = ix2;
                        diff.Ref1 = node;
                        diff.Ref2 = matching;
                        result.push(diff);
                    }
                }
            } 
            if (matching == null) {

                var diff = new Diff();
                diff.Property = "Node";
                diff.Val1 = node;
                diff.Val2 = null;
                result.push(diff);

            } else
            {
                if (node.nodeName == "#text") {
                    if (node.nodeValue != matching.nodeValue)
                    {
                        var diff = new Diff;
                        diff.Property = "NodeValue";
                        diff.Val1 = node.nodeValue;
                        diff.Val2 = matching.nodeValue;
                        diff.Ref1 = node;
                        diff.Ref2 = matching;
                        if (diff.Val1.trim() != diff.Val2.trim()) {
                            result.push(diff);
                        }
                    }
                } else {
                    var propertydifferences: Diff[] = [];
                    var lowernodename = node.nodeName.toLowerCase();
                    if (In(lowernodename, "input", "select")) {
                        propertydifferences = DomDiff.GetPropertyDiff(node, matching, ["value"]);
                    }
                    var attributedifferences = DomDiff.GetAttributeDiff(node, matching);
                    var elementdifferences = [];
                    if ("value" in node) {

                    } else {
                        elementdifferences = DomDiff.CompareElements(node, matching, options);
                        
                    }
                    var alldifferences = attributedifferences.concat(propertydifferences).concat(elementdifferences);
                    if (alldifferences.length > 0) {
                        var diff = new Diff();
                        diff.Property = "All";
                        diff.Ref1 = node;
                        diff.Ref2 = matching;
                    
                        diff.Children = alldifferences;
                        result.push(diff);
                    }
                }
                matched2.push(matching);
                matched1.push(node);
            }
        }
        var unmatched2 = childnodes2.Where(i => matched2.indexOf(i) == -1);
        //var unmatched1 = childnodes1.Where(i => matched1.indexOf(i) == -1);
        unmatched2.forEach(function (node, ix) {
            if (!(node.nodeType == 3 && node.nodeValue.trim().length == 0)) {
                // ) {
                var diff = new Diff();
                diff.Property = "Node";
                diff.Val1 = null;
                diff.Val2 = node;

                result.push(diff);
            }

        });
        return result;
    }
    public static GetPropertyDiff(element1: Node, element2: Node, properties: string[]): Diff[] {

        var result: AttributeDiff[] = [];
        var attributes = properties;
        var diff = new AttributeDiff();
        diff.Val1 = [];
        diff.Val2 = [];
        diff.Container1 = element1;
        diff.Container2 = element2;
        var differentattributes = [];
        for (var i = 0; i < attributes.length; i++) {
            var attribute = attributes[i];
            var Val1 = (<Element>element1).getAttribute(attribute);
            var Val2 = (<Element>element2).getAttribute(attribute);


            if (Val1 != Val2) {
                differentattributes.push(attribute);
                diff.Val1.push(Val1);
                diff.Val2.push(Val2);
            }
        }
        if (differentattributes.length > 0) {
            diff.Property = "Prop:" + differentattributes.join(",");
            result.push(diff);
        }
        return result;
    }
    public GetTagDiff(element1: Node, element2: Node) : Diff
    {
        var me = this;
        var diff = new Diff();
        diff.Val1 = element1.nodeName;
        diff.Val2 = element2.nodeName;
        diff.Property = "nodeName";
        if (diff.Val1 != diff.Val2)
        {
            return diff;
        }
        return null;
    }

    public static GetAttributeDiff(element1: Node, element2: Node): Diff[] {
        var me = this;
        var result: AttributeDiff[] = [];
        var attributes1 = me.Attributes(element1);
        var attributes2 = me.Attributes(element2);
        var attributes = [...new Set(attributes1.concat(attributes2))];
        var diff = new AttributeDiff();
        diff.Val1 = [];
        diff.Val2 = [];
        diff.Container1 = element1;
        diff.Container2 = element2;
        var differentattributes = [];
        for (var i = 0; i < attributes.length; i++)
        {
            var attribute = attributes[i];
            if (!attribute.startsWith("_") && attribute != "style") {
                var Val1 = (<Element>element1).getAttribute(attribute);
                var Val2 = (<Element>element2).getAttribute(attribute);

           
                if (Val1 != Val2) {
                    differentattributes.push(attribute);
                    diff.Val1.push(Val1);
                    diff.Val2.push(Val2);
                }
            }
        }
        if (differentattributes.length > 0)
        {
            diff.Property = "Attr:" + differentattributes.join(",");
            result.push(diff);
        }
        return result;
   
    }

    private static Attributes(element: Node): string[]
    {
        var arr = [];
        var el = <Element>element
        if (el.nodeType == 1) {
            for (var i = 0, atts = el.attributes, n = atts.length, arr = []; i < n; i++) {
                arr.push(atts[i].nodeName);
            }
        }
        return arr;
    }
    private static Attribute(element: Node,attributename:string): string {
        var arr = [];
        var el = <Element>element
        if (el.nodeType==1) {
            return el.getAttribute(attributename);
        }
        return null;
    }

    public static Map(target: Node, source: Node, poptions: DiffOptions = {})
    {
        var options = new BindOptions();
        for (var key in poptions) {
            options[key] = poptions[key];
        }
        var excludedelements = [];
        for (var i = 0; i < options.excludedselectors.length; i++)
        {
            let elements = _Select(options.excludedselectors[i], target);
            excludedelements.push.apply(excludedelements, elements);

        }
        for (var i = 0; i < options.excludedelements.length; i++) {
            excludedelements.push(options.excludedelements[i]);

        }
        options.excludedelements = options.excludedelements.concat(excludedelements);
        var diff = DomDiff.CompareElements(target, source, options);
        var mdiff = new Diff();
        mdiff.Ref1 = target;
        mdiff.Ref2 = source;
        mdiff.Property = "All";
        mdiff.Children.push.apply(mdiff.Children, diff);
        DomDiff.MapDiff(mdiff);
   
    }

    public static MapDiff(difference: Diff, parent?: Diff) {
        if (difference.Property != "All") {
            if (difference.Property == "Node") {
                if (difference.Val1 == null) {
                    (<Node>parent.Ref1).appendChild(difference.Val2);
                }
                if (difference.Val2 == null) {
                    (<Node>parent.Ref1).removeChild(difference.Val1);
                }
            }
            if (difference.Property == "NodeIndex") {
                var parentnode1 = (<Node>parent.Ref1);
                parentnode1.insertBefore(difference.Ref1, parentnode1.childNodes[difference.Val2])
            }
            if (difference.Property == "NodeValue") {
                (<Node>difference.Ref1).nodeValue = difference.Val2;
            }
            if (difference.Property.startsWith("Prop:")) {
                var attrdifference = <AttributeDiff>difference;

                var differentattributes = attrdifference.Property.substring(5).split(",");
                var e1 = <Element>attrdifference.Container1;
                //var e2 = <Element>attrdifference.Container2;
                differentattributes.forEach((attributename, ix) => {
                    //var pref1e = (<Element>parent.Ref1);
                    var val1 = (<[]>attrdifference.Val1)[ix];
                    var val2 = (<[]>attrdifference.Val2)[ix];
                    if (val2 == null) {
                        delete e1[attributename];
                    } else {
                        e1[attributename] = val2;
                    }
                });

            }
            if (difference.Property.startsWith("Attr:")) {
                var attrdifference = <AttributeDiff>difference;

                var differentattributes = attrdifference.Property.substring(5).split(",");
                var e1 = <Element>attrdifference.Container1;
                //var e2 = <Element>attrdifference.Container2;
                differentattributes.forEach((attributename, ix) => {
                    //var pref1e = (<Element>parent.Ref1);
                    var val1 = (<[]>attrdifference.Val1)[ix];
                    var val2 = (<[]>attrdifference.Val2)[ix];
                    if (val2 == null) {
                        e1.removeAttribute(attributename);
                    } else {
                        e1.setAttribute(attributename, val2);
                    }
                });

            }
        }
        else
        {
            var z = 0;
        }
        for (var i = 0; i < difference.Children.length; i++)
        {
            var childdiff = difference.Children[i];            
            DomDiff.MapDiff(childdiff, difference);
        }
        if (!IsNull(difference.Ref1) && ("ContentChanged" in difference.Ref1)) {
            difference.Ref1.ContentChanged();
        }
    }
}


function customcontrol(element: any): Element
{
    var result = null;
    var parent = IsNull(element) ? null : element.parentElement;
    while (parent != null)
    {
        var isvalue = Coalesce(parent.getAttribute("is"), "");
        if (parent.tagName.indexOf("-") > -1 || isvalue.indexOf("-")>-1)
        {
            return parent;
        }
        // parent.nodeName=="#document-fragment"? parent.host:
        if (parent.parentNode != null && parent.parentNode.nodeName == "#document-fragment") {
            parent = parent.parentNode.host;
        } else {
            parent = parent.parentNode;
        }
    }
    return result;
}
function TreeMenu(target: Element, obj: any):string {
    var children = <[]>FirstNotNull(obj["Children"], []);
    if (children.length == 0) { return "";}
    var htmlbuilder = [];
    htmlbuilder.push("<ul>")
    children.forEach(function (child) {
        //<li binding-type="template" uid="@{model.Key}" url="@{model.Url}" rel="@{model.Name}">
        //htmlbuilder.push(Format('<li uid="{0}" url="{1}" rel="{2}">', child["Key"], Access(window, "appbaseurl") +  child["Url"], child["Name"]));
        htmlbuilder.push(Format('<li uid="{0}" url="{1}" rel="{2}">', child["Key"], child["Url"], child["Name"]));
        htmlbuilder.push(Res("menu." + child["Key"]));
        htmlbuilder.push(TreeMenu(null, child));
        htmlbuilder.push("</li>")
    });
    htmlbuilder.push("</ul>")
    var html = htmlbuilder.join("\n");
    if (!IsNull(target)) {
        target.innerHTML = html;
    }
    return html;
}
function GetControlSheet(): CSSStyleSheet
{
    var sheet = Array.from(document.styleSheets).FirstOrDefault(i => i.href.endsWith("controls.css"));
    return <CSSStyleSheet>sheet;
}
function GetDynamicalSheet(): CSSStyleSheet {
    var dynamicstylecontainer:HTMLStyleElement = <any>_SelectFirst("style[name=DynamicCss]");
    if (dynamicstylecontainer == null)
    {
        dynamicstylecontainer = <any>_CreateElement("style", { name: "DynamicCss" });;
        dynamicstylecontainer.appendChild(document.createTextNode(""));

        document.head.appendChild(dynamicstylecontainer);
        //dynamicstylecontainer.sheet.title = "DynamicCss";
    }
    return <CSSStyleSheet>dynamicstylecontainer.sheet;
}

function addCSSRule(sheet, selector, rules, index) {
    if ("insertRule" in sheet) {
        sheet.insertRule(selector + "{" + rules + "}", index);
    }
    else if ("addRule" in sheet) {
        sheet.addRule(selector, rules, index);
    }
}

//declare class ResizeObserver {
//    constructor(f: Function);
//    observe(target: Element, options?: Object);
//    unobserve(target: Element);
//    disconnect();
//};
class App_FileUploader extends HTMLElement
{
    private uploadelement: HTMLInputElement = null;
    public get Files():any[]
    {
        var me = this;
        var files = [];
        var readastext = function () {
            this.content;
            var p = new Promise(function (resolve, reject) {
                var reader = new FileReader();
                reader.onload = function (progressEvent) {
                    var result = progressEvent.target.result;

                    //add to Map here 
                    resolve(result);
                }

                reader.onerror = function (error) {
                    reject(error);
                }

                reader.readAsText(file);
            });
            return p;
        }
        for (var i = 0; i < me.uploadelement.files.length; i++) {
            var file = me.uploadelement.files[i];
            files.push({ filename: file.name, content: file, readAsText: readastext });
        }
        return files;
    }
    constructor() {
        super();
    }
    public connectedCallback() {
        var me = this;
        
        me.uploadelement = _Create<HTMLInputElement>("input", { type: "file", multiple: "" })
        me.uploadelement.addEventListener("change", function () {
            var files = me.Files;
            me.OnChange();
        });
        me.appendChild(me.uploadelement);

    }
    private OnChange()
    {
        var event = document.createEvent("HTMLEvents");
        event.initEvent("change", false, false);
        this.dispatchEvent(event);
    }
}
window.customElements.define("app-fileuploader", App_FileUploader);

class App_Field extends HTMLElement {
    private label: HTMLLabelElement = null;
    static get observedAttributes() {
        return ["value", "label"];
    }
    public attributeChangedCallback(attrName, oldValue, newValue) {
        if (attrName == "label") {
            if (!IsNull(this.label)) {
                this.label.innerText = newValue;
            }
        }
    }

    public connectedCallback() {
        var element = this;
        this.load();
    }

    public load() {
        var element = this;
        if (IsNull(this.shadowRoot)) {
            let shadowRoot = this.attachShadow({ mode: 'open' });
            var label = document.createElement("label");
            element.label = label;
            label.innerText = element.getAttribute("label");
            label.style.display = "block";
            shadowRoot.appendChild(label);

            var slot = document.createElement("slot");
            shadowRoot.appendChild(slot);


        }
    }



}
window.customElements.define("app-field", App_Field);

class App_Header extends HTMLElement
{
    constructor() {
        super();
    }
    public connectedCallback() {
        var me = this;
        me.EnsureLayout();

    }
    public EnsureLayout() {
        var me = this;
        var childrens = Array.from(me.children);
        var e_filter = childrens.FirstOrDefault(i => i.classList.contains("filter"));
        var e_commands = childrens.FirstOrDefault(i => i.tagName.toLowerCase() == "app-commandbar");
        var e_title = childrens.FirstOrDefault(i => i.classList.contains("titlecontainer"))

        var special_es = [];
        if (e_title != null) { special_es.push(e_title); }
        if (e_filter != null) { special_es.push(e_filter); }
        if (e_commands != null) { special_es.push(e_commands); }
        var rest = childrens;
        if (special_es.length > 0) {
            rest = childrens.Where(i => !In.apply({}, [i].concat(special_es)));

        }

        if (e_title == null) {
            e_title = _CreateElement("div", { class: "titlecontainer" });

            //me.appendChild(e_title);
            me.insertBefore(e_title, me.children[0]);

        }
        for (var i = 0; i < rest.length; i++) {
            e_title.appendChild(rest[i]);
        }
        var closeb = _SelectFirst(".icon.a-Close", e_title);
        if (closeb == null)
        {
            closeb = _CreateElement("span", { class: "icon a-Close", onclick:"view(this).Close();" });
            e_title.appendChild(closeb);
        }
        me.addEventListener("keyup", (e: KeyboardEvent) => {
            if (e.keyCode === 13) {
                var v = view(me);
                var search: Function = v["Search"];
                if (IsFunction(search))
                {
                    search.apply(v,[{ initiator: 'uifilter' }]);
                }
            }
        });
    }
}
window.customElements.define("app-header", App_Header);

class App_CommandBar extends HTMLElement
{
    public Commands: AppUICommand[] = [];

    //public get value() { return "";}

    get activatorindex() {
        return this.hasAttribute('activatorindex') ? this.getAttribute("activatorindex") : "-1";
    }
    set activatorindex(val) {
        this.setAttribute("activatorindex", val);
    }
    
    constructor()
    {
        super();
        var me = this;
        var originalProperty = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');

        Object.defineProperty(this, "innerHTML", {
            // Create a new getter for the property
            get: function () {
                return originalProperty.get.call(this);
            },
            // Create a new setter for the property
            set: function (val) {
                originalProperty.set.call(this, val);
                me.EnsureActivator();
            }
        });
        //me.EnsureActivator();

    }
    public connectedCallback() {
        var me = this;
        me.EnsureActivator();

    }

    public ContentChanged()
    {
        var me = this;
        me.EnsureActivator();
    }
    public EnsureActivator()
    {
        var me = this;
        if (me.children.length > 0) {
            var content = me.querySelector(".flexcontent");
            if (content == null) {
                content = _CreateElement("div", { class: "flexcontent" });
                var children = Array.from(me.children);
                for (var i = 0; i < children.length; i++) {
                    content.appendChild(children[i]);

                } 
                me.appendChild(content);
            }
            var activator = content.querySelector(".activator");
            if (activator == null) {
                var activator = _CreateElement("span", { class: "icon activator", onclick: "customcontrol(this).ToggleState()" })
                var placeholder = _CreateElement("label", { class: "icon placeholder" });
                me.appendChild(placeholder);

                var aix = Number(me.activatorindex);
                if (aix == -1) {
                    content.appendChild(activator);

                } else {
                    var ix = aix > content.children.length ? 0 : aix;
                    content.insertBefore(activator, content.children[ix]);
                }
            }

        }
      
    }
    public ToggleState()
    {
        var me = this;
        if (!me.classList.contains("expanded")) {
            me.classList.add("expanded");
        } else {
            me.classList.remove("expanded");
        }
    }

    public AddCommands(...commands: AppUICommand[]) {
        var me = this;
        var temp = document.createElement('template');

        for (var i = 0; i < commands.length; i++)
        {
            var command = commands[i];
            me.Commands.push(command);
            temp.innerHTML = command.Html;
            me.appendChild(temp.content);
        }
        me.EnsureActivator();


    }

}
window.customElements.define("app-commandbar", App_CommandBar);

class App_ColumnFilter extends HTMLElement {
    public IsExact: boolean = false;
    public Value: any;
    public Field: string;
    public Type: UIDataType = UIDataType.Text;
    private input: HTMLInputElement;
    private exact_input: HTMLInputElement;
    private clear_element: HTMLElement;
    public get value() {
        var format = "{0}";
        if (this.exact_input != null && this.exact_input.checked) {
            format = "[{0}]";
        }
        return Format(format, this.input.value);
    }
    public set value(val: any) {
        this.input.value = val;
    }
    public GetFilters(): ClientFilter[]
    {
        var me = this;
        return ClientFilter.Create(me.Type, me.Field, me.value);
    }
    constructor() {
        super();
    }
    public connectedCallback() {
        var me = this;
        me.input = _Create<HTMLInputElement>("input", { type: "text" });
        me.exact_input = _Create<HTMLInputElement>("input", { type: "checkbox" });
        var label = _CreateElement("label", {}, Res("general.ExactFilter"));
        label.appendChild(me.exact_input);
        me.clear_element = _Create<HTMLElement>("span", { class: "icon close" });
        me.appendChild(me.input);
        me.appendChild(label);
        me.appendChild(me.clear_element);
        me.classList.add("hovering");

        me.input.addEventListener("change", () => {
            
        });
        me.exact_input.addEventListener("change", (e: Event) => {
            if (me.input.value.trim().length > 0) {
            } else {

                e.stopPropagation();
            }
        });
        me.clear_element.addEventListener("click", () => {
            me.input.value = "";
            var f = async (e) => { _Hide(e); };
            
            var event = document.createEvent("HTMLEvents");
            event.initEvent("change", true, false);
            me.dispatchEvent(event);
            f(me); 

        });
    }
}

window.customElements.define("app-columnfilter", App_ColumnFilter);

class App_DataTable extends HTMLTableElement {
    private stylenode: Node = null;
    private instancekey: string = Guid();
    private Data: any[] = [];
    private originalrows: HTMLElement[] = [];
    private filteredrows: HTMLElement[] = [];
    private sortedrows: HTMLElement[] = [];
    private typename: string;

    public sortfunction: Function;
    public filterfunction: Function;
    public flags: DictionaryOf<boolean> = {
        sortable: false,
        tbodyastrow: false,
        filterable: false,
        highlightrowsonhover: false,
        resizable: false,
        selectable: false,
        checkable: false
    };
    constructor()
    {
        super();

        //let shadowRoot = this.attachShadow({ mode: 'open' });
        
    }
    public connectedCallback() {
        var me = this;
        var flagsattribute = Coalesce( me.getAttribute("flags"),"");
        me.typename = Coalesce(me.getAttribute("typename"),"");
        var _flags = flagsattribute.split("|");
        for (var key in me.flags) {
            me.flags[key] = (_flags.indexOf(key) > -1);
        }
        me.Setup();
        me.setAttribute("_app-datatable-instancekey", me.instancekey);
        me.addEventListener("resize", me.SizeChanged);
        me.addEventListener("click", me.OnClick);
        new ResizeObserver((entries) => me.SizeChanged(entries)).observe(me);
        me.MakeResizable();
        me.MakeSortable(); 

        me.MakeFilterable();
        var rows = me.GetRowElements();
   
        me.originalrows = rows
        me.filteredrows = rows

        try {
            me.sortfunction = evalInContext.call(me, me.getAttribute("sortfunction"));
        } catch (ex) {
        }
        try {
            me.filterfunction = evalInContext.call(me, me.getAttribute("filterfunction"));

        } catch (ex) {

        }
        if (me.sortfunction == null) { me.sortfunction = me.Sort; }
        if (me.filterfunction == null) { me.filterfunction = me.Filter; }
        //me.AlignCells();
      
    }
    public disconnectedCallback() {
        var me = this;
        var dsheet = <CSSStyleSheet>GetDynamicalSheet();
        var rules = Array.from(dsheet.cssRules);
        var tableselector = '[_app-datatable-instancekey="' + me.instancekey + '"] ';
        for (var i = 0; i < rules.length; i++) {
            var ix = rules.length - (i + 1);
            var rule = rules[ix];
            if ((<any>rule).selectorText.indexOf(tableselector)>-1) {
                //console.log(sheet.cssRules[i]);
                dsheet.deleteRule(ix);
            }
        } 
    }
    private styleproperties: string[] = ["textAlign","display"];
    private AlignCells()
    {
        var me = this;
        var head = _SelectFirst("thead", me);
        var theadth = _Select("th", head);
        var dsheet = GetDynamicalSheet();
        var rules = <CSSStyleRule[]>Array.from(dsheet.cssRules);
        var tableselector = '[_app-datatable-instancekey="' + me.instancekey + '"] > tbody > tr:first-child > ';
        theadth.forEach((th, ix) => {
            var csssix = ix + 1;
            var style = window.getComputedStyle(th);
            var dstyle = {};
            me.styleproperties.forEach(sp => {
                dstyle[sp] = style[sp];
            });
            var thselector = "td:nth-child(" + (csssix) + ")";
            var ruleselector = tableselector + thselector;
            var existingrule = rules.FirstOrDefault((i) => i.selectorText == ruleselector);
            if (existingrule == null) {
                addCSSRule(dsheet, tableselector + thselector, "", null);
                rules = <CSSStyleRule[]>Array.from(dsheet.cssRules);
            } 
            existingrule = rules.FirstOrDefault((i) => i.selectorText == ruleselector);
            for (var key in dstyle)
            {
                existingrule.style[key] = dstyle[key];
            }


        });
    }

    public OnDataBound()
    {
        var me = this;
        me.originalrows = me.GetRowElements();
        me.filteredrows = me.GetRowElements();
        me.AlignCells();
        me.Setup();
        me.MakeFilterable();
        me.MakeResizable();
        me.MakeSortable();
    }

    public OnClick(event: MouseEvent)
    {
        var me = this;
        var htmlelement = <HTMLElement>event.target;
        if (IsNull(htmlelement)) { return; }
        var th = htmlelement.tagName == "TH" ? htmlelement : _Parents(htmlelement, me).FirstOrDefault(i => i.tagName == "TH");
        
        if (!IsNull(th)) 
        {
            var field = th.getAttribute("key");
            var shouldfilter = false;
            var filterelement = _SelectFirst("app-columnfilter", th);

            if (!IsNull(filterelement)  && (filterelement.contains(htmlelement) || htmlelement.classList.contains("filtering")))
            {
                if (!htmlelement.classList.contains("close")) {
                    var colfilter = _SelectFirst("app-columnfilter", th);
                    if (colfilter != null) {
                        
                        _Show(colfilter);
                        colfilter["input"].focus();
                    }
                }
                return;
            }
            if (me.flags["sortable"] && !IsNull(field)) {
                var states = ["", "asc", "desc"];
                var sortindicator = _SelectFirst(".sorting", th);
                var state = "";
                if (sortindicator.classList.contains("asc")) { state = "asc"; }
                if (sortindicator.classList.contains("desc")) { state = "desc"; }
                var ix = states.indexOf(state);
                var nextix = (ix + 1) % states.length;
                var nextstate = states[nextix];
                var ths = _SelectFirst(".sorting.asc, .sorting.desc", me);
                if (ths != null) {
                    ths.classList.remove("asc");
                    ths.classList.remove("desc");
                }
                if (nextstate.length > 0) {
                    sortindicator.classList.add(nextstate);
                }
                var mt = MetaAccessByTypeName(this.typename, field);
                var ut = UIDataType.Text;

                if (mt != null && In(mt.SourceType, "double", "integer", "money")) {
                    ut = UIDataType.Number;

                }
                me.sortfunction(field, nextstate, ut);
            }
        }
    }
    public static GetCellValue(r: HTMLElement, index: number, utype: UIDataType): any {
        var row = r.tagName == "TBODY" ? r.children[0] : r;
        var td = row.children[index];
        var table = <HTMLTableElement>_Parents(row).FirstOrDefault(i => i.tagName == "TABLE"); //(<HTMLTableElement>r.parentElement.parentElement);
        var headrow = table.tHead.rows[table.tHead.rows.length - 1];
        var th = headrow.cells[index];
        var field = th.getAttribute("key");
        var childnodes = td.hasChildNodes ? (Array.from(td.childNodes)) : [];
        var val = null;
        var nodetocheck = null;
        if (childnodes.length == 1) {
            nodetocheck = childnodes.FirstOrDefault();
        } else {
            nodetocheck = Coalesce(
                _SelectFirst('[name="' + field + '"]', td),
                _SelectFirst('[bind="' + field + '"]', td)
            );
        }
        if (nodetocheck != null) {
            if (nodetocheck.nodeName == "#text") {
                val = nodetocheck.nodeValue.trim();
            }
            if (In(nodetocheck.nodeName, "A", "SPAN")) {
                val = (<HTMLElement>nodetocheck).innerText;
            }
            if (In(nodetocheck.nodeName, "INPUT")) {
                val = (<HTMLInputElement>nodetocheck).value;
            }
            if (In(nodetocheck.nodeName, "SELECT")) {
                val = (<HTMLSelectElement>nodetocheck).selectedOptions.length > 0 ? (<HTMLSelectElement>nodetocheck).selectedOptions[0].value : null;
            }
            //.selectedOptions[0].text
        }

        if (utype == UIDataType.Number) {
            return Number(val);
        }
        if (utype == UIDataType.Date) {
            return StringToDate(val, Controls.DateFormat);
        }
        return val == null ? "" : val.toLowerCase();
    }

    public GetRowElements(): HTMLElement[]
    {
        var me = this;
        if (me.flags["tbodyastrow"]) {
            return Array.from(me.tBodies);
        } else
        {
            return me.tBodies.length==0?[]: Array.from(me.tBodies[0].rows);
        }
    }

    public Sort(field: string, by: string, type: UIDataType = UIDataType.Text)
    {
        var me = this;
        var headrow = me.tHead.rows[0];
        var th = _SelectFirst('th[key="' + field + '"', headrow);
        if (th.classList.contains("numeric"))
        {
            type = UIDataType.Number;
        }
        if (th.classList.contains("date") || th.classList.contains("datetime")) {
            type = UIDataType.Date;
        }
        var ix = Array.prototype.indexOf.call(headrow.children, th);
        var rows = me.GetRowElements();
        var values = [];
        if (by == "") {
            me.filteredrows.forEach((r, i) => {
                var parent = r.parentElement;
                parent.insertBefore(r, parent.children[i]);
            });
            me.sortedrows = [];
            return;
        }

        rows.forEach((r, i) => {
            var val = App_DataTable.GetCellValue(r, ix, type);
            values.push({ value: val, reference: r }); 
        });
        var sortdesc = (ao: object, bo: object) => {
            var a = ao["value"];
            var b = bo["value"];
            if (a > b) {
                return -1;
            }
            if (b > a) {
                return 1;
            }
            return 0;
        }
        var sortasc = (ao: object, bo: object) => {
            var a = ao["value"];
            var b = bo["value"];
            if (a > b) {
                return 1;
            }
            if (b > a) {
                return -1;
            }
            return 0;
        }
        var sorts = { "asc": sortasc, "desc": sortdesc };
        var sortedvalues = values.sort(sorts[by]);
        me.sortedrows = sortedvalues.Select(s => s["reference"]);
        sortedvalues.forEach((o, i) => {
            var r: HTMLElement = o["reference"];
            var parent = r.parentElement;
            parent.insertBefore(r, parent.children[i]);
        });

    }

    public Filter(field: string, value: string, type: UIDataType = UIDataType.Text) {
        var me = this;
        var headrow = me.tHead.rows[0];
        var tbody = me.tBodies[0];
        var th = _SelectFirst('th[key="' + field + '"', headrow);
        if (th.classList.contains("numeric")) {
            type = UIDataType.Number;
        }
        var ix = Array.prototype.indexOf.call(headrow.children, th);
        //var rows = Array.from(tbody.rows);
        var values = [];
        var rows = this.sortedrows.length == 0 ? me.originalrows : me.sortedrows;
        if (value == "") {
            rows.forEach((r, i) => {
                var parent = r.parentElement;
                parent.insertBefore(r, parent.children[i]);
            });
            return;
        }
        
        var lvalue = value.toLowerCase();
       
        me.filteredrows = rows.Where(r => (<string>App_DataTable.GetCellValue(r, ix, UIDataType.Text)).toLowerCase().indexOf(lvalue) > -1)
 
        tbody.innerHTML = "";
        me.filteredrows.forEach((r, i) => {
            tbody.appendChild(r);
        });
    }

    public SizeChanged(entries: any)
    {
        var me = this;
        me.MakeResizable();

    }

    private MakeResizable()
    {
        var me = this;
        if (me.flags["resizable"]) {
            callasync(() => {
                resizableGrid(me);
            });
        }
        if (me.flags["resizablehead"]) {
            callasync(() => {
                resizableGrid(me,true);
            });
        }
    }

    private MakeFilterable()
    {
        var me = this;
        if (me.flags["filterable"]) 
        {
            var headerrow = me.tHead.rows[me.tHead.rows.length - 1];
            var cells = Array.from(headerrow.cells).Where(i => !IsNull(i.getAttribute("key")));
            cells.forEach(c => {
                let controls = _SelectFirst(".controls", c);
                let l = c.children[0];
                var filteringe = _SelectFirst(".filtering", c);
                if (filteringe == null) {
                    let ss = _Create<HTMLElement>("span", { class: "icon filtering" });
                    controls.appendChild(ss);
                }
                var colfilter: App_ColumnFilter = <any>_SelectFirst("app-columnfilter", c);
                if (colfilter == null)
                {
                    colfilter = new App_ColumnFilter();
                    colfilter.style.display="none";
                    colfilter.Field = c.getAttribute("key");
                    var mt = MetaAccessByTypeName(me.typename, colfilter.Field);
                    if (mt != null) {
                        colfilter.Type = GetUIDataTypeFrom(mt.SourceType);
                    }
                    colfilter.addEventListener("change", (event: Event) => {
                        console.log(colfilter.GetFilters());
                        var th = _SelectFirst('[key="' + colfilter.Field + '"]', headerrow);
                        var filterindicator = _SelectFirst(".filtering", th);
                        if (!IsNull(colfilter.value)) {
                            filterindicator.classList.add("filtered");
                        } else
                        {
                            filterindicator.classList.remove("filtered");
                        }
                        me.filterfunction(colfilter.Field, colfilter.value, colfilter.Type);
                        event.stopPropagation();
                        //me.Filter(colfilter.Field, colfilter.value, colfilter.Type);
                    });
                    c.appendChild(colfilter);
                }
                //let ss = _Create<HTMLElement>("span", { class: "icon sorting" });
            });
         
        }
    }

    private MakeSortable() {
        var me = this;
        if (me.flags["sortable"]) {
            var headerrow = me.tHead.rows[me.tHead.rows.length - 1];
            var cells = Array.from(headerrow.cells).Where(i => !IsNull(i.getAttribute("key")));
            cells.forEach(c => {
                let controls = _SelectFirst(".controls", c);
                let l = c.children[0];
                var filteringe = _SelectFirst(".sorting", c);
                if (filteringe == null) {
                    let ss = _Create<HTMLElement>("span", { class: "sorting" });
                    controls.appendChild(ss);
                }
                //let ss = _Create<HTMLElement>("span", { class: "icon sorting" });
            });

        }
    }

    private Setup() {
        var me = this;
        var headerrow = me.tHead.rows[me.tHead.rows.length - 1];
        var cells = Array.from(headerrow.cells);
        cells.forEach(c => {
            var f = Element.prototype.appendChild;
            //BLACK MAGIC
            c["appendChild"] = <T extends Node>(item: T): T => {
                if (item.nodeName == "#text") {
                    var span = (c.hasChildNodes() && c.childNodes[0].nodeName == "SPAN") ? c.childNodes[0] : null;
                    if (span != null) {
                        span.nodeValue = item.nodeValue;
                        return null; 
                    }
                }
                return f.apply(c, [item]);
            }
            var controls = _SelectFirst(".controls", c);
            if (controls == null)
            {
             
                if (c.hasChildNodes()) {
                    let l = c.childNodes[0];

                    if (l.nodeName == "#text") {
                        var span = _CreateElement("span", {}, l.nodeValue);
                        l.remove();
                        c.appendChild(span);
                        l = span;
                    }
                    var controls = _CreateElement("span", { class: "controls" });
                    Array.from(c.childNodes).forEach(cn => {
                        controls.appendChild(cn); 
                    });
                    c.appendChild(controls);
                    
                }
            }
        });
    }
}
customElements.define('app-datatable', App_DataTable, { extends: "table" });

class App_InputWithAction extends HTMLElement
{
    private _value: string = "";
    get value() {
        var attrval = this.getAttribute("value");
        if (this._value == null || this._value === undefined) {
            this._value = attrval;
        }
        return this._value;
    }
    set value(val) {
        this._value = val;
    }
    public connectedCallback() {
        var me = this;
    }

}

class App_QueryEditor extends HTMLElement {
    private QueryTemplate: RazorTemplate = null;
    private Query: ClientQuery = new ClientQuery();
    private VisibleFields: string[] = [];
    get roottype() {
        return this.hasAttribute('roottype') ? this.getAttribute("roottype") : null;
    }
    set roottype(val) {
        this.setAttribute("roottype", val);
    }
    constructor() {
        super();
        var me = this;
        var layoutpath = "layout\\Controls\\Query.Save.razor.html";
        var html = application.Layouts.Templates[layoutpath];
        if (me.QueryTemplate == null) {
            var t = new RazorTemplate();
            t.LayoutPath = layoutpath;
            t.Compile(html);
            me.QueryTemplate = t;
        }
    }
    public connectedCallback() {
        var me = this;
        if (me.innerHTML.trim().length == 0) {
            me.Load();
        }
    }
    private Load() {
        var me = this;
        var query = me.Query;
        var meta = GetMetaByTypeName(me.roottype);
        var listcolumns = query.Fields.Select(i => i.Name);
        me.CorrectFilters();
        var context = {
            Columns: meta.Fields.Select(i => i.MetaKey),
            SelectedColumns: listcolumns.Select((i) => { return { name: i, visible: me.VisibleFields.indexOf(i)>-1?'visible':'' }; }),
            VisibleColumns: me.VisibleFields,
            Filters: GetFlattenedHierarchy(me.Query.Filters, ""),
            control:me
        }

        var df = me.QueryTemplate.BindToFragment(query, context);
        me.innerHTML = "";
        me.appendChild(df);
    }
    public SetFilterField(source: Element, event: MouseEvent)
    {
        var me = this;
        var option = <HTMLOptionElement>event.target;
        if (option.tagName == "OPTION")
        {
            var value = option.value;
            var amb = <App_MetaBrowser>customcontrol(option);
            if (amb != null && amb["tagName"] == "APP-METABROWSER") {
                value = amb.value;
            }
            var filtereditor = <App_FilterEditor>_SelectFirst("app-filtereditor.selected", me);
            if (filtereditor != null) {
                var e_field = <App_AutoComplete>_SelectFirst("app-autocomplete[bind=Field]", filtereditor);
                //e_field.value = option.value;
                e_field.SetInput(value)
            }
        }
    }
    public SetQuery(query: QueryView)
    {
        var me = this;
        me.Query = query;
        me.VisibleFields = query.UIColumns;
        me.Load();
    }

    public GetQuery(): QueryView
    {
        var me = this;
        var uiquery = <ClientQuery>GetBoundObject(me);
        var query = new QueryView();
        for (var key in uiquery) {
            query[key] = uiquery[key];
        }
        var selectedcolumns = <HTMLSelectElement>_SelectFirst("[name=SelectedColumns] select", me);
        var orderby = query["Order"];
        delete query["Order"];
        query.Ordering = {}
        query.Ordering[orderby["Field"]] = orderby["Type"];
        var fields = Array.from(selectedcolumns.options);
        query.Fields = fields.Select(i => { return { Name: i.value } });
        query.UIColumns = fields.Where(i => i.classList.contains("visible")).Select(i => i.value);
        query.Filters = me.Query.Filters;
        //ForeachInHierarchy()
        query.GetCount = false;
        query.Skip = 0;
        query.Take = null;
        me.Execute(query);
        return query;
    }

    public OnControlClicked(command: string) {
        var me = this;
        var qc = me;
        var metabrowser = <App_MetaBrowser>_SelectFirst("[name=AllColumns] app-metabrowser", qc);
        var allcolumns = <HTMLSelectElement>_SelectFirst("[name=AllColumns] select", qc);
        var orderbycolumn = <HTMLInputElement>_SelectFirst("input[name=orderbyfield]", qc);
        var orderbytype = <HTMLSelectElement>_SelectFirst("select[name=orderbytype]", qc);
        var selectedcolumns = <HTMLSelectElement>_SelectFirst("[name=SelectedColumns] select", qc);
        var filtereditor = _SelectFirst(".filtereditor", qc);
        var filtercontainer = _SelectFirst("[name=Filters]", qc);
        if (command == "add") {
            var options = allcolumns.selectedOptions;
            var selectedoption: HTMLElement = null;
            for (var i = 0; i < options.length; i++) {
                var existing = _SelectFirst("option[rel=\"" + options[i].value + "\"]", selectedcolumns)
                if (existing == null) {
                    var option = document.createElement("option");
                    option.classList.add("visible");
                    selectedcolumns.appendChild(option);

                    option.setAttribute("rel", options[i].getAttribute("rel"));
                    option.value = options[i].getAttribute("rel");
                    option.innerText = Format("{0}", option.value);
                    selectedoption = option;

                }
            }
            if (!IsNull(selectedoption)) { selectedoption.scrollIntoView(); }
        }
        if (command == "remove") {
            var options = selectedcolumns.selectedOptions;

            for (var i = 0; i < options.length; i++) {
                options[i].remove();
            }

        }
        if (command == "up") {
            var options = selectedcolumns.selectedOptions;
            for (var i = 0; i < options.length; i++) {
                var option = options[i];
                var prev = option.previousElementSibling;
                if (!IsNull(prev)) {
                    var parent = option.parentNode;
                    option.remove();
                    parent.insertBefore(option, prev);
                }
            }
        }
        if (command == "down") {
            var options = selectedcolumns.selectedOptions;

            for (var i = options.length - 1; i > -1; i--) {
                var option = options[i];
                var next = option.nextElementSibling;

                if (!IsNull(next)) {

                    var parent = option.parentNode;
                    option.remove();
                    if (!IsNull(next.nextElementSibling)) {
                        parent.insertBefore(option, next.nextElementSibling);
                    } else {
                        parent.appendChild(option);
                    }
                }
            }
        }
        if (command == "orderby-asc") {
            var selected_option = selectedcolumns.selectedOptions.length > 0 ? selectedcolumns.selectedOptions[0] : null;
            var all_option = allcolumns.selectedOptions.length > 0 ? allcolumns.selectedOptions[0] : null;
            var option = <HTMLOptionElement>FirstNotNull(selected_option, all_option);
            if (option != null) {
                orderbycolumn.value = option.value;
                orderbytype.value = "ASC";
            }

        }
        if (command == "orderby-desc") {
            var selected_option = selectedcolumns.selectedOptions.length > 0 ? selectedcolumns.selectedOptions[0] : null;
            var all_option = allcolumns.selectedOptions.length > 0 ? allcolumns.selectedOptions[0] : null;
            var option = <HTMLOptionElement>FirstNotNull(selected_option, all_option);
            if (option != null) {
                orderbycolumn.value = option.value;
                orderbytype.value = "DESC";
            }

        }
        if (command == "toggle-visibility") {
            var options = selectedcolumns.selectedOptions;
            for (var i = 0; i < options.length; i++) {
                var option = options[i];
                _ToggleClass(option, "visible");

            }
        }
        if (command == "clearfilter") {
            var mb = <App_FilterEditor>_SelectFirst("app-filtereditor", filtereditor);
            mb.Create(new ClientFilter());

        }
        if (command == "addfilter") {
            var mb = <App_FilterEditor>_SelectFirst("app-filtereditor", filtereditor);
            var filterobj: IClientFilter = <any>GetBoundObject(mb);
            
            console.log(filterobj);
            if (!("Values" in filterobj)) {
                var values = []
                values.push(filterobj["Value"]);
                (<any>filterobj)["Values"] = values;
            }
            var key = filterobj["_key"];
            if (IsNull(key)) {
                me.Query.SetFilter(filterobj);
            } else
            {
                var qfc = { Children: me.Query.Filters };
                var filter = <IClientFilter>FindInHierarchy(qfc, f => f["_key"] == key);
                PathMap(filterobj, filter);
            }
            
            var context = {
                Filters: GetFlattenedHierarchy(me.Query.Filters, "")
            }
            var df = me.QueryTemplate.BindToFragment(me.Query, context);
            var filterse = _SelectFirst(".filters", filtercontainer);
            //filterse.innerHTML = "";
            var edf = _SelectFirst(".filters", df);
            mb.Create(new ClientFilter());
            DomDiff.Map(filterse, edf);
            
            //filterse.appendChild(edf);
        }
    }

    public RemoveFilter(element: Element, key: string) {
        var me = this;
        var filters = <IClientFilter>{ Children: me.Query.Filters };
        var filter = FindInHierarchy(filters, (f: IClientFilter) => f["_key"] == key);
        var filterparent = <IClientFilter>FindInHierarchy(filters, (f: IClientFilter) => (<any[]>FirstNotNull(f.Children, [])).FirstOrDefault(ch => ch["_key"] == key));
        var arrayoffilter = filterparent.Children;
        if (filterparent == filters) {
            arrayoffilter = me.Query.Filters;
        }
        RemoveFrom(filter, arrayoffilter);
        var nodetoremove = <HTMLElement>Access(element, "parentElement");
        if (nodetoremove != null)
        {
            nodetoremove.remove();
        }
    }

    public EditFilter(key: string) {
        var me = this;
        var filters = <IClientFilter>{ Children: me.Query.Filters };
        var filter = <IClientFilter>FindInHierarchy(filters, (f: IClientFilter) => f["_key"] == key);
        var filtereditor = <App_FilterEditor>_SelectFirst(".filtereditor app-filtereditor", me);
        filtereditor.Create(filter);
    }

    public Execute(query: QueryView) {
        console.log(query);
    }
    private CorrectFilters()
    {
        var me = this;
        me.Query.Filters.forEach(filter => {
            if (IsNull(filter.Value))
            {
                filter.Value = filter.Values.join(",");
            }
        });
    }

    public QueryViewLoaded(element: App_FileUploader)
    {
        var me = this;
        var file = element.Files.FirstOrDefault();
        if (file != null)
        {
            file.readAsText().then(function (r) {
                try {
                    var queryview = JSON.parse(r);
                    me.SetQuery(queryview);
                } catch (ex) {
                    Toast_Error("Only Json files (representing queryviews) are allowed");
                }
            });
        }
    }

    public SaveQueryView()
    {
        var me = this;
        var queryview = me.GetQuery();
        var datalink = Format('data:application/octet-stream;charset=utf-8,{0}', encodeURIComponent(JSON.stringify(queryview, null, 4)));

        download("QV_" + me.Query.QueryName + ".json", datalink);
    }

}
window.customElements.define("app-queryeditor", App_QueryEditor);

class App_FilterEditor extends HTMLElement
{
    private _filter: IClientFilter = <any>{};
    private Template: RazorTemplate = null;

    get roottype() {
        return this.hasAttribute('roottype') ? this.getAttribute("roottype") : null;
    }
    set roottype(val) {
        this.setAttribute("roottype", val);
    }

    constructor() {
        super();
        var me = this;
        var layoutpath = "layout\\Controls\\Filter.Save.razor.html";
        var html = application.Layouts.Templates[layoutpath];
        if (me.Template == null) {
            var t = new RazorTemplate();
            t.LayoutPath = layoutpath;
            t.Compile(html);
            me.Template = t;
        }
    }
    public connectedCallback() {
        var me = this;
        me.style.display = "block"; 
        if (me.innerHTML.trim().length == 0) {
            me.Load();
            me.addEventListener("click", function () { me.classList.add("selected") });
        }
    }
    private Load() {
        var me = this;

        var df = me.Template.BindToFragment(me._filter, { control: me });
        var source = _SelectFirst(".Filter", df);
        var target = _SelectFirst(".Filter", me);
        if (target == null) {
            me.innerHTML = "";
            me.appendChild(df);
        } else
        {
            DomDiff.Map(target, source);

        }
        //me.innerHTML = "";
        //me.appendChild(df);
        var fc = "SMPL"
        if (me._filter.Operator == "OR")
        {
            fc = "OR";
        }
        if (me._filter.Operator == "AND") {
            fc = "AND";
        }
        me.SetFilterCreation(fc); 
    }
    public Create(filter: IClientFilter) {
        var me = this;
        me._filter = filter;
        me.innerHTML = "";
        me.Load();
    }
    public LoadFromSource() {
        var me = this;
        var roottype = me.roottype;
        var aac = <App_AutoComplete>_SelectFirst("[bind=Field]", me);
        var src = <HTMLTextAreaElement>_SelectFirst("[bind=SourceExpression]", me);
        var type = MetaAccessByTypeName(roottype, aac.value);
        var udt = GetUIDataTypeFrom(type.SourceType);
        me._filter = ClientFilter.Create(udt, aac.value, src.value).FirstOrDefault();
        console.log(me._filter);
        me._filter.SourceExpression = src.value;
        me._filter.Value = me._filter.Values.join(",");
        //me._filter.Field
        me.Load();
    }

    public AddChild(element: this) {
        var me = this;
        
        if (IsNull(me._filter.Children)) {
            me._filter.Children = [];
        }
        me._filter.Children.push(new ClientFilter());
        me.Load();
    }

    public AddOrFilter()
    {
        var me = this;
        var filter = new ClientFilter();
        filter.Field = "Id";
        filter.Operator = "OR";
        me._filter = filter;
        me.Load();
        me.SetFilterCreation("OR");
    }
    public AddAndFilter() {
        var me = this;
        var filter = new ClientFilter();
        filter.Field = "Id";
        filter.Operator = "AND";
        me._filter = filter;
        me.Load();
        me.SetFilterCreation("AND");
    }

    public SetFilterCreation(c: string)
    {
        var me = this;
        var controls = {
            ce_field: ()=>_SelectFirst(".Field", me),
            ce_andor: () => _SelectFirst(".AndOr", me),
            ce_expression: () =>_SelectFirst(".SourceExpression", me),
            ce_operator: () =>_SelectFirst(".Operator", me),
            ce_value: () =>_SelectFirst(".Value", me),
            ce_type: () =>_SelectFirst(".Type", me),
            ce_fieldformat: ()=>_SelectFirst(".FieldFormat", me)
        };
            
        var ce_andorlabel=()=>_SelectFirst(".AndOr>span", me);
        var hide = function () {
        
            for (var key in controls) {
                _Hide(controls[key]());
            }
        }
        hide();
        if (c == "OR")
        {
     
             
            ce_andorlabel().innerHTML = "OR";
            _Show(controls.ce_andor());

        }
        if (c == "AND") {
        

            ce_andorlabel().innerHTML = "AND";
            _Show(controls.ce_andor());
        }
        if (c == "SMPL") {
            _Show(controls.ce_field());
            _Show(controls.ce_operator());
            _Show(controls.ce_value());
        }
        if (c == "EXPR") {
            _Show(controls.ce_field());
            _Show(controls.ce_expression());
        }
    }

    public FieldSelected(control: Element, fieldpath: string)
    {
        var me = this;
        var fieldcontrol = <App_AutoComplete>control;
        var typecontrol = <HTMLInputElement>_SelectFirst("input[bind=Type]", me);
        var valuecontrol = <HTMLInputElement>_SelectFirst("input[bind=Value]", me);
        var field = fieldcontrol.value;
        var mt = MetaAccessByTypeName(me.roottype, field);
        me._filter.Type = UIDataType[GetUIDataTypeFrom(mt.SourceType)];
        typecontrol.value = me._filter.Type;
    }
    public static GetFilterEditorHtml(filter: IClientFilter)
    {
        var element = new App_FilterEditor();
        if (IsNull(filter.Value)) {
            filter.Value = Format("{0}", filter.Values.join(","));
        }
        element.setAttribute("label", filter.Field)
        element.Create(filter);
        return element.outerHTML;
    }


}
window.customElements.define("app-filtereditor", App_FilterEditor);

class App_ProgressButton extends HTMLElement
{
    private _value: string = "";

    get value() {
        var attrval = this.getAttribute("value");
        if (this._value == null || this.value === undefined) {
            this._value = attrval;
        }
        return this._value;
    }
    set value(val) {
        this._value = val;
    }

    public connectedCallback() {
        var me = this;
        var container = document.createElement("div");
        var button = document.createElement("input");
        button.type = "button";
        var label = document.createElement("span");
        container.appendChild(label);
        me.appendChild(button);
        me.appendChild(container);
    }
}
window.customElements.define("app-progressbutton", App_ProgressButton);

class App_Tabs extends HTMLElement
{
    public connectedCallback() {
        var me = this;
        var head = _SelectFirst(".heads", me);
        if (head == null)
        {
            head = document.createElement("div"); 
            head.classList.add("heads");
            me.appendChild(head);
        }
        head.addEventListener("click", function (event: MouseEvent) {
            var target = <HTMLElement>event.target;
            var head = target.classList.contains("head") ? target : _Parents(target).FirstOrDefault(i => i.classList.contains("head"));
            if (head != null) {
                if (head.classList.contains("head")) {
                    var headrel = head.getAttribute("rel");
                    me.Activate(headrel)
                }
            }
        });
        me.Activate("");
    }

    private Activate(rel: string)
    {
        var me = this;
        var heads = _Select(".head", me);
        var tabs = _Select(".tab", me);
        var chead = heads.FirstOrDefault();       
        if (!IsNull(rel))
        {
            chead = heads.FirstOrDefault(i => i.getAttribute("rel")==rel);
        }
        var ctab = _SelectFirst(".tab[name=" + chead.getAttribute("rel") + "]", me);
        for (var i = 0; i < heads.length; i++)
        {
            var head = heads[i];
            head.classList.remove("selected"); 
        }
        for (var i = 0; i < tabs.length; i++) {
            var tab = tabs[i];
            _Hide(tab);
        }
        chead.classList.add("selected");
        _Show(ctab);

    }
}
window.customElements.define("app-tabs", App_Tabs);

class App_MetaBrowser extends HTMLElement
{
    private _value: string = "";
    private _valueMeta: any = null;
    private _path: string = "";
    private _roottype: string = "";
    private _select: HTMLSelectElement;
    private _pathcontainer: HTMLDivElement;
    constructor() {
        super();
        var me = this;
    }
    get bind() {
        return this.hasAttribute('bind') ? this.getAttribute("bind") : null;
    }
    set bind(val) {
        this.setAttribute("bind", val);
    }
    get value() {        
        return this._value;
    }
    set value(val) {
        this._value = val;
    }
    get valueMeta() {
        return this._valueMeta;
    }
    set valueMeta(val) {
        this._valueMeta = val;
    }
    get roottype() {
        return this._roottype;
    }
    set roottype(val) {
        this._roottype = val;
    }
    public connectedCallback() {
        var me = this;
        me._value = me.getAttribute("value");
        me._roottype = IsNull(me.getAttribute("roottype")) ? "" : me.getAttribute("roottype");
        //me._path = me.roottype;
        var df = new DocumentFragment();

        me._select = <HTMLSelectElement>document.createElement("SELECT");
        me._select.multiple = true;
        me._select.addEventListener("dblclick", function (event: MouseEvent) {
            if ((<any>event.target).tagName == "OPTION") {
                var option = <HTMLOptionElement>event.target;
                var path = IsNull(me._path) ? option.value : (me._path + "." + option.value);
                me.LoadPath(path);
            }
        });
        me._select.addEventListener("click", function (event: MouseEvent) {
            if ((<any>event.target).tagName == "OPTION") {
                var option = <HTMLOptionElement>event.target;
                var path = IsNull(me._path) ? option.value : (me._path + "." + option.value);
                var meta = MetaAccessByTypeName(me.roottype, path);

                if (meta.Namespace != "models" && !meta.IsArray) {
                    me._value = path;
                    me.valueMeta = meta;

                } else
                {
                    me._value = "";
                    me.valueMeta = null;
                }
            }
        })
        me._pathcontainer = <HTMLDivElement>document.createElement("DIV");
        me._pathcontainer.classList.add("invisiblehscroll");
        var a = me.CreatePathAnchor("", me._roottype) 
        me._pathcontainer.appendChild(a);
        df.appendChild(me._pathcontainer);
        df.appendChild(me._select);
        me.appendChild(df);
        me.LoadPath("");
    }
    private CreatePathAnchor(path: string, text: string): HTMLAnchorElement {
        var me = this;
        var a = <HTMLAnchorElement>document.createElement("a");
        a.href = "javascript:void(0);";
        a.rel = path;
        a.addEventListener("click", function () { me.LoadPath(path) });
        a.text = text;
        return a;
    }
    public LoadPath(path: string)
    {
        var me = this;
        var pathparts = path.split(".");

        var meta: EntityMeta = <any>MetaAccessByTypeName(me.roottype, path);
        if (meta.Namespace == "models") {
         
            var anchors = _Select("a", me._pathcontainer);

            var currentanchor = anchors.FirstOrDefault(i => i.getAttribute("rel") == path);
            if (currentanchor != null) {
                var ix = anchors.indexOf(currentanchor);
                for (var i = ix+1; i < anchors.length; i++) {
                    anchors[i].remove();
                }
            }
            if (path != "") {
                var a = me.CreatePathAnchor(path, ">" + pathparts[pathparts.length - 1]);

                me._pathcontainer.appendChild(a);
                a.scrollIntoView();
            }
            me._path = path;
            me._select.innerHTML = "";
            for (var i = 0; i < meta.Fields.length; i++) {
                var fieldmeta = meta.Fields[i];
                var option = <HTMLOptionElement>document.createElement("option");
                option.value = fieldmeta.MetaKey;
                option.setAttribute("rel", path.length == 0 ? fieldmeta.MetaKey : (path+"."+fieldmeta.MetaKey));
                var t = "";
                if (fieldmeta.IsObject) {
                    t = "{}";
                }
                if (fieldmeta.IsArray) {
                    t = "[]";
                }
                option.innerText = Format("{0} {1}", fieldmeta.MetaKey, t );
                me._select.appendChild(option);
            }
          
        }
        
    }
}
window.customElements.define("app-metabrowser", App_MetaBrowser);

class App_Validation extends HTMLElement {

    private _Template: RazorTemplate = null;
    private get Template(): RazorTemplate {
        if (this._Template == null) {
            var layoutpath = "layout\\Controls\\Validation." + this.TypeName + ".razor.html";
            var html = application.Layouts.Templates[layoutpath];
            if (layoutpath in application.Layouts.Templates) {
                var t = new RazorTemplate();
                t.LayoutPath = layoutpath;
                t.Compile(html);
                this._Template = t;
            }
        }
        return this._Template; 
    }
    private _TypeName: string = "";
    public get TypeName(): string {
        if (IsNull(this._TypeName))
        {
            this._TypeName = this.getAttribute("TypeName");
        }
        return this._TypeName;
    }
    public set TypeName(value:string) {
        this._TypeName = value;
    }
    constructor() {
        super();
        var me = this;

       
     
    }
    public connectedCallback() {
        var me = this;
        
    }
    private callback: Function = null;
    public Load<T>(result: ValidationRuleResult[], callback?: Function)
    {
        var me = this;
        console.log(result);
        me.callback = callback;
        var df = me.Template.BindToFragment(result, { customcontrol: me });
        me.innerHTML = "";
        me.appendChild(df);
        _Show(me);
    }

    public Confirm()
    {
        var me = this;
        if (!IsNull(me.callback))
        {
            me.callback(true);
        }
        _Hide(me);
    }

    public Close()
    {
        var me = this;
        _Hide(me);
        me.callback(false);

    }





}
window.customElements.define("app-validation", App_Validation);

class App_RadioList extends HTMLElement
{
    private _value: string="";
    constructor() {
        super();
        var me = this;
    }
    public connectedCallback() {
        var me = this;
        me._value = me.getAttribute("value");
        var radios: HTMLInputElement[] = Array.from(me.querySelectorAll("input[type=radio]"));
        var selected = false;
        for (var i = 0; i < radios.length; i++)
        {
            var radio = radios[i];

            if (radio.value == this._value)
            {
                radio.checked = true;
                selected = true;
                break;
            }
        }
        if (!selected)
        {
            var firstradio = radios.FirstOrDefault();
            if (firstradio != null)
            {
                firstradio.checked = true;
            }
        }
    }
    
    get bind() {
        return this.hasAttribute('bind') ? this.getAttribute("bind") : null;
    }
    set bind(val) {
        this.setAttribute("bind", val);
    }

    get name() {
        return this.hasAttribute('name') ? this.getAttribute("name") : null;
    }
    set name(val) {
        this.setAttribute("name", val);
    }

    get value() {
        var radios: HTMLInputElement[] = <any>this.querySelectorAll("input[type=radio]");
        for (var i = 0; i < radios.length; i++) {
            var radio = radios[i];
      
            if (radio.checked)
            {
                this._value = radio.value;
                break;
            }
        }
        return this._value;
    }
    set value(val) {
        this._value = val;
    }

}
window.customElements.define("app-radiolist", App_RadioList);



class App_DictionaryEditor extends HTMLElement
{
    public attributeChangedCallback(attrName, oldValue, newValue) {
        this[attrName] = this.hasAttribute(attrName);
    }
    private dictionary = {};
    private container: HTMLElement = null;
    private textarea: HTMLTextAreaElement = null;
    constructor() {
        super();
        var me = this;
        this.textarea = this.querySelector("textarea");

        var initalhtml = me.innerHTML;
        if (IsNull(this.textarea)) {
            me.innerHTML = "";
            me.textarea = document.createElement("textarea");
            me.appendChild(me.textarea);
            me.textarea.innerHTML = initalhtml;
        }
    }

    public connectedCallback() {
        var element = this;
        //element.innerHTML = "";
        element.textarea = element.querySelector("textarea");
        element.container = element.querySelector("form");

        if (IsNull(element.textarea)) {
            element.textarea = document.createElement("textarea");
            element.appendChild(element.textarea);
        }
        if (IsNull(element.container)) {
            this.container = document.createElement("form");
            element.appendChild(this.container);

        }

        element.textarea.classList.add("editor-value");
        element.textarea.style.display = "none";

    
        this.container.classList.add("editor-container")
        this.container.addEventListener('change', function () {
            element.EnsureNewItem();
            element.Save();
        });
        element.Load(element.value);
    }

    private EnsureNewItem()
    {
        var items = _Select('input', this.container).Where(i => IsNull((<HTMLInputElement>i).value));
        var shouldaddnewitem = items.length == 0;

        if (shouldaddnewitem) {
            var itemdiv = document.createElement("div");
            var keyinput = document.createElement("input");
            itemdiv.appendChild(keyinput);
            keyinput.type = "text";
            keyinput.value = "";
            var valueinput = <HTMLTextAreaElement>document.createElement("textarea");
            itemdiv.appendChild(valueinput);
            valueinput.rows = 1;
            valueinput.value = "";
            this.container.appendChild(itemdiv);
        }
    }

    private Save()
    {
        var items = this.querySelectorAll("form div");
        var valuebuilder = [];
        items.forEach(function (item) {
            var keyelement = item.querySelector("input");
            var valueelement = item.querySelector("textarea");
            valuebuilder.push('"' + keyelement.value + '":"' + valueelement.value + '"');

        });
        this.textarea.value = valuebuilder.join('\n');
    }

    public static GetResourceDictionary(content: string): object {
        var result = {};
        var lines = CsvLineSplit(content, "\n", "\"");

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var ix = line.indexOf(":");
            if (ix > -1) {
                var key = line.substring(0, ix).trim();
                var value = line.substring(ix + 1).trim();
                if (key.startsWith("\"")) { key = key.substring(1); }
                if (key.endsWith("\"")) { key = key.substring(0, key.length - 1); }
                if (value.startsWith("\"")) { value = value.substring(1); }
                if (value.endsWith("\"")) { value = value.substring(0, value.length - 1); }
                result[key] = value;
            }
        }
        return result;
    }

    private Load(content: string)
    {
        var me = this;
        me.dictionary = App_DictionaryEditor.GetResourceDictionary(content);
        me.LoadUI();
    }
    private LoadUI()
    {
        var me = this;
        var df = document.createDocumentFragment();
        for (var key in me.dictionary)
        {
            var itemdiv = document.createElement("div");
            df.appendChild(itemdiv);
            var keyinput = document.createElement("input");
            itemdiv.appendChild(keyinput);
            keyinput.type = "text";
            keyinput.value = key;
            var valueinput = <HTMLTextAreaElement>document.createElement("textarea");
            itemdiv.appendChild(valueinput);
            valueinput.rows = 1;
            valueinput.value = me.dictionary[key];
        }
        me.container.innerHTML = "";
        me.container.appendChild(df);
        me.EnsureNewItem();
    }

    public disconnectedCallback() {

    }
    get bind() {
        return this.hasAttribute('bind') ? this.getAttribute("bind") : null;
    }
    set bind(val)
    {
        this.setAttribute("bind", val);
    }
    get value() {
        var valueelement = <HTMLTextAreaElement>this.querySelector("textarea");
        return !IsNull(valueelement) ? valueelement.value : null;
    }

    set value(val) {

        var valueelement = <HTMLTextAreaElement>this.querySelector("textarea");
        if (!IsNull(valueelement)) {
            valueelement.value = val;
            this.Load(val);
        }

    }
}
window.customElements.define("app-dictionaryeditor", App_DictionaryEditor);

class App_ModalWindow extends HTMLElement {
    public connectedCallback() {
        var element = this;
        element.style.display = "none";
        this.load();
    }

    public load() {
        var element = this;
        var title = Coalesce(element.getAttribute("title"), " ");
        var div = document.createElement("div");
        var e_title = document.createElement("span");
        e_title.innerText = title;
        var e_close = document.createElement("span");
        e_close.classList.add("a-Close");
        e_close.classList.add("icon");
        e_close.setAttribute("onclick", "_Hide(customcontrol(this))");
        div.appendChild(e_title);
        div.appendChild(e_close);
        let e_slot = document.createElement("slot");
        if (IsNull(this.shadowRoot)) {
            let shadowRoot = this.attachShadow({ mode: 'open' });
            var sheet = GetControlSheet();
            var cssText = Array.from(sheet.cssRules).Select(i => i.cssText).join("\n");
            var e_Style = document.createElement("style");
            e_Style.innerHTML = cssText;
            shadowRoot.appendChild(e_Style);
            shadowRoot.appendChild(div);
            shadowRoot.appendChild(e_slot);


            var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            div.onmousedown = dragMouseDown;
         

            function dragMouseDown(e) {
                e = e || window.event;
                e.preventDefault();
                // get the mouse cursor position at startup:
                pos3 = e.clientX;
                pos4 = e.clientY;
                document.onmouseup = closeDragElement;
                // call a function whenever the cursor moves:
                document.onmousemove = elementDrag;
            }

            function elementDrag(e) {
                e = e || window.event;
                e.preventDefault();
                // calculate the new cursor position:
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                // set the element's new position:
                element.style.top = (element.offsetTop - pos2) + "px";
                element.style.left = (element.offsetLeft - pos1) + "px";
                element.style.right = "auto";
                element.style.bottom = "auto"; 
            }

            function closeDragElement() {
                // stop moving when mouse button is released:
                document.onmouseup = null;
                document.onmousemove = null;
            }
        }



        //element.prepend(div);
    }

    public ContentChanged() {
        var me = this;
        me.load();
    }
}
window.customElements.define("app-modalwindow", App_ModalWindow);

class App_AutoComplete extends HTMLElement
{
    public options: AutoCompleteOption = new AutoCompleteOption();
    private _input: HTMLInputElement = null;
    private c_value: HTMLInputElement = null;
    private c_display: HTMLInputElement = null;
    public ShowDisplaynameInTextInput: boolean = false;
    private _value: string = "";
    public get displayText()
    {
        return this.c_display.placeholder; 
    }
    public set label(val) {
        if (!IsNull(this._input)) {
            this._input.placeholder = val;
        }
    }
    public get value() {
        var me = this;
        return me._value;
    }
    public set value(val) {
        var me = this;
        me._value = val;
        var event = document.createEvent("HTMLEvents");
        event.initEvent("change", true, false);
        var form = _Parents(me).FirstOrDefault(i => i.tagName == "FORM");
        if (form != null)
        {
            //var event = document.createEvent("HTMLEvents");
            //event.initEvent("change", false, false);
            //form.dispatchEvent(event);
        }
        me.dispatchEvent(event);
        //me.onchange(event);
    }

    public OnSelected(container: Element, dataitem: any)
    {
        var me = this;
        me.value = me.GetDataItemValue(dataitem);
    }


    constructor() {
        super();

    }

    static get observedAttributes() {
        return ["value","label"];
    }
    public attributeChangedCallback(attrName, oldValue, newValue) {
        this[attrName] = newValue;
    }

    public GetDataItemDisplayText(item: object): string {
        if (item["TypeName"] == "_Control") {
            return item["text"];
        }
        var me = this;
        var parts = [];
        var displayfields = me.options.displayfield.split(",");
        for (var i = 0; i < displayfields.length; i++) {
            parts.push(Access(item, displayfields[i]));
        }
        return parts.join("|");
    }

    public GetDataItemValue(item: any): any
    {
        if (item["TypeName"] == "_Control")
        {
            return item["value"];
        }
        var me = this;

        return item[me.options.valuefield];
    }
    private SetValueOfControl = function (el: Element, value: any) {
        if (el.tagName == "INPUT") {
            (<HTMLInputElement>el).value = value;
        } else {
            el.innerHTML = value;
        }
    } 
    public connectedCallback() {
        var element = this;
        if (!IsNull(element.shadowRoot)) {
            return;
        }
        if (element.hasAttribute("value"))
        {
            element._value = element.getAttribute("value");
        }
        var options = this.options;
        for (var key in this.options) {
            var attr = element.getAttribute(key);
            if (!IsNull(attr)) {
                options[key] = attr;
            }
        }
        if (!IsNull(options["bind"]))
        {
            element.ShowDisplaynameInTextInput = true;
        }

        var attr = element.getAttribute("class");
        if (!IsNull(attr)) {
            options.cssclass = attr;
        }
        var sheet = GetControlSheet();
        var cssText = Array.from(sheet.cssRules).Select(i => i.cssText).join("\n");
        var html = '' +
            '<style>' + cssText + '</style>' +
            '<div class="flexcontent">'+
            '<input class="value" type="hidden"/>' +
            '<div class="controls">' +
            '<input class="textbox" type="text"/>' +
            '<span class="icon close"></span>' +
            '<span class="icon activator"></span>' +
            '</div>' +
            '</div>' +
            '<ul class="list"></ul>' +
            '';
         
        var listdatadictionary = {};
        var listdata = []; 

    
        //element.innerHTML = html;
        //var shadowRoot = element;
        let shadowRoot = this.attachShadow({ mode: 'open' });

        //sheet.cssText;
        shadowRoot.innerHTML = html;
        //shadowRoot.innerHTML = html;

        var c_container: Element = element;
        c_container.setAttribute("class", options.cssclass);
    
        var options_valuelement = document.querySelector(options.valueelementquery);
        var options_displayelement = document.querySelector(options.displayelementquery);
        var options_inputelement = document.querySelector(options.inputelementquery);

        var c_controls = shadowRoot.querySelector(".controls");
        var c_action = shadowRoot.querySelector(".activator");
        var c_close = shadowRoot.querySelector(".close");
        var c_list = shadowRoot.querySelector("ul");
        var default_valueelement = shadowRoot.querySelector("input.value");
        var default_displayelement = shadowRoot.querySelector("span.display");
        var default_inputelement = shadowRoot.querySelector("input.textbox");

        var c_input: HTMLInputElement = <any>(IsNull(options_inputelement) ? default_inputelement : options_inputelement);
        element.c_value = <any>(IsNull(options_valuelement) ? default_valueelement : options_valuelement);
        var c_value = element.c_value;
        var c_display: HTMLInputElement = <any>(IsNull(options_displayelement) ? default_displayelement : options_displayelement);
        element._input = c_input;
        element.c_display = <any>default_inputelement; 
        //c_value.setAttribute("bind", options.bind);
        this.addEventListener("focus", () => {
            element._input.focus();
        });
        //element.removeAttribute("bind");
        //if (!IsNull(element.getAttribute("uidatatype"))) {
        //    c_value.setAttribute("uidatatype", element.getAttribute("uidatatype"));

        //}
        if (!IsNull(element.getAttribute("style"))) {
            c_container.setAttribute("style", element.getAttribute("style"));

        }

        //var datafunction = evalInContext.call(element, options.datafunction);
        var datafunction: Function = function () { };
        var xonselected: Function = function () { };
  
        var xondatareceived: Function = function (data,options) { };
  
        try {
            var x_f = <Function>evalInContext.call(element, "[" + options.datafunction + "]")[0];
            datafunction = x_f.bind(element);
        } catch (ex) { console.log(ex); }

        if (!IsNull(options.onselected)) {
            try {
                var x_of = evalInContext.call(element, "[" + options.onselected + "]")[0];
                xonselected = x_of.bind(element);
            } catch (ex) { console.log(ex); }
        }
        if (!IsNull(options.ondatareceived)) {
            try {
                var x_of = evalInContext.call(element, "[" + options.ondatareceived + "]")[0];
                xondatareceived = x_of.bind(element);
            } catch (ex) { console.log(ex); }
        }
        var onselected = function (container: Element, dataitem: any) {
            element.OnSelected(container, dataitem);
            if (!IsNull(xonselected))
            {
                xonselected(container, dataitem);
            }
        };
        //if (options.selectormode == "listwithdefault") {
        //    _Show(c_close);
        //} else {
        //    _Hide(c_close);
        //}

        var displayfields = options.displayfield.split(',');
    
        var datafunction_callback = function (items: any[]) {
            //console.log("datafunction_callback>" + items.length);
            var defaultcontainer = [];

            xondatareceived(items, options);

            listdata = defaultcontainer.concat(items);

            var builder = [];

            listdata.forEach(function (item) {
                var level = IsNull(options.level) ? "" : ( ' class="l'+ item[options.level]+'"');
                builder.push(Format('<li uid="{1}" {2}>{0}</li>', element.GetDataItemDisplayText(item), element.GetDataItemValue(item), level));
            });
            c_list.innerHTML = builder.join("\n");
            c_list.classList.add("hovering");
            _Show(c_list);

        };


        if (c_input != default_inputelement) {
            _Hide(default_inputelement);
        }
        if (c_value != default_valueelement) {
            _Hide(default_valueelement);
        }
        if (c_display != default_displayelement) {
            _Hide(default_displayelement);
        }
        c_display = c_input;
        c_input.placeholder = options.label;
        c_value.value = options.value;
  
        var Search = function (clear: boolean = true) {
            //console.log("Search");
            if (options.clearinput=="1") {
                element.SetValueOfControl(c_input, "");
                c_input.placeholder = "";
                //console.log("Clearing input");

            } else
            {
                //console.log("Search(false)");
            }
            datafunction(c_input.value, datafunction_callback, c_input);

            //if (options.minlengthtosearch == 0
            //    && c_list.children.length == 0
            //) {
            //}
            _Show(c_list);
        }
        element.Search = Search; 
        c_close.addEventListener("click", function () {
            element.Clear();
        });
        c_action.addEventListener("click", function () {
            var asyncSearch = async () => { Search() };
            //callasync(Search)
            asyncSearch();
        });

        c_input.addEventListener("input", function (e) {

            //console.log("oninput");
            if (c_input.value.length >= options.minlengthtosearch) {
                datafunction(c_input.value, datafunction_callback);
            }
        });
        var selectcurrent = function () {
            if (listdata.length > 0) {
                var ix = 0;
                var selected = _SelectFirst(".selected", c_list);
                if (selected != null) {
                    ix = Array.from(selected.parentNode.children).indexOf(selected);

                }
                var dataitem = listdata[ix];
                if (element.ShowDisplaynameInTextInput) {
                    c_input.placeholder = element.GetDataItemDisplayText(dataitem);
                }
                element.SetValueOfControl(c_value, dataitem[options.valuefield]);
                element.SetValueOfControl(c_display, element.GetDataItemDisplayText(dataitem)); 
                if (options.clearinput == "1") {
                    console.log("options.clearinput" + options.clearinput)
                    c_input.value = "";
                }

                onselected(c_container, dataitem);
                c_list.innerHTML = "";
            }
        }
        c_input.addEventListener("keydown", function (e) {
            var TABKEY = 9;
            if (e.keyCode == TABKEY) {
                console.log("TABKEy");
                selectcurrent();
                e.preventDefault();
                return false;
            }
        });
        c_input.addEventListener("keyup", function (e) {
            if (e.keyCode == options.keycodetoselectfirst) {
                //console.log("onenter");
                if (c_input.value.length >= options.minlengthtosearch) {
                    var selected = _SelectFirst(".selected", c_list);
                    if (selected != null) {
                        selectcurrent();
 
                    } else {
                        datafunction(c_input.value,
                            function (data) {
                                datafunction_callback(data);
                                selectcurrent();
                            }
                        );
                    }
                }
                
                
            }
            if (e.keyCode == 38) {
                   //up
                var selected = _SelectFirst(".selected", c_list);
                if (selected == null) {
                    if (c_list.children.length > 0) {
                        var lastix = c_list.children.length - 1;
                        c_list.children[lastix].classList.add("selected");
                        var dataitem = listdata[lastix];
                        //c_input.value = element.GetDataItemDisplayText(dataitem);
                    }
                } else
                {
                    selected.classList.remove("selected");
                    if (!IsNull(selected.previousElementSibling)) {
                        selected.previousElementSibling.classList.add("selected");
                        selected = selected.previousElementSibling;
                        selected.scrollIntoView(); 

                        var ix = Array.from(selected.parentNode.children).indexOf(selected);
                        var dataitem = listdata[ix];
                        //c_input.value = dataitem[options.valuefield];
                        //c_input.value = element.GetDataItemDisplayText(dataitem);

                    }
                }
             
            }
            if (e.keyCode == 40) {
                //down\
                var selected = _SelectFirst(".selected", c_list);
                if (selected == null) {
                    c_list.children[0].classList.add("selected");
                    var dataitem = listdata[0];
                    //c_input.value = element.GetDataItemDisplayText(dataitem);

                } else {
                    selected.classList.remove("selected");
                    if (!IsNull(selected.nextElementSibling)) {
                        selected.nextElementSibling.classList.add("selected");
                        selected = selected.nextElementSibling;
                        selected.scrollIntoView();
                        var ix = Array.from(selected.parentNode.children).indexOf(selected);
                        var dataitem = listdata[ix];
                        //c_input.value = element.GetDataItemDisplayText(dataitem);

                    }
                }
            }
        });
        c_list.addEventListener("mousedown", function (e: any) {
            var li: Element = e.target.tagName == "LI" ? e.target : e.target.parent;
            if (!IsNull(li) && li.tagName == "LI") {
                var nodes: any[] = Array.prototype.slice.call(c_list.children);
                var dataitem = listdata[nodes.indexOf(li)];
                if (element.ShowDisplaynameInTextInput) {
                    c_input.placeholder = element.GetDataItemDisplayText(dataitem);
                }
                element.SetValueOfControl(c_value, dataitem[options.valuefield]);
                element.SetValueOfControl(c_display, dataitem[options.displayfield]);
                c_input.value = "";

                onselected(c_container, dataitem);
                c_list.innerHTML = "";
            }
        });
        //element.parentElement.insertBefore(c_container, element);
        //element.remove();
    }

    public disconnectedCallback() {
         
    }
    public Search()
    {

    }

    public Clear() {
        var me = this;
        me.SetValueOfControl(me._input, "");
        me._input.placeholder = "";
        me._input.value = "";
        me.c_value.value = "";
        me.value = null;
        var ul = me.shadowRoot.querySelector("ul");
        ul.innerHTML = "";
    }
    public GetValue():string {
        var me = this;
        //if (IsNull(me._value)) {
        //    me._value = me.getAttribute("value");
        //}
        return me._value;
    }
    public SetInput(txt: string)
    {
        var me = this;
        me._input.value = txt;
        me._input.focus();
        me._input.selectionStart = me._input.selectionEnd = me._input.value.length;
        me.value = me._input.value;
    }
    public SetValue(value, displaytext)
    {
        var me = this;
        me._input.value = displaytext;
        me.value = value;
    }


}
window.customElements.define("app-autocomplete", App_AutoComplete);
class App_ObjectPicker extends App_AutoComplete
{
    private _tagsnode: HTMLElement = null;
    private _hinput: HTMLInputElement = null;
    private _uitype: UIDataType = null;


    get uitype() {
        var attrval = this.getAttribute("uitype");
        if (this._uitype == null || this.value === undefined) {
            this._uitype = Coalesce(attrval, UIDataType.Text);
        }
        return this._uitype;
    }
    set uitype(val) {
        this._uitype = val;
    }

    public GetTagText(data:any)
    {
        if (data["TypeName"] == "_Control") {
            return data["text"];
        }
        var me = this;
        var displayfields = me.options.displayfield.split(",");
        var displayfield = displayfields.FirstOrDefault();
        return Access(data, displayfield);
    }
    public GetTagValue(data: any) {
        if (data["TypeName"] == "_Control") {
            return data["value"];
        }
        var me = this;
        return Access(data, me.options.valuefield);
    }
    public OnSelected(container: Element, dataitem: any) {
        var me = this;
        if (!IsNull(dataitem)) {
            me.AddTag(me.GetTagValue(dataitem), me.GetTagText(dataitem));
        }
        var tagsnode = this._tagsnode;
        var hinput = this._hinput;

        
        hinput.value= me.GetValue();
        me.value = hinput.value;
    }

    constructor() {
        super();
        this.options.selectormode = "";
    }

    public GetValue():string
    {
        var me = this;
        var value = "";
        var tagnodes = _Select(".tag[value]", me._tagsnode);
        if (tagnodes == null || tagnodes.length == 0) { return value; }

        if (me.uitype == UIDataType.Text || me.uitype == UIDataType.Date) {
            value = "[" + tagnodes.Select(i => i.getAttribute("value")).join("],[") + "]";
        } else {
            value = tagnodes.Select(i => i.getAttribute("value")).join(",");

        }
        return value;
    }

    public Remove(value: string)
    {
        var me = this;
        var tagnode = _SelectFirst('label.tag[value="' + value + '"]', me._tagsnode);
        var hinput = this._hinput;
        tagnode.remove();
        hinput.value = me.GetValue();
        me.value = hinput.value;

    }
    public AddTag = function (id, name) {
        var me = this;
        var tagsnode: HTMLElement = this._tagsnode;
        
        if (IsNull(_SelectFirst(".tag[value=\"" + id + "\"]", tagsnode))) {
            var tagnode = _CreateElement("label", {class:"tag"});
            tagnode.innerHTML = Format('<span class="icon entypo-cancel" onclick="customcontrol(this).Remove(\'{0}\')"></span>{1}',id, name);
            //var b_delete = _SelectFirst(".entypo-cancel", tagnode);
            //b_delete.addEventListener("click", me.OnSelected.bind(me));
            tagnode.setAttribute("value", id);
            var controlsnode = tagsnode.querySelector(".controls");
            tagsnode.insertBefore(tagnode, controlsnode);
            return true;
        }
        return false;

    }

    public Clear() {
        var me = this;
        super.Clear();
        var tags = _Select(".tag", me);
        tags.forEach(t => { t.remove(); })
    }

    public connectedCallback() {
        super.connectedCallback();
        var self = this;
        var me = self.shadowRoot;
        
        var boundelements = _Select("[bind]", me);
        var container = _SelectFirst(".flexcontent", me);
        boundelements.forEach(e => e.removeAttribute("bind"));

        self.ShowDisplaynameInTextInput = false;
        //var tagsnode = document.createElement("DIV");
        //tagsnode.classList.add("tags");
        //container.insertBefore(tagsnode, container.children[0]);
        self._tagsnode = <any>container;

        var hinput: HTMLInputElement = <any>document.createElement("INPUT");
        //hinput.setAttribute("bind", me.options.bind);
        //hinput.setAttribute("uidatatype", UIDataType[me.options.uidatatype]);
        hinput.type = "hidden";
        me.insertBefore(hinput, this.children[0]);
        self._hinput = hinput;


        if (!IsNull(this.value)) {
            var parts = this.value.split(",");
            var results = [];
            for (var i = 0; i < parts.length; i++) {
                var part = parts[i];
                var item = { id: "", name: "" };
                item.id = part; item.name = part;
                results.push(item);
                this.AddTag(item.id, item.name);
            }
            self.OnSelected(null, null);
            self.value = self.GetValue();
        }
    }
}
window.customElements.define("app-objectpicker", App_ObjectPicker);

class App_QueryViewFields extends HTMLElement {
    constructor() {
        super();
        var me = this;
        var change = new Event('change');
        this.addEventListener('change', function () { me.ChangeFields() }, false);
    }

    public Fieldlist = [];

    public SetFieldlist(fieldlist: any[]) {
        this.Fieldlist = fieldlist;
        this.loadList(this.Fieldlist);
    }

    public loadList(fieldlist: any[]) {
        var container = document.createElement('div');
        container.setAttribute("class", "fieldsetter")
        var FieldlistOut: any = [];

        for (var i = 0; i < fieldlist.length; i++) {
            var fieldname = "models." + fieldlist[i].type + "." + fieldlist[i].field;
            var checked = "";
            (fieldlist[i].visible) ? checked = "checked" : checked = "";
            var _field = Format("<label class='fieldlabel'><input id='{2}' type='checkbox' {1}/> {0}<label>", Res(fieldname), checked, fieldlist[i].fieldid);
            container.innerHTML += _field;

            if (checked) {
                FieldlistOut.push(fieldlist[i]);
            }
        }

        this.appendChild(container);

        var style = document.createElement('style');

        style.textContent = " .fieldsetter {display: none; width: max-content; border: 1px solid;} .fieldlabel {padding: 3px 5px;} .fieldlabel:hover {cursor: pointer; background: #ececec;}"

        this.appendChild(style);

        return FieldlistOut;

    }

    public updatedList(fieldlist: any[]) {
        var FieldlistOut: any = [];
        for (var i = 0; i < fieldlist.length; i++) {
            if (fieldlist[i].visible) {
                FieldlistOut.push(fieldlist[i]);
            }
        }
        return FieldlistOut;
    }

    public ChangeFields() {
        var me = this;
        var checkboxelements: HTMLInputElement[] = <HTMLInputElement[]>_Select(".fieldlabel > input");

        checkboxelements.forEach(ck => {
            var ckid = ck.getAttribute("id");
            me.Fieldlist.forEach(fl => {
                if (fl.fieldid == ckid) {
                    fl.visible = ck.checked;
                    return;
                }
            });
        });

        var checkedfields = me.updatedList(me.Fieldlist);

        console.log(checkedfields);
        //me.Bind(".body", me.Model, {}, { map: false });

    }

    public connectedCallback() {

        //var result = this.loadList(this.Fieldlist);
        //return result;
    }

}
window.customElements.define("app-queryviewfields", App_QueryViewFields);

class AutoCompleteOption
{
    public clearinput: string = "1";
    public targetquery: string = "";
    public selectormode = "listwithdefault";
    public valueelementquery: string = "undefined";
    public displayelementquery: string = "undefined";
    public inputelementquery: string = "undefined";

    public datafunction: string = "";
    public onselected: string = "";
    public ondatareceived: string = "";

    public valuefield: string = "";
    public displayfield: string = "";

    public level: string = "";
    public value: string = "";
    public label: string = "";

    public bind: string = "";
    public uidatatype: UIDataType = UIDataType.Text;

    public resultlimit: number = 10;
    public minlengthtosearch: number = 0;

    public multiselect: boolean = false;
    public keycodetoselectfirst: number = 13;

    public cssclass: string = "autocomplete";

}
window["iziToast"].settings({
    timeout: 5000,
    resetOnHover: true,
    icon: 'material-icons',
    transitionIn: 'fadeInLeft',
    transitionOut: 'fadeOut',
    position: 'topRight'
});
function GetContextMenu(): HTMLElement
{
    var contextmenuelement = <HTMLElement>_SelectFirst(".contextmenu");
    if (IsNull(contextmenuelement)) {
        contextmenuelement = document.createElement("div");
        contextmenuelement.classList.add("contextmenu");
        contextmenuelement.classList.add("hovering");
        document.body.appendChild(contextmenuelement);
    }
    return contextmenuelement;
}

function SetContextPosition(item: HTMLElement, refitem: HTMLElement)
{
    var w = item.clientWidth;
    var h = item.clientHeight
    var bounding = refitem.getBoundingClientRect();
    var vp_h = (window.innerHeight || document.documentElement.clientHeight);
    var vp_w = (window.innerWidth || document.documentElement.clientWidth);
    if ((bounding.bottom + h) > vp_h) {
        // Bottom is out of viewport
        item.style.bottom = (vp_h - bounding.bottom) + "px";//- itemelement.offsetHeight + 
        item.style.top = "";
    } else
    {
        item.style.top = bounding.top + "px";
        item.style.bottom = "";
    }

    if ((bounding.right + w) > vp_w) {
        // Bottom is out of viewport
        var right = Math.max((vp_w - bounding.right - refitem.clientWidth), 0);
        item.style.right = right + "px";//- itemelement.offsetHeight + 
        item.style.left = "";
    } else {
        item.style.left = bounding.left + refitem.clientWidth + "px";
        item.style.right = "";
    }

}

function Focus(e: HTMLElement, asyncc: boolean=false)
{
    if (document.activeElement != e) {
        e.focus();
    }
    if (asyncc)
    {
        (async () => {
            e.focus();
        })();
    }

}

class UILogger
{
    logbuilder = [];
    element: HTMLElement = null;
    private GetStringFromHtmlElement(e: HTMLElement): string {
        var items = [];
        items.push("<" + e.tagName + "");
        if (e.hasAttribute("id")) { items.push("id='" + e.getAttribute("id") + "'");}
        if (e.hasAttribute("bind")) { items.push("bind='" + e.getAttribute("bind") + "'");}
        if (e.hasAttribute("class")) { items.push("class='" + e.getAttribute("class") + "'"); }
        items.push("/>");

        return items.join(" ");
    }
    public logevent(e: Event,other:string="")
    {
        if ("key" in e) {
            other = other + Format("[{0},{1}]", e["key"], e["keyCode"]);
        }
        this.logbuilder.push(this.GetStringFromEvent(e, other));
    }
    private GetStringFromEvent(e: Event,other:string="") 
    {
        var targetstr = IsNull(e.target) ? "" : ("outerHTML" in e.target ? (this.GetStringFromHtmlElement(<any>e.target)) : "");
        var msg = "EVENT(" + e.type + ") @" + other + " target: " + targetstr +" "+ e.timeStamp;
        return msg;
    }
    public start(e: Element) 
    {
        this.element = <HTMLElement>e;

        var me = this;
        e.addEventListener('focusin', (e: UIEvent) => {
            me.logevent(e);
        });
        e.addEventListener('touchstart', (e: UIEvent) => {
            me.logevent(e);
        });
        e.addEventListener('mousedown', (e: UIEvent) => {
            me.logevent(e);
        });
        e.addEventListener('paste', (e: UIEvent) => {
            me.logevent(e);
        });
        e.addEventListener('input', (e: UIEvent) => {
            me.logevent(e);
        });
        e.addEventListener('change', (e: UIEvent) => {
            me.logevent(e);
        });
        e.addEventListener('textInput', (e: Event) => {
            me.logevent(e, e["data"]);
        });
        e.addEventListener('keydown', (e: KeyboardEvent) => {
            me.logevent(e);
        });
        e.addEventListener('keyup', (e: KeyboardEvent) => {
            me.logevent(e);
        });
        e.addEventListener('keypress', (e: KeyboardEvent) => {
            me.logevent(e);
        });
    }
    public stop() {

    }
    public GetLogs()
    {
        var str = this.logbuilder.join("\n");
        return str;
    }
}

class BarcodeScaner {
    timeoutms = 10;
    eventname = "keydown";
    logevent(e: Event, other: string = "") {
        var htos = (e: HTMLElement) => {
            var items = [];
            if (e.getAttribute("id") == "scannedbarcode") { return "#scannedbarcode";}
            items.push("bind:" + e.getAttribute("bind")+";");
            items.push("id:"+e.getAttribute("id")+";");
            items.push("class:" + e.getAttribute("class") + ";");
            return items.join(" ");
        }
        var targetstr = IsNull(e.target) ? "" : ("outerHTML" in e.target ? (htos(<any>e.target)) : "");
        var msg = "EVENT-"+e.type + " @" + e.timeStamp + " " + other + " target: " + targetstr;
        LogToast("log", "T", msg);
        //console.log(msg);
    };

    initialize = () => {
        var me = this;
        document.addEventListener('touchstart', (e: UIEvent) => {
            me.logevent(e);
        });
        document.addEventListener('mousedown', (e: UIEvent) => {
            me.logevent(e);
        });
        document.addEventListener('paste', (e: UIEvent) => {
            me.logevent(e);
        });
        document.addEventListener('textInput', (e: Event) => {
            me.logevent(e, e["data"]);
        });
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            //if (e.keyCode == 9) {
            me.logevent(e, e.key + " " + e.keyCode);
            //}
        });
        //document.addEventListener('keypress', (e: KeyboardEvent) => {
        //    //if (e.keyCode == 9) {
        //    me.logevent(e, e.key + " " + e.keyCode);
        //    //}
        //});
        //document.addEventListener('keypup', (e: KeyboardEvent) => {
        //    //if (e.keyCode == 9) {
        //    me.logevent(e, e.key + " " + e.keyCode);
        //    //}
        //});
        //document.addEventListener('input', (e: InputEvent) => {
        //    //if (e.keyCode == 9) {
        //    me.logevent(e, e.data);
        //    //}
        //});
        document.addEventListener('focusin', (e: UIEvent) => {
            me.logevent(e);
        });
        document.addEventListener(this.eventname, this.keyup)
        if (this.timeoutHandler) {
            clearTimeout(this.timeoutHandler)
        }
        this.timeoutHandler = setTimeout(() => {
            this.inputString = ''
        }, this.timeoutms)
    }

    close = () => {
        document.removeEventListener(this.eventname, this.keyup)
    }

    timeoutHandler = 0

    inputString = ''

    keyup = (e) => {
        if (this.timeoutHandler) {
            clearTimeout(this.timeoutHandler)
            this.inputString += String.fromCharCode(e.keyCode)
        }

        this.timeoutHandler = setTimeout(() => {
            if (this.inputString.length <= 3) {
                this.inputString = ''
                return
            }
            var event = new CustomEvent("onbarcodescaned", {detail: this.inputString});

            // Dispatch/Trigger/Fire the event
            document.dispatchEvent(event);
            //events.emit('onbarcodescaned', this.inputString)

            this.inputString = ''
        }, this.timeoutms)
    }
}
var barcodereaderEventHandling = new BarcodeScaner();
//barcodereaderEventHandling.initialize();
function LogToast(verb: string, stitle: string, smessage: string = "") {
    var msg = document.createElement('code');
    var details = document.createElement('code');
    msg.classList.add(verb);
    msg.textContent = verb + ': ' + stitle;
    details.innerHTML = smessage;
    //msg.appendChild(details);
    msg.innerHTML = details.innerHTML;
    var container = document.getElementById("toasts");
    container.appendChild(msg);
}

function Toast_Error(stitle: string, smessage: string = "", sdata: string = "") {
    smessage = IsNull(smessage) ? "" : smessage;
    LogToast("error", stitle, sdata + smessage);
    Log(stitle, smessage);
    window["iziToast"].error({
        title: stitle,
        message: sdata + smessage
    });
}
function Toast_Notification(stitle: string, smessage: string = "") {
    smessage = IsNull(smessage) ? "" : smessage;
    LogToast("info", stitle, smessage);

    Log(stitle, smessage);
    window["iziToast"].info({
        title: stitle,
        message: smessage,
        icon: "entypo-check"
    });
}
function Toast_Warning(stitle: string, smessage: string = "", sdata: string = "") {
    smessage = IsNull(smessage) ? "" : smessage;
    LogToast("warning", stitle, sdata + smessage);
    Log(stitle, smessage);
    window["iziToast"].warning({
        title: stitle,
        message: smessage + sdata
    });
    LogToast("warn", stitle, smessage);

}
function Toast_Success(stitle: string, smessage: string = "") {
    smessage = IsNull(smessage) ? "" : smessage;
    LogToast("success", stitle, smessage);

    window["iziToast"].success({
        title: stitle,
        message: smessage
    });
}


//function GD(txt: string, callback: Function)
//{
//    var data = [
//        { id: 1 ,name:"abc"},
//        { id: 2 ,name:"eefg"},
//        { id: 3 ,name:"aaj"},
//        { id: 4 ,name:"oop"},
//        { id: 55 ,name:"acj"},
//        { id: 6 ,name:"PIC"},
//        { id: 7 ,name:"fac"},
//        { id: 88 ,name:"ret"},
//        { id: 9 ,name:"ocx"},
//        { id: 10 ,name:"rar"},
//        { id: 100 ,name:"What"},
//        { id: 1000, name: "atat" }
//    ];
//    var result: any[] = [];
//    var ltxt = txt.toLowerCase();
//    data.forEach(function (item) {
//        if (item.name.toLowerCase().indexOf(ltxt) > -1) {
//            result.push(item);
//        }
//    });
//    callback(result);
//}


function GetMinMaxDate(inputhtml: string)
{
    var htmlbulder = [];
    var selectorfunction = '_SelectFirst(\'input[type=hidden]\', this.parentElement.parentElement)';
    htmlbulder.push('<div class="value minmaxdate">');
    htmlbulder.push(inputhtml);
    htmlbulder.push('<div class="mindate">');
    htmlbulder.push('<label>' + Res("UI.general.DateMin") + '</label>');
    htmlbulder.push('<input type="date" name="min" onchange="SetMinDate(this,' + selectorfunction+')"/>');
    htmlbulder.push('</div>');

    htmlbulder.push('<div class="maxdate">');
    htmlbulder.push('<label>' + Res("UI.general.DateMax") + '</label>');
    htmlbulder.push('<input type="date" name="max" onchange="SetMaxDate(this,' + selectorfunction+')"/>');
    htmlbulder.push('</div>');

    htmlbulder.push('</div>');
    return htmlbulder.join("\n");
}

function SetMinDate(source: HTMLInputElement, target: HTMLInputElement)
{
    var dvalue: Date = IsNull(source.value) ? null : new Date(source.value);
    var value = IsNull(dvalue)? "": FormatDate(dvalue, application.Settings.DateFormat);
    var parts = target.value.split("..");
    if (parts.length == 1) { target.value = IsNull(value)? value: Format("[{0}..", value) }
    else
    {
     
        target.value = Format("[{0}..{1}", value, parts[1]);
    }
}

function SetMaxDate(source: HTMLInputElement, target: HTMLInputElement) {
    var dvalue: Date = IsNull(source.value) ? null : new Date(source.value);
    var value = IsNull(dvalue)? "": FormatDate(dvalue, application.Settings.DateFormat);
    var parts = target.value.split("..");
    if (parts.length == 1) { target.value = IsNull(value) ? value : Format("[{0}..", value) }
    else {
        target.value = Format("{0}..{1}]", parts[0], value);
    }
}

function CreatePager(container: Element, options: Object)
{
    var page = FirstNotNull(options["page"], 0);
    var pagesize = FirstNotNull(options["pagesize"], 10);
    var totalrecords = FirstNotNull(options["total"], 0);
    var cssclass = FirstNotNull(options["cssClass"], 0);
    var onclick = FirstNotNull(options["onclick"], function () { });
    var urlformat = options["urlformat"];
    var pagecount = Math.ceil(totalrecords / pagesize);
    var next: string = '<a class="next icon "></a>';
    var prev: string = '<a class="prev icon "></a>';
    var label: string = Format('<span>/{0}</span>', pagecount);
    var jumpto: string = '<input class="jumpto" type="number"/>';
    var label2: string = Format('<span> ({0})</span>', totalrecords);
    var ps: String = '<label>' + Res("general.PageSize") + ':<input type="number" min="1" max="500" name="PageSize" value="' + pagesize + '" onchange="view(this).SavePageSize(this.value)" /></label>';
    var html = prev + jumpto + label + next + label2 + ps;
    container.innerHTML = html; 
    var input = <HTMLInputElement>container.querySelector(".jumpto");
    var nexte = <HTMLInputElement>container.querySelector(".next");
    var preve = <HTMLInputElement>container.querySelector(".prev");
   
    if (page > 0)
    {
        input.value = page;
    }
    var ix = (!isNaN(parseInt(page))) ? parseInt(page) : null;

    var fpage = function (val:any) {
        if (!isNaN(parseInt(val))) {
            var p = parseInt(val);
            if (p > 0 && (p <= pagecount || totalrecords==-1)) {
                if (!IsNull(urlformat)) {
                    window.location.href = Format(urlformat, p)
                } else {
                    onclick(p)
                }
            }
        }
    }; 
    nexte.addEventListener("click", function () {

        fpage(ix + 1);
    });
    preve.addEventListener("click", function () {

        fpage(ix - 1);
    });
    input.addEventListener("change", function (e: KeyboardEvent) {
        input.setAttribute("value", input.value);
    });

    input.addEventListener("keyup", function (e: KeyboardEvent) {
        if (e.key === "Enter") {
            var val = input.value.trim();
            fpage(val);

        }

    });

}
function SetFloatLayout(element: HTMLElement) {
    var firstchild = element.children.length > 0 ? element.children[0] : null;
    if (firstchild != null) {
        var setheight = () => {
            var height = firstchild.clientHeight;
           
            if (height > 0) {

                element.style.height = height + 'px';
            }
        }
        setheight();
    }
}
function ToggleFloatBox(element: HTMLElement, setheight: boolean = true) {
    var firstchild = element.children.length > 0 ? element.children[0] : null;
    if (firstchild != null) {
        var isvisible = IsNull(element.style) || element.style.display != "none";
        var row = _Parents(element).FirstOrDefault(i => i.tagName == "TR");
        if (isvisible) {
            _Hide(element);
            if (row != null) { row.classList.remove("relative"); }
        }
        else
        {
            var setHeight = () => {
                if (setheight) {
                    var height = firstchild.clientHeight;

                    if (height > 0) {
                        element.style.height = height + 'px';
                    }
                }
            }

            if ("OnActivated" in firstchild) {
                (<any>firstchild["OnActivated"])(setHeight);
            }
            if (row != null) { row.classList.add("relative"); }

            _Show(element);
            setHeight();

        }
        
    }
    
}
function FloatList(listdata: [], fields: [])
{
    var builder = [];
    builder.push(Format('<span class="entypo-list" onclick="callasync(()=>ToggleFloatBox(this.nextElementSibling))"></span>'));
    builder.push('<div class="floatlist hovering" hidden style="display:none">');
    builder.push('<ul >');
    listdata.forEach(function (item) {
        var displayvalue = fields.Select(i => Format("{0}",Access(item,i))).join(', ');
        builder.push(Format('<li>{0}</li>', displayvalue));
    });
    builder.push("</ul>");
    builder.push("</div>");

    return builder.join("\n");
}

function CellDetails(html, setheight: boolean = true)
{
    var builder = [];
    builder.push(Format('<span class="entypo-list" onclick="callasync(()=>ToggleFloatBox(this.nextElementSibling, {0}))"></span>', setheight));
    builder.push('<div class="floatlist hovering" hidden style="display:none">');
    builder.push(html)
    builder.push("</div>");

    return builder.join("\n");
}

function ClearFilter(viewelement: Element)
{
    var filtercontiner = _SelectFirst(".filter", viewelement);
    var inputs = _Select("input", filtercontiner);
    for (var i = 0; i < inputs.length; i++) {
        inputs[i]["value"] = "";
    }

    var tags = _Select(".tags", filtercontiner);
    for (var i = 0; i < tags.length; i++) {
        tags[i].innerHTML = "";
    }

}

function LoadBarcodes()
{
    var barcodescriptelement = <HTMLScriptElement>_SelectFirst("#barcodescript");
    if (IsNull(barcodescriptelement)) {
        barcodescriptelement = <any>_CreateElement('script', {
            src: "scripts/JsBarcode.all.min.js",
            id: "barcodescript",
            type: "text/javascript"
        });
        //barcodescriptelement.src = "scripts/JsBarcode.all.min.js";
        //barcodescriptelement.id = "barcodescript";
        //barcodescriptelement.type = "text/javascript";
        document.head.appendChild(barcodescriptelement);
        barcodescriptelement.onload = function () {
            try {
                JsBarcode(".xbarcode").init();
            } catch (ex) { }
        };
    } else {
        try {
            JsBarcode(".xbarcode").init();
        } catch (ex) { }
    }
}

function GetFiltersFromUI(filtercontainer: Element): IClientFilter[]
{
    var result: IClientFilter[] = [];
    var elements = _Select("[bind]", filtercontainer);
    for (var i = 0; i < elements.length; i++)
    {
        var element = elements[i];
        var ok = true;
        if (element.tagName == "INPUT"
            && (<HTMLInputElement>element).type == "checkbox"
            && !(<HTMLInputElement>element).checked) {
            ok = false;
        }
        if (ok) {
            var bind = element.getAttribute("bind");
            var binds = CsvLineSplit(bind);
             
            var type = element.hasAttribute("uidatatype") ? element.getAttribute("uidatatype") : "Text";
            if (IsNumeric(type))
            {
                type = UIDataType[type];
            }
            var isexact = element.hasAttribute("isexact") ? true : false;

            var uitype: UIDataType = UIDataType[type];
            var valueobj = GetPropertyandValue(element);
            var value = IsNull(valueobj) ? null : valueobj.Value;
            var valuestr = Format("{0}", value);
            if (isexact && uitype == UIDataType.Text)
            {
                valuestr = Format("[{0}]", value);
            }

            //if (valuestr.length > 0) {
                if (binds.length > 1) {
                    var orfilter = new ClientFilter();
                    orfilter.Operator = "OR";
                    orfilter.Field = "Id";
                    orfilter.Children = [];
                    for (var i_f = 0; i_f < binds.length; i_f++) {
                        var bindpart = binds[i_f];
                        var childfilter = ClientFilter.Create(uitype, bindpart, valuestr);
                        orfilter.Children = orfilter.Children.concat(childfilter);
                    }
                    result.push(orfilter);

                } else {
                    result = result.concat(ClientFilter.Create(uitype, bind, valuestr));
                }
            //}
        }
    }
    return result;
}

function resizableGrid(tbl: any, headonly: boolean = false) {
    let table = <HTMLTableElement>tbl;
    var row = (<HTMLTableElement>table).tHead.rows[0],
        cols: HTMLElement[] = <any>(row ? row.children : undefined);
    if (!cols) return;
    table.style.overflow = 'hidden';

    var tableHeight = headonly ? table.tHead.rows[table.tHead.rows.length - 1].offsetHeight : table.offsetHeight;
    //var tableHeight = table.offsetHeight;

    for (var i = 0; i < cols.length; i++) {
        var existingresizer = cols[i].querySelector(".colresizer");
        var div = createDiv(tableHeight, <any>existingresizer);
        cols[i].appendChild(div);
        cols[i].style.position = 'relative';
        if (existingresizer == null) {
            setListeners(div);
        }
    }

    function setListeners(div) {
        var pageX, curCol, nxtCol, curColWidth, nxtColWidth;

        div.addEventListener('mousedown', function (e) {
            curCol = e.target.parentElement;
            nxtCol = curCol.nextElementSibling;
            pageX = e.pageX;

            var padding = paddingDiff(curCol);

            curColWidth = curCol.offsetWidth - padding;
            if (nxtCol)
                nxtColWidth = nxtCol.offsetWidth - padding;

            
        });

        div.addEventListener('mouseover', function (e) {
            e.target.style.borderRight = '2px solid rgba(169,169,169, 1)';
        })

        div.addEventListener('mouseout', function (e) {
            e.target.style.borderRight = '';
        })

        table.addEventListener('mousemove', function (e) {
            
            if (curCol) {
                var diffX = e.pageX - pageX;

                //if (nxtCol) {
                //    nxtCol.style.width = (nxtColWidth - (diffX)) + 'px';
                //    (<HTMLElement>nxtCol).style.minWidth = (nxtColWidth - (diffX)) + 'px';
                //}

                curCol.style.width = (curColWidth + diffX) + 'px';
                curCol.style.minWidth = (curColWidth + diffX) + 'px';
            }

        });

        table.addEventListener('mouseup', function (e) {
            curCol = undefined;
            nxtCol = undefined;
            pageX = undefined;
            nxtColWidth = undefined;
            curColWidth = undefined
        });
    }

    function createDiv(height, existing?: HTMLElement) {
        var div = existing;
        if (existing == null)
        {
            div = <any>_CreateElement('div', { class: "colresizer" });
            div.classList.add("colresizer");
            div.style.top = "0px";
            div.style.right = "0px";
            div.style.width = '8px';
            div.style.position = 'absolute';
            div.style.cursor = 'col-resize';
            div.style.userSelect = 'none';
        }
        if (height != null) {
            var heightstr = height + 'px';
            if (heightstr != div.style.height) {
                div.style.height = height + 'px';
            }
        }
        return div;
    }

    function paddingDiff(col) { 

        if (getStyleVal(col, 'box-sizing') == 'border-box') {
            return 0;
        }

        var padLeft = getStyleVal(col, 'padding-left');
        var padRight = getStyleVal(col, 'padding-right');
        return (parseInt(padLeft) + parseInt(padRight));

    }

    function getStyleVal(elm, css) {
        return (window.getComputedStyle(elm, null).getPropertyValue(css))
    }
};



function ResizeImages(file: any, maxsize: number = 150, callback: Function) {
    if (file.type.match(/image.*/)) {
        console.log('An image has been loaded');

        // Load the image
        var reader = new FileReader();
        reader.onload = function (readerEvent) {
            var image = new Image();
            image.onload = function (imageEvent) {

                // Resize the image
                var canvas = document.createElement('canvas'),
                    max_size = maxsize,// TODO : pull max size from a site config
                    width = image.width,
                    height = image.height;
                if (width > height) {
                    if (width > max_size) {
                        height *= max_size / width;
                        width = max_size;
                    }
                } else {
                    if (height > max_size) {
                        width *= max_size / height;
                        height = max_size;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(image, 0, 0, width, height);
                var dataUrl = canvas.toDataURL('image/png');
                var resizedImage = dataURLToBlob(dataUrl);
                callback({
                    type: file.type,
                    blob: resizedImage,
                    url: dataUrl,
                    filename: file.name
                });

            }
            image.src = <any>readerEvent.target.result;
        }
        reader.readAsDataURL(file);
    }
}

function LabelProxy(prefixes: string[]=[""]) {
    var pr = new Proxy({}, {
        has: function (target, prop) {
            return true;
        },

        get: function (target, prop:any) {
            for (var i = 0; i < prefixes.length; i++) {
                var prefix = prefixes[i].length > 0 ? prefixes[i] + "." : "";
                var key = prefix + prop
                if (ResExists(key)) {
                    return Res(key);
                }

            }
            return Res(prop);

        }
    });
    return pr;
}