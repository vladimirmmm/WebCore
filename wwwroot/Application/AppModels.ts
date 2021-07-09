module WebCore {
    interface AppScript {
        script: string;
        children?: AppScript[];
    }
    export interface ViewLayout {
        Dictionary: object;
        Templates: object,
        load: Function
    }
    export interface AppSettings {
        App: string;
        Domain: string;
        Modules: string[];
        DomainNamespace: string;
        DefaultNewVoucherTypePrefix: string;
        Currency: string;
        Company: object;
        ClientValidation: boolean;
        DefaultCulture: string;
        Connections: string[];
        Culture: string;
        Cultures: string[];
        MainHash: string;
        DateTimeFormat: string;
        DateFormat: string;
        MonetaryFormat: string;
        QuantityFormat: string;
        DecimalFormat: string;
        DataEntryPoint: string;
        ScanField: string;
        PageSize: number,
        CustomFiles: string[],
        Imports: string[],
        Scripts: AppScript[],
        Views: string[],
        Employee: object;
        AllowedFeatures: object;
        RouteSymbols: DictionaryOf<string>;
        Navigation: DictionaryOf<string>;
        AppQueryDictionaries: DictionaryOf<any>;
        Sound: string;
        NoRest: boolean;
        IsRebut: boolean;
        OfflineDefault: number;
        ValidateCuiWithoutCountryTag: boolean;
        DoNotFillVoucherItemName: boolean;
        IsPermissionManagementEnabled: boolean;
    }
    export class AppDependencies {
        public static async RunTest(test: string) { return null; };
        public static Container(): Element { return null; };
        public static GetParameter: any = (key) => { };
        public static SetParameter: any = (key,value) => { };
        public static httpClient: HttpClient;
        public static Layouts: ViewLayout = <any>{};
        public static Settings: AppSettings;
        public static LoadContent(element: Element) { };
        public static NotificationManager: NotificationManager = null;
        public static ClientValidation: boolean = true;
        public static DataLayer: AppDataLayer = null;
        public static IsInDebugMode(): boolean { return false;}
        public static IsAdmin(): boolean { return false; }
        public static GetView(...args: any[]): View {
            return null;
        }
        public static GetController(...args: any[]): ModelController {
            return null;
        }
        public static LayoutFor(...args: any[]): Layout {
            return null;
        }
        public static HandleAuthenticationResult(...args: any[]): any {
            return null;
        }
        public static Commands: AppUICommand[];
        public static SaveSettings() { };
        public static GetR: AppDataLayer = null;
        public static GetData(query: ClientQuery, onsuccess: Action<AppResponse>, onerror: Action<AppResponse>) { }
        public static GetRouteProperties: any = () => {};
        public static async GetDataAsync(query: ClientQuery) { throw "Not Implemented" }
        public static GetMultiData(queries: ClientQuery[], onsuccess: Action<AppResponse>, onerror: Action<AppResponse>) { }
        public static async GetMutiDataAsync(queries: ClientQuery[]) { throw "Not Implemented" }
        public static ExecuteCommands(commands: any[], onsuccess: Action<AppResponse>, onerror: Action<AppResponse>) { }
        public static async ExecuteCommandsAsyc(commands: any[]) { throw "Not Implemented" }

    }
    export interface AppResponse {
        Model: any[];
        Errors: any[];
        ViewData: object;
    }
    export class AppUICommand {
        public Key: string = "";
        public CssClass: string = "";
        public Url = (model: any, view?: View, command?: AppUICommand) => "";
        public IsInContext = (model: any, view?: View) => true;
        public OnClick = (model: any, view?: View, command?: AppUICommand) => "";
        public Prefix: string = "";
        public Action: string = "";
        public AppearsIn: string[] = [];
        public Label: string = "";
        public Source: any;
        public Html: string = "";
        public Render(model: any, control?: any): string {
            var me = this;
            var html = "";
            var uielement: Element = null
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
                    uielement.setAttribute("title", text)
                    uielement.appendChild(label);
                    me.Html = uielement.outerHTML;
                    html = me.Html;
                }
            }
            return html;
        }
        public static GetFunctions(condition: string) {
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
                        result.push((model: any, view: any) => {
                            var val = isview ? Access(view, key) : Access(model, key);
                            return !IsNull(val);
                        });
                    }
                    else {
                        result.push((model: any, view: any) => {
                            var val = isview ? Access(view, key) : Access(model, key);
                            return val == value;
                        });
                    }
                }

            }
            return result;
        }

        public static CreateFrom(obj: object): AppUICommand {
            var command = new AppUICommand();
            for (var key in obj) {
                command[key] = obj[key];
            }
            return command;
        }

        public static Create(condition: string, appearsin: string[], key: string, action: string, classprefix: string = "a-"): AppUICommand {
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
            var allfunction = (model: any, view: any) => {
                var result = true;
                for (var i = 0; i < functions.length; i++) {
                    if (!functions[i](model, view)) { return false; }
                }
                return result;
            };
            command.IsInContext = allfunction;

            command.CssClass = "icon " + classprefix + key;
            if (action.startsWith("#") || action.startsWith("http://")) {
                command.Url = (model: any, view?: View, c?: AppUICommand) => Format(c.Action, Access(model, "Id"));
            } else {
                command.OnClick = (model: any, view?: View, c?: AppUICommand) => Format(c.Action, Access(model, "Id"));
            }
            command.Key = key;
            //command.Label = Res("UI.Commands." + key);
            return command;
        }

        public static CreateFromHtml(key: string, Render: Function, isincontext?: Function) {
            var command = new AppUICommand();
            command.Key = key;
            command.Render = <any>Render;
            if (!IsNull(isincontext)) {
                command.IsInContext = <any>isincontext;
            }
            return command;
        }
    }
    export class ImportScript {
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

    export class AppEvents {
        public static readonly Create: string = "Create";
        public static readonly Update: string = "Update";
        public static readonly Delete: string = "Delete";
        public static readonly Info: string = "Info";
    }
    export class AppEvent {
        public Name: string;
        public TypeName?: string;
        public Data?: any;
        public Source?: any;

        public static Create(name: string, typename?: string, data?: any): AppEvent {
            var result = new AppEvent();
            result.Name = name;
            result.TypeName = typename;
            result.Data = data;
            return result;
        }
    }
    export interface Observer {
        Notify(event: AppEvent, source?: Observer): Promise<any>;
    }
    export class NotificationManager implements Observer {
        private ObserversOfEvent: DictionaryOf<Observer[]> = {};
        async Notify(event: AppEvent, source?: Observer) {
            var me = this;
            console.log(Format("AppEvent: {0}:{1}", event.Name, event.TypeName));
            var ekey = event.Name + "|" + event.TypeName;
            var observers: Observer[] = Coalesce(me.ObserversOfEvent[ekey], []);
            observers.forEach(o => {
                if (o != source) {
                    o.Notify(event, me);
                }
            });

        }
        public Subscribe(observer: Observer, events: string[] = [], typenames: string[] = [""]) {
            var me = this;
            events.forEach(e => {
                typenames.forEach(tn => {
                    var ekey = e + "|" + tn;
                    if (!(ekey in me.ObserversOfEvent)) {
                        me.ObserversOfEvent[ekey] = [];
                    }
                    var observers = me.ObserversOfEvent[ekey];
                    if (observers.indexOf(observer) == -1) {
                        observers.push(observer);
                    }
                });

            });
        }

        public Unsubscribe(observer: Observer) {
            var me = this;
            var ekeys = Object.keys(me.ObserversOfEvent);
            ekeys.forEach(ekey => {
                var observers = me.ObserversOfEvent[ekey];
                RemoveFrom(observer, observers);
            });
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

    export class AppDataLayer {
        public static Queries: any = {};
        public static Instance = new AppDataLayer();
        public static Data: any = {};
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
            AppDependencies.httpClient.GetData(query,
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
                        query.Take = AppDependencies.Settings.PageSize;
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
            query.Take = AppDependencies.Settings.PageSize;
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
                query.Take = AppDependencies.Settings.PageSize;

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
            AppDependencies.httpClient.GetData(query, onsuccess, onerror);
        }

        public static GetMultiData(queries: ClientQuery[], onsuccess: Function, onerror: Function) {
            AppDependencies.httpClient.GetMultiData(queries, onsuccess, onerror);
        }
    }

    class ModelEvent {
        public static BeforeSave: string = "BeforeSave";
        public static SaveSuccess: string = "SaveSuccess";
        public static SaveFailed: string = "SaveFailed";
        public static Changed: string = "Changed";
        public static BeforeBind: string = "BeforeBind";
        public static SaveOfflineSuccess: string = "SaveOfflineSuccess";
    }

    export interface NavigationItem {
        Key: string;
        Name: string;
        Content?: string;
        ContentURL?: string;
        ParentKey?: string;
        Parameters?: Object;
        Children?: NavigationItem[];
        Url?: string
    }

    export interface IParameterDictionary extends IDictionary<string> {
        page?: any;
        type?: any;
        id?: any;
        orderby?: any;
    }
    export class SearchParameters implements Object {
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

    export class View {
        public Name: string;
        public LayoutPath: string = "";
        public LayoutPaths: string[] = [];
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
                AppDependencies.NotificationManager.Unsubscribe(<any>me);
                me.UIElement.remove();
                var controller = AppDependencies.GetController(me.Controller.ModelName);
                var instances: ViewInstance[] = Object.keys(controller.Instances).Select(i => controller.Instances[i]);
                var vi = instances.FirstOrDefault(i => i.ViewModel == me);

                var viewhead = vi.UIElement;

                if (!IsNull(viewhead)) {
                    var prev = viewhead.previousElementSibling;
                    var next = viewhead.previousElementSibling;
                    var toshow: Element = Coalesce(prev, next);
                    vi.UIElement.remove();
                }

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

        public NotifyApplication(event: AppEvent) {
            var me = this;
            AppDependencies.NotificationManager.Notify(event, <any>me);
        }
        public AddTemplate(extension: string, template: IViewTemplate) {
            this.Templates[extension] = template;
        }
        public GetTemplate(extension: string): IViewTemplate {
            return this.Templates[extension];
        }

        public Bind(itemorselector: any, model: any, context?: any, poptions: BindOptions = {}) {
            if (AppDependencies.IsInDebugMode()) {
                console.log("Binding", { itemorselector, model });
            }

            var me = this;
            var options = new BindOptions();
            for (var key in poptions) {
                options[key] = poptions[key];
            }
            if (options.triggerbeforebind) {
                me.BeforeBind();
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
            if (options.triggerafterbind) {
                //console.log("triggering AfterBind");
                me.AfterBind();
            }
        }

        public static GetView<T>(me: T, element?: any): T {
            var uselement = IsNull(me) || !(me instanceof View);
            return <T>(uselement ? view(element) : me);
        }

        public parameterstr: string = "";
        public GetParameterDictionary(p: any = ""): IParameterDictionary {
            p = IsNull(p) ? "" : p;
            if (p.length == 0) {
                p = this.parameterstr;
            }
            var result: IParameterDictionary = { id: null, page: null, type: null };
            var parts = (<string[]>p.split('-')).Select(i => decodeURI(i));
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
                if (this.IsList()) {
                    result.page = unnamedparts[0];
                } else if (In(this.Name, "Create", "Transfer")) {
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
        public _IsDirty: boolean = false;
        public get IsDirty(): boolean {
            return this._IsDirty;
        }
        public IsChanging: boolean = false;

        public set IsDirty(val: boolean) {
            this._IsDirty = val;
            var vi = this.GetViewInstance();
            if (vi != null && val == true && this._IsDirty != val) {
                //var controller = application.GetController(this.Controller.ModelName);
                //delete controller.Instances[vi.Id];
                //var newviewid = vi.Id + Guid();
                //controller.Instances[newviewid] = vi;
                //vi.Id = newviewid;
                //vi.ViewModel.UIElement.setAttribute("ViewID", newviewid);
            }

        }

        public IsMultiInstance: boolean = false;
        public LogicalModelName: string = "";

        public GetViewInstance(): ViewInstance {
            var me = this;
            var controller = AppDependencies.GetController(me.Controller.ModelName);
            var instances: ViewInstance[] = Object.keys(controller.Instances).Select(i => controller.Instances[i]);
            var vi = instances.FirstOrDefault(i => i.ViewModel == me);
            return vi;
        }

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
            return "";
            //throw "Identifier Not Implemented on " + this.Name;
        }

        constructor(Name: string, controller: ModelController = null,) {
            this.Name = Name;
            this.Controller = controller;
        }

        public Copy(): View {
            var copy = new View(this.Name);
            copy.OriginalTemplateHtml = this.OriginalTemplateHtml;
            copy.LogicalModelName = this.LogicalModelName;
            copy.Templates = this.Templates;
            copy.TemplateHtml = this.TemplateHtml;
            copy.LayoutPaths = Array.from(this.LayoutPaths);
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
        public Ready() {

        }
        public AfterBind(navigate: boolean = true) {
            var me = this;
        }

        public Changed(ev: Event) {
            console.log("Changed");
        }



        public BeforePrint(printarea: Element) {

        }

        public AfterPrint(printarea: Element, event: Event) {

        }

        public PageSize(): number {
            var me = this;
            var pagesizekey: string = Format("UI.{0}.{1}.PageSize", me.Controller.ModelName, me.Name);
            return FirstNotNull(Access(AppDependencies.Settings, pagesizekey), AppDependencies.Settings.PageSize);
        }
        public SavePageSize(pagesize: number) {
            var me = this;
            var pagesizekey: string = Format("UI.{0}.{1}.PageSize", me.Controller.ModelName, me.Name);
            var parts = pagesizekey.split('.');
            var obj = AppDependencies.Settings;
            for (var i = 0; i < parts.length - 1; i++) {
                var part = parts[i];
                if (!(part in obj)) {
                    obj[part] = {};
                }
                obj = obj[part];
            }
            var lastpart = parts[parts.length - 1];
            obj[lastpart] = pagesize;
            AppDependencies.SaveSettings();
        }

        //public CreateAction(FunctionStr: string, CssClass: string, Key: string): AppActionOld
        //{
        //    var path = this.Controller.ModelName + "\\" + this.Name + "\\";
        //    var appaction = AppActionOld.Create(FunctionStr, CssClass, Key);
        //    appaction.Paths.push(path);
        //    return appaction;
        //}
    }
    export class Layout {
        public Name: string
        public Fields: any;

        public Inherit: string;
        public AppliesTo: string[] = [];
        public DependentValues: string[] = [];
        public DependsOnProperty: string;

        public static GetGroup(item: any) {
            var key = Object.keys(item)[0];
            var fields: any[] = item[key];
            return { Key: key, Fields: fields.Select(i => Layout.GetLayoutField(i)) };
        }
        public static Find(fields: any, fieldname, parent: any = null) {

        }
        public static GetFields(fields: any[], parentkey: string = null, recursive: boolean = false) {
            var result = [];
            fields.forEach(field => {
                if (IsObject(field)) {
                    if (recursive) {
                        var key = Object.keys(field)[0];
                        var subfields = field[key];
                        result.push.apply(result, Layout.GetFields(subfields, parentkey + ">" + key, recursive));
                    }
                } else {
                    result.push(parentkey + "[" + field + "]");
                }
            });
            return result;
        }
        public static GetLayoutField(field: string): LayoutField {
            var result = new LayoutField();
            var fstr = field;
            var groupix = fstr.indexOf("[");
            if (groupix > -1) {
                result.Path = fstr.substring(0, groupix);
                fstr = TextBetween(fstr, "[", "]");

            }
            var scopeix = fstr.indexOf(":");
            if (scopeix > -1) {
                result.Scope = fstr.substring(scopeix + 1);
                fstr = fstr.substring(0, scopeix);
            }
            if (fstr.startsWith("!")) {
                fstr = fstr.substring(1);
                result.Remove = true;
            }
            result.Key = fstr;
            return result;
        }

        public static FindContainer(source: any, key: string): any {
            var parts = key.split(">");
            var current = source;
            for (var i = 0; i < parts.length; i++) {
                var part = Coalesce(parts[i], "");
                if (IsArray(current)) {
                    var container = (<any[]>current).FirstOrDefault(i => IsObject(i) && (part in i));
                    if (IsNull(container)) {
                        container = {};
                        container[part] = [];
                        current.push(container);
                    }
                    current = container[part];
                } else {
                    if (IsObject(current)) {
                        current = current[part];
                    }
                }
            }
            return current;
        }

        public static Merge(from: Layout, to: Layout) {
            if (!IsNull(from)) {
                var fieldstoremove: LayoutField[] = [];
                var fieldstoadd: LayoutField[] = [];
                for (var key in from.Fields) {

                    var items: any[] = from.Fields[key]
                    var fields = Layout.GetFields(items, key, true);
                    fields.forEach(field => {
                        var dd = Layout.GetLayoutField(field);
                        if (dd.Remove) {
                            fieldstoremove.push(dd);
                        } else {
                            fieldstoadd.push(dd);
                        }

                    });

                }

                fieldstoremove.forEach(f => {
                    var parent = Layout.FindContainer(to.Fields, f.Path);
                    if (IsArray(parent)) {
                        RemoveFrom(f.Key, parent);
                    }
                })
                fieldstoadd.forEach(f => {
                    var parent: any[] = Layout.FindContainer(to.Fields, f.Path);
                    var fstr = f.Key + ":" + Format("{0}", f.Scope);
                    if (f.Key == "-") {
                        //parent = [];
                        parent.splice(0, parent.length);
                        return;
                    }
                    var existing = parent.FirstOrDefault(i => i == f.Key || (!IsObject(i) && i.startsWith(f.Key + ":")));
                    if (existing != null) {
                        var eix = parent.indexOf(existing);
                        parent[eix] = fstr
                    } else {
                        parent.push(fstr);
                    }
                })
            }
        }

    }
    export class ControllerLayout {
        public General: Layout;
        public Dependent: DictionaryOf<Layout>;

    }
    export class LayoutField {
        public Remove?: boolean = false;
        public Key: string;
        public Path: string;
        public Scope: string;
    }
    class ModelRetriever<T> {
        public Queries: ClientQuery[] = [];
        public GetQueries(id: any): ClientQuery[] {
            var me = this;
            return me.Queries;
        }

        public BuildModel(results: DictionaryOf<AppResponse>): T {
            return <T>{};
        }
        public async Retrieve(id: any): Promise<T> {
            var me = this;
            let promise = new Promise<T>((resolve, reject) => {

                AppDataLayer.GetData((<any>me).GetQueries(id), (r: DictionaryOf<AppResponse>) => {
                    resolve(me.BuildModel(r));
                }, (r: AppResponse) => {
                    reject(r.Errors.FirstOrDefault());
                });
            });
            return promise;

        }
    }
    export class ViewModel<T> extends View {
        public Model: T = null;

        public GetLayout(): Layout {
            var me = this;
            return AppDependencies.LayoutFor(me.LogicalModelName, me.Model, me.Name);
        }

        constructor(Name: string, controller: ModelController = null) {
            super(Name, controller);
            var me = this;

            //this.RegisterCommand(AppUICommand.Create("",["header"], "Close", "view(this).Close();"));
            //this.RegisterCommand(AppUICommand.Create("model[TypeName]",["header"], "Reload", "view(this).Action();"));
            me.RegisterMe();
        }
        public RegisterMe() {
            var me = this;
            var modelname = Coalesce(this.LogicalModelName, me.Controller.ModelName);
            var viewurlformat = "#" + modelname + "\\" + me.Name + "\\{0}";
            me.Controller.RegisterCommand(AppUICommand.Create("model[Id]", ["header", "item"], me.Name, viewurlformat, "v-"));

        }

        public RegisterCommand(command: AppUICommand) {
            var me = this;
            me.Commands[command.Prefix + command.Key] = command;
        }

        public Copy(): ViewModel<T> {
            var creator: Function = eval("(function (obj,c) { return new obj.constructor(c);})");
            var copy: ViewModel<T> = creator(this, this.Controller);
            copy.LayoutPath = this.LayoutPath;
            copy.LayoutPaths = Array.from(this.LayoutPaths);
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
            var mc = AppDependencies.GetController(me.Controller.ModelName);

            var viewcommands: AppUICommand[] = Object.keys(me.Commands).Select(i => me.Commands[i]);
            var controllercommands: AppUICommand[] = Object.keys(mc.Commands).Select(i => mc.Commands[i]);
            var applicationcommands: AppUICommand[] = Object.keys(AppDependencies.Commands).Select(i => AppDependencies.Commands[i]);
            controllercommands = controllercommands.Where(i => i.Key != me.Name);
            var clearcommand = viewcommands.FirstOrDefault(i => i.Key == "Clear");
            if (clearcommand != null) {
                RemoveFrom(clearcommand, viewcommands);
                controllercommands = [];
            }
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
            if (allowedactions.length > 0 && !AppDependencies.IsInDebugMode()) {
                var customisationcommands = commands.Where(i => i.Source != "Core");
                customisationcommands.forEach(c => {
                    if (allowedactions.indexOf(c.Key) == -1) {
                        allowedactions.push(c.Key);
                    }
                })

                commands = allowedactions.Select(i => commands.FirstOrDefault(c => c.Key == i)).Where(i => !IsNull(i));
            }

            var allowedviews = me.Controller.GetModelFeatures().Views;
            if (allowedviews.length > 0 && !AppDependencies.IsInDebugMode()) {
                var commandsnotallowed = commands.Where(i => i.Prefix == "v-" && allowedviews.indexOf(i.Key) == -1);
                commandsnotallowed.forEach(c => RemoveFrom(c, commands));
            }
            var contextmodel = Coalesce(model, me.Model);
            var closecommand = AppUICommand.Create("", ["header"], "Close", "view(this).Close()", "a-")
            //closecommand.AppearsIn = ["header"];
            //closecommand.CssClass = "icon a-Close";
            //closecommand.Action = "view(this).Close()";
            //closecommand.Key = "Close";
            if (IsNull(model)) {
                commands.push(closecommand);

            }
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
        public DefaultValidationUserResponse: boolean = null;
        public async ShowValidationResults(results: ValidationRuleResult[], item: T): Promise<boolean> {
            var me = this;
            //
            //warning
            if (results.length > 0) {
                LogToast("warn", "Validation Failed", results.Select(i => i.Message).join("\n"));
            }
            var control = <App_Validation>_SelectFirst("app-validation", me.UIElement);
            if (control == null) {
                control = new App_Validation();
                control.classList.add("modal");
                var appheader = _SelectFirst("app-header", me.UIElement);
                control.TypeName = IsArray(item) ? item[0]["TypeName"] : item["TypeName"];
                _Hide(control);
                if (!IsNull(appheader)) {
                    appheader.appendChild(control);
                }
            }

            var promise = new Promise<boolean>((resolve, reject) => {
                if (results.length == 0) {
                    resolve(true);
                } else {
                    if (!IsNull(me.DefaultValidationUserResponse)) {
                        resolve(me.DefaultValidationUserResponse);
                        control.Load(results, () => { });
                    } else {
                        control.Load(results, (val) => {
                            resolve(val);
                        });
                    }
                }
            });

            return promise;
        }

        public HideValidationResults() {
            var me = this;

            var control = <App_Validation>_SelectFirst("app-validation", me.UIElement);
            if (control != null) {
                _Hide(control);
            }

        }

    }

    class DataList<T>
    {
        Items: T[] = [];
        Columns: string[] = [];
    }
    export class SaveViewModel<T> extends ViewModel<T> {
        constructor(Name: string, controller: ModelController = null) {
            super(Name, controller);
            var viewurlformat = "#" + Coalesce(this.LogicalModelName, controller.ModelName) + "\\" + Name + "\\{0}";
            //controller.RegisterCommand(AppUICommand.Create("model[Id]", ["item", "header"], Name, viewurlformat, "v-"));
            this.RegisterCommand(AppUICommand.Create("view[SavePost]", ["header"], "Save", "view(this).SavePost(this)", "a-"));
            if (AppDependencies.IsInDebugMode()) {
                this.RegisterCommand(AppUICommand.Create("", ["header"], "Test", "view(this).ShowTestScenario()", "a-"));
            }
        }

        public ControlFor(model: any, key: string, scope: string = ""): string {
            var html = "";
            return html;
        }

        public SaveDraft() {
            var me = this;
            var app = window["application"];
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
            var app = window["application"];
            var xondataload = IsFunction(ondataload) ? ondataload : () => { me.Bind(me.UIElement, me.Model) }
            var viewkey = me.Controller.ModelName + "." + me.Name;
            app.GetFromClient<T>("Data", (result: T[]) => {
                var item = result.OrderByDescending(i => i["__SaveDate"]).FirstOrDefault();
                me.Model = item;
                xondataload();

            }, (item) => item["__View"] == viewkey);
        }

        public ClearDraft() {

        }
        public Test(scenario: string, context: object = {}) {
            var me = this;

        }
        public Hide(selector: string) {
            var me = this;
            var modal = me.SelectFirst(selector);
            if (modal != null) {
                _Hide(modal);
            }
        }
        public ShowTestScenario() {
            var me = this;
            var testkey = me.LogicalModelName + "." + me.Name + ".TestScenario";

            var e_test = me.SelectFirst(".modal.test");
            if (e_test == null) {
                var html = [];
                var mdiv = <HTMLElement>_Create("div", { class: "test modal" });
                html.push('<div>')
                html.push('<div class="field">')
                html.push('<span class="name">Scenario</span>');
                html.push('<textarea class="value scenario" rows="20" cols="100"></textarea>');
                html.push('</div>')
                html.push('<div>')
                html.push('<input type="button" value="Start" onclick="view(this).Test()"/>')
                html.push('<input type="button" value="Cancel" onclick="view(this).Hide(\'.modal.test\')"/>')
                html.push('</div>')
                html.push('</div>')
                mdiv.innerHTML = html.join("\n");
                e_test = mdiv;
                me.UIElement.appendChild(mdiv);
            }
            var e_scenario = <HTMLTextAreaElement>me.SelectFirst(".modal.test textarea");
            if (!IsNull(e_scenario) && IsNull(e_scenario.value)) {
                e_scenario.value = AppDependencies.GetParameter(testkey);
            }
            _Show(e_test);
        }
        public UpdateTemplate: object = {

        }

        public BeforeSave(model: any, updatemodel: any = {}, clearmodel: any = {}): boolean {
            var me = this;
            var controller = me.Controller;
            return true;

        }
        public async OnModelEvent(eventname: string, model: any, context: any = {}) {
            var me = this;
            if (IsNull(context.View)) {
                context.View = me;
            }
            var OnModelEventHandler: Function = me.Controller.ModelEventHandler[eventname];
            if (IsFunction(OnModelEventHandler)) {
                await OnModelEventHandler(model, context);
            }
        }
        public async SavePost(element?: Element) {
            return null;
        }


    }

    export class CreateViewModel<T> extends SaveViewModel<T> {
        constructor(Name: string, controller: ModelController = null) {
            super(Name, controller);
            var viewurlformat = "#" + Coalesce(this.LogicalModelName, controller.ModelName) + "\\" + Name + "\\";
            controller.RegisterCommand(AppUICommand.Create("model[slice]", ["header"], Name, viewurlformat, "v-"));
        }
    }

    export class ListViewModel<T> extends ViewModel<T> {
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
            var filterkey = me.LogicalModelName + "." + me.Name + ".Filter";

            if (!IsNull(me._FilterUIElement)) {
                var filtervals = [];
                try {
                    filtervals = JSON.parse(AppDependencies.GetParameter(filterkey));
                }
                catch (ex) {

                }
                filtervals = Coalesce(filtervals, []);
                filtervals.forEach(fv => {
                    let selector = Format('.filter [bind="{0}"]', fv.bind);
                    let el = me.SelectFirst(selector);
                    if (!IsNull(el)) {
                        let inp = <HTMLInputElement>el;
                        inp.value = fv.value;
                        if (el.tagName == "APP-AUTOCOMPLETE" || el.tagName == "APP-OBJECTPICKER") {
                            let ac = <App_AutoComplete>el;
                            ac.SetValue(fv.value, fv.text);
                        }
                    }
                });
                var inputs = _Select("input[name]", me._FilterUIElement);
                me._FilterUIElement.addEventListener("keyup", function (e: KeyboardEvent) {
                    if (e.keyCode == 13) {
                        fstartsearch();
                    }
                });
                me._FilterUIElement.addEventListener("change", function (e: KeyboardEvent) {
                    var items = [];
                    var boundelements = GetBoundElements(me.FilterUIElement);
                    boundelements.forEach(be => {
                        var el = be.element;
                        let input = <HTMLInputElement>el;
                        let text = "";
                        let value = "";
                        value = input.value;
                        if (value != null) {
                            if (input.tagName == "APP-AUTOCOMPLETE") {
                                var ac = <App_AutoComplete>el;
                                text = ac.displayText;
                            } else if (input.tagName == "APP-OBJECTPICKER") {
                                var op = <App_ObjectPicker>el;
                                var values = value.split(",").Select(s => TextBetween(s, "[", "]"));
                                let t = "";
                                for (let v of values) {
                                    t += "[" + op.GetTagTextByTagValue(v) + "],"
                                }
                                text = t.substr(0, t.length - 1);
                            }
                            items.push({ bind: el.getAttribute("bind"), text: text, value: value });
                        }
                    });
                    AppDependencies.SetParameter(filterkey, JSON.stringify(items));
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

            if (AppDependencies.IsInDebugMode()) {
                var editquery = AppUICommand.CreateFromHtml("EditQuery", (model) => {
                    var text = Res("UI.Commands.a-EditQuery");

                    return '<span class="icon a-QueryBuilder" title="' + text + '" onclick="view(this).EditQuery()"><label>' + text + '</label></span>';
                });
                editquery.AppearsIn = ["header"];
                var isincontext = (model: any, view: View) => {
                    var typedview = (<ListViewModel<T>>view);
                    return view.Name == "List" && typedview.Query != null;
                };
                editquery.IsInContext = isincontext;
                var clearquery = AppUICommand.CreateFromHtml("ClearQuery", (model) => {
                    var text = Res("UI.Commands.a-ClearQuery");
                    return '<span class="icon a-RemoveQueryBuilder" title="' + text + '" onclick="view(this).ClearQuery()"><label>' + text + '</label></span>';
                });
                clearquery.AppearsIn = ["header"];
                clearquery.IsInContext = isincontext;

                controller.RegisterCommand(editquery);
                controller.RegisterCommand(clearquery);

            }
        }

        public AfterBind(navigate: boolean = false) {
            super.AfterBind(navigate);
            var me = this;
            if (IsNull(me.FilterUIElement)) {
                me.FilterUIElement = me.SelectFirst(".filter");
            }
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

    export class ViewInstance {
        public Id: string;
        public Title: string;
        public Url: string;
        public ViewModel: View;
        public Parameters: Object;
        public LogicalModelName: string
        public UIElement: Element;
    }
    export class ViewLayout {
        public FullPath: string;
        public Name: string;
        public Extension: string;
        public Area: string;
        public Discriminator: string;
        public IsCustomisation: boolean = false;
    }
    export class ModelController {
        public ModelName: string = "";
        public NS: string = "";
        public Container = function (): Element { return null; };
        public Views: View[] = [];
        private _ViewDictionary: DictionaryOf<View> = null;
        public Instances: DictionaryOf<ViewInstance> = {};
        public ModelEventHandler: DictionaryOf<Function> = {};
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
        public EnsureCommandBar(vm: View) {
            var me = this;
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

            }
        }
        public ShowView(vm: View) {
            var me = this;
            var viewelements = this.Container().children;
            for (var i = 0; i < viewelements.length; i++) {
                _Hide(viewelements[i]);
            }
            //me.EnsureCommandBar();

            _Show(vm.UIElement);
        }

        public PrepareView(vm: View, p: any = null) {
            var parameters = vm.GetParameterDictionary(p);
            var routing = AppDependencies.GetRouteProperties();
            var viewlayouts: ViewLayout[] = vm.LayoutPaths.Select(l => {
                var lowerl = l.toLowerCase();
                var vl = new ViewLayout();
                var parts = lowerl.split("\\");
                if (parts[0] == "customisations") {
                    vl.IsCustomisation = true;
                }
                var layoutindex = parts.indexOf("layout");
                vl.Name = parts[parts.length - 1];
                if (parts[layoutindex + 1] != vl.Name) {
                    vl.Area = parts[layoutindex + 1];
                }
                vl.FullPath = l;
                var nameparts = vl.Name.split(".");
                if (nameparts.length == 5) {
                    vl.Discriminator = nameparts[0];
                }
                vl.Extension = nameparts[nameparts.length - 2];
                return vl;
            });
            var area = Coalesce(routing.area, "").toLowerCase();
            var type = Coalesce(parameters.type, "").toLowerCase();

            var arealayouts = viewlayouts.Where(i => i.Area == area);
            var applicablelayouts: ViewLayout[] = arealayouts.length > 0 ? arealayouts : Array.from(viewlayouts);

            var typelayouts = applicablelayouts.Where(i => i.Discriminator == type);
            applicablelayouts = typelayouts.length > 0 ? typelayouts : applicablelayouts;

            var customlayouts = applicablelayouts.Where(i => i.IsCustomisation);
            var usebaseviews = AppDependencies.GetParameter("UseBaseViews") == "1";
            if (applicablelayouts.length > 0 && usebaseviews) {
                applicablelayouts = applicablelayouts.Where(i => !i.IsCustomisation);

            } else {
                applicablelayouts = customlayouts.length > 0 ? customlayouts : applicablelayouts;
            }
            applicablelayouts.forEach(al => {

                var template = AppDependencies.Layouts.Templates[al.FullPath];
                if (!IsNull(template) && al.Extension == "razor") {
                    var rtemplate = vm.Templates[al.Extension];
                    if (rtemplate.LayoutPath != al.FullPath) {
                        console.log("Preparing template " + al.FullPath);
                        var t = new RazorTemplate();
                        t.LayoutPath = al.FullPath;
                        t.Compile(template);
                        vm.AddTemplate(al.Extension, t);
                    }
                }
            });

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
                AppDependencies.LoadContent(vm.UIElement);

                var changed = function (ev: Event): any {
                    vm.IsDirty = true;
                    vm.Changed(ev);
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

        public Load(vm: View, p: Object, modeltypename: string, area: string, readycallback: Function): View {
            var me = this;
            return me.Open(vm, p, modeltypename, area, readycallback);

        }

        public Download(name: string, waiter: Waiter) {

        }

        public Open(vm: View, p: Object, modeltypename: string, area: string, readycallback: Function): View {
            console.log(Format("Open {0}.{1}", vm.Controller.ModelName, vm.Name));
            var me = this;
            var logicalmodelname = IsNull(modeltypename) ? me.ModelName : modeltypename;
            var container = document.querySelector(".viewinstances");

            var newinstanceneeded: boolean = false;
            var loadneeded: boolean = false;
            var vi_id = me.GetViewInstanceId(vm, p, logicalmodelname, area);
            var vi: ViewInstance = me.Instances[vi_id];
            if (vi != null && vi.UIElement) {
                vi = me.Instances[vi_id];
                me.ShowView(vi.ViewModel);

                loadneeded = JSON.stringify([area, vi.Parameters]) != JSON.stringify([area, p]);
                var viewhead = _SelectFirst(".viewinstances [rel='" + vi.Id + "']");

                if (!loadneeded && !IsNull(viewhead)) {
                    SelectElement(container, viewhead);
                }
                vm = vi.ViewModel;
                vm.Area = area;
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
                    var VUIReady: Function = vm["UIElementReady"];
                    if (IsFunction(VUIReady)) {
                        VUIReady.call(vm);
                    }

                    if (navigate) {
                        me.SetUIViewInstance(vi);
                        var fhash = window.location.hash;
                        var wroute = AppDependencies.GetRouteProperties(window.location.hash);
                        var vroute = AppDependencies.GetRouteProperties(vi.Url);
                        if (
                            wroute.area == vroute.area
                            && wroute.controller == vroute.controller
                            && wroute.view == vroute.view
                        ) {
                            //me.ShowView(vm);
                        }
                        me.EnsureCommandBar(vm);
                        //me.ShowView(vm);
                        readycallback(vm);

                    }

                    //HideProgress("BaseModelController");


                };

            }
            if (loadneeded) {
                //ShowProgress("BaseModelController");
                vi.Parameters = p;
                vm.parameterstr = <any>p;
                vm.Action(p);
                me.ShowView(vm);

            } else {
                readycallback(vm);

            }

            return vm;
        }


        public GetViewInstanceId(vm: View, p: Object, logicalmodelname: string, area: string): string {
            var me = this;
            var vi_id = "";
            if (vm.IsList()) {
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
            var id = vi.Id;
            while (id.indexOf("'") != -1) {
                id = id.replace("'", "&#39;")
            }
            div.innerHTML = "<div rel='" + id + "'><a href='" + vi.Url + "' >" + vi.Title + "</a><span  class='delete icon a-Cancel'></span></div>";
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
            vi.Url = Format("#{0}\\{1}\\{2}", vi.LogicalModelName, vi.ViewModel.Name, IsNull(vi.Parameters) ? "" : vi.Parameters);
            if (vi.ViewModel.Area.length > 0) {
                vi.Url = Format("#{0}\\{1}\\{2}\\{3}", vi.ViewModel.Area, vi.LogicalModelName, vi.ViewModel.Name, IsNull(vi.Parameters) ? "" : vi.Parameters);

            }
            var existing = _SelectFirst(".viewinstances [rel=\"" + vi.Id + "\"] > a");
            if (IsNull(existing)) {
                me.AddViewInstance(vi, function () {
                    var canclose = true;
                    canclose = vi.ViewModel.Close();
                    return canclose;
                });
            } else {
                //existing.setAttribute("href", window.location.hash);
                existing.setAttribute("href", vi.Url);

            }
            var container = document.querySelector(".viewinstances");
            var viewhead = _SelectFirst(".viewinstances [rel=\"" + vi.Id + "\"]");
            SelectElement(container, viewhead);
        }
        private ViewIconDictionary: DictionaryOf<string> =
            {
                "Save": "v-Save",
                "Label": "v-Label",
                "Create": "v-Create",
                "CreateFrom": "v-CreateFrom",
                "Barcode": "v-Barcode",
                "ProductionItemBarcode": "v-ProductionItemBarcode",
                "Details": "v-Details",
                "Process": "v-Process",
                "Hierarchy": "v-Hierarchy",
                "Print": "v-Print",
            };
        private _ActionsHtml = "";

        private Features = {};

        public GetModelFeatures(): ModelFeatures {
            var me = this;
            var featurekey = AppDependencies.IsAdmin() ? "Admin" : "_";
            if (!IsNull(me.Features[featurekey])) {
                return me.Features[featurekey];
            }
            var result = new ModelFeatures();
            var allowed = "Models" in AppDependencies.Settings.AllowedFeatures ? AppDependencies.Settings.AllowedFeatures["Models"] : null;
            if (AppDependencies.IsAdmin()) {
                var adminallowed = "AdminModels" in AppDependencies.Settings.AllowedFeatures ? AppDependencies.Settings.AllowedFeatures["AdminModels"] : null;
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
            command.Source = me.NS;
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
    export class HttpClient {
        public EntryPointBase: string = "";
        private token: string = "";
        public DefaultHeaders = {};
        public OnResponse: Function = function (url) {
            Tasks.EndTask(url);
        };
        public OnRequest: Function = function (url) {
            Tasks.StartTask(url);
        };

        private cancelfunction = () => { };
        public OnError(xhttp: XMLHttpRequest, errorhandler: Function) {
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
            var handleerror = (request: XMLHttpRequest, errormessage) => {
                if (IsFunction(errorhandler)) {
                    errorhandler(request);
                } else {
                    Toast_Error("Request failed (" + request.status + ")", url + ":\r\n" + errormessage);
                    Log("Request failed (" + request.status + ")", url + ":\r\n" + errormessage)

                }
            }
            if (!url.endsWith("/api/xauthenticate")) {
                if (xhttp.status == 401) {
                    var redirecttologin = () => {
                        var hash = window.location.hash;
                        hash = hash.replace("#", "Url:");
                        hash = Replace(hash, "\\", "/");
                        if (hash.startsWith("#Settings\\Login\\")) {
                            hash = "";
                        }
                        window.location.hash = "#Settings\\Login\\" + hash;
                    };
                    if (errorhandler == me.cancelfunction) {
                        console.log("Re Login Failed");
                        redirecttologin();
                    } else {
                        console.log("Attempting to Authenticate again");

                        me.Authenticate((r) => {
                            AppDependencies.HandleAuthenticationResult(r);

                            var f: Function = me[xhttp["HttpClientFunction"]];
                            if (IsFunction(f)) {
                                var parameters = xhttp["Parameters"];
                                f.apply(me, parameters);
                            }
                        }, () => {
                            //handleerror(xhttp, errormessage);
                            redirecttologin();
                        });
                    }

                } else {
                    handleerror(xhttp, errormessage);
                }
            } else {
                handleerror(xhttp, errormessage);
            }
        };

        public GetUrl(url: string): string {
            //var xurl = url.indexOf("~/") == 0 ? this.EntryPointBase + url.substr(2) : url;
            var xurl = url.indexOf("~") == 0 ? this.EntryPointBase + url.substr(1) : url;
            return xurl;
        }
        private setHeaders(request: XMLHttpRequest, headers?: object, raw: boolean = false) {
            var me = this;
            if (!raw) {
                if (!IsNull(this.token)) {
                    request.setRequestHeader("Authorization", "Bearer " + this.token)
                }
                var token = AppDependencies.GetParameter("Token");
                var credentials = Coalesce(JSON.parse(AppDependencies.GetParameter("Credentials")), {});
                if (!IsNull(credentials.UserName)) {
                    request.setRequestHeader("UserName", credentials.UserName);

                }
                var urlParams = new URLSearchParams(window.location.search);
                var urlwsid = urlParams.get("WebServiceIdentifier");
                if (!IsNull(urlwsid)) {
                    request.setRequestHeader("WebServiceIdentifier", urlwsid);

                }
                request.setRequestHeader("Token", token);
                request.setRequestHeader("Domain", AppDependencies.Settings.Domain);

            }
            for (var key in me.DefaultHeaders) {
                request.setRequestHeader(key, me.DefaultHeaders[key]);

            }
            for (var key in headers) {
                request.setRequestHeader(key, headers[key]);

            }


        }
        public Get(url: string, header: object, onSuccess: Function, onError?: Function) {
            var me = this;
            var xurl = this.GetUrl(url);
            var xhttp = new XMLHttpRequest();
            //onError = IsNull(onError) ? this.OnError : onError;

            xhttp.onreadystatechange = function () {
                if (this.readyState == 4) {
                    me.OnResponse(xurl);

                    if (this.status == 200) {
                        onSuccess(this);
                    } else {
                        me.OnError(xhttp, onerror);
                        //onError.call(me, this)
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

        public RawGet(url: string, header: object, onSuccess: Function, onError?: Function) {
            var me = this;
            var xurl = this.GetUrl(url);
            var xhttp = new XMLHttpRequest();
            //onError = IsNull(onError) ? this.OnError : onError;

            xhttp.onreadystatechange = function () {
                if (this.readyState == 4) {
                    me.OnResponse(xurl);

                    if (this.status == 200) {
                        onSuccess(this);
                    } else {
                        me.OnError(xhttp, onerror);

                        //onError.call(me, this)
                    }

                }
            };
            xhttp["RequestUrl"] = xurl;
            xhttp["OriginalRequestUrl"] = url;
            xhttp.open("GET", xurl, true);
            for (var key in header) {
                xhttp.setRequestHeader(key, header[key])

            }
            me.OnRequest(xurl);
            xhttp.send();
            return xhttp;
        }


        public Decompress(data): any {
            var Model = [];
            var vd: object = data["ViewData"];
            var mainfielddictinary = vd["FieldDictionary[]"];
            var fds = Object.keys(vd)
                .Where(i => i.startsWith("FieldDictionary["))
                .Select(i => TextBetween(i, "FieldDictionary[", "]"))
                .Where(i => !IsNull(i));
            (<any[]>data["Model"]).forEach(function (item) {
                if (IsNull(item.TypeName)) {
                    item.TypeName = vd["TypeName"];
                }
                var modelitem = RestoreModel(item, mainfielddictinary);
                fds.forEach(fdk => {
                    if (IsNull(modelitem[fdk])) {
                        modelitem[fdk] = [];
                    }
                });
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
                modelitem["TypeName"] = item.TypeName;
                Model.push(modelitem);
            });
            return Model;
        }

        public GetMultiData(queries: ClientQuery[], onSuccess: Function, onError?: Function, cachemaxage: number = 0) {
            var me = this;
            if (AppDependencies.IsInDebugMode()) {
                var q = {}
                queries.forEach((query, ix) => {
                    q[query.QueryName + "|" + ix] = query;
                });
                console.log(q);
            }
            var xurl = this.GetUrl("~/webui/api/xclientquery/?query=MultiData");
            if (cachemaxage == 0) {
                xurl = xurl + "&dt=" + Guid();
            }
            var xhttp = new XMLHttpRequest();
            xhttp["HttpClientFunction"] = "GetMultiData";
            xhttp["Parameters"] = [queries, onSuccess, me.cancelfunction, cachemaxage];
            //onError = IsNull(onError) ? this.OnError : onError;

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
                        if (AppDependencies.IsInDebugMode()) {
                            console.log(data);
                        }
                        onSuccess(data);
                    } else {
                        me.OnError(xhttp, onError);

                        //onError.call(me, this)
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
            xhttp["HttpClientFunction"] = "GetData";
            xhttp["Parameters"] = [query, onSuccess, me.cancelfunction, cachemaxage];
            xhttp["Query"] = query;
            //onError = IsNull(onError) ? this.OnError : onError;

            xhttp.onreadystatechange = function () {
                if (this.readyState == 4) {
                    me.OnResponse(xurl);

                    if (this.status == 200) {
                        var data = JSON.parse(this.responseText);

                        data.Model = me.Decompress(data);
                        onSuccess(data);
                    } else {
                        console.log(this["Query"]);
                        me.OnError(xhttp, onError);
                        //onError.call(me, this)
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

        public Post(url: string, data: any, onSuccess: Function, onError?: Function, contenttype?: string, marker: string = "", headers?: any) {
            var me = this;
            var xurl = this.GetUrl(url);
            var xhttp = new XMLHttpRequest();
            xhttp["HttpClientFunction"] = "Post";
            xhttp["Parameters"] = [url, data, onSuccess, me.cancelfunction, contenttype, marker, headers];
            //onError = IsNull(onError) ? this.OnError : onError;

            xhttp.onreadystatechange = function () {
                if (this.readyState == 4) {
                    me.OnResponse(xurl);

                    if (this.status == 200) {
                        onSuccess(this);
                    } else {
                        me.OnError(xhttp, onError);

                        //onError.call(me, this)
                    }

                }
            };
            xhttp["RequestUrl"] = xurl;
            xhttp["marker"] = marker;
            xhttp.open("POST", xurl, true);

            if (!IsNull(contenttype)) {
                xhttp.setRequestHeader("Content-Type", contenttype);
            }
            this.setHeaders(xhttp, headers);
            me.OnRequest(xurl);

            xhttp.send(data instanceof Object ? JSON.stringify(data) : data);
            return xhttp;
        }

        public ExecuteApi(url: string, method: string, data: any, onSuccess: Function, onError?: Function, contenttype: string = "application/json", marker: string = "") {
            var me = this;
            var xurl = this.GetUrl("~/webui/api/xpartnerapi");
            var xhttp = new XMLHttpRequest();
            //onError = IsNull(onError) ? this.OnError : onError;

            xhttp.onreadystatechange = function () {
                if (this.readyState == 4) {
                    me.OnResponse(xurl);

                    if (this.status == 200) {
                        onSuccess(this);
                    } else {
                        me.OnError(xhttp, onError);

                        //onError.call(me, this)
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
            var fdata = { data: data, url: url, method: method };
            xhttp.send(JSON.stringify(fdata));
            return xhttp;
        }


        public PostOld(url: string, data: any, onSuccess: Function, onError?: Function, contenttype?: string, headers?: object) {
            var me = this;
            var xurl = this.GetUrl(url);
            var xhttp = new XMLHttpRequest();
            //onError = IsNull(onError) ? this.OnError : onError;

            xhttp.onreadystatechange = function () {
                if (this.readyState == 4) {
                    me.OnResponse(xurl);

                    if (this.status == 200) {
                        onSuccess(this);
                    } else {
                        me.OnError(xhttp, onError);

                        //onError.call(me, this)
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

        public RawPost(url: string, data: any, onSuccess: Function, onError?: Function, contenttype?: string, headers?: object) {
            var me = this;
            var xurl = this.GetUrl(url);
            var xhttp = new XMLHttpRequest();
            //onError = IsNull(onError) ? this.OnError : onError;

            xhttp.onreadystatechange = function () {
                if (this.readyState == 4) {
                    me.OnResponse(xurl);

                    if (this.status == 200) {
                        onSuccess(this);
                    } else {
                        me.OnError(xhttp, onError);

                        //onError.call(me, this)
                    }

                }
            };
            xhttp["RequestUrl"] = xurl;
            xhttp.open("POST", xurl, true);
            if (!IsNull(contenttype)) {
                xhttp.setRequestHeader("Content-Type", contenttype);
            }
            //xhttp.setRequestHeader("query", data.get("query"));
            //if (!IsNull(data.get("options"))) {
            //    xhttp.setRequestHeader("options", data.get("options"));

            //}
            this.setHeaders(xhttp, headers, true);
            me.OnRequest(xurl);

            xhttp.send(data);
            return xhttp;
        }


        public Put(url: string, data: any, onSuccess: Function, onError?: Function, contenttype: string = "application/json", marker: string = "") {
            var me = this;
            var xurl = this.GetUrl(url);
            var xhttp = new XMLHttpRequest();
            //onError = IsNull(onError) ? this.OnError : onError;

            xhttp.onreadystatechange = function () {
                if (this.readyState == 4) {
                    me.OnResponse(xurl);

                    if (this.status == 200) {
                        onSuccess(this);
                    } else {
                        me.OnError(xhttp, onError);

                        //onError.call(me, this)
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

        public Authenticate_PartnerAPI(success: Function, failure: Function) {
            var me = this;
            var onerror = function (err) {
                me.OnError(err, null);
                if (failure != null) { failure(); }
            }
            var webserviceid = AppDependencies.GetParameter("WebServiceIdentifier");
            if (IsNull(webserviceid)) {
                Toast_Error("Please provide the WebServiceIdentifier");
                failure();
                return;
            }
            var me = this;
            var form = {};
            form["webserviceIdentifier"] = webserviceid;
            var tokend = new Date(localStorage.getItem("tokend"));
            var token = localStorage.getItem("token");
            var isautenticated = false;
            if (Date.now() < tokend.getTime() && token.length > 10) {
                isautenticated = true;
                me.token = token;
            }
            if (!isautenticated) {
                this.Post("~/api/Authenticate", JSON.stringify(form), function (xhttp: XMLHttpRequest) {
                    try {
                        var resp = JSON.parse(xhttp.responseText);
                        me.token = resp["result"];
                        var d = new Date();
                        d.setTime(d.getTime() + 6 * 60 * 60 * 1000);
                        localStorage.setItem("tokend", d.toString());
                        localStorage.setItem("token", me.token);
                        success();
                    } catch (ex) {
                        ex["RequestUrl"] = xhttp["RequestUrl"];
                        ex["responseText"] = "Invalid JSON Response";
                        onerror(ex);
                    }

                }, onerror, "application/json-patch+json");
            } else {
                success();

            }
        }

        public Authenticate(success: Function, failure: Function) {
            var me = this;
            var onerror = function (err) {
                me.OnError(err, null);
                if (IsFunction(failure)) { failure(err); }
            }
            var webserviceid = AppDependencies.GetParameter("WebServiceIdentifier");
            var urlParams = new URLSearchParams(window.location.search);
            var urlwsid = urlParams.get("WebServiceIdentifier");
            //var wsid = Coalesce(webserviceid, urlwsid);
            var wsid = Coalesce(urlwsid, webserviceid);
            var credentials = Coalesce(JSON.parse(AppDependencies.GetParameter("Credentials")), {});
            //SetParameter("Credentials", "{}");
            if (IsNull(wsid) && IsNull(credentials.UserName)) {
                Toast_Error("Please provide the WebServiceIdentifier");
                failure();
                return;
            }
            var me = this;
            var form = {};
            form["WebServiceIdentifier"] = wsid;
            form["UserName"] = credentials.UserName;
            form["Password"] = credentials.Password;

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
                        if (IsNull(webserviceid)) {
                            AppDependencies.SetParameter("WebServiceIdentifier", urlwsid);
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

        public UploadFiles(files: object[] = [], targetfolder: string, onSuccess: Function, onError?: Function,) {
            if (File.length > 0) {
                var formData = new FormData();
                files.forEach(file => {
                    var name = file["Name"];
                    var content = file["Content"];
                    var filename = file["FileName"];
                    formData.append(name, new Blob([content], { type: "text/xml" }), filename);
                });
                var me = this;
                var xurl = this.GetUrl("~/webui/api/xuploadfiles");
                var xhttp = new XMLHttpRequest();
                //onError = IsNull(onError) ? this.OnError : onError;

                xhttp.onreadystatechange = function () {
                    if (this.readyState == 4) {
                        me.OnResponse(xurl);

                        if (this.status == 200) {
                            onSuccess(this);
                        } else {
                            me.OnError(xhttp, onError)
                            //onError.call(me, this)
                        }

                    }
                };
                xhttp["RequestUrl"] = xurl;
                xhttp.open("POST", xurl, true);

                xhttp.setRequestHeader("targetfolder", targetfolder);

                this.setHeaders(xhttp, null);
                me.OnRequest(xurl);

                xhttp.send(formData);
                return xhttp;
            }
        }
    }


    export class Permission {
        public Id: number;
        public PermissionReferenceTypeId: number;
        public PermissionReferenceId: number;
        public PermissionTypeId: number;
        public Comment: string;
        public Parameters: string;

        public PermissionType: PermissionType;
        public PermissionReference: any;
        public PermissionReferenceType: PermissionReferenceType;
    }

    export class PermissionAction {
        public Id: number;
        public Comment: string;
        public Name: string;
    }

    export class PermissionReferenceType {
        public Id: number;
        public Comment: string;
        public Name: string;
    }

    export class PermissionType {
        public Id: number;
        public Comment: string;
        public Controllname: string;
        public Viewname: string;
        public ActionId: number;

        public Action: PermissionAction;
    }
}


function modelobj(element: Element): object {
    var result: object = null;
    var itemelement = _Parents(element).FirstOrDefault(i => i.classList.contains("item"));
    var v = view(element);
    if (v.IsList() && itemelement != null) {
        var items = (<WebCore.ViewModel<object[]>>v).Model;
        var uiitems = GetBoundObject(itemelement);
        var itemid = uiitems["Id"];
        if (!IsNull(itemid)) {
            var item = items.FirstOrDefault(i => i["Id"] == itemid);
            result = item; 
        }

    }
    return result;
}

function view(element: Element): WebCore.View {
    var isview = (item: Element) => item == null ? null : item.hasAttribute("View");
    if (isview(element)) {
        var controllername = element.getAttribute("Controller");
        var viewname = element.getAttribute("View");
        var viewid = element.getAttribute("ViewID");
        return WebCore.AppDependencies.GetView(controllername, viewname, viewid);
    } else {
        if (IsNull(element.parentElement)) {
            return null;
        } else {
            return view(element.parentElement);
        }
    }
}

function controller(element: Element): WebCore.ModelController {
    var isview = (item: Element) => item == null ? null : item.hasAttribute("View");
    if (isview(element)) {
        var controllername = element.getAttribute("Controller");
        var viewname = element.getAttribute("View");
        var viewid = element.getAttribute("ViewID");
        var view = WebCore.AppDependencies.GetView(controllername, viewname, viewid)
        return view.Controller;
    } else {
        if (IsNull(element.parentElement)) {
            return null;
        } else {
            return controller(element.parentElement);
        }
    }
}