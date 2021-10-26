class ImportScript {
    public Id: string = "";
    public Name: string = "";
    public Description: string = "";
    public DetailsUrl: string = "";
    public ViewUrl: string = "";
    public TypeName: string = "ImportScript";

    public CallBack_LookupData: Function = function () { };
    public CallBack_DataReady: Function = function () { };

    public Load(formdata: FormData, extension: string) {
        var result: DictionaryOf<any>[] = [];
    }



    public SaveAll(view: View) {
    }
}
 
class ExcelImport extends ImportScript {
    public ExcelQuery: string = "";
    public ExcelOptions: string = "";
    public Url: string = "~/webui/api/ximportexcel";

    public SetExcelVersion(extension: string) {
        var lextension = extension.toLowerCase();
        var excelver = lextension == "xlsx" ? "Excel 12.0" : "Excel 8.0";
        this.ExcelOptions = this.ExcelOptions.replace("#excelver", excelver);
    }

    public ExcelData: any = null;
    public CallBack_ExcelData: Function = function (data: any) {
        this.ExcelData = data;
    };

    public LoadExcel(data: any) {

    }

    public ReloadExcel() {
        var me = this;
        if (!IsNull(me.ExcelData)) {
            me.LoadExcel(me.ExcelData);
        }

    }

    public Clear() {

    }
}

class AppDataLayer
{
    public static Queries: any = {};
    public static Instance = new AppDataLayer();
    public static Data:any = {};
    public static Link() { }

