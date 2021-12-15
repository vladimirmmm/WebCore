function XXX() {
    var x = 0;
}
function EvalIn(context, code) {
    var ff = eval("[" + code + "]")[0];
    return ff.call(context, code);
}
function GetObjectFromCode(context, code) {
    var ff = eval("[" + code + "]")[0];
    return ff;
}
function returneval(code, me) {
    var ff = eval.call(me, "[" + code + "]")[0];
    return ff;
}
function EvalX(context, code) {
    //# Return the results of the in-line anonymous function we .call with the passed context
    return function () { return eval(code); }.call(context);
}
function BindAccess(obj, key) {
    var result;
    var tobj = obj;
    this["model"] = tobj;
    if (key.indexOf("html.") == 0) {
        try {
            var ff = eval("[" + HtmlDecode(key) + "]")[0];
            result = ff; //.call({ model: tobj, meta: GetMeta(obj) });
            //result = evalInContext.call({ model: tobj, meta: GetMeta(obj) }, HtmlDecode(key));
            //result = eval(HtmlDecode(key));
            //result = eval(key);
            return result;
        }
        catch (err) {
            //console.error(err);
        }
    }
    if (key == "this" || key == "model") {
        return obj;
    }
    this["model"] = tobj;
    this["meta"] = GetMeta(obj);
    try {
        result = evalInContext(HtmlDecode(key));
    }
    catch (err) {
        //console.error(err);
    }
    //result = key.split(".").reduce(function (o, x) {
    //    return (typeof o == "undefined" || o === null) ? o : o[x];
    //}, tobj);
    return IsNull(result) ? "" : result;
}
function evalInContext(code) {
    return eval(code);
}
function GetBoundElements(element) {
    var nobinds = _Select("[no-bind]", element);
    var iswithinnobound = function (element) {
        for (var i = 0; i < nobinds.length; i++) {
            if (nobinds[i].contains(element)) {
                return true;
            }
        }
        return false;
    };
    var boundelements = _Select("[bind]", element).Where(i => !iswithinnobound(i)).Select(function (i) {
        var propertyparts = i.getAttribute("bind").split(".");
        var propertyval = propertyparts[propertyparts.length - 1];
        var parents = _Parents(i, element);
        //parents = parents.splice(parents.indexOf(element) + 1);
        var parentsval = parents.Where(p => !p.hasAttribute("no-bind") && p.hasAttribute("binding-items"));
        var pathval = parentsval.Select(p => p.getAttribute("binding-items").replace("model.", ""));
        propertyparts.pop();
        return {
            element: i,
            property: propertyval,
            parents: parentsval,
            path: pathval.concat(propertyparts)
        };
    });
    for (var i = 0; i < boundelements.length; i++) {
        var be = boundelements[i];
        for (var pi = be.parents.length - 1; pi > -1; pi--) {
            var parent = be.parents[pi];
            var parentpath = parent.getAttribute("binding-items").replace("model.", "");
            for (var ci = 0; ci < parent.children.length; ci++) {
                var child = parent.children[ci];
                if (child.contains(be.element)) {
                    var index = Array.prototype.indexOf.call(parent.children, child);
                    var pathix = be.path.indexOf(parentpath);
                    be.path[pathix] = Format("{0}[{1}]", parentpath, index);
                }
            }
        }
    }
    return boundelements.Select(function (i) { return { element: i.element, path: i.path, property: i.property }; });
}
function GetBoundObject(element, target) {
    var boundelements = GetBoundElements(element);
    if (!IsNull(target)) {
        boundelements = boundelements.Where(i => i.element == target);
    }
    var valueof = function (e) {
        if (e.tagName == "INPUT" && e.type == "radio") {
            return e.checked ? e.value : null;
        }
        if (!("value" in e)) {
            return e.innerHTML.trim();
        }
        return e.value;
    };
    var obj = {};
    var setdictionary = {};
    for (var i = 0; i < boundelements.length; i++) {
        var be = boundelements[i];
        var path = be.path.concat([be.property]).join(".");
        if (!IsNull(path)) {
            if (!(path in setdictionary)) {
                setdictionary[path] = valueof(be.element);
            }
            else {
                setdictionary[path] = FirstNotNull(valueof(be.element), setdictionary[path]);
            }
            //SetPath(obj, path, valueof(be.element));
        }
    }
    for (var key in setdictionary) {
        SetPath(obj, key, setdictionary[key]);
    }
    return obj;
}
function ConvertToProperty(obj, key, onset = null) {
    if (!("__values" in obj)) {
        obj["__vlaues"] = {};
    }
    Object.defineProperty(obj, key, {
        get: function () {
            return obj["__vlaues"][key];
        },
        set: function (value) {
            obj["__vlaues"][key] = value;
            if (onset != null) {
                onset(value);
            }
        }
    });
}
function GetLinkedObj(element, obj) {
    var meta = GetMeta(obj);
    var linkedobj = JsonCopy(obj);
    var boundelements = GetBoundElements(element);
    for (var i = 0; i < boundelements.length; i++) {
        var uiobj = boundelements[i];
        var property = uiobj.property;
        var cpath = uiobj.path.join(".");
        var path = cpath + "." + property;
        var element = uiobj.element;
        var listener = uiobj.listener;
        var onuiset = function (val) {
            SetPath(linkedobj, this.path, this.element.value);
        };
        var b_onuiset = onuiset.bind({ element: element, path: path });
        if (!IsNull(listener)) {
            element.removeEventListener("change", listener);
        }
        else {
            listener = b_onuiset;
            uiobj.listener = listener;
        }
        element.addEventListener("change", listener);
        var container = IsNull(cpath) ? linkedobj : GetPath(linkedobj, cpath);
        var onmodelset = function (val) {
            this.value = val;
        };
        var b_onmodelset = onmodelset.bind(element);
        ConvertToProperty(container, property, b_onmodelset);
    }
    return linkedobj;
}
class FlowEditor extends HTMLElement {
    connectedCallback() {
        var me = this;
    }
}
window.customElements.define("flow-editor", FlowEditor);
class ValidationResult {
    constructor() {
        this.target = null;
        this.ID = "";
        this.Message = "";
    }
}
class ObjectMeta {
    constructor() {
        this.UIType = "string";
        this.SourceType = "string";
        this.Namespace = "";
        this.DefaultValue = null;
    }
    get Label() {
        var key = this.Namespace + "." + this.MetaKey;
        var label = "";
        if (ResExists(key)) {
            label = Res(key);
        }
        else {
            var basekey = this.Namespace.substring(0, this.Namespace.lastIndexOf(".")) + ".BaseModel." + this.MetaKey;
            if (ResExists(basekey)) {
                label = Res(basekey);
            }
            else {
                Res(key);
            }
        }
        if (IsNull(label)) {
            label = this.MetaKey;
        }
        return label;
    }
    get IsObject() {
        return this.SourceType.endsWith("{}");
    }
    get IsArray() {
        return this.SourceType.endsWith("[]");
    }
    get typeArgument() {
        var _typeArgument = this.SourceType;
        if (_typeArgument.indexOf("{") > -1 || _typeArgument.indexOf("[") > -1) {
            _typeArgument = _typeArgument.substring(0, _typeArgument.length - 2);
        }
        return _typeArgument;
    }
    get JSType() {
        var stype = "any";
        if (this.IsArray) {
            return this.typeArgument + "[]";
        }
        if (this.IsObject) {
            return this.typeArgument;
        }
        switch (this.SourceType.toLowerCase()) {
            case "integer":
                stype = "number";
                break;
            case "double":
                stype = "number";
                break;
            case "float":
                stype = "number";
                break;
            case "decimal":
                stype = "number";
                break;
            case "datetime":
                stype = "Date";
                break;
            case "date":
                stype = "Date";
                break;
            case "boolean":
                stype = "boolean";
                break;
            case "string":
                stype = "string";
                break;
        }
        return stype;
    }
    get InputType() {
        var stype = "text";
        switch (this.JSType) {
            case "Date":
                stype = "date";
                break;
            case "number":
                stype = "number";
                break;
        }
        return stype;
    }
    Validate(item) {
        var results = [];
        return results;
    }
    ;
}
class PropertyMeta extends ObjectMeta {
    static GetMetaFrom(obj) {
        var source = obj;
        var me = new PropertyMeta();
        CopyProperty(source, me, "MetaKey");
        CopyProperty(source, me, "UIType");
        CopyProperty(source, me, "SourceType");
        CopyProperty(source, me, "Validations");
        CopyProperty(source, me, "Editor");
        CopyProperty(source, me, "DefaultValue");
        return me;
    }
}
class EntityMeta extends ObjectMeta {
    constructor() {
        super(...arguments);
        this.Fields = [];
        this.Keys = ["Id"];
    }
    IsEqualByKeys(a, b) {
        var result = true;
        if (IsNull(a) || IsNull(b)) {
            return false;
        }
        if (keyattribute in a) {
            if (a[keyattribute] != b[keyattribute]) {
                result = false;
            }
        }
        else {
            this.Keys.forEach(function (key) {
                if (IsNull(a[key]) && IsNull(b[key])) {
                    return true;
                }
                if (a[key] != b[key]) {
                    result = false;
                }
            });
        }
        return result;
    }
    HasKey(a) {
        var result = false;
        this.Keys.forEach(function (key) {
            if (!IsNull(a[key])) {
                result = true;
            }
        });
        return result;
    }
    SetProperties(data, recursive = false, level = 0) {
        for (var i = 0; i < this.Fields.length; i++) {
            var propertymeta = this.Fields[i];
            if (!data.hasOwnProperty(propertymeta.MetaKey)) {
                data[propertymeta.MetaKey] = propertymeta.DefaultValue;
                if (propertymeta.IsObject && recursive && level < 10) {
                    var obj = {};
                    data[propertymeta.MetaKey] = obj;
                    var targetmeta = GetMetaByTypeName(propertymeta.typeArgument);
                    if (targetmeta != null) {
                        targetmeta.SetProperties(obj, recursive, level + 1);
                    }
                }
                if (propertymeta.IsArray) {
                    data[propertymeta.MetaKey] = [];
                }
            }
        }
        data["TypeName"] = this.MetaKey;
    }
    static GetMetaFrom(obj, metakey, ns = "") {
        var source = obj;
        var me = new EntityMeta();
        me.MetaKey = metakey;
        me.Namespace = ns;
        CopyProperty(source, me, "MetaKey");
        CopyProperty(source, me, "UIType");
        CopyProperty(source, me, "SourceType");
        CopyProperty(source, me, "Validations");
        CopyProperty(source, me, "Editor");
        CopyProperty(source, me, "Keys");
        CopyProperty(source, me, "DefaultValue");
        for (var key in source) {
            var item = source[key];
            if (item instanceof Object && !(item instanceof Array)) {
                //source[item]["MetaKey"] = item;
                var fieldmeta = PropertyMeta.GetMetaFrom(item);
                fieldmeta.MetaKey = key;
                fieldmeta.Namespace = me.Namespace + "." + me.MetaKey;
                me[key] = fieldmeta;
                me.Fields.push(fieldmeta);
            }
        }
        return me;
    }
}
class MetaModels {
    constructor() {
        this.ns = "models";
        this.Entities = [];
    }
    Load(obj) {
        for (var item in obj) {
            var metakey = item;
            var metaobj = obj[item];
            var entitymeta = GetMetaByTypeName(metakey);
            if (entitymeta == null) {
                var entitymeta = EntityMeta.GetMetaFrom(metaobj, metakey, this.ns);
                entitymeta.MetaKey = metakey;
                this.Entities.push(entitymeta);
            }
            else {
                for (var field in metaobj) {
                    var fieldmeta = PropertyMeta.GetMetaFrom(metaobj[field]);
                    fieldmeta.MetaKey = field;
                    fieldmeta.Namespace = entitymeta.Namespace + "." + entitymeta.MetaKey;
                    if (!(field in entitymeta)) {
                        entitymeta[field] = fieldmeta;
                        entitymeta.Fields.push(fieldmeta);
                    }
                    else {
                        var existingfield = entitymeta.Fields.FirstOrDefault(i => i.MetaKey == field);
                        var ix = entitymeta.Fields.indexOf(existingfield);
                        entitymeta.Fields[ix] = fieldmeta;
                    }
                    entitymeta[field] = fieldmeta;
                }
            }
        }
    }
    CreateEntity(typename) {
        var result = { TypeName: typename };
        var meta = GetMeta(result);
        meta.SetProperties(result, true);
        return result;
    }
    GenerateTSInterface(typename) {
        var result = "";
        var meta = GetMetaByTypeName(result);
        result = result + " interface I" + meta.MetaKey + "\r\n";
        result = result + " {";
        meta.Fields.forEach(function (field) {
            result = result + "      " + field.MetaKey + ": " + field.JSType + ";\r\n";
        });
        result = result + " }";
        return result;
    }
}
var metaModels = new MetaModels();
function GetUIDataTypeFrom(sourcetype) {
    var result = UIDataType.Number;
    var lsourcetype = sourcetype.toLowerCase();
    if (In(lsourcetype, "string")) {
        return UIDataType.Text;
    }
    if (In(lsourcetype, "date")) {
        return UIDataType.Date;
    }
    return result;
}
function GetMeta(obj) {
    var typename = obj == null ? "" : obj.hasOwnProperty("TypeName") ? obj["TypeName"] : "";
    return GetMetaByTypeName(typename);
}
function GetMetaByTypeName(typename) {
    return metaModels.Entities.FirstOrDefault((i) => i.MetaKey == typename);
}
function SetObjectTo(item, typename) {
    item["TypeName"] = typename;
    var meta = GetMeta(item);
    meta.SetProperties(item);
}
function SetTypeName(item, typename) {
    item["TypeName"] = typename;
}
function __x() { }
function MapObject(source, target, cleararray = true, xmeta = null) {
    var meta = IsNull(xmeta) ? GetMeta(target) : xmeta;
    if (meta.IsEqualByKeys(source, target) || meta.Keys.length == 0) {
        var properties = GetProperties(source);
        for (var i = 0; i < properties.length; i++) {
            var propertyname = properties[i].Key.toString();
            var pmeta = meta[propertyname];
            var propertyvalue = properties[i].Value;
            var targetpropertyvalue = target[propertyname];
            if (propertyvalue instanceof Array) {
                var items = propertyvalue;
                if (cleararray) {
                    target[propertyname] = [];
                }
                if (propertyvalue.length > 0) {
                    var ameta = GetMetaByTypeName(pmeta.typeArgument);
                    for (var ix = 0; ix < items.length; ix++) {
                        var item = items[ix];
                        var existing = null;
                        if (!IsNull(target[propertyname])) {
                            existing = target[propertyname].FirstOrDefault((x) => ameta.IsEqualByKeys(x, item));
                        }
                        if (!IsNull(existing)) {
                            MapObject(item, existing);
                        }
                        else {
                            target[propertyname].push(item);
                        }
                    }
                }
                continue;
            }
            if (propertyvalue instanceof Object) {
                MapObject(propertyvalue, targetpropertyvalue, cleararray, GetMetaByTypeName(pmeta.typeArgument));
                continue;
            }
            CopyProperty(source, target, propertyname);
        }
        var z = 1;
    }
    else {
        Log("MapObject: source and target have different keys(s)");
    }
}
function MapObjectCI(source, target, cleararray = true) {
    var meta = GetMeta(target);
    if (!meta.HasKey(target) || meta.IsEqualByKeys(source, target) || meta.Keys.length == 0) {
        var properties = GetProperties(source);
        var targetproperties = GetProperties(target);
        for (var i = 0; i < properties.length; i++) {
            var propertyname = properties[i].Key.toString();
            var lpropertyname = propertyname.toLowerCase();
            var tp = targetproperties.FirstOrDefault((p) => p.Key.toString().toLowerCase() == lpropertyname);
            if (tp != null) {
                var tpropertyname = tp.Key;
                var propertyvalue = properties[i].Value;
                var targetpropertyvalue = target[tpropertyname];
                if (propertyvalue instanceof Array) {
                    var items = propertyvalue;
                    if (cleararray) {
                        target[tpropertyname] = [];
                    }
                    if (propertyvalue.length > 0) {
                        var ttypeargument = tpropertyname in meta ? meta[tpropertyname].typeArgument : "";
                        var ameta = GetMetaByTypeName(ttypeargument);
                        for (var ix = 0; ix < items.length; ix++) {
                            var item = items[ix];
                            //var targetarray = (<[]>targetpropertyvalue)
                            var existing = target[tpropertyname].FirstOrDefault((x) => ameta.IsEqualByKeys(x, item));
                            if (!IsNull(existing)) {
                                MapObjectCI(item, existing);
                            }
                            else {
                                var newitem = metaModels.CreateEntity(ameta.MetaKey);
                                MapObjectCI(item, newitem);
                                target[tpropertyname].push(newitem);
                            }
                        }
                    }
                    continue;
                }
                if (propertyvalue instanceof Object) {
                    MapObjectCI(propertyvalue, targetpropertyvalue);
                    continue;
                }
                CopyProperty(source, target, propertyname, tpropertyname);
            }
        }
    }
    else {
        Log("MapObject: source and target have different keys(s)");
    }
}
function GetMetaKeyChain(typename, key) {
    if (key == null) {
        return null;
    }
    var m = GetMetaByTypeName(typename);
    if (m == null) {
        return null;
    }
    var parts = key.split(".");
    var result = [];
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        var field = m.Fields.FirstOrDefault(i => i.MetaKey == part);
        if (!IsNull(field)) {
            result.push({ type: m.MetaKey, property: field.MetaKey });
            if (field.IsObject) {
                m = GetMetaByTypeName(field.typeArgument);
            }
        }
    }
    return result;
}
function MetaAccessByTypeName(typename, key) {
    if (IsNull(typename)) {
        return null;
    }
    if (key == null || key == "") {
        //return null;
        return GetMetaByTypeName(typename);
    }
    if (typename == null) {
        return null;
    }
    var m = GetMetaByTypeName(typename);
    var parts = key.split(".");
    var result = null;
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        var field = m.Fields.FirstOrDefault(i => i.MetaKey == part);
        if (field == null) {
            return null;
        }
        if (field.IsObject) {
            m = GetMetaByTypeName(field.typeArgument);
            result = m;
        }
        else {
            result = field;
        }
    }
    return result;
}
function MetaAccess(obj, key) {
    if (IsNull(obj)) {
        return null;
    }
    var tn = obj["TypeName"];
    return MetaAccessByTypeName(tn, key);
}
function DF_Meta(root, txt, callback) {
    var meta = GetMetaByTypeName(root);
    var ltxt = txt.toLowerCase();
    if (meta != null) {
        var parts = txt.split('.');
        var parentpath = "";
        if (parts.length > 1) {
            parentpath = parts.slice(0, parts.length - 1).join(".");
            meta = MetaAccessByTypeName(root, parentpath);
            ltxt = parts[parts.length - 1].toLowerCase();
        }
        var results = meta.Fields.Where(i => i.MetaKey.toLowerCase().indexOf(ltxt) > -1).Select(i => {
            var t = "";
            if (i.Namespace == "models") {
                t = " {}";
            }
            else {
                if (i.IsArray) {
                    t = " []";
                }
            }
            return {
                MetaKey: i.MetaKey + t,
                Path: (parentpath.length == 0 ? "" : parentpath + ".") + i.MetaKey
            };
        });
        callback(results);
    }
}
var FieldOperators = [
    "=",
    "<>",
    "LIKE",
    ">",
    ">=",
    "<",
    "<=",
    "IN",
    "IS",
    "IS NOT"
];
class Filter {
    constructor() {
        this.Field = "";
        this.Expression = "";
    }
}
var UIDataType;
(function (UIDataType) {
    UIDataType[UIDataType["Text"] = 1] = "Text";
    UIDataType[UIDataType["Date"] = 2] = "Date";
    UIDataType[UIDataType["Boolean"] = 3] = "Boolean";
    UIDataType[UIDataType["Number"] = 4] = "Number";
})(UIDataType || (UIDataType = {}));
class UIFilterOptions {
    constructor() {
        this.Field = "";
        this.Type = UIDataType.Text;
        this.Value = "";
        this.LabelKey = "";
        this.ModelContext = "";
        this.QueryName = "";
        this.LookupTargetField = "";
        this.LookUpFields = null;
        this.LookupMode = false;
        this.ValueField = "";
        this.DisplayField = "";
        this.Callback = null;
        this.ShowNullFilters = false;
    }
}
class UIFilter {
    constructor() {
        this.DataType = UIDataType.Text;
        this.LookUp = null;
    }
    static GetNullFilterElements(items, options) {
        var displayfield = options.displayfield.split(",").FirstOrDefault();
        var valufield = options.valuefield;
        var isnulloption = { value: "{NULL}", text: Res("UI.Filters.NULL"), TypeName: "_Control" };
        var notnulloption = { value: "!{NULL}", text: Res("UI.Filters.NOTNULL"), TypeName: "_Control" };
        if (IsArray(items)) {
            items.push(notnulloption);
            items.push(isnulloption);
        }
        //builder.push(Format('<li uid="{1}" class="l{3}" uname="{2}">{0}</li>', "NULL", "{NULL}", "NULL", ""));
        //builder.push(Format('<li uid="{1}" class="l{3}" uname="{2}">{0}</li>', "NOT NULL", "!{NULL}", "NOT NULL", ""));
    }
    static Create(options) {
        var filter = new UIFilter();
        if (options == null || IsNull(options.Field)) {
            console.log("UIFilter not defined properly!");
            return null;
        }
        else {
            filter.Field = options.Field;
            filter.LookupTargetField = FirstNotNull(options.LookupTargetField, options.Field);
            filter.DataType = options.Type;
            filter.Value = options.Value;
            filter.LabelKey = options.LabelKey; //FirstNotNull(options.LabelKey, options.Field);
            if (!IsNull(options.QueryName)) {
                filter.LookUp = new DataLookup();
                filter.LookUp.QueryName = options.QueryName;
                if (typeof options.LookUpFields === 'string') {
                    options.LookUpFields = options.LookUpFields.split(',');
                }
                filter.LookUp.LookUpFields = FirstNotNull(options.LookUpFields, ["Name"]);
                filter.LookUp.ValueField = FirstNotNull(options.ValueField, "Id");
                filter.LookUp.DisplayField = FirstNotNull(options.DisplayField, "Name");
            }
        }
        return filter;
    }
    GetQuery() {
        var me = this;
        var result = ClientFilter.Create(me.DataType, me.Field, me.Value);
        return result;
    }
    static Test() {
        var clientfilters = {};
        var uifilters = [];
        var adduifilter = function (uifilter, value) {
            var f = UIFilter.Create(uifilter);
            f.Value = value;
            uifilters.push(f);
            return f;
        };
        var s = [];
        var textfilter = { Field: "Name", Type: UIDataType.Text };
        var datefilter = { Field: "Name", Type: UIDataType.Date };
        var numberfilter = { Field: "Name", Type: UIDataType.Number };
        var booleanfilter = { Field: "Name", Type: UIDataType.Boolean };
        adduifilter(textfilter, 'abcd');
        adduifilter(textfilter, 'abcd,ef,"1234,56","sadb%",ahj\'sdf');
        adduifilter(textfilter, 'cdf%');
        adduifilter(textfilter, 'cdf%sfd');
        adduifilter(textfilter, 'safsf?');
        adduifilter(numberfilter, '2');
        adduifilter(numberfilter, '222,322,433,70..120,150.2..200,..50,5000..');
        adduifilter(datefilter, '2012-10-09');
        adduifilter(datefilter, '10/12/2019');
        adduifilter(datefilter, '2018-10..');
        adduifilter(datefilter, '2018-10..,2018-08-06,..2018-09-01,2018-03..2018-03-31');
        adduifilter(datefilter, 'now - d20,now + y2,now..,..now-M20');
        var items = uifilters.Select(i => { return { "value": i.Value, "clientfilters": i.GetQuery() }; });
        console.log(items);
    }
}
class ClientFilter {
    constructor() {
        this.Field = "";
        this.Operator = "";
        this.Values = [];
        this.Type = "number";
        this.Children = null;
    }
    static CreateSimple(type, field, operator, val) {
        var filter = {
            Field: field,
            Type: UIDataType[type],
            Operator: operator,
            Values: [val]
        };
        return filter;
    }
    static Create(type, field, val) {
        var result = [];
        var value = Format("{0}", val);
        var TextFilterCreator = function (item) {
            var filter = new ClientFilter();
            var value = item;
            var isexact = EndsWith(value, "]") && StartsWith(value, "[");
            if (isexact) {
            }
            var operator = "LIKE";
            if (value.indexOf("%") == -1) {
                if (!isexact) {
                    value = '%' + value + '%';
                }
                else {
                    operator = "=";
                    value = value.substring(1, value.length - 1);
                    if (value == "{NULL}") {
                        filter = {
                            Field: field,
                            Type: UIDataType[type],
                            Operator: "IS",
                            Values: [value]
                        };
                        return filter;
                    }
                    if (value == "!{NULL}") {
                        filter = {
                            Field: field,
                            Type: UIDataType[type],
                            Operator: "IS NOT",
                            Values: [value.substring(1)]
                        };
                        return filter;
                    }
                    filter = {
                        Field: field,
                        Type: UIDataType[type],
                        Operator: operator,
                        Values: [value]
                    };
                    return filter;
                }
            }
            value = value.toUpperCase();
            filter = {
                Field: field,
                FieldFormat: "upper({0})",
                Type: UIDataType[type],
                Operator: "LIKE",
                Values: [value]
            };
            return filter;
        };
        var NonStringFilterCreator = function (item) {
            var typestr = UIDataType[type];
            if (IsNull(item)) {
                return null;
            }
            var value = item;
            var isrightcontained = false;
            var isleftcontained = false;
            if (item.startsWith("[")) {
                isleftcontained = true;
                value = value.substring(1);
            }
            if (item.endsWith("]")) {
                isrightcontained = true;
                value = value.substring(0, value.length - 1);
            }
            var parts = value.split("..");
            var filter = null;
            var negatingvalue = false;
            if (value.startsWith("!")) {
                value = value.substring(1);
                negatingvalue = true;
            }
            if (value.indexOf("..") == -1) {
                var operator = "=";
                var nloperator = "IS";
                if (negatingvalue) {
                    operator = "<>";
                    nloperator = "IS NOT";
                }
                if (value == "{NULL}") {
                    operator = nloperator;
                }
                filter = {
                    Field: field,
                    Type: typestr,
                    Operator: operator,
                    Values: [value]
                };
            }
            if (value.indexOf("..") > -1) {
                var leftfilter = IsNull(parts[0]) ? null : {
                    Field: field,
                    Type: typestr,
                    Operator: isleftcontained ? ">=" : ">",
                    Values: [parts[0]]
                };
                var rightfilter = IsNull(parts[1]) ? null : {
                    Field: field,
                    Type: typestr,
                    Operator: isrightcontained ? "<=" : "<",
                    Values: [parts[1]]
                };
                var filters = [];
                if (rightfilter != null) {
                    filters.push(rightfilter);
                }
                if (leftfilter != null) {
                    filters.push(leftfilter);
                }
                if (filters.length == 1) {
                    filter = filters.FirstOrDefault();
                }
                if (filters.length > 1) {
                    var andfilter = {
                        Field: field,
                        Operator: "AND",
                        Children: [],
                        Values: []
                    };
                    andfilter.Children = filters;
                    filter = andfilter;
                }
            }
            return filter;
        };
        var filtercreator = NonStringFilterCreator;
        var valueparts = CsvLineSplit(value);
        if (type == UIDataType.Text) {
            filtercreator = TextFilterCreator;
        }
        var canresolvewithIN = type != UIDataType.Text && valueparts.length > 1 && valueparts.Where(i => i.indexOf("..") > -1).length == 0;
        if (canresolvewithIN) {
            var infilter = new ClientFilter();
            infilter.Field = field;
            infilter.Operator = "IN";
            infilter.Type = UIDataType[type];
            infilter.Values = valueparts;
            result.push(infilter);
        }
        else {
            var orfilter = new ClientFilter();
            orfilter.Operator = "OR";
            orfilter.Field = field;
            orfilter.Children = [];
            valueparts.forEach(function (valuepart) {
                var filter = filtercreator(valuepart);
                if (filter != null) {
                    if (filter.Values.length == 1 && filter.Values[0].startsWith("!") && filter.Operator == "=") {
                        filter.Values = [filter.Values[0].substring(1)];
                        filter.Operator = "<>";
                    }
                    orfilter.Children.push(filter);
                }
            });
            if (orfilter.Children.length == 1) {
                result.push(orfilter.Children.FirstOrDefault());
            }
            if (orfilter.Children.length > 1) {
                result.push(orfilter);
            }
        }
        if (type == UIDataType.Date) {
            var datefixer = function (cf) {
                for (var i = 0; i < cf.Values.length; i++) {
                    var cf_value = cf.Values[i];
                    if (cf_value != "NULL" && cf_value != "{NULL}") {
                        var d = StringToDate(cf_value, ClientFilter.DateFormat);
                        var sd = StringToDate(cf_value, "yyyy-MM-dd");
                        var sdstr = Format("{0:yyyy-MM-dd}", sd);
                        if (sdstr != cf_value) {
                            if (d != null) {
                                cf.Values[i] = Format("{0:yyyy-MM-dd}", d);
                            }
                        }
                    }
                }
                if (cf.Values.length == 1) {
                    var val = cf.Values[0];
                    if (val.length < 11) {
                        var d = StringToDate(cf.Values[0], "yyyy-MM-dd");
                        var new_d = null;
                        var newop = null;
                        if (cf.Operator == ">") {
                            new_d = addDays(d, 1);
                            newop = ">=";
                        }
                        if (cf.Operator == "<=") {
                            new_d = addDays(d, 1);
                            newop = "<";
                        }
                        if (cf.Operator == "=") {
                            var nextday = addDays(d, 1);
                            var andfilter = {
                                Operator: "AND",
                                Field: cf.Field,
                                Values: [],
                                Type: UIDataType[UIDataType.Date],
                                Children: [
                                    {
                                        Operator: "<",
                                        Field: cf.Field,
                                        Type: UIDataType[UIDataType.Date],
                                        Values: [Format("{0:yyyy-MM-dd}", nextday)]
                                    },
                                    {
                                        Operator: ">=",
                                        Field: cf.Field,
                                        Type: UIDataType[UIDataType.Date],
                                        Values: [Format("{0:yyyy-MM-dd}", d)]
                                    }
                                ]
                            };
                            cf.Operator = andfilter.Operator;
                            cf.Field = andfilter.Field;
                            cf.Type = andfilter.Type;
                            cf.Children = andfilter.Children;
                            cf.Values = andfilter.Values;
                        }
                        if (new_d != null) {
                            cf.Values[0] = Format("{0:yyyy-MM-dd}", new_d);
                        }
                        if (newop != null) {
                            cf.Operator = newop;
                        }
                    }
                }
                if ("Children" in cf) {
                    for (var i = 0; i < cf.Children.length; i++) {
                        datefixer(cf.Children[i]);
                    }
                }
            };
            result.forEach(datefixer);
        }
        return result;
    }
}
ClientFilter.DateFormat = "yyyy-MM-dd";
class NumberFilter extends Filter {
    constructor() {
        super(...arguments);
        this.TypeName = "NumberFilter";
    }
    GetQuery() {
        var me = this;
        var result = [];
        if (!IsNull(this.Value)) {
            result.push({ Field: me.Field, Operator: "=", Values: [me.Value], Type: "number" });
        }
        if (!IsNull(this.List) && this.List.length > 0) {
            result.push({ Field: me.Field, Operator: "IN", Values: me.List, Type: "number" });
        }
        if (!IsNull(this.Min)) {
            result.push({ Field: me.Field, Operator: ">=", Values: [Format("{0}", me.Min)], Type: "number" });
        }
        if (!IsNull(this.Max)) {
            result.push({ Field: me.Field, Operator: "<=", Values: [Format("{0}", me.Max)], Type: "number" });
        }
        return result;
    }
    get Html() {
        var html = "";
        return html;
    }
    static CreateListFilter(fieldname, items) {
        var filter = new NumberFilter();
        filter.Field = fieldname;
        filter.List = items;
        return filter;
    }
}
class StringFilter extends Filter {
    constructor(src = "") {
        super();
        this.TypeName = "StringFilter";
        this.CaseSensitive = false;
        this.IsExact = false;
        var me = this;
        if (!IsNull(src)) {
            var ix = src.indexOf(":");
            me.Field = src.substring(0, ix);
            me.Value = src.substring(ix + 1);
        }
    }
    GetQuery() {
        var me = this;
        var result = [];
        var field = me.Field;
        var value = me.Value;
        var list = me.List;
        var format = "";
        if (!me.CaseSensitive) {
            format = "upper({0})";
            value = IsNull(value) ? value : value.toUpperCase();
            if (!IsNull(list)) {
                for (var i = 0; i < list.length; i++) {
                    list[i] = list[i].toUpperCase();
                }
            }
        }
        var cf = null;
        if (!IsNull(value)) {
            var operator = "LIKE";
            var valueformat = "{0}";
            if (value == "{NULL}") {
                value = "NULL";
                operator = "IS";
                format = "";
            }
            else {
                if (!me.IsExact) {
                    valueformat = "%{0}%";
                }
                else {
                    operator = "=";
                }
            }
            value = Format(valueformat, value);
            cf = { Type: "string", FieldFormat: format, Field: field, Operator: operator, Values: [value] };
        }
        if (!IsNull(list) && list.length > 0) {
            cf = { Type: "string", FieldFormat: format, Field: field, Operator: "IN", Values: list };
        }
        if (cf != null) {
            result.push(cf);
        }
        return result;
    }
    static CreateListFilter(fieldname, items) {
        var filter = new StringFilter();
        filter.Field = fieldname;
        filter.List = items;
        return filter;
    }
}
class DateFilter extends Filter {
    constructor() {
        super(...arguments);
        this.TypeName = "DateFilter";
    }
    GetQuery() {
        var me = this;
        var result = [];
        if (!IsNull(this.Value)) {
            result.push({ Type: "Date", Field: me.Field, Operator: "=", Values: [me.Value] });
        }
        if (!IsNull(this.List) && this.List.length > 0) {
            result.push({ Type: "Date", Field: me.Field, Operator: "IN", Values: me.List });
        }
        var qry = "";
        var concatenator = "";
        if (!IsNull(this.Min)) {
            result.push({ Type: "Date", Field: me.Field, Operator: ">=", Values: [Format("{0}", me.Min)] });
        }
        if (!IsNull(this.Max)) {
            result.push({ Type: "Date", Field: me.Field, Operator: "<=", Values: [Format("{0}", me.Max)] });
        }
        return result;
    }
}
function GetFilters(obj, meta) {
    var results = [];
    for (var x in obj) {
        var item = obj[x];
        var properties = GetProperties(item);
        var type = item.Type;
        var filter = new StringFilter();
        if (type == "date") {
            filter = new DateFilter();
        }
        if (type == "number") {
            filter = new NumberFilter();
        }
        properties.forEach(function (property) {
            var keystr = property.Key.toString();
            var lastdotix = keystr.lastIndexOf(".");
            if (lastdotix > -1) {
                var fieldname = keystr.substring(0, lastdotix);
                var propertyname = keystr.substring(lastdotix + 1);
                //var keys = property.Key.toString().split(".");
                filter.Field = fieldname;
                filter[propertyname] = property.Value;
            }
            else {
                filter[keystr] = property.Value;
            }
        });
        results.push(filter);
    }
    ;
    return results;
}
class ClientQuery {
    constructor() {
        this.Fields = [];
        this.Filters = [];
        this.Ordering = {};
        this.Parameters = {};
        this.Distinct = false;
    }
    SetFields(fields) {
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            this.SetField(field);
        }
    }
    SetField(field) {
        var existing = this.Fields.FirstOrDefault(i => i.Name == field);
        if (existing == null) {
            this.Fields.push({ "Name": field });
        }
    }
    SetFilters(filters) {
        for (var i = 0; i < filters.length; i++) {
            var filter = filters[i];
            this.SetFilter(filter);
        }
    }
    SetFilter(filter) {
        if (!IsNull(filter)) {
            var existing = this.Filters.FirstOrDefault(i => i.Field == filter.Field && i.Source == filter.Source);
            var ix = this.Filters.indexOf(existing);
            if (ix > -1) {
                this.Filters[ix] = filter;
            }
            else {
                this.Filters.push(filter);
            }
        }
    }
    static New(obj) {
        var r = new ClientQuery();
        for (var key in obj) {
            r[key] = obj[key];
        }
        return r;
    }
    static CreateFrom(query) {
        var qv = new QueryView();
        var copyobj = JsonCopy(query);
        for (var key in copyobj) {
            qv[key] = copyobj[key];
        }
        return qv;
    }
    static CreateDetails(queryname, id) {
        var query = new ClientQuery();
        query.SetField("*");
        query.QueryName = queryname;
        query.SetFilter({
            "Type": "number",
            "Field": "Id",
            "Operator": "=",
            "Values": [id]
        });
        query.Take = 1;
        query.Skip = 0;
        query.GetCount = false;
        return query;
    }
    static CreateList(queryname, fields = ["*"]) {
        var query = new ClientQuery();
        query.SetFields(fields);
        query.QueryName = queryname;
        query.Skip = 0;
        query.GetCount = false;
        return query;
    }
}
class QueryView extends ClientQuery {
    constructor() {
        super(...arguments);
        this.UIColumns = [];
    }
}
class FileData {
}
class List extends Array {
    constructor() {
        super(...arguments);
        this.OnChanged = function () { };
    }
    Add(item) {
        this.push(item);
        this.OnChanged("Add", item, this.length - 1);
    }
    Remove(item) {
        var ix = this.indexOf(item);
        if (ix > -1) {
            this.splice(ix, 1);
            this.OnChanged("Remove", item, ix);
        }
    }
    Clear() {
        this.splice(0, this.length);
        this.OnChanged("Clear");
    }
    AddRange(items) {
        var ix = this.length;
        this.push.apply(this, items);
        this.OnChanged("AddRange", items, ix);
    }
    static From(items) {
        var list = new List();
        items.push.apply(list, items);
        return list;
    }
}
class ValidationRuleResult {
    constructor(result) {
        this.OK = true;
        if (!IsNull(result)) {
            this.OK = result;
        }
    }
}
class ValidationRule {
    constructor() {
        this.Trigger = [];
    }
}
class Formula {
    constructor() {
        this.Trigger = [];
    }
}
class Task {
    constructor() {
        this.Id = "";
        this.Started = null;
        this.Finished = null;
    }
}
class TaskExecutor {
    constructor(threadnr = 1) {
        this.threadnr = 1;
        this.Id = "";
        this.Tasks = [];
        var me = this;
        me.threadnr = threadnr;
    }
    OnCompleted() {
        console.log("TaskExecutor " + this.Id + "Finished!");
    }
    TaskFinished(task) {
        task.Finished = new Date();
        var diff = task.Finished.getTime() - task.Started.getTime();
        console.log("TaskFinished (" + task.Id + ") in " + diff);
        var me = this;
        var nexttask = null;
        var isallcompleted = true;
        for (var i = 0; i < me.Tasks.length; i++) {
            var ctask = me.Tasks[i];
            if (!ctask.Finished) {
                isallcompleted = false;
                break;
            }
        }
        me.StartATask();
        if (isallcompleted) {
            me.OnCompleted();
        }
    }
    Start() {
        var me = this;
        var startnr = Math.min(me.threadnr, me.Tasks.length);
        for (var i = 0; i < startnr; i++) {
            me.StartATask();
        }
    }
    GetNextTask() {
        var me = this;
        var task = me.Tasks.FirstOrDefault(i => IsNull(i.Started));
        if (task != null) {
            return task;
        }
        return null;
    }
    StartATask() {
        var me = this;
        var task = me.GetNextTask();
        if (task != null) {
            task.Started = new Date();
            console.log("StartTask (" + task.Id + ")");
            task.Function(task, me.TaskFinished);
        }
    }
}
class FileObject {
}
class Obsv {
    constructor(...params) {
        if (!IsNull(params) && params.length > 0) {
            var obj = params[0];
            //return new Proxy(obj,)
        }
    }
}
class IDB {
    constructor(dbname, sdstorenames) {
        this.storenames = [];
        this.storenames = sdstorenames;
        this.dbname = dbname;
    }
    IsAvailable() {
        if (window.indexedDB) {
            return true;
        }
        return false;
    }
    Connect(dbname, callback) {
        var me = this;
        me.dbname = dbname;
        if (me.IsAvailable()) {
            var request = indexedDB.open(dbname, 8);
            request.onerror = function (event) {
                console.log("Error: ");
                callback({ error: "Error" });
            };
            //OnSuccess Handler
            request.onsuccess = function (event) {
                console.log("Success: ");
                me.db = event.target.result;
                callback({});
            };
            //OnUpgradeNeeded Handler
            request.onupgradeneeded = function (event) {
                console.log("On Upgrade Needed");
                me.db = event.target.result;
                // Create an objectStore for this database
                //Provide the ObjectStore name and provide the keyPath which acts as a primary key
                for (var i = 0; i < me.storenames.length; i++) {
                    var storename = me.storenames[i];
                    if (!me.db.objectStoreNames.contains(storename)) {
                        me.db.createObjectStore(storename, { keyPath: 'id', autoIncrement: true });
                    }
                }
            };
        }
        else {
            callback({ error: "indexedDB not available" });
        }
    }
    GetStore(store_name, mode) {
        var me = this;
        var tx = me.db.transaction(store_name, mode);
        return tx.objectStore(store_name);
    }
    Save(obj, storename, callback) {
        var me = this;
        var save = function () {
            if (!me.db.objectStoreNames.contains(storename)) {
                me.db.createObjectStore(storename);
            }
            var store = me.GetStore(storename, 'readwrite');
            var req;
            try {
                req = store.add(obj);
            }
            catch (e) {
                throw e;
            }
            req.onsuccess = function (evt) {
                callback({});
                console.log("Insertion in DB successful");
            };
            req.onerror = function () {
                callback({ error: "error" });
                console.error("Insertion in DB Failed ", this.error);
            };
        };
        if (IsNull(this.db)) {
            this.Connect(me.dbname, save);
        }
        else {
            save();
        }
    }
    GetData(storename, callback, filter = null) {
        var me = this;
        var get = function () {
            var objectStore = me.GetStore(storename, 'readwrite');
            var result = [];
            //Open the Cursor on the ObjectStore
            objectStore.openCursor().onsuccess = function (event) {
                var cursor = event.target.result;
                //If there is a next item, add it to the array
                if (cursor) {
                    if (filter == null || filter(cursor.value)) {
                        result.push(cursor.value);
                    }
                    //alert(cursor.value)
                    cursor.continue();
                }
                //else get an alert informing you that it is done
                else {
                    console.log("IDB Get done:");
                    callback(result);
                }
            };
        };
        if (IsNull(this.db)) {
            me.Connect(me.dbname, get);
        }
        else {
            get();
        }
    }
    ClearStore(storename, callback) {
        var store = this.GetStore(storename, 'readwrite');
        //Clear the ObjectStore
        var req = store.clear();
        //Success Handler
        req.onsuccess = function (event) {
            callback({});
            console.log("clear successful");
        };
        //Error Handler
        req.onerror = function (event) {
            callback({ error: "Error" });
            console.log("error clearing store");
        };
    }
}
class ModelFeatures {
    constructor() {
        this.Views = [];
        this.ListActions = [];
        this.ListColumns = [];
        this.ListFilters = [];
        this.UIFilters = [];
    }
    get DataColumns() {
        return this.ListColumns.Where(i => i.indexOf("UI:") == -1).Select(i => {
            var ix = i.indexOf(":");
            if (ix == -1) {
                return i;
            }
            else {
                return i.substring(ix + 1);
            }
        });
    }
    get UIColumns() {
        return this.ListColumns.Where(i => i.indexOf("D:") == -1).Select(i => {
            var ix = i.indexOf(":");
            if (ix == -1) {
                return i;
            }
            else {
                return i.substring(ix + 1);
            }
        });
    }
}
class DataLookup {
    constructor() {
        this.LookUpFields = [];
        this.ValueField = "";
        this.DisplayField = "";
    }
    Lookup(textinput, callback) {
        DataLookup.LookupFunction(textinput, this.QueryName, this.LookUpFields, this.ValueField, this.DisplayField, callback);
    }
}
DataLookup.LookupFunction = (textinput, queryname, lookupfields, valuefieldname, displayfieldname, callback) => { };
class TaskAction {
    constructor() {
        this.Tasks = [];
        this.ActiveTasksNr = 0;
        this.OnCompleted = () => { };
    }
}
class Waiter {
    constructor() {
        this.Waiters = {};
    }
    SetWaiter(waiterid, oncompleted) {
        var me = this;
        var a = new TaskAction();
        a.OnCompleted = oncompleted;
        a.ActiveTasksNr = 0;
        me.Waiters[waiterid] = a;
    }
    StartTask(waiterid, task) {
        var me = this;
        //Log("UI", "StartTask: " + task);
        var taskaction = me.Waiters[waiterid];
        taskaction.ActiveTasksNr++;
        if (taskaction.Tasks.indexOf(task) == -1) {
            taskaction.Tasks.push(task);
        }
    }
    SetTasks(waiterid, tasks) {
        var me = this;
        var taskaction = me.Waiters[waiterid];
        for (var i = 0; i < tasks.length; i++) {
            var task = tasks[i];
            taskaction.ActiveTasksNr++;
            if (taskaction.Tasks.indexOf(task) == -1) {
                taskaction.Tasks.push(task);
            }
        }
    }
    EndTask(waiterid, task) {
        var me = this;
        var waiter = me.Waiters[waiterid];
        waiter.ActiveTasksNr--;
        var taskix = waiter.Tasks.indexOf(task);
        waiter.Tasks[taskix] = "";
        //Log("UI", "EndTask: " + task);
        var finished = waiter.ActiveTasksNr == 0;
        finished = waiter.Tasks.join('').trim().length == 0;
        if (finished) {
            waiter.Tasks = [];
            Log("UI", "Waiter " + waiterid + " completed.");
            waiter.OnCompleted();
        }
    }
}
var OdataQueryOptions;
(function (OdataQueryOptions) {
    class Operators {
    }
    Operators.Dictionary = {
        "eq": null,
        "ne": null,
        "gt": null,
        "ge": null,
        "lt": null,
        "le": null,
        "and": null,
        "or": null,
        "not": null,
        "add": null,
        "sub": null,
        "mul": null,
        "div": null,
        "mod": null
    };
    OdataQueryOptions.Operators = Operators;
    class Functions {
    }
    Functions.Dictionary = {
        "endswith": null,
        "startswith": null,
        "substringof": null,
        "indexof": null,
        "replace": null,
        "substring": null,
        "tolower": null,
        "toupper": null,
        "trim": null,
        "concat": null,
        "round": null,
        "floor": null,
        "div": null,
        "ceiling": null,
        "day": null,
        "hour": null,
        "minute": null,
        "month": null,
        "second": null,
        "year": null
    };
    OdataQueryOptions.Functions = Functions;
    class E {
    }
    OdataQueryOptions.E = E;
    class E_Reference extends E {
    }
    OdataQueryOptions.E_Reference = E_Reference;
    class E_Value extends E {
    }
    OdataQueryOptions.E_Value = E_Value;
    class E_Operator extends E {
    }
    OdataQueryOptions.E_Operator = E_Operator;
    class E_Function extends E {
    }
    OdataQueryOptions.E_Function = E_Function;
    class Query extends E {
        constructor() {
            super(...arguments);
            this.Select = new Select();
        }
    }
    OdataQueryOptions.Query = Query;
    class Filter extends E {
        constructor() {
            super(...arguments);
            this.Items = [];
        }
    }
    OdataQueryOptions.Filter = Filter;
    class Expand {
    }
    OdataQueryOptions.Expand = Expand;
    class Select {
        constructor() {
            this.Fields = ["*"];
        }
    }
    OdataQueryOptions.Select = Select;
    class OrderBy {
    }
    OdataQueryOptions.OrderBy = OrderBy;
    class Top {
    }
    OdataQueryOptions.Top = Top;
    class Skip {
    }
    OdataQueryOptions.Skip = Skip;
    class Count {
    }
    OdataQueryOptions.Count = Count;
})(OdataQueryOptions || (OdataQueryOptions = {}));
class Odataparser {
    Parse(item) {
        var me = this;
        var parts = Split(item, "&", true);
        var gparser = new GlyphParser();
        var gmain = new Glyph();
        parts.forEach(p => {
            gmain.AddChild(p);
        });
        console.log("Glyph", gmain);
        var qry = new OdataQueryOptions.Query();
        gmain.Children.forEach(g => {
            var eix = g.Value.indexOf("=");
            var key = g.Value.substring(1, eix);
            var value = g.Value.substring(eix + 1);
            switch (key) {
                case "select":
                    qry.Select = { raw: value, Fields: [] };
                    break;
                case "filter":
                    qry.Filter = { raw: value, filters: me.GetClientFilters(value) };
                    break;
                case "expand":
                    qry.Expand = { raw: value };
                    break;
                case "orderby":
                    qry.OrderBy = { raw: value };
                    break;
                case "count":
                    qry.Count = { va: value };
                    break;
                case "top":
                    qry.Select = { raw: value };
                    break;
                case "skip":
                    qry.Select = { raw: value };
                    break;
            }
        });
    }
    GetClientFilters(value) {
        var filters = [];
        var ls = GetStringWithLiterals(value, "'");
        var gp = new GlyphParser();
        var g = gp.Parse(ls.aliasedtext);
        Glyph.ForAll(g, (gl, p) => {
            if (gl instanceof SimpleGlyph) {
                var parts = Split(gl.Value, [" ", ","], true);
                var gparsed = new Glyph();
                for (var i = 0; i < parts.length; i++) {
                    var part = parts[i].trim();
                    var sg = new SimpleGlyph();
                    sg.Value = part;
                    if (part in OdataQueryOptions.Functions.Dictionary) {
                        sg.Tag = Odataparser.GlyphTags.Function;
                        gparsed.AddChildGlyph(sg);
                        continue;
                    }
                    if (part in OdataQueryOptions.Operators.Dictionary) {
                        sg.Tag = Odataparser.GlyphTags.Operator;
                        gparsed.AddChildGlyph(sg);
                        continue;
                    }
                    if (part.startsWith("'") && part.endsWith("'")) {
                        sg.Tag = Odataparser.GlyphTags.SValue;
                        gparsed.AddChildGlyph(sg);
                        continue;
                    }
                    if (part.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/) != null) {
                        sg.Tag = Odataparser.GlyphTags.Variable;
                        gparsed.AddChildGlyph(sg);
                        continue;
                    }
                    if (part.indexOf("-") > -1) {
                        sg.Tag = Odataparser.GlyphTags.TValue;
                        gparsed.AddChildGlyph(sg);
                        continue;
                    }
                    if (part.indexOf(".") > -1) {
                        sg.Tag = Odataparser.GlyphTags.DValue;
                        gparsed.AddChildGlyph(sg);
                        continue;
                    }
                    sg.Tag = Odataparser.GlyphTags.IValue;
                    gparsed.AddChildGlyph(sg);
                }
                gl.Slot = gparsed;
            }
        });
        console.log("FG", g);
        return filters;
    }
    BuildQuery(g, q) {
        var result = {};
        return result;
    }
    static test() {
        var q = "$select=Rating,ReleaseDate&$expand=Products($orderby=ReleaseDate asc, Rating desc $count=true)&$filter=(FirstName ne 'Mary' or LastName eq 'White') and UserName eq 'marywhite'&$top=10&$skip=10";
        this.testquery(q);
    }
    static testquery(q) {
        var parser = new Odataparser();
        var qry = parser.Parse(q);
        console.log("Query", qry);
    }
}
Odataparser.GlyphTags = {
    Function: "Function",
    Operator: "Operator",
    Variable: "Variable",
    DValue: "DValue",
    TValue: "TValue",
    IValue: "IValue",
    SValue: "SValue"
};
class Glyph {
    constructor() {
        this.Children = [];
    }
    AddChild(item) {
        var g = new SimpleGlyph();
        g.Value = item;
        this.Children.push(g);
    }
    AddChildGlyph(item) {
        this.Children.push(item);
    }
    static GetString(instance, start = "(", end = ")", level = 0) {
        var sb = [];
        if (!IsNull(instance.Value) || instance instanceof (SimpleGlyph)) {
            return Format("{0}", instance.Value);
        }
        else {
            sb.push(level != 0 ? start : "");
            for (var i = 0; i < instance.Children.length; i++) {
                var child = instance.Children[i];
                sb.push(Glyph.GetString(child, start, end, level + 1));
            }
            sb.push(level != 0 ? end : "");
        }
        return sb.join('');
    }
    static All(instance, level = 0) {
        var result = [];
        for (var i = 0; i < instance.Children.length; i++) {
            var child = instance.Children[i];
            child.Level = level;
            result.push(child);
            result = result.concat(Glyph.All(child, level + 1));
        }
        return result;
    }
    static ForAll(instance, action, parent = null, level = 0) {
        action(instance, parent);
        for (var i = 0; i < instance.Children.length; i++) {
            var child = instance.Children[i];
            Glyph.ForAll(child, action, instance, level + 1);
        }
    }
}
class SimpleGlyph extends Glyph {
}
class GroupGlyph extends Glyph {
}
class Reference {
}
class GlyphParser {
    constructor(startstr = "(", endstr = ")") {
        this.startstr = "(";
        this.endstr = ")";
        this.startstr = startstr;
        this.endstr = endstr;
    }
    Parse(expression) {
        var s = expression;
        var refcontainer = { value: s };
        return this._Parse(refcontainer);
    }
    _Parse(expr, level = 0) {
        var me = this;
        var startstr = me.startstr;
        var endstr = me.endstr;
        var result = new Glyph();
        var cx = 0;
        var ixs = -1;
        var ixe = -1;
        var ix = -1;
        do {
            ixs = expr.value.indexOf(startstr);
            ixe = expr.value.indexOf(endstr);
            ix = ixs == -1 ? ixe : (ixe == -1 ? ixs : Math.min(ixs, ixe));
            if (ix > 0) {
                var spart = expr.value.substring(0, ix);
                result.AddChild(spart);
                expr.value = expr.value.substring(ix);
            }
            if (ix == 0) {
                if (expr.value.startsWith(startstr)) {
                    expr.value = expr.value.substring(startstr.length);
                    result.AddChildGlyph(this._Parse(expr, level + 1));
                }
                if (expr.value.startsWith(endstr)) {
                    expr.value = expr.value.substring(endstr.length);
                    return result;
                }
            }
        } while (ix > -1);
        if (expr.value.length > 0) {
            result.AddChild(expr.value);
            expr.value = "";
        }
        return result;
    }
    static Test() {
        var expr = "asdfsa(ssd(dfgfd((ffff))fdsf(fff))fd(dsgdg)())asfsf";
        console.log("Expr", expr);
        var parser = new GlyphParser();
        var g = parser.Parse(expr);
        console.log("PExpr", Glyph.GetString(g));
    }
}
class RPart {
    Copy() {
        var result = new RPart();
        result.Value = this.Value;
        return result;
    }
}
class RCodePart extends RPart {
    constructor(value) {
        super();
        this.Value = value;
    }
    Copy() {
        var result = new RCodePart();
        result.Value = this.Value;
        return result;
    }
}
class RUIPart extends RPart {
    Copy() {
        var result = new RUIPart();
        result.Value = this.Value;
        return result;
    }
}
class RMixPart extends RPart {
}
class RImplicitpart extends RPart {
    Copy() {
        var result = new RImplicitpart();
        result.Value = this.Value;
        return result;
    }
}
class RExplicitpart extends RPart {
    Copy() {
        var result = new RExplicitpart();
        result.Value = this.Value;
        return result;
    }
}
class RazorMarkupParser {
    constructor() {
        this.CSwitch = "@";
        this.USwitch = "<";
        this.Inline_Start = "(";
        this.Inline_End = ")";
        this.Block_Start = "{";
        this.Block_End = "}";
        this.KeyWords = ["foreach", "while", "switch", "do", "for", "try", "catch", "finally", "if", "else", "else if"];
    }
    Parse(body) {
        var me = this;
        var lines = body.split("\n");
        let linetype = 0;
        var result = [];
        var bag = [];
        var glyphparser = new GlyphParser();
        var gather = (item) => {
            var part = null;
            if (linetype == 1) {
                part = new RCodePart();
                part.Value = item;
            }
            if (linetype == 0) {
                part = new RUIPart();
                part.Value = item;
            }
            if (linetype == 2) {
                part = new RMixPart();
                part.Value = item;
            }
            bag.push(part);
        };
        var isuiline = (item, previouslinetype) => {
            if (item.indexOf(me.CSwitch) > -1) {
                return false;
            }
            return true;
        };
        var iscodeline = (item, previouslinetype) => {
            if (item.indexOf(me.CSwitch) > -1) {
                //has @ this means it is mixed
                return false;
            }
            if (item.indexOf(me.USwitch) == 0) {
                //doesnt starts with <
                return false;
            }
            if (item.indexOf(me.USwitch) > 0) {
                //has <, but needs to checked if it is not within code
                var g = glyphparser.Parse(trimmedline);
                var items = Glyph.All(g);
                var xitem = items.FirstOrDefault(i => i.Level == 0
                    && i.Children.length == 0
                    && (Coalesce(i.Value, "").indexOf(me.USwitch)));
                if (xitem != null) {
                    return false;
                }
            }
            if (item.indexOf(me.Block_Start) == 0 || item.indexOf(me.Block_End) == 0) {
                return true;
            }
            if (item.indexOf(me.Inline_Start) == 0 || item.indexOf(me.Inline_End) == 0) {
                return true;
            }
            for (var i = 0; i < me.KeyWords.length; i++) {
                if (item.indexOf(me.KeyWords[i]) == 0) {
                    return true;
                }
            }
            return false;
        };
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            linetype = 2;
            var trimmedline = line.trim();
            if (iscodeline(trimmedline)) {
                linetype = 1;
            }
            if (linetype != 1 && isuiline(trimmedline)) {
                linetype = 0;
            }
            gather(line);
        }
        for (var i = 0; i < bag.length; i++) {
            var part = bag[i];
            if (part instanceof RMixPart) {
                var trimmedpart = part.Value.trim();
                if (trimmedpart.startsWith(me.CSwitch)) {
                    var partafterswitch = trimmedpart.substring(1);
                    if (me.StartsWithKeyWord(partafterswitch)) {
                        var cp = new RCodePart();
                        cp.Value = partafterswitch; // Replace( part.Value,"@","");
                        bag[i] = cp;
                        continue;
                    }
                }
                var items = me.HandleExppressions(part.Value);
                var sitems = me.Simplify(items);
                if (sitems.length > 0) {
                    bag[i] = sitems;
                }
            }
        }
        //console.log("Bag", bag);
        return bag;
    }
    Simplify(items) {
        var result = [];
        if (items.length > 0) {
            var cpart = items[0].Copy();
            for (var i = 1; i < items.length; i++) {
                var part = items[i];
                if (cpart.constructor.name == part.constructor.name) {
                    cpart.Value = cpart.Value + part.Value;
                }
                else {
                    result.push(cpart);
                    cpart = part.Copy();
                }
            }
            result.push(cpart);
        }
        return result;
    }
    HandleExppressions(item) {
        var me = this;
        var glyphparser = new GlyphParser();
        var expr = glyphparser.Parse(item);
        Glyph.ForAll(expr, (item, parentitem) => {
            if (parentitem != null && IsArray(item.Children)) {
                var ix = parentitem.Children.indexOf(item);
                if (ix > 0) {
                    var prec = parentitem.Children[ix - 1];
                    var newg = new SimpleGlyph();
                    if (prec.Value.endsWith(me.CSwitch)) {
                        prec.Value = prec.Value.substring(0, prec.Value.length - 1);
                        newg.Tag = "Explicit";
                        newg.Value = Glyph.GetString(item, me.Inline_Start, me.Inline_End, 0);
                        //console.log(expr);
                    }
                    else {
                        newg.Value = Glyph.GetString(item, me.Inline_Start, me.Inline_End, 1);
                    }
                    parentitem.Children[ix] = newg;
                }
            }
        });
        Glyph.ForAll(expr, (item, parentitem) => {
            if (!IsNull(item.Value) && item.Value.indexOf(me.CSwitch) > -1) {
                var rsimpleregex = /@[a-zA-Z0-9_.]+/g;
                var matches = FirstNotNull(item.Value.match(rsimpleregex), []);
                if (matches.length > 0) {
                    var gg = new GroupGlyph();
                    var items = item.Value.split(rsimpleregex);
                    gg.AddChild(items[0]);
                    for (var i = 0; i < matches.length; i++) {
                        let match = matches[i];
                        var g = new Glyph();
                        g.Value = match.substring(1);
                        g.Tag = "Implicit";
                        gg.AddChildGlyph(g);
                        gg.AddChild(items[i + 1]);
                    }
                    if (parentitem != null) {
                        var ix = parentitem.Children.indexOf(item);
                        parentitem.Children[ix] = gg;
                    }
                    //console.log("changes", parentitem);
                }
            }
        });
        var result = [];
        var fadd = (g) => {
            var part = null;
            if (g.Tag == "Implicit") {
                part = new RImplicitpart();
            }
            if (g.Tag == "Explicit") {
                part = new RExplicitpart();
            }
            if (IsNull(g.Tag)) {
                part = new RUIPart();
            }
            part.Value = g.Value;
            result.push(part);
        };
        for (var i = 0; i < expr.Children.length; i++) {
            let current = expr.Children[i];
            if (current instanceof GroupGlyph) {
                for (var gi = 0; gi < current.Children.length; gi++) {
                    var gitem = current.Children[gi];
                    fadd(gitem);
                }
            }
            else {
                fadd(current);
            }
        }
        return result;
    }
    StartsWithKeyWord(item) {
        var me = this;
        var cswitchedkeywords = me.KeyWords.Select(i => me.CSwitch + i);
        var allkeywords = me.KeyWords.concat(cswitchedkeywords);
        for (var i = 0; i < allkeywords.length; i++) {
            if (item.indexOf(allkeywords[i]) == 0) {
                return true;
            }
        }
        return false;
    }
    static Test() {
        var lines = [
            "<div class=\"reservations\">",
            "    <div class=\"Save\" onchange=\"view(this).OnChange(event)\">",
            "        <div class=\"field\">",
            "            <label>Id</label>",
            "            <input class=\"value\" bind=\"Id\" type=\"text\" disabled value=\"@context.CurrentReservation.Id\" />",
            "        </div>",
            "        <div class=\"field\">",
            "            <label>Apartment</label>",
            "            <app-autocomplete class=\"autocomplete value apartmentid\"",
            "                              datafunction=\"view(this).DF_Apartments\"",
            "                              valuefield=\"Id\"",
            "                              displayfield=\"Name\"",
            "                              minlengthtosearch=\"1\"",
            "                              value=\"@context.CurrentReservation.ApartmentId\"",
            "                              label=\"@context.CurrentReservation.Apartment.Name\"",
            "                              bind=\"ApartmentId\">",
            "            </app-autocomplete>",
            "        </div>",
            "        <div class=\"field\">",
            "            <label>Start</label>",
            "            <div class=\"value\">",
            "                <input type=\"date\" bind=\"StartDate\" value=\"@context.CurrentReservation.StartDate\" />",
            "            </div>",
            "        </div>",
            "        <div class=\"field\">",
            "            <label>Days</label>",
            "            <div class=\"value\">",
            "                <input type=\"number\" bind=\"_NrofDays\" min=\"1\" value=\"@context.CurrentReservation._NrofDays\"  />",
            "            </div>",
            "        </div>",
            "        <div class=\"field\">",
            "            <label>Code</label>",
            "            <div class=\"value\">",
            "                <input type=\"text\" bind=\"Code\" disabled value=\"@context.CurrentReservation.Code\"  />",
            "                <span class=\"button\" onclick=\"view(this).SetCode()\">G</span>",
            "            </div>",
            "        </div>",
            "        <div>",
            "            <button onclick=\"view(this).Save()\" class=\"Save\">@(Res(\"Save\"))</button>",
            "            <button onclick=\"view(this).New()\" class=\"New\">@(Res(\"New\"))</button>",
            "",
            "        </div>",
            "",
            "    </div>",
            "    <table class=\"model\" onclick=\"view(this).SelectReservation(event)\">",
            "        <thead>",
            "            <tr>",
            "                <th></th>",
            "                <th>Apartment</th>",
            "                <th>StartDate</th>",
            "                <th>EndDate</th>",
            "                <th>Code</th>",
            "            </tr>",
            "        </thead>",
            "        <tbody>",
            "",
            "            @foreach (var reservation in model){",
            "            <tr datakey=\"@reservation.Id\">",
            "                <td><span class=\"button i-f-Cancel\" onclick=\"view(this).Delete(event)\"></span></td>",
            "                <td>@reservation.Apartment.Name</td>",
            "                <td>@reservation.StartDate</td>",
            "                <td>@reservation.EndDate</td>",
            "                <td>@reservation.Code</td>",
            "",
            "            </tr>",
            "            }",
            "        </tbody>",
            "    </table>",
            "    <div class=\"pager\"></div>",
            "",
            "</div>"
        ];
        var rmp = new RazorMarkupParser();
        rmp.HandleExppressions("            <button onclick=\"view(this).Save()\" class=\"Save\">@(Res(\"Save\")) @model.Id dgdg @model.Name -- @model.Id</button> @(XF(\"GH\"))");
        rmp.Parse(lines.join("\n"));
    }
}
const keyattribute = "datakey";
class BindOptions {
    constructor() {
        this.targetelement = null;
        this.targeselector = "";
        this.excludedelements = [];
        this.excludedselectors = [];
        this.map = true;
        this.extension = "razor";
        this.keeporderontarget = false;
    }
}
class RazorSyntax {
}
RazorSyntax.BlockStart = "{";
RazorSyntax.BlockEnd = "}";
RazorSyntax.InlineBlockStart = "(";
RazorSyntax.InlineBlockEnd = ")";
RazorSyntax.RazorSwitch = "@";
RazorSyntax.Foreach = "foreach";
RazorSyntax.For = "for";
RazorSyntax.If = "if";
RazorSyntax.Else = "else";
RazorSyntax.ElseIf = "else if";
RazorSyntax.Template = "template";
class EncloseInfo {
    constructor() {
        this.enclosed = false;
        this.prefix_start = -1;
        this.enclose_start = -1;
        this.enclose_end = -1;
        this.content_start = -1;
        this.content_end = -1;
    }
    get SplitStart() {
        return this.prefix_start < -1 ? this.enclose_start : this.prefix_start;
    }
    get SplitEnd() {
        return this.enclose_end;
    }
    SetBackTo(ix) {
        var difference = this.enclose_end - ix;
        this.enclose_end = this.enclose_end - difference;
        this.content_end = this.content_end - difference;
    }
    GetEnclosed(content) {
        return content.substring(this.content_start, this.content_end);
    }
    GetPrefix(content) {
        return content.substring(this.prefix_start, this.enclose_start);
    }
    static GetEncloseInfo(content, start, end) {
        var result = [];
        var startcount = 0;
        var endcount = 0;
        var info = new EncloseInfo();
        var s_ix = content.indexOf(start);
        var e_ix = content.indexOf(end);
        var ix = 0;
        while (s_ix > -1 || e_ix > -1) {
            s_ix = content.indexOf(start, ix);
            e_ix = content.indexOf(end, ix);
            if (s_ix < e_ix && s_ix > -1) {
                ix = s_ix + start.length;
                startcount++;
            }
            if ((s_ix > e_ix || s_ix == -1) && e_ix > -1) {
                ix = e_ix + end.length;
                endcount++;
            }
            if (startcount - endcount == 1 && info.enclose_start == -1) {
                info.enclose_start = s_ix;
                info.content_start = s_ix + start.length;
            }
            if (endcount == startcount && info.enclose_start != -1) {
                info.content_end = e_ix;
                info.enclose_end = e_ix + end.length;
                result.push(info);
                info = new EncloseInfo();
            }
        }
        return result;
    }
    static FixEncloseByPrefix(source) {
        var current = source.FirstOrDefault();
        while (current != null) {
            var previous = GetPrevious(source, current);
            if (current.prefix_start > -1) {
                previous.SetBackTo(current.prefix_start);
            }
            current = GetNext(source, current);
        }
    }
    static Test() {
        var content = "abc @(sdg(sdfg)sg)(a) saf ()sada@((as)sdf) sd (fgdf(as))asd";
        console.log(content);
        console.log(EncloseInfo.GetEncloseInfo(content, "(", ")"));
    }
}
class partinterval {
    constructor(start, end) {
        this.start = -1;
        this.end = -1;
        if (!IsNull(start)) {
            this.start = start;
        }
        if (!IsNull(end)) {
            this.end = end;
        }
    }
}
class enclosedpart extends partinterval {
    constructor(start = null, end = null, enclose_start = null, enclose_end = null, pre = null, pre_start = null) {
        super(start, end);
        this.pre = "";
        this.pre_start = -1;
        this.enclose_start = -1;
        this.enclose_end = -1;
        if (!IsNull(enclose_start)) {
            this.enclose_start = enclose_start;
        }
        if (!IsNull(enclose_end)) {
            this.enclose_end = enclose_end;
        }
        if (!IsNull(pre)) {
            this.pre = pre;
        }
        if (!IsNull(pre_start)) {
            this.pre_start = pre_start;
        }
        else {
            this.pre_start = enclose_start;
        }
    }
}
class encloseditem {
    constructor() {
        this.prekey = "";
        this.pre = "";
        this.content = "";
        this.parent = null;
        this.children = [];
    }
}
class Code {
    constructor(value = "") {
        this.TypeName = "Code";
        this.Value = "";
        this.Value = value;
    }
    static Create(value) {
        return new Code(value);
    }
}
class InlineCode extends Code {
    constructor(value = "") {
        super(value);
        this.TypeName = "InlineCode";
    }
    static Create(value) {
        return new InlineCode(value);
    }
}
class SyntaxTreeNode {
    constructor() {
        this.Value = "";
        this.Children = [];
        this.TypeName = "SyntaxTreeNode";
        this.Name = "";
        this.Source = "";
    }
    GetStringValue() {
        return this.Value;
    }
    AddChild(node) {
        var z = 1;
        if (node.Value.trim().length > 0
            || node.Children.length > 0
            || z == 1) {
            node.Parent = this;
            this.Children.push(node);
        }
        else {
            console.log(node);
        }
    }
    AddChildren(nodes, startix = -1) {
        if (startix == -1) {
            this.Children = this.Children.concat(nodes);
        }
        else {
            this.Children.splice.apply(this.Children, [startix, 0].concat(nodes));
        }
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].Parent = this;
        }
    }
    SetChildrenAt(ix, node) {
        if (ix > -1 && ix < this.Children.length) {
            if (node.Value.trim().length > 0 || node.Children.length > 0) {
                this.Children[ix].Parent = null;
                this.Children[ix] = node;
                node.Parent = this;
            }
            else {
                console.log(node);
            }
        }
        else {
            throw "Index out of range " + ix + " ";
        }
    }
    GetString(span = "") {
        var result = this.GetStringValue() + "\n";
        this.Children.forEach(function (child) {
            result = result + child.GetString(span + "   ");
        });
        return result;
    }
    GetItems(span = "") {
        var result = [];
        if (this.Value.trim().length > 0) {
            result.push(span + this.Value);
        }
        this.Children.forEach(function (child) {
            result = result.concat(child.GetItems(span));
        });
        return result;
    }
    static Create(content) {
        var n = new SyntaxTreeNode();
        n.Value = content;
        return n;
    }
}
class BlockNode extends SyntaxTreeNode {
    constructor() {
        super();
        this.TypeName = "BlockNode";
    }
    static CreateFrom(nodes = []) {
        var result = null;
        if (nodes.length > 1) {
            var n1 = nodes[0];
            var n2 = nodes[1];
            if (n1.Value.endsWith(RazorSyntax.RazorSwitch + RazorSyntax.BlockStart)) {
                result = new BlockNode();
                result.Value = n2.Value;
                n1.Value = n1.Value.substring(0, n1.Value.length - 2);
            }
        }
        return result;
    }
    GetItems(span = "") {
        var result = [];
        var tvalue = this.Value.trim();
        if (tvalue.length > 0) {
            result.push(new Code(this.Value));
        }
        this.Children.forEach(function (child) {
            result = result.concat(child.GetItems(span + "   "));
        });
        return result;
    }
    static Create(content) {
        var n = new BlockNode();
        n.Value = content;
        return n;
    }
}
class ImplicitNode extends SyntaxTreeNode {
    constructor() {
        super(...arguments);
        this.TypeName = "ImplicitNode";
    }
    GetItems(span = "") {
        var result = [];
        var code = this.Value;
        //result.push(new InlineCode("try{"+code+"}"));
        result.push(new InlineCode(code));
        return result;
    }
    static Create(content) {
        var n = new ImplicitNode();
        n.Value = content;
        return n;
    }
}
class Razor {
    constructor() {
        this.MainStr = "@";
        this.Block_Start = "{";
        this.Block_End = "}";
        this.Inline_Start = "(";
        this.Inline_End = ")";
        this.loop_for = "for";
        this.loop_foreach = "foreach";
        this.switch = "switch";
        this.if = "if";
        this.else = "else";
    }
    Parse(razorstr) {
        var result = [];
        return result;
    }
    GetBetween(content, start, end, blocktype = "") {
        var result = new SyntaxTreeNode();
        result.Source = "GetBetween container";
        var startix = 0;
        var startcount = 0;
        var endcount = 0;
        var temptext = "";
        var bstart = startix;
        for (var i = startix; i < content.length; i++) {
            var c = content[i];
            var isstartend = false;
            if (c == start) {
                startcount++;
                isstartend = true;
                if (i - 1 != bstart && (startcount - endcount == 1)) {
                    var node = new SyntaxTreeNode();
                    node.Source = "GetBetween 1";
                    node.Value = content.substring(bstart, i + 1);
                    result.AddChild(node);
                    //result.Children.push(node);
                    //node.Parent = result;
                }
            }
            if (c == end) {
                endcount++;
                isstartend = true;
            }
            var isfirst = false;
            if (c == start && (startcount - endcount) == 1) {
                isfirst = true;
            }
            if (!isfirst &&
                startcount > endcount) {
                temptext = temptext + c;
            }
            if (endcount == startcount && temptext.length > 0) {
                var bnode = new BlockNode();
                bnode.Value = temptext;
                result.AddChild(bnode);
                //result.Children.push(bnode);
                //bnode.Parent = result;
                temptext = "";
                bstart = i;
            }
        }
        if (bstart < content.length - 1) {
            var node = new SyntaxTreeNode();
            node.Source = "GetBetween 2";
            node.Value = content.substring(bstart, i);
            result.AddChild(node);
            //node.Parent = result;
            //result.Children.push(node);
        }
        if (result.Children.length == 1) {
            result.Children[0].Parent = result.Parent;
            result = result.Children[0];
        }
        return result;
    }
    //public TestEnclose()
    //{
    //    var str = "asadfas@foreach (var item in model.Items){ \n<div>\n foreach (var item2 in item.Codes) { @{var z=\"1a2\"} @(IsNull(model.Stockno)? 'hidden':'') \n @z<div>@item2.Title</div>}</div>}";
    //    str = str + '\n@template("TX1"){\n';
    //    str = str + "\n   @if(model.X==12){ @model.ShortName }else if(model.X==13){@model.Name } else {<p>@model.X</p>}dfgh"
    //    str = str + "\n}\n";
    //    var model = {
    //        Name:"MName",
    //        ShortName:"ShName",
    //        X:13,
    //        Items: [
    //            {
    //                Codes: [
    //                    {Title:"I0 C1"},
    //                    { Title:"I0 C2"}
    //                ]
    //            },
    //            {
    //                Codes: [
    //                    { Title: "I1 C11" },
    //                    { Title: "I1 C12" },
    //                    { Title: "I1 C13" }
    //                ]
    //            }
    //        ]
    //        }
    //    console.log({content: str });
    //    var intervalinfo = Razor.GetPartIntervalInfo(str, "{", "}");
    //    console.log(intervalinfo);
    //    var encloseinfo = Razor.GetEncloseInfo(str, "{", "}", Razor.keywords);
    //    console.log(encloseinfo);
    //    var parts = Razor.GetEnclosedItems(str, "{", "}", Razor.keywords);
    //    console.log(parts);
    //    var ec = new encloseditem();
    //    ec.children = parts;
    //    console.log("Parsing")
    //    var sn = Razor.ParseX(ec);
    //    console.log(sn);
    //    Razor.SetExplicitNodes(sn);
    //    console.log(sn);
    //    Razor.SetInlineNodes(sn);
    //    console.log(sn);
    //    var items = sn.GetItems("   ");
    //    console.log(items);
    //    var rt = <RazorTemplate>Razor.ComplileX(items);
    //    console.log(rt);
    //    console.log(rt.Bind(model));
    //    for (var i = 0; i < parts.length; i++)
    //    {
    //    }
    //    //var fx=
    //} 
    static GetEncloseInfo(content, start, end, rstarts = [], pre = "") {
        var result = Razor.GetPartIntervalInfo(content, start, end, "");
        var enclosedresult = [];
        for (var i = 0; i < result.length; i++) {
            var partinterval = result[i];
            var refix = 0;
            var prestr = content.substring(0, partinterval.start);
            if (i > 0) {
                var previous = result[i - 1];
                prestr = content.substring(previous.end, partinterval.start);
                refix = previous.end;
            }
            if (rstarts.length > 0) {
                for (var j = 0; j < rstarts.length; j++) {
                    var rstart = rstarts[j];
                    var pre_value = null;
                    var pres_start = null;
                    var preix = prestr.indexOf(rstart);
                    if (preix > -1) {
                        pre_value = prestr.substring(preix);
                        pres_start = refix + preix;
                    }
                    if (!IsNull(pres_start)) {
                        var enclosedinfo = new enclosedpart(partinterval.start, partinterval.end, partinterval.start - start.length, partinterval.end + end.length, pre_value, pres_start);
                        enclosedresult.push(enclosedinfo);
                        break;
                    }
                }
            }
            else {
                if (!IsNull(pre)) {
                    var newresult = [];
                    //var rsix = partinterval.start - pre.length;
                    var rsix = partinterval.start - start.length - pre.length;
                    if (rsix > -1) {
                        var item = content.substr(rsix, pre.length);
                        if (item == pre) {
                            var prestart = partinterval.start - start.length - pre.length;
                            //newresult.push({ start: rsix, end: partinterval.end });
                            var enclosedinfo = new enclosedpart(partinterval.start, partinterval.end, prestart, partinterval.end + end.length, pre);
                            enclosedresult.push(enclosedinfo);
                        }
                    }
                }
                else {
                    var enclosedinfo = new enclosedpart(partinterval.start, partinterval.end, partinterval.start - start.length, partinterval.end + end.length);
                    enclosedresult.push(enclosedinfo);
                }
            }
        }
        return enclosedresult;
    }
    static GetPartIntervalInfo(content, start, end, rstart = "") {
        var result = [];
        var startcount = 0;
        var endcount = 0;
        var info = { start: -1, end: -1 };
        for (var i = 0; i < content.length; i++) {
            var c = content[i];
            if (c == start) {
                startcount = startcount + 1;
            }
            if (c == end) {
                endcount = endcount + 1;
            }
            if (startcount - endcount == 1 && info.start == -1) {
                info.start = i + 1;
            }
            if (endcount == startcount && info.start != -1) {
                info.end = i;
                result.push(info);
                info = { start: -1, end: -1 };
            }
        }
        if (!IsNull(rstart)) {
            var newresult = [];
            for (var i = 0; i < result.length; i++) {
                var encloseinfo = result[i];
                var rsix = encloseinfo.start - rstart.length - 1;
                if (rsix > -1) {
                    var item = content.substr(rsix, rstart.length);
                    if (item == rstart) {
                        newresult.push({ start: rsix, end: encloseinfo.end });
                    }
                }
            }
            result = newresult;
        }
        return result;
    }
    static GetEnclosedItems(content, start, end, rstarts = []) {
        var encloseinfo = this.GetEncloseInfo(content, start, end, rstarts);
        var result = [];
        var enclosedresult = [];
        if (encloseinfo.length > 0) {
            var first = encloseinfo.FirstOrDefault();
            var firststart = FirstNotNull(first.pre_start, first.enclose_start);
            var firstitem = new encloseditem();
            firstitem.content = content.substring(0, firststart);
            result.push(firstitem);
            var item = null;
            for (var i = 0; i < encloseinfo.length; i++) {
                item = encloseinfo[i];
                var eitem = new encloseditem();
                eitem.prekey = item.pre;
                eitem.content = content.substring(item.start, item.end);
                eitem.pre = content.substring(item.pre_start, item.enclose_start);
                result.push(eitem);
                enclosedresult.push(eitem);
                if (i < (encloseinfo.length - 1)) {
                    var nextinfo = encloseinfo[i + 1];
                    var startix = FirstNotNull(nextinfo.pre_start, nextinfo.enclose_start);
                    var betweenitem = new encloseditem();
                    betweenitem.content = content.substring(item.enclose_end, startix);
                    result.push(betweenitem);
                }
            }
            var lastitem = new encloseditem();
            lastitem.content = content.substring(item.enclose_end);
            result.push(lastitem);
        }
        for (var i = 0; i < enclosedresult.length; i++) {
            var eitem = enclosedresult[i];
            eitem.children = Razor.GetEnclosedItems(eitem.content, start, end, rstarts);
            eitem.children.forEach(function (eich) { eich.parent = eitem; });
        }
        return result;
    }
}
Razor.keywords = ["@template", "@foreach", "foreach", "@for", "else if", "@if", "if", "else", "@"];
class RazorParser {
    static GetSplitBy(content, start, end, pre) {
        var result = [];
        var encloseinfo = RazorParser.GetEncloseInfo(content, start, end, pre);
        if (encloseinfo.length == 0) {
            var ec = new EncloseInfo();
            ec.enclosed = false;
            ec.content_start = 0;
            ec.content_end = content.length;
            result.push(ec);
        }
        else {
            var nec = new EncloseInfo();
            nec.enclosed = false;
            nec.content_start = 0;
            for (var i = 0; i < encloseinfo.length; i++) {
                var ec = encloseinfo[i];
                nec.content_end = ec.prefix_start;
                result.push(nec);
                nec = new EncloseInfo();
                nec.enclosed = false;
                nec.content_start = ec.enclose_end;
                result.push(ec);
            }
            nec.content_end = content.length;
            result.push(nec);
        }
        return result;
    }
    static GetEncloseInfo(content, start, end, pre) {
        var mix = 0;
        var result = [];
        var preix = content.indexOf(pre, mix);
        var preixcheck = -1;
        while (preix > -1) {
            if (preix == preixcheck) {
                throw "Razor Syntax Error";
            }
            else {
                preixcheck = preix;
            }
            var ix = preix + pre.length;
            var startcount = 0;
            var endcount = 0;
            while (ix < content.length) {
                if (ix + start.length > content.length) {
                    break;
                }
                if (ix + end.length > content.length) {
                    break;
                }
                var xstart = content.substr(ix, start.length);
                var xend = content.substr(ix, end.length);
                if (startcount == 0 && xstart != start) {
                    preix = content.indexOf(pre, preix + 1);
                    break;
                }
                else {
                    if (xstart == start) {
                        startcount++;
                    }
                    if (xend == end) {
                        endcount++;
                    }
                    if (startcount == endcount) {
                        var ec = new EncloseInfo();
                        ec.prefix_start = preix;
                        ec.enclose_start = preix + pre.length;
                        ec.content_start = ec.enclose_start + start.length;
                        ec.enclose_end = ix + end.length;
                        ec.content_end = ix;
                        ec.enclosed = true;
                        result.push(ec);
                        preix = content.indexOf(pre, ix);
                        break;
                    }
                }
                ix++;
            }
        }
        return result;
    }
    static GetFunction(nodes) {
        var f = (model) => "";
        var functionbuilder = [];
        functionbuilder.push("function (model, context){");
        functionbuilder.push("var view=context[\"view\"];");
        functionbuilder.push("var html=new HtmlHelpers();");
        functionbuilder.push("html.view = view;");
        functionbuilder.push("var htmlbuilder=[];");
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var prevnode = i > 0 ? nodes[i - 1] : null;
            if (node instanceof InlineCode) {
                var parts = node.Value.split(".");
                var str = "htmlbuilder.push(";
                if (parts.length > 1) {
                    str = str + Format("Access({0},'{1}')", parts[0], parts.slice(1).join("."));
                }
                else {
                    str = str + node.Value;
                }
                str = str + ");";
                functionbuilder.push(str);
                continue;
            }
            if (node instanceof Code) {
                if (prevnode != null) {
                    if (prevnode.Value.startsWith("@foreach") && node.Value.trim() == "{") {
                        continue;
                    }
                }
                if (node.Value.startsWith("@foreach")) {
                    var varname = TextBetween(node.Value, "var ", " in");
                    var propname = TextBetween(node.Value, "in ", ")");
                    functionbuilder.push(Format("for (var i_{0}=0; i_{0}<FirstNotNull({1},[]).length; i_{0}++){", varname, propname));
                    functionbuilder.push(Format(" var {0} = {1}[i_{0}];", varname, propname));
                }
                else {
                    if (node.Value.startsWith("@")) {
                        functionbuilder.push(node.Value.substring(1));
                    }
                    else {
                        functionbuilder.push(node.Value);
                    }
                }
                continue;
            }
            if (node instanceof ImplicitNode) {
                var str = "htmlbuilder.push(";
                str = str + node.Value;
                str = str + ");";
                functionbuilder.push(str);
                continue;
            }
            if (node instanceof SyntaxTreeNode) {
                var encval = Replace(node.Value, "'", "\\'");
                encval = Replace(encval, "\r\n", "\\n");
                encval = Replace(encval, "\n", "\\n");
                functionbuilder.push(Format("htmlbuilder.push('{0}');", encval));
                continue;
            }
        }
        functionbuilder.push("return htmlbuilder.join('')");
        functionbuilder.push("}");
        //console.log(functionbuilder.join("\n"));
        try {
            f = evalInContext("[" + functionbuilder.join("\n") + "]")[0];
        }
        catch (ex) {
            console.log(functionbuilder.join("\n"));
            throw ex;
        }
        return f;
    }
    static Compile(code) {
        //var ecs = RazorParser.GetEncloseInfo(code, "(", ")", "@");
        //var necs = RazorParser.GetSplitBy(code, "(", ")", "@");
        var xitems = Razor.GetEnclosedItems(code, "(", ")", ["@foreach", "@if", "@else if"]);
        var nodes = [];
        xitems.forEach(function (xitem) {
            if (!IsNull(xitem.pre)) {
                var node = new Code(xitem.pre + "(" + xitem.content + ")");
                //node.Value = xitem.content;
                nodes.push(node);
            }
            else {
                nodes.push(SyntaxTreeNode.Create(xitem.content));
            }
        });
        if (nodes.length == 0) {
            nodes.push(SyntaxTreeNode.Create(code));
        }
        //console.log(nodes);
        var nodes2 = [];
        nodes.forEach(function (node) {
            if (node["TypeName"] == "SyntaxTreeNode") {
                var explicites = RazorParser.GetSplitBy(node.Value, "(", ")", "@");
                for (var i = 0; i < explicites.length; i++) {
                    var exp = explicites[i];
                    if (exp.enclosed) {
                        var newnode = ImplicitNode.Create(exp.GetEnclosed(node.Value));
                        //node.Value = xitem.content;
                        nodes2.push(newnode);
                    }
                    else {
                        nodes2.push(SyntaxTreeNode.Create(exp.GetEnclosed(node.Value)));
                    }
                }
            }
            else {
                nodes2.push(node);
            }
        });
        var nodes3 = [];
        nodes2.forEach(function (node) {
            if (node["TypeName"] == "SyntaxTreeNode") {
                var rsimpleregex = /@[a-zA-Z0-9_.]+/g;
                var matches = FirstNotNull(node.Value.match(rsimpleregex), []);
                var splits = node.Value.split(rsimpleregex);
                if ((matches.length + 1) == splits.length && matches.length > 0) {
                    var items = [];
                    for (var i = 0; i < matches.length; i++) {
                        if (splits[i].trim().length > 0) {
                            nodes3.push(SyntaxTreeNode.Create(splits[i]));
                        }
                        var expr = matches[i].substring(1);
                        nodes3.push(InlineCode.Create(expr));
                    }
                    nodes3.push(SyntaxTreeNode.Create(splits[splits.length - 1]));
                    //node.Parent.Children.splice.apply(node.Parent.Children, (<any[]>[ix, 0]).concat(items));
                }
                else {
                    nodes3.push(node);
                }
                //node.Parent.Children.splice.apply(node.Parent.Children, (<any[]>[ix, 0]).concat(items));
            }
            else {
                nodes3.push(node);
            }
        });
        //console.log(nodes3);
        var nodes4 = [];
        for (var i = 0; i < nodes3.length; i++) {
            var node = nodes3[i];
            if (node["TypeName"] == "SyntaxTreeNode") {
                var explicites = RazorParser.GetSplitBy(node.Value, "{", "}", "@");
                for (var j = 0; j < explicites.length; j++) {
                    var exp = explicites[j];
                    if (exp.enclosed) {
                        var newnode = Code.Create(exp.GetEnclosed(node.Value));
                        //node.Value = xitem.content;
                        nodes4.push(newnode);
                    }
                    else {
                        nodes4.push(SyntaxTreeNode.Create(exp.GetEnclosed(node.Value)));
                    }
                }
            }
            else {
                nodes4.push(node);
            }
        }
        var nodes5 = [];
        for (var i = 0; i < nodes4.length; i++) {
            var node = nodes4[i];
            if (node["TypeName"] == "SyntaxTreeNode") {
                var prevnode = i == 0 ? null : nodes4[i - 1];
                var lines = node.Value.split("\n");
                var ismarkup = true;
                if (prevnode != null && prevnode["TypeName"] == "Code") {
                    ismarkup = false;
                }
                for (var j = 0; j < lines.length; j++) {
                    var line = lines[j];
                    var islast = j == lines.length - 1;
                    var matches = FirstNotNull(line.match(/<[a-zA-Z_]+/g), line.match(/<\/[a-zA-Z_]+/g), []);
                    var trimmedline = line.trim();
                    if (matches.length > 0) {
                        ismarkup = true;
                    }
                    if (trimmedline.startsWith("}")) {
                        ismarkup = false;
                    }
                    //if (trimmedline.startsWith("@{")) {
                    //    line = trimmedline.substring(2);
                    //    ismarkup = false;
                    //}
                    if (ismarkup) {
                        var lval = islast ? line : line + "\n";
                        nodes5.push(SyntaxTreeNode.Create(lval));
                    }
                    else {
                        nodes5.push(Code.Create(line + "\n"));
                    }
                }
            }
            else {
                nodes5.push(node);
            }
        }
        //console.log(nodes4);
        //console.log(RazorParser.GetFunction(nodes4));
        var f = RazorParser.GetFunction(nodes5);
        return f;
    }
    x() {
        var z = null;
    }
}
class RazorTemplate {
    constructor() {
        this._f = null;
        this.LayoutPath = "";
        this.Extension = "razor";
    }
    Compile(template) {
        if (this._f == null) {
            this._f = RazorParser.Compile(template);
        }
        return this._f;
    }
    Bind(model, context, options) {
        if (this._f != null) {
            return this._f(model, context);
        }
        return "";
    }
    BindToFragment(model, context) {
        var f = document.createDocumentFragment();
        var tpl = document.createElement("template");
        tpl.innerHTML = this.Bind(model, context);
        f.appendChild(tpl.content);
        return f;
    }
    Copy() {
        var me = this;
        var t = new RazorTemplate();
        for (var key in me) {
            t[key] = me[key];
        }
        return t;
    }
}
var Res = function (key, culture) { throw "Res not implemented"; };
var ModelRes = function (key, viewpath = "") {
    throw "Res not implemented";
};
var ResExists = function (key, culture) { throw "Res not implemented"; };
var GetResource = function (key, culture) {
    throw "Res not implemented";
};
var z = 0;
var _Select = (CssSelector, from) => {
    var container = document;
    if (!IsNull(from)) {
        container = from;
    }
    return [].slice.call(container.querySelectorAll(CssSelector));
};
var _SelectFirst = (CssSelector, from) => {
    var container = document;
    if (!IsNull(from)) {
        container = from;
    }
    return container.querySelector(CssSelector);
};
var _Find = (element, CssSelector) => null;
var _FindFirst = (element, CssSelector) => null;
var _Parent = (element, selector) => {
    if (!IsNull(element)) {
        return element.parentElement;
    }
    return null;
};
//var _Parents = (element: Element, selector?: string): Element[]=> [];
var _Children = (element, CssSelector) => null;
var _FirstChildren = (element, CssSelector) => null;
var _AddEventHandler = (element, eventname, handler) => { };
var _RemoveEventHandler = (element, eventname, handler) => { };
var _RemoveEventHandlers = (element, eventname) => { };
var _EnsureEventHandler = (element, eventname, handler) => { };
var _Attribute = (element, attributename, attributevalue) => "";
var _RemoveAttribute = (target, attributename) => { };
var _TagName = (element) => "";
var _Property = (element, propertyname) => "";
var _Value = (element, value) => "";
var _Html = (element, html) => "";
var _Text = (element, text) => "";
var _Remove = (element) => {
    if (!IsNull(element)) {
        element.remove();
    }
};
var _Append = (target, element) => { };
var _After = (target, element) => { };
var _Before = (target, element) => { };
var _HasClass = (element, classname) => false;
var _AddClass = (element, classname) => {
    if (IsNull(element)) {
        return;
    }
    element.classList.add(classname);
};
var _RemoveClass = (element, classname) => { if (IsNull(element)) {
    return;
} element.classList.remove(classname); };
var _Css = (element, value) => { };
var _Width = (element, value) => -1;
var _Height = (element, value) => -1;
var _Focus = (element) => {
    if (IsNull(element)) {
        return;
    }
    element.focus();
};
var _Show = (element) => {
    if (element != null) {
        element.style.removeProperty("display");
    }
};
var _Center = (element) => { };
var _Hide = (element) => {
    if (element != null) {
        element.style.display = "none";
    }
};
var _ShowHide = (element) => {
    if (element != null) {
        if (element.style.display == "none") {
            element.style.removeProperty("display");
        }
        else {
            element.style.display = "none";
        }
    }
};
var _ToggleClass = (element, classname) => {
    if (IsNull(element)) {
        return;
    }
    element.classList.toggle(classname);
};
var _ToggleClassForElements = (elements, classname) => {
    if (IsNull(elements)) {
        return;
    }
    elements.forEach(function (element) {
        element.classList.toggle(classname);
    });
};
var _Create = function (tagname, attributes, html) {
    return _CreateElement(tagname, attributes, html);
};
var _CreateElement = function (tagname, attributes, html) {
    var element = document.createElement(tagname);
    if (!IsNull(attributes)) {
        for (var key in attributes) {
            element.setAttribute(key, attributes[key]);
            //if (key in element)
            //{
            //    element[key] = attributes[key];
            //}
        }
    }
    if (!IsNull(html)) {
        element.innerHTML = html;
    }
    return element;
};
var _IsVisible = (element) => false;
var _Clone = (element) => null;
var _SelectOne = (element) => {
    if (IsNull(element)) {
        return;
    }
    var elements = element.parentElement.children;
    for (var i = 0; i < elements.length; i++) {
        elements[i].classList.remove("selected");
        if (elements[i] == element) {
            element.classList.add("selected");
        }
    }
};
//var _Parents = function (a: Element): Element[] {
//    var els = [];
//    while (a) {
//        els.unshift(a);
//        a = a.parentElement;
//    }
//    return els;
//};
var _Parents = function (a, stopat = null) {
    var els = [];
    var p = a.parentElement;
    while (p != null) {
        if (!p.nodeName.startsWith("#")) {
            els.push(p);
        }
        if (p == stopat) {
            p = null;
        }
        else {
            if (p.parentNode != null && p.parentNode.nodeName == "#document-fragment") {
                p = p.parentNode.host;
            }
            else {
                p = p.parentNode;
            }
            //p = p.parentElement;
        }
    }
    return els;
};
var waitForFinalEvent = (function () {
    var timers = {};
    return function (callback, ms, uniqueId) {
        if (!uniqueId) {
            uniqueId = "Don't call this twice without a uniqueId";
        }
        if (timers[uniqueId]) {
            clearTimeout(timers[uniqueId]);
        }
        timers[uniqueId] = setTimeout(callback, ms);
    };
})();
function LoadJS(path) {
    var fileref = document.createElement('script');
    fileref.setAttribute("type", "text/javascript");
    fileref.setAttribute("src", path);
}
function GetFunctionBody(f) {
    var result = "";
    var entire = f.toString();
    var body = entire.slice(entire.indexOf("{") + 1, entire.lastIndexOf("}"));
    return result;
}
function GetReturnStatement(f) {
    var body = GetFunctionBody(f);
    var body = body.substring(body.lastIndexOf("return "));
    return body.substring(body.indexOf(" ") + 1);
}
function GetMemberExpression(f) {
    return "";
}
function StringEquals(s1, s2) {
    if (typeof s1 == "string" && typeof s2 == "string") {
        return s1.toString().toLowerCase() == s2.toString().toLowerCase();
    }
    return false;
}
function ToBool(item) {
    return In(item.toLowerCase(), "true", "1");
}
function keyPress(key) {
    var keyEvent = new KeyboardEvent("keypress", { key: 13, shiftKey: false });
    document.dispatchEvent(keyEvent);
}
function SendKeys(txt, element) {
    var e = IsNull(element) ? document.activeElement : element;
    var e = e;
    e.focus();
    e.value = txt;
    if (txt.endsWith('\n')) {
        //keyPress(13);
        e.dispatchEvent(new KeyboardEvent('keypress', { 'key': 13, 'keyCode': 13 }));
        e.dispatchEvent(new KeyboardEvent('keydown', { 'key': 13, 'keyCode': 13 }));
        e.dispatchEvent(new KeyboardEvent('keyup', { 'key': 13, 'keyCode': 13 }));
    }
}
function ExcelColNameToIx(colname) {
    var result = "";
    var c = 0;
    for (var i = 0; i < colname.length; i++) {
        var n = colname.charCodeAt(i);
        if (n < 65 && n > 90) {
            return "";
        }
        var ix = n - 65 + 1;
        var px = (colname.length - 1 - i);
        var cx = Math.pow(26, px);
        c = c + (cx * ix);
    }
    return Format("{0}", c - 1);
}
function ExcelColNameToPropertyName(obj, colname) {
    var keys = Object.keys(obj);
    return keys[ExcelColNameToIx(colname)];
}
function GetNext(items, item) {
    if (items != null) {
        var ix = items.indexOf(item);
        if (ix > -1 && ix < items.length) {
            return items[ix + 1];
        }
    }
    return null;
}
function GetPrevious(items, item) {
    if (items != null) {
        var ix = items.indexOf(item);
        if (ix > -1 && ix > 0) {
            return items[ix - 1];
        }
    }
    return null;
}
function HasNext(items, item) {
    if (items != null) {
        var ix = items.indexOf(item);
        if (ix > -1 && ix < items.length) {
            return true;
        }
    }
    return false;
}
function GetPart(data, startix, endix) {
    var part = [];
    if (IsArray(data)) {
        part = data.slice(startix, endix);
    }
    else {
        var ix = 0;
        for (var propertyName in data) {
            if (data.hasOwnProperty(propertyName)) {
                if (ix >= startix && ix < endix) {
                    var item = data[propertyName];
                    item["PropertyName"] = propertyName;
                    part.push(item);
                }
                ix++;
            }
        }
    }
    return part;
}
function EnumerateObject(target, context, func) {
    if (IsArray(target)) {
        var ix = 0;
        target.forEach(function (item) {
            func.call(context, item, ix);
            ix++;
        });
    }
    else {
        for (var propertyName in target) {
            if (target.hasOwnProperty(propertyName)) {
                func(target[propertyName], propertyName);
            }
        }
    }
}
function StartsWith(text, item) {
    return text.indexOf(item) == 0;
}
function EndsWith(text, item) {
    return text.substring(text.length - item.length) == item;
}
function GetLength(data) {
    if (IsArray(data)) {
        return data.length;
    }
    else {
        var ix = 0;
        for (var propertyName in data) {
            if (data.hasOwnProperty(propertyName)) {
                ix++;
            }
        }
        return ix;
    }
}
function RemoveFrom(item, items) {
    var ix = items.indexOf(item);
    if (ix > -1) {
        items.splice(ix, 1);
    }
}
function LastFrom(items) {
    var result = null;
    if (items.length > 0) {
        result = items[items.length - 1];
    }
    return result;
}
function CallFunctionFrom(eventcontainer, eventname, args) {
    if (!IsNull(eventcontainer)) {
        if (eventname in eventcontainer && IsFunction(eventcontainer[eventname])) {
            eventcontainer[eventname](args);
        }
    }
}
function CallFunction(func, args) {
    if (!IsNull(func) && IsFunction(func)) {
        return func.apply(this, args);
    }
}
function CallFunctionWithContext(context, func, args) {
    if (!IsNull(func) && IsFunction(func)) {
        return func.apply(context, args);
    }
    return null;
}
function callasync(func, timeout = 0) {
    setTimeout(function () {
        func();
    }, timeout);
}
function GetHashPart(item) {
    var hash_ix = item.indexOf("#");
    item = hash_ix > -1 ? item.substring(hash_ix + 1) : "";
    return item;
}
function clearobject(item) {
    if (typeof item == "string") {
        item = "";
    }
    else {
        for (var propertyName in item) {
            delete item[propertyName];
        }
    }
}
function GetErrorObj(exception, contenttype) {
    var exceptiontext = "responseJSON" in exception ? exception["responseJSON"] : "";
    var stacktrace = "";
    var errorobj = { message: "", stacktrace: "" };
    if (contenttype == "text/html") {
        errorobj.message = exception["responseText"];
        return errorobj;
    }
    if ("responseJSON" in exception) {
        if (typeof (exception["responseJSON"]) == "object") {
            exceptiontext = exception["responseJSON"].Message;
            stacktrace = exception["responseJSON"].StackTrace;
        }
        else {
            exceptiontext = exception["responseJSON"];
        }
    }
    else {
        if ("responseText" in exception) {
            exceptiontext = Truncate(HtmlEncode(exception["responseText"]), 400);
        }
    }
    errorobj = { message: exceptiontext, stacktrace: stacktrace };
    return errorobj;
}
function SetProperty(target, name, value) {
    if (!IsNull(target)) {
        target[name] = value;
    }
}
function GetBaseURL() {
    var url = window.location.href.split('/');
    var baseUrl = url[0] + '//' + url[2] + '/';
    if (url[3].length == 5) {
        if (url[3].match(/[a-z]{2}-[a-z]{2}/gi)) {
            baseUrl = baseUrl + url[3] + '/';
        }
    }
    return baseUrl;
}
;
/*Strings*/
function TextBetween(text, begintag, endtag, withtags) {
    var result = "";
    if (typeof text == "string") {
        var ixs = text.indexOf(begintag);
        if (ixs > -1) {
            ixs = ixs + begintag.length;
            var ixe = text.indexOf(endtag, ixs);
            if (ixe > -1) {
                result = text.substring(ixs, ixe);
            }
        }
    }
    if (withtags) {
        result = begintag + result + endtag;
    }
    return result;
}
;
function TextsBetween(text, begintag, endtag, withtags) {
    var result = [];
    while (text.indexOf(begintag) > -1 && text.indexOf(endtag) > -1) {
        var item = TextBetween(text, begintag, endtag);
        if (withtags) {
            var fullitem = begintag + item + endtag;
            result.push(fullitem);
        }
        else {
            result.push(item);
        }
        text = text.substring(text.indexOf(endtag) + endtag.length);
    }
    return result;
}
;
function FormatSimpleTest(...any) {
    var args = Array.prototype.slice.call(arguments, 1);
    var format = arguments[0];
    return format.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined'
            ? args[number]
            : match;
    });
}
;
function FormatSimple(format, args) {
    return format.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined'
            ? args[number]
            : match;
    });
}
;
function Format(...any) {
    var args = Array.prototype.slice.call(arguments, 1);
    //if (args.length == 1)
    //{
    //    if (IsArray(args[0]))
    //    {
    //        args = args[0];
    //    }
    //    //if 
    //}
    var format = arguments[0];
    //if (format.indexOf("d}") == -1 || format.indexOf("{{") == -1)
    //{
    //    return FormatSimple(format, args);
    //}
    format = Replace(format, "{{", "xF<w&");
    format = Replace(format, "}}", "xF>w&");
    var result = format;
    var parts = TextsBetween(format, "{", "}", true);
    parts.forEach(function (item, ix) {
        var ix = -1;
        var inner = item.substring(1, item.length - 1);
        var partformat = "";
        if (inner.indexOf(":") > -1) {
            ix = Number(inner.substring(0, inner.indexOf(":")));
            partformat = inner.substring(inner.indexOf(":") + 1);
        }
        else {
            ix = Number(inner);
        }
        var arg = args[ix];
        if (!IsNull(format)) {
            if (arg instanceof Date) {
                arg = FormatDate(arg, partformat);
            }
            if (IsNumeric(arg) && (!(arg instanceof Date))) {
                if (partformat.toLowerCase().indexOf("d") == 0) {
                    var padnr = Number(partformat.substring(1));
                    arg = pad(Number(arg), padnr, "0", 0);
                }
                else {
                    if (!IsNull(partformat)) {
                        arg = window["formatnumber"](partformat, arg);
                    }
                }
            }
        }
        result = Replace(result, "xF<w&", "{");
        result = Replace(result, "xF>w&", "}");
        result = Replace(result, item, arg);
    });
    return result;
}
;
function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
function StringToDate(item, format = "") {
    if (IsNull(item)) {
        return null;
    }
    if (item.indexOf("T") > 0) {
        return new Date(item);
    }
    var y_ix = 2;
    var m_ix = 1;
    var d_ix = 0;
    var splitstr = /\.|\\|,|\/|-|T|:/;
    var parts = item.split(splitstr);
    if (!IsNull(format)) {
        var fparts = format.split(splitstr);
        for (var i = 0; i < fparts.length; i++) {
            var fpart = fparts[i];
            if (fpart.toLocaleLowerCase().indexOf("y") > -1) {
                y_ix = i;
            }
            if (fpart.toLocaleLowerCase().indexOf("m") > -1) {
                m_ix = i;
            }
            if (fpart.toLocaleLowerCase().indexOf("d") > -1) {
                d_ix = i;
            }
        }
    }
    var d = null;
    try {
        d = new Date(Number(parts[y_ix]), Number(FirstNotNull(parts[m_ix], 1) - 1), Number(FirstNotNull(parts[d_ix], 1)));
    }
    catch (ex) {
        d = null;
    }
    return d;
}
function IsDate(p) {
    return Object.prototype.toString.call(p) === '[object Date]';
}
function IsNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
function IsInt(value) {
    return !isNaN(value) &&
        parseInt(value) == value &&
        !isNaN(parseInt(value, 10));
}
//string/number,length=2,char=0,0/false=Left-1/true=Right
function pad(a, b, c, d) {
    return a = (a || c || 0) + '', b = new Array((++b || 3) - a.length).join(c || 0), d ? a + b : b + a;
}
function Property(item, property, value) {
    if (typeof value === "undefined" && !IsNull(item)) {
        if (property in item) {
            return item[property];
        }
        return null;
    }
    else {
        item[property] = value;
    }
    return null;
}
/*End Strings*/
/*Objects*/
function IsDefined(value, path) {
    var root = false;
    path.split('.').forEach(function (key) {
        if (!root) {
            value = eval(key);
            root = true;
        }
        else {
            value = value && value[key];
        }
    });
    return (typeof value != 'undefined' && value !== null);
}
;
function AddToArray(item, ...any) {
    if (arguments.length < 2)
        return [];
    else {
        var array = Array.prototype.slice.call(arguments, 0);
        array.splice(0, 1);
        array.forEach(function (item_i) {
            if (item.indexOf(item_i) == -1) {
                item.push(item_i);
            }
        });
        return item;
    }
}
function In(item, ...any) {
    if (arguments.length < 2)
        return false;
    else {
        var array = Array.prototype.slice.call(arguments, 0);
        array.splice(0, 1);
        if (arguments.length == 2 && IsArray(arguments[1])) {
            array = arguments[1];
        }
        //return array.where(function (x) {
        //    return x === item;
        //}).length > 0;
        return array.indexOf(item) > -1;
        //var found = false;
        //array.forEach(function (item_i) {
        //    if (item_i===item) {
        //        found = true;
        //    }
        //});
        //return found;
    }
}
function IsAllNull(item, ...any) {
    if (arguments.length < 1)
        return false;
    else {
        var array = Array.prototype.slice.call(arguments, 0);
        array.splice(0, 0);
        var nullcount = 0;
        array.forEach(function (item_i) {
            if (IsNull(item_i)) {
                nullcount++;
            }
        });
        return nullcount == array.length;
    }
}
function FirstNotNull(...any) {
    if (arguments.length < 1)
        return null;
    else {
        var array = Array.prototype.slice.call(arguments, 0);
        for (var i = 0; i < array.length; i++) {
            if (!IsNull(array[i])) {
                return array[i];
            }
        }
        return null;
    }
}
function IsAllNotNull(item, ...any) {
    if (arguments.length < 1)
        return false;
    else {
        var array = Array.prototype.slice.call(arguments, 0);
        array.splice(0, 0);
        var nullcount = 0;
        array.forEach(function (item_i) {
            if (IsNull(item_i)) {
                nullcount++;
            }
        });
        return nullcount == 0;
    }
}
function intersectArrays(a, b) {
    var d = {};
    var results = [];
    for (var i = 0; i < b.length; i++) {
        d[b[i]] = true;
    }
    for (var j = 0; j < a.length; j++) {
        if (d[a[j]])
            results.push(a[j]);
    }
    return results;
}
function cleanArray(actual) {
    var newArray = new Array();
    for (var i = 0; i < actual.length; i++) {
        if (actual[i]) {
            newArray.push(actual[i]);
        }
    }
    return newArray;
}
function removeFromArray(arr, ...any) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax = arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}
function Equals(arg1, arg2) {
    if (typeof (arg1) == "string" && typeof (arg2) == "string") {
        return (arg1.toLowerCase() == arg2.toLowerCase());
    }
    return arg1 == arg2;
}
function GetClientQueryString(hash) {
    if (hash == null) {
        hash = window.location.hash;
    }
    var parameters = [];
    if (hash.indexOf("?") > -1) {
        hash = hash.substring(hash.indexOf("?") + 1);
    }
    if (hash.length > 2) {
        var items = hash.split("&");
        items.forEach(function (item) {
            var kv = {};
            var psplit = item.split("=");
            kv.Key = psplit[0].trim().toLowerCase();
            kv.Value = psplit[1].trim();
            parameters.push(kv);
        });
    }
    return parameters;
}
function ToHierarchy(items, idproperty, parentproperty, rootid) {
    if (!rootid) {
        rootid == null;
    }
    var Children = items.where(function (i) { return i[parentproperty] == rootid; });
    Children.forEach(function (item) {
        var parentid = item[idproperty];
        item.Children = ToHierarchy(items, idproperty, parentproperty, parentid);
    });
    return Children;
}
;
function GetHierarchy(items, idproperty, parentproperty, setparents = false) {
    var result = [];
    var d = {};
    items.forEach(function (item) {
        d[item[idproperty]] = item;
        if (!("Children" in item)) {
            item["Children"] = [];
        }
    });
    items.forEach(function (item) {
        var parent = d[item[parentproperty]];
        if (IsNull(parent)) {
            result.push(item);
        }
        else {
            if (!("Children" in parent)) {
                parent["Children"] = [];
            }
            parent["Children"].push(item);
            if (setparents) {
                item["Parent"] = parent;
            }
        }
    });
    return result;
}
function HashCode(s) {
    return s.split("").reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
}
function GetFlattenedHierarchy(items, idproperty, childproperty = "Children", level = 0) {
    var result = [];
    //var d = {};
    //items.forEach(function (item) {
    //    //d[item[idproperty]] = item;
    //    if (!(childproperty in item)) {
    //        item[childproperty] = [];
    //    }
    //});
    items.forEach(function (item) {
        item["Level"] = level;
        result.push(item);
        var children = item[childproperty];
        if (!IsNull(children) && children.length > 0) {
            result = result.concat(GetFlattenedHierarchy(children, idproperty, childproperty, level + 1));
        }
    });
    return result;
}
function ForAll(hierarchy, childrenproperty, func, parent = null, level = 0) {
    func(hierarchy, parent, level);
    if (childrenproperty in hierarchy) {
        var children = hierarchy[childrenproperty];
        if (!IsNull(children) && IsArray(children)) {
            children.forEach(function (item) {
                ForAll(item, childrenproperty, func, hierarchy, level + 1);
            });
        }
    }
}
function Clone(obj) {
    if (null == obj || "object" != typeof obj)
        return obj;
    var copy = {};
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr))
            copy[attr] = obj[attr];
    }
    return copy;
}
function IsNull(item) {
    //return item == 'undefined' || item == null || (typeof (item) == "string" && item == "");
    return item === undefined || item == null || item === "";
}
;
function Coalesce(...items) {
    var result = null;
    for (var i = 0; i < items.length - 1; i++) {
        if (!IsNull(items[i])) {
            return items[i];
        }
    }
    if (items.length > 0) {
        return items[items.length - 1];
    }
    return result;
}
function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
}
function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
function Guid() {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}
/*End Objects*/
/*HTML*/
function ToHtmlAttributeListString(obj) {
    var str = "";
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            var value = obj[prop];
            if (!IsNull(value)) {
                str += prop + '="' + value + '" ';
            }
        }
    }
    return str;
}
;
function RenderHierarchy(obj, itemformatter, level = 0) {
    var html = "";
    var children = obj["Children"];
    children = IsNull(children) ? [] : children;
    if (level > 0) {
        html += "<li>";
        html += itemformatter(obj);
    }
    if (children.length > 0) {
        html += "<ul>";
        children.forEach(function (item) {
            html += RenderHierarchy(item, itemformatter, level + 1);
        });
        html += "</ul>";
    }
    if (level > 0) {
        html += "</li>\n";
    }
    return html;
}
;
function HtmlToText(html) {
    var tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}
