class AppDependencies
{
    public static Container(): Element { return null; };
    public static httpClient: HttpClient;
    public static LoadContent(element: Element) { };
    public static ClientValidation: boolean = true;
    public static DataLayer: AppDataLayer = null;
}
  
interface NavigationItemDetails { }
interface RouteProperties
{
    area: string,
    controller: string,
    view: string,
    parameters:string
}
declare function StartJS(): any;

function OnAuthenticated(result:any)
{
    Toast_Success("Authentication successful.");

    application.LoadData(result);
}
function GetParameter(key: string): string
{
    return localStorage.getItem(application.Settings.Domain + "." + key);
}
function SetParameter(key: string, value: any)
{
    localStorage.setItem(application.Settings.Domain + "." + key, value);
}
function SetWebServiceIdentifier()
{
    var input = <HTMLInputElement>document.getElementById("WebServiceIdentifier");
    var label = document.querySelector("span.WebServiceIdentifier");
    if (input.value.indexOf("*") == -1) {
        SetParameter("WebServiceIdentifier", input.value);
        //localStorage.setItem("WebServiceIdentifier", input.value);
        application.Authenticate(OnAuthenticated);
    }
} 
function SetDataEntryPoint() {
    var input = <HTMLInputElement>document.getElementById("DataEntryPoint");
    var label = <HTMLElement>document.querySelector("span.DataEntryPoint");
    application.Settings.DataEntryPoint = input.value;
    application.httpClient.EntryPointBase = input.value;
    application.SaveSettings();
    application.Authenticate(OnAuthenticated);

}

function Login()
{
    var view = application.CurrentView();
    var username = _SelectFirst("[name=username]", view.UIElement);
    var email = _SelectFirst("[name=email]", view.UIElement);

}

