interface QueryLookupOptions
{
    QueryName?: string;
    LookupFields?: string[];
    ValueField?: string;
    DisplayField?: string;
}
class HtmlHelpers
{
    public view: any;
    public static dataentrypoint = "";
    public static DateFormat = "";
    public static DateTimeFormat = "";
    public static DecimalFormat = "";
    public static MonetaryFormat = "";
    public static ResNvl: Function;
    public static GetMinMaxDate: Function;
    public Res(Key: string): string 
    {
        return GetResource(Key);
    }
    public ModelRes(Key: string): string {
        return ModelRes(Key, this.view["LogicalModelName"]);
    }
    public Encode(txt: string): string {
        return HtmlEncode(txt);
    }

    public Url(url: string): string
    {
        var lurl = Format("{0}", url).toLowerCase();
        if (lurl.startsWith("http://") || lurl.startsWith("https://"))
        {
            return url;
        }
        return HtmlHelpers.dataentrypoint +"/"+ Replace(url, "~/", "");
    }
    public Link(url: string, title:string): string {
        if (IsNull(url)) {
            return Format('<span class="value">{0}</span>', title); 

        }
        var xurl = this.Url(url);

        return Format('<a class="value" download="" target="_blank" href="{0}">{1}</a>', xurl,title);
    }
    public Image(url: string, format: string): string {
        if (!IsNull(url)) {
            var xurl = Replace(url, "~/", "");
            var relativeurl = HtmlHelpers.dataentrypoint + "/" + Format(format, url);
            return Format('<img class="image" src="{0}" />', relativeurl)
        }
        return "";
    }

