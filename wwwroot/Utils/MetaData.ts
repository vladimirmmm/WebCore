
interface IMeta
{
    MetaKey: string;
    Label: string;
    UIType: string;
    SourceType: string;
    Validations: string[];
    Editor: string;
    Validate(item:any): ValidationResult[];
}
class ValidationResult {
    public target: Object = null;
    public ID: string = "";
    public Message: string = "";
}
class ObjectMeta  
{
    public MetaKey: string;
    public UIType: string = "string";
    public SourceType: string = "string";
    public Validations: string[];
    public Editor: string;
    public Namespace: string = "";
    public DefaultValue: any = null;
    get Label(): string {
        var key = this.Namespace + "." + this.MetaKey;
        var label: string = "";
        if (ResExists(key)) {
            label = Res(key);
        } else
        {
            var basekey = this.Namespace.substring(0, this.Namespace.lastIndexOf(".")) + ".BaseModel." + this.MetaKey;
            if (ResExists(basekey)) {
                label = Res(basekey);
            } else
            {
                Res(key);
            } 
        }
        if (IsNull(label))
        {
            label= this.MetaKey;
        }
        return label;
    }

    get IsObject(): boolean
    {
        return this.SourceType.endsWith("{}");
    }
    get IsArray(): boolean {
        return this.SourceType.endsWith("[]");
    }
    get typeArgument(): string
    {
        var _typeArgument = this.SourceType;
        if (_typeArgument.indexOf("{") > -1 || _typeArgument.indexOf("[") > -1) { _typeArgument = _typeArgument.substring(0, _typeArgument.length - 2); }
        return _typeArgument;
    }
    get JSType(): string
    {
        var stype = "any";
        if (this.IsArray)
        {
            return this.typeArgument + "[]";
        }
        if (this.IsObject) {
            return this.typeArgument;
        }
        switch (this.SourceType.toLowerCase())
        {
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
            case "money":
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
    get InputType(): string {
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
    Validate(item: any): ValidationResult[]
    {
        var results = [];
        return results;
    };

}
class PropertyMeta extends ObjectMeta
{
    public ReferenceField: string;
    public static GetMetaFrom(obj: Object): PropertyMeta {
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
class EntityMeta extends ObjectMeta
{
    public Fields: PropertyMeta[] = [];
    public Keys: string[] = ["Id"];

    public IsEqualByKeys(a: Object, b: Object): boolean {
        var result = true;
        if (IsNull(a) || IsNull(b)) { return false; }
        if (keyattribute in a) {
            if (a[keyattribute] != b[keyattribute]) { result = false; }
        }
        else
        {
            this.Keys.forEach(function (key) {
                if (IsNull(a[key]) && IsNull(b[key])) { return true; }

                if (a[key] != b[key]) { result = false; }

            });
        }
        
        return result
    }
    public HasKey(a: Object): boolean {
        var result = false;
        this.Keys.forEach(function (key) {
            if (!IsNull(a[key]))
            { result = true; }
        });
        return result
    }
    public SetProperties(data: Object, recursive: boolean=false, level:number=0) {
        for (var i = 0; i < this.Fields.length;i++) {
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

    public static GetMetaFrom(obj: Object,metakey:string,ns:string=""): EntityMeta {
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

class MetaModels
{
    ns: string = "models";
    public Entities: EntityMeta[] = [];
    public Load(obj: Object)
    {
        for (var item in obj) {
            var metakey = item;
            var metaobj = obj[item];
            var entitymeta = GetMetaByTypeName(metakey);
            if (entitymeta == null) {
                var entitymeta = EntityMeta.GetMetaFrom(metaobj, metakey, this.ns);
                entitymeta.MetaKey = metakey;
                this.Entities.push(entitymeta);
            } else
            {
                for (var field in metaobj)
                {
                    var fieldmeta = PropertyMeta.GetMetaFrom(metaobj[field]);
                    fieldmeta.MetaKey = field;
                    fieldmeta.Namespace = entitymeta.Namespace + "." + entitymeta.MetaKey;

                    if (!(field in entitymeta)) {
                        entitymeta[field] = fieldmeta;
                        entitymeta.Fields.push(fieldmeta);
                    } else
                    {
                        var existingfield = entitymeta.Fields.FirstOrDefault(i => i.MetaKey == field)
                        var ix = entitymeta.Fields.indexOf(existingfield);
                        entitymeta.Fields[ix] = fieldmeta;
                    }
                    entitymeta[field] = fieldmeta;
                }
            }
        }
    }

    public CreateEntity(typename: string)
    {
        var result = { TypeName: typename };
        var meta = GetMeta(result);
        meta.SetProperties(result, true);
        return result
    }

    public GenerateTSInterface(typename: string): string
    {
        var result = "";
        var meta = GetMetaByTypeName(result);
        result = result + " interface I" + meta.MetaKey + "\r\n"; 
        result = result + " {"; 
        meta.Fields.forEach(function (field) {
            result = result +"      "+ field.MetaKey+": "+field.JSType+ ";\r\n";
        });
        result = result + " }"; 

        return result;
    }
}
var metaModels = new MetaModels();

function FixUpdateObjWithMeta(obj, settings: any = {}, application: any = {}) {
    var mt = GetMeta(obj);
    for (var key in obj) {
        if (!IsNull(obj[key]) && !IsNull(mt) && (key in mt)) {
            var pmt = <PropertyMeta>mt[key];
            if (pmt != null && In(pmt.SourceType, "Date")) {
                var d = IsDate(obj[key]) ? obj[key] : StringToDate(obj[key], Coalesce(application?.Settings?.DateFormat, settings.DateFormat));

                obj[key] = Format("{0:yyyy-MM-dd}", d);
            }
            if (pmt != null && In(pmt.SourceType, "DateTime")) {
                var d = IsDate(obj[key]) ? obj[key] : StringToDate(obj[key], Coalesce(application?.Settings?.DateFormat, settings.DateFormat));

                obj[key] = Format("{0:yyyy-MM-ddTHH:mm:ss}", d);
            }
            if (pmt != null && In(pmt.SourceType, "double", "integer", "money")) {
                obj[key] = Number(obj[key]);

            }
        }
        if (IsNull(obj[key])) {
            delete obj[key];
        } else {
            if (IsArray(obj[key])) {
                for (var i = 0; i < obj[key].length; i++) {
                    FixUpdateObjWithMeta(obj[key][i], settings);
                }
            }

        }

    }
}


function GetUIDataTypeFrom(sourcetype: string)
{
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

function GetMeta(obj:Object) 
{
    var typename = obj == null ? "" : obj.hasOwnProperty("TypeName") ? obj["TypeName"] : "";
    return GetMetaByTypeName(typename);
}
function GetMetaByTypeName(typename: string) {
    return metaModels.Entities.FirstOrDefault((i: EntityMeta) => i.MetaKey == typename);
}

function SetObjectTo(item: Object, typename: string)
{
    item["TypeName"] = typename;
    var meta = GetMeta(item);
    meta.SetProperties(item);
}
function SetTypeName(item: Object, typename: string)
{
    item["TypeName"] = typename;

}
function __x() { }
function MapObject(source: Object, target: Object, cleararray = true, xmeta: EntityMeta = null) {
    var meta = IsNull(xmeta) ? GetMeta(target) : xmeta;
    if (meta.IsEqualByKeys(source, target) || meta.Keys.length == 0) {
        var properties = GetProperties(source);
        for (var i = 0; i < properties.length; i++) {
            var propertyname = properties[i].Key.toString();
            var pmeta: PropertyMeta = meta[propertyname];

            var propertyvalue = properties[i].Value;
            var targetpropertyvalue = target[propertyname];
            if (propertyvalue instanceof Array) {

                var items = <[]>propertyvalue;
                if (cleararray) {
                    target[propertyname] = [];
                }
                if (propertyvalue.length > 0) {
                    var ameta = GetMetaByTypeName(pmeta.typeArgument);
                    for (var ix = 0; ix < items.length; ix++) {
                        var item = items[ix];
                        var existing = null;
                        if (!IsNull(target[propertyname])) {
                            existing = target[propertyname].FirstOrDefault((x) => ameta.IsEqualByKeys(x, item))
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
    } else {
        Log("MapObject: source and target have different keys(s)");
    }
}

function MapObjectCI(source: Object, target: Object, cleararray = true) {
    var meta = GetMeta(target);
    if (!meta.HasKey(target) || meta.IsEqualByKeys(source, target) || meta.Keys.length == 0) {
        var properties = GetProperties(source);
        var targetproperties = GetProperties(target);
        for (var i = 0; i < properties.length; i++) {
            var propertyname = properties[i].Key.toString();
            var lpropertyname = propertyname.toLowerCase();
            var tp = targetproperties.FirstOrDefault((p: KeyValue) => p.Key.toString().toLowerCase() == lpropertyname);
            if (tp != null) {
                var tpropertyname: string = <any>tp.Key;
                var propertyvalue = properties[i].Value;
                var targetpropertyvalue = target[tpropertyname];
                if (propertyvalue instanceof Array) {

                    var items = <[]>propertyvalue;
                    if (cleararray) {
                        target[tpropertyname] = [];
                    }
                    if (propertyvalue.length > 0) {
                        var ttypeargument = tpropertyname in meta ? meta[tpropertyname].typeArgument : "";
                        var ameta = GetMetaByTypeName(ttypeargument);

                        for (var ix = 0; ix < items.length; ix++) {
                            var item = items[ix];
                            //var targetarray = (<[]>targetpropertyvalue)
                            var existing = target[tpropertyname].FirstOrDefault((x) => ameta.IsEqualByKeys(x, item))
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
    } else {
        Log("MapObject: source and target have different keys(s)");
    }
}
function GetMetaKeyChain(typename: string, key: string): object[]
{
    if (key == null) { return null; }
    var m = GetMetaByTypeName(typename);
    if (m == null) { return null;}
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
function PropertyMetaAccess(typename: string, key: string) {
    var keyparts = key.split(".");
    var property = keyparts[keyparts.length - 1];
    var fkey = keyparts.slice(0, keyparts.length - 1).join(".");
    var em = MetaAccessByTypeName(typename, fkey);
    if (em != null) {
        var pm: PropertyMeta = em[property];
        return pm;
    }
    return null;
}
function MetaAccessByTypeName(typename: string, key: string): PropertyMeta
{
    if (IsNull(typename)) { return null;} 
    if (key == null || key=="") {
        //return null;
        return <any>GetMetaByTypeName(typename);
    }
    if (typename == null) { return null; }
    var m = GetMetaByTypeName(typename);
    var parts = key.split(".");
    var result = null;
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        var field = m.Fields.FirstOrDefault(i => i.MetaKey == part);
        if (field == null)
        {
            return null;
        }
        if (field.IsObject) {
            m = GetMetaByTypeName(field.typeArgument);
            result = m;
        }
        else if (field.IsArray) {
            m = GetMetaByTypeName(field.typeArgument);
            result = m;
            
        } else {
            result = field;
        }
    }
    return result;

}
function MetaAccess(obj, key: string): PropertyMeta {
    if (IsNull(obj)) { return null; }
    var tn = obj["TypeName"];
    return MetaAccessByTypeName(tn,key);
}

function DF_Meta(root:string, txt: string, callback: Function)
{
    var meta = GetMetaByTypeName(root);
    var ltxt = txt.toLowerCase();
    if (meta != null)
    {
        var parts = txt.split('.');
        var parentpath = "";
        if (parts.length > 1)
        {
            parentpath = parts.slice(0, parts.length - 1).join(".");
            meta = <any>MetaAccessByTypeName(root, parentpath);
            ltxt = parts[parts.length - 1].toLowerCase();
        }
        if (meta.IsArray || meta.IsObject) {
            meta = GetMetaByTypeName(meta.typeArgument);
        }
        var results = meta.Fields.Where(i => i.MetaKey.toLowerCase().indexOf(ltxt) > -1).Select(i => {
            var t = "";
            if (i.Namespace == "models") {
                t = " {}";
            } else
            {
                if (i.IsArray)
                {
                    t = " []";
                }
            }
            return {
                
                MetaKey: i.MetaKey+t,
                Path: (parentpath.length == 0 ? "" : parentpath + ".") + i.MetaKey
            };
        })
        callback(results);
    }
}