function ToString(item) {
    return IsNull(item) ? "" : item.toString();
}
function Truncate(item, limit) {
    var result = "";
    if (IsNull(limit)) {
        limit = 40;
    }
    if (typeof item == "string") {
        if (item.length > limit) {
            result = item.substring(0, limit) + "...";
        }
        else {
            result = item;
        }
    }
    return result;
}
/*End HTML*/
function IsNumberBetween(min, max, value) {
    var result = false;
    result = min <= value && (IsNull(max) || max >= value);
    return result;
}
/*DateTime*/
function IsDateBetween(startdate, enddate, date) {
    var result = false;
    if (IsNull(startdate)) {
        return false;
    }
    if (IsNull(date)) {
        date = new Date();
        date.setHours(0, 0, 0, 0);
    }
    if (startdate === startdate.toString()) {
        startdate = JsonToDate(startdate);
    }
    if (startdate <= date) {
        if (IsNull(enddate)) {
            return true;
        }
        else {
            if (enddate === enddate.toString()) {
                enddate = JsonToDate(enddate);
            }
            return enddate >= date;
        }
    }
    return result;
}
function JsonToDate(item) {
    if (IsNull(item)) {
        return null;
    }
    var x = item.match(/\d+/)[0];
    var nr = +x;
    return new Date(nr);
}
function ToDate(item) {
    return FormatDate(JsonToDate(item));
}
function ToNormalDate(item) {
    return FormatDate(JsonToDate(item));
}
function FormatDate(d, format) {
    if (IsNull(format)) {
        format = "yyyy/MM/dd hh:mm:ss";
    }
    if (IsNull(d)) {
        return "";
    }
    //return $.formatDateTime(format, d);
    return formatDate(d, format);
}
var formatDate = function (dt, format) {
    format = format.replace('ss', xpad(dt.getSeconds(), 2));
    format = format.replace('s', dt.getSeconds());
    format = format.replace('dd', xpad(dt.getDate(), 2));
    format = format.replace('d', dt.getDate());
    format = format.replace('mm', xpad(dt.getMinutes(), 2));
    format = format.replace('m', dt.getMinutes());
    format = format.replace('MM', xpad(dt.getMonth() + 1, 2));
    format = format.replace(/M(?![ao])/, dt.getMonth() + 1);
    format = format.replace('yyyy', dt.getFullYear());
    format = format.replace('YYYY', dt.getFullYear());
    format = format.replace('yy', (dt.getFullYear() + "").substring(2));
    format = format.replace('YY', (dt.getFullYear() + "").substring(2));
    format = format.replace('HH', xpad(dt.getHours(), 2));
    format = format.replace('hh', xpad(dt.getHours(), 2));
    format = format.replace('H', dt.getHours());
    return format;
};
function xpad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
function leftpad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
function rightpad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : n + new Array(width - n.length + 1).join(z);
}
/*End DateTime*/
function sharedStart(array) {
    var A = array.concat().sort(), a1 = A[0], a2 = A[A.length - 1], L = a1.length, i = 0;
    while (i < L && a1.charAt(i) === a2.charAt(i))
        i++;
    return a1.substring(0, i);
}
function longestCommonSubstring(array) {
    // Copy the array
    let arr = array.slice().sort();
    // For each individual string sort them 
    arr = arr.map(a => a.split('').sort().join(''));
    // Check the first and last string and check till chars match
    let a0 = arr[0], aLast = arr[arr.length - 1], len = arr[0].length, i = 0;
    while (i < len && a0[i] === aLast[i])
        i++;
    // return
    return a0.substring(0, i);
}
function commonwords(array) {
    var strings = array;
    var words = [];
    for (var i = 0; i < strings.length; i++) {
        words.push(strings[i].split(' ').Where(i => !IsNull(i)));
    }
    var common = [];
    for (var i = 0; i < words.length; i++) {
        if (common.length == 0) {
            common = words[i];
        }
        else {
            common = intersectArrays(common, words[i]);
        }
    }
    return common.join(" ");
}
/*Proto*/
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (needle) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] === needle) {
                return i;
            }
        }
        return -1;
    };
}
/*
HTMLElement.prototype.toString = function () {
    var html = (<HTMLElement>this).outerHTML;
    var result = "<" + TextBetween(html, "<", ">") + ">";
    return result;
}
*/
/**End Proto/

/*Expressions*/
function parseExp(expression, model) {
    var body = expression.toString();
    var exp = TextBetween(body, "return ", "}");
    exp = exp.trim();
    var c = 0;
    var result = { propertyname: "", fullpropertyname: "", obj: null, value: null, typename: "", resourceid: "" };
    var parts = exp.split('.');
    var item = model;
    var value = model;
    var sc = ".";
    parts.forEach(function (key) {
        if (c == 0) {
            value = value ? value : eval(key);
        }
        if (c > 0) {
            //value = value && value[key];
            value = value[key];
            result.fullpropertyname += key;
            if (c < parts.length - 1) {
                result.fullpropertyname + sc;
            }
        }
        if (c == parts.length - 2) {
            result.obj = value;
            if (result.obj) {
                result.typename = result.obj['TypeName'];
            }
        }
        if (c == parts.length - 1) {
            result.propertyname = key;
        }
        c++;
    });
    result.resourceid = Format("Models.{0}.{1}", result.typename, result.propertyname);
    var val = eval(exp);
    ;
    result.value = val ? val : "";
    return result;
}
;
/*End Expressions*/
function FilesIntoUL(viewmodel) {
    var model = viewmodel.Items;
    var html = "";
    html += '<ul class="jqueryFileTree" style="display: none;">';
    //<li class="directory collapsed"><a href="#" rel="/this/folder/">Folder Name</a></li>
    //<li class="file ext_txt"><a href="#" rel="/this/folder/filename.txt">filename.txt</a></li>
    model.forEach(function (item) {
        if (item.IsFolder) {
            html += Format('<li class="directory collapsed"><a href="#" rel="{1}{0}/\">{0}</a></li>', item.ID, item.Directory);
        }
        else {
            html += Format('<li class="file ext_{2}"><a href="#" rel="{1}{0}">{0}</a></li>', item.ID, item.Directory, item.Extension);
        }
    });
    html += "</ul>";
    return html;
}
function browserSupportsWebWorkers() {
    //return typeof window.Worker === "function";
    return false;
}
function ToOptionList(obj, addemptyoption) {
    var result = "";
    if (addemptyoption) {
        result += Format('<option value="">-select-</option>\n');
    }
    for (var prop in obj) {
        var val = obj[prop];
        if (obj.hasOwnProperty(prop) && typeof val !== "function") {
            result += Format('<option value="{0}">{1}</option>\n', prop, val);
        }
    }
    return result;
}
function NormalizeFolderPath(folder) {
    if (folder == null) {
        folder = "";
    }
    if (folder.indexOf("~") == 0) {
        folder = folder.substring(1);
    }
    if (folder[folder.lentgh - 1] != "/") {
        folder = folder + "/";
    }
    return folder;
}
function Eval(obj) {
    if (IsNull(obj)) {
        return null;
    }
    if (IsFunction(obj)) {
        return obj();
    }
    return obj;
}
function IsFunction(functionToCheck) {
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}
function IsObject(obj) {
    return obj === Object(obj);
}
function IsArray(value) {
    if (Array.isArray) {
        return Array.isArray(value);
    }
    return false;
}
function Split(text, delimeters, removeempty) {
    var result = [text];
    if (typeof (delimeters) == 'string') {
        delimeters = [delimeters];
    }
    while (delimeters.length > 0) {
        for (var i = 0; i < result.length; i++) {
            var tempSplit = result[i].split(delimeters[0]);
            result = result.slice(0, i).concat(tempSplit).concat(result.slice(i + 1));
        }
        delimeters.shift();
    }
    if (removeempty) {
        var resultwithoutempty = [];
        result.forEach(function (item) {
            if (!IsNull(item.trim())) {
                resultwithoutempty.push(item);
            }
        });
        return resultwithoutempty;
    }
    return result;
}
function Access(obj, key, context) {
    if (key == null) {
        return obj;
    }
    key = key.replace("model.", "this.");
    var encode = false;
    var encindex = key.indexOf("~");
    if (encindex == 0) {
        encode = true;
        key = key.substring(1);
    }
    var result = null;
    if (key.indexOf("html.") == 0) {
        try {
            result = eval(HtmlDecode(key));
            return result;
        }
        catch (err) {
            console.error(err);
        }
    }
    if (IsObject(obj) && key in obj) {
        return obj[key];
    }
    if (key == "this") {
        result = obj;
    }
    else {
        result = key.split(".").reduce(function (o, x) {
            return (typeof o == "undefined" || o === null) ? o : o[x];
        }, obj);
    }
    result = IsNull(result) ? "" : result;
    if (encode) {
        result = HtmlEncode(result);
    }
    return result;
}
function SetPropertyPath(obj, path, value) {
    var parts = path.split(".");
    var lastpart = parts[parts.length - 1];
    var currentobj = obj;
    var setpart = function (targetobj, part, val) {
        var aix = part.indexOf("[");
        var result;
        if (aix > -1) {
            var six = TextBetween(part, "[", "]");
            var ix = parseInt(six);
            var apart = part.substring(0, aix);
            if (!IsArray(targetobj[apart])) {
                targetobj[apart] = [];
            }
            if (!(ix in targetobj[apart])) {
                targetobj[apart][ix] = val;
            }
            result = targetobj[apart][ix];
        }
        else {
            if (!(part in targetobj)) {
                targetobj[part] = val;
            }
            result = targetobj[part];
        }
        return result;
    };
    for (var i = 0; i < parts.length - 1; i++) {
        var part = parts[i];
        currentobj = setpart(currentobj, part, {});
    }
    setpart(currentobj, lastpart, value);
}
var e_testobj = {
    id: "1",
    VoucherItems: [
        {
            id: "v1", name: "v1 name", properties: [
                { id: "v1p1", pname: "p1", value: 11 }
            ]
        },
        {
            id: "v2", name: "v2 name", properties: [
                { id: "v2p1", pname: "p1", value: 101 },
                { id: "v2p2", pname: "p2", value: 102 }
            ]
        }
    ]
};
function ObjToPathList(obj) {
    var result = [];
    for (var key in obj) {
        var val = obj[key];
        if (!IsNull(val) && IsObject(val)) {
            var subpath = ObjToPathList(val);
            result.push.apply(result, subpath.Select(sp => key + "." + sp));
        }
        else {
            result.push(key);
        }
    }
    return result;
}
function ObjToPathValueList(obj, path = "") {
    var result = [];
    for (var key in obj) {
        var val = obj[key];
        if (!IsNull(val) && IsObject(val)) {
            result.push.apply(result, ObjToPathValueList(val, path + key + "."));
        }
        else {
            result.push([path + key, val]);
        }
    }
    return result;
}
function ExtractPaths(obj, paths) {
    var result = {};
    var pathdictionary = {};
    for (var i = 0; i < paths.length; i++) {
        SetPath(pathdictionary, paths[i], null);
    }
    for (var path in pathdictionary) {
        //var path = paths[i];
        var pathvalue = obj[path];
        if (pathvalue instanceof Array && pathvalue.length > 0) {
            var subparts = ObjToPathList(pathdictionary[path]);
            if (subparts.length > 0) {
                result[path] = [];
                for (var ix = 0; ix < pathvalue.length; ix++) {
                    var item = pathvalue[ix];
                    result[path].push(ExtractPaths(item, subparts));
                }
            }
        }
        if (!(pathvalue instanceof Object)) {
            CopyProperty(obj, result, path);
        }
    }
    return result;
}
function SetPath(obj, path, value) {
    var parts = path.split(".");
    var lastpart = parts[parts.length - 1];
    var currentobj = obj;
    var setpart = function (targetobj, part, val) {
        var aix = part.indexOf("[");
        var result;
        if (aix > -1) {
            var six = TextBetween(part, "[", "]");
            var ix = parseInt(six);
            var apart = part.substring(0, aix);
            if (!IsArray(targetobj[apart])) {
                targetobj[apart] = [];
            }
            if (!(ix in targetobj[apart])) {
                targetobj[apart][ix] = val;
            }
            result = targetobj[apart][ix];
        }
        else {
            //if (!(part in targetobj)) {
            //    targetobj[part] = val;
            //}
            targetobj[part] = val;
            result = targetobj[part];
        }
        return result;
    };
    for (var i = 0; i < parts.length - 1; i++) {
        var part = parts[i];
        currentobj = setpart(currentobj, part, IsNull(currentobj[part]) ? {} : currentobj[part]);
    }
    var lastparts = lastpart.split(",");
    for (var i = 0; i < lastparts.length; i++) {
        setpart(currentobj, lastparts[i], value);
    }
}
function GetPath(obj, path) {
    var parts = path.split(".");
    var lastpart = parts[parts.length - 1];
    var currentobj = obj;
    var setpart = function (targetobj, part, val) {
        var aix = part.indexOf("[");
        var result;
        if (aix > -1) {
            var six = TextBetween(part, "[", "]");
            var ix = parseInt(six);
            var apart = part.substring(0, aix);
            if (!IsArray(targetobj[apart])) {
                targetobj[apart] = [];
            }
            if (!(ix in targetobj[apart])) {
                targetobj[apart][ix] = val;
            }
            result = targetobj[apart][ix];
        }
        else {
            if (!(part in targetobj)) {
                targetobj[part] = val;
            }
            result = targetobj[part];
        }
        return result;
    };
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        currentobj = setpart(currentobj, part, {});
    }
    return currentobj;
}
function PathMap(source, target) {
    var plist = ObjToPathValueList(source);
    for (var i = 0; i < plist.length; i++) {
        var path = plist[i][0];
        var value = plist[i][1];
        SetPath(target, path, value);
    }
}
function HtmlEncode(s) {
    var elm = document.createElement("div");
    elm.innerText = elm.textContent = s;
    s = elm.innerHTML;
    //delete elm;
    return s;
}
var __div = document.createElement("div");
function HtmlDecode(s) {
    //var elm = document.createElement("div");
    __div.innerHTML = s;
    return __div.innerText;
    //delete elm;
}
function OuterHtml(item) {
    return item.outerHTML;
    //return item.wrapAll('<div>').parent().html(); 
}
function Replace(text, texttoreplace, textwithreplace) {
    if (IsNull(text)) {
        return text;
    }
    textwithreplace = IsNull(textwithreplace) ? "" : textwithreplace;
    return "" + text.split(texttoreplace).join(textwithreplace);
}
function Bind_Replace(text, texttoreplace, textwithreplace) {
    //return text.replace(Format("{0}", texttoreplace), textwithreplace);
    return text.split(texttoreplace).join(textwithreplace);
}
function GetProperties(item) {
    var properties = [];
    for (var propertyName in item) {
        if (item.hasOwnProperty(propertyName) && !(item[propertyName] instanceof Function)) {
            var propertyValue = item[propertyName];
            var kv = {};
            kv["Key"] = propertyName;
            kv["Value"] = propertyValue;
            properties.push(kv);
        }
    }
    return properties;
}
function GetKeys(item) {
    var properties = [];
    for (var propertyName in item) {
        if (item.hasOwnProperty(propertyName)) {
            var propertyValue = item[propertyName];
            properties.push(propertyName);
        }
    }
    return properties;
}
function GetPropertiesArray(item) {
    var properties = [];
    for (var propertyName in item) {
        if (item.hasOwnProperty(propertyName)) {
            var propertyValue = item[propertyName];
            properties.push(propertyValue);
        }
    }
    return properties;
}
Array.prototype.FirstOrDefault = function (func) {
    var items = this;
    if (func == null) {
        if (items.length > 0) {
            return items[0];
        }
    }
    for (var i = 0; i < items.length; i++) {
        if (func(items[i])) {
            return items[i];
        }
    }
    return null;
};
Array.prototype.Skip = function (val) {
    var items = this;
    var result = [];
    var startix = val - 1;
    for (var i = startix; i < items.length; i++) {
        result.push(items[i]);
    }
    return result;
};
Array.prototype.Where = function (func) {
    var items = this;
    var result = [];
    for (var i = 0; i < items.length; i++) {
        if (func(items[i])) {
            result.push(items[i]);
        }
    }
    return result;
};
Array.prototype.OrderBy = function (func) {
    var items = Array.prototype.slice.call(this);
    var sortfunction = function (a, b) {
        /* next line works with strings and numbers,
         * and you may want to customize it to your needs
         */
        var result = (func(a) < func(b)) ? -1 : (func(a) > func(b)) ? 1 : 0;
        return result;
    };
    items.sort(sortfunction);
    return items;
};
Array.prototype.OrderByDescending = function (func) {
    var items = Array.prototype.slice.call(this);
    var sortfunction = function (a, b) {
        /* next line works with strings and numbers,
         * and you may want to customize it to your needs
         */
        var result = (func(a) < func(b)) ? -1 : (func(a) > func(b)) ? 1 : 0;
        return result * -1;
    };
    items.sort(sortfunction);
    return items;
};
Array.prototype.Select = function (func) {
    var items = this;
    var result = [];
    for (var i = 0; i < items.length; i++) {
        result.push(func(items[i]));
    }
    return result;
};
Array.prototype.SelectAs = function (func) {
    var items = this;
    var result = [];
    for (var i = 0; i < items.length; i++) {
        result.push(func(items[i]));
    }
    return result;
};
Array.prototype.SelectMany = function (func) {
    var items = this;
    var result = [];
    for (var i = 0; i < items.length; i++) {
        result.push.apply(result, func(items[i]));
    }
    return result;
};
Array.prototype.Sum = function (func) {
    var items = this;
    var result = 0;
    for (var i = 0; i < items.length; i++) {
        var val = func(items[i]);
        result = result + (isNaN(val) ? 0 : val);
    }
    return result;
};
Array.prototype.Max = function (func) {
    var items = this;
    var result = null;
    for (var i = 0; i < items.length; i++) {
        var val = func(items[i]);
        if (result == null) {
            result = val;
        }
        else {
            if (val > result) {
                result = val;
            }
        }
    }
    return result;
};
Array.prototype.Min = function (func) {
    var items = this;
    var result = null;
    for (var i = 0; i < items.length; i++) {
        var val = func(items[i]);
        if (result == null) {
            result = val;
        }
        else {
            if (val < result) {
                result = val;
            }
        }
    }
    return result;
};
function dynamicSort(property, sortOrder = 1) {
    return function (a, b) {
        /* next line works with strings and numbers,
         * and you may want to customize it to your needs
         */
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    };
}
function ForeachInHierarchy(obj, func, childrenpropertyname = "Children") {
    func(obj);
    var items = obj[childrenpropertyname];
    for (var i = 0; i < items.length; i++) {
        ForeachInHierarchy(items[i], func, childrenpropertyname);
    }
}
function ForeachInHierarchy2(obj, func, childrenpropertyname = "Children") {
    var items = obj[childrenpropertyname];
    for (var i = 0; i < items.length; i++) {
        ForeachInHierarchy2(items[i], func, childrenpropertyname);
    }
    func(obj);
}
function WhereInHierarchy(obj, func, childrenpropertyname = "Children") {
    var items = obj[childrenpropertyname];
    var result = [];
    if (func(obj)) {
        result.push(obj);
    }
    for (var i = 0; i < items.length; i++) {
        result.push.apply(result, WhereInHierarchy(items[i], func, childrenpropertyname));
    }
    return result;
}
function ParentsOfHierarchy(obj, parentpropertyname = "Parent") {
    var items = [];
    var parent = obj[parentpropertyname];
    var maxcount = 100;
    var c = 0;
    while (parent != null && c < maxcount) {
        items.push(parent);
        parent = parent[parentpropertyname];
        c++;
    }
    return items;
}
function FindInHierarchy(obj, func, childrenpropertyname = "Children") {
    if (func(obj)) {
        return obj;
    }
    else {
        var items = obj[childrenpropertyname];
        if (IsArray(items)) {
            for (var i = 0; i < items.length; i++) {
                var result = FindInHierarchy(items[i], func, childrenpropertyname);
                if (!IsNull(result)) {
                    return result;
                }
            }
        }
        return null;
    }
}
function Log(item, ext) {
    var message = item + (ext == null ? "" : ":" + ext);
    console.log(message);
    if (getUrlParameter("debug") != "1") {
        var log = document.querySelector('#log');
        var msg = document.createElement('code');
        var verb = "log";
        msg.classList.add(verb);
        msg.textContent = FormatDate(new Date(), "hh:mm:ss") + " " + message;
        if (log != null) {
            log.appendChild(msg);
        }
    }
}
function HttpRequest(method, url, callback) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            callback(this);
        }
    };
    xhttp.open(method, url, true);
    xhttp.send();
    return xhttp;
}
class Tasks {
    static StartTask(name) {
        Tasks.taskNr = Tasks.taskNr + 1;
        ShowProgress(name);
    }
    static EndTask(name) {
        Tasks.taskNr = Tasks.taskNr - 1;
        if (Tasks.taskNr == 0) {
            HideProgress(name);
        }
    }
}
Tasks.taskNr = 0;
function ShowProgress(src = "") {
    var p = document.getElementById("progress");
    if (p != null) {
        _Show(p);
    }
}
function HideProgress(src = "") {
    var p = document.getElementById("progress");
    if (p != null) {
        _Hide(p);
    }
}
function IsDataContainer(element) {
    if (element.tagName == "TEXTAREA") {
        return true;
    }
    if (element.tagName == "SELECT") {
        return true;
    }
    var type = element.getAttribute("type");
    if (element.tagName == "INPUT" && type != "button") {
        return true;
    }
    if (element.hasAttribute("bind")) {
        return true;
    }
    return element.hasAttribute("value");
}
function GetPropertyandValue(element) {
    if (element != null) {
        var fieldname = FirstNotNull(element.getAttribute("bind"), element.getAttribute("name"));
        var hasvalue = element.hasAttribute("value");
        var value = element.getAttribute("value");
        if (!IsNull(fieldname)) {
            if (element.tagName == "INPUT"
                || element.tagName == "SELECT"
                || element.tagName == "APP-AUTOCOMPLETE"
                || element.tagName == "APP-OBJECTPICKER") {
                return { Key: fieldname, Value: element.value };
            }
            else {
                return { Key: fieldname, Value: FirstNotNull(value, element.innerHTML) };
            }
        }
    }
    return null;
}
function EnsureProperrty(obj, property, defaultvalue = null) {
    if (!obj.hasOwnProperty(property)) {
        obj[property] = defaultvalue;
    }
}
function CopyProperty(source, target, property, targetproperty = "") {
    if (source.hasOwnProperty(property)) {
        if (IsNull(targetproperty)) {
            targetproperty = property;
        }
        target[targetproperty] = source[property];
    }
}
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}
;
function getTextAreaLineNr(element) {
    return element.value.substr(0, element.selectionStart).split("\n").length;
}
function Activate(a, container) {
    if (a.tagName == "A") {
        var parent = IsNull(container) ? a.parentElement.parentElement : container;
        var rels = _Select("[rel]", parent);
        for (var i = 0; i < rels.length; i++) {
            var rel = rels[i];
            _Hide(rel);
            rel.classList.remove("selected");
            // Do stuff
        }
        _Show(_SelectFirst("#" + a.getAttribute("rel")));
        a.classList.add("selected");
    }
}
function ActivateOld(a) {
    if (a.tagName == "A") {
        var toactivate = _SelectFirst("#" + a.getAttribute("rel"));
        var others = toactivate.parentElement.children;
        for (var i = 0; i < a.parentElement.children.length; i++) {
            var child = a.parentElement.children[i];
            child.classList.remove("selected");
            // Do stuff
        }
        for (var i = 0; i < others.length; i++) {
            if (others[i] != toactivate) {
                _Hide(others[i]);
            }
            else {
                _Show(others[i]);
            }
            // Do stuff
        }
        a.classList.add("selected");
    }
}
function SelectElement(parent, child) {
    for (var i = 0; i < parent.children.length; i++) {
        parent.children[i].classList.remove("selected");
        // Do stuff
    }
    child.classList.add("selected");
    child.scrollIntoView(false);
    parent.scrollLeft = child.offsetLeft - 40;
}
function ActivateFloat(element) {
}
function JsonCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}
function GetHtml2(obj, span = "") {
    var htmlbuilder = [];
    if (!(obj instanceof Object)) {
        return Format("{0}", obj);
    }
    htmlbuilder.push(span + '<ul>');
    for (var key in obj) {
        htmlbuilder.push(span + '<li>');
        htmlbuilder.push(span + key + ": ");
        var val = obj[key];
        if (val instanceof Array) {
            htmlbuilder.push(span + Format("[{0}]", val.Select(i => GetHtml2(i)).join(',')));
        }
        else if (val instanceof Element) {
        }
        else if (IsFunction(val)) {
        }
        else //if (val instanceof Object)
         {
            htmlbuilder.push(span + GetHtml2(val, span + "   "));
        }
        htmlbuilder.push(span + '</li>');
    }
    htmlbuilder.push(span + '</ul>');
    return "{" + htmlbuilder.join('\n') + "}";
}
function GetHtml(obj) {
    var htmlbuilder = [];
    var properties = GetProperties(obj);
    var baseobject = {};
    var nullcontainer = {};
    for (var i = 0; i < properties.length; i++) {
        var propertyname = properties[i].Key.toString();
        var propertyvalue = properties[i].Value;
        if (propertyvalue instanceof Array) {
            continue;
        }
        if (propertyvalue instanceof Object) {
            continue;
        }
        if (IsNull(propertyvalue)) {
            nullcontainer[propertyname] = propertyvalue;
        }
        else {
            baseobject[propertyname] = propertyvalue;
        }
    }
    if ("TypeName" in obj) {
        htmlbuilder.push(Format('<h2>{0}: {1}</h2>', obj["TypeName"], obj["Id"]));
    }
    htmlbuilder.push("<div class='content'>");
    for (var key in baseobject) {
        htmlbuilder.push(Format('<div class="field"><span class="name">{0}</span><span class="value">{1}</span></div>', key, baseobject[key]));
    }
    for (var key in nullcontainer) {
        htmlbuilder.push(Format('<div class="field"><span class="name">{0}</span><span class="value">{1}</span></div>', key, nullcontainer[key]));
    }
    htmlbuilder.push("</div>");
    return htmlbuilder.join("\n");
}
function download(filename, data) {
    var element = document.createElement('a');
    element.setAttribute('href', data);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
var _TrimLeft = function (item, chars) {
    //debugger;
    var re = chars ? new RegExp("^[" + chars + "]+/", "g")
        : new RegExp(/^\s+/);
    return item.replace(re, "");
};
var _TrimRight = function (item, chars) {
    var re = chars ? new RegExp("[" + chars + "]+$/", "g")
        : new RegExp(/\s+$/);
    return item.replace(re, "");
};
var _Trim = function (item, chars) {
    return _TrimRight(_TrimLeft(item, chars), chars);
};
function GetStringWithLiterals(text, literalstr = "\"") {
    var result = {
        aliasedtext: text, literaldictionary: {}
    };
    var rs = literalstr + "(?:\\\\.|[^" + literalstr + "\\\\])*" + literalstr;
    var regex = new RegExp(rs, 'g');
    var matches = Coalesce(text.match(regex), []);
    matches.forEach((m, mix) => {
        var literal = _Trim(m, '"');
        var literalkey = "literal_" + mix;
        result[literalkey] = m;
        result.aliasedtext = Replace(result.aliasedtext, m, literalkey);
    });
    return result;
}
function CsvLineSplit(text, delimiter = ",", enclose = '"') {
    var result = [];
    text = Format("{0}", text);
    var encloseix = -1;
    var currentencloseix = -1;
    var isenclosed = false;
    var gathered = "";
    for (var i = 0; i < text.length; i++) {
        var c = text[i];
        if (c == delimiter) {
            if (isenclosed) {
                gathered = gathered + c;
            }
            else {
                result.push(gathered);
                gathered = "";
            }
            continue;
        }
        if (c == enclose) {
            if (encloseix == -1) {
                encloseix = i;
                isenclosed = true;
                continue;
            }
            if (encloseix > -1 && encloseix != i) {
                isenclosed = false;
                encloseix = -1;
            }
            continue;
        }
        gathered = gathered + c;
    }
    if (gathered.length > 0) {
        result.push(gathered);
    }
    return result;
}
function compareString(a, b) {
    if (a < b) {
        return -1;
    }
    if (a > b) {
        return 1;
    }
    return 0;
}
function getStringCompareFunction(p) {
    return function (a, b) { return compareString(p(a), p(b)); };
}
function RestoreModel(item, fielddictionary) {
    var modelitem = {};
    for (var key in fielddictionary) {
        var fieldix = fielddictionary[key];
        if (key.indexOf(".") == -1) {
            if (item[fieldix] !== undefined) {
                modelitem[key] = item[fieldix];
            }
        }
        else {
            var parts = key.split(".");
            var last = parts[parts.length - 1];
            var currentobj = modelitem;
            for (var i = 0; i < parts.length - 1; i++) {
                var part = parts[i];
                if (!(part in currentobj)) {
                    currentobj[part] = {};
                }
                currentobj = currentobj[part];
            }
            if (item[fieldix] !== undefined) {
                currentobj[last] = item[fieldix];
            }
        }
    }
    return modelitem;
}
var dataURLToBlob = function (dataURL) {
    var BASE64_MARKER = ';base64,';
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
        var parts = dataURL.split(',');
        var contentType = parts[0].split(':')[1];
        var raw = parts[1];
        return new Blob([raw], { type: contentType });
    }
    var parts = dataURL.split(BASE64_MARKER);
    var contentType = parts[0].split(':')[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;
    var uInt8Array = new Uint8Array(rawLength);
    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
};
class Timer {
    constructor() {
        this.isrunning = false;
        this.tickms = 1000;
        this.Elpased = () => { };
    }
    Start() {
        var me = this;
        this.isrunning = true;
        setTimeout(me.Tick.bind(me), me.tickms);
    }
    Stop() {
        this.isrunning = false;
    }
    Tick() {
        var me = this;
        if (this.isrunning) {
            setTimeout(me.Tick.bind(me), me.tickms);
            me.Elpased();
        }
    }
}
function AsArrayOf(obj) {
    if (IsNull(obj)) {
        return [];
    }
    if (!IsArray(obj)) {
        return [];
    }
    return obj;
}
/*Custom functions to MGA*/
function GetPropertyByShortname(properties, shortname) {
    var propertyvalue;
    for (var i in properties) {
        if (properties[i]["ShortName"] == shortname) {
            propertyvalue = properties[i]["Value"];
            return propertyvalue;
        }
    }
}
function TransformNumber(number, numberofdecimal) {
    var numberofzeros = rightpad('', numberofdecimal);
    var format = '{0:####.' + numberofzeros + '}';
    var formatednumber = Format(format, number);
    var result = formatednumber.replace('.', '');
    return result;
}
var HttpStatusCodes = {
    '200': 'OK',
    '201': 'Created',
    '202': 'Accepted',
    '203': 'Non-Authoritative Information',
    '204': 'No Content',
    '205': 'Reset Content',
    '206': 'Partial Content',
    '300': 'Multiple Choices',
    '301': 'Moved Permanently',
    '302': 'Found',
    '303': 'See Other',
    '304': 'Not Modified',
    '305': 'Use Proxy',
    '306': 'Unused',
    '307': 'Temporary Redirect',
    '400': 'Bad Request',
    '401': 'Unauthorized',
    '402': 'Payment Required',
    '403': 'Forbidden',
    '404': 'Not Found',
    '405': 'Method Not Allowed',
    '406': 'Not Acceptable',
    '407': 'Proxy Authentication Required',
    '408': 'Request Timeout',
    '409': 'Conflict',
    '410': 'Gone',
    '411': 'Length Required',
    '412': 'Precondition Required',
    '413': 'Request Entry Too Large',
    '414': 'Request-URI Too Long',
    '415': 'Unsupported Media Type',
    '416': 'Requested Range Not Satisfiable',
    '417': 'Expectation Failed',
    '418': 'I\'m a teapot',
    '429': 'Too Many Requests',
    '500': 'Internal Server Error',
    '501': 'Not Implemented',
    '502': 'Bad Gateway',
    '503': 'Service Unavailable',
    '504': 'Gateway Timeout',
    '505': 'HTTP Version Not Supported',
};
class HtmlHelpers {
    GetMinMaxDateControl(bind, udt) {
        return HtmlHelpers.GetMinMaxDate('<input type="hidden" bind="' + bind + '" uidatatype="' + udt + '"/>');
    }
    Res(Key) {
        return GetResource(Key);
    }
    ModelRes(Key) {
        return ModelRes(Key);
    }
    Encode(txt) {
        return HtmlEncode(txt);
    }
    Url(url) {
        return HtmlHelpers.dataentrypoint + "/" + Replace(url, "~/", "");
    }
    Link(url, title) {
        if (IsNull(url)) {
            return Format('<span class="value">{0}</span>', title);
        }
        var xurl = this.Url(url);
        return Format('<a class="value" download="" target="_blank" href="{0}">{1}</a>', xurl, title);
    }
    Image(url, format) {
        if (!IsNull(url)) {
            var xurl = Replace(url, "~/", "");
            var relativeurl = HtmlHelpers.dataentrypoint + "/" + Format(format, url);
            return Format('<img class="image" src="{0}" />', relativeurl);
        }
        return "";
    }
    GetInputsFor(field, type, items, values = null, source = null) {
        var html = "";
        html = html + Format('<input type="hidden" bind="Type" value="{0}" />\r\n', type);
        if (!IsNull(source)) {
            var value = values.FirstOrDefault();
            var item = items.FirstOrDefault();
            html = html + Format('<select bind="{1}.{0}" name="{1}.{0}" />\r\n', item, field);
            source.forEach(function (sourceitem) {
                var id = sourceitem["Id"];
                var value = sourceitem["Name"];
                var isselected = id == value ? "selected='selected'" : "";
                html = html + Format("   <option {0} value='{1}'>{2}</option>", isselected, id, value);
            });
            html = html + "</select>";
        }
        else {
            items.forEach(function (item, ix) {
                html = html + "<div class='subfield'>";
                if (items.length > 1) {
                    html = html + Format('<label class="name" for="{0}">{0}</label>\r\n', item, field);
                }
                var value = "";
                if (!IsNull(values)) {
                    value = ix < values.length ? values[ix] : "";
                }
                html = html + Format('<input type="{2}" bind="{1}.{0}" name="{1}.{0}" value="{3}" />\r\n', item, field, type, value);
                html = html + "</div>";
            });
        }
        return html;
    }
    GetFilter(options) {
        var htmlbuilder = [];
        var optionshtmlbuilder = [];
        var typehtml = "text";
        var valuehtml = 'value="' + Format("{0}", options.Value) + '"';
        var labeltext = HtmlHelpers.ResNvl([
            Format("UI.{0}.Filters.{1}", options.ModelContext, options.Field),
            Format("models.{0}.{1}", options.ModelContext, options.Field),
            Format("models.BaseModel.{0}", options.Field),
            options.LabelKey
        ]);
        var controltype = "";
        var controltemplate = '<input type="{0}" class="value {4}" title="{5}" bind="{1}" {2} {3}/>';
        var lookupmodeswitch = "";
        var datafunction = "";
        var ondatareceived = "";
        if (options.ShowNullFilters) {
            options["ondatareceived"] = "UIFilter.GetNullFilterElements";
        }
        if (!IsNull(options.QueryName)) {
            var valuefield = Coalesce(options.ValueField, "Id");
            var displayfield = Coalesce(options.DisplayField, "Name");
            var lookupfields = Coalesce(options.LookUpFields, [displayfield]);
            datafunction = "function(a,b){Partner.DataLayer.DataLookup(a,'" +
                options.QueryName + "',['" +
                lookupfields.join("','") + "'],'" +
                valuefield + "','" +
                displayfield + "',b);}";
            options["datafunction"] = datafunction;
            if (!("displayfield" in options)) {
                options["displayfield"] = displayfield;
            }
            if (!("valuefield" in options)) {
                options["valuefield"] = valuefield;
            }
            var controltemplate = '<app-objectpicker type="{0}" class="value {4}" title="{5}" bind="{1}" {2} {3}></app-objectpicker>';
        }
        var hint = "";
        options["UIDataType"] = options.Type;
        switch (options.Type) {
            case UIDataType.Text: {
                typehtml = "text";
                hint = Res("texts.TextFilterHint");
                break;
            }
            case UIDataType.Date: {
                typehtml = "hidden";
                hint = Res("texts.DateFilterHint");
                break;
            }
            case UIDataType.Number: {
                typehtml = "text";
                hint = Res("texts.NumberFilterHint");
                break;
            }
            case UIDataType.Boolean: {
                typehtml = "checkbox";
                valuehtml = options.Value ? "checked" : "";
                break;
            }
        }
        hint = hint.replace(/"/g, '&quot;');
        var labelhtml = Format('<label class="name">{0}</label>', labeltext);
        for (var key in options) {
            optionshtmlbuilder.push(Format('{0}="{1}"', key, options[key]));
        }
        var optionshtml = optionshtmlbuilder.join(' ');
        var inputhtml = Format(controltemplate, typehtml, options.Field, valuehtml, optionshtml, controltype, hint);
        if (options.Type == UIDataType.Date) {
            inputhtml = HtmlHelpers.GetMinMaxDate(inputhtml);
        }
        var controlhtml = Format('<div class="field uifilter">\n{0}\n{1}\n{2}\n</div>\n', labelhtml, inputhtml, lookupmodeswitch);
        htmlbuilder.push(controlhtml);
        return htmlbuilder.join("\n");
    }
    FieldFor(expression, hideifempty = true) {
        var html = "";
        var formatf = function (str) {
            var fieldfs = '<div class="field">\r\n' +
                '\t<span class="name" >@{meta.' + str + '.Label}</span>\r\n' +
                '\t<span class="value">@{model.' + str + '}</span>\r\n' +
                '</div>';
            return fieldfs;
        };
        return html;
    }
    LabelFor(model, expression, UIType, attributes) {
        var val = IsNull(model) ? "" : expression(model);
        var exprstr = expression.toString();
        var simplified = exprstr.substr(exprstr.indexOf(".") + 1).trim();
        //var val = BindAccess(this, expression);
        if (UIType == "Date") {
            var fs = "{0:" + HtmlHelpers.DateFormat + "}";
            val = Format(fs, IsNull(val) ? "" : new Date(val));
        }
        if (UIType == "DateTime") {
            var fs = "{0:" + HtmlHelpers.DateTimeFormat + "}";
            val = Format(fs, IsNull(val) ? "" : new Date(val));
        }
        if (UIType == "Decimal") {
            var fs = "{0:" + HtmlHelpers.DecimalFormat + "}";
            val = Format(fs, IsNull(val) ? "" : val);
        }
        var attr = [];
        if (!IsNull(attributes)) {
            for (var key in attributes) {
                attr.push(Format('{0}="{1}"', key, attributes[key]));
            }
        }
        return Format('<label name="{0}" {2}>{1}</label>', simplified, val, attr.join(' '));
    }
    ValueFor(model, meta, parent = null) {
        var val = model;
        var UIType = IsNull(meta) ? "string" : meta.SourceType;
        if (UIType == "Date") {
            var fs = "{0:" + HtmlHelpers.DateFormat + "}";
            val = Format(fs, IsNull(val) ? "" : new Date(val));
        }
        if (UIType == "DateTime") {
            var fs = "{0:" + HtmlHelpers.DateTimeFormat + "}";
            val = Format(fs, IsNull(val) ? "" : new Date(val));
        }
        if (UIType == "double") {
            var fs = "{0:" + HtmlHelpers.DecimalFormat + "}";
            val = Format(fs, IsNull(val) ? "" : val);
        }
        if (UIType == "money") {
            //var fs = "{0:" + application.Settings.MonetaryFormat +"}";
            var fs = HtmlHelpers.MonetaryFormat;
            var devizaname = Access(parent, "Deviza.Shortname");
            val = Format(fs, IsNull(val) ? "" : val, devizaname);
        }
        return Format('{0}', val);
    }
    Value(model, key) {
        var mp = MetaAccess(model, key);
        //if (mp == null) { return ""}
        var parent = model;
        if (key.indexOf(".") > -1) {
            var parentkey = key.substring(0, key.lastIndexOf("."));
            parent = Access(model, parentkey);
        }
        var val = Access(model, key);
        if (mp != null) {
            return this.ValueFor(val, mp, parent);
        }
        return val;
    }
    labelFor(model, expression, attributes) {
        var exprstr = expression.toString();
        var simplified = exprstr.substr(exprstr.indexOf(".") + 1).trim();
        //var mp: PropertyMeta = Access(model,simplified);
        var mp = MetaAccess(model, simplified);
        //var val = BindAccess(this, expression);
        var attr = [];
        if (!IsNull(attributes)) {
            for (var key in attributes) {
                attr.push(Format('{0}="{1}"', key, attributes[key]));
            }
        }
        return Format('<span name="{0}" {2}>{1}</span>', simplified, mp.Label, attr.join(' '));
    }
    GetLabel(key, attributes) {
        var parts = key.split('.');
        var mkey = key;
        var typename = "";
        if (parts.length > 1) {
            typename = parts.FirstOrDefault();
            mkey = parts.slice(1).join('.');
        }
        return this.Label(typename, mkey, attributes);
    }
    Text(key) {
        var viewpath = Format("{0}.{1}", Access(this.view, "LogicalModelName"), Access(this.view, "Name"));
        var labeltext = ModelRes(key, viewpath);
        return labeltext;
    }
    Label(model, key, attributes) {
        var modelname = IsObject(model) ? model["TypeName"] : Format("{0}", model);
        var attr = [];
        if (!IsNull(attributes)) {
            for (var attrkey in attributes) {
                attr.push(Format('{0}="{1}"', attrkey, attributes[attrkey]));
            }
        }
        var viewpath = Format("{0}.{1}", Access(this.view, "LogicalModelName"), Access(this.view, "Name"));
        var mkey = IsNull(modelname) ? key : (modelname + '.' + key);
        var labeltext = ModelRes(mkey, viewpath);
        return Format('<span name="{0}" {2}>{1}</span>', key, labeltext, attr.join(' '));
    }
    ObjectPickerFor(model, expression, labelexpression, options, attributes) {
        var exprstr = expression.toString();
        var lookupfields = Coalesce(Access(options, 'LookupFields'), ["Name"]);
        var valuefield = Coalesce(Access(options, 'ValueField'), "Id");
        var displayfield = Coalesce(Access(options, 'DisplayField'), "Name");
        var queryname = Coalesce(Access(options, 'QueryName'), "");
        var lkpfstr = "['" + lookupfields.join("','") + "']";
        var datafunctionstr = 'function(a,b){ AppDataLayer.Instance.DataLookup(a,' + queryname + ',' + lkpfstr + ',' + valuefield + ',' + displayfield + ', b); }';
        var simplified = exprstr.substr(exprstr.indexOf(".") + 1).trim();
        //var mp: PropertyMeta = Access(model, simplified);
        var mp = MetaAccess(model, simplified);
        var val = undefined;
        if (mp != null) {
            val = model[mp.MetaKey];
            val = IsNull(val) ? "" : val;
        }
        var attr = [];
        if (!IsNull(attributes)) {
            for (var key in attributes) {
                attr.push(Format('{0}="{1}"', key, attributes[key]));
            }
        }
        var inputtype = IsNull(mp) ? "text" : mp.InputType;
        return Format('<app-objectpicker type="{3}" name="{0}" bind="{0}" {2} value="{1}"></app-objectpicker>', simplified, val, attr.join(' '), inputtype);
    }
    AutoCompleteFor(model, expression, labelexpression, options, attributes) {
        var exprstr = expression.toString();
        var lookupfields = Coalesce(Access(options, 'LookupFields'), ["Name"]);
        var valuefield = Coalesce(Access(options, 'ValueField'), "Id");
        var displayfield = Coalesce(Access(options, 'DisplayField'), "Name");
        var queryname = Coalesce(Access(options, 'QueryName'), "");
        var lkpfstr = "['" + lookupfields.join("','") + "']";
        var datafunctionstr = 'function(a,b){ AppDataLayer.Instance.DataLookup(a,' + queryname + ',' + lkpfstr + ',' + valuefield + ',' + displayfield + ', b); }';
        var simplified = exprstr.substr(exprstr.indexOf(".") + 1).trim();
        //var mp: PropertyMeta = Access(model, simplified);
        var mp = MetaAccess(model, simplified);
        var val = undefined;
        if (mp != null) {
            val = model[mp.MetaKey];
            val = IsNull(val) ? "" : val;
        }
        var attr = [];
        if (!IsNull(attributes)) {
            for (var key in attributes) {
                attr.push(Format('{0}="{1}"', key, attributes[key]));
            }
        }
        var inputtype = IsNull(mp) ? "text" : mp.InputType;
        return Format('<app-autocomplete type="{3}" name="{0}" bind="{0}" {2} value="{1}"></app-autocomplete>', simplified, val, attr.join(' '), inputtype);
    }
    InputFor(model, expression, attributes) {
        var exprstr = expression.toString();
        var simplified = exprstr.substr(exprstr.indexOf(".") + 1).trim();
        //var mp: PropertyMeta = Access(model, simplified);
        var mp = MetaAccess(model, simplified);
        var val = undefined;
        if (mp != null) {
            val = model[mp.MetaKey];
            val = IsNull(val) ? "" : val;
        }
        var attr = [];
        if (!IsNull(attributes)) {
            for (var key in attributes) {
                attr.push(Format('{0}="{1}"', key, attributes[key]));
            }
        }
        var inputtype = IsNull(mp) ? "text" : mp.InputType;
        return Format('<input type="{3}" name="{0}" bind="{0}" {2} value="{1}"/>', simplified, val, attr.join(' '), inputtype);
    }
    TextAreaFor(model, expression, attributes) {
        var exprstr = expression.toString();
        var simplified = exprstr.substr(exprstr.indexOf(".") + 1).trim();
        var mp = Access(model, simplified);
        var val = undefined;
        if (mp != null) {
            val = model[mp.MetaKey];
            val = IsNull(val) ? "" : val;
        }
        var attr = [];
        if (!IsNull(attributes)) {
            for (var key in attributes) {
                attr.push(Format('{0}="{1}"', key, attributes[key]));
            }
        }
        return Format('<textarea name="{0}" bind="{0}" {2} >{1}</textarea>', simplified, val, attr.join(' '));
    }
    BoundInput(model, key) {
        return this.Input(model, key, { "bind": key });
    }
    Input(model, key, attributes) {
        var me = this;
        var mp = MetaAccess(model, key);
        if (attr) { }
        var val = Access(model, key);
        var inputtype = "text";
        if (mp != null) {
            val = IsNull(val) ? "" : val;
            val = Replace(me.Value(model, key), " ", "");
            val = Replace(val, ",", "");
            inputtype = mp.InputType;
        }
        var attr = [];
        if (!IsNull(attributes)) {
            for (var attrkey in attributes) {
                attr.push(Format('{0}="{1}"', attrkey, attributes[attrkey]));
            }
        }
        return Format('<input type="{3}" name="{0}" {2} value="{1}"/>', key, val, attr.join(' '), inputtype);
    }
    FormattedLabelFor(model, expression, formatstring, attributes) {
        var val = expression(model);
        var exprstr = expression.toString();
        var simplified = exprstr.substr(exprstr.indexOf(".") + 1).trim();
        //var val = BindAccess(this, expression);
        var fs = "{0:" + formatstring + "}";
        var formattedval = Format(fs, IsNull(val) ? "" : Number(val));
        var attr = [];
        if (!IsNull(attributes)) {
            for (var key in attributes) {
                attr.push(Format('{0}="{1}"', key, attributes[key]));
            }
        }
        return Format('<label name="{0}" {2}>{1}</label>', simplified, formattedval, attr.join(' '));
    }
}
HtmlHelpers.dataentrypoint = "";
HtmlHelpers.DateFormat = "";
HtmlHelpers.DateTimeFormat = "";
HtmlHelpers.DecimalFormat = "";
HtmlHelpers.MonetaryFormat = "";
//var html = new HtmlHelpers();
//# sourceMappingURL=Utils.js.map