    public GetInputsFor(field:string, type:string, items: [], values:[]=null,source:[]=null): string
    {
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
            html = html + "</select>"
        } else {

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
    public FilterFor(key: string, typename?: string): string {
        var html = "";
        var me = this;
        var tn = Coalesce(typename, me.view.LogicalModelName);
        var viewfilterforfunction: Function = Access(me.view, "FilterFor");
        if (IsFunction(viewfilterforfunction)) {
            html = viewfilterforfunction.call(me.view, tn, key);

        }
        if (IsNull(html)) {
            var mt = GetMetaByTypeName(typename)
            var datatype = UIDataType.Number;
            var inputype = "text";
            var isobjectproperty = false;
            if (mt != null) {
                var pm = PropertyMetaAccess(tn, key);
                if (pm != null) {
                    inputype = pm.InputType;
                    isobjectproperty = pm.IsObject;
                    datatype = GetUIDataTypeFrom(pm.SourceType);
                }
            }
            if (isobjectproperty) {
                html = me.ObjectPickerFor(
                    tn,
                    <any>("." + key + "Id"),
                    null,
                    {
                        DisplayField: "Name",
                        LookupFields: ["Name"],
                        QueryName: pm.JSType,
                        ValueField: "Id"
                    }, { uidatatype: UIDataType[datatype] });
            }
            if (IsNull(html)) {
                html = Format('<input type="{0}" uidatatype="{1}" bind="{2}" value="" />', inputype, UIDataType[datatype], key);
            }
        }
        return html;
    }
    public GetFilter(options: IUIFilterOptions):string
    {
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

            var lookupfields = <any[]>Coalesce(options.LookUpFields, [displayfield]);
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
        hint = hint.replace(/"/g,'&quot;');
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

    public FieldFor(expression: string, hideifempty: boolean = true)
    {
        var html = "";
        var formatf = function (str) {
            var fieldfs = '<div class="field">\r\n' +
                '\t<span class="name" >@{meta.' + str + '.Label}</span>\r\n' +
                '\t<span class="value">@{model.' + str + '}</span>\r\n' +
                '</div>';
            return fieldfs;
        }
   
        return html
    }

    public LabelFor(model: object, expression: Function, UIType: string, attributes:Object): string
    {
        var val = IsNull(model) ? "" : expression(model);
        var exprstr = expression.toString();
        var simplified = exprstr.substr(exprstr.indexOf(".") + 1).trim(); 
        //var val = BindAccess(this, expression);

        if (UIType == "Date") {
            var fs = "{0:" + HtmlHelpers.DateFormat + "}";
            val = Format(fs, IsNull(val)?"": new Date(val));
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
        if (!IsNull(attributes))
        {
            for (var key in attributes)
            {
                attr.push(Format('{0}="{1}"', key, attributes[key]));
            }
        }
        return Format('<label name="{0}" {2}>{1}</label>', simplified, val, attr.join(' '));
    }

    public ValueFor(model: any, meta: ObjectMeta, parent:any=null): string {
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
            val = Format(fs, IsNull(val) ? "" : val, devizaname).trim();
        }
  
        return Format('{0}', val);
    }

    public Value(model: any, key: string): string {
        var mp: PropertyMeta = MetaAccess(model, key);
        //if (mp == null) { return ""}
        var parent = model;
        if (key.indexOf(".") > -1)
        {
            var parentkey = key.substring(0, key.lastIndexOf("."));
            parent = Access(model, parentkey);
        }
        var val = Access(model, key);
        if (IsObject(val)) {
            var displayfields = ["Name"];
            var obj = Access(model, key);
            var tn = Access(model, key+".TypeName");
            var id = Access(model, key+".Id");
            var val = displayfields.Select(i => Access(model, key + "." + i)).FirstOrDefault(i => !IsNull(i));
            if (!IsNull(val) ) {
                return Format('<a href="#{1}\\Details\\{2}">{0}</a>', val, tn, id);
            }

        }
        if (mp != null)
        {
            return this.ValueFor(val, mp, parent);
        }
        return val;
    }

    /*
     E - Editable
     C - Display on CreateViewModel
     S - Display on SaveViewModel
     A - Display everywhere Default
     V - Display on Views (Details\List) 

     */

    public ControlFor(model: any, key: string, scope: string = "", accessorprefix?: string): string {
        var me = this;
        var scopes = scope.split(",");
        if (scope.indexOf("E")>-1) {
            var viewhtml = "";
            var viewcontrolforfunction: Function = Access(me.view, "ControlFor");
            if (IsFunction(viewcontrolforfunction)) {
                viewhtml = viewcontrolforfunction.call(me.view, model, key, scope);

            }
            if (IsNull(viewhtml)) {

                var typename = model["TypeName"];
                var keyparts = key.split(".");
                var property = keyparts[keyparts.length - 1];
                var fkey = keyparts.slice(0, keyparts.length - 1).join(".");
                var em = MetaAccessByTypeName(typename, fkey);
                if (em != null) {
                    var pm: PropertyMeta = em[property];
                    var propertyexpression = "." + property;
                    if (!IsNull(pm) && pm.IsObject) {
                        viewhtml = me.AutoCompleteFor(
                            model,
                            <any>("." + key + "Id"),
                            accessorprefix,
                            {
                                DisplayField: "Name",
                                LookupFields: ["Name"],
                                QueryName: pm.JSType,
                                ValueField: "Id"
                            }, {});
                    }
                }
            }
            if (IsNull(viewhtml)) {
                return me.BoundInput(model, key);
            }
            return viewhtml;
        }
        if (IsNull(scope)) {
            return me.Value(model, key);
        }
    }
 
    public labelFor(model:any, expression: Function, attributes: Object): string {
      
        var exprstr = expression.toString();
        var simplified = exprstr.substr(exprstr.indexOf(".") + 1).trim();
        //var mp: PropertyMeta = Access(model,simplified);
        var mp: PropertyMeta = MetaAccess(model,simplified);
        //var val = BindAccess(this, expression);
        var attr = [];
        if (!IsNull(attributes)) {
            for (var key in attributes) {
                attr.push(Format('{0}="{1}"', key, attributes[key]));
            }
        }
        return Format('<span name="{0}" {2}>{1}</span>', simplified, mp.Label, attr.join(' '));
    }

    public GetLabel(key: string, attributes?: Object): string
    {
        var parts = key.split('.');
        var mkey = key;
        var typename = "";
        if (parts.length > 1) {
            typename = parts.FirstOrDefault();
            mkey = parts.slice(1).join('.');
        }
        
        return this.Label(typename, mkey, attributes);
    }
    public GetLabelText(key: string): string {
        var parts = key.split('.');
        var mkey = key;
        var typename = "";
        if (parts.length > 1) {
            typename = parts.FirstOrDefault();
            mkey = parts.slice(1).join('.');
        }

        return this.LabelText(typename, mkey);
    }

    public Text(key:string): string
    {
        var viewpath = Format("{0}.{1}", Access(this.view, "LogicalModelName"), Access(this.view, "Name"))
        var labeltext = ModelRes(key, viewpath);
        return labeltext;

    }
    public LabelText(model: any, key: string): string {
        var modelname = IsObject(model) ? model["TypeName"] : Format("{0}", model);
 
        var viewpath = Format("{0}.{1}", Access(this.view, "LogicalModelName"), Access(this.view, "Name"))
        var mkey = IsNull(modelname) ? key : (modelname + '.' + key);
        if (typeof model == "string")
        {
            mkey = model;
        }
        var labeltext = ModelRes(mkey, viewpath);

        return labeltext;
    }
    public Label(model: any, key: string, attributes?: Object): string
    {
        var modelname = IsObject(model) ? model["TypeName"] : Format("{0}", model);
        var attr = [];
        if (!IsNull(attributes)) {
            for (var attrkey in attributes) {
                attr.push(Format('{0}="{1}"', attrkey, attributes[attrkey]));
            }
        }
        var viewpath = Format("{0}.{1}", Access(this.view, "LogicalModelName"), Access(this.view, "Name"))
        var mkey = IsNull(modelname) ? key : (modelname + '.' + key);
        var labeltext = ModelRes(mkey, viewpath);
        
        return Format('<span name="{0}" {2}>{1}</span>', key, labeltext, attr.join(' '));
    }
    public ObjectPickerFor(model: any, expression: Function, labelexpression: Function, options: QueryLookupOptions, attributes: Object): string {

        var exprstr = expression.toString();
        var lookupfields = Coalesce(Access(options, 'LookupFields'), ["Name"]);
        var valuefield = Coalesce(Access(options, 'ValueField'), "Id");
        var displayfield = Coalesce(Access(options, 'DisplayField'), "Name");
        var queryname = Coalesce(Access(options, 'QueryName'), "");
        var lkpfstr = "['" + lookupfields.join("','") + "']";
        var datafunctionstr = 'function(a,b){ Partner.DataLayer.Instance.DataLookup(a,' + queryname + ',' + lkpfstr + ',' + valuefield + ',' + displayfield + ', b); }'

        var simplified = exprstr.substr(exprstr.indexOf(".") + 1).trim();
        //var mp: PropertyMeta = Access(model, simplified);
        var mp: PropertyMeta = MetaAccess(model, simplified);
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
    public AutoCompleteFor(model: any, expression: Function, accessorprefix: string="model", options: QueryLookupOptions, attributes: Object): string {

        var exprstr = expression.toString();
        var lookupfields = Coalesce( Access(options, 'LookupFields'),["Name"]);
        var valuefield = Coalesce(Access(options, 'ValueField'),"Id");
        var displayfield = Coalesce(Access(options, 'DisplayField'),"Name");
        var queryname = Coalesce(Access(options, 'QueryName'), "");
        var lkpfstr = "['" + lookupfields.join("','") + "']";
        var datafunctionstr = 'function(a,b){ Partner.DataLayer.DataLookup(a,\'' + queryname + '\',' + lkpfstr + ',\'' + valuefield + '\',\'' + displayfield + '\', b); }'
        if (IsNull(attributes)) {
            attributes = {}; 
        }
        var simplified = exprstr.substr(exprstr.indexOf(".") + 1).trim();
        var objname = simplified.substring(0, simplified.length - 2); 
     
        attributes["valuefield"] = valuefield;
        attributes["displayfield"] = displayfield;
        attributes["minlengthtosearch"] = "0";
        attributes["datafunction"] = datafunctionstr;
        attributes["value"] =  Access(model, simplified);
        attributes["label"] =  Access(model,  objname + "." + displayfield);
        //var mp: PropertyMeta = Access(model, simplified);
        var mp: PropertyMeta = MetaAccess(model, simplified);
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
    public InputFor(model:any, expression: Function, attributes: Object): string {
         
        var exprstr = expression.toString();
        var simplified = exprstr.substr(exprstr.indexOf(".") + 1).trim();
        //var mp: PropertyMeta = Access(model, simplified);
        var mp: PropertyMeta = MetaAccess(model, simplified);
        var val = undefined;
        if (mp != null)
        {
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
    public TextAreaFor(model: any, expression: Function, attributes: Object): string {
        var exprstr = expression.toString();
        var simplified = exprstr.substr(exprstr.indexOf(".") + 1).trim();
        var mp: PropertyMeta = Access(model, simplified);
        var val = undefined;
        if (mp != null) {
            val = model[mp.MetaKey];
            val = IsNull(val) ? model[simplified] : val;
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
    public BoundInput(model: any, key: string, attributes: any = {}): string {
        if (!("bind" in attributes)) {
            attributes["bind"] = key;
        }
        return this.Input(model, key, attributes);
    }
    public Input(model:any, key:string, attributes: Object): string {
        var me = this;
        var mp: PropertyMeta = MetaAccess(model, key);
        if (attr) { }
        var val = Access(model, key);
        var inputtype = "text";
        if (mp != null) {
            val = IsNull(val) ? "" : val;
            //val = Replace(me.Value(model, key)," ","");
            //val = Replace(val, ",", "");
            inputtype = mp.InputType;
        }
        if (inputtype == "date")
        {
            val = Format("{0:yyyy-MM-dd}", val);
        }
        var attr = [];
        if (!IsNull(attributes)) {
            for (var attrkey in attributes) { 
                attr.push(Format('{0}="{1}"', attrkey, attributes[attrkey]));
            }
        }

        return Format('<input type="{3}" name="{0}" {2} value="{1}"/>', key, val, attr.join(' '), inputtype);
    }

    public FormattedLabelFor(model: object, expression: Function, formatstring: string, attributes: Object): string {
        var val = expression(model);
        var exprstr = expression.toString();
        var simplified = exprstr.substr(exprstr.indexOf(".") + 1).trim();
        //var val = BindAccess(this, expression);

        var fs = "{0:" + formatstring + "}";
        var formattedval = Format(fs, IsNull(val)? "":Number(val));
        
        var attr = [];
        if (!IsNull(attributes)) {
            for (var key in attributes) {
                attr.push(Format('{0}="{1}"', key, attributes[key]));
            }
        }
        return Format('<label name="{0}" {2}>{1}</label>', simplified, formattedval, attr.join(' '));
    }
} 
//var html = new HtmlHelpers();