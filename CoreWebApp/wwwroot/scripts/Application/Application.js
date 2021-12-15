var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
class ImportScript {
    constructor() {
        this.Id = "";
        this.Name = "";
        this.Description = "";
        this.DetailsUrl = "";
        this.ViewUrl = "";
        this.TypeName = "ImportScript";
        this.CallBack_LookupData = function () { };
        this.CallBack_DataReady = function () { };
    }
    Load(formdata, extension) {
        var result = [];
    }
    SaveAll(view) {
    }
}
class ExcelImport extends ImportScript {
    constructor() {
        super(...arguments);
        this.ExcelQuery = "";
        this.ExcelOptions = "";
        this.Url = "~/webui/api/ximportexcel";
        this.ExcelData = null;
        this.CallBack_ExcelData = function (data) {
            this.ExcelData = data;
        };
    }
    SetExcelVersion(extension) {
        var lextension = extension.toLowerCase();
        var excelver = lextension == "xlsx" ? "Excel 12.0" : "Excel 8.0";
        this.ExcelOptions = this.ExcelOptions.replace("#excelver", excelver);
    }
    LoadExcel(data) {
    }
    ReloadExcel() {
        var me = this;
        if (!IsNull(me.ExcelData)) {
            me.LoadExcel(me.ExcelData);
        }
    }
    Clear() {
    }
}
function GetDbCommandForObject(obj, commandname, keys = "Id", excludes = []) {
    var meta = GetMeta(obj);
    var updateobj = {};
    for (var i = 0; i < meta.Fields.length; i++) {
        var field = meta.Fields[i];
        if (!field.IsArray && !field.IsObject
            && excludes.indexOf(field.MetaKey) == -1) {
            if (field.MetaKey in obj) {
                var val = obj[field.MetaKey];
                if (!IsNull(val)) {
                    updateobj[field.MetaKey] = val;
                }
            }
        }
        updateobj["Keys"] = keys;
        updateobj["TypeName"] = meta.MetaKey;
        updateobj["CommandName"] = commandname;
    }
    FIxUpdateObj(updateobj);
    return updateobj;
}
function GetUpdateCommand(obj, typename, commandname, keys = "Id", excludes = ["Id"]) {
    var meta = GetMetaByTypeName(typename);
    var updateobj = {};
    for (var i = 0; i < meta.Fields.length; i++) {
        var field = meta.Fields[i];
        if (!field.IsArray && !field.IsObject
            && excludes.indexOf(field.MetaKey) == -1) {
            if (field.MetaKey in obj) {
                var val = obj[field.MetaKey];
                if (!IsNull(val)) {
                    updateobj[field.MetaKey] = val;
                }
            }
        }
        updateobj["Keys"] = keys;
        updateobj["TypeName"] = typename;
        updateobj["CommandName"] = commandname;
    }
    return updateobj;
}
function GetDeleteCommand(typename, id) {
    var command = {};
    command["TypeName"] = typename;
    command["CommandName"] = "Delete";
    command["Keys"] = "Id";
    command["Id"] = id;
    return command;
}
function FIxUpdateObj(obj) {
    var mt = GetMeta(obj);
    for (var key in obj) {
        if (!IsNull(obj[key]) && !IsNull(mt) && (key in mt)) {
            var pmt = mt[key];
            if (pmt != null && In(pmt.SourceType, "Date")) {
                var d = IsDate(obj[key]) ? obj[key] : StringToDate(obj[key], application.Settings.DateFormat);
                obj[key] = Format("{0:yyyy-MM-dd}", d);
            }
            if (pmt != null && In(pmt.SourceType, "DateTime")) {
                var d = IsDate(obj[key]) ? obj[key] : StringToDate(obj[key], application.Settings.DateFormat);
                obj[key] = Format("{0:yyyy-MM-ddTHH:mm:ss}", d);
            }
            if (pmt != null && In(pmt.SourceType, "double", "integer", "money")) {
                obj[key] = Number(obj[key]);
            }
        }
        if (IsNull(obj[key])) {
            delete obj[key];
        }
        else {
            if (IsArray(obj[key])) {
                for (var i = 0; i < obj[key].length; i++) {
                    FIxUpdateObj(obj[key][i]);
                }
            }
        }
    }
}
class Dependencies {
    static Container() { return null; }
    ;
    static LoadContent(element) { }
    ;
}
Dependencies.ClientValidation = true;
Dependencies.DataLayer = null;
class AppDataLayer {
    static Link() { }
    static GetQueryForAutoComplete(queryname) {
        var query = ClientQuery.New({
            QueryName: queryname,
            Fields: [{ Name: "*" }],
            //Filters: [{ Type: "string", Field:"Name", Operator: "Like", Value: "", }],
            Filters: [],
            Ordering: { "Name": "ASC" },
            Skip: 0,
            Take: 10,
            GetCount: false
        });
        return query;
    }
    static GetDataDetails(query, id, callback) {
        query.SetFilters(ClientFilter.Create(UIDataType.Number, "Id", id));
        Dependencies.httpClient.GetData(query, function (r) {
            var data = r;
            var items = data["Model"];
            callback(items[0]);
        }, null);
    }
    static Lookup(queryname, lookupfields, valuefieldname, displayfieldname) {
        var datafunction = function (value, callback) {
            var lowervalue = value.toLowerCase();
            var uppervalue = value.toUpperCase();
            var dataname = queryname + 's';
            if (dataname in AppDataLayer.Data) {
                var data = AppDataLayer.Data[dataname];
                var result = [];
                //var none = { Name: "-" + Res("general.ListNone") + "-" };
                //result.push(none);
                for (var di = 0; di < data.length; di++) {
                    var item = data[di];
                    var found = false;
                    for (var i = 0; i < lookupfields.length; i++) {
                        if (Format("{0}", item[lookupfields[i]]).toLowerCase().indexOf(lowervalue) > -1) {
                            result.push(item);
                            break;
                        }
                    }
                    //if (result.length >= application.Settings.PageSize) {
                    //    break;
                    //}
                }
                callback(result);
            }
            else {
                if (!IsNull(uppervalue)) {
                    var query = AppDataLayer.GetQueryByName(queryname + "List");
                    if (query == null) {
                        query = AppDataLayer.CreateListQueryByName(queryname);
                    }
                    query.Skip = 0;
                    query.GetCount = false;
                    query.Take = application.Settings.PageSize;
                    //ClientFilter.Create(UIDataType.Number, "Id", p.toString())
                    AppDataLayer.DataLookupByQuery(value, query, lookupfields, callback);
                }
            }
        };
        return datafunction;
    }
    static DataLookupByQuery(value, query, lookupfields, callback) {
        var uppervalue = value.toUpperCase();
        //query.Filters = <IClientFilter[]>lookupfields.Select(i => { return new StringFilter(i + ":" + uppervalue).GetQuery().FirstOrDefault() });
        if (!IsNull(uppervalue)) {
            var filters = lookupfields.Select(i => {
                var isexact = i.startsWith("[") && i.endsWith("]");
                if (isexact) {
                    let fieldname = TextBetween(i, "[", "]");
                    return ClientFilter.Create(UIDataType.Text, fieldname, "[" + value + "]").FirstOrDefault();
                }
                else {
                    return ClientFilter.Create(UIDataType.Text, i, uppervalue).FirstOrDefault();
                }
            });
            if (filters.length == 1) {
                query.SetFilters(filters);
            }
            else {
                var orfilter = new ClientFilter();
                orfilter.Operator = "OR";
                orfilter.Field = "Id";
                orfilter.Children = filters;
                query.SetFilter(orfilter);
            }
        }
        query.Take = application.Settings.PageSize;
        AppDependencies.httpClient.GetData(query, function (r) {
            var items = r.Model;
            console.log(r);
            callback(items); //.Select(i => { return { Value: i[valuefieldname], Display: i[displayfieldname] } }));
        }, null);
    }
    static DataLookup(value, queryname, lookupfields, valuefieldname, displayfieldname, callback) {
        var me = this;
        var lowervalue = value.toLowerCase();
        var uppervalue = value.toUpperCase();
        var dataname = queryname + 's';
        if (dataname in AppDataLayer.Data) {
            var data = AppDataLayer.Data[dataname];
            var result = [];
            //var none = { Name: "-" + Res("general.ListNone") + "-" }; 
            //result.push(none);
            for (var di = 0; di < data.length; di++) {
                var item = data[di];
                for (var i = 0; i < lookupfields.length; i++) {
                    if (Format("{0}", item[lookupfields[i]]).toLowerCase().indexOf(lowervalue) > -1) {
                        result.push(item);
                        break;
                    }
                }
            }
            callback(result);
        }
        else {
            //if (!IsNull(uppervalue)) {
            var query = AppDataLayer.GetQueryByName(queryname + "List");
            if (query == null) {
                query = AppDataLayer.CreateListQueryByName(queryname);
            }
            query.Skip = 0;
            query.GetCount = false;
            query.Take = application.Settings.PageSize;
            //ClientFilter.Create(UIDataType.Number, "Id", p.toString())
            AppDataLayer.DataLookupByQuery(value, query, lookupfields, callback);
            //}
        }
    }
    static GetQueryByName(name) {
        if (name in AppDataLayer.Queries) {
            return ClientQuery.New(JSON.parse(JSON.stringify(AppDataLayer.Queries[name])));
        }
        return null;
    }
    static CreateListQuery(meta) {
        return AppDataLayer.CreateListQueryByName(meta.MetaKey);
    }
    static CreateListQueryByName(queryname, fields = []) {
        var ffields = fields.length == 0 ? [{ Name: "*" }] : fields.Select(function (i) { return { Name: i }; });
        var query = ClientQuery.New({
            QueryName: queryname,
            Fields: ffields,
            Filters: [],
            Ordering: { "Id": "DESC" },
            Skip: 0,
            Take: null,
            GetCount: false
        });
        return query;
    }
    static CreateDetailsQueryByName(queryname, Id) {
        var query = ClientQuery.New({
            QueryName: queryname,
            Fields: [{ Name: "*" }],
            Filters: [],
            Skip: 0,
            Take: 1,
            GetCount: false
        });
        query.SetFilters(ClientFilter.Create(UIDataType.Number, "Id", Id));
        var meta = GetMetaByTypeName(queryname);
        if (meta != null) {
            var listfields = meta.Fields.Where(i => i.IsArray);
            query.SetFields(listfields.Select(i => i.MetaKey + ".*"));
        }
        return query;
    }
    static GetData(query, onsuccess, onerror) {
        application.httpClient.GetData(query, onsuccess, onerror);
    }
}
AppDataLayer.Queries = {};
AppDataLayer.Instance = new AppDataLayer();
AppDataLayer.Data = {};
class SearchParameters {
    static Ensure(obj, paramdictionary) {
        var r = new SearchParameters();
        if (!IsNull(paramdictionary)) {
            for (var key in paramdictionary) {
                r[key] = paramdictionary[key];
            }
        }
        for (var key in obj) {
            r[key] = obj[key];
        }
        return r;
    }
}
class View {
    constructor(Name, controller = null) {
        this.LayoutPath = "";
        this.Templates = {};
        this.Commands = {};
        this.Area = "";
        this.ViewBag = {};
        this.Controller = null;
        this.IsDirty = false;
        this.IsMultiInstance = false;
        this.LogicalModelName = "";
        this.Name = Name;
        this.Controller = controller;
    }
    CopyTemplates() {
        var me = this;
        var result = {};
        for (var key in me.Templates) {
            result[key] = me.Templates[key].Copy();
        }
        return result;
    }
    Close() {
        var me = this;
        var canclose = true;
        if (me.IsDirty) {
            canclose = confirm(Res("general.CloseUnsavedComfirmation"));
        }
        if (canclose) {
            _Hide(me.UIElement);
            me.UIElement.remove();
            var controller = application.GetController(me.Controller.ModelName);
            var instances = Object.keys(controller.Instances).Select(i => controller.Instances[i]);
            var vi = instances.FirstOrDefault(i => i.ViewModel == me);
            var viewhead = vi.UIElement;
            var prev = viewhead.previousElementSibling;
            var next = viewhead.previousElementSibling;
            var toshow = Coalesce(prev, next);
            vi.UIElement.remove();
            delete controller.Instances[vi.Id];
            if (toshow != null) {
                var vid = toshow.getAttribute("rel");
                var a = _SelectFirst("a", toshow);
                var href = a.getAttribute("href");
                window.location.hash = href;
            }
        }
        return canclose;
    }
    AddTemplate(extension, template) {
        this.Templates[extension] = template;
    }
    GetTemplate(extension) {
        return this.Templates[extension];
    }
    Bind(itemorselector, model, context, poptions = {}) {
        var me = this;
        var options = new BindOptions();
        for (var key in poptions) {
            options[key] = poptions[key];
        }
        if (IsNull(context)) {
            context = {};
        }
        if (!("view" in context)) {
            context["view"] = me;
        }
        var old = me.Templates[""];
        var viewtemplate = FirstNotNull(me.Templates[options.extension], old);
        var element = itemorselector;
        var rootelement = me.UIElement;
        var selector = "";
        if (typeof element == "string") {
            var selectors = itemorselector.split("!");
            selector = selectors.FirstOrDefault();
            element = _SelectFirst(selector, me.UIElement);
        }
        if (viewtemplate.Extension == "razor") {
            var f = viewtemplate.BindToFragment(model, context);
            if (!IsNull(selector) && !IsNull(element)) {
                var item = f.querySelector(selector);
                if (!options.map) {
                    element.innerHTML = "";
                }
                DomDiff.Map(element, item, options);
                element.setAttribute("layoutpath", viewtemplate.LayoutPath);
            }
            else {
                var ctnode = f.children.length == 1 ? item = f.children[0] : f;
                rootelement.innerHTML = "";
                var classes = ctnode.getAttribute("class");
                DomDiff.Map(rootelement, ctnode, options);
                rootelement.setAttribute("class", classes);
            }
        }
        else {
            var html = viewtemplate.Bind(model, context, options);
            element.innerHTML = html;
        }
        me.AfterBind();
    }
    static GetView(me, element) {
        var uselement = IsNull(me) || !(me instanceof View);
        return (uselement ? view(element) : me);
    }
    parameterstr() {
        var url = window.location.hash;
        var paths = url.split("\\");
        var p = "";
        if (paths.length > 2) {
            p = paths[paths.length - 1];
        }
        return p;
    }
    GetParameterDictionary(p = "") {
        p = IsNull(p) ? "" : p;
        if (p.length == 0) {
            p = this.parameterstr();
        }
        var result = { id: null, page: null, type: null };
        var parts = p.split('-');
        var namedparts = parts.Where(i => i.indexOf(":") > -1);
        var unnamedparts = parts.Where(i => i.indexOf(":") == -1);
        for (var i = 0; i < namedparts.length; i++) {
            var part = namedparts[i];
            var ix = part.indexOf(":");
            if (ix > -1) {
                var key = part.substring(0, ix);
                var value = part.substring(ix + 1);
                result[key] = value;
            }
        }
        if (unnamedparts.length == 1) {
            if (this.Name == "List") {
                result.page = unnamedparts[0];
            }
            else if (this.Name == "Create") {
                result.type = unnamedparts[0];
            }
            else {
                result.id = unnamedparts[0];
            }
        }
        else if (unnamedparts.length > 1) {
            result.type = unnamedparts[0];
            if (this.Name == "List") {
                result.page = unnamedparts[1];
            }
            else {
                result.id = unnamedparts[1];
            }
        }
        if (result.page == "") {
            result.page = 1;
        }
        return result;
    }
    SelectFirst(selector) {
        return _SelectFirst(selector, this.UIElement);
    }
    Identifier() {
        return "";
        //throw "Identifier Not Implemented on " + this.Name;
    }
    IsList() {
        return this.Name == "List" ? true : false;
    }
    FormatIdentifier(p, area = "") {
        return Format("{0}_{1}_{2}", this.Name, area, IsNull(p) ? "" : p);
    }
    Title() {
        //return this.LogicalModelName + "-" + this.Name;
        return Res("UI." + this.LogicalModelName + "-" + this.Name + "");
        //throw "Identifier Not Implemented on " + this.Name;
    }
    Copy() {
        var copy = new View(this.Name);
        copy.OriginalTemplateHtml = this.OriginalTemplateHtml;
        copy.LogicalModelName = this.LogicalModelName;
        copy.Templates = this.Templates;
        copy.TemplateHtml = this.TemplateHtml;
        copy.LayoutPath = this.LayoutPath;
        copy.ViewBag = this.ViewBag;
        copy.Controller = this.Controller;
        copy.Commands = this.Commands;
        return copy;
    }
    Action(p) {
    }
    BeforeBind() {
    }
    AfterBind(navigate = true) {
        var me = this;
    }
    Changed() {
        console.log("Changed");
    }
    BeforePrint(printarea) {
    }
    PageSize() {
        var me = this;
        var pagesizekey = Format("UI.{0}.{1}.PageSize", me.Controller.ModelName, me.Name);
        return FirstNotNull(Access(application.Settings, pagesizekey), application.Settings.PageSize);
    }
    SavePageSize(pagesize) {
        var me = this;
        var pagesizekey = Format("UI.{0}.{1}.PageSize", me.Controller.ModelName, me.Name);
        var parts = pagesizekey.split('.');
        var obj = application.Settings;
        for (var i = 0; i < parts.length - 1; i++) {
            var part = parts[i];
            if (!(part in obj)) {
                obj[part] = {};
            }
            obj = obj[part];
        }
        var lastpart = parts[parts.length - 1];
        obj[lastpart] = pagesize;
        application.SaveSettings();
    }
}
class ViewModel extends View {
    constructor(Name, controller = null) {
        super(Name, controller);
        this.Model = null;
        var me = this;
        var modelname = Coalesce(this.LogicalModelName, controller.ModelName);
        var viewurlformat = "#" + modelname + "\\" + Name + "\\{0}";
        //this.RegisterCommand(AppUICommand.Create("",["header"], "Close", "view(this).Close();"));
        //this.RegisterCommand(AppUICommand.Create("model[TypeName]",["header"], "Reload", "view(this).Action();"));
        controller.RegisterCommand(AppUICommand.Create("model[Id]", ["header", "item"], Name, viewurlformat, "v-"));
    }
    RegisterCommand(command) {
        var me = this;
        me.Commands[command.Prefix + command.Key] = command;
    }
    Copy() {
        var creator = eval("(function (obj,c) { return new obj.constructor(c);})");
        var copy = creator(this, this.Controller);
        copy.LayoutPath = this.LayoutPath;
        copy.TemplateHtml = this.TemplateHtml;
        copy.Templates = this.CopyTemplates();
        copy.ViewBag = this.ViewBag;
        copy.Controller = this.Controller;
        copy.OriginalTemplateHtml = this.OriginalTemplateHtml;
        copy.Model = this.Model;
        return copy;
    }
    AfterBind(navigate = true) {
        super.AfterBind(navigate);
        var me = this;
        if (me.UIElement != null) {
            var commandbar = _SelectFirst(".header app-commandbar", me.UIElement);
            if (commandbar != null) {
                commandbar.innerHTML = me.GetCommandbarContentHtml();
            }
            var datatable = _SelectFirst("[is=app-datatable]", me.UIElement);
            if (datatable != null) {
                if ("OnDataBound" in datatable) {
                    datatable["OnDataBound"]();
                }
            }
        }
    }
    GetCommandbarHtml(model) {
        var me = this;
        return me.GetCommandbarContentHtml(model);
        //var htmlbuilder = [];
        //htmlbuilder.push('<app-commandbar>');
        //htmlbuilder.push('<div class="flexcontent">');
        //htmlbuilder.push('</div>');
        //htmlbuilder.push('</app-commandbar>');
        //return htmlbuilder.join('\n');
    }
    GetCommandbarContentHtml(model) {
        var me = this;
        var htmlbuilder = [];
        var viewcommands = Object.keys(me.Commands).Select(i => me.Commands[i]);
        var controllercommands = Object.keys(me.Controller.Commands).Select(i => me.Controller.Commands[i]);
        var applicationcommands = Object.keys(application.Commands).Select(i => application.Commands[i]);
        controllercommands = controllercommands.Where(i => i.Key != me.Name);
        if (!IsNull(model)) {
            //listaction
            viewcommands = viewcommands.Where(i => i.AppearsIn.indexOf("item") > -1);
            controllercommands = controllercommands.Where(i => i.AppearsIn.indexOf("item") > -1 && i.Key != me.Name);
            applicationcommands = applicationcommands.Where(i => i.AppearsIn.indexOf("item") > -1 && i.Key != me.Name);
        }
        else {
            //headeraction
            viewcommands = viewcommands.Where(i => i.AppearsIn.indexOf("header") > -1);
            controllercommands = controllercommands.Where(i => i.AppearsIn.indexOf("header") > -1 && i.Key != me.Name);
            applicationcommands = applicationcommands.Where(i => i.AppearsIn.indexOf("header") > -1 && i.Key != me.Name);
        }
        var commands = viewcommands.concat(controllercommands).concat(applicationcommands);
        var allowedactions = me.Controller.GetModelFeatures().ListActions;
        if (allowedactions.length > 0 && !application.IsInDebugMode()) {
            commands = allowedactions.Select(i => commands.FirstOrDefault(c => c.Key == i)).Where(i => !IsNull(i));
        }
        var allowedviews = me.Controller.GetModelFeatures().Views;
        if (allowedviews.length > 0 && !application.IsInDebugMode()) {
            var commandsnotallowed = commands.Where(i => i.Prefix == "v-" && allowedviews.indexOf(i.Key) == -1);
            commandsnotallowed.forEach(c => RemoveFrom(c, commands));
        }
        var contextmodel = Coalesce(model, me.Model);
        commands.forEach(c => {
            if (c.IsInContext(contextmodel, me)) {
                htmlbuilder.push(c.Render(contextmodel, me));
            }
        });
        return htmlbuilder.join('\n');
    }
    DownloadModel() {
        var me = this;
        var datalink = Format('data:application/octet-stream;charset=utf-8,{0}', encodeURIComponent(JSON.stringify(me.Model, null, 4)));
        var dataname = Format("{0}-{1}.json", me.LogicalModelName, me.Name);
        download(dataname, datalink);
    }
    ShowValidationResults(results, item) {
        return __awaiter(this, void 0, void 0, function* () {
            var me = this;
            var control = _SelectFirst("app-validation", me.UIElement);
            if (control == null) {
                control = new App_Validation();
                control.classList.add("modal");
                var appheader = _SelectFirst("app-header", me.UIElement);
                control.TypeName = item["TypeName"];
                _Hide(control);
                appheader.appendChild(control);
            }
            var promise = new Promise((resolve, reject) => {
                if (results.length == 0) {
                    resolve(true);
                }
                else {
                    control.Load(results, (val) => {
                        resolve(val);
                    });
                }
            });
            return promise;
        });
    }
}
class DataList {
    constructor() {
        this.Items = [];
        this.Columns = [];
    }
}
class SaveViewModel extends ViewModel {
    constructor(Name, controller = null) {
        super(Name, controller);
        var viewurlformat = "#" + Coalesce(this.LogicalModelName, controller.ModelName) + "\\" + Name + "\\{0}";
        controller.RegisterCommand(AppUICommand.Create("model[Id]", ["item", "header"], Name, viewurlformat, "v-"));
        this.RegisterCommand(AppUICommand.Create("view[SavePost]", ["header"], "Save", "view(this).SavePost(this)", "a-"));
    }
    SaveDraft() {
        var me = this;
        var app = application;
        var model = me.Model;
        model["__SaveDate"] = new Date();
        model["__Id"] = IsNull(model["__Id"]) ? Guid() : model["__Id"];
        model["__UserId"] = app.Settings.Company["UserId"];
        model["__View"] = me.Controller.ModelName + "." + me.Name;
        app.SaveToClient(model, "Data", (obj) => {
            if ("error" in obj) {
                console.error(obj["error"]);
            }
        });
        //app.idb
    }
    LoadDraft(ondataload = null) {
        var me = this;
        var app = application;
        var xondataload = IsFunction(ondataload) ? ondataload : () => { me.Bind(me.UIElement, me.Model); };
        var viewkey = me.Controller.ModelName + "." + me.Name;
        app.GetFromClient("Data", (result) => {
            var item = result.OrderByDescending(i => i["__SaveDate"]).FirstOrDefault();
            me.Model = item;
            xondataload();
        }, (item) => item["__View"] == viewkey);
    }
}
class CreateViewModel extends SaveViewModel {
    constructor(Name, controller = null) {
        super(Name, controller);
        var viewurlformat = "#" + Coalesce(this.LogicalModelName, controller.ModelName) + "\\" + Name + "\\";
        controller.RegisterCommand(AppUICommand.Create("model[slice]", ["header"], Name, viewurlformat, "v-"));
    }
}
class ListViewModel extends ViewModel {
    constructor(Name, controller = null) {
        super(Name, controller);
        this._FilterUIElement = null;
        this.FilterQuery = null;
        this.UrlQuery = null;
        this.CustomQuery = null;
        this.CurrentQuery = null;
        this.QueryView = null;
        this.OriginalQueryView = null;
        this._Query = null;
        this._OriginalQuery = null;
        var viewcommand = AppUICommand.Create("model[Id]", ["header"], Name, "", "v-");
        viewcommand.Url = (model, view, command) => {
            var viewurl = "#" + Coalesce(view.LogicalModelName, view.Controller.ModelName) + "\\" + command.Key + "\\";
            return viewurl;
        };
        controller.RegisterCommand(viewcommand);
        if (application.IsInDebugMode()) {
            var editquery = AppUICommand.CreateFromHtml("EditQuery", (model) => {
                var text = Res("UI.Commands.a-EditQuery");
                return '<span class="icon i-f-PageListFilter" title="' + text + '" onclick="view(this).EditQuery()"><label>' + text + '</label></span>';
            });
            editquery.AppearsIn = ["header"];
            var isincontext = (model, view) => {
                var typedview = view;
                return view.Name == "List" && typedview.Query != null;
            };
            editquery.IsInContext = isincontext;
            var clearquery = AppUICommand.CreateFromHtml("ClearQuery", (model) => {
                var text = Res("UI.Commands.a-ClearQuery");
                return '<span class="icon i-f-RemoveFromShoppingList" title="' + text + '" onclick="view(this).ClearQuery()"><label>' + text + '</label></span>';
            });
            clearquery.AppearsIn = ["header"];
            clearquery.IsInContext = isincontext;
            controller.RegisterCommand(editquery);
            controller.RegisterCommand(clearquery);
        }
    }
    get Query() {
        return this._Query;
    }
    set Query(query) {
        this._Query = query;
        this._OriginalQuery = ClientQuery.New(JsonCopy(query));
    }
    IsList() {
        return true;
    }
    get FilterUIElement() {
        return this._FilterUIElement;
    }
    set FilterUIElement(value) {
        var me = this;
        this._FilterUIElement = value;
        var fstartsearch = function () {
            view(me._FilterUIElement)["Search"]();
        };
        if (!IsNull(me._FilterUIElement)) {
            var inputs = _Select("input[name]", me._FilterUIElement);
            me._FilterUIElement.addEventListener("keyup", function (e) {
                if (e.keyCode == 13) {
                    fstartsearch();
                }
            });
        }
    }
    AfterBind(navigate = false) {
        super.AfterBind(navigate);
    }
    Search(parameters = new SearchParameters()) { }
    EditQuery() {
        var me = this;
        var queryeditor = _SelectFirst("app-queryeditor", me.UIElement);
        if (IsNull(queryeditor)) {
            var head = _SelectFirst(".header", me.UIElement);
            if (!IsNull(head)) {
                var qe = new App_QueryEditor();
                qe.Execute = function (query) {
                    console.log(query);
                    me.QueryView = query;
                    me.Search();
                };
                qe.roottype = me.Controller.ModelName;
                var originalquery = me.Query;
                var modelfeatures = me.Controller.GetModelFeatures();
                if (modelfeatures != null) {
                    originalquery.UIColumns = modelfeatures.UIColumns;
                    originalquery.SetFields(modelfeatures.DataColumns);
                }
                else {
                    //originalquery.UIColumns = modelfeatures.UIColumns;
                }
                var query = FirstNotNull(me.QueryView, originalquery);
                qe.SetQuery(query);
                head.appendChild(qe);
            }
        }
    }
    ClearQuery() {
        var me = this;
        me.QueryView = null;
        me.Search();
    }
}
class ViewInstance {
}
class ModelController {
    constructor() {
        this.ModelName = "";
        this.NS = "";
        this.Container = function () { return null; };
        this.Views = [];
        this._ViewDictionary = null;
        this.Instances = {};
        this.ViewIconDictionary = {
            "Save": "entypo-pencil",
            "Label": "entypo-doc-text-inv",
            "Create": "entypo-doc-text-inv",
            "CreateFrom": "entypo-doc-text-inv",
            "Barcode": "icofont-barcode",
            "ProductionItemBarcode": "entypo-doc-text-inv",
            "Details": "entypo-eye",
            "Process": "entypo-thumbs-up",
            "Hierarchy": "entypo-flow-cascade",
            "Print": "entypo-print",
        };
        this._ActionsHtml = "";
        this.Features = {};
        this.Commands = {};
    }
    AddView(view) {
        var me = this;
        var existingview = me.Views.FirstOrDefault(i => i.Name == view.Name);
        if (!IsNull(existingview)) {
            RemoveFrom(existingview, me.Views);
        }
        me.Views.push(view);
        me._ViewDictionary == null;
    }
    get ViewDictionary() {
        var me = this;
        if (me._ViewDictionary == null) {
            me._ViewDictionary = {};
            me.Views.forEach(function (v) {
                me._ViewDictionary[v.Name] = v;
            });
        }
        return me._ViewDictionary;
    }
    RegisterActions() {
        var me = this;
    }
    Navigate(p) {
    }
    ShowView(vm) {
        var me = this;
        var viewelements = this.Container().children;
        for (var i = 0; i < viewelements.length; i++) {
            _Hide(viewelements[i]);
        }
        var e_header = _SelectFirst(".header", vm.UIElement);
        if (!IsNull(e_header)) {
            var e_actions = _SelectFirst(".view.actions", e_header);
            if (IsNull(e_actions)) {
                e_actions = _CreateElement("app-commandbar", { class: "view actions" });
                e_header.append(e_actions);
                var loadcommandbarf = () => {
                    if ("GetCommandbarHtml" in vm) {
                        return vm["GetCommandbarHtml"]();
                    }
                    return "";
                };
                e_actions =
                    e_actions.innerHTML = loadcommandbarf();
            }
            var model = Coalesce(vm["Model"], {});
        }
        _Show(vm.UIElement);
    }
    PrepareView(vm, p = null) {
    }
    SetViewUIElement(vm, viewinstanceid = "") {
        var me = this;
        if (IsNull(vm.TemplateHtml)) {
            console.log("TemplateHtml is null");
        }
        if (IsNull(vm.UIElement) && !IsNull(vm.TemplateHtml)) {
            var div = document.createElement('div');
            //div.innerHTML = vm.TemplateHtml.trim();
            var el = div.children.length == 1 ? div.children[0] : div;
            el.setAttribute("View", vm.Name);
            el.setAttribute("Controller", vm.Controller.ModelName);
            el.setAttribute("ViewID", viewinstanceid);
            vm.UIElement = el;
            _Hide(vm.UIElement);
            application.LoadContent(vm.UIElement);
            var changed = function (ev) {
                vm.IsDirty = true;
                vm.Changed();
                var id = vm.Identifier();
                var el = ev.target;
                if (el.tagName == "INPUT") {
                    el.setAttribute("value", el.value);
                }
                if (id in me.Instances) {
                    var vi = me.Instances[id];
                    //vi.UIHtml = vi.ViewModel.UIElement.innerHTML;
                    //Log("Viewinstance html updated for  " + vi.Id + " ");
                }
                //console.log(Format("{0}:{1} IsDirty:{2}", vm.Controller.ModelName, vm.Name, vm.IsDirty));
            };
            //TODO
            if (In(vm.Name, "Save", "Process")) {
                vm.UIElement.addEventListener("DOMSubtreeModified", function () {
                    var bindings = _Select("[bind]", vm.UIElement);
                    bindings.forEach(function (b) {
                        b.removeEventListener("change", changed);
                        b.addEventListener("change", changed);
                    });
                });
            }
            //Log("SetViewUIElement");
        }
    }
    Load(vm, p, modeltypename, area) {
        var me = this;
        return me.Open(vm, p, modeltypename, area);
    }
    Download(name, waiter) {
    }
    Open(vm, p, modeltypename, area) {
        console.log(Format("Open {0}.{1}", vm.Controller.ModelName, vm.Name));
        var me = this;
        var logicalmodelname = IsNull(modeltypename) ? me.ModelName : modeltypename;
        var container = document.querySelector(".viewinstances");
        var newinstanceneeded = false;
        var loadneeded = false;
        var vi_id = me.GetViewInstanceId(vm, p, logicalmodelname, area);
        var vi = null;
        if (vi_id in me.Instances) {
            vi = me.Instances[vi_id];
            me.ShowView(vi.ViewModel);
            loadneeded = JSON.stringify([area, vi.Parameters]) != JSON.stringify([area, p]);
            var viewhead = _SelectFirst(".viewinstances [rel='" + vi.Id + "']");
            if (!loadneeded && !IsNull(viewhead)) {
                SelectElement(container, viewhead);
            }
            vm = vi.ViewModel;
            vm.Area = area;
            console.log("Instance found");
        }
        else {
            loadneeded = true;
            newinstanceneeded = vm.Name.toLowerCase() == "list" ? false : true;
            if (vm.LogicalModelName != logicalmodelname) {
                newinstanceneeded = true;
            }
            if (newinstanceneeded) {
                vm = vm.Copy();
                vm.Area = area;
            }
            vm.LogicalModelName = logicalmodelname;
            me.PrepareView(vm, p);
            me.SetViewUIElement(vm, vi_id);
            vi = me.CreateViewInstance(vm, logicalmodelname, p, vi_id, area);
            var afterbind = vm.AfterBind;
            vm.AfterBind = function (navigate = true) {
                afterbind.apply(vm, [navigate]);
                if (navigate) {
                    me.SetUIViewInstance(vi);
                    me.ShowView(vm);
                }
                //HideProgress("BaseModelController");
            };
            console.log("Instance not found");
        }
        if (loadneeded) {
            //ShowProgress("BaseModelController");
            vi.Parameters = p;
            vm.Action(p);
        }
        return vm;
    }
    GetViewInstanceId(vm, p, logicalmodelname, area) {
        var me = this;
        var vi_id = "";
        if (vm.Name.toLowerCase() == "list") {
            //vi_id = Format("{0}-{1}-", logicalmodelname, vm.Name);
            vi_id = Format("{0}-{1}", logicalmodelname, vm.FormatIdentifier(p, area));
        }
        else {
            //vi_id = Format("{0}-{1}-{2}", logicalmodelname, vm.Name, JSON.stringify(p).replace(/"/g, ''));
            vi_id = vm.FormatIdentifier(p, area);
        }
        return vi_id;
    }
    CreateViewInstance(vm, logicalmodelname, p, id, area = "") {
        var vi = new ViewInstance();
        vi.Title = vm.Title();
        vi.Id = id;
        vi.Parameters = p;
        vi.LogicalModelName = logicalmodelname;
        vi.ViewModel = vm;
        vi.Url = Format("#{0}\\{1}\\{2}", logicalmodelname, vm.Name, IsNull(p) ? "" : p);
        if (area.length > 0) {
            vi.Url = Format("#{0}\\{1}\\{2}\\{3}", area, logicalmodelname, vm.Name, IsNull(p) ? "" : p);
        }
        this.Instances[id] = vi;
        return vi;
    }
    AddViewInstance(vi, onclose) {
        var container = document.querySelector(".viewinstances");
        var div = document.createElement("div");
        div.innerHTML = "<div rel='" + vi.Id + "'><a href='" + vi.Url + "' >" + vi.Title + "</a><span  class='delete icon entypo-cancel'></span></div>";
        var viewhead = div.childNodes[0];
        var anchor = viewhead.childNodes[0];
        anchor.addEventListener("click", function () {
            container.classList.remove("pop");
            SelectElement(container, viewhead);
        });
        container.appendChild(viewhead);
        vi.UIElement = viewhead;
        var closebutton = _SelectFirst(".icon", viewhead);
        closebutton.addEventListener("click", function () {
            onclose();
            return false;
        });
        container.scrollLeft = container.scrollWidth;
    }
    SetUIViewInstance(vi) {
        var me = this;
        vi.Title = vi.ViewModel.Title();
        var existing = _SelectFirst(".viewinstances [rel=\"" + vi.Id + "\"] > a");
        if (IsNull(existing)) {
            me.AddViewInstance(vi, function () {
                var canclose = true;
                canclose = vi.ViewModel.Close();
                return canclose;
            });
        }
        else {
            existing.setAttribute("href", window.location.hash);
        }
        var container = document.querySelector(".viewinstances");
        var viewhead = _SelectFirst(".viewinstances [rel=\"" + vi.Id + "\"]");
        SelectElement(container, viewhead);
    }
    GetModelFeatures() {
        var me = this;
        var featurekey = application.IsAdmin() ? "Admin" : "_";
        if (!IsNull(me.Features[featurekey])) {
            return me.Features[featurekey];
        }
        var result = new ModelFeatures();
        var allowed = "Models" in application.Settings.AllowedFeatures ? application.Settings.AllowedFeatures["Models"] : null;
        if (application.IsAdmin()) {
            var adminallowed = "AdminModels" in application.Settings.AllowedFeatures ? application.Settings.AllowedFeatures["AdminModels"] : null;
            for (var key in adminallowed) {
                allowed[key] = adminallowed[key];
            }
        }
        if (allowed != null) {
            if (me.ModelName in allowed) {
                var features = allowed[me.ModelName];
                for (var key in features) {
                    result[key] = features[key];
                    if (key == "UIFilters") {
                        var filters = result[key];
                        filters.forEach(function (filter) {
                            filter["ModelContext"] = me.ModelName;
                        });
                    }
                }
                me.Features[featurekey] = result;
            }
        }
        return result;
    }
    RegisterCommand(command) {
        var me = this;
        me.Commands[command.Key] = command;
    }
    UnRegisterCommand(key) {
        var me = this;
        delete me.Commands[key];
    }
    GetControllerSpecificActions(model) {
        return [];
    }
    TransformActionHtml(action, model, html, area) {
        return html;
    }
    DefaultListAction() {
        var me = this;
        var features = me.GetModelFeatures();
        return "DefaultListAction" in features ? features["DefaultListAction"] : "Details";
    }
    DefaultUrl(id) {
        var me = this;
        var url = Format("#{0}\\{1}\\{2}", me.ModelName, me.DefaultListAction(), id);
        return url;
    }
}
class HttpClient {
    constructor() {
        this.EntryPointBase = "";
        this.token = "";
        this.OnResponse = function (url) {
            Tasks.EndTask(url);
        };
        this.OnRequest = function (url) {
            Tasks.StartTask(url);
        };
        this.OnError = function (xhttp) {
            var me = this;
            var url = xhttp["RequestUrl"].replace(this.EntryPointBase, "~");
            var errormessage = xhttp.responseText;
            try {
                var responseobj = JSON.parse(xhttp.response);
                console.log(responseobj);
                if (url.indexOf("?query=MultiData&") > -1) {
                    var keys = Object.keys(responseobj);
                    var keyedobjlist = keys.Select(i => {
                        responseobj[i]["Multikey"] = i;
                        return responseobj[i];
                    });
                    var responsewitherror = keyedobjlist.FirstOrDefault((i) => i.Errors.length > 0);
                    if (responsewitherror != null) {
                        let firsterror = responsewitherror.Errors.FirstOrDefault();
                        errormessage = responsewitherror["Multikey"] + ': ' + firsterror["Message"];
                    }
                }
                if ("Message" in responseobj && !("Errors" in responseobj)) {
                    errormessage = responseobj["Message"];
                }
                if ("Errors" in responseobj) {
                    let firsterror = responseobj.Errors.FirstOrDefault();
                    if (IsObject(firsterror)) {
                        if ("Message" in firsterror) {
                            errormessage = firsterror["Message"];
                        }
                    }
                    else {
                        errormessage = firsterror;
                    }
                }
            }
            catch (ex) {
            }
            Toast_Error("Request failed (" + xhttp.status + ")", url + ":\r\n" + errormessage);
            Log("Request failed (" + xhttp.status + ")", url + ":\r\n" + errormessage);
        };
    }
    GetUrl(url) {
        //var xurl = url.indexOf("~/") == 0 ? this.EntryPointBase + url.substr(2) : url;
        var xurl = url.indexOf("~") == 0 ? this.EntryPointBase + url.substr(1) : url;
        return xurl;
    }
    setHeaders(request, headers) {
        if (!IsNull(this.token)) {
            request.setRequestHeader("Authorization", "Bearer " + this.token);
        }
        var webserviceid = GetParameter("WebServiceIdentifier");
        var urlParams = new URLSearchParams(window.location.search);
        var urlwsid = urlParams.get("WebServiceIdentifier");
        var wsid = Coalesce(urlwsid, webserviceid);
        request.setRequestHeader("WebServiceIdentifier", wsid);
        for (var key in headers) {
            request.setRequestHeader(key, headers[key]);
        }
        request.setRequestHeader("Domain", application.Settings.Domain);
    }
    Get(url, header, onSuccess, onError) {
        var me = this;
        var xurl = this.GetUrl(url);
        var xhttp = new XMLHttpRequest();
        onError = IsNull(onError) ? this.OnError : onError;
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                me.OnResponse(xurl);
                if (this.status == 200) {
                    onSuccess(this);
                }
                else {
                    onError.call(me, this);
                }
            }
        };
        xhttp["RequestUrl"] = xurl;
        xhttp["OriginalRequestUrl"] = url;
        xhttp.open("GET", xurl, true);
        this.setHeaders(xhttp);
        for (var key in header) {
            xhttp.setRequestHeader(key, header[key]);
        }
        me.OnRequest(xurl);
        xhttp.send();
        return xhttp;
    }
    Decompress(data) {
        var Model = [];
        var mainfielddictinary = data["ViewData"]["FieldDictionary[]"];
        data["Model"].forEach(function (item) {
            var modelitem = RestoreModel(item, mainfielddictinary);
            for (var key in modelitem) {
                var fielddictionarykey = "FieldDictionary[" + key + "]";
                var listdictionary = data["ViewData"][fielddictionarykey];
                var list = modelitem[key];
                if (IsArray(list) && !IsNull(listdictionary)) {
                    var items = [];
                    list.forEach(function (listitem) {
                        items.push(RestoreModel(listitem, listdictionary));
                    });
                    modelitem[key] = items;
                }
            }
            Model.push(modelitem);
        });
        return Model;
    }
    GetMultiData(queries, onSuccess, onError, cachemaxage = 0) {
        var me = this;
        var xurl = this.GetUrl("~/webui/api/xclientquery/?query=MultiData");
        if (cachemaxage == 0) {
            xurl = xurl + "&dt=" + Guid();
        }
        var xhttp = new XMLHttpRequest();
        onError = IsNull(onError) ? this.OnError : onError;
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                me.OnResponse(xurl);
                if (this.status == 200) {
                    var data = JSON.parse(this.responseText);
                    for (var key in data) {
                        var ix = key.substring(key.indexOf("|") + 1);
                        data[key].Model = me.Decompress(data[key]);
                        data[ix] = data[key];
                    }
                    onSuccess(data);
                }
                else {
                    onError.call(me, this);
                }
            }
        };
        xhttp["RequestUrl"] = xurl;
        xhttp.open("POST", xurl, true);
        this.setHeaders(xhttp);
        //xhttp.setRequestHeader("ClientQueries", encodeURIComponent(JSON.stringify(queries)))
        xhttp.setRequestHeader("Content-Type", "application/json");
        xhttp.setRequestHeader("CanCache", Format("{0}", cachemaxage));
        me.OnRequest(xurl);
        //xhttp.send();
        var data = queries;
        xhttp.send(data instanceof Array ? JSON.stringify(data) : data);
        //var fdata = { ClientQueries: encodeURIComponent(JSON.stringify(queries)) };
        //xhttp.send(JSON.stringify(fdata));
        return xhttp;
    }
    GetData(query, onSuccess, onError, cachemaxage = 0) {
        var me = this;
        var xurl = this.GetUrl("~/webui/api/xclientquery/?query=" + query.QueryName);
        if (cachemaxage == 0) {
            xurl = xurl + "&dt=" + Guid();
        }
        var xhttp = new XMLHttpRequest();
        xhttp["Query"] = query;
        onError = IsNull(onError) ? this.OnError : onError;
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                me.OnResponse(xurl);
                if (this.status == 200) {
                    var data = JSON.parse(this.responseText);
                    data.Model = me.Decompress(data);
                    onSuccess(data);
                }
                else {
                    console.log(this["Query"]);
                    onError.call(me, this);
                }
            }
        };
        xhttp["RequestUrl"] = xurl;
        xhttp.open("GET", xurl, true);
        this.setHeaders(xhttp);
        xhttp.setRequestHeader("ClientQuery", encodeURIComponent(JSON.stringify(query)));
        xhttp.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        xhttp.setRequestHeader("CanCache", Format("{0}", cachemaxage));
        me.OnRequest(xurl);
        xhttp.send();
        return xhttp;
    }
    Post(url, data, onSuccess, onError, contenttype, marker = "") {
        var me = this;
        var xurl = this.GetUrl(url);
        var xhttp = new XMLHttpRequest();
        onError = IsNull(onError) ? this.OnError : onError;
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                me.OnResponse(xurl);
                if (this.status == 200) {
                    onSuccess(this);
                }
                else {
                    onError.call(me, this);
                }
            }
        };
        xhttp["RequestUrl"] = xurl;
        xhttp["marker"] = marker;
        xhttp.open("POST", xurl, true);
        if (!IsNull(contenttype)) {
            xhttp.setRequestHeader("Content-Type", contenttype);
        }
        this.setHeaders(xhttp);
        me.OnRequest(xurl);
        xhttp.send(data instanceof Object ? JSON.stringify(data) : data);
        return xhttp;
    }
    PostOld(url, data, onSuccess, onError, contenttype, headers) {
        var me = this;
        var xurl = this.GetUrl(url);
        var xhttp = new XMLHttpRequest();
        onError = IsNull(onError) ? this.OnError : onError;
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                me.OnResponse(xurl);
                if (this.status == 200) {
                    onSuccess(this);
                }
                else {
                    onError.call(me, this);
                }
            }
        };
        xhttp["RequestUrl"] = xurl;
        xhttp.open("POST", xurl, true);
        if (!IsNull(contenttype)) {
            xhttp.setRequestHeader("Content-Type", contenttype);
        }
        xhttp.setRequestHeader("query", data.get("query"));
        if (!IsNull(data.get("options"))) {
            xhttp.setRequestHeader("options", data.get("options"));
        }
        this.setHeaders(xhttp, headers);
        me.OnRequest(xurl);
        xhttp.send(data);
        return xhttp;
    }
    Put(url, data, onSuccess, onError, contenttype = "application/json", marker = "") {
        var me = this;
        var xurl = this.GetUrl(url);
        var xhttp = new XMLHttpRequest();
        onError = IsNull(onError) ? this.OnError : onError;
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                me.OnResponse(xurl);
                if (this.status == 200) {
                    onSuccess(this);
                }
                else {
                    onError.call(me, this);
                }
            }
        };
        xhttp["RequestUrl"] = xurl;
        xhttp["marker"] = marker;
        xhttp.open("PUT", xurl, true);
        if (!IsNull(contenttype)) {
            xhttp.setRequestHeader("Content-Type", contenttype);
        }
        this.setHeaders(xhttp);
        me.OnRequest(xurl);
        xhttp.send(data);
        return xhttp;
    }
    Authenticate(success, failure, credentials = {}) {
        var me = this;
        var onerror = function (err) {
            me.OnError(err);
            if (failure != null) {
                failure();
            }
        };
        var webserviceid = Coalesce(credentials["WebServiceIdentifier"], GetParameter("WebServiceIdentifier"));
        var uname = Coalesce(credentials["UserName"], GetParameter("UserName"));
        var pw = Coalesce(credentials["Password"], GetParameter("Password"));
        var urlParams = new URLSearchParams(window.location.search);
        var urlwsid = urlParams.get("WebServiceIdentifier");
        //var wsid = Coalesce(webserviceid, urlwsid);
        var wsid = Coalesce(urlwsid, webserviceid);
        if (IsNull(wsid) && IsNull(uname)) {
            Toast_Error("Please provide the Username or WSI");
            failure();
            return;
        }
        var me = this;
        var form = {};
        form["WebServiceIdentifier"] = wsid;
        form["UserName"] = uname;
        form["Password"] = pw;
        var isautenticated = false;
        //var tokend = new Date(localStorage.getItem("uitokend"));
        //if (Date.now() < tokend.getTime()) {
        //    isautenticated = true;
        //}
        if (!isautenticated) {
            this.Post("~/webui/api/xauthenticate", JSON.stringify(form), function (xhttp) {
                var ok = true;
                var resp = null;
                try {
                    resp = JSON.parse(xhttp.responseText);
                }
                catch (ex) {
                    ok = false;
                    ex["RequestUrl"] = xhttp["RequestUrl"];
                    ex["responseText"] = "Invalid JSON Response";
                    onerror(ex);
                }
                if (ok) {
                    let token = Access(resp, "Model.Token");
                    if (!IsNull(token)) {
                        me.token = token;
                    }
                    if (IsNull(webserviceid)) {
                        SetParameter("WebServiceIdentifier", urlwsid);
                    }
                    var d = new Date();
                    d.setTime(d.getTime() + 6 * 60 * 60 * 1000);
                    localStorage.setItem("uitokend", d.toString());
                    success(resp);
                }
            }, onerror, "application/json");
        }
        else {
            success();
        }
    }
}
function modelobj(element) {
    var result = null;
    var itemelement = _Parents(element).FirstOrDefault(i => i.classList.contains("item"));
    var v = view(element);
    if (v.IsList() && itemelement != null) {
        var items = v.Model;
        var uiitems = GetBoundObject(itemelement);
        var itemid = uiitems["Id"];
        if (!IsNull(itemid)) {
            var item = items.FirstOrDefault(i => i["Id"] == itemid);
            result = item;
        }
    }
    return result;
}
function view(element) {
    var isview = (item) => item == null ? null : item.hasAttribute("View");
    if (isview(element)) {
        var controllername = element.getAttribute("Controller");
        var viewname = element.getAttribute("View");
        var viewid = element.getAttribute("ViewID");
        return application.GetView(controllername, viewname, viewid);
    }
    else {
        if (IsNull(element.parentElement)) {
            return null;
        }
        else {
            return view(element.parentElement);
        }
    }
}
function controller(element) {
    var isview = (item) => item == null ? null : item.hasAttribute("View");
    if (isview(element)) {
        var controllername = element.getAttribute("Controller");
        var viewname = element.getAttribute("View");
        var viewid = element.getAttribute("ViewID");
        var view = application.GetView(controllername, viewname, viewid);
        return view.Controller;
    }
    else {
        if (IsNull(element.parentElement)) {
            return null;
        }
        else {
            return controller(element.parentElement);
        }
    }
}
/// <reference path="appmodels.ts" />
var BaseModel;
(function (BaseModel) {
    class List extends ListViewModel {
        Identifier() {
            return Format("{0}_{1}", this.Name, "");
        }
        Title() {
            return Format("{0}", Res("models." + this.LogicalModelName + ".Plural"));
        }
        FormatIdentifier(p) {
            return Format("{0}_{1}", this.Name, "");
        }
        constructor(controller) {
            super("List", controller);
            var me = this;
        }
        Switch() {
            var me = this;
            me.FilterUIElement = null;
        }
        Action(p) {
            var me = this;
            var parameters = me.GetParameterDictionary(page);
            var page = parameters.page;
            page = isNaN(page) ? 1 : page;
            var viewmodel = this;
            if (me.FilterUIElement == null) {
                var filters = [
                    {
                        Field: "Name",
                        Type: "Text",
                    }
                ];
                var filterelement = _SelectFirst(".header", viewmodel.UIElement);
                var listelement = _SelectFirst(".generallist", viewmodel.UIElement);
                me.Bind(me.UIElement, {}, { "Filters": filters });
                me.FilterUIElement = _SelectFirst(".filter", viewmodel.UIElement);
            }
            this.Search(page);
        }
        Search(parameters = {}) {
            var me = this;
            var viewmodel = this;
            parameters = SearchParameters.Ensure(parameters, me.GetParameterDictionary());
            var page = Coalesce(parameters.page, 1);
            var pagesize = me.PageSize();
            var filterelement = _SelectFirst(".filter", me.UIElement);
            var filters = GetFiltersFromUI(filterelement);
            var query = Coalesce(AppDataLayer.GetQueryByName(me.LogicalModelName + me.Name), AppDataLayer.CreateListQueryByName(me.LogicalModelName));
            query.SetFilters(filters);
            query.GetCount = true;
            query.Skip = (page - 1) * pagesize;
            query.Take = pagesize;
            var pageroptions = {
                page: page,
                pagesize: pagesize,
                urlformat: "#" + me.LogicalModelName + "\\List\\{0}"
            };
            //ShowProgress();
            //return;
            Dependencies.httpClient.GetData(query, function (r) {
                var data = r;
                var items = data["Model"];
                var count = data["ViewData"]["Count"];
                me.Model = items;
                me.Bind(".generallist", me.Model);
                //BindX(voucherlistelement, items);
                pageroptions["total"] = count;
                CreatePager(_SelectFirst(".pager", viewmodel.UIElement), pageroptions);
                //HideProgress();
                if (!IsNull(filterelement)) {
                    _AddClass(_SelectFirst('.items.list', filterelement), "hidden");
                }
                var tableelement = _SelectFirst("table", me.UIElement);
                resizableGrid(tableelement);
            }, null);
        }
    }
    BaseModel.List = List;
    class Details extends ViewModel {
        constructor(controller) {
            super("Details", controller);
            this.IsMultiInstance = false;
        }
        Identifier() {
            return Format("{0}_{1}", this.Name, this.Model.Id);
        }
        Title() {
            return Format("{0}", this.Model == null ? "" : this.Model.Name);
        }
        Action(p) {
            var viewmodel = this;
            var me = this;
            var query = AppDataLayer.CreateDetailsQueryByName(me.LogicalModelName, Format("{0}", p));
            var meta = GetMetaByTypeName(me.LogicalModelName);
            var dmeta = {
                SimpleFields: [],
                ListFields: [],
                ObjectFields: [],
                IdFields: [],
                TypeName: me.LogicalModelName
            };
            dmeta.IdFields = meta.Fields.Where(i => i.MetaKey.endsWith("Id"));
            dmeta.ObjectFields = meta.Fields.Where(i => i.SourceType.endsWith("{}"));
            dmeta.ListFields = meta.Fields.Where(i => i.SourceType.endsWith("[]"));
            dmeta.SimpleFields = meta.Fields.Where(i => dmeta.IdFields.indexOf(i) == -1
                && dmeta.ListFields.indexOf(i) == -1
                && dmeta.ObjectFields.indexOf(i) == -1);
            var load = function () {
                //BindX(viewmodel.UIElement, me.Model);
                me.Bind(viewmodel.UIElement, me.Model, { meta: dmeta });
            };
            if (!IsNull(me.Model) && me.Model.Id == parseInt(p.toString())) {
                load();
            }
            else {
                Dependencies.httpClient.GetData(query, function (r) {
                    me.Model = r.Model.FirstOrDefault();
                    load();
                }, null);
            }
        }
    }
    BaseModel.Details = Details;
    class Controller extends ModelController {
        constructor() {
            super();
            var me = this;
            this.ModelName = "BaseModel";
            this.Views = [
                new BaseModel.List(me),
                new BaseModel.Details(me),
            ];
            this.Views.forEach(function (v) {
                v.Controller = me;
            });
        }
        PrepareView(vm) {
            var me = this;
            var vmx = vm;
            vmx.Query = AppDataLayer.GetQueryByName(vmx.LogicalModelName + vmx.Name);
            if (vmx.Query == null) {
            }
            //vm.TemplateHtml = vmx.GenerateTemplateHtml(null);
        }
        Load(vm, p, modeltypename, area) {
            var me = this;
            return me.Open(vm, p, modeltypename, area);
        }
        IsAvailable(logicalmodelname) {
            var me = this;
            var result = true;
            var listquery = Format("{0}List", logicalmodelname);
            var detailsquery = Format("{0}Details", logicalmodelname);
            var meta = GetMetaByTypeName(logicalmodelname);
            if (IsNull(meta)) {
                result = false;
            }
            //result = IsNull(Dependencies.DataLayer.GetQueryByName(listquery)) ? false : result;
            //result = IsNull(Dependencies.DataLayer.GetQueryByName(detailsquery)) ? false : result;
            return result;
        }
    }
    BaseModel.Controller = Controller;
})(BaseModel || (BaseModel = {}));
RegisterController(application, () => new BaseModel.Controller());
var Common;
(function (Common) {
    var Contact;
    (function (Contact) {
        class MessageCollection {
            constructor() {
                this.Incoming = [];
                this.Outgoing = [];
            }
            get All() {
                return this.Incoming.concat(this.Outgoing);
            }
        }
        Contact.MessageCollection = MessageCollection;
        class Details extends ViewModel {
            Identifier() {
                return Format("{0}_{1}", this.Name, "");
            }
            Title() {
                return Format("{0}", Res("UI.Contact.Title"));
            }
            FormatIdentifier(p) {
                return Format("{0}_{1}", this.Name, "");
            }
            constructor(controller) {
                super("Details", controller);
            }
            Action(p) {
                var viewmodel = this;
                var me = this;
                var headerelement = _SelectFirst(".header", viewmodel.UIElement);
                me.Bind(me.UIElement, {});
                //BindX(headerelement, {});
                //var filterelements = _Select(".filter", me.UIElement);
                //filterelements.forEach(function (filterelement) {
                //    BindX(filterelement, {});
                //});
                //var tabhead = _SelectFirst(".heads", me.UIElement);
                //BindX(tabhead, {});
                this.Search();
            }
            DF_Companies(txt, callback) {
                var me = this;
                var query = AppDataLayer.Queries.CompanyList;
                var wsfilter = ClientFilter.Create(UIDataType.Number, "WebserviceUserId", "{NULL}").FirstOrDefault();
                wsfilter.Operator = "IS NOT";
                query.SetFilter(wsfilter);
                query.Take = 10;
                AppDataLayer.DataLookupByQuery(txt, query, ["Name"], callback);
            }
            Search(tag = "") {
                var me = this;
                var viewmodel = this;
                var listelement = _SelectFirst(".body", viewmodel.UIElement);
                //_Hide(voucherlistelement);
                //ShowProgress();
                var query = AppDataLayer.CreateListQueryByName("AppMessage");
                query.GetCount = true;
                var incomingquery = ClientQuery.New(JsonCopy(query));
                var outgoingquery = ClientQuery.New(JsonCopy(query));
                var userid = application.Settings.Company["Id"];
                var incomingfilter = ClientFilter.Create(UIDataType.Number, "TargetUserId", [userid]);
                var outgoingfilter = ClientFilter.Create(UIDataType.Number, "CreatedByUserId", [userid]);
                incomingquery.SetFilters(incomingfilter);
                outgoingquery.SetFilters(outgoingfilter);
                if (IsNull(tag)) {
                    me.LoadList(incomingquery, ".tab[name=incoming]", model => me.Model.Incoming = model);
                    me.LoadList(outgoingquery, ".tab[name=outgoing]", model => me.Model.Outgoing = model);
                }
                else {
                    if (tag == "Incoming") {
                        me.LoadList(incomingquery, ".tab[name=incoming]", model => me.Model.Incoming = model);
                    }
                    if (tag == "Outgoing") {
                        me.LoadList(outgoingquery, ".tab[name=outgoing]", model => me.Model.Outgoing = model);
                    }
                }
                me.Model = new MessageCollection();
                me.AfterBind();
            }
            LoadList(query, selector, setmodel, page = 1) {
                var me = this;
                var pagesize = me.PageSize();
                var pageroptions = {
                    page: page,
                    pagesize: pagesize,
                    onclick: function (p) {
                        me.LoadList(query, selector, setmodel, p);
                    }
                };
                var filterelement = _SelectFirst(selector + " .filter", me.UIElement);
                var uifilters = GetFiltersFromUI(filterelement);
                query.SetFilters(uifilters);
                query.Skip = (page - 1) * pagesize;
                query.Take = pagesize;
                AppDependencies.httpClient.GetData(query, function (r) {
                    var messages = r.Model;
                    var count = r.ViewData["Count"];
                    setmodel(messages);
                    me.Bind(selector + " .generaltable", messages);
                    pageroptions["total"] = count;
                    CreatePager(_SelectFirst(selector + " .pager", me.UIElement), pageroptions);
                    //me.AfterBind();
                });
            }
            CloseElement(element) {
                var msg = _Parents(element).FirstOrDefault(i => i.classList.contains("msg"));
                if (msg != null) {
                    var modal = _SelectFirst(".modal", view(element).UIElement);
                    _Hide(modal);
                    _Hide(msg);
                }
            }
            NewMessage(msg) {
                var me = this;
                var newmessage = _SelectFirst(".modal .msg.new", me.UIElement);
                var modal = _SelectFirst(".modal", me.UIElement);
                if (application.Settings.Company["WebserviceUserId"] != 1) {
                    var tofield = _SelectFirst(".field.to", newmessage);
                    _Hide(tofield);
                }
                var companycontrol = _SelectFirst(".company.autocomplete", newmessage);
                me.Bind(".modal .msg.new", FirstNotNull(msg, {}));
                companycontrol.connectedCallback();
                _Show(newmessage);
                _Show(modal);
            }
            ViewMessage(id) {
                var me = this;
                var viewmessage = _SelectFirst(".modal .msg.view", me.UIElement);
                var modal = _SelectFirst(".modal", me.UIElement);
                var msg = me.Model.All.FirstOrDefault(i => i.Id == id);
                me.Bind(".modal .msg.view", msg);
                _Show(viewmessage);
                _Show(modal);
            }
            ReplyTo(id) {
                var me = this;
                var viewmessage = _SelectFirst(".modal .msg.view", me.UIElement);
                var msg_original = me.Model.All.FirstOrDefault(i => i.Id == id);
                var msg_reply = new Models.AppMessage();
                msg_reply.ParentId = msg_original.Id;
                msg_reply.Subject = Format("Re: {0}", msg_original.Subject);
                msg_reply.TargetUserId = msg_original.CreatedByUserId;
                msg_reply.ToName = msg_original.FromName;
                _Hide(viewmessage);
                me.NewMessage(msg_reply);
            }
            SendMessage() {
                var me = this;
                var modal = _SelectFirst(".modal", me.UIElement);
                var message = _SelectFirst(".msg.new", modal);
                var msg = GetBoundObject(modal);
                var command = GetUpdateCommand(msg, "AppMessage", "INSERT");
                var tbcompany = _SelectFirst(".autocomplete.company .textbox", message);
                command["ToName"] = tbcompany.placeholder;
                command["Keys"] = "Id";
                var commands = [command];
                AppDependencies.httpClient.Post("~/webui/api/xclientcommand", JSON.stringify(commands), function (xhttp) {
                    var response = JSON.parse(xhttp.responseText);
                    var model = response.Model.FirstOrDefault();
                    if (!IsNull(model)) {
                        model = model["Model"];
                    }
                    var id = model["Value"];
                    if (id > 0) {
                        Toast_Success(Res("UI.Contact.MessageSent"), "");
                        me.Search();
                    }
                }, null, "application/json");
                _Hide(message);
                _Hide(modal);
            }
        }
        Contact.Details = Details;
        class Feedback extends ViewModel {
            Identifier() {
                return Format("{0}_{1}", this.Name, "");
            }
            Title() {
                return Format("{0}", Res("UI.Contact.Title"));
            }
            FormatIdentifier(p) {
                return Format("{0}_{1}", this.Name, "");
            }
            constructor(controller) {
                super("Feedback", controller);
            }
            Action(p) {
                var viewmodel = this;
                var me = this;
                var headerelement = _SelectFirst(".header", viewmodel.UIElement);
                me.Bind(me.UIElement, {});
            }
            SavePost() {
                //xnotify Email,Email,Body
            }
            SendMessage() {
                var me = this;
                var modal = _SelectFirst(".modal", me.UIElement);
                var message = _SelectFirst(".msg.new", modal);
                var msg = GetBoundObject(modal);
                var subject = msg["Subject"];
                var content = msg["Content"];
                msg["Email"] = "vladi@live.com";
                msg["Body"] = content;
                AppDependencies.httpClient.Post("~/webui/api/xnotify", JSON.stringify(msg), function (xhttp) {
                    var response = JSON.parse(xhttp.responseText);
                    var model = response.Model.FirstOrDefault();
                    //if (!IsNull(model)) { model = model["Model"]; }
                    //var id = model["Value"];
                    //if (id > 0) {
                    Toast_Success(Res("UI.Contact.MessageSent"), "");
                    //}
                }, null, "application/json");
            }
        }
        Contact.Feedback = Feedback;
        class Controller extends ModelController {
            constructor() {
                super();
                var me = this;
                this.ModelName = "Contact";
                this.Views = [
                    new Contact.Details(me),
                    new Contact.Feedback(me)
                    //new Contact.Save(me), 
                ];
                this.Views.forEach(function (v) {
                    v.Controller = me;
                });
            }
        }
        Contact.Controller = Controller;
    })(Contact = Common.Contact || (Common.Contact = {}));
})(Common || (Common = {}));
RegisterController(application, () => new Common.Contact.Controller());
//@keyattribute
class Controls {
}
Controls.DateFormat = "yyyy-MM-dd";
class Diff {
    constructor() {
        this.Children = [];
    }
}
class AttributeDiff extends Diff {
}
class DiffOptions {
    constructor() {
        this.keeporderontarget = false;
        this.excludedelements = [];
        this.excludednodes = [];
        this.excludedselectors = [];
    }
}
class DomDiff {
    constructor() {
        this.Difflist = [];
    }
    static Test() {
        var e1 = _SelectFirst(".div1");
        var e2 = _SelectFirst(".div2");
        var d = DomDiff.CompareElements(e1, e2, new DiffOptions());
        console.log(d);
    }
    static CompareElements(element1, element2, options) {
        var me = this;
        var result = [];
        var childnodes1 = Array.from(element1.childNodes);
        var childnodes2 = Array.from(element2.childNodes);
        if (options.excludedelements.length > 0) {
            childnodes1 = childnodes1.Where(i => options.excludedelements.indexOf(i) == -1);
        }
        var matched2 = [];
        var matched1 = [];
        var keyatrxr = ":scope > [" + keyattribute + "=\"";
        for (var ix = 0; ix < childnodes1.length; ix++) {
            var node = childnodes1[ix];
            var matching = childnodes2.FirstOrDefault(i => i.nodeName == node.nodeName && matched2.indexOf(i) == -1);
            var key = DomDiff.Attribute(node, keyattribute);
            if (!IsNull(key)) {
                //matching = childnodes2.FirstOrDefault(i => DomDiff.Attribute(i, keyattribute) == key);
                matching = Array.from(element2.querySelectorAll(keyatrxr + key + "\"]")).FirstOrDefault(i => matched2.indexOf(i) == -1);
                if (!options.keeporderontarget && matching != null) {
                    //var ix1 = Array.from(node.parentNode.childNodes).indexOf(<any>node);
                    //var ix2 = Array.from(matching.parentNode.childNodes).indexOf(<any>matching);
                    var ix1 = childnodes1.indexOf(node);
                    var ix2 = childnodes2.indexOf(matching);
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
            }
            else {
                if (node.nodeName == "#text") {
                    if (node.nodeValue != matching.nodeValue) {
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
                }
                else {
                    var propertydifferences = [];
                    var lowernodename = node.nodeName.toLowerCase();
                    if (In(lowernodename, "input", "select")) {
                        propertydifferences = DomDiff.GetPropertyDiff(node, matching, ["value"]);
                    }
                    var attributedifferences = DomDiff.GetAttributeDiff(node, matching);
                    var elementdifferences = [];
                    if ("value" in node) {
                    }
                    else {
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
    static GetPropertyDiff(element1, element2, properties) {
        var result = [];
        var attributes = properties;
        var diff = new AttributeDiff();
        diff.Val1 = [];
        diff.Val2 = [];
        diff.Container1 = element1;
        diff.Container2 = element2;
        var differentattributes = [];
        for (var i = 0; i < attributes.length; i++) {
            var attribute = attributes[i];
            var Val1 = element1.getAttribute(attribute);
            var Val2 = element2.getAttribute(attribute);
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
    GetTagDiff(element1, element2) {
        var me = this;
        var diff = new Diff();
        diff.Val1 = element1.nodeName;
        diff.Val2 = element2.nodeName;
        diff.Property = "nodeName";
        if (diff.Val1 != diff.Val2) {
            return diff;
        }
        return null;
    }
    static GetAttributeDiff(element1, element2) {
        var me = this;
        var result = [];
        var attributes1 = me.Attributes(element1);
        var attributes2 = me.Attributes(element2);
        var attributes = [...new Set(attributes1.concat(attributes2))];
        var diff = new AttributeDiff();
        diff.Val1 = [];
        diff.Val2 = [];
        diff.Container1 = element1;
        diff.Container2 = element2;
        var differentattributes = [];
        for (var i = 0; i < attributes.length; i++) {
            var attribute = attributes[i];
            if (!attribute.startsWith("_") && attribute != "style") {
                var Val1 = element1.getAttribute(attribute);
                var Val2 = element2.getAttribute(attribute);
                if (Val1 != Val2) {
                    differentattributes.push(attribute);
                    diff.Val1.push(Val1);
                    diff.Val2.push(Val2);
                }
            }
        }
        if (differentattributes.length > 0) {
            diff.Property = "Attr:" + differentattributes.join(",");
            result.push(diff);
        }
        return result;
    }
    static Attributes(element) {
        var arr = [];
        var el = element;
        if (el.nodeType == 1) {
            for (var i = 0, atts = el.attributes, n = atts.length, arr = []; i < n; i++) {
                arr.push(atts[i].nodeName);
            }
        }
        return arr;
    }
    static Attribute(element, attributename) {
        var arr = [];
        var el = element;
        if (el.nodeType == 1) {
            return el.getAttribute(attributename);
        }
        return null;
    }
    static Map(target, source, poptions = {}) {
        var options = new BindOptions();
        for (var key in poptions) {
            options[key] = poptions[key];
        }
        var excludedelements = [];
        for (var i = 0; i < options.excludedselectors.length; i++) {
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
    static MapDiff(difference, parent) {
        if (difference.Property != "All") {
            if (difference.Property == "Node") {
                if (difference.Val1 == null) {
                    parent.Ref1.appendChild(difference.Val2);
                }
                if (difference.Val2 == null) {
                    parent.Ref1.removeChild(difference.Val1);
                }
            }
            if (difference.Property == "NodeIndex") {
                var parentnode1 = parent.Ref1;
                parentnode1.insertBefore(difference.Ref1, parentnode1.childNodes[difference.Val2]);
            }
            if (difference.Property == "NodeValue") {
                difference.Ref1.nodeValue = difference.Val2;
            }
            if (difference.Property.startsWith("Prop:")) {
                var attrdifference = difference;
                var differentattributes = attrdifference.Property.substring(5).split(",");
                var e1 = attrdifference.Container1;
                //var e2 = <Element>attrdifference.Container2;
                differentattributes.forEach((attributename, ix) => {
                    //var pref1e = (<Element>parent.Ref1);
                    var val1 = attrdifference.Val1[ix];
                    var val2 = attrdifference.Val2[ix];
                    if (val2 == null) {
                        delete e1[attributename];
                    }
                    else {
                        e1[attributename] = val2;
                    }
                });
            }
            if (difference.Property.startsWith("Attr:")) {
                var attrdifference = difference;
                var differentattributes = attrdifference.Property.substring(5).split(",");
                var e1 = attrdifference.Container1;
                //var e2 = <Element>attrdifference.Container2;
                differentattributes.forEach((attributename, ix) => {
                    //var pref1e = (<Element>parent.Ref1);
                    var val1 = attrdifference.Val1[ix];
                    var val2 = attrdifference.Val2[ix];
                    if (val2 == null) {
                        e1.removeAttribute(attributename);
                    }
                    else {
                        e1.setAttribute(attributename, val2);
                    }
                });
            }
        }
        else {
            var z = 0;
        }
        for (var i = 0; i < difference.Children.length; i++) {
            var childdiff = difference.Children[i];
            DomDiff.MapDiff(childdiff, difference);
        }
        if (!IsNull(difference.Ref1) && ("ContentChanged" in difference.Ref1)) {
            difference.Ref1.ContentChanged();
        }
    }
}
function customcontrol(element) {
    var result = null;
    var parent = IsNull(element) ? null : element.parentElement;
    while (parent != null) {
        var isvalue = Coalesce(parent.getAttribute("is"), "");
        if (parent.tagName.indexOf("-") > -1 || isvalue.indexOf("-") > -1) {
            return parent;
        }
        // parent.nodeName=="#document-fragment"? parent.host:
        if (parent.parentNode != null && parent.parentNode.nodeName == "#document-fragment") {
            parent = parent.parentNode.host;
        }
        else {
            parent = parent.parentNode;
        }
    }
    return result;
}
function TreeMenu(target, obj) {
    var children = FirstNotNull(obj["Children"], []);
    if (children.length == 0) {
        return "";
    }
    var htmlbuilder = [];
    htmlbuilder.push("<ul>");
    children.forEach(function (child) {
        //<li binding-type="template" uid="@{model.Key}" url="@{model.Url}" rel="@{model.Name}">
        //htmlbuilder.push(Format('<li uid="{0}" url="{1}" rel="{2}">', child["Key"], Access(window, "appbaseurl") +  child["Url"], child["Name"]));
        htmlbuilder.push(Format('<li uid="{0}" url="{1}" rel="{2}">', child["Key"], child["Url"], child["Name"]));
        htmlbuilder.push(Res("menu." + child["Key"]));
        htmlbuilder.push(TreeMenu(null, child));
        htmlbuilder.push("</li>");
    });
    htmlbuilder.push("</ul>");
    var html = htmlbuilder.join("\n");
    if (!IsNull(target)) {
        target.innerHTML = html;
    }
    return html;
}
function GetControlSheet() {
    var sheet = Array.from(document.styleSheets).FirstOrDefault(i => i.href.endsWith(".css") && i.href.toLowerCase().indexOf("controls") > -1);
    return sheet;
}
function GetDynamicalSheet() {
    var dynamicstylecontainer = _SelectFirst("style[name=DynamicCss]");
    if (dynamicstylecontainer == null) {
        dynamicstylecontainer = _CreateElement("style", { name: "DynamicCss" });
        ;
        dynamicstylecontainer.appendChild(document.createTextNode(""));
        document.head.appendChild(dynamicstylecontainer);
        //dynamicstylecontainer.sheet.title = "DynamicCss";
    }
    return dynamicstylecontainer.sheet;
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
class App_FileUploader extends HTMLElement {
    constructor() {
        super();
        this.uploadelement = null;
    }
    get Files() {
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
                };
                reader.onerror = function (error) {
                    reject(error);
                };
                reader.readAsText(file);
            });
            return p;
        };
        for (var i = 0; i < me.uploadelement.files.length; i++) {
            var file = me.uploadelement.files[i];
            files.push({ filename: file.name, content: file, readAsText: readastext });
        }
        return files;
    }
    connectedCallback() {
        var me = this;
        me.uploadelement = _Create("input", { type: "file", multiple: "" });
        me.uploadelement.addEventListener("change", function () {
            var files = me.Files;
            me.OnChange();
        });
        me.appendChild(me.uploadelement);
    }
    OnChange() {
        var event = document.createEvent("HTMLEvents");
        event.initEvent("change", false, false);
        this.dispatchEvent(event);
    }
}
window.customElements.define("app-fileuploader", App_FileUploader);
class App_Field extends HTMLElement {
    constructor() {
        super(...arguments);
        this.label = null;
    }
    static get observedAttributes() {
        return ["value", "label"];
    }
    attributeChangedCallback(attrName, oldValue, newValue) {
        if (attrName == "label") {
            if (!IsNull(this.label)) {
                this.label.innerText = newValue;
            }
        }
    }
    connectedCallback() {
        var element = this;
        this.load();
    }
    load() {
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
class App_Header extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        var me = this;
        me.EnsureLayout();
    }
    EnsureLayout() {
        var me = this;
        var childrens = Array.from(me.children);
        var e_filter = childrens.FirstOrDefault(i => i.classList.contains("filter"));
        var e_commands = childrens.FirstOrDefault(i => i.tagName.toLowerCase() == "app-commandbar");
        var e_title = childrens.FirstOrDefault(i => i.classList.contains("titlecontainer"));
        var special_es = [];
        if (e_title != null) {
            special_es.push(e_title);
        }
        if (e_filter != null) {
            special_es.push(e_filter);
        }
        if (e_commands != null) {
            special_es.push(e_commands);
        }
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
        if (closeb == null) {
            closeb = _CreateElement("span", { class: "icon a-Close", onclick: "view(this).Close();" });
            e_title.appendChild(closeb);
        }
        me.addEventListener("keyup", (e) => {
            if (e.keyCode === 13) {
                var v = view(me);
                var search = v["Search"];
                if (IsFunction(search)) {
                    search.apply(v, [{ initiator: 'uifilter' }]);
                }
            }
        });
    }
}
window.customElements.define("app-header", App_Header);
class App_CommandBar extends HTMLElement {
    constructor() {
        super();
        this.Commands = [];
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
    //public get value() { return "";}
    get activatorindex() {
        return this.hasAttribute('activatorindex') ? this.getAttribute("activatorindex") : "-1";
    }
    set activatorindex(val) {
        this.setAttribute("activatorindex", val);
    }
    connectedCallback() {
        var me = this;
        me.EnsureActivator();
    }
    ContentChanged() {
        var me = this;
        me.EnsureActivator();
    }
    EnsureActivator() {
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
                var activator = _CreateElement("span", { class: "icon activator", onclick: "customcontrol(this).ToggleState()" });
                var placeholder = _CreateElement("label", { class: "icon placeholder" });
                me.appendChild(placeholder);
                var aix = Number(me.activatorindex);
                if (aix == -1) {
                    content.appendChild(activator);
                }
                else {
                    var ix = aix > content.children.length ? 0 : aix;
                    content.insertBefore(activator, content.children[ix]);
                }
            }
        }
    }
    ToggleState() {
        var me = this;
        if (!me.classList.contains("expanded")) {
            me.classList.add("expanded");
        }
        else {
            me.classList.remove("expanded");
        }
    }
    AddCommands(...commands) {
        var me = this;
        var temp = document.createElement('template');
        for (var i = 0; i < commands.length; i++) {
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
    constructor() {
        super();
        this.IsExact = false;
        this.Type = UIDataType.Text;
    }
    get value() {
        var format = "{0}";
        if (this.exact_input != null && this.exact_input.checked) {
            format = "[{0}]";
        }
        return Format(format, this.input.value);
    }
    set value(val) {
        this.input.value = val;
    }
    GetFilters() {
        var me = this;
        return ClientFilter.Create(me.Type, me.Field, me.value);
    }
    connectedCallback() {
        var me = this;
        me.input = _Create("input", { type: "text" });
        me.exact_input = _Create("input", { type: "checkbox" });
        var label = _CreateElement("label", {}, Res("general.ExactFilter"));
        label.appendChild(me.exact_input);
        me.clear_element = _Create("span", { class: "icon close" });
        me.appendChild(me.input);
        me.appendChild(label);
        me.appendChild(me.clear_element);
        me.classList.add("hovering");
        me.input.addEventListener("change", () => {
        });
        me.exact_input.addEventListener("change", (e) => {
            if (me.input.value.trim().length > 0) {
            }
            else {
                e.stopPropagation();
            }
        });
        me.clear_element.addEventListener("click", () => {
            me.input.value = "";
            var f = (e) => __awaiter(this, void 0, void 0, function* () { _Hide(e); });
            var event = document.createEvent("HTMLEvents");
            event.initEvent("change", true, false);
            me.dispatchEvent(event);
            f(me);
        });
    }
}
window.customElements.define("app-columnfilter", App_ColumnFilter);
class App_DataTable extends HTMLTableElement {
    constructor() {
        super();
        this.stylenode = null;
        this.instancekey = Guid();
        this.Data = [];
        this.originalrows = [];
        this.filteredrows = [];
        this.sortedrows = [];
        this.flags = {
            sortable: false,
            tbodyastrow: false,
            filterable: false,
            highlightrowsonhover: false,
            resizable: false,
            selectable: false,
            checkable: false
        };
        this.styleproperties = ["textAlign", "display"];
        //let shadowRoot = this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
        var me = this;
        var flagsattribute = Coalesce(me.getAttribute("flags"), "");
        me.typename = Coalesce(me.getAttribute("typename"), "");
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
        me.originalrows = rows;
        me.filteredrows = rows;
        try {
            me.sortfunction = evalInContext.call(me, me.getAttribute("sortfunction"));
        }
        catch (ex) {
        }
        try {
            me.filterfunction = evalInContext.call(me, me.getAttribute("filterfunction"));
        }
        catch (ex) {
        }
        if (me.sortfunction == null) {
            me.sortfunction = me.Sort;
        }
        if (me.filterfunction == null) {
            me.filterfunction = me.Filter;
        }
        //me.AlignCells();
    }
    disconnectedCallback() {
        var me = this;
        var dsheet = GetDynamicalSheet();
        var rules = Array.from(dsheet.cssRules);
        var tableselector = '[_app-datatable-instancekey="' + me.instancekey + '"] ';
        for (var i = 0; i < rules.length; i++) {
            var ix = rules.length - (i + 1);
            var rule = rules[ix];
            if (rule.selectorText.indexOf(tableselector) > -1) {
                //console.log(sheet.cssRules[i]);
                dsheet.deleteRule(ix);
            }
        }
    }
    AlignCells() {
        var me = this;
        var head = _SelectFirst("thead", me);
        var theadth = _Select("th", head);
        var dsheet = GetDynamicalSheet();
        var rules = Array.from(dsheet.cssRules);
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
                rules = Array.from(dsheet.cssRules);
            }
            existingrule = rules.FirstOrDefault((i) => i.selectorText == ruleselector);
            for (var key in dstyle) {
                existingrule.style[key] = dstyle[key];
            }
        });
    }
    OnDataBound() {
        var me = this;
        me.originalrows = me.GetRowElements();
        me.filteredrows = me.GetRowElements();
        me.AlignCells();
        me.Setup();
        me.MakeFilterable();
        me.MakeResizable();
        me.MakeSortable();
    }
    OnClick(event) {
        var me = this;
        var htmlelement = event.target;
        if (IsNull(htmlelement)) {
            return;
        }
        var th = htmlelement.tagName == "TH" ? htmlelement : _Parents(htmlelement, me).FirstOrDefault(i => i.tagName == "TH");
        if (!IsNull(th)) {
            var field = th.getAttribute("key");
            var shouldfilter = false;
            var filterelement = _SelectFirst("app-columnfilter", th);
            if (!IsNull(filterelement) && (filterelement.contains(htmlelement) || htmlelement.classList.contains("filtering"))) {
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
                if (sortindicator.classList.contains("asc")) {
                    state = "asc";
                }
                if (sortindicator.classList.contains("desc")) {
                    state = "desc";
                }
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
    static GetCellValue(r, index, utype) {
        var row = r.tagName == "TBODY" ? r.children[0] : r;
        var td = row.children[index];
        var table = _Parents(row).FirstOrDefault(i => i.tagName == "TABLE"); //(<HTMLTableElement>r.parentElement.parentElement);
        var headrow = table.tHead.rows[table.tHead.rows.length - 1];
        var th = headrow.cells[index];
        var field = th.getAttribute("key");
        var childnodes = td.hasChildNodes ? (Array.from(td.childNodes)) : [];
        var val = null;
        var nodetocheck = null;
        if (childnodes.length == 1) {
            nodetocheck = childnodes.FirstOrDefault();
        }
        else {
            nodetocheck = Coalesce(_SelectFirst('[name="' + field + '"]', td), _SelectFirst('[bind="' + field + '"]', td));
        }
        if (nodetocheck != null) {
            if (nodetocheck.nodeName == "#text") {
                val = nodetocheck.nodeValue.trim();
            }
            if (In(nodetocheck.nodeName, "A", "SPAN")) {
                val = nodetocheck.innerText;
            }
            if (In(nodetocheck.nodeName, "INPUT")) {
                val = nodetocheck.value;
            }
            if (In(nodetocheck.nodeName, "SELECT")) {
                val = nodetocheck.selectedOptions.length > 0 ? nodetocheck.selectedOptions[0].value : null;
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
    GetRowElements() {
        var me = this;
        if (me.flags["tbodyastrow"]) {
            return Array.from(me.tBodies);
        }
        else {
            return me.tBodies.length == 0 ? [] : Array.from(me.tBodies[0].rows);
        }
    }
    Sort(field, by, type = UIDataType.Text) {
        var me = this;
        var headrow = me.tHead.rows[0];
        var th = _SelectFirst('th[key="' + field + '"', headrow);
        if (th.classList.contains("numeric")) {
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
        var sortdesc = (ao, bo) => {
            var a = ao["value"];
            var b = bo["value"];
            if (a > b) {
                return -1;
            }
            if (b > a) {
                return 1;
            }
            return 0;
        };
        var sortasc = (ao, bo) => {
            var a = ao["value"];
            var b = bo["value"];
            if (a > b) {
                return 1;
            }
            if (b > a) {
                return -1;
            }
            return 0;
        };
        var sorts = { "asc": sortasc, "desc": sortdesc };
        var sortedvalues = values.sort(sorts[by]);
        me.sortedrows = sortedvalues.Select(s => s["reference"]);
        sortedvalues.forEach((o, i) => {
            var r = o["reference"];
            var parent = r.parentElement;
            parent.insertBefore(r, parent.children[i]);
        });
    }
    Filter(field, value, type = UIDataType.Text) {
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
        me.filteredrows = rows.Where(r => App_DataTable.GetCellValue(r, ix, UIDataType.Text).toLowerCase().indexOf(lvalue) > -1);
        tbody.innerHTML = "";
        me.filteredrows.forEach((r, i) => {
            tbody.appendChild(r);
        });
    }
    SizeChanged(entries) {
        var me = this;
        me.MakeResizable();
    }
    MakeResizable() {
        var me = this;
        if (me.flags["resizable"]) {
            callasync(() => {
                resizableGrid(me);
            });
        }
        if (me.flags["resizablehead"]) {
            callasync(() => {
                resizableGrid(me, true);
            });
        }
    }
    MakeFilterable() {
        var me = this;
        if (me.flags["filterable"]) {
            var headerrow = me.tHead.rows[me.tHead.rows.length - 1];
            var cells = Array.from(headerrow.cells).Where(i => !IsNull(i.getAttribute("key")));
            cells.forEach(c => {
                let controls = _SelectFirst(".controls", c);
                let l = c.children[0];
                var filteringe = _SelectFirst(".filtering", c);
                if (filteringe == null) {
                    let ss = _Create("span", { class: "icon filtering" });
                    controls.appendChild(ss);
                }
                var colfilter = _SelectFirst("app-columnfilter", c);
                if (colfilter == null) {
                    colfilter = new App_ColumnFilter();
                    colfilter.style.display = "none";
                    colfilter.Field = c.getAttribute("key");
                    var mt = MetaAccessByTypeName(me.typename, colfilter.Field);
                    if (mt != null) {
                        colfilter.Type = GetUIDataTypeFrom(mt.SourceType);
                    }
                    colfilter.addEventListener("change", (event) => {
                        console.log(colfilter.GetFilters());
                        var th = _SelectFirst('[key="' + colfilter.Field + '"]', headerrow);
                        var filterindicator = _SelectFirst(".filtering", th);
                        if (!IsNull(colfilter.value)) {
                            filterindicator.classList.add("filtered");
                        }
                        else {
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
    MakeSortable() {
        var me = this;
        if (me.flags["sortable"]) {
            var headerrow = me.tHead.rows[me.tHead.rows.length - 1];
            var cells = Array.from(headerrow.cells).Where(i => !IsNull(i.getAttribute("key")));
            cells.forEach(c => {
                let controls = _SelectFirst(".controls", c);
                let l = c.children[0];
                var filteringe = _SelectFirst(".sorting", c);
                if (filteringe == null) {
                    let ss = _Create("span", { class: "sorting" });
                    controls.appendChild(ss);
                }
                //let ss = _Create<HTMLElement>("span", { class: "icon sorting" });
            });
        }
    }
    Setup() {
        var me = this;
        var headerrow = me.tHead.rows[me.tHead.rows.length - 1];
        var cells = Array.from(headerrow.cells);
        cells.forEach(c => {
            var f = Element.prototype.appendChild;
            //BLACK MAGIC
            c["appendChild"] = (item) => {
                if (item.nodeName == "#text") {
                    var span = (c.hasChildNodes() && c.childNodes[0].nodeName == "SPAN") ? c.childNodes[0] : null;
                    if (span != null) {
                        span.nodeValue = item.nodeValue;
                        return null;
                    }
                }
                return f.apply(c, [item]);
            };
            var controls = _SelectFirst(".controls", c);
            if (controls == null) {
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
class App_InputWithAction extends HTMLElement {
    constructor() {
        super(...arguments);
        this._value = "";
    }
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
    connectedCallback() {
        var me = this;
    }
}
class App_QueryEditor extends HTMLElement {
    constructor() {
        super();
        this.QueryTemplate = null;
        this.Query = new ClientQuery();
        this.VisibleFields = [];
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
    get roottype() {
        return this.hasAttribute('roottype') ? this.getAttribute("roottype") : null;
    }
    set roottype(val) {
        this.setAttribute("roottype", val);
    }
    connectedCallback() {
        var me = this;
        if (me.innerHTML.trim().length == 0) {
            me.Load();
        }
    }
    Load() {
        var me = this;
        var query = me.Query;
        var meta = GetMetaByTypeName(me.roottype);
        var listcolumns = query.Fields.Select(i => i.Name);
        me.CorrectFilters();
        var context = {
            Columns: meta.Fields.Select(i => i.MetaKey),
            SelectedColumns: listcolumns.Select((i) => { return { name: i, visible: me.VisibleFields.indexOf(i) > -1 ? 'visible' : '' }; }),
            VisibleColumns: me.VisibleFields,
            Filters: GetFlattenedHierarchy(me.Query.Filters, ""),
            control: me
        };
        var df = me.QueryTemplate.BindToFragment(query, context);
        me.innerHTML = "";
        me.appendChild(df);
    }
    SetFilterField(source, event) {
        var me = this;
        var option = event.target;
        if (option.tagName == "OPTION") {
            var value = option.value;
            var amb = customcontrol(option);
            if (amb != null && amb["tagName"] == "APP-METABROWSER") {
                value = amb.value;
            }
            var filtereditor = _SelectFirst("app-filtereditor.selected", me);
            if (filtereditor != null) {
                var e_field = _SelectFirst("app-autocomplete[bind=Field]", filtereditor);
                //e_field.value = option.value;
                e_field.SetInput(value);
            }
        }
    }
    SetQuery(query) {
        var me = this;
        me.Query = query;
        me.VisibleFields = query.UIColumns;
        me.Load();
    }
    GetQuery() {
        var me = this;
        var uiquery = GetBoundObject(me);
        var query = new QueryView();
        for (var key in uiquery) {
            query[key] = uiquery[key];
        }
        var selectedcolumns = _SelectFirst("[name=SelectedColumns] select", me);
        var orderby = query["Order"];
        delete query["Order"];
        query.Ordering = {};
        query.Ordering[orderby["Field"]] = orderby["Type"];
        var fields = Array.from(selectedcolumns.options);
        query.Fields = fields.Select(i => { return { Name: i.value }; });
        query.UIColumns = fields.Where(i => i.classList.contains("visible")).Select(i => i.value);
        query.Filters = me.Query.Filters;
        //ForeachInHierarchy()
        query.GetCount = false;
        query.Skip = 0;
        query.Take = null;
        me.Execute(query);
        return query;
    }
    OnControlClicked(command) {
        var me = this;
        var qc = me;
        var metabrowser = _SelectFirst("[name=AllColumns] app-metabrowser", qc);
        var allcolumns = _SelectFirst("[name=AllColumns] select", qc);
        var orderbycolumn = _SelectFirst("input[name=orderbyfield]", qc);
        var orderbytype = _SelectFirst("select[name=orderbytype]", qc);
        var selectedcolumns = _SelectFirst("[name=SelectedColumns] select", qc);
        var filtereditor = _SelectFirst(".filtereditor", qc);
        var filtercontainer = _SelectFirst("[name=Filters]", qc);
        if (command == "add") {
            var options = allcolumns.selectedOptions;
            var selectedoption = null;
            for (var i = 0; i < options.length; i++) {
                var existing = _SelectFirst("option[rel=\"" + options[i].value + "\"]", selectedcolumns);
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
            if (!IsNull(selectedoption)) {
                selectedoption.scrollIntoView();
            }
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
                    }
                    else {
                        parent.appendChild(option);
                    }
                }
            }
        }
        if (command == "orderby-asc") {
            var selected_option = selectedcolumns.selectedOptions.length > 0 ? selectedcolumns.selectedOptions[0] : null;
            var all_option = allcolumns.selectedOptions.length > 0 ? allcolumns.selectedOptions[0] : null;
            var option = FirstNotNull(selected_option, all_option);
            if (option != null) {
                orderbycolumn.value = option.value;
                orderbytype.value = "ASC";
            }
        }
        if (command == "orderby-desc") {
            var selected_option = selectedcolumns.selectedOptions.length > 0 ? selectedcolumns.selectedOptions[0] : null;
            var all_option = allcolumns.selectedOptions.length > 0 ? allcolumns.selectedOptions[0] : null;
            var option = FirstNotNull(selected_option, all_option);
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
            var mb = _SelectFirst("app-filtereditor", filtereditor);
            mb.Create(new ClientFilter());
        }
        if (command == "addfilter") {
            var mb = _SelectFirst("app-filtereditor", filtereditor);
            var filterobj = GetBoundObject(mb);
            console.log(filterobj);
            if (!("Values" in filterobj)) {
                var values = [];
                values.push(filterobj["Value"]);
                filterobj["Values"] = values;
            }
            var key = filterobj["_key"];
            if (IsNull(key)) {
                me.Query.SetFilter(filterobj);
            }
            else {
                var qfc = { Children: me.Query.Filters };
                var filter = FindInHierarchy(qfc, f => f["_key"] == key);
                PathMap(filterobj, filter);
            }
            var context = {
                Filters: GetFlattenedHierarchy(me.Query.Filters, "")
            };
            var df = me.QueryTemplate.BindToFragment(me.Query, context);
            var filterse = _SelectFirst(".filters", filtercontainer);
            //filterse.innerHTML = "";
            var edf = _SelectFirst(".filters", df);
            mb.Create(new ClientFilter());
            DomDiff.Map(filterse, edf);
            //filterse.appendChild(edf);
        }
    }
    RemoveFilter(element, key) {
        var me = this;
        var filters = { Children: me.Query.Filters };
        var filter = FindInHierarchy(filters, (f) => f["_key"] == key);
        var filterparent = FindInHierarchy(filters, (f) => FirstNotNull(f.Children, []).FirstOrDefault(ch => ch["_key"] == key));
        var arrayoffilter = filterparent.Children;
        if (filterparent == filters) {
            arrayoffilter = me.Query.Filters;
        }
        RemoveFrom(filter, arrayoffilter);
        var nodetoremove = Access(element, "parentElement");
        if (nodetoremove != null) {
            nodetoremove.remove();
        }
    }
    EditFilter(key) {
        var me = this;
        var filters = { Children: me.Query.Filters };
        var filter = FindInHierarchy(filters, (f) => f["_key"] == key);
        var filtereditor = _SelectFirst(".filtereditor app-filtereditor", me);
        filtereditor.Create(filter);
    }
    Execute(query) {
        console.log(query);
    }
    CorrectFilters() {
        var me = this;
        me.Query.Filters.forEach(filter => {
            if (IsNull(filter.Value)) {
                filter.Value = filter.Values.join(",");
            }
        });
    }
    QueryViewLoaded(element) {
        var me = this;
        var file = element.Files.FirstOrDefault();
        if (file != null) {
            file.readAsText().then(function (r) {
                try {
                    var queryview = JSON.parse(r);
                    me.SetQuery(queryview);
                }
                catch (ex) {
                    Toast_Error("Only Json files (representing queryviews) are allowed");
                }
            });
        }
    }
    SaveQueryView() {
        var me = this;
        var queryview = me.GetQuery();
        var datalink = Format('data:application/octet-stream;charset=utf-8,{0}', encodeURIComponent(JSON.stringify(queryview, null, 4)));
        download("QV_" + me.Query.QueryName + ".json", datalink);
    }
}
window.customElements.define("app-queryeditor", App_QueryEditor);
class App_FilterEditor extends HTMLElement {
    constructor() {
        super();
        this._filter = {};
        this.Template = null;
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
    get roottype() {
        return this.hasAttribute('roottype') ? this.getAttribute("roottype") : null;
    }
    set roottype(val) {
        this.setAttribute("roottype", val);
    }
    connectedCallback() {
        var me = this;
        me.style.display = "block";
        if (me.innerHTML.trim().length == 0) {
            me.Load();
            me.addEventListener("click", function () { me.classList.add("selected"); });
        }
    }
    Load() {
        var me = this;
        var df = me.Template.BindToFragment(me._filter, { control: me });
        var source = _SelectFirst(".Filter", df);
        var target = _SelectFirst(".Filter", me);
        if (target == null) {
            me.innerHTML = "";
            me.appendChild(df);
        }
        else {
            DomDiff.Map(target, source);
        }
        //me.innerHTML = "";
        //me.appendChild(df);
        var fc = "SMPL";
        if (me._filter.Operator == "OR") {
            fc = "OR";
        }
        if (me._filter.Operator == "AND") {
            fc = "AND";
        }
        me.SetFilterCreation(fc);
    }
    Create(filter) {
        var me = this;
        me._filter = filter;
        me.innerHTML = "";
        me.Load();
    }
    LoadFromSource() {
        var me = this;
        var roottype = me.roottype;
        var aac = _SelectFirst("[bind=Field]", me);
        var src = _SelectFirst("[bind=SourceExpression]", me);
        var type = MetaAccessByTypeName(roottype, aac.value);
        var udt = GetUIDataTypeFrom(type.SourceType);
        me._filter = ClientFilter.Create(udt, aac.value, src.value).FirstOrDefault();
        console.log(me._filter);
        me._filter.SourceExpression = src.value;
        me._filter.Value = me._filter.Values.join(",");
        //me._filter.Field
        me.Load();
    }
    AddChild(element) {
        var me = this;
        if (IsNull(me._filter.Children)) {
            me._filter.Children = [];
        }
        me._filter.Children.push(new ClientFilter());
        me.Load();
    }
    AddOrFilter() {
        var me = this;
        var filter = new ClientFilter();
        filter.Field = "Id";
        filter.Operator = "OR";
        me._filter = filter;
        me.Load();
        me.SetFilterCreation("OR");
    }
    AddAndFilter() {
        var me = this;
        var filter = new ClientFilter();
        filter.Field = "Id";
        filter.Operator = "AND";
        me._filter = filter;
        me.Load();
        me.SetFilterCreation("AND");
    }
    SetFilterCreation(c) {
        var me = this;
        var controls = {
            ce_field: () => _SelectFirst(".Field", me),
            ce_andor: () => _SelectFirst(".AndOr", me),
            ce_expression: () => _SelectFirst(".SourceExpression", me),
            ce_operator: () => _SelectFirst(".Operator", me),
            ce_value: () => _SelectFirst(".Value", me),
            ce_type: () => _SelectFirst(".Type", me),
            ce_fieldformat: () => _SelectFirst(".FieldFormat", me)
        };
        var ce_andorlabel = () => _SelectFirst(".AndOr>span", me);
        var hide = function () {
            for (var key in controls) {
                _Hide(controls[key]());
            }
        };
        hide();
        if (c == "OR") {
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
    FieldSelected(control, fieldpath) {
        var me = this;
        var fieldcontrol = control;
        var typecontrol = _SelectFirst("input[bind=Type]", me);
        var valuecontrol = _SelectFirst("input[bind=Value]", me);
        var field = fieldcontrol.value;
        var mt = MetaAccessByTypeName(me.roottype, field);
        me._filter.Type = UIDataType[GetUIDataTypeFrom(mt.SourceType)];
        typecontrol.value = me._filter.Type;
    }
    static GetFilterEditorHtml(filter) {
        var element = new App_FilterEditor();
        if (IsNull(filter.Value)) {
            filter.Value = Format("{0}", filter.Values.join(","));
        }
        element.setAttribute("label", filter.Field);
        element.Create(filter);
        return element.outerHTML;
    }
}
window.customElements.define("app-filtereditor", App_FilterEditor);
class App_ProgressButton extends HTMLElement {
    constructor() {
        super(...arguments);
        this._value = "";
    }
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
    connectedCallback() {
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
class App_Tabs extends HTMLElement {
    connectedCallback() {
        var me = this;
        var head = _SelectFirst(".heads", me);
        if (head == null) {
            head = document.createElement("div");
            head.classList.add("heads");
            me.appendChild(head);
        }
        head.addEventListener("click", function (event) {
            var target = event.target;
            var head = target.classList.contains("head") ? target : _Parents(target).FirstOrDefault(i => i.classList.contains("head"));
            if (head != null) {
                if (head.classList.contains("head")) {
                    var headrel = head.getAttribute("rel");
                    me.Activate(headrel);
                }
            }
        });
        me.Activate("");
    }
    Activate(rel) {
        var me = this;
        var heads = _Select(".head", me);
        var tabs = _Select(".tab", me);
        var chead = heads.FirstOrDefault();
        if (!IsNull(rel)) {
            chead = heads.FirstOrDefault(i => i.getAttribute("rel") == rel);
        }
        var ctab = _SelectFirst(".tab[name=" + chead.getAttribute("rel") + "]", me);
        for (var i = 0; i < heads.length; i++) {
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
class App_MetaBrowser extends HTMLElement {
    constructor() {
        super();
        this._value = "";
        this._valueMeta = null;
        this._path = "";
        this._roottype = "";
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
    connectedCallback() {
        var me = this;
        me._value = me.getAttribute("value");
        me._roottype = IsNull(me.getAttribute("roottype")) ? "" : me.getAttribute("roottype");
        //me._path = me.roottype;
        var df = new DocumentFragment();
        me._select = document.createElement("SELECT");
        me._select.multiple = true;
        me._select.addEventListener("dblclick", function (event) {
            if (event.target.tagName == "OPTION") {
                var option = event.target;
                var path = IsNull(me._path) ? option.value : (me._path + "." + option.value);
                me.LoadPath(path);
            }
        });
        me._select.addEventListener("click", function (event) {
            if (event.target.tagName == "OPTION") {
                var option = event.target;
                var path = IsNull(me._path) ? option.value : (me._path + "." + option.value);
                var meta = MetaAccessByTypeName(me.roottype, path);
                if (meta.Namespace != "models" && !meta.IsArray) {
                    me._value = path;
                    me.valueMeta = meta;
                }
                else {
                    me._value = "";
                    me.valueMeta = null;
                }
            }
        });
        me._pathcontainer = document.createElement("DIV");
        me._pathcontainer.classList.add("invisiblehscroll");
        var a = me.CreatePathAnchor("", me._roottype);
        me._pathcontainer.appendChild(a);
        df.appendChild(me._pathcontainer);
        df.appendChild(me._select);
        me.appendChild(df);
        me.LoadPath("");
    }
    CreatePathAnchor(path, text) {
        var me = this;
        var a = document.createElement("a");
        a.href = "javascript:void(0);";
        a.rel = path;
        a.addEventListener("click", function () { me.LoadPath(path); });
        a.text = text;
        return a;
    }
    LoadPath(path) {
        var me = this;
        var pathparts = path.split(".");
        var meta = MetaAccessByTypeName(me.roottype, path);
        if (meta.Namespace == "models") {
            var anchors = _Select("a", me._pathcontainer);
            var currentanchor = anchors.FirstOrDefault(i => i.getAttribute("rel") == path);
            if (currentanchor != null) {
                var ix = anchors.indexOf(currentanchor);
                for (var i = ix + 1; i < anchors.length; i++) {
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
                var option = document.createElement("option");
                option.value = fieldmeta.MetaKey;
                option.setAttribute("rel", path.length == 0 ? fieldmeta.MetaKey : (path + "." + fieldmeta.MetaKey));
                var t = "";
                if (fieldmeta.IsObject) {
                    t = "{}";
                }
                if (fieldmeta.IsArray) {
                    t = "[]";
                }
                option.innerText = Format("{0} {1}", fieldmeta.MetaKey, t);
                me._select.appendChild(option);
            }
        }
    }
}
window.customElements.define("app-metabrowser", App_MetaBrowser);
class App_Validation extends HTMLElement {
    constructor() {
        super();
        this._Template = null;
        this._TypeName = "";
        this.callback = null;
        var me = this;
    }
    get Template() {
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
    get TypeName() {
        if (IsNull(this._TypeName)) {
            this._TypeName = this.getAttribute("TypeName");
        }
        return this._TypeName;
    }
    set TypeName(value) {
        this._TypeName = value;
    }
    connectedCallback() {
        var me = this;
    }
    Load(result, callback) {
        var me = this;
        console.log(result);
        me.callback = callback;
        var df = me.Template.BindToFragment(result, { customcontrol: me });
        me.innerHTML = "";
        me.appendChild(df);
        _Show(me);
    }
    Confirm() {
        var me = this;
        if (!IsNull(me.callback)) {
            me.callback(true);
        }
        _Hide(me);
    }
    Close() {
        var me = this;
        _Hide(me);
        me.callback(false);
    }
}
window.customElements.define("app-validation", App_Validation);
class App_RadioList extends HTMLElement {
    constructor() {
        super();
        this._value = "";
        var me = this;
    }
    connectedCallback() {
        var me = this;
        me._value = me.getAttribute("value");
        var radios = Array.from(me.querySelectorAll("input[type=radio]"));
        var selected = false;
        for (var i = 0; i < radios.length; i++) {
            var radio = radios[i];
            if (radio.value == this._value) {
                radio.checked = true;
                selected = true;
                break;
            }
        }
        if (!selected) {
            var firstradio = radios.FirstOrDefault();
            if (firstradio != null) {
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
        var radios = this.querySelectorAll("input[type=radio]");
        for (var i = 0; i < radios.length; i++) {
            var radio = radios[i];
            if (radio.checked) {
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
class App_DictionaryEditor extends HTMLElement {
    constructor() {
        super();
        this.dictionary = {};
        this.container = null;
        this.textarea = null;
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
    attributeChangedCallback(attrName, oldValue, newValue) {
        this[attrName] = this.hasAttribute(attrName);
    }
    connectedCallback() {
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
        this.container.classList.add("editor-container");
        this.container.addEventListener('change', function () {
            element.EnsureNewItem();
            element.Save();
        });
        element.Load(element.value);
    }
    EnsureNewItem() {
        var items = _Select('input', this.container).Where(i => IsNull(i.value));
        var shouldaddnewitem = items.length == 0;
        if (shouldaddnewitem) {
            var itemdiv = document.createElement("div");
            var keyinput = document.createElement("input");
            itemdiv.appendChild(keyinput);
            keyinput.type = "text";
            keyinput.value = "";
            var valueinput = document.createElement("textarea");
            itemdiv.appendChild(valueinput);
            valueinput.rows = 1;
            valueinput.value = "";
            this.container.appendChild(itemdiv);
        }
    }
    Save() {
        var items = this.querySelectorAll("form div");
        var valuebuilder = [];
        items.forEach(function (item) {
            var keyelement = item.querySelector("input");
            var valueelement = item.querySelector("textarea");
            valuebuilder.push('"' + keyelement.value + '":"' + valueelement.value + '"');
        });
        this.textarea.value = valuebuilder.join('\n');
    }
    static GetResourceDictionary(content) {
        var result = {};
        var lines = CsvLineSplit(content, "\n", "\"");
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var ix = line.indexOf(":");
            if (ix > -1) {
                var key = line.substring(0, ix).trim();
                var value = line.substring(ix + 1).trim();
                if (key.startsWith("\"")) {
                    key = key.substring(1);
                }
                if (key.endsWith("\"")) {
                    key = key.substring(0, key.length - 1);
                }
                if (value.startsWith("\"")) {
                    value = value.substring(1);
                }
                if (value.endsWith("\"")) {
                    value = value.substring(0, value.length - 1);
                }
                result[key] = value;
            }
        }
        return result;
    }
    Load(content) {
        var me = this;
        me.dictionary = App_DictionaryEditor.GetResourceDictionary(content);
        me.LoadUI();
    }
    LoadUI() {
        var me = this;
        var df = document.createDocumentFragment();
        for (var key in me.dictionary) {
            var itemdiv = document.createElement("div");
            df.appendChild(itemdiv);
            var keyinput = document.createElement("input");
            itemdiv.appendChild(keyinput);
            keyinput.type = "text";
            keyinput.value = key;
            var valueinput = document.createElement("textarea");
            itemdiv.appendChild(valueinput);
            valueinput.rows = 1;
            valueinput.value = me.dictionary[key];
        }
        me.container.innerHTML = "";
        me.container.appendChild(df);
        me.EnsureNewItem();
    }
    disconnectedCallback() {
    }
    get bind() {
        return this.hasAttribute('bind') ? this.getAttribute("bind") : null;
    }
    set bind(val) {
        this.setAttribute("bind", val);
    }
    get value() {
        var valueelement = this.querySelector("textarea");
        return !IsNull(valueelement) ? valueelement.value : null;
    }
    set value(val) {
        var valueelement = this.querySelector("textarea");
        if (!IsNull(valueelement)) {
            valueelement.value = val;
            this.Load(val);
        }
    }
}
window.customElements.define("app-dictionaryeditor", App_DictionaryEditor);
class App_ModalWindow extends HTMLElement {
    connectedCallback() {
        var element = this;
        element.style.display = "none";
        this.load();
    }
    load() {
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
    ContentChanged() {
        var me = this;
        me.load();
    }
}
window.customElements.define("app-modalwindow", App_ModalWindow);
class App_AutoComplete extends HTMLElement {
    constructor() {
        super();
        this.options = new AutoCompleteOption();
        this._input = null;
        this.c_value = null;
        this.c_display = null;
        this.ShowDisplaynameInTextInput = false;
        this._value = "";
        this.SetValueOfControl = function (el, value) {
            if (el.tagName == "INPUT") {
                el.value = value;
            }
            else {
                el.innerHTML = value;
            }
        };
    }
    get displayText() {
        return this.c_display.placeholder;
    }
    set label(val) {
        if (!IsNull(this._input)) {
            this._input.placeholder = val;
        }
    }
    get value() {
        var me = this;
        return me._value;
    }
    set value(val) {
        var me = this;
        me._value = val;
        var event = document.createEvent("HTMLEvents");
        event.initEvent("change", true, false);
        var form = _Parents(me).FirstOrDefault(i => i.tagName == "FORM");
        if (form != null) {
            //var event = document.createEvent("HTMLEvents");
            //event.initEvent("change", false, false);
            //form.dispatchEvent(event);
        }
        me.dispatchEvent(event);
        //me.onchange(event);
    }
    OnSelected(container, dataitem) {
        var me = this;
        me.value = me.GetDataItemValue(dataitem);
    }
    static get observedAttributes() {
        return ["value", "label"];
    }
    attributeChangedCallback(attrName, oldValue, newValue) {
        this[attrName] = newValue;
    }
    GetDataItemDisplayText(item) {
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
    GetDataItemValue(item) {
        if (item["TypeName"] == "_Control") {
            return item["value"];
        }
        var me = this;
        return item[me.options.valuefield];
    }
    connectedCallback() {
        var element = this;
        if (!IsNull(element.shadowRoot)) {
            return;
        }
        if (element.hasAttribute("value")) {
            element._value = element.getAttribute("value");
        }
        var options = this.options;
        for (var key in this.options) {
            var attr = element.getAttribute(key);
            if (!IsNull(attr)) {
                options[key] = attr;
            }
        }
        if (!IsNull(options["bind"])) {
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
        var listdatadictionary = {};
        var listdata = [];
        //element.innerHTML = html;
        //var shadowRoot = element;
        let shadowRoot = this.attachShadow({ mode: 'open' });
        //sheet.cssText;
        shadowRoot.innerHTML = html;
        //shadowRoot.innerHTML = html;
        var c_container = element;
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
        var c_input = (IsNull(options_inputelement) ? default_inputelement : options_inputelement);
        element.c_value = (IsNull(options_valuelement) ? default_valueelement : options_valuelement);
        var c_value = element.c_value;
        var c_display = (IsNull(options_displayelement) ? default_displayelement : options_displayelement);
        element._input = c_input;
        element.c_display = default_inputelement;
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
        var datafunction = function () { };
        var xonselected = function () { };
        var xondatareceived = function (data, options) { };
        try {
            var x_f = evalInContext.call(element, "[" + options.datafunction + "]")[0];
            datafunction = x_f.bind(element);
        }
        catch (ex) {
            console.log(ex);
        }
        if (!IsNull(options.onselected)) {
            try {
                var x_of = evalInContext.call(element, "[" + options.onselected + "]")[0];
                xonselected = x_of.bind(element);
            }
            catch (ex) {
                console.log(ex);
            }
        }
        if (!IsNull(options.ondatareceived)) {
            try {
                var x_of = evalInContext.call(element, "[" + options.ondatareceived + "]")[0];
                xondatareceived = x_of.bind(element);
            }
            catch (ex) {
                console.log(ex);
            }
        }
        var onselected = function (container, dataitem) {
            element.OnSelected(container, dataitem);
            if (!IsNull(xonselected)) {
                xonselected(container, dataitem);
            }
        };
        //if (options.selectormode == "listwithdefault") {
        //    _Show(c_close);
        //} else {
        //    _Hide(c_close);
        //}
        var displayfields = options.displayfield.split(',');
        var datafunction_callback = function (items) {
            //console.log("datafunction_callback>" + items.length);
            var defaultcontainer = [];
            xondatareceived(items, options);
            listdata = defaultcontainer.concat(items);
            var builder = [];
            listdata.forEach(function (item) {
                var level = IsNull(options.level) ? "" : (' class="l' + item[options.level] + '"');
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
        var Search = function (clear = true) {
            //console.log("Search");
            if (options.clearinput == "1") {
                element.SetValueOfControl(c_input, "");
                c_input.placeholder = "";
                //console.log("Clearing input");
            }
            else {
                //console.log("Search(false)");
            }
            datafunction(c_input.value, datafunction_callback, c_input);
            //if (options.minlengthtosearch == 0
            //    && c_list.children.length == 0
            //) {
            //}
            _Show(c_list);
        };
        element.Search = Search;
        c_close.addEventListener("click", function () {
            element.Clear();
        });
        c_action.addEventListener("click", function () {
            var asyncSearch = () => __awaiter(this, void 0, void 0, function* () { Search(); });
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
                    console.log("options.clearinput" + options.clearinput);
                    c_input.value = "";
                }
                onselected(c_container, dataitem);
                c_list.innerHTML = "";
            }
        };
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
                    }
                    else {
                        datafunction(c_input.value, function (data) {
                            datafunction_callback(data);
                            selectcurrent();
                        });
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
                }
                else {
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
                }
                else {
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
        c_list.addEventListener("mousedown", function (e) {
            var li = e.target.tagName == "LI" ? e.target : e.target.parent;
            if (!IsNull(li) && li.tagName == "LI") {
                var nodes = Array.prototype.slice.call(c_list.children);
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
    disconnectedCallback() {
    }
    Search() {
    }
    Clear() {
        var me = this;
        me.SetValueOfControl(me._input, "");
        me._input.placeholder = "";
        me._input.value = "";
        me.c_value.value = "";
        me.value = null;
        var ul = me.shadowRoot.querySelector("ul");
        ul.innerHTML = "";
    }
    GetValue() {
        var me = this;
        //if (IsNull(me._value)) {
        //    me._value = me.getAttribute("value");
        //}
        return me._value;
    }
    SetInput(txt) {
        var me = this;
        me._input.value = txt;
        me._input.focus();
        me._input.selectionStart = me._input.selectionEnd = me._input.value.length;
        me.value = me._input.value;
    }
    SetValue(value, displaytext) {
        var me = this;
        me._input.value = displaytext;
        me.value = value;
    }
}
window.customElements.define("app-autocomplete", App_AutoComplete);
class App_ObjectPicker extends App_AutoComplete {
    constructor() {
        super();
        this._tagsnode = null;
        this._hinput = null;
        this._uitype = null;
        this.AddTag = function (id, name) {
            var me = this;
            var tagsnode = this._tagsnode;
            if (IsNull(_SelectFirst(".tag[value=\"" + id + "\"]", tagsnode))) {
                var tagnode = _CreateElement("label", { class: "tag" });
                tagnode.innerHTML = Format('<span class="icon entypo-cancel" onclick="customcontrol(this).Remove(\'{0}\')"></span>{1}', id, name);
                //var b_delete = _SelectFirst(".entypo-cancel", tagnode);
                //b_delete.addEventListener("click", me.OnSelected.bind(me));
                tagnode.setAttribute("value", id);
                var controlsnode = tagsnode.querySelector(".controls");
                tagsnode.insertBefore(tagnode, controlsnode);
                return true;
            }
            return false;
        };
        this.options.selectormode = "";
    }
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
    GetTagText(data) {
        if (data["TypeName"] == "_Control") {
            return data["text"];
        }
        var me = this;
        var displayfields = me.options.displayfield.split(",");
        var displayfield = displayfields.FirstOrDefault();
        return Access(data, displayfield);
    }
    GetTagValue(data) {
        if (data["TypeName"] == "_Control") {
            return data["value"];
        }
        var me = this;
        return Access(data, me.options.valuefield);
    }
    OnSelected(container, dataitem) {
        var me = this;
        if (!IsNull(dataitem)) {
            me.AddTag(me.GetTagValue(dataitem), me.GetTagText(dataitem));
        }
        var tagsnode = this._tagsnode;
        var hinput = this._hinput;
        hinput.value = me.GetValue();
        me.value = hinput.value;
    }
    GetValue() {
        var me = this;
        var value = "";
        var tagnodes = _Select(".tag[value]", me._tagsnode);
        if (tagnodes == null || tagnodes.length == 0) {
            return value;
        }
        if (me.uitype == UIDataType.Text || me.uitype == UIDataType.Date) {
            value = "[" + tagnodes.Select(i => i.getAttribute("value")).join("],[") + "]";
        }
        else {
            value = tagnodes.Select(i => i.getAttribute("value")).join(",");
        }
        return value;
    }
    Remove(value) {
        var me = this;
        var tagnode = _SelectFirst('label.tag[value="' + value + '"]', me._tagsnode);
        var hinput = this._hinput;
        tagnode.remove();
        hinput.value = me.GetValue();
        me.value = hinput.value;
    }
    Clear() {
        var me = this;
        super.Clear();
        var tags = _Select(".tag", me);
        tags.forEach(t => { t.remove(); });
    }
    connectedCallback() {
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
        self._tagsnode = container;
        var hinput = document.createElement("INPUT");
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
                item.id = part;
                item.name = part;
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
        this.Fieldlist = [];
        var me = this;
        var change = new Event('change');
        this.addEventListener('change', function () { me.ChangeFields(); }, false);
    }
    SetFieldlist(fieldlist) {
        this.Fieldlist = fieldlist;
        this.loadList(this.Fieldlist);
    }
    loadList(fieldlist) {
        var container = document.createElement('div');
        container.setAttribute("class", "fieldsetter");
        var FieldlistOut = [];
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
        style.textContent = " .fieldsetter {display: none; width: max-content; border: 1px solid;} .fieldlabel {padding: 3px 5px;} .fieldlabel:hover {cursor: pointer; background: #ececec;}";
        this.appendChild(style);
        return FieldlistOut;
    }
    updatedList(fieldlist) {
        var FieldlistOut = [];
        for (var i = 0; i < fieldlist.length; i++) {
            if (fieldlist[i].visible) {
                FieldlistOut.push(fieldlist[i]);
            }
        }
        return FieldlistOut;
    }
    ChangeFields() {
        var me = this;
        var checkboxelements = _Select(".fieldlabel > input");
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
    connectedCallback() {
        //var result = this.loadList(this.Fieldlist);
        //return result;
    }
}
window.customElements.define("app-queryviewfields", App_QueryViewFields);
class AutoCompleteOption {
    constructor() {
        this.clearinput = "1";
        this.targetquery = "";
        this.selectormode = "listwithdefault";
        this.valueelementquery = "undefined";
        this.displayelementquery = "undefined";
        this.inputelementquery = "undefined";
        this.datafunction = "";
        this.onselected = "";
        this.ondatareceived = "";
        this.valuefield = "";
        this.displayfield = "";
        this.level = "";
        this.value = "";
        this.label = "";
        this.bind = "";
        this.uidatatype = UIDataType.Text;
        this.resultlimit = 10;
        this.minlengthtosearch = 0;
        this.multiselect = false;
        this.keycodetoselectfirst = 13;
        this.cssclass = "autocomplete";
    }
}
window["iziToast"].settings({
    timeout: 5000,
    resetOnHover: true,
    icon: 'material-icons',
    transitionIn: 'fadeInLeft',
    transitionOut: 'fadeOut',
    position: 'topRight'
});
function GetContextMenu() {
    var contextmenuelement = _SelectFirst(".contextmenu");
    if (IsNull(contextmenuelement)) {
        contextmenuelement = document.createElement("div");
        contextmenuelement.classList.add("contextmenu");
        contextmenuelement.classList.add("hovering");
        document.body.appendChild(contextmenuelement);
    }
    return contextmenuelement;
}
function SetContextPosition(item, refitem) {
    var w = item.clientWidth;
    var h = item.clientHeight;
    var bounding = refitem.getBoundingClientRect();
    var vp_h = (window.innerHeight || document.documentElement.clientHeight);
    var vp_w = (window.innerWidth || document.documentElement.clientWidth);
    if ((bounding.bottom + h) > vp_h) {
        // Bottom is out of viewport
        item.style.bottom = (vp_h - bounding.bottom) + "px"; //- itemelement.offsetHeight + 
        item.style.top = "";
    }
    else {
        item.style.top = bounding.top + "px";
        item.style.bottom = "";
    }
    if ((bounding.right + w) > vp_w) {
        // Bottom is out of viewport
        var right = Math.max((vp_w - bounding.right - refitem.clientWidth), 0);
        item.style.right = right + "px"; //- itemelement.offsetHeight + 
        item.style.left = "";
    }
    else {
        item.style.left = bounding.left + refitem.clientWidth + "px";
        item.style.right = "";
    }
}
function Focus(e, asyncc = false) {
    if (document.activeElement != e) {
        e.focus();
    }
    if (asyncc) {
        (() => __awaiter(this, void 0, void 0, function* () {
            e.focus();
        }))();
    }
}
class UILogger {
    constructor() {
        this.logbuilder = [];
        this.element = null;
    }
    GetStringFromHtmlElement(e) {
        var items = [];
        items.push("<" + e.tagName + "");
        if (e.hasAttribute("id")) {
            items.push("id='" + e.getAttribute("id") + "'");
        }
        if (e.hasAttribute("bind")) {
            items.push("bind='" + e.getAttribute("bind") + "'");
        }
        if (e.hasAttribute("class")) {
            items.push("class='" + e.getAttribute("class") + "'");
        }
        items.push("/>");
        return items.join(" ");
    }
    logevent(e, other = "") {
        if ("key" in e) {
            other = other + Format("[{0},{1}]", e["key"], e["keyCode"]);
        }
        this.logbuilder.push(this.GetStringFromEvent(e, other));
    }
    GetStringFromEvent(e, other = "") {
        var targetstr = IsNull(e.target) ? "" : ("outerHTML" in e.target ? (this.GetStringFromHtmlElement(e.target)) : "");
        var msg = "EVENT(" + e.type + ") @" + other + " target: " + targetstr + " " + e.timeStamp;
        return msg;
    }
    start(e) {
        this.element = e;
        var me = this;
        e.addEventListener('focusin', (e) => {
            me.logevent(e);
        });
        e.addEventListener('touchstart', (e) => {
            me.logevent(e);
        });
        e.addEventListener('mousedown', (e) => {
            me.logevent(e);
        });
        e.addEventListener('paste', (e) => {
            me.logevent(e);
        });
        e.addEventListener('input', (e) => {
            me.logevent(e);
        });
        e.addEventListener('change', (e) => {
            me.logevent(e);
        });
        e.addEventListener('textInput', (e) => {
            me.logevent(e, e["data"]);
        });
        e.addEventListener('keydown', (e) => {
            me.logevent(e);
        });
        e.addEventListener('keyup', (e) => {
            me.logevent(e);
        });
        e.addEventListener('keypress', (e) => {
            me.logevent(e);
        });
    }
    stop() {
    }
    GetLogs() {
        var str = this.logbuilder.join("\n");
        return str;
    }
}
class BarcodeScaner {
    constructor() {
        this.timeoutms = 10;
        this.eventname = "keydown";
        this.initialize = () => {
            var me = this;
            document.addEventListener('touchstart', (e) => {
                me.logevent(e);
            });
            document.addEventListener('mousedown', (e) => {
                me.logevent(e);
            });
            document.addEventListener('paste', (e) => {
                me.logevent(e);
            });
            document.addEventListener('textInput', (e) => {
                me.logevent(e, e["data"]);
            });
            document.addEventListener('keydown', (e) => {
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
            document.addEventListener('focusin', (e) => {
                me.logevent(e);
            });
            document.addEventListener(this.eventname, this.keyup);
            if (this.timeoutHandler) {
                clearTimeout(this.timeoutHandler);
            }
            this.timeoutHandler = setTimeout(() => {
                this.inputString = '';
            }, this.timeoutms);
        };
        this.close = () => {
            document.removeEventListener(this.eventname, this.keyup);
        };
        this.timeoutHandler = 0;
        this.inputString = '';
        this.keyup = (e) => {
            if (this.timeoutHandler) {
                clearTimeout(this.timeoutHandler);
                this.inputString += String.fromCharCode(e.keyCode);
            }
            this.timeoutHandler = setTimeout(() => {
                if (this.inputString.length <= 3) {
                    this.inputString = '';
                    return;
                }
                var event = new CustomEvent("onbarcodescaned", { detail: this.inputString });
                // Dispatch/Trigger/Fire the event
                document.dispatchEvent(event);
                //events.emit('onbarcodescaned', this.inputString)
                this.inputString = '';
            }, this.timeoutms);
        };
    }
    logevent(e, other = "") {
        var htos = (e) => {
            var items = [];
            if (e.getAttribute("id") == "scannedbarcode") {
                return "#scannedbarcode";
            }
            items.push("bind:" + e.getAttribute("bind") + ";");
            items.push("id:" + e.getAttribute("id") + ";");
            items.push("class:" + e.getAttribute("class") + ";");
            return items.join(" ");
        };
        var targetstr = IsNull(e.target) ? "" : ("outerHTML" in e.target ? (htos(e.target)) : "");
        var msg = "EVENT-" + e.type + " @" + e.timeStamp + " " + other + " target: " + targetstr;
        LogToast("log", "T", msg);
        //console.log(msg);
    }
    ;
}
var barcodereaderEventHandling = new BarcodeScaner();
//barcodereaderEventHandling.initialize();
function LogToast(verb, stitle, smessage = "") {
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
function Toast_Error(stitle, smessage = "", sdata = "") {
    smessage = IsNull(smessage) ? "" : smessage;
    LogToast("error", stitle, sdata + smessage);
    Log(stitle, smessage);
    window["iziToast"].error({
        title: stitle,
        message: sdata + smessage
    });
}
function Toast_Notification(stitle, smessage = "") {
    smessage = IsNull(smessage) ? "" : smessage;
    LogToast("info", stitle, smessage);
    Log(stitle, smessage);
    window["iziToast"].info({
        title: stitle,
        message: smessage,
        icon: "entypo-check"
    });
}
function Toast_Warning(stitle, smessage = "", sdata = "") {
    smessage = IsNull(smessage) ? "" : smessage;
    LogToast("warning", stitle, sdata + smessage);
    Log(stitle, smessage);
    window["iziToast"].warning({
        title: stitle,
        message: smessage + sdata
    });
    LogToast("warn", stitle, smessage);
}
function Toast_Success(stitle, smessage = "") {
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
function GetMinMaxDate(inputhtml) {
    var htmlbulder = [];
    var selectorfunction = '_SelectFirst(\'input[type=hidden]\', this.parentElement.parentElement)';
    htmlbulder.push('<div class="value minmaxdate">');
    htmlbulder.push(inputhtml);
    htmlbulder.push('<div class="mindate">');
    htmlbulder.push('<label>' + Res("UI.general.DateMin") + '</label>');
    htmlbulder.push('<input type="date" name="min" onchange="SetMinDate(this,' + selectorfunction + ')"/>');
    htmlbulder.push('</div>');
    htmlbulder.push('<div class="maxdate">');
    htmlbulder.push('<label>' + Res("UI.general.DateMax") + '</label>');
    htmlbulder.push('<input type="date" name="max" onchange="SetMaxDate(this,' + selectorfunction + ')"/>');
    htmlbulder.push('</div>');
    htmlbulder.push('</div>');
    return htmlbulder.join("\n");
}
function SetMinDate(source, target) {
    var dvalue = IsNull(source.value) ? null : new Date(source.value);
    var value = IsNull(dvalue) ? "" : FormatDate(dvalue, application.Settings.DateFormat);
    var parts = target.value.split("..");
    if (parts.length == 1) {
        target.value = IsNull(value) ? value : Format("[{0}..", value);
    }
    else {
        target.value = Format("[{0}..{1}", value, parts[1]);
    }
}
function SetMaxDate(source, target) {
    var dvalue = IsNull(source.value) ? null : new Date(source.value);
    var value = IsNull(dvalue) ? "" : FormatDate(dvalue, application.Settings.DateFormat);
    var parts = target.value.split("..");
    if (parts.length == 1) {
        target.value = IsNull(value) ? value : Format("[{0}..", value);
    }
    else {
        target.value = Format("{0}..{1}]", parts[0], value);
    }
}
function CreatePager(container, options) {
    var page = FirstNotNull(options["page"], 0);
    var pagesize = FirstNotNull(options["pagesize"], 10);
    var totalrecords = FirstNotNull(options["total"], 0);
    var cssclass = FirstNotNull(options["cssClass"], 0);
    var onclick = FirstNotNull(options["onclick"], function () { });
    var urlformat = options["urlformat"];
    var pagecount = Math.ceil(totalrecords / pagesize);
    var next = '<a class="next icon "></a>';
    var prev = '<a class="prev icon "></a>';
    var label = Format('<span>/{0}</span>', pagecount);
    var jumpto = '<input class="jumpto" type="number"/>';
    var label2 = Format('<span> ({0})</span>', totalrecords);
    var ps = '<label>' + Res("general.PageSize") + ':<input type="number" min="1" max="500" name="PageSize" value="' + pagesize + '" onchange="view(this).SavePageSize(this.value)" /></label>';
    var html = prev + jumpto + label + next + label2 + ps;
    container.innerHTML = html;
    var input = container.querySelector(".jumpto");
    var nexte = container.querySelector(".next");
    var preve = container.querySelector(".prev");
    if (page > 0) {
        input.value = page;
    }
    var ix = (!isNaN(parseInt(page))) ? parseInt(page) : null;
    var fpage = function (val) {
        if (!isNaN(parseInt(val))) {
            var p = parseInt(val);
            if (p > 0 && (p <= pagecount || totalrecords == -1)) {
                if (!IsNull(urlformat)) {
                    window.location.href = Format(urlformat, p);
                }
                else {
                    onclick(p);
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
    input.addEventListener("change", function (e) {
        input.setAttribute("value", input.value);
    });
    input.addEventListener("keyup", function (e) {
        if (e.key === "Enter") {
            var val = input.value.trim();
            fpage(val);
        }
    });
}
function SetFloatLayout(element) {
    var firstchild = element.children.length > 0 ? element.children[0] : null;
    if (firstchild != null) {
        var setheight = () => {
            var height = firstchild.clientHeight;
            if (height > 0) {
                element.style.height = height + 'px';
            }
        };
        setheight();
    }
}
function ToggleFloatBox(element, setheight = true) {
    var firstchild = element.children.length > 0 ? element.children[0] : null;
    if (firstchild != null) {
        var isvisible = IsNull(element.style) || element.style.display != "none";
        var row = _Parents(element).FirstOrDefault(i => i.tagName == "TR");
        if (isvisible) {
            _Hide(element);
            if (row != null) {
                row.classList.remove("relative");
            }
        }
        else {
            var setHeight = () => {
                if (setheight) {
                    var height = firstchild.clientHeight;
                    if (height > 0) {
                        element.style.height = height + 'px';
                    }
                }
            };
            if ("OnActivated" in firstchild) {
                firstchild["OnActivated"](setHeight);
            }
            if (row != null) {
                row.classList.add("relative");
            }
            _Show(element);
            setHeight();
        }
    }
}
function FloatList(listdata, fields) {
    var builder = [];
    builder.push(Format('<span class="entypo-list" onclick="callasync(()=>ToggleFloatBox(this.nextElementSibling))"></span>'));
    builder.push('<div class="floatlist hovering" hidden style="display:none">');
    builder.push('<ul >');
    listdata.forEach(function (item) {
        var displayvalue = fields.Select(i => Format("{0}", Access(item, i))).join(', ');
        builder.push(Format('<li>{0}</li>', displayvalue));
    });
    builder.push("</ul>");
    builder.push("</div>");
    return builder.join("\n");
}
function CellDetails(html, setheight = true) {
    var builder = [];
    builder.push(Format('<span class="entypo-list" onclick="callasync(()=>ToggleFloatBox(this.nextElementSibling, {0}))"></span>', setheight));
    builder.push('<div class="floatlist hovering" hidden style="display:none">');
    builder.push(html);
    builder.push("</div>");
    return builder.join("\n");
}
function ClearFilter(viewelement) {
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
function LoadBarcodes() {
    var barcodescriptelement = _SelectFirst("#barcodescript");
    if (IsNull(barcodescriptelement)) {
        barcodescriptelement = _CreateElement('script', {
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
            }
            catch (ex) { }
        };
    }
    else {
        try {
            JsBarcode(".xbarcode").init();
        }
        catch (ex) { }
    }
}
function GetFiltersFromUI(filtercontainer) {
    var result = [];
    var elements = _Select("[bind]", filtercontainer);
    for (var i = 0; i < elements.length; i++) {
        var element = elements[i];
        var ok = true;
        if (element.tagName == "INPUT"
            && element.type == "checkbox"
            && !element.checked) {
            ok = false;
        }
        if (ok) {
            var bind = element.getAttribute("bind");
            var binds = CsvLineSplit(bind);
            var type = element.hasAttribute("uidatatype") ? element.getAttribute("uidatatype") : "Text";
            if (IsNumeric(type)) {
                type = UIDataType[type];
            }
            var isexact = element.hasAttribute("isexact") ? true : false;
            var uitype = UIDataType[type];
            var valueobj = GetPropertyandValue(element);
            var value = IsNull(valueobj) ? null : valueobj.Value;
            var valuestr = Format("{0}", value);
            if (isexact && uitype == UIDataType.Text) {
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
            }
            else {
                result = result.concat(ClientFilter.Create(uitype, bind, valuestr));
            }
            //}
        }
    }
    return result;
}
function resizableGrid(tbl, headonly = false) {
    let table = tbl;
    var row = table.tHead.rows[0], cols = (row ? row.children : undefined);
    if (!cols)
        return;
    table.style.overflow = 'hidden';
    var tableHeight = headonly ? table.tHead.rows[table.tHead.rows.length - 1].offsetHeight : table.offsetHeight;
    //var tableHeight = table.offsetHeight;
    for (var i = 0; i < cols.length; i++) {
        var existingresizer = cols[i].querySelector(".colresizer");
        var div = createDiv(tableHeight, existingresizer);
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
        });
        div.addEventListener('mouseout', function (e) {
            e.target.style.borderRight = '';
        });
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
            curColWidth = undefined;
        });
    }
    function createDiv(height, existing) {
        var div = existing;
        if (existing == null) {
            div = _CreateElement('div', { class: "colresizer" });
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
        return (window.getComputedStyle(elm, null).getPropertyValue(css));
    }
}
;
function ResizeImages(file, maxsize = 150, callback) {
    if (file.type.match(/image.*/)) {
        console.log('An image has been loaded');
        // Load the image
        var reader = new FileReader();
        reader.onload = function (readerEvent) {
            var image = new Image();
            image.onload = function (imageEvent) {
                // Resize the image
                var canvas = document.createElement('canvas'), max_size = maxsize, // TODO : pull max size from a site config
                width = image.width, height = image.height;
                if (width > height) {
                    if (width > max_size) {
                        height *= max_size / width;
                        width = max_size;
                    }
                }
                else {
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
            };
            image.src = readerEvent.target.result;
        };
        reader.readAsDataURL(file);
    }
}
function LabelProxy(prefixes = [""]) {
    var pr = new Proxy({}, {
        has: function (target, prop) {
            return true;
        },
        get: function (target, prop) {
            for (var i = 0; i < prefixes.length; i++) {
                var prefix = prefixes[i].length > 0 ? prefixes[i] + "." : "";
                var key = prefix + prop;
                if (ResExists(key)) {
                    return Res(key);
                }
            }
            return Res(prop);
        }
    });
    return pr;
}
class AppSelectorOptions {
    constructor() {
        this.MinLengtToSearch = "";
        this.Modes = [""];
        this.DataFunction = "";
    }
}
class App_Selector extends HTMLElement {
    constructor() {
        super();
    }
    get value() {
        return this._value;
    }
    set value(val) {
        this.value = val;
    }
    static get observedAttributes() {
        return ["value", "label"];
    }
    attributeChangedCallback(attrName, oldValue, newValue) {
        this[attrName] = newValue;
    }
    connectedCallback() {
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
    SetDataItem(obj) {
    }
    SetDisplayText(txt) {
    }
    Clear() {
    }
    ClearInput() {
    }
    SelectNext() {
    }
    SelectPrev() {
    }
    SelectElement(el) {
    }
}
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
var Settings;
(function (Settings) {
    class List extends ViewModel {
        Identifier() {
            return "Settings";
        }
        Title() {
            return Res("general.Settings");
        }
        constructor(controller) {
            super("List", controller);
        }
        Action(p) {
            var viewmodel = this;
            var me = this;
            var d = {
                screenresolution: screen.width + "*" + screen.height,
                devicePixelRatio: window.devicePixelRatio,
                pixelDepth: window.screen.pixelDepth,
                orientation: JSON.stringify(window.screen.orientation),
                "user-agent": navigator.userAgent
            };
            var properties = GetProperties(d);
            //BindX(viewmodel.UIElement, properties);
            me.Bind(viewmodel.UIElement, properties);
            var langelement = _SelectFirst(".culture", me.UIElement);
            langelement.innerHTML = "";
            var cultures = FirstNotNull(application.Settings.Cultures, []);
            var currentoption = null;
            cultures.forEach(function (item) {
                var option = document.createElement("option");
                if (item == application.Settings.Culture) {
                    currentoption = option;
                }
                option.text = Res("general.languages." + item);
                option.value = item;
                langelement.add(option);
            });
            if (currentoption != null) {
                currentoption.selected = true;
            }
            var label = document.querySelector("span.WebServiceIdentifier");
            var wsid = GetParameter("WebServiceIdentifier");
            if (!IsNull(wsid)) {
                var wsidcontrol = document.querySelector("#WebServiceIdentifier");
                var maskedwsid = Format("{0}**********", wsid.substring(0, 7));
                wsidcontrol.value = maskedwsid;
            }
            var datentrycontrol = document.querySelector("#DataEntryPoint");
            datentrycontrol.value = application.Settings.DataEntryPoint;
            var resourcesdiv = _SelectFirst(".resourcelist", me.UIElement);
            var resourcebuilder = [];
            var resourcefilename = "resources-" + application.Settings.Culture + ".json";
            var resourcefiles = ["configdata\\" + resourcefilename];
            resourcefiles = resourcefiles.concat(application.Settings.CustomFiles.Where(i => i.endsWith(resourcefilename)));
            resourcefiles.forEach(function (file) {
                var filename = file.substring(file.lastIndexOf("\\") + 1);
                resourcebuilder.push(Format('<a href="{1}" target="_blank">{0}</a>', filename, file));
            });
            resourcesdiv.innerHTML = resourcebuilder.join("\n");
            viewmodel.AfterBind();
        }
        Refresh(key) {
            var r_ls = function () {
                var wsid = GetParameter("WebServiceIdentifier");
                var dep = application.Settings.DataEntryPoint;
                localStorage.clear();
                application.ReloadSettings();
                application.Settings.DataEntryPoint = dep;
                SetParameter("WebServiceIdentifier", wsid);
            };
            var r_idb = function () {
                application.RefreshStaticData(function () { location.reload(); });
            };
            var r_fs = function () {
                application.Refresh(function () { window.location.reload(); });
            };
            var options = {
                "ALL": function () {
                    application.RefreshStaticData(function () { r_ls(); location.reload(); });
                },
                "IDB": r_idb,
                "LS": r_ls,
                "FS": r_fs
            };
            if (key in options) {
                console.log('Refreshing ' + key);
                options[key]();
            }
        }
        SetLanguage() {
            var me = this;
            var langelement = _SelectFirst(".culture", me.UIElement);
            application.Settings.Culture = langelement.value;
            application.SaveSettings();
            location.reload();
        }
        ShowSettings() {
            var me = this;
            var container = _SelectFirst(".appsettings", me.UIElement);
            container.innerHTML = GetHtml2(application.Settings);
        }
        GetDbLayout() {
            AppDependencies.httpClient.Get("~/webui/api/xdblayout?commandtext=", {}, function (r) {
                var response = JSON.parse(r.responseText);
                download("DBLayouts.json", response.Model);
            }, function (r) {
                var response = JSON.parse(r.responseText);
                var datalink = Format('data:application/octet-stream;charset=utf-8,{0}', encodeURIComponent(JSON.stringify(response.Model, null, 4)));
                download("DBLayouts.json", datalink);
            });
        }
        GetResourceCsv() {
            var namedresources = application.Resources.Cultures[application.Settings.Culture];
            var resources = application.Resources[application.Settings.Culture];
            var head = ["Key", "Dyntell", "Customisation"];
            var csv = [];
            for (var key in resources) {
                var line = [];
                line.push(key);
                for (var nkey in namedresources) {
                    var nc = namedresources[nkey];
                    line.push(nc[key]);
                }
                csv.push(line);
                //csv.push('"' + line.join('","') + '"');
            }
            csv = csv.sort(getStringCompareFunction(p => p[0]));
            var csvbuilder = [];
            csvbuilder.push(head.join(","));
            for (var i = 0; i < csv.length; i++) {
                var linestr = csv[i];
                csvbuilder.push('"' + linestr.join('","') + '"');
            }
            var csvcontent = csvbuilder.join("\n");
            console.log(csvcontent);
        }
        ShowMissingResources() {
            var me = this;
            var container = _SelectFirst(".missingresources", me.UIElement);
            container.innerHTML = GetHtml2(missingresources);
        }
        ExecuteSQL(element) {
            var me = View.GetView(this, element);
            var q1 = _SelectFirst("#SqlCommand", me.UIElement).value;
            var connection = document.getElementById("connection").value;
            application.httpClient.Post("~/webui/api/xdbquery", JSON.stringify({ commandtext: q1, connectionname: connection }), function (r) { window["Result"] = JSON.parse(r.responseText); console.log(window["Result"]); }, function (r) { console.log(r.responseText); }, "application/json");
        }
        ExecuteApi(element) {
            var me = View.GetView(this, element);
            var q1 = _SelectFirst("#ApiCommand").value;
            var url = _SelectFirst("#apiurl").value;
            var method = _SelectFirst("#apimethod").value;
            //AppDependencies.httpClient.ExecuteApi(url, method, q1, function (xhttp) {
            //    var response = JSON.parse(xhttp.responseText);
            //    console.log(response)
            //}, function (xhttp) {
            //    var response = JSON.parse(xhttp.responseText);
            //    console.log(response)
            //});
        }
    }
    Settings.List = List;
    class Login extends ViewModel {
        constructor(controller) {
            super("Login", controller);
            this.returnurl = "";
            this.IsMultiInstance = false;
        }
        Identifier() {
            return "Login";
        }
        Title() {
            return Res("general.Login");
        }
        FormatIdentifier(p) {
            return Format("{0}_{1}", this.Name, "");
        }
        Action(p) {
            var me = this;
            me.returnurl = decodeURI(Format("{0}", p));
            me.Model = {};
            me.Bind(me.UIElement, me.Model);
            var langelement = _SelectFirst(".culture", me.UIElement);
            langelement.innerHTML = "";
            var cultures = FirstNotNull(application.Settings.Cultures, []);
            cultures.forEach(function (item) {
                var option = document.createElement("option");
                option.text = Res("general.languages." + item);
                option.value = item;
                langelement.add(option);
            });
            //BindX(me.UIElement, me.Model);
            //me.AfterBind();
        }
        Login() {
            var me = this;
            var loginobj = GetBoundObject(me.UIElement);
            var wsid = loginobj["WSID"];
            var uname = loginobj["Username"];
            var pw = loginobj["Password"];
            SetParameter("WebServiceIdentifier", wsid);
            SetParameter("UserName", uname);
            SetParameter("Password", pw);
            application.SetCulture(loginobj["Language"]);
            var success = function (model) {
                OnAuthenticated(model);
                callasync(me.ShowSplashScreen);
                window.location.hash = FirstNotNull(me.returnurl, application.Settings.MainHash);
            };
            application.Authenticate(success);
        }
        ShowSplashScreen() {
            var rsx = FirstNotNull(AppDataLayer.Data["Contents"], []);
            var splasharticle = rsx.FirstOrDefault(i => i.Title == "SplashScreen");
            if (splasharticle != null) {
                var c = document.createElement("div");
                c.setAttribute("class", "modal");
                var builder = [];
                builder.push("<div>");
                builder.push('<span class="icon entypo-cancel topleft" onclick="this.parentElement.parentElement.remove()"></span>');
                builder.push(splasharticle.Content);
                builder.push("</div>");
                c.innerHTML = builder.join('\n');
                document.body.appendChild(c);
            }
        }
    }
    Settings.Login = Login;
    class Controller extends ModelController {
        constructor() {
            super();
            var me = this;
            this.ModelName = "Settings";
            this.Views = [
                new Settings.List(me),
                new Settings.Login(me)
            ];
            this.Views.forEach(function (v) {
                v.Controller = me;
            });
        }
    }
    Settings.Controller = Controller;
})(Settings || (Settings = {}));
RegisterController(application, () => new Settings.Controller());
class ValidationFuntionContainer {
    constructor() {
        this.Required = function (item) { return !IsNull(item); };
        this.Regex = function (item, regex) { return (new RegExp(regex).test(item)); };
        this.Number = function (item, regex) { return (new RegExp(/^[+-]?((\d+(\.\d*)?)|(\.\d+))$/).test(item)); };
    }
    Functions() {
        var me = this;
        var funcs = [];
        //for (var f in me)
        //{
        //    funcs.push(<Function>me[f]);
        //}
        return funcs;
    }
}
class AppDependencies {
    static Container() { return null; }
    ;
    static LoadContent(element) { }
    ;
}
AppDependencies.ClientValidation = true;
AppDependencies.DataLayer = null;
function OnAuthenticated(result) {
    Toast_Success("Authentication successful.");
    application.LoadData(result);
}
function GetParameter(key) {
    return localStorage.getItem(application.Settings.Domain + "." + key);
}
function SetParameter(key, value) {
    localStorage.setItem(application.Settings.Domain + "." + key, value);
}
function SetWebServiceIdentifier() {
    var input = document.getElementById("WebServiceIdentifier");
    var label = document.querySelector("span.WebServiceIdentifier");
    if (input.value.indexOf("*") == -1) {
        SetParameter("WebServiceIdentifier", input.value);
        //localStorage.setItem("WebServiceIdentifier", input.value);
        application.Authenticate(OnAuthenticated);
    }
}
function SetDataEntryPoint() {
    var input = document.getElementById("DataEntryPoint");
    var label = document.querySelector("span.DataEntryPoint");
    application.Settings.DataEntryPoint = input.value;
    application.httpClient.EntryPointBase = input.value;
    application.SaveSettings();
    application.Authenticate(OnAuthenticated);
}
function Login() {
    var view = application.CurrentView();
    var username = _SelectFirst("[name=username]", view.UIElement);
    var email = _SelectFirst("[name=email]", view.UIElement);
}
GetResource = function (key, culture) {
    return Res(key, culture);
};
var missingresources = {};
function RetrieveResource(key) {
    if (ResExists(key)) {
        return Res(key);
    }
    return "";
}
function ResNvl(keys, key = "") {
    if (IsNull(keys) || keys.length == 0) {
        return "";
    }
    var firstkey = keys.FirstOrDefault();
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (ResExists(key)) {
            return Res(key);
        }
    }
    if (firstkey.indexOf(".") > -1) {
        var lastkeypart = firstkey.substring(firstkey.lastIndexOf(".") + 1);
        return lastkeypart;
    }
    return FirstNotNull(key, firstkey);
}
ModelRes = function (key, viewpath = "") {
    var culture = application.Settings.Culture;
    var parts = key.split('.');
    var typename = parts.FirstOrDefault();
    var mkey = parts.slice(1).join('.');
    var mp = MetaAccess({ TypeName: typename }, mkey);
    var mc = GetMetaByTypeName(typename);
    var dotix = mkey.lastIndexOf(".");
    if (dotix > -1) {
        var s1 = mkey.substring(0, dotix);
        var s2 = mkey.substring(dotix + 1);
        mc = MetaAccess({ TypeName: mc.MetaKey }, s1);
        mkey = s2;
    }
    typename = IsNull(mc) ? null : mc.MetaKey;
    var labelaccessors = [
        () => RetrieveResource(Format("UI.{0}.{1}", viewpath, key)),
        () => Res(Format("models.{0}.{1}", typename, mkey)),
        () => RetrieveResource(Format("models.BaseModel.{0}", mkey)),
        () => mkey,
        () => key
    ];
    for (var i = 0; i < labelaccessors.length; i++) {
        let label = labelaccessors[i]();
        if (!IsNull(label)) {
            return label;
        }
    }
};
Res = function (key, culture) {
    if (IsNull(culture)) {
        culture = application.Settings.Culture;
    }
    var appres = application.Resources[culture][key];
    if (IsNull(appres) && appres != "") {
        appres = key.substr(key.lastIndexOf('.') + 1);
        if (!(key in missingresources)) {
            missingresources[key] = appres;
        }
    }
    return appres;
};
ResExists = function (key, culture) {
    if (IsNull(culture)) {
        culture = application.Settings.Culture;
    }
    var appres = application.Resources[culture][key];
    return !IsNull(appres);
};
class ResourceContainer {
    constructor() {
        this.Cultures = {};
    }
    Load(culture, obj, key) {
        var me = this;
        me[culture] = IsNull(me[culture]) ? {} : me[culture];
        me.Cultures[culture] = IsNull(me.Cultures[culture]) ? {} : me.Cultures[culture];
        var keys = Object.keys(me.Cultures[culture]);
        var rkey = Format("{0}_{1}", keys.length, key);
        me.Cultures[culture][rkey] = {};
        var container = me.Cultures[culture][rkey];
        var reourceobj = me[culture];
        var paths = ObjToPathValueList(obj);
        paths.forEach(function (path) {
            reourceobj[path[0]] = path[1];
            container[path[0]] = path[1];
        });
    }
}
class AppUICommand {
    constructor() {
        this.Key = "";
        this.CssClass = "";
        this.Url = (model, view, command) => "";
        this.IsInContext = (model, view) => true;
        this.OnClick = (model, view, command) => "";
        this.Prefix = "";
        this.Action = "";
        this.AppearsIn = [];
        this.Label = "";
        this.Html = "";
    }
    Render(model, control) {
        var me = this;
        var html = "";
        var uielement = null;
        if (me.IsInContext(model, control)) {
            var url = me.Url(model, control, me);
            var onclick = me.OnClick(model, control, me);
            if (!IsNull(url)) {
                uielement = _CreateElement("a", { class: me.CssClass, href: url });
            }
            if (!IsNull(onclick)) {
                uielement = _CreateElement("span", { class: me.CssClass, onclick: onclick });
            }
            if (uielement != null) {
                var text = Res("UI.Commands." + me.Prefix + me.Key);
                var label = _CreateElement("label", {}, text);
                uielement.setAttribute("title", text);
                uielement.appendChild(label);
                me.Html = uielement.outerHTML;
                html = me.Html;
            }
        }
        return html;
    }
    static GetFunctions(condition) {
        var result = [];
        if (condition != null) {
            var isview = condition.startsWith("view");
            var partsofcondition = TextsBetween(condition, "[", "]", false);
            for (var i = 0; i < partsofcondition.length; i++) {
                var partofcondition = partsofcondition[i];
                var conditionparts = partofcondition.split("=");
                var key = conditionparts.FirstOrDefault();
                var value = conditionparts.length > 1 ? conditionparts[1] : null;
                if (value == null) {
                    result.push((model, view) => {
                        var val = isview ? Access(view, key) : Access(model, key);
                        return !IsNull(val);
                    });
                }
                else {
                    result.push((model, view) => {
                        var val = isview ? Access(view, key) : Access(model, key);
                        return val == value;
                    });
                }
            }
        }
        return result;
    }
    static CreateFrom(obj) {
        var command = new AppUICommand();
        for (var key in obj) {
            command[key] = obj[key];
        }
        return command;
    }
    static Create(condition, appearsin, key, action, classprefix = "a-") {
        var command = new AppUICommand();
        command.Prefix = classprefix;
        command.Action = action;
        command.AppearsIn = appearsin;
        var conditions = CsvLineSplit(condition, ",", '"');
        var viewpart = conditions.FirstOrDefault(i => i.startsWith("view"));
        var modelpart = conditions.FirstOrDefault(i => i.startsWith("model"));
        var functions = [];
        if (viewpart != null) {
            functions = functions.concat(AppUICommand.GetFunctions(viewpart));
        }
        if (modelpart != null) {
            functions = functions.concat(AppUICommand.GetFunctions(modelpart));
        }
        var allfunction = (model, view) => {
            var result = true;
            for (var i = 0; i < functions.length; i++) {
                if (!functions[i](model, view)) {
                    return false;
                }
            }
            return result;
        };
        command.IsInContext = allfunction;
        command.CssClass = "icon " + classprefix + key;
        if (action.startsWith("#") || action.startsWith("http://")) {
            command.Url = (model, view, c) => Format(c.Action, Access(model, "Id"));
        }
        else {
            command.OnClick = (model, view, c) => Format(c.Action, Access(model, "Id"));
        }
        command.Key = key;
        //command.Label = Res("UI.Commands." + key);
        return command;
    }
    static CreateFromHtml(key, Render, isincontext) {
        var command = new AppUICommand();
        command.Key = key;
        command.Render = Render;
        if (!IsNull(isincontext)) {
            command.IsInContext = isincontext;
        }
        return command;
    }
}
const default_MoneyFormat = "### ##0.00";
function FormatCurrencyAmount(value) {
    if (!IsNull(value)) {
        return Number(Format("{0:" + default_MoneyFormat + "}", value));
    }
    return 0;
}
class Application {
    constructor() {
        //public Settings: AppSettings = <AppSettings>{};
        this.Resources = new ResourceContainer();
        this.data = {};
        this._Container = null;
        this._ScriptsReady = false;
        this._scriptwaiter = null;
        this.Commands = {};
        this.StaticDataQueryActions = {};
        this.ImportScripts = [];
        this.Controllers = [];
        this.Waiter = new Waiter();
        this.httpClient = new HttpClient();
        this.localhttpClient = new HttpClient();
        this.Menu = null;
        this._storename = ["SD", "Data", "Sync", "Files", "Info"];
        this._Settings = null;
        this.NavigationItems = {};
        this.Layouts = {
            Dictionary: {},
            Templates: {},
            load: function () {
                var me = this;
                var views = window["base_viewfiles"].concat(application.Settings.Views);
                views.forEach(function (layoutpath) {
                    var ix = layoutpath.lastIndexOf("\\");
                    var name = layoutpath.substring(ix + 1);
                    var nameparts = name.split(".");
                    var controlviewname = nameparts[0] + "." + nameparts[1];
                    var folder = layoutpath.substring(0, ix);
                    if (!(controlviewname in me.Dictionary)) {
                        me.Dictionary[controlviewname] = [];
                    }
                    else {
                        console.log('');
                    }
                    me.Dictionary[controlviewname].push(layoutpath);
                    me.Templates[layoutpath] = "";
                });
            }
        };
        this._idb = null;
        this.Refresh = window["_RefreshFiles"];
        var me = this;
        window["appsettings"] = Coalesce(window["appsettings"], { Imports: [] });
        me.scriptwaiter.SetWaiter("scripts", function () {
            me.LoadX();
        });
        me.scriptwaiter.SetTasks("scripts", ["appscripts", "customscripts"]);
        var db_name = Format("DB_{0}", me.Settings.Domain);
        me._idb = new IDB(db_name, me._storename);
    }
    get scriptwaiter() {
        if (this._scriptwaiter == null) {
            this._scriptwaiter = new Waiter();
        }
        return this._scriptwaiter;
    }
    RegisterCommand(command) {
        var me = this;
        me.Commands[command.Key] = command;
    }
    UnRegisterCommand(key) {
        var me = this;
        delete me.Commands[key];
    }
    ScriptsReady() {
        var me = this;
        HtmlHelpers.GetMinMaxDate = GetMinMaxDate;
        HtmlHelpers.ResNvl = ResNvl;
        HtmlHelpers.dataentrypoint = application.Settings.DataEntryPoint;
        HtmlHelpers.dataentrypoint = application.Settings.DataEntryPoint;
        HtmlHelpers.DateFormat = application.Settings.DateFormat;
        HtmlHelpers.DateTimeFormat = application.Settings.DateTimeFormat;
        HtmlHelpers.DecimalFormat = application.Settings.DecimalFormat;
        HtmlHelpers.MonetaryFormat = application.Settings.MonetaryFormat;
        ClientFilter.DateFormat = application.Settings.DateFormat;
        Controls.DateFormat = application.Settings.DateFormat;
        me._ScriptsReady = true;
        console.log("ScriptsReady");
        me.scriptwaiter.EndTask("scripts", "appscripts");
        AppDependencies.ClientValidation = application.Settings.ClientValidation;
        AppDependencies.LoadContent = function (item) { application.LoadContent.call(application, item); };
        AppDependencies.httpClient = application.httpClient;
        AppDependencies.DataLayer = new AppDataLayer();
    }
    IsInDebugMode() {
        return getUrlParameter('debug') == "1";
    }
    IsAdmin() {
        var me = this;
        var result = false;
        if (me.Settings.Company != null) {
            return me.Settings.Company["WebserviceUserId"] == 1;
        }
        return result;
    }
    get Container() {
        this._Container = _SelectFirst(".container");
        return this._Container;
    }
    get AppName() {
        var name = window.location.pathname;
        var appname = name.substr(name.lastIndexOf("/") + 1);
        if (appname.indexOf('.')) {
            appname = appname.substring(0, appname.lastIndexOf('.'));
        }
        return appname;
    }
    //private _RegisteredActions: AppActionOld[]=[];
    //public RegisterAction(action: AppActionOld) {
    //    var me = this;
    //    me._RegisteredActions.push(action);
    //}
    ReloadSettings() {
        var me = this;
        var dataentry = application.Settings.DataEntryPoint;
        me._Settings = null;
        var defaultsettings = window["appsettings"];
        var domain = defaultsettings.Domain;
        var domainsettingskey = domain + ".Settings";
        localStorage.removeItem(domainsettingskey);
        me.Settings.DataEntryPoint = dataentry;
        me.SaveSettings();
    }
    menuElement() {
        return _SelectFirst(".navigation");
    }
    LoadContent(item) {
        this.Container.appendChild(item);
    }
    DataPipe(data, v) {
    }
    Delete(element, args) {
        var toremove = element.parentElement;
        toremove.remove();
        if (!IsNull(toremove["OnRemove"])) {
            toremove["OnRemove"]();
        }
    }
    GetContainer() {
        return _SelectFirst(".container");
    }
    GetController(name) {
        return this.Controllers.FirstOrDefault((c) => c.ModelName == name);
    }
    Authenticate(callback) {
        var me = this;
        var waiter = new Waiter();
        //ShowProgress("p-Authenticate");
        waiter.SetWaiter("app", function () {
            //HideProgress();
        });
        waiter.SetTasks("app", ["login"]);
        var oldurl = window.location.origin + window.location.pathname;
        var px = "#Settings\\Login\\";
        var hash = window.location.hash.replace(px, "");
        var newhash = "#Settings\\Login\\" + encodeURI(hash);
        //var newurl = window.location.origin + window.location.pathname + "#Settings\\Login\\" + encodeURI(hash);
        application.Settings.Company = null;
        application.SaveSettings();
        me.httpClient.Authenticate(function (r) {
            application.Settings.Company = r.Model[0];
            application.SaveSettings();
            waiter.EndTask("app", "login");
            application.LoadMenu();
            callback.call(me, r.Model[0]);
        }, () => {
            window.location.hash = newhash;
        });
    }
    Navigate(source, args) {
        var me = this;
        var e = args[0];
        if (e.target != null && e.target.tagName == "LI") {
            application.menuElement().classList.remove('visible');
            var uid = e.target.getAttribute("uid");
            var url = e.target.getAttribute("url");
            var rp = this.GetRouteProperties(url);
            var controllername = rp.controller;
            var action = rp.view;
            if (!IsNull(url) && window.location.hash != url) {
                window.location.href = url;
            }
            else {
                me.NavigateTo(controllername, action, "");
            }
        }
    }
    NavigateTo(controller, view, p, area = "") {
        console.log(Format("NavigateTo({0},{1},{2},{2})", controller, view, p, area));
        var me = this;
        var mc = this.Controllers.FirstOrDefault((c) => c.ModelName == controller);
        if (mc != null) {
            var vm = mc.ViewDictionary[view];
            if (vm != null) {
                for (var i = 0; i < this.Container.children.length; i++) {
                    var node = this.Container.children[i];
                    _Hide(node);
                }
                var xvm = mc.Load(vm, p, "", area);
            }
        }
        else {
            var bc = this.Controllers.FirstOrDefault((c) => c.ModelName == "BaseModel");
            if (bc.IsAvailable(controller)) {
                var meta = GetMetaByTypeName(controller);
                if (!IsNull(meta)) {
                    mc = this.Controllers.FirstOrDefault((c) => c.ModelName == "BaseModel");
                    if (mc != null) {
                        var vm = mc.ViewDictionary[view];
                        if (vm != null) {
                            for (var i = 0; i < this.Container.children.length; i++) {
                                var node = this.Container.children[i];
                                _Hide(node);
                            }
                            var xvm = mc.Load(vm, p, meta.MetaKey, area);
                        }
                    }
                }
            }
        }
    }
    GetView(controllername, viewname, viewid = "") {
        var mc = this.Controllers.FirstOrDefault((c) => c.ModelName == controllername);
        if (mc != null) {
            var vm = mc.ViewDictionary[viewname];
            if (vm != null) {
                if (!IsNull(viewid)) {
                    if (viewid in mc.Instances) {
                        return mc.Instances[viewid].ViewModel;
                    }
                }
                return vm;
            }
        }
        return null;
    }
    GetRouteProperties(url = "") {
        var url = IsNull(url) ? window.location.hash : url;
        if (url.indexOf("#") == 0) {
            url = url.substr(1);
        }
        var paths = url.split("\\");
        var result = {
            area: "",
            controller: paths[0],
            view: paths[1],
            parameters: paths[2]
        };
        if (paths.length == 4) {
            result.area = paths[0];
            result.controller = paths[1];
            result.view = paths[2];
            result.parameters = paths[3];
        }
        return result;
    }
    NavigateUrl(url) {
        var me = this;
        if (url.indexOf("#") == 0) {
            url = url.substr(1);
        }
        for (var key in me.Settings.RouteSymbols) {
            if (url.indexOf(key) == 0) {
                url = url.replace(key, me.Settings.RouteSymbols[key]);
                window.location.hash = url;
                return;
                break;
            }
        }
        var rp = me.GetRouteProperties(url);
        me.NavigateTo(rp.controller, rp.view, rp.parameters, rp.area);
    }
    LoadX() {
        var me = this;
        me.LoadLayouts();
        me.ClearFloats();
        window.addEventListener("hashchange", function () {
            me.CloseHovering(document.body);
            me.NavigateUrl(window.location.hash);
        });
        var maingrid = _SelectFirst(".main.grid");
        var printarea = _SelectFirst("#printarea");
        window.addEventListener("beforeprint", function () {
            var currentview = me.CurrentView();
            if (!IsNull(currentview)) {
                _Hide(maingrid);
                printarea.innerHTML = "";
                currentview.BeforePrint(printarea);
                _Show(printarea);
            }
        });
        window.addEventListener("afterprint", function () {
            _Show(maingrid);
            _Hide(printarea);
        });
    }
    Load() {
        var me = this;
        let controller = Coalesce(window["_controllers"], []);
        controller.forEach(fc => {
            AddControllerToApplication(me, fc());
        });
        document.body.addEventListener("load", function () {
            application.LoadX();
        });
        //this.Settings = me.GetSettings();
        var customscripts = []; // me.Settings.CustomFiles.Where(i => i.endsWith(".js"));
        var customstyles = []; //me.Settings.CustomFiles.Where(i => i.endsWith(".css"));
        for (var i = 0; i < customstyles.length; i++) {
            var customcss = customstyles[i];
            var lelement = document.createElement('link');
            lelement.setAttribute('href', customcss);
            lelement.rel = "stylesheet";
            document.head.appendChild(lelement);
        }
        me.Settings.Imports.forEach(function (importscript) {
            var selement = document.createElement('script');
            selement.setAttribute('src', importscript);
            selement.type = "text/javascript";
            document.head.appendChild(selement);
        });
        var loadscript = function (selement) {
            //console.log("Loading " + selement.src);
            document.head.appendChild(selement);
        };
        if (customscripts.length == 0) {
            me.scriptwaiter.EndTask("scripts", "customscripts");
        }
        else {
            var customscriptwaiter = new Waiter();
            customscriptwaiter.SetWaiter("customscripts", function () {
                me.scriptwaiter.EndTask("scripts", "customscripts");
            });
            customscriptwaiter.SetTasks("customscripts", customscripts);
            for (var i = 0; i < customscripts.length; i++) {
                var src = customscripts[i];
                var selement = document.createElement('script');
                selement.setAttribute('src', src);
                selement.defer = true;
                selement.type = "text/javascript";
                selement.onload = function () {
                    var src = this.getAttribute("src");
                    customscriptwaiter.EndTask("customscripts", src);
                    console.log("---script loadded " + src + "");
                };
                loadscript(selement);
            }
        }
        this.httpClient.EntryPointBase = me.Settings.DataEntryPoint;
        this.localhttpClient.EntryPointBase = "";
    }
    get Settings() {
        var me = this;
        var defaultsettings = Coalesce(window["appsettings"], {});
        if (IsNull(defaultsettings["Scripts"])) {
            defaultsettings["Scripts"] = [];
        }
        var domain = defaultsettings.Domain;
        var domainsettingskey = domain + ".Settings";
        if (me._Settings == null) {
            var clientsettingsstr = localStorage.getItem(domainsettingskey);
            if (IsNull(clientsettingsstr)) {
                me.SaveSettings(defaultsettings);
            }
            var lssettings = JSON.parse(localStorage.getItem(domainsettingskey));
            if (!("HashCodeappsettings" in lssettings)) {
                lssettings["HashCodeappsettings"] = HashCode(JSON.stringify(defaultsettings));
                me.SaveSettings(lssettings);
                me._Settings = lssettings;
            }
            else {
                var newhash = HashCode(JSON.stringify(defaultsettings));
                if (newhash != lssettings["HashCodeappsettings"]) {
                    var dentry = lssettings["DataEntryPoint"];
                    var defaultsettingscopy = JsonCopy(defaultsettings);
                    defaultsettingscopy["DataEntryPoint"] = dentry;
                    defaultsettingscopy["HashCodeappsettings"] = newhash;
                    me.SaveSettings(defaultsettingscopy);
                    lssettings["HashCodeappsettings"] = HashCode(JSON.stringify(defaultsettingscopy));
                    me._Settings = defaultsettingscopy;
                }
                else {
                    me._Settings = lssettings;
                }
            }
        }
        //me._storename = "SD_" + me._Settings.Domain;
        return me._Settings;
    }
    SaveSettings(settings = null) {
        var me = this;
        var defaultsettings = Coalesce(window["appsettings"], {});
        var domain = defaultsettings.Domain;
        var domainsettingskey = domain + ".Settings";
        var settingsstr = JSON.stringify(IsNull(settings) ? me.Settings : settings);
        localStorage.setItem(domainsettingskey, settingsstr);
    }
    LoadLayouts() {
        //this.httpClient.EntryPointBase = this.entrypoint;
        var me = this;
        me.Layouts.load();
        var items = [];
        var waiter = new Waiter();
        waiter.SetWaiter("layouts", function () {
            f_loadviews();
            me.LoadUI.call(me);
            me.Authenticate(me.LoadData);
        });
        waiter.SetTasks("layouts", ["metadata", "resources"]);
        for (var layout in me.Layouts.Templates) {
            var layoutpath = Access(window, "appbaseurl") + layout;
            waiter.StartTask("layouts", layout);
            me.localhttpClient.Get(layoutpath, {}, function (r) {
                var relurl = IsNull(Access(window, "appbaseurl")) ? r.OriginalRequestUrl : Replace(r.OriginalRequestUrl, Access(window, "appbaseurl"), "");
                me.Layouts.Templates[relurl] = r.responseText;
                waiter.EndTask("layouts", relurl);
            });
        }
        var f_loadviews = function () {
            me.Controllers.forEach((controller) => {
                if (controller.ModelName == "BaseModel") {
                    console.log("BM");
                }
                controller.Views.forEach(function (vm) {
                    if (IsNull(vm.TemplateHtml)) {
                        var modelname = FirstNotNull(vm.LogicalModelName, vm.Controller.ModelName);
                        var controlviewname = Format("{0}.{1}", modelname, vm.Name);
                        var layouts = FirstNotNull(me.Layouts.Dictionary[controlviewname], []);
                        for (var i = 0; i < layouts.length; i++) {
                            var layoutpath = layouts[i];
                            var customlayoutpath = layoutpath.replace("layout\\", "Customisations\\" + application.Settings.Domain + "\\layout\\");
                            if (customlayoutpath in me.Layouts.Templates) {
                                vm.TemplateHtml = me.Layouts.Templates[customlayoutpath];
                                vm.LayoutPath = customlayoutpath;
                            }
                            else {
                                vm.TemplateHtml = me.Layouts.Templates[layoutpath];
                                vm.LayoutPath = layoutpath;
                            }
                            vm.OriginalTemplateHtml = vm.TemplateHtml;
                            var xpath = vm.LayoutPath.substring(0, vm.LayoutPath.lastIndexOf("."));
                            var extension = "";
                            if (xpath.endsWith(".razor")) {
                                extension = "razor";
                                try {
                                    var t = new RazorTemplate();
                                    t.LayoutPath = vm.LayoutPath;
                                    t.Compile(me.Layouts.Templates[vm.LayoutPath]);
                                    vm.AddTemplate("razor", t);
                                    //vm.RazorTemplate = Razor.Complile(me.Layouts.Templates[razorpath]);
                                }
                                catch (ex) {
                                    console.error("Error (" + ex + ") in " + vm.LayoutPath);
                                }
                            }
                        }
                    }
                });
            });
            Log("Views Loaded.");
        };
        me.Menu = application.Settings.Navigation;
        var metafiles = ["configdata\\meta.json", "configdata\\extendedmeta.json"];
        metafiles = metafiles.concat(me.Settings.CustomFiles.Where(i => i.endsWith("meta.json")));
        var metadictionary = {};
        var metawaiter = new Waiter();
        metawaiter.SetWaiter("metas", function () {
            metafiles.forEach(function (metafile) {
                metaModels.Load(metadictionary[metafile]);
            });
            waiter.EndTask("layouts", "metadata");
        });
        metawaiter.SetTasks("metas", metafiles);
        for (var i = 0; i < metafiles.length; i++) {
            var metafile = Access(window, "appbaseurl") + metafiles[i];
            me.httpClient.Get(metafile, {}, function (r) {
                var myArr = JSON.parse(r.responseText);
                var relurl = IsNull(Access(window, "appbaseurl")) ? r.OriginalRequestUrl : Replace(r.OriginalRequestUrl, Access(window, "appbaseurl"), "");
                metadictionary[relurl] = myArr;
                metawaiter.EndTask("metas", relurl);
            });
        }
        me.LoadResources(() => waiter.EndTask("layouts", "resources"));
    }
    SetCulture(culture) {
        var me = this;
        me.LoadResources(function () { });
    }
    LoadResources(callback) {
        var me = this;
        var resourcefilename = "resources-" + me.Settings.Culture + ".json";
        var resourcefiles = ["configdata\\" + resourcefilename];
        resourcefiles = resourcefiles.concat(me.Settings.CustomFiles.Where(i => i.endsWith(resourcefilename)));
        var resourcesdictionary = {};
        var resourcewaiter = new Waiter();
        resourcewaiter.SetWaiter("resources", function () {
            resourcefiles.forEach(function (resourcefile) {
                me.Resources.Load(me.Settings.Culture, resourcesdictionary[resourcefile], resourcefile);
            });
            callback();
        });
        resourcewaiter.SetTasks("resources", resourcefiles);
        for (var i = 0; i < resourcefiles.length; i++) {
            var resourcefile = Access(window, "appbaseurl") + resourcefiles[i];
            me.httpClient.Get(resourcefile, {}, function (r) {
                var myArr = JSON.parse(r.responseText);
                var relurl = IsNull(Access(window, "appbaseurl")) ? r.OriginalRequestUrl : Replace(r.OriginalRequestUrl, Access(window, "appbaseurl"), "");
                resourcesdictionary[relurl] = myArr;
                resourcewaiter.EndTask("resources", relurl);
            });
        }
    }
    LoadData(company) {
        var me = this;
        var cachemaxage = 3600;
        var datawaiter = new Waiter();
        //ShowProgress("LoadData");
        datawaiter.SetWaiter("data", function () {
            DataLookup.LookupFunction = AppDataLayer.DataLookup;
            if (window.location.hash.length > 1) {
                me.NavigateUrl(window.location.hash);
            }
        });
        var dcounter = 0;
        var savetoIDB = function () { };
        var retrievedata = function (callback) { callback([]); };
        var sd_storename = "SD";
        if (me._idb.IsAvailable()) {
            savetoIDB = function () {
                me._idb.Save(AppDataLayer.Data, sd_storename, function () {
                    var d = new Date();
                    SetParameter("DBDate", d.toString());
                });
            };
            retrievedata = function (callback) {
                var storedate = GetParameter("DBDate");
                var sdate = new Date(storedate);
                var cdate = new Date();
                var h = 1;
                sdate.setTime(sdate.getTime() + (h * 60 * 60 * 1000));
                if (isNaN(sdate.getTime())
                    || sdate < cdate) {
                    callback([]);
                }
                else {
                    me._idb.GetData(sd_storename, function (r) {
                        callback(r);
                    });
                }
            };
        }
        var queryswithactions = Object.keys(me.StaticDataQueryActions).Select(i => me.StaticDataQueryActions[i]);
        var querylist = queryswithactions.Select(i => i.query);
        datawaiter.StartTask("data", "obtain");
        retrievedata(function (r) {
            var idbdata = FirstNotNull(r, []);
            if (idbdata.length > 0) {
                AppDataLayer.Data = idbdata.FirstOrDefault();
                Log("data retrieved from IDB");
                datawaiter.EndTask("data", "obtain");
            }
            else {
                Log("retrieving data from server");
                me.httpClient.GetMultiData(querylist, function (r) {
                    var data = r;
                    console.log(r);
                    for (var key in data) {
                        if (key.indexOf("|") > -1) {
                            var queryname = key.split("|")[0];
                            var queryix = key.split("|")[1];
                            var queryitem = queryswithactions[queryix];
                            if (!IsNull(queryitem)) {
                                var onready = queryitem.onready;
                                onready(data[key].Model);
                            }
                            else {
                                Toast_Error(Format("Handler for query {0} was not found!", queryname));
                            }
                        }
                    }
                    AppDataLayer.Link();
                    Log("data retrieved from server");
                    datawaiter.EndTask("data", "obtain");
                    savetoIDB();
                }, null, 0);
            }
        });
    }
    LoadMenu() {
        var menuelement = _SelectFirst("#menu");
        var children = application.Settings.Navigation.Children;
        var adminnode = children.FirstOrDefault(i => i["Key"] == "Admin");
        var menuobj = { Children: [] };
        menuobj.Children = children;
        if (!this.IsAdmin()) {
            menuobj.Children = children.Where(i => i != adminnode);
        }
        TreeMenu(menuelement, menuobj);
    }
    LoadUI() {
        var footerelement = _SelectFirst(".main.grid>.footer");
        footerelement.innerHTML = Res("general.FooterHTML");
        this.LoadMenu();
        //application.Container = document.getElementsByClassName("container")[0];
        //StartJS();
        var settings = '<a id="action-center-button" class="icon entypo-cog" href="#Settings\\List"> </a>';
        var fragment = document.createElement("template");
        fragment.innerHTML = settings;
        var r_actions = _SelectFirst(".r-actions");
        r_actions.appendChild(fragment.content.children[0]);
        var onlineindicator = document.createElement("span");
        onlineindicator.classList.add("button");
        r_actions.appendChild(onlineindicator);
        var me = this;
        function updateIndicator() {
            if (!navigator.onLine) {
                onlineindicator.classList.add("entypo-block");
                _Show(onlineindicator);
            }
            else {
                onlineindicator.classList.remove("entypo-block");
                _Hide(onlineindicator);
            }
        }
        updateIndicator();
        window.addEventListener('online', updateIndicator);
        window.addEventListener('offline', updateIndicator);
    }
    ClearFloats(except = null) {
        var nav = _SelectFirst(".navigation");
        if (except != nav) {
            nav.classList.remove("visible");
            var e = nav;
            e["A_Show"] = function () {
                this.classList.add("visible");
                _Show(this);
            };
            e["A_Hide"] = function () {
                this.classList.remove("visible");
            };
        }
        var ac = document.querySelector("#action-center");
        if (except != ac) {
            ac.classList.add("hidden");
            var e = ac;
            e["A_Show"] = function () {
                this.classList.remove("hidden");
                _Show(this);
            };
            e["A_Hide"] = function () {
                this.classList.add("hidden");
            };
        }
        var vi = document.querySelector(".viewinstances");
        if (except != vi) {
            vi.classList.remove("pop");
            var e = vi;
            e["A_Show"] = function () {
                this.classList.add("pop");
                _Show(this);
            };
            e["A_Hide"] = function () {
                this.classList.remove("pop");
            };
        }
    }
    ToggleFloat(selector, ev) {
        var me = this;
        var e = _SelectFirst(selector);
        ev.stopPropagation();
        //HoverBox(e);
        //_Show(e);
        me.ClearFloats(e);
        if (selector == ".navigation") {
            e.classList.contains("visible") ? e["A_Hide"]() : e["A_Show"]();
        }
        if (selector == "#action-center") {
            e.classList.contains("hidden") ? e["A_Show"]() : e["A_Hide"]();
        }
        if (selector == ".viewinstances") {
            e.classList.contains("pop") ? e["A_Hide"]() : e["A_Show"]();
        }
    }
    CloseHovering(element, path = []) {
        //console.log("CloseHovering");
        var hovers = Array.from(document.querySelectorAll(".hovering"));
        var objects = document.querySelectorAll("app-objectpicker, app-autocomplete");
        objects.forEach(o => {
            let hs = o.shadowRoot.querySelectorAll(".hovering");
            if (hs.length > 0) {
                hovers.push(hs[0]);
            }
        });
        var parents = _Parents(element);
        if (path != null && path.length > 0) {
            parents = path.slice(1);
        }
        var hoveringparents = parents.Where(i => !IsNull(i.classList) && i.classList.contains("hovering"));
        if (element.classList.contains("hovering")) {
            hoveringparents.push(element);
        }
        var shouldclose = element.classList.contains("hoverclose") ? true : false;
        var hoverstoclose = hovers.Where(i => hoveringparents.indexOf(i) == -1);
        for (var i = 0; i < hoverstoclose.length; i++) {
            var htc = hoverstoclose[i];
            //if (!hovers[i].contains(element) || shouldclose) {
            if ("A_Hide" in htc) {
                htc["A_Hide"]();
            }
            else {
                if (htc.style.display != "none") {
                    console.log("Hiding: ");
                    console.log(htc);
                    _Hide(htc);
                }
            }
            //}
        }
    }
    UIClick(e) {
        var me = this;
        var target = e.target;
        var path = e["path"];
        if (IsArray(path) && path.length > 0 && !IsNull(path[0])) {
            target = path[0];
        }
        me.CloseHovering(target, Coalesce(path, []));
    }
    CurrentView() {
        var elements = _Select(".container>div");
        var element = null;
        elements.forEach(function (el) {
            if (el.style.display != "none") {
                element = el;
            }
        });
        if (element != null) {
            return view(element);
        }
        return null;
    }
    SaveToClient(data, storename, callback) {
        var me = this;
        me._idb.Save(data, storename, callback);
    }
    GetFromClient(storename, callback, filter = null) {
        var me = this;
        me._idb.GetData(storename, callback, filter);
    }
    RefreshStaticData(callback) {
        var me = this;
        me._idb.ClearStore("SD", function (r) {
            me.LoadData(application.Settings.Company);
            callback();
        });
    }
}
class App_ActionCenter extends HTMLElement {
    constructor() {
        super();
    }
    attributeChangedCallback(attrName, oldValue, newValue) {
        this[attrName] = this.hasAttribute(attrName);
    }
    connectedCallback() {
        var element = this;
        var htmlbuilder = [];
        htmlbuilder.push('<fieldset class="controller">');
        htmlbuilder.push('<legend>Action Center</legend>');
        htmlbuilder.push('<span class="button" rel="#log">Logs</span>');
        htmlbuilder.push('<span class="button" rel="#toasts">Messages</span>');
        htmlbuilder.push('</fieldset>');
        htmlbuilder.push('<div id="log" class="tab"></div>');
        htmlbuilder.push('<div id="toasts" class="tab" style="display:none"></div>');
        element.innerHTML = htmlbuilder.join('\n');
        var fieldset_e = _SelectFirst("fieldset", element);
        fieldset_e.addEventListener("click", function (event) {
            var target = event.target;
            if (target.tagName == "SPAN") {
                var tabs = _Select(".tab", element);
                tabs.forEach(function (tab) { _Hide(tab); });
                var tab = _SelectFirst(target.getAttribute("rel"), element);
                var links = _Select(".button", target.parentElement);
                links.forEach(function (link) { link.classList.remove("Selected"); });
                target.classList.add("Selected");
                _Show(tab);
            }
        });
    }
}
window.customElements.define("app-actioncenter", App_ActionCenter);
var application = new Application();
document.addEventListener("DOMContentLoaded", function () {
    console.log("register app-actioncenter");
});
function AddImportToApplication(s) {
    var existing = application.ImportScripts.FirstOrDefault(i => i.Name == s.Name);
    if (existing == null) {
        application.ImportScripts.push(s);
    }
}
function RegisterController(app, controllerF) {
    let _controllers = window["_controllers"];
    if (IsNull(_controllers)) {
        _controllers = [];
        window["_controllers"] = _controllers;
    }
    _controllers.push(controllerF);
}
function AddControllerToApplication(app, controller) {
    controller.Container = app.GetContainer;
    var exisingcontroller = application.GetController(controller.ModelName);
    if (exisingcontroller == null) {
        //console.log("  >adding controller " + Format("{0}.{1}", controller.NS, controller.ModelName));
        app.Controllers.push(controller);
    }
    else {
        //console.log("  >extending controller " + Format("{0}.{1}", controller.NS, controller.ModelName));
        for (var i = 0; i < controller.Views.length; i++) {
            var view = controller.Views[i];
            exisingcontroller.AddView(view);
        }
        for (var key in controller.Commands) {
            exisingcontroller.Commands[key] = controller.Commands[key];
        }
    }
}
application.Load();
var Models;
(function (Models) {
    class AppMessage {
    }
    Models.AppMessage = AppMessage;
    class BaseArticle {
    }
    Models.BaseArticle = BaseArticle;
    class Article extends BaseArticle {
    }
    Models.Article = Article;
    class Category {
    }
    Models.Category = Category;
})(Models || (Models = {}));
//# sourceMappingURL=Application.js.map