    public static GetQueryForAutoComplete(queryname: string): ClientQuery {
        var query: ClientQuery = ClientQuery.New({
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

    public static GetDataDetails(query: ClientQuery, id: string, callback: Function) {
        query.SetFilters(ClientFilter.Create(UIDataType.Number, "Id", id));
        BaseModel.Dependencies.httpClient.GetData(query,
            function (r) {
                var data = r;
                var items = <any[]>data["Model"];
                callback(items[0]);
            },
            null);
    }

    public static Lookup(queryname: string, lookupfields: string[], valuefieldname: string, displayfieldname: string): Function {
        var datafunction = function (value: string, callback: Function) {
            var lowervalue = value.toLowerCase();
            var uppervalue = value.toUpperCase();

            var dataname = queryname + 's';
            if (dataname in AppDataLayer.Data) {
                var data: [] = AppDataLayer.Data[dataname];
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
        }
        return datafunction;
    }

    public static DataLookupByQuery(value: string, query: ClientQuery, lookupfields: string[], callback: Function) {
        var uppervalue = value.toUpperCase();

        //query.Filters = <IClientFilter[]>lookupfields.Select(i => { return new StringFilter(i + ":" + uppervalue).GetQuery().FirstOrDefault() });
        if (!IsNull(uppervalue)) {
            var filters: IClientFilter[] = lookupfields.Select(i => {
                var isexact = i.startsWith("[") && i.endsWith("]");
                if (isexact) {
                    let fieldname = TextBetween(i, "[", "]");
                    return ClientFilter.Create(UIDataType.Text, fieldname, "[" + value + "]").FirstOrDefault()

                } else {
                    return ClientFilter.Create(UIDataType.Text, i, uppervalue).FirstOrDefault()

                }
            });
            if (filters.length == 1) {
                query.SetFilters(filters);

            } else {
                var orfilter = new ClientFilter();
                orfilter.Operator = "OR";
                orfilter.Field = "Id";
                orfilter.Children = filters;
                query.SetFilter(orfilter);
            }
        }
        query.Take = application.Settings.PageSize;
        AppDependencies.httpClient.GetData(query,
            function (r: AppResponse) {
                var items = r.Model;
                console.log(r);
                callback(items);//.Select(i => { return { Value: i[valuefieldname], Display: i[displayfieldname] } }));
            },
            null);
    }

    public static DataLookup(value: string, queryname: string, lookupfields: string[], valuefieldname: string, displayfieldname: string, callback: Function) {
        var me = this;
        var lowervalue = value.toLowerCase();
        var uppervalue = value.toUpperCase();

        var dataname = queryname + 's';
        if (dataname in AppDataLayer.Data) {
            var data: [] = AppDataLayer.Data[dataname];
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

    public static GetQueryByName(name: string): ClientQuery {
        if (name in AppDataLayer.Queries) {
            return ClientQuery.New(JSON.parse(JSON.stringify(AppDataLayer.Queries[name])));
        }
        return null;

    }

    public static CreateListQuery(meta: EntityMeta): ClientQuery {
        return AppDataLayer.CreateListQueryByName(meta.MetaKey);
    }

    public static CreateListQueryByName(queryname: string, fields: string[] = []): ClientQuery {
        var ffields = fields.length == 0 ? [{ Name: "*" }] : fields.Select(function (i) { return { Name: i }; });
        var query: ClientQuery = ClientQuery.New({
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

    public static CreateDetailsQueryByName(queryname: string, Id: any): ClientQuery {
        var query: ClientQuery = ClientQuery.New({
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


    public static GetData(query: ClientQuery, onsuccess: Function, onerror: Function) {
        application.httpClient.GetData(query, onsuccess, onerror);
    }     
}

interface NavigationItem {
    Key: string;
    Name: string;
    Content?: string;
    ContentURL?: string;
    ParentKey?: string;
    Parameters?: Object;
    Children?: NavigationItem[];
    Url?: string
}

interface IParameterDictionary extends IDictionary<string> {
    page?: any;
    type?: any;
    id?: any;
    orderby?: any;
}
class SearchParameters implements Object {
    public page?: any;
    public type?: any;
    public id?: any;
    public orderby?: any;
    public initiator?: any;

    public static Ensure(obj: Object, paramdictionary?: IParameterDictionary): SearchParameters {
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
    public Name: string;
    public LayoutPath: string = "";
    public Templates: DictionaryOf<IViewTemplate> = {};
    public Commands: DictionaryOf<AppUICommand> = {};

    public CopyTemplates(): DictionaryOf<IViewTemplate> {
        var me = this;
        var result: DictionaryOf<IViewTemplate> = {};
        for (var key in me.Templates) {
            result[key] = me.Templates[key].Copy();
        }
        return result;
    }
    public Close(): boolean {
        var me = this;
        var canclose = true;
        if (me.IsDirty) {
            canclose = confirm(Res("general.CloseUnsavedComfirmation"))
        }
        if (canclose) {
            _Hide(me.UIElement);

            me.UIElement.remove();
            var controller = application.GetController(me.Controller.ModelName);
            var instances: ViewInstance[] = Object.keys(controller.Instances).Select(i => controller.Instances[i]);
            var vi = instances.FirstOrDefault(i => i.ViewModel == me);

            var viewhead = vi.UIElement;

            var prev = viewhead.previousElementSibling;
            var next = viewhead.previousElementSibling;
            var toshow: Element = Coalesce(prev, next);
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
    public AddTemplate(extension: string, template: IViewTemplate) {
        this.Templates[extension] = template;
    }
    public GetTemplate(extension: string): IViewTemplate {
        return this.Templates[extension];
    }

    public Bind(itemorselector: any, model: any, context?: any, poptions: BindOptions = {}) {
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
        var viewtemplate: IViewTemplate = FirstNotNull(me.Templates[options.extension], old);
        var element: Element = itemorselector;
        var rootelement = me.UIElement;
        var selector = "";

        if (typeof element == "string") {
            var selectors = (<string>itemorselector).split("!");
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
                var classes = (<HTMLElement>ctnode).getAttribute("class");
                DomDiff.Map(rootelement, ctnode, options);
                rootelement.setAttribute("class", classes);

            }
        } else {
            var html = viewtemplate.Bind(model, context, options);
            element.innerHTML = html;
        }
        me.AfterBind();
    }

    public static GetView<T>(me: T, element?: any): T {
        var uselement = IsNull(me) || !(me instanceof View);
        return <T>(uselement ? view(element) : me);
    }

    public parameterstr(): string {
        var url = window.location.hash;
        var paths = url.split("\\");
        var p = "";

        if (paths.length > 2) {
            p = paths[paths.length - 1];
        }
        return p;
    }
    public GetParameterDictionary(p: any = ""): IParameterDictionary {
        p = IsNull(p) ? "" : p;
        if (p.length == 0) {
            p = this.parameterstr();
        }
        var result: IParameterDictionary = { id: null, page: null, type: null };
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
            } else if (this.Name == "Create") {
                result.type = unnamedparts[0];
            }
            else {
                result.id = unnamedparts[0];
            }
        } else if (unnamedparts.length > 1) {
            result.type = unnamedparts[0];
            if (this.Name == "List") {
                result.page = unnamedparts[1];
            } else {
                result.id = unnamedparts[1];
            }

        }
        if (result.page == "") { result.page = 1; }
        return result;
    }

    public Area: string = "";
    public UIElement: Element;
    public OriginalTemplateHtml: string;
    public TemplateHtml: string;
    public RazorTemplate: RazorTemplate;
    public ViewBag: DictionaryOf<Object> = {};
    public Controller: ModelController = null;
    public IsDirty: boolean = false;
    public IsMultiInstance: boolean = false;
    public LogicalModelName: string = "";

    public SelectFirst(selector: string): Element {
        return _SelectFirst(selector, this.UIElement);
    }

    public Identifier(): string {
        return "";
        //throw "Identifier Not Implemented on " + this.Name;
    }
    public IsList(): boolean {
        return this.Name == "List" ? true : false;
    }
    public FormatIdentifier(p: any, area: string = ""): string {
        return Format("{0}_{1}_{2}", this.Name, area, IsNull(p) ? "" : p);
    }
    public Title(): string {
        return this.LogicalModelName + "-" + this.Name;
        //throw "Identifier Not Implemented on " + this.Name;
    }

    constructor(Name: string, controller: ModelController = null, ) {
        this.Name = Name;
        this.Controller = controller;
    }

    public Copy(): View {
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

    public Action(p: Object) {

    }

    public BeforeBind() {

    }

    public AfterBind(navigate: boolean = true) {
        var me = this;
    }

    public Changed() {
        console.log("Changed");
    }



    public BeforePrint(printarea: Element) {

    }

    public PageSize(): number {
        var me = this;
        var pagesizekey: string = Format("UI.{0}.{1}.PageSize", me.Controller.ModelName, me.Name);
        return FirstNotNull(Access(application.Settings, pagesizekey), application.Settings.PageSize);
    }
    public SavePageSize(pagesize: number) {
        var me = this;
        var pagesizekey: string = Format("UI.{0}.{1}.PageSize", me.Controller.ModelName, me.Name);
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


class ViewModel<T> extends View {
    public Model: T = null;

    constructor(Name: string, controller: ModelController = null) {
        super(Name, controller);
        var me = this;
        var modelname = Coalesce(this.LogicalModelName, controller.ModelName);
        var viewurlformat = "#" + modelname + "\\" + Name + "\\{0}";
        //this.RegisterCommand(AppUICommand.Create("",["header"], "Close", "view(this).Close();"));
        //this.RegisterCommand(AppUICommand.Create("model[TypeName]",["header"], "Reload", "view(this).Action();"));
        controller.RegisterCommand(AppUICommand.Create("model[Id]", ["header", "item"], Name, viewurlformat, "v-"));

    }


    public RegisterCommand(command: AppUICommand) {
        var me = this;
        me.Commands[command.Prefix + command.Key] = command;
    }

    public Copy(): ViewModel<T> {
        var creator: Function = eval("(function (obj,c) { return new obj.constructor(c);})");
        var copy: ViewModel<T> = creator(this, this.Controller);
        copy.LayoutPath = this.LayoutPath;
        copy.TemplateHtml = this.TemplateHtml;
        copy.Templates = this.CopyTemplates();
        copy.ViewBag = this.ViewBag;
        copy.Controller = this.Controller;
        copy.OriginalTemplateHtml = this.OriginalTemplateHtml;


        copy.Model = this.Model;
        return copy;
    }


    public AfterBind(navigate: boolean = true) {
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
                    (<any>datatable["OnDataBound"])();
                }
            }
        }
    }
    public GetCommandbarHtml(model: any): string {
        var me = this;
        return me.GetCommandbarContentHtml(model);
        //var htmlbuilder = [];
        //htmlbuilder.push('<app-commandbar>');
        //htmlbuilder.push('<div class="flexcontent">');
        //htmlbuilder.push('</div>');
        //htmlbuilder.push('</app-commandbar>');
        //return htmlbuilder.join('\n');

    }
    public GetCommandbarContentHtml(model?: any): string {
        var me = this;
        var htmlbuilder = [];

        var viewcommands: AppUICommand[] = Object.keys(me.Commands).Select(i => me.Commands[i]);
        var controllercommands: AppUICommand[] = Object.keys(me.Controller.Commands).Select(i => me.Controller.Commands[i]);
        var applicationcommands: AppUICommand[] = Object.keys(application.Commands).Select(i => application.Commands[i]);
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

    public DownloadModel() {
        var me = this;
        var datalink = Format('data:application/octet-stream;charset=utf-8,{0}', encodeURIComponent(JSON.stringify(me.Model, null, 4)));
        var dataname = Format("{0}-{1}.json", me.LogicalModelName, me.Name);
        download(dataname, datalink);

    }

    public async ShowValidationResults(results: ValidationRuleResult[], item: T): Promise<boolean> {
        var me = this;

        var control = <App_Validation>_SelectFirst("app-validation", me.UIElement);
        if (control == null) {
            control = new App_Validation();
            control.classList.add("modal");
            var appheader = _SelectFirst("app-header", me.UIElement);
            control.TypeName = item["TypeName"];
            _Hide(control);
            appheader.appendChild(control);

        }

        var promise = new Promise<boolean>((resolve, reject) => {
            if (results.length == 0) {
                resolve(true);
            } else {
                control.Load(results, (val) => {
                    resolve(val);
                });
            }
        });

        return promise;
    }

}

class DataList<T>
{
    Items: T[] = [];
    Columns: string[] = [];
}
class SaveViewModel<T> extends ViewModel<T> {
    constructor(Name: string, controller: ModelController = null) {
        super(Name, controller);
        var viewurlformat = "#" + Coalesce(this.LogicalModelName, controller.ModelName) + "\\" + Name + "\\{0}";
        controller.RegisterCommand(AppUICommand.Create("model[Id]", ["item", "header"], Name, viewurlformat, "v-"));
        this.RegisterCommand(AppUICommand.Create("view[SavePost]", ["header"], "Save", "view(this).SavePost(this)", "a-"));
    }

    public SaveDraft() {
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
        })
        //app.idb
    }

    public LoadDraft(ondataload: Function = null) {
        var me = this;
        var app = application;
        var xondataload = IsFunction(ondataload) ? ondataload : () => { me.Bind(me.UIElement, me.Model) }
        var viewkey = me.Controller.ModelName + "." + me.Name;
        app.GetFromClient<T>("Data", (result: T[]) => {
            var item = result.OrderByDescending(i => i["__SaveDate"]).FirstOrDefault();
            me.Model = item;
            xondataload();

        }, (item) => item["__View"] == viewkey);
    }

    public ClearDraft


}

class CreateViewModel<T> extends SaveViewModel<T> {
    constructor(Name: string, controller: ModelController = null) {
        super(Name, controller);
        var viewurlformat = "#" + Coalesce(this.LogicalModelName, controller.ModelName) + "\\" + Name + "\\";
        controller.RegisterCommand(AppUICommand.Create("model[slice]", ["header"], Name, viewurlformat, "v-"));
    }
}

class ListViewModel<T> extends ViewModel<T> {
    private _FilterUIElement: Element = null;
    public FilterQuery: QueryView = null;
    public UrlQuery: QueryView = null;
    public CustomQuery: QueryView = null;
    public CurrentQuery: QueryView = null;


    public QueryView: QueryView = null;
    public OriginalQueryView: QueryView = null;
    private _Query: ClientQuery = null;


    private _OriginalQuery: ClientQuery = null;
    public get Query(): ClientQuery {
        return this._Query;
    }
    public set Query(query: ClientQuery) {
        this._Query = query;
        this._OriginalQuery = ClientQuery.New(JsonCopy(query));
    }

    public IsList(): boolean {
        return true;
    }
    get FilterUIElement(): Element {
        return this._FilterUIElement;
    }
    set FilterUIElement(value: Element) {
        var me = this;
        this._FilterUIElement = value;
        var fstartsearch = function () {
            view(me._FilterUIElement)["Search"]();
        }
        if (!IsNull(me._FilterUIElement)) {
            var inputs = _Select("input[name]", me._FilterUIElement);
            me._FilterUIElement.addEventListener("keyup", function (e: KeyboardEvent) {
                if (e.keyCode == 13) {
                    fstartsearch();
                }
            });
        }
    }

    constructor(Name: string, controller: ModelController = null) {
        super(Name, controller);
        var viewcommand = AppUICommand.Create("model[Id]", ["header"], Name, "", "v-");
        viewcommand.Url = (model: any, view: View, command: AppUICommand) => {

            var viewurl = "#" + Coalesce(view.LogicalModelName, view.Controller.ModelName) + "\\" + command.Key + "\\";
            return viewurl;
        }
        controller.RegisterCommand(viewcommand);

        if (application.IsInDebugMode()) {
            var editquery = AppUICommand.CreateFromHtml("EditQuery", (model) => {
                var text = Res("UI.Commands.a-EditQuery");

                return '<span class="icon i-f-PageListFilter" title="' + text + '" onclick="view(this).EditQuery()"><label>' + text + '</label></span>';
            });
            editquery.AppearsIn = ["header"];
            var isincontext = (model: any, view: View) => {
                var typedview = (<ListViewModel<T>>view);
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

    public AfterBind(navigate: boolean = false) {
        super.AfterBind(navigate);
    }

    public Search(parameters: SearchParameters = new SearchParameters()) { }

    public EditQuery() {
        var me = this;
        var queryeditor = _SelectFirst("app-queryeditor", me.UIElement);
        if (IsNull(queryeditor)) {
            var head = _SelectFirst(".header", me.UIElement);
            if (!IsNull(head)) {
                var qe = new App_QueryEditor();
                qe.Execute = function (query: QueryView) {
                    console.log(query);
                    me.QueryView = query;
                    me.Search();
                }
                qe.roottype = me.Controller.ModelName;
                var originalquery: QueryView = me.Query;
                var modelfeatures = me.Controller.GetModelFeatures();
                if (modelfeatures != null) {
                    originalquery.UIColumns = modelfeatures.UIColumns;
                    originalquery.SetFields(modelfeatures.DataColumns);
                } else {
                    //originalquery.UIColumns = modelfeatures.UIColumns;

                }

                var query = FirstNotNull(me.QueryView, originalquery);
                qe.SetQuery(query);
                head.appendChild(qe)
            }
        }

    }

    public ClearQuery() {
        var me = this;
        me.QueryView = null;
        me.Search();
    }
}

class ViewInstance {
    public Id: string;
    public Title: string;
    public Url: string;
    public ViewModel: View;
    public Parameters: Object;
    public LogicalModelName: string
    public UIElement: Element;
}

class ModelController {
    public ModelName: string = "";
    public NS: string = "";
    public Container = function (): Element { return null; };
    public Views: View[] = [];
    private _ViewDictionary: DictionaryOf<View> = null;
    public Instances: DictionaryOf<ViewInstance> = {};

    public AddView(view: View) {
        var me = this;
        var existingview = me.Views.FirstOrDefault(i => i.Name == view.Name);
        if (!IsNull(existingview)) {
            RemoveFrom(existingview, me.Views)
        }
        me.Views.push(view);
        me._ViewDictionary == null;
    }
    public get ViewDictionary(): DictionaryOf<View> {
        var me = this;
        if (me._ViewDictionary == null) {
            me._ViewDictionary = {};
            me.Views.forEach(function (v) {
                me._ViewDictionary[v.Name] = v;
            });
        }
        return me._ViewDictionary;
    }
    public RegisterActions() {
        var me = this;


    }
    public Navigate(p: Object) {

    }

    public ShowView(vm: View) {
        var me = this;
        var viewelements = this.Container().children;
        for (var i = 0; i < viewelements.length; i++) {
            _Hide(viewelements[i]);
        }
        var e_header: Element = _SelectFirst(".header", vm.UIElement);
        if (!IsNull(e_header)) {
            var e_actions = _SelectFirst(".view.actions", e_header);
            if (IsNull(e_actions)) {
                e_actions = _CreateElement("app-commandbar", { class: "view actions" })
                e_header.append(e_actions);
                var loadcommandbarf = () => {
                    if ("GetCommandbarHtml" in vm) {
                        return (<any>vm["GetCommandbarHtml"])();
                    }
                    return ""
                }
                e_actions =

                    e_actions.innerHTML = loadcommandbarf();

            }
            var model = Coalesce(vm["Model"], {});

        }

        _Show(vm.UIElement);
    }
    public PrepareView(vm: View, p: Object = null) {

    }


    public SetViewUIElement(vm: View, viewinstanceid: string = "") {
        var me = this;
        if (IsNull(vm.TemplateHtml)) {
            console.log("TemplateHtml is null");
        }
        if (IsNull(vm.UIElement) && !IsNull(vm.TemplateHtml)) {
            var div = document.createElement('div');
            //div.innerHTML = vm.TemplateHtml.trim();
            var el: any = div.children.length == 1 ? div.children[0] : div;
            el.setAttribute("View", vm.Name);
            el.setAttribute("Controller", vm.Controller.ModelName);
            el.setAttribute("ViewID", viewinstanceid);
            vm.UIElement = el;
            _Hide(vm.UIElement);
            application.LoadContent(vm.UIElement);

            var changed = function (ev: Event): any {
                vm.IsDirty = true;
                vm.Changed();
                var id = vm.Identifier();
                var el = <Element>ev.target;
                if (el.tagName == "INPUT") {
                    el.setAttribute("value", (<HTMLInputElement>el).value);
                }
                if (id in me.Instances) {
                    var vi = me.Instances[id];
                    //vi.UIHtml = vi.ViewModel.UIElement.innerHTML;
                    //Log("Viewinstance html updated for  " + vi.Id + " ");
                }
                //console.log(Format("{0}:{1} IsDirty:{2}", vm.Controller.ModelName, vm.Name, vm.IsDirty));
            }
            //TODO
            if (In(vm.Name, "Save", "Process")) {
                vm.UIElement.addEventListener("DOMSubtreeModified", function () {
                    var bindings = _Select("[bind]", vm.UIElement);
                    bindings.forEach(function (b) {
                        b.removeEventListener("change", <any>changed)
                        b.addEventListener("change", <any>changed);
                    });
                });
            }
            //Log("SetViewUIElement");

        }
    }

    public Load(vm: View, p: Object, modeltypename: string, area: string): View {
        var me = this;
        return me.Open(vm, p, modeltypename, area);

    }


    public Download(name: string, waiter: Waiter) {

    }

    public Open(vm: View, p: Object, modeltypename: string, area: string): View {
        console.log(Format("Open {0}.{1}", vm.Controller.ModelName, vm.Name));
        var me = this;
        var logicalmodelname = IsNull(modeltypename) ? me.ModelName : modeltypename;
        var container = document.querySelector(".viewinstances");

        var newinstanceneeded: boolean = false;
        var loadneeded: boolean = false;
        var vi_id = me.GetViewInstanceId(vm, p, logicalmodelname, area);
        var vi: ViewInstance = null;
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

            vm.AfterBind = function (navigate: boolean = true) {
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


    public GetViewInstanceId(vm: View, p: Object, logicalmodelname: string, area: string): string {
        var me = this;
        var vi_id = "";
        if (vm.Name.toLowerCase() == "list") {
            //vi_id = Format("{0}-{1}-", logicalmodelname, vm.Name);
            vi_id = Format("{0}-{1}", logicalmodelname, vm.FormatIdentifier(p, area));

        } else {
            //vi_id = Format("{0}-{1}-{2}", logicalmodelname, vm.Name, JSON.stringify(p).replace(/"/g, ''));
            vi_id = vm.FormatIdentifier(p, area);
        }
        return vi_id;
    }

    public CreateViewInstance(vm: View, logicalmodelname: string, p: Object, id: string, area: string = ""): ViewInstance {
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
    public AddViewInstance(vi: ViewInstance, onclose: Function) {
        var container = document.querySelector(".viewinstances");
        var div = document.createElement("div");
        div.innerHTML = "<div rel='" + vi.Id + "'><a href='" + vi.Url + "' >" + vi.Title + "</a><span  class='delete icon entypo-cancel'></span></div>";
        var viewhead = <Element>div.childNodes[0];
        var anchor = viewhead.childNodes[0]
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
    public SetUIViewInstance(vi: ViewInstance) {
        var me = this;
        vi.Title = vi.ViewModel.Title();
        var existing = _SelectFirst(".viewinstances [rel=\"" + vi.Id + "\"] > a");
        if (IsNull(existing)) {
            me.AddViewInstance(vi, function () {
                var canclose = true;
                canclose = vi.ViewModel.Close();
                return canclose;
            });
        } else {
            existing.setAttribute("href", window.location.hash);

        }
        var container = document.querySelector(".viewinstances");
        var viewhead = _SelectFirst(".viewinstances [rel=\"" + vi.Id + "\"]");
        SelectElement(container, viewhead);
    }
    private ViewIconDictionary: DictionaryOf<string> =
        {
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
    private _ActionsHtml = "";

    private Features = {};

    public GetModelFeatures(): ModelFeatures {
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
                        var filters = <any[]>result[key];
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
    public Commands: DictionaryOf<AppUICommand> = {};

    public RegisterCommand(command: AppUICommand) {
        var me = this;
        me.Commands[command.Key] = command;
    }
    public UnRegisterCommand(key: string) {
        var me = this;
        delete me.Commands[key];
    }
    public GetControllerSpecificActions(model: object): AppUICommand[] {
        return [];
    }
    public TransformActionHtml(action: string, model: object, html: string, area: string): string {
        return html;
    }



    public DefaultListAction(): string {
        var me = this;
        var features = me.GetModelFeatures();
        return "DefaultListAction" in features ? features["DefaultListAction"] : "Details";
    }
    public DefaultUrl(id: string): string {
        var me = this;
        var url = Format("#{0}\\{1}\\{2}", me.ModelName, me.DefaultListAction(), id);

        return url;
    }


}
class HttpClient {
    public EntryPointBase: string = "";
    private token: string = "";
    public OnResponse: Function = function (url) {
        Tasks.EndTask(url);
    };
    public OnRequest: Function = function (url) {
        Tasks.StartTask(url);
    };


    public OnError: Function = function (xhttp) {
        var me = this;
        var url = (<string>xhttp["RequestUrl"]).replace(this.EntryPointBase, "~");
        var errormessage = xhttp.responseText;
        try {
            var responseobj = JSON.parse(xhttp.response);
            console.log(responseobj);
            if (url.indexOf("?query=MultiData&") > -1) {
                var keys = Object.keys(responseobj);
                var keyedobjlist = keys.Select(i => {
                    responseobj[i]["Multikey"] = i;
                    return responseobj[i]
                })
                var responsewitherror: AppResponse = keyedobjlist.FirstOrDefault((i: AppResponse) => i.Errors.length > 0)
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
                } else {
                    errormessage = firsterror;
                }
            }
        } catch (ex) {

        }
        Toast_Error("Request failed (" + xhttp.status + ")", url + ":\r\n" + errormessage);
        Log("Request failed (" + xhttp.status + ")", url + ":\r\n" + errormessage)
    };

    public GetUrl(url: string): string {
        //var xurl = url.indexOf("~/") == 0 ? this.EntryPointBase + url.substr(2) : url;
        var xurl = url.indexOf("~") == 0 ? this.EntryPointBase + url.substr(1) : url;
        return xurl;
    }
    private setHeaders(request: XMLHttpRequest, headers?: object) {
        if (!IsNull(this.token)) {
            request.setRequestHeader("Authorization", "Bearer " + this.token)
        }
        var webserviceid = GetParameter("WebServiceIdentifier");
        var urlParams = new URLSearchParams(window.location.search);
        var urlwsid = urlParams.get("WebServiceIdentifier");
        var wsid = Coalesce(urlwsid, webserviceid);
        request.setRequestHeader("WebServiceIdentifier", wsid)
        for (var key in headers) {
            request.setRequestHeader(key, headers[key]);

        }
        request.setRequestHeader("Domain", application.Settings.Domain);


    }
    public Get(url: string, header: object, onSuccess: Function, onError?: Function) {
        var me = this;
        var xurl = this.GetUrl(url);
        var xhttp = new XMLHttpRequest();
        onError = IsNull(onError) ? this.OnError : onError;

        xhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                me.OnResponse(xurl);

                if (this.status == 200) {
                    onSuccess(this);
                } else {
                    onError.call(me, this)
                }

            }
        };
        xhttp["RequestUrl"] = xurl;
        xhttp["OriginalRequestUrl"] = url;
        xhttp.open("GET", xurl, true);
        this.setHeaders(xhttp);
        for (var key in header) {
            xhttp.setRequestHeader(key, header[key])

        }
        me.OnRequest(xurl);
        xhttp.send();
        return xhttp;
    }

    public Decompress(data): any {
        var Model = [];
        var mainfielddictinary = data["ViewData"]["FieldDictionary[]"];
        (<any[]>data["Model"]).forEach(function (item) {
            var modelitem = RestoreModel(item, mainfielddictinary);
            for (var key in modelitem) {
                var fielddictionarykey = "FieldDictionary[" + key + "]";
                var listdictionary = data["ViewData"][fielddictionarykey];
                var list = <any[]>modelitem[key]
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

    public GetMultiData(queries: ClientQuery[], onSuccess: Function, onError?: Function, cachemaxage: number = 0) {
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
                } else {
                    onError.call(me, this)
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


    public GetData(query: ClientQuery, onSuccess: Function, onError?: Function, cachemaxage: number = 0) {
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
                } else {
                    console.log(this["Query"]);
                    onError.call(me, this)
                }

            }
        };
        xhttp["RequestUrl"] = xurl;
        xhttp.open("GET", xurl, true);
        this.setHeaders(xhttp);
        xhttp.setRequestHeader("ClientQuery", encodeURIComponent(JSON.stringify(query)))
        xhttp.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        xhttp.setRequestHeader("CanCache", Format("{0}", cachemaxage));

        me.OnRequest(xurl);

        xhttp.send();
        return xhttp;
    }

    public Post(url: string, data: any, onSuccess: Function, onError?: Function, contenttype?: string, marker: string = "") {
        var me = this;
        var xurl = this.GetUrl(url);
        var xhttp = new XMLHttpRequest();
        onError = IsNull(onError) ? this.OnError : onError;

        xhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                me.OnResponse(xurl);

                if (this.status == 200) {
                    onSuccess(this);
                } else {
                    onError.call(me, this)
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


    public PostOld(url: string, data: any, onSuccess: Function, onError?: Function, contenttype?: string, headers?: object) {
        var me = this;
        var xurl = this.GetUrl(url);
        var xhttp = new XMLHttpRequest();
        onError = IsNull(onError) ? this.OnError : onError;

        xhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                me.OnResponse(xurl);

                if (this.status == 200) {
                    onSuccess(this);
                } else {
                    onError.call(me, this)
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

    public Put(url: string, data: any, onSuccess: Function, onError?: Function, contenttype: string = "application/json", marker: string = "") {
        var me = this;
        var xurl = this.GetUrl(url);
        var xhttp = new XMLHttpRequest();
        onError = IsNull(onError) ? this.OnError : onError;

        xhttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                me.OnResponse(xurl);

                if (this.status == 200) {
                    onSuccess(this);
                } else {
                    onError.call(me, this)
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

   
    public Authenticate(success: Function, failure: Function, credentials = {}) {
        var me = this;
        var onerror = function (err) {
            me.OnError(err);
            if (failure != null) { failure(); }
        }
        var webserviceid = Coalesce(credentials["WebServiceIdentifier"], GetParameter("WebServiceIdentifier") );
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
            this.Post("~/webui/api/xauthenticate", JSON.stringify(form), function (xhttp: XMLHttpRequest) {
                var ok = true;
                var resp: AppResponse = null;

                try {
                    resp = JSON.parse(xhttp.responseText);

                } catch (ex) {
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
        } else {
            success();

        }
    }
}

function modelobj(element: Element): object {
    var result: object = null;
    var itemelement = _Parents(element).FirstOrDefault(i => i.classList.contains("item"));
    var v = view(element);
    if (v.IsList() && itemelement != null) {
        var items = (<ViewModel<object[]>>v).Model;
        var uiitems = GetBoundObject(itemelement);
        var itemid = uiitems["Id"];
        if (!IsNull(itemid)) {
            var item = items.FirstOrDefault(i => i["Id"] == itemid);
            result = item;
        }

    }
    return result;
}

function view(element: Element): View {
    var isview = (item: Element) => item == null ? null : item.hasAttribute("View");
    if (isview(element)) {
        var controllername = element.getAttribute("Controller");
        var viewname = element.getAttribute("View");
        var viewid = element.getAttribute("ViewID");
        return application.GetView(controllername, viewname, viewid);
    } else {
        if (IsNull(element.parentElement)) {
            return null;
        } else {
            return view(element.parentElement);
        }
    }
}

function controller(element: Element): ModelController {
    var isview = (item: Element) => item == null ? null : item.hasAttribute("View");
    if (isview(element)) {
        var controllername = element.getAttribute("Controller");
        var viewname = element.getAttribute("View");
        var viewid = element.getAttribute("ViewID");
        var view = application.GetView(controllername, viewname, viewid)
        return view.Controller;
    } else {
        if (IsNull(element.parentElement)) {
            return null;
        } else {
            return controller(element.parentElement);
        }
    }
}