GetResource = function(key: string, culture?: string): string {
    return Res(key, culture);
}
var missingresources = {};
function RetrieveResource(key: string): string
{
    if (ResExists(key)) {
        return Res(key);
    }
    return "";
}
function ResNvl(keys: string[],key:string=""):string
{
    if (IsNull(keys) || keys.length == 0) { return ""; }
    var firstkey = keys.FirstOrDefault();
    for (var i = 0; i < keys.length; i++)
    {
        var key = keys[i];
        if (ResExists(key)) { return Res(key);}
    }
    if (firstkey.indexOf(".") > -1) {
        var lastkeypart = firstkey.substring(firstkey.lastIndexOf(".") + 1);
        return lastkeypart;
    }
    return FirstNotNull(key, firstkey);
}
ModelRes = function (key: string, viewpath:string="") {
    var culture = application.Settings.Culture;
    var parts = key.split('.');
    var typename = parts.FirstOrDefault();
    var mkey = parts.slice(1).join('.');
    var mp = MetaAccess({ TypeName: typename }, mkey);
    var mc:any = GetMetaByTypeName(typename);
    var dotix = mkey.lastIndexOf(".");
    if (dotix > -1)
    {
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


}
Res = function(key: string, culture?: string): string {
    if (IsNull(culture)) {
        culture = application.Settings.Culture;
    }
    var appres = application.Resources[culture][key];
    if (IsNull(appres) && appres!="") {
        appres = key.substr(key.lastIndexOf('.') + 1);

        if (!(key in missingresources)) {
            missingresources[key] = appres;
        }
    }
    return appres;
}

ResExists = function (key: string, culture?: string): boolean {
    if (IsNull(culture)) {
        culture = application.Settings.Culture;
    }
    var appres = application.Resources[culture][key];
    return !IsNull(appres);
}


class ResourceContainer implements Dictionary
{
    public Cultures = {};
    public Load(culture: string, obj: Dictionary,key:string)
    {
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
interface AppResponse
{
    Model: any[];
    Errors: any[];
    ViewData: object;
}
class AppUICommand
{
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
    public Render(model: any, control?: any): string
    {
        var me = this;
        var html = "";
        var uielement: Element = null
        if (me.IsInContext(model, control)) {
            var url = me.Url(model, control, me);
            var onclick = me.OnClick(model, control,me);
            if (!IsNull(url))
            {
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

    public static CreateFrom(obj: object): AppUICommand
    {
        var command = new AppUICommand();
        for (var key in obj)
        {
            command[key] = obj[key];
        }
        return command;
    }

    public static Create(condition: string, appearsin:string[], key: string, action: string, classprefix:string="a-"): AppUICommand
    {
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
            for (var i = 0; i < functions.length; i++)
            {
                if (!functions[i](model,view)) { return false;}
            }
            return result;
        };
        command.IsInContext = allfunction;
        
        command.CssClass = "icon " + classprefix + key;
        if (action.startsWith("#") || action.startsWith("http://")) {
            command.Url = (model: any, view?: View, c?: AppUICommand) => Format(c.Action, Access(model,"Id"));
        } else
        {
            command.OnClick = (model: any, view?: View, c?: AppUICommand) => Format(c.Action, Access(model,"Id"));
        }
        command.Key = key;
        //command.Label = Res("UI.Commands." + key);
        return command;
    }

    public static CreateFromHtml(key: string, Render: Function, isincontext?: Function)
    {
        var command = new AppUICommand();
        command.Key = key;
        command.Render = <any>Render;
        if (!IsNull(isincontext))
        {
            command.IsInContext = <any>isincontext;
        }
        return command;
    }
}
//class AppActionOld
//{
//    public UrlFormat: string;
//    public FunctionStr: string;
//    public Function: Function = function (obj) { };
//    public HtmlFor: Function = function (obj) { };
//    public LabelKey: string;
//    public Key: string;
//    public CssClass: string;
//    public Paths: string[] = [];
//    public TypeNames: string[] = [];

//    public static GetTemplate(action: AppActionOld,model:any=null): string
//    {
//        var htmlformat = '<span class="button {3}" title="{2}" onclick="{0}" rel="{1}" ></span>';
//        if (!IsNull(action.UrlFormat)) {
//            htmlformat = '<a class="button {3}" title="{2}" href="{1}" rel="{0}" ></a>';

//        }
//        return htmlformat;
//    }

//    public static Create(FunctionStr: string, CssClass: string, Key: string): AppActionOld
//    {
//        var appaction = new AppActionOld();
//        appaction.CssClass = CssClass;
//        appaction.FunctionStr = FunctionStr;
//        appaction.Key = Key;
//        appaction.LabelKey = Format("UI.Actions.{0}", Key);
//        return appaction;
//    }
//}
interface AppScript
{
    script: string;
    children?: AppScript[];
}
const default_MoneyFormat: String = "### ##0.00";
function FormatCurrencyAmount(value: any): number {
    if (!IsNull(value)) {
        return Number(Format("{0:" + default_MoneyFormat + "}", value));
    }
    return 0;
}
interface AppSettings
{
    Domain: string;
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
    BarcodeField: string;
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
}
interface IQueryAction
{
    query: ClientQuery;
    onready: Function;
}
class Application
{
    //public Settings: AppSettings = <AppSettings>{};
    public Resources: ResourceContainer = new ResourceContainer()
    public data: Object = {};
    private _Container: Element = null;
    private _ScriptsReady = false;
    private _scriptwaiter = null;
    private get scriptwaiter() { 
        if (this._scriptwaiter == null)
        {
            this._scriptwaiter = new Waiter();
        }
        return this._scriptwaiter;
    }
    public Commands: DictionaryOf<AppUICommand> = {};
    public StaticDataQueryActions: DictionaryOf<IQueryAction> = {};
    public RegisterCommand(command: AppUICommand) {
        var me = this;
        me.Commands[command.Key] = command;
    }
    public UnRegisterCommand(key: string) {
        var me = this;
        delete me.Commands[key];
    }

    public ScriptsReady()
    {
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
    public IsInDebugMode(): boolean {
        return getUrlParameter('debug')=="1";
    }
    public IsAdmin(): boolean
    {
        var me = this;
        var result = false;
        if (me.Settings.Company != null)
        {
            return me.Settings.Company["WebserviceUserId"] == 1;
        }
        return result;
    }

    public get Container(): Element
    {
        this._Container = _SelectFirst(".container");
        return this._Container;
    }
    public constructor()
    {
        var me = this;
        me.scriptwaiter.SetWaiter("scripts", function () {
            me.LoadX();
        })
        me.scriptwaiter.SetTasks("scripts", ["appscripts", "customscripts"]);
        var db_name = Format("DB_{0}", me.Settings.Domain);
        me._idb = new IDB(db_name, me._storename);

    }

    public get AppName(): string
    {
        var name = window.location.pathname;
        var appname = name.substr(name.lastIndexOf("/") + 1);
        if (appname.indexOf('.'))
        {
            appname = appname.substring(0, appname.lastIndexOf('.'));
        }
        return appname;
    }

    public ImportScripts: ImportScript[] = [];
    public Controllers: ModelController[] = [];
    public Waiter: Waiter = new Waiter();
    public httpClient: HttpClient = new HttpClient();
    public localhttpClient: HttpClient = new HttpClient();
    public Menu: NavigationItem = null;

    //private _RegisteredActions: AppActionOld[]=[];
    //public RegisterAction(action: AppActionOld) {
    //    var me = this;
    //    me._RegisteredActions.push(action);
    //}
    public ReloadSettings()
    {
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

    public menuElement(): Element
    {
        return _SelectFirst(".navigation");
    }

    public LoadContent(item: Element)
    {
        this.Container.appendChild(item);

    }
    public DataPipe(data: any, v: View)
    {

    }
    public Delete(element: Element, args?: any)
    {
        var toremove = element.parentElement;
        toremove.remove();

        if (!IsNull(toremove["OnRemove"])) {
            toremove["OnRemove"]();
        }
    }
    public GetContainer(): Element {
        return _SelectFirst(".container");
    }
    public GetController(name:string): ModelController
    {
        return this.Controllers.FirstOrDefault((c: ModelController) => c.ModelName == name);

    }

    public Authenticate(callback?: Function) {
        var me = this;
        var waiter = new Waiter();
        //ShowProgress("p-Authenticate");
        waiter.SetWaiter("app", function () {
            //HideProgress();
        })
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

    public Navigate(source:Element, args: any)
    {
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
            } else {
                me.NavigateTo(controllername, action, "");
            }
        
        }
    }
    public NavigateTo(controller: string, view: string, p: any, area:string="")
    {
        console.log(Format("NavigateTo({0},{1},{2},{2})", controller,view,p,area));
        var me = this;
        
        var mc = this.Controllers.FirstOrDefault((c: ModelController) => c.ModelName == controller);
        if (mc != null) {
            var vm: View = mc.ViewDictionary[view];
            if (vm != null) {
                for (var i = 0; i < this.Container.children.length; i++) {
                    var node = this.Container.children[i];
                    _Hide(node);
                }
                var xvm = mc.Load(vm, p,"",area);


            }
        } else
        {
            var bc = <BaseModel.Controller>this.Controllers.FirstOrDefault((c: ModelController) => c.ModelName == "BaseModel");
            if (bc.IsAvailable(controller)) {
                var meta = GetMetaByTypeName(controller);
                if (!IsNull(meta)) {
                    mc = this.Controllers.FirstOrDefault((c: ModelController) => c.ModelName == "BaseModel");
                    if (mc != null) {
                        var vm: View = mc.ViewDictionary[view];
                        if (vm != null) {
                            for (var i = 0; i < this.Container.children.length; i++) {
                                var node = this.Container.children[i];
                                _Hide(node);
                            }
                            var xvm = mc.Load(vm, p, meta.MetaKey,area);
                        }
                    }
                }
            }
        }
    }

    public GetView(controllername: string, viewname: string, viewid: string=""):View
    {
        var mc = this.Controllers.FirstOrDefault((c: ModelController) => c.ModelName == controllername);
        if (mc != null) {
            var vm: View = mc.ViewDictionary[viewname];
            if (vm != null) {
                if (!IsNull(viewid))
                {
                    if (viewid in mc.Instances)
                    {
                        return mc.Instances[viewid].ViewModel;
                    }
                }
                return vm;
            }
        }
        return null;
    }

    public GetRouteProperties(url: string=""): RouteProperties {
        var url = IsNull(url) ? window.location.hash : url;
        if (url.indexOf("#") == 0) {
            url = url.substr(1);
        }
        var paths =url.split("\\");
        var result: RouteProperties = {
            area: "",
            controller: paths[0],
            view: paths[1],
            parameters: paths[2]
        }
        if (paths.length == 4) {
            result.area = paths[0];
            result.controller = paths[1];
            result.view = paths[2];
            result.parameters = paths[3];
        }
        return result;
    }

    public NavigateUrl(url: string)
    {
        var me = this;
        if (url.indexOf("#") == 0)
        {
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
    public LoadX()
    {
    
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
 
    public Load() {
        var me = this;
        document.body.addEventListener("load", function () {
            application.LoadX();
        });
        //this.Settings = me.GetSettings();
        var customscripts = [];// me.Settings.CustomFiles.Where(i => i.endsWith(".js"));

        var customstyles = [];//me.Settings.CustomFiles.Where(i => i.endsWith(".css"));
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

        var loadscript = function (selement: HTMLScriptElement) {
            //console.log("Loading " + selement.src);
            document.head.appendChild(selement);

        }
        if (customscripts.length == 0) {
            me.scriptwaiter.EndTask("scripts", "customscripts");

        } else {
            var customscriptwaiter = new Waiter();

            customscriptwaiter.SetWaiter("customscripts", function () {
                me.scriptwaiter.EndTask("scripts", "customscripts");

            })
            customscriptwaiter.SetTasks("customscripts", customscripts);
            for (var i = 0; i < customscripts.length; i++) {
                var src = customscripts[i];
                var selement = <HTMLScriptElement>document.createElement('script');
                selement.setAttribute('src', src);
                selement.defer = true;
                selement.type = "text/javascript";
                selement.onload = function () {
                    var src = (<HTMLScriptElement>this).getAttribute("src");
                    customscriptwaiter.EndTask("customscripts", src);
                    console.log("---script loadded " + src + "");

                };
                loadscript(selement);
            }

        }

        this.httpClient.EntryPointBase = me.Settings.DataEntryPoint;
        this.localhttpClient.EntryPointBase = "";



    }
    
    private _storename: string[] = ["SD","Data","Sync","Files","Info"];
    private _Settings: AppSettings = null;
    public get Settings(): AppSettings
    {
        var me = this;
        var defaultsettings = window["appsettings"];
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
                me._Settings = lssettings


            } else
            {
                var newhash = HashCode(JSON.stringify(defaultsettings));
                if (newhash != lssettings["HashCodeappsettings"]) {
                    var dentry = lssettings["DataEntryPoint"];
                    var defaultsettingscopy = <AppSettings>JsonCopy(defaultsettings);
                    defaultsettingscopy["DataEntryPoint"] = dentry;
                    defaultsettingscopy["HashCodeappsettings"] = newhash;
                    me.SaveSettings(defaultsettingscopy);
                    lssettings["HashCodeappsettings"] = HashCode(JSON.stringify(defaultsettingscopy));
                    me._Settings = defaultsettingscopy

                } else
                {
                    me._Settings = lssettings

                }
            }
        }
        //me._storename = "SD_" + me._Settings.Domain;
        
        return me._Settings;

    }
    public SaveSettings(settings: AppSettings=null)
    {
        var me = this;
        var defaultsettings = window["appsettings"];
        var domain = defaultsettings.Domain;
        var domainsettingskey = domain + ".Settings";
        var settingsstr = JSON.stringify(IsNull(settings) ? me.Settings : settings);
        localStorage.setItem(domainsettingskey, settingsstr);
    }
    private NavigationItems = {};

    public Layouts = {
        Dictionary: {},
        Templates: {}, 
        load: function () {
            var me = this;
            var views = (<string[]>window["base_viewfiles"]).concat(application.Settings.Views);
            views.forEach(function (layoutpath) {
                var ix = layoutpath.lastIndexOf("\\");
                var name = layoutpath.substring(ix + 1);
                var nameparts = name.split(".");
                var controlviewname = nameparts[0] + "." + nameparts[1];
                var folder = layoutpath.substring(0, ix);
                if (!(controlviewname in me.Dictionary)) {
                    me.Dictionary[controlviewname] = [];
                } else
                {
                    console.log('');
                }
                me.Dictionary[controlviewname].push(layoutpath);
                me.Templates[layoutpath] = "";
            });
        }
    };

    public LoadLayouts()
    {
        //this.httpClient.EntryPointBase = this.entrypoint;
        var me = this;
        me.Layouts.load();
        var items: NavigationItem[] = [];

        var waiter = new Waiter();
        waiter.SetWaiter("layouts", function () {
            f_loadviews();
            me.LoadUI.call(me);
            me.Authenticate(me.LoadData);
            

        });
        waiter.SetTasks("layouts", ["metadata", "resources"]);
        for (var layout in me.Layouts.Templates)
        {
            var layoutpath = layout;
            waiter.StartTask("layouts", layoutpath);
            me.localhttpClient.Get(layoutpath, {}, function (r) {
                me.Layouts.Templates[r.OriginalRequestUrl] = r.responseText;
                waiter.EndTask("layouts", r.OriginalRequestUrl);

            });
        }
        var f_loadviews = function () {
            me.Controllers.forEach((controller: ModelController) => {
                if (controller.ModelName == "BaseModel") {
                    console.log("BM");
                }
                controller.Views.forEach(function (vm) {
                    if (IsNull(vm.TemplateHtml)) {
                        var modelname = FirstNotNull(vm.LogicalModelName, vm.Controller.ModelName);
                        var controlviewname = Format("{0}.{1}", modelname, vm.Name);
                        var layouts = <any[]>FirstNotNull( me.Layouts.Dictionary[controlviewname],[]);
                        for (var i = 0; i < layouts.length; i++)
                        {
                            var layoutpath = layouts[i];
                            var customlayoutpath = layoutpath.replace("layout\\", "Customisations\\" + application.Settings.Domain + "\\layout\\");
                            if (customlayoutpath in me.Layouts.Templates) {
                                vm.TemplateHtml = me.Layouts.Templates[customlayoutpath];
                                vm.LayoutPath = customlayoutpath;
                            } else {
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
                                    vm.AddTemplate("razor", t)
                                    //vm.RazorTemplate = Razor.Complile(me.Layouts.Templates[razorpath]);
                                } catch (ex) {
                                    console.log("Error in " + vm.LayoutPath);
                                    console.log(ex);
                    
                                }
                            }

                        }
                 
                    }
                });
            });
            Log("Views Loaded.")
        }
        me.Menu = <any>application.Settings.Navigation;
     

        var metafiles = ["configdata\\meta.json", "configdata\\extendedmeta.json"];
        metafiles = metafiles.concat(me.Settings.CustomFiles.Where(i => i.endsWith("meta.json")));
        var metadictionary = {};
        var metawaiter = new Waiter();
        metawaiter.SetWaiter("metas", function () {
            metafiles.forEach(function (metafile) {
                metaModels.Load(metadictionary[metafile]); 
            })
            waiter.EndTask("layouts", "metadata");
        })
        metawaiter.SetTasks("metas", metafiles);
        for (var i = 0; i < metafiles.length; i++) {
            var metafile = metafiles[i];
            me.httpClient.Get(metafile, {},function (r) {
                var myArr = JSON.parse(r.responseText);
                metadictionary[r.RequestUrl] = myArr;
                metawaiter.EndTask("metas", r.RequestUrl);

            });
        }
        me.LoadResources(() => waiter.EndTask("layouts", "resources"));


    }
    public SetCulture(culture: string)
    {
        var me = this;
        me.LoadResources(function () { });
    }
    public LoadResources(callback: Function)
    {
        var me = this;
        var resourcefilename = "resources-" + me.Settings.Culture + ".json";
        var resourcefiles = ["configdata\\" + resourcefilename];
        resourcefiles = resourcefiles.concat(me.Settings.CustomFiles.Where(i => i.endsWith(resourcefilename)));
        var resourcesdictionary = {};
        var resourcewaiter = new Waiter();
        resourcewaiter.SetWaiter("resources", function () {
            resourcefiles.forEach(function (resourcefile) {
                me.Resources.Load(me.Settings.Culture, resourcesdictionary[resourcefile], resourcefile);
            })
            callback();
        })
        resourcewaiter.SetTasks("resources", resourcefiles);
        for (var i = 0; i < resourcefiles.length; i++) {
            var resourcefile = resourcefiles[i];
            me.httpClient.Get(resourcefile, {}, function (r) {
                var myArr = JSON.parse(r.responseText);
                resourcesdictionary[r.RequestUrl] = myArr;
                resourcewaiter.EndTask("resources", r.RequestUrl);

            });
        }
    }


    public LoadData(company: object) {
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
        var retrievedata = function (callback: Action<any[]>) { callback([]) };
        var sd_storename = "SD";
        if (me._idb.IsAvailable()) {
            savetoIDB = function () {
                me._idb.Save(AppDataLayer.Data, sd_storename, function () {
                    var d = new Date();
                    SetParameter("DBDate", d.toString());

                });
            }
            retrievedata = function (callback: Action<any[]>) {
                var storedate = GetParameter("DBDate");
                var sdate = new Date(storedate);
                
                var cdate = new Date();
                var h = 1;
                sdate.setTime(sdate.getTime() + (h * 60 * 60 * 1000));
                if (isNaN(sdate.getTime())
                    || sdate < cdate
                ) {
                    callback([]);
                } else {
                    me._idb.GetData(sd_storename, function (r) {
                        callback(r);

                    });
                }

            };
        }
        var queryswithactions: IQueryAction[] = Object.keys(me.StaticDataQueryActions).Select(i => me.StaticDataQueryActions[i]);
        var querylist = queryswithactions.Select(i => i.query);
        datawaiter.StartTask("data", "obtain");
        retrievedata(function (r) {
            var idbdata = <any[]>FirstNotNull(r, []);
            if (idbdata.length > 0) {
                AppDataLayer.Data = idbdata.FirstOrDefault();

                Log("data retrieved from IDB");
                datawaiter.EndTask("data", "obtain");
            } else
            {
                Log("retrieving data from server");

                me.httpClient.GetMultiData(querylist,
                    function (r) {
                        var data = r;
                        console.log(r);
                        for (var key in data) {
                            if (key.indexOf("|") > -1) {
                                var queryname = key.split("|")[0];
                                var queryix = key.split("|")[1];
                                var queryitem = queryswithactions[queryix];
                                if (!IsNull(queryitem)) {
                                    var onready = queryitem.onready;
                                    onready((<AppResponse>data[key]).Model);
                                } else {
                                    Toast_Error(Format("Handler for query {0} was not found!", queryname));
                                }
                            }
                          
                        }
                        AppDataLayer.Link();
                        Log("data retrieved from server");
                        datawaiter.EndTask("data", "obtain");
                        savetoIDB();
                    },
                    null, 0);
            }
        });
       

    }
    public LoadMenu()
    {
        var menuelement = _SelectFirst("#menu");
        var children: any[] = <any>application.Settings.Navigation.Children;
        var adminnode = children.FirstOrDefault(i => i["Key"] == "Admin");
        var menuobj = { Children: [] };
        menuobj.Children = children;
        if (!this.IsAdmin()) {
            menuobj.Children = children.Where(i => i != adminnode);
        }
        TreeMenu(menuelement, menuobj); 
    }
    public LoadUI()
    {
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
        function updateIndicator()
        {
            if (!navigator.onLine) {
                onlineindicator.classList.add("entypo-block");
                _Show(onlineindicator); 
            } else {
                onlineindicator.classList.remove("entypo-block");
                _Hide(onlineindicator);

            }
        }
        updateIndicator();
        window.addEventListener('online', updateIndicator);
        window.addEventListener('offline', updateIndicator);
    }

    public ClearFloats(except: Element=null) {
        var nav = _SelectFirst(".navigation");
        if (except != nav) {
            nav.classList.remove("visible");
            var e = nav;
            e["A_Show"] = function () {
                this.classList.add("visible");
                _Show(this);
            }
            e["A_Hide"] = function () {
                this.classList.remove("visible");
            }
        }
        var ac = document.querySelector("#action-center");
        if (except != ac) {

            ac.classList.add("hidden");
            var e = ac;
            e["A_Show"] = function () {
                this.classList.remove("hidden");
                _Show(this);

            }
            e["A_Hide"] = function () {
                this.classList.add("hidden");
            }
        }
        var vi = document.querySelector(".viewinstances");
        if (except != vi) {

            vi.classList.remove("pop");
            var e = vi;
            e["A_Show"] = function () {
                this.classList.add("pop");
                _Show(this);

            }
            e["A_Hide"] = function () {
                this.classList.remove("pop");
            }
        }

    }
    public ToggleFloat(selector: string, ev: MouseEvent)
    {
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
    public CloseHovering(element: Element, path: Element[]=[])
    {
        //console.log("CloseHovering");
        var hovers = Array.from( document.querySelectorAll(".hovering"));
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
                (<Function>htc["A_Hide"])();
            } else {
                if ((<HTMLElement>htc).style.display != "none") {
                    console.log("Hiding: ");
                    console.log(htc);
                    _Hide(htc);

                }
            }

            //}
        } 
    }
    public UIClick(e: MouseEvent)
    {
        var me = this;
        var target = <HTMLElement>e.target;
        var path:any[] = e["path"];
        if (IsArray(path) && path.length>0 && !IsNull(path[0])) {
            target = path[0];
        }
        me.CloseHovering(target, Coalesce(path,[])); 
    }

    public CurrentView(): View
    {
        var elements = _Select(".container>div");
        var element: Element = null;
        elements.forEach(function (el: HTMLElement) {
            if (el.style.display != "none") {
                element = el;
            }
        });
        if (element != null)
        {
            return view(element);
        }
        return null;
    }
    private _idb:IDB = null;

    public SaveToClient(data: any, storename: string, callback: Function)
    {
        var me = this;
        me._idb.Save(data, storename, callback);
    }
    public GetFromClient<T>(storename: string, callback: Action<T[]>, filter: Func1<T, boolean>=null) {
        var me = this;
        me._idb.GetData(storename, callback, filter);
    }
    public RefreshStaticData(callback: Function)
    {
        var me = this;
        me._idb.ClearStore("SD", function (r) {

            me.LoadData(application.Settings.Company);
            callback();
        });
    }
    public Refresh = window["_RefreshFiles"];

}
class App_ActionCenter extends HTMLElement {
    constructor() {
        super();       
    }
    public attributeChangedCallback(attrName, oldValue, newValue) {
        this[attrName] = this.hasAttribute(attrName);
    }
    public connectedCallback() {
        var element = this;
        var htmlbuilder: string[] = [];
        htmlbuilder.push('<fieldset class="controller">');
        htmlbuilder.push('<legend>Action Center</legend>');
        htmlbuilder.push('<span class="button" rel="#log">Logs</span>');
        htmlbuilder.push('<span class="button" rel="#toasts">Messages</span>');
        htmlbuilder.push('</fieldset>');
        htmlbuilder.push('<div id="log" class="tab"></div>');
        htmlbuilder.push('<div id="toasts" class="tab" style="display:none"></div>');

        element.innerHTML = htmlbuilder.join('\n');
        var fieldset_e = _SelectFirst("fieldset", element);
        fieldset_e.addEventListener("click", function (event: MouseEvent) {
            var target = <HTMLElement>event.target;
            if (target.tagName == "SPAN") {
                var tabs = _Select(".tab", element);
                tabs.forEach(function (tab) { _Hide(tab) });
                var tab = _SelectFirst(target.getAttribute("rel"), element);

                var links = _Select(".button", target.parentElement);
                links.forEach(function (link) { link.classList.remove("Selected") });
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




function AddImportToApplication(s: ImportScript)
{
    var existing = application.ImportScripts.FirstOrDefault(i => i.Name == s.Name);
    if (existing == null) {
        application.ImportScripts.push(s);
    }
}
function AddControllerToApplication(app: Application, controller: ModelController) {
    controller.Container = app.GetContainer;
    var exisingcontroller = application.GetController(controller.ModelName);
    if (exisingcontroller == null) {
        //console.log("  >adding controller " + Format("{0}.{1}", controller.NS, controller.ModelName));
        app.Controllers.push(controller);

    } else
    {
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




