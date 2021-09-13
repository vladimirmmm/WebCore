declare module WebCore {
    interface AppScript {
        script: string;
        children?: AppScript[];
    }
    export interface ViewLayout {
        Dictionary: object;
        Templates: object;
        load: Function;
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
        PageSize: number;
        CustomFiles: string[];
        Imports: string[];
        Scripts: AppScript[];
        Views: string[];
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
        static RunTest(test: string): Promise<any>;
        static Container(): Element;
        static GetParameter: any;
        static SetParameter: any;
        static httpClient: HttpClient;
        static Layouts: ViewLayout;
        static Settings: AppSettings;
        static LoadContent(element: Element): void;
        static NotificationManager: NotificationManager;
        static ClientValidation: boolean;
        static DataLayer: AppDataLayer;
        static IsInDebugMode(): boolean;
        static IsAdmin(): boolean;
        static GetView(...args: any[]): View;
        static GetController(...args: any[]): ModelController;
        static LayoutFor(...args: any[]): Layout;
        static HandleAuthenticationResult(...args: any[]): any;
        static Commands: AppUICommand[];
        static SaveSettings(): void;
        static GetR: AppDataLayer;
        static GetData(query: ClientQuery, onsuccess: Action<AppResponse>, onerror: Action<AppResponse>): void;
        static GetRouteProperties: any;
        static GetDataAsync(query: ClientQuery): Promise<void>;
        static GetMultiData(queries: ClientQuery[], onsuccess: Action<AppResponse>, onerror: Action<AppResponse>): void;
        static GetMutiDataAsync(queries: ClientQuery[]): Promise<void>;
        static ExecuteCommands(commands: any[], onsuccess: Action<AppResponse>, onerror: Action<AppResponse>): void;
        static ExecuteCommandsAsyc(commands: any[]): Promise<void>;
    }
    export interface AppResponse {
        Model: any[];
        Errors: any[];
        ViewData: object;
    }
    export class AppUICommand {
        Key: string;
        CssClass: string;
        Url: (model: any, view?: View, command?: AppUICommand) => string;
        IsInContext: (model: any, view?: View) => boolean;
        OnClick: (model: any, view?: View, command?: AppUICommand) => string;
        Prefix: string;
        Action: string;
        AppearsIn: string[];
        Label: string;
        Source: any;
        Html: string;
        Render(model: any, control?: any): string;
        static GetFunctions(condition: string): any[];
        static CreateFrom(obj: object): AppUICommand;
        static Create(condition: string, appearsin: string[], key: string, action: string, classprefix?: string): AppUICommand;
        static CreateFromHtml(key: string, Render: Function, isincontext?: Function): AppUICommand;
    }
    export class ImportScript {
        Id: string;
        Name: string;
        Description: string;
        DetailsUrl: string;
        ViewUrl: string;
        TypeName: string;
        CallBack_LookupData: Function;
        CallBack_DataReady: Function;
        Load(formdata: FormData, extension: string): void;
        SaveAll(view: View): void;
    }
    export class AppEvents {
        static readonly Create: string;
        static readonly Update: string;
        static readonly Delete: string;
        static readonly Info: string;
    }
    export class AppEvent {
        Name: string;
        TypeName?: string;
        Data?: any;
        Source?: any;
        static Create(name: string, typename?: string, data?: any): AppEvent;
    }
    export interface Observer {
        Notify(event: AppEvent, source?: Observer): Promise<any>;
    }
    export class NotificationManager implements Observer {
        private ObserversOfEvent;
        Notify(event: AppEvent, source?: Observer): Promise<void>;
        Subscribe(observer: Observer, events?: string[], typenames?: string[]): void;
        Unsubscribe(observer: Observer): void;
    }
    export class AppDataLayer {
        static Queries: any;
        static Instance: AppDataLayer;
        static Data: any;
        static Link(): void;
        static GetQueryForAutoComplete(queryname: string): ClientQuery;
        static GetDataDetails(query: ClientQuery, id: string, callback: Function): void;
        static Lookup(queryname: string, lookupfields: string[], valuefieldname: string, displayfieldname: string): Function;
        static DataLookupByQuery(value: string, query: ClientQuery, lookupfields: string[], callback: Function): void;
        static DataLookup(value: string, queryname: string, lookupfields: string[], valuefieldname: string, displayfieldname: string, callback: Function): void;
        static GetQueryByName(name: string): ClientQuery;
        static CreateListQuery(meta: EntityMeta): ClientQuery;
        static CreateListQueryByName(queryname: string, fields?: string[]): ClientQuery;
        static CreateDetailsQueryByName(queryname: string, Id: any): ClientQuery;
        static GetData(query: ClientQuery, onsuccess: Function, onerror: Function): void;
        static GetMultiData(queries: ClientQuery[], onsuccess: Function, onerror: Function): void;
    }
    export interface NavigationItem {
        Key: string;
        Name: string;
        Content?: string;
        ContentURL?: string;
        ParentKey?: string;
        Parameters?: Object;
        Children?: NavigationItem[];
        Url?: string;
    }
    export interface IParameterDictionary extends IDictionary<string> {
        page?: any;
        type?: any;
        id?: any;
        orderby?: any;
    }
    export class SearchParameters implements Object {
        page?: any;
        type?: any;
        id?: any;
        orderby?: any;
        initiator?: any;
        static Ensure(obj: Object, paramdictionary?: IParameterDictionary): SearchParameters;
    }
    export class View {
        Name: string;
        LayoutPath: string;
        LayoutPaths: string[];
        Templates: DictionaryOf<IViewTemplate>;
        Commands: DictionaryOf<AppUICommand>;
        CopyTemplates(): DictionaryOf<IViewTemplate>;
        Close(): boolean;
        NotifyApplication(event: AppEvent): void;
        AddTemplate(extension: string, template: IViewTemplate): void;
        GetTemplate(extension: string): IViewTemplate;
        Bind(itemorselector: any, model: any, context?: any, poptions?: BindOptions): void;
        static GetView<T>(me: T, element?: any): T;
        parameterstr: string;
        GetParameterDictionary(p?: any): IParameterDictionary;
        Area: string;
        UIElement: Element;
        OriginalTemplateHtml: string;
        TemplateHtml: string;
        RazorTemplate: RazorTemplate;
        ViewBag: DictionaryOf<Object>;
        Controller: ModelController;
        _IsDirty: boolean;
        get IsDirty(): boolean;
        IsChanging: boolean;
        set IsDirty(val: boolean);
        IsMultiInstance: boolean;
        LogicalModelName: string;
        GetViewInstance(): ViewInstance;
        SelectFirst(selector: string): Element;
        Identifier(): string;
        IsList(): boolean;
        FormatIdentifier(p: any, area?: string): string;
        Title(): string;
        constructor(Name: string, controller?: ModelController);
        Copy(): View;
        Action(p: Object): void;
        BeforeBind(): void;
        Ready(): void;
        AfterBind(navigate?: boolean): void;
        Changed(ev: Event): void;
        BeforePrint(printarea: Element): void;
        AfterPrint(printarea: Element, event: Event): void;
        PageSize(): number;
        SavePageSize(pagesize: number): void;
    }
    export class Layout {
        Name: string;
        Fields: any;
        Inherit: string;
        AppliesTo: string[];
        DependentValues: string[];
        DependsOnProperty: string;
        static GetGroup(item: any): {
            Key: string;
            Fields: any[];
        };
        static Find(fields: any, fieldname: any, parent?: any): void;
        static GetFields(fields: any[], parentkey?: string, recursive?: boolean): any[];
        static GetLayoutField(field: string): LayoutField;
        static FindContainer(source: any, key: string): any;
        static Merge(from: Layout, to: Layout): void;
    }
    export class ControllerLayout {
        General: Layout;
        Dependent: DictionaryOf<Layout>;
    }
    export class LayoutField {
        Remove?: boolean;
        Key: string;
        Path: string;
        Scope: string;
    }
    export class ViewModel<T> extends View {
        Model: T;
        GetLayout(): Layout;
        constructor(Name: string, controller?: ModelController);
        RegisterMe(): void;
        RegisterCommand(command: AppUICommand): void;
        Copy(): ViewModel<T>;
        AfterBind(navigate?: boolean): void;
        GetCommandbarHtml(model: any): string;
        GetCommandbarContentHtml(model?: any): string;
        DownloadModel(): void;
        DefaultValidationUserResponse: boolean;
        ShowValidationResults(results: ValidationRuleResult[], item: T): Promise<boolean>;
        HideValidationResults(): void;
    }
    export class SaveViewModel<T> extends ViewModel<T> {
        constructor(Name: string, controller?: ModelController);
        ControlFor(model: any, key: string, scope?: string): string;
        SaveDraft(): void;
        LoadDraft(ondataload?: Function): void;
        ClearDraft(): void;
        Test(scenario: string, context?: object): void;
        Hide(selector: string): void;
        ShowTestScenario(): void;
        UpdateTemplate: object;
        BeforeSave(model: any, updatemodel?: any, clearmodel?: any): boolean;
        OnModelEvent(eventname: string, model: any, context?: any): Promise<void>;
        SavePost(element?: Element): Promise<any>;
    }
    export class CreateViewModel<T> extends SaveViewModel<T> {
        constructor(Name: string, controller?: ModelController);
    }
    export class ListViewModel<T> extends ViewModel<T> {
        private _FilterUIElement;
        FilterQuery: QueryView;
        UrlQuery: QueryView;
        CustomQuery: QueryView;
        CurrentQuery: QueryView;
        QueryView: QueryView;
        OriginalQueryView: QueryView;
        private _Query;
        private _OriginalQuery;
        get Query(): ClientQuery;
        set Query(query: ClientQuery);
        IsList(): boolean;
        get FilterUIElement(): Element;
        set FilterUIElement(value: Element);
        constructor(Name: string, controller?: ModelController);
        AfterBind(navigate?: boolean): void;
        Search(parameters?: SearchParameters): void;
        EditQuery(): void;
        ClearQuery(): void;
    }
    export class ViewInstance {
        Id: string;
        Title: string;
        Url: string;
        ViewModel: View;
        Parameters: Object;
        LogicalModelName: string;
        UIElement: Element;
    }
    export class ViewLayout {
        FullPath: string;
        Name: string;
        Extension: string;
        Area: string;
        Discriminator: string;
        IsCustomisation: boolean;
    }
    export class ModelController {
        ModelName: string;
        NS: string;
        Container: () => Element;
        Views: View[];
        private _ViewDictionary;
        Instances: DictionaryOf<ViewInstance>;
        ModelEventHandler: DictionaryOf<Function>;
        AddView(view: View): void;
        get ViewDictionary(): DictionaryOf<View>;
        RegisterActions(): void;
        Navigate(p: Object): void;
        EnsureCommandBar(vm: View): void;
        ShowView(vm: View): void;
        PrepareView(vm: View, p?: any): void;
        SetViewUIElement(vm: View, viewinstanceid?: string): void;
        Load(vm: View, p: Object, modeltypename: string, area: string, readycallback: Function): View;
        Download(name: string, waiter: Waiter): void;
        Open(vm: View, p: Object, modeltypename: string, area: string, readycallback: Function): View;
        GetViewInstanceId(vm: View, p: Object, logicalmodelname: string, area: string): string;
        CreateViewInstance(vm: View, logicalmodelname: string, p: Object, id: string, area?: string): ViewInstance;
        AddViewInstance(vi: ViewInstance, onclose: Function): void;
        SetUIViewInstance(vi: ViewInstance): void;
        private ViewIconDictionary;
        private _ActionsHtml;
        private Features;
        GetModelFeatures(): ModelFeatures;
        Commands: DictionaryOf<AppUICommand>;
        RegisterCommand(command: AppUICommand): void;
        UnRegisterCommand(key: string): void;
        GetControllerSpecificActions(model: object): AppUICommand[];
        TransformActionHtml(action: string, model: object, html: string, area: string): string;
        DefaultListAction(): string;
        DefaultUrl(id: string): string;
    }
    export class HttpClient {
        EntryPointBase: string;
        private token;
        DefaultHeaders: {};
        OnResponse: Function;
        OnRequest: Function;
        private cancelfunction;
        OnError(xhttp: XMLHttpRequest, errorhandler: Function): void;
        GetUrl(url: string): string;
        private setHeaders;
        Get(url: string, header: object, onSuccess: Function, onError?: Function): XMLHttpRequest;
        RawGet(url: string, header: object, onSuccess: Function, onError?: Function): XMLHttpRequest;
        Decompress(data: any): any;
        GetMultiData(queries: ClientQuery[], onSuccess: Function, onError?: Function, cachemaxage?: number): XMLHttpRequest;
        GetData(query: ClientQuery, onSuccess: Function, onError?: Function, cachemaxage?: number): XMLHttpRequest;
        Post(url: string, data: any, onSuccess: Function, onError?: Function, contenttype?: string, marker?: string, headers?: any): XMLHttpRequest;
        ExecuteApi(url: string, method: string, data: any, onSuccess: Function, onError?: Function, contenttype?: string, marker?: string): XMLHttpRequest;
        PostOld(url: string, data: any, onSuccess: Function, onError?: Function, contenttype?: string, headers?: object): XMLHttpRequest;
        RawPost(url: string, data: any, onSuccess: Function, onError?: Function, contenttype?: string, headers?: object): XMLHttpRequest;
        Put(url: string, data: any, onSuccess: Function, onError?: Function, contenttype?: string, marker?: string): XMLHttpRequest;
        Authenticate_PartnerAPI(success: Function, failure: Function): void;
        Authenticate(success: Function, failure: Function): void;
        UploadFiles(files: object[], targetfolder: string, onSuccess: Function, onError?: Function): XMLHttpRequest;
    }
    export class Permission {
        Id: number;
        PermissionReferenceTypeId: number;
        PermissionReferenceId: number;
        PermissionTypeId: number;
        Comment: string;
        Parameters: string;
        PermissionType: PermissionType;
        PermissionReference: any;
        PermissionReferenceType: PermissionReferenceType;
    }
    export class PermissionAction {
        Id: number;
        Comment: string;
        Name: string;
    }
    export class PermissionReferenceType {
        Id: number;
        Comment: string;
        Name: string;
    }
    export class PermissionType {
        Id: number;
        Comment: string;
        Controllname: string;
        Viewname: string;
        ActionId: number;
        Action: PermissionAction;
    }
    export {};
}
declare function modelobj(element: Element): object;
declare function view(element: Element): WebCore.View;
declare function controller(element: Element): WebCore.ModelController;
declare module WebCore {
    interface RouteProperties {
        area: string;
        controller: string;
        view: string;
        parameters: string;
    }
    export function OnAuthenticated(result: any): void;
    class ResourceContainer implements Dictionary {
        Cultures: {};
        Load(culture: string, obj: Dictionary, key: string): void;
    }
    export interface IQueryAction {
        query: ClientQuery;
        onready: Function;
    }
    export class Application {
        NotificationManager: NotificationManager;
        Resources: ResourceContainer;
        UILayout: DictionaryOf<ControllerLayout>;
        UIDomainLayout: DictionaryOf<ControllerLayout>;
        data: Object;
        private _Container;
        private _ScriptsReady;
        private _scriptwaiter;
        private get scriptwaiter();
        OfflieData: {
            Flag: string;
            Dictionarys: string[];
        }[];
        Commands: DictionaryOf<AppUICommand>;
        StaticDataQueryActions: DictionaryOf<IQueryAction>;
        DataLayers: any[];
        RegisterCommand(command: AppUICommand): void;
        UnRegisterCommand(key: string): void;
        PermissionActions: PermissionAction[];
        ScriptsReady(): void;
        IsInDebugMode(): boolean;
        IsInOfflineMode(): boolean;
        IsAdmin(): boolean;
        get Container(): Element;
        constructor();
        get AppName(): string;
        ImportScripts: ImportScript[];
        Controllers: ModelController[];
        Waiter: Waiter;
        httpClient: HttpClient;
        localhttpClient: HttpClient;
        Menu: NavigationItem;
        ReloadSettings(): void;
        menuElement(): Element;
        LoadContent(item: Element): void;
        DataPipe(data: any, v: View): void;
        Delete(element: Element, args?: any): void;
        GetContainer(): Element;
        GetController(name: string): ModelController;
        HandleAuthenticationResult(r: AppResponse): void;
        Authenticate(callback?: Function): void;
        Navigate(source: Element, args: any): void;
        private onGoingNavigation;
        NavigateUrl(url: string, changehash?: boolean): Promise<View>;
        NavigateTo(controller: string, view: string, p: any, area?: string): Promise<View>;
        CheckPermission(controller: string, view: string, p: any, area: string): boolean;
        GetView(controllername: string, viewname: string, viewid?: string): View;
        GetRouteProperties(url?: string): RouteProperties;
        LoadX(): void;
        Load(): void;
        LayoutFor(typename: string, model?: any, viewname?: string): Layout;
        private _storename;
        private _Settings;
        get Settings(): AppSettings;
        SaveSettings(settings?: AppSettings): void;
        private NavigationItems;
        Tests: DictionaryOf<string>;
        Layouts: {
            Dictionary: {};
            Templates: {};
            load: () => void;
        };
        LoadLayouts(): void;
        SetCulture(culture: string): void;
        LoadResources(callback: Function): void;
        RunTests(): Promise<void>;
        LoadData(company: object, finalCallback?: Function): void;
        LoadMenu(menuelement?: Element): void;
        LoadUI(): void;
        ClearFloats(except?: Element): void;
        ToggleFloat(selector: string, ev: MouseEvent): void;
        CloseHovering(element: Element, path?: Element[]): void;
        UIClick(e: MouseEvent): void;
        CurrentView(): View;
        private _idb;
        SaveToClient(data: any, storename: string, callback: Function, clearDB?: boolean): void;
        GetFromClient<T>(storename: string, callback: Action<T[]>, filter?: Func1<T, boolean>): void;
        DeleteFromClient<T>(storename: string, callback: Action<T[]>, filter?: Func1<T, boolean>): void;
        RefreshStaticData(callback: Function, finalCallback?: Function): void;
        Refresh: any;
    }
    export {};
}
declare var application: webcore.Application;
declare function AddImportToApplication(s: WebCore.ImportScript): void;
declare function AddControllerToApplication(app: WebCore.Application, controller: WebCore.ModelController): void;
declare var tinymce: any;
import webcore = WebCore;
declare module Common.Article {
    import View = webcore.View;
    import ModelController = webcore.ModelController;
    import ViewModel = webcore.ViewModel;
    import AppUICommand = webcore.AppUICommand;
    import SearchParameters = webcore.SearchParameters;
    class List extends WebCore.ListViewModel<ErpApp.Model.Article[]> {
        Identifier(): string;
        Title(): string;
        FormatIdentifier(p: any, area?: string): string;
        constructor(controller: WebCore.ModelController);
        Action(p: Object): void;
        Search(parameters?: SearchParameters): void;
    }
    class Details extends ViewModel<ErpApp.Model.Article> {
        Identifier(): string;
        Title(): string;
        constructor(controller: ModelController);
        Action(p: Object): void;
    }
    class Save extends ViewModel<ErpApp.Model.Article> {
        private Files;
        constructor(controller: ModelController);
        Identifier(): string;
        private _Title;
        Title(): string;
        Action(p: any): void;
        HandleUploadedFiles(element: Element): void;
        SavePost(element: Element): void;
        AddCategory(): void;
    }
    class Controller extends ModelController {
        constructor();
        GetControllerSpecificActions(model: ErpApp.Model.Article): AppUICommand[];
        Delete(uielement: Element, id: any): void;
        TransformActionHtml(action: string, model: ErpApp.Model.Article, html: string, area: string): string;
        PrepareView(vm: View, p?: any): void;
    }
}
declare var JsBarcode: Function;
declare module WebCore {
    module BaseModel {
        function GetDbCommandForObject(obj: any, commandname: any, keys?: string, excludes?: string[]): any;
        function GetUpdateCommand(obj: any, typename: any, commandname: any, keys?: string, excludes?: string[]): {};
        function GetDeleteCommand(typename: any, id: any): {};
        function FIxUpdateObj(obj: any): void;
        function SaveCompanyAddress(element: Element): void;
        class Dependencies {
            static Container(): Element;
            static httpClient: HttpClient;
            static LoadContent(element: Element): void;
            static ClientValidation: boolean;
            static DataLayer: AppDataLayer;
        }
        class List extends ListViewModel<any[]> {
            Identifier(): string;
            Title(): string;
            FormatIdentifier(p: Object): string;
            constructor(controller: ModelController);
            Switch(): void;
            Action(p: Object): void;
            Search(parameters?: SearchParameters): void;
        }
        class Details extends ViewModel<any> {
            constructor(controller: ModelController);
            Identifier(): string;
            Title(): string;
            Action(p: Object): void;
        }
        class Controller extends ModelController {
            constructor();
            PrepareView(vm: View): void;
            Load(vm: View, p: Object, modeltypename: string, area: string): View;
            IsAvailable(logicalmodelname: string): boolean;
        }
    }
}
declare var tinymce: any;
declare module Common.Contact {
    import ModelController = webcore.ModelController;
    import ViewModel = webcore.ViewModel;
    class MessageCollection {
        Incoming: ErpApp.Model.AppMessage[];
        Outgoing: ErpApp.Model.AppMessage[];
        get All(): ErpApp.Model.AppMessage[];
    }
    class Details extends ViewModel<MessageCollection> {
        Identifier(): string;
        Title(): string;
        FormatIdentifier(p: Object): string;
        constructor(controller: ModelController);
        Action(p: Object): void;
        DF_Companies(txt: string, callback: Function): void;
        Search(tag?: string): void;
        LoadList(query: ClientQuery, selector: string, setmodel: Function, page?: number): void;
        CloseElement(element: Element): void;
        NewMessage(msg: ErpApp.Model.AppMessage): void;
        ViewMessage(id: any): void;
        ReplyTo(id: any): void;
        SendMessage(): void;
    }
    class Feedback extends ViewModel<any> {
        Identifier(): string;
        Title(): string;
        FormatIdentifier(p: Object): string;
        constructor(controller: ModelController);
        Action(p: Object): void;
        SavePost(): void;
        SendMessage(): void;
    }
    class Controller extends ModelController {
        constructor();
    }
}
declare module WebCore {
    export class Controls {
        static DateFormat: string;
    }
    class Diff {
        Property: string;
        Val1: any;
        Val2: any;
        Ref1: any;
        Ref2: any;
        Children: Diff[];
    }
    class DiffOptions {
        keeporderontarget?: boolean;
        excludedelements?: Element[];
        excludednodes?: Node[];
        excludedselectors?: string[];
    }
    export class DomDiff {
        static InComparableSelectors: string[];
        static Test(): void;
        Difflist: Diff[];
        static CompareElements(element1: Node, element2: Node, options: DiffOptions): Diff[];
        static GetPropertyDiff(element1: Node, element2: Node, properties: string[]): Diff[];
        GetTagDiff(element1: Node, element2: Node): Diff;
        static GetAttributeDiff(element1: Node, element2: Node): Diff[];
        private static Attributes;
        private static Attribute;
        static Map(target: Node, source: Node, poptions?: DiffOptions): void;
        static LogNodeOperation(op: string, node: Node): void;
        static MapDiff(difference: Diff, parent?: Diff): void;
    }
    export function TreeMenu(target: Element, obj: any): string;
    class App_FileUploader extends HTMLElement {
        private uploadelement;
        private button;
        private _responsetype;
        get responsetype(): string;
        set responsetype(val: string);
        private _accept;
        get accept(): string;
        set accept(val: string);
        private _size;
        get size(): number;
        set size(val: number);
        private _title;
        get title(): string;
        set title(val: string);
        get Files(): any[];
        constructor();
        connectedCallback(): void;
        private OnChange;
    }
    export class App_QueryEditor extends HTMLElement {
        private QueryTemplate;
        private Query;
        private VisibleFields;
        get roottype(): string;
        set roottype(val: string);
        constructor();
        private StopChangeEvent;
        private StopEnter;
        connectedCallback(): void;
        private Load;
        SetFilterField(source: Element, event: MouseEvent): void;
        SetQuery(query: QueryView): void;
        GetQuery(): QueryView;
        OnControlClicked(command: string): void;
        RemoveFilter(element: Element, key: string): void;
        EditFilter(key: string): void;
        Execute(query: QueryView): void;
        private CorrectFilters;
        QueryViewLoaded(element: App_FileUploader): void;
        SaveQueryView(): void;
    }
    export class App_FilterEditor extends HTMLElement {
        private _filter;
        private Template;
        get roottype(): string;
        set roottype(val: string);
        constructor();
        connectedCallback(): void;
        private Load;
        Create(filter: IClientFilter): void;
        LoadFromSource(): void;
        AddChild(element: this): void;
        AddOrFilter(): void;
        AddAndFilter(): void;
        SetFilterCreation(c: string): void;
        FieldSelected(control: Element, fieldpath: string): void;
        static GetFilterEditorHtml(filter: IClientFilter): string;
    }
    export class App_ProgressButton extends HTMLElement {
        private _value;
        get value(): string;
        set value(val: string);
        connectedCallback(): void;
    }
    export class App_ProgressBar extends HTMLElement {
        private _value;
        get value(): string;
        set value(val: string);
        private AddStyleSheet;
        process(width: any): void;
        connectedCallback(): void;
    }
    export class App_Tabs extends HTMLElement {
        connectedCallback(): void;
        private Activate;
    }
    export class App_MetaBrowser extends HTMLElement {
        private _value;
        private _valueMeta;
        private _path;
        private _roottype;
        private _select;
        private _pathcontainer;
        constructor();
        get bind(): string;
        set bind(val: string);
        get value(): string;
        set value(val: string);
        get valueMeta(): any;
        set valueMeta(val: any);
        get roottype(): string;
        set roottype(val: string);
        connectedCallback(): void;
        private CreatePathAnchor;
        LoadPath(path: string): void;
    }
    export class App_Validation extends HTMLElement {
        private _Template;
        private get Template();
        private _TypeName;
        get TypeName(): string;
        set TypeName(value: string);
        constructor();
        connectedCallback(): void;
        private callback;
        Load<T>(result: ValidationRuleResult[], callback?: Function): void;
        Confirm(): void;
        Close(): void;
    }
    export class App_RadioList extends HTMLElement {
        private _value;
        constructor();
        connectedCallback(): void;
        get bind(): string;
        set bind(val: string);
        get name(): string;
        set name(val: string);
        get value(): string;
        set value(val: string);
    }
    export class App_DictionaryEditor extends HTMLElement {
        attributeChangedCallback(attrName: any, oldValue: any, newValue: any): void;
        private dictionary;
        private container;
        private textarea;
        constructor();
        connectedCallback(): void;
        private EnsureNewItem;
        private Save;
        static GetResourceDictionary(content: string): object;
        private Load;
        private LoadUI;
        disconnectedCallback(): void;
        get bind(): string;
        set bind(val: string);
        get value(): string;
        set value(val: string);
    }
    export class AutoCompleteOption {
        clearinput: string;
        targetquery: string;
        selectormode: string;
        valueelementquery: string;
        displayelementquery: string;
        inputelementquery: string;
        datafunction: string;
        onselected: string;
        ondatareceived: string;
        valuefield: string;
        displayfield: string;
        level: string;
        value: string;
        label: string;
        bind: string;
        uidatatype: UIDataType;
        resultlimit: number;
        minlengthtosearch: number;
        multiselect: boolean;
        keycodetoselectfirst: number;
        cssclass: string;
    }
    export class App_AutoComplete extends HTMLElement {
        options: AutoCompleteOption;
        private _input;
        private c_value;
        private c_display;
        ShowDisplaynameInTextInput: boolean;
        nextFocus: number;
        private _value;
        protected _readonly: string;
        private lasttimestemp;
        nextFocusValue(): void;
        get displayText(): string;
        get value(): string;
        set value(val: string);
        get readonly(): string;
        set readonly(val: string);
        static get observedAttributes(): string[];
        constructor();
        attributeChangedCallback(attrName: any, oldValue: any, newValue: any): void;
        GetDataItemDisplayText(item: object): string;
        GetDataItemValue(item: any): any;
        private SetValueOfControl;
        focus(): void;
        private listdata;
        private X_OnSelected;
        private X_OnDataRecieved;
        OnSelected(container: Element, dataitem: any): void;
        private DataFunction;
        SetDataFunction(datafunction: Function): void;
        SetOnSelect(func: Function): void;
        private OnDataRecieved;
        connectedCallback(): void;
        disconnectedCallback(): void;
        private c_list;
        private c_input;
        private c_container;
        selectcurrent(clearinput?: boolean, forceupdate?: boolean): void;
        Search(): void;
        Clear(triggerchange?: boolean, forceupdate?: boolean): void;
        GetValue(): string;
        SetInput(txt: string): void;
        SetValue(value: any, displaytext: any, setBoth?: boolean): void;
        SelectValueByText(text: string): Promise<any>;
    }
    export class App_ObjectPicker extends App_AutoComplete {
        private _tagsnode;
        private _hinput;
        private _uitype;
        get uitype(): UIDataType;
        set uitype(val: UIDataType);
        GetTagText(data: any): any;
        GetTagValue(data: any): any;
        GetTagTextByTagValue(value: any): string;
        OnSelected(container: Element, dataitem: any, forceupdate?: boolean): void;
        constructor();
        GetValue(): string;
        Remove(value: string, forceupdate?: boolean): void;
        AddTag: (id: any, name: any) => boolean;
        Clear(forceupdate?: boolean): void;
        SetValue(value: any, displaytext: any, setBoth?: boolean): void;
        connectedCallback(): void;
    }
    export function LogToast(verb: string, stitle: string, smessage?: string): void;
    export function Toast_Error(stitle: string, smessage?: string, sdata?: string, timeout?: number): void;
    export function Toast_Notification(stitle: string, smessage?: string, timeout?: number): void;
    export function Toast_Warning(stitle: string, smessage?: string, sdata?: string, timeout?: number): void;
    export function Toast_Success(stitle: string, smessage?: string, timeout?: number): void;
    export function Toast_Question(stitle: string, smessage?: string, timeout?: number, onYes?: Function, onNo?: Function): void;
    export function Toast_Alert(stitle: string, smessage?: string, timeout?: number, onOk?: Function): void;
    export class ToastBuilder {
        private _message;
        private _title;
        private _data;
        private _timeout;
        private _onYes;
        private _onNo;
        private _onOk;
        constructor();
        static Toast(): ToastBuilder;
        message(msg: string): ToastBuilder;
        resmessage(msgRes: string, ...any: any[]): ToastBuilder;
        title(title: string): ToastBuilder;
        restitle(titleRes: string, ...any: any[]): ToastBuilder;
        data(data: string): ToastBuilder;
        timeout(timeout: number): ToastBuilder;
        onYes(func: Function): ToastBuilder;
        onNo(func: Function): ToastBuilder;
        onOk(func: Function): ToastBuilder;
        Error(): void;
        Notification(): void;
        Warning(): void;
        Success(): void;
        Question(): void;
        Alert(): void;
    }
    export {};
}
declare function GetMinMaxDate(inputhtml: string): string;
declare function SetMinDate(source: HTMLInputElement, target: HTMLInputElement): void;
declare function SetMaxDate(source: HTMLInputElement, target: HTMLInputElement): void;
declare function CreatePager(container: Element, options: Object): void;
declare function SetFloatLayout(element: HTMLElement): void;
declare function ToggleFloatBox(element: HTMLElement, setheight?: boolean): void;
declare function FloatList(listdata: [], fields: []): string;
declare function CellDetails(html: any, setheight?: boolean): string;
declare function ClearFilter(viewelement: Element): void;
declare function LoadBarcodes(): void;
declare function GetFiltersFromUI(filtercontainer: Element): IClientFilter[];
declare function resizableGrid(tbl: any, headonly?: boolean): void;
declare function EnforceMinMax(el: Element): boolean;
declare function ResizeImages(file: any, maxsize: number, callback: Function): void;
declare module ErpApp.Model {
    class AppMessage {
        Id: number;
        CreatedOn: Date;
        CreatedByUserId: string;
        TargetUserId: string;
        Subject: string;
        Content: string;
        FromName: string;
        ToName: string;
        ParentId: number;
        IsReadByTarget: number;
        TypeName: string;
    }
    class BaseArticle {
        Id: string;
        Title: string;
        Content: string;
        ImageUrl: string;
        TypeName: string;
        Category: Category;
    }
    class Article extends BaseArticle {
        Description: string;
        Created: Date;
        CategoryId: number;
        CreatedByUserId: number;
        Domain: string;
        Url: string;
        TypeName: string;
        Files: FileObject[];
    }
    class Category {
        Id: string;
        Title: string;
        Code: string;
        ParentId: number;
        TypeName: string;
    }
}
declare module Settings {
    import ModelController = webcore.ModelController;
    import ViewModel = webcore.ViewModel;
    class List extends ViewModel<object> {
        Identifier(): string;
        Title(): string;
        constructor(controller: ModelController);
        Action(p: Object): void;
        Refresh(key: string, callback?: Function): void;
        SetLanguage(): void;
        ShowSettings(): void;
        GetDbLayout(): void;
        GetResourceCsv(): void;
        ShowMissingResources(): void;
        ExecuteSQL(element: Element): void;
        ExecuteApi(element: Element): void;
        ExecuteTest(element: Element): Promise<void>;
        setSettingsParam(key: string, value: boolean | number | string): void;
        SyncUp(isPartialSyncup?: boolean): void;
        SyncDown(callback?: Function): void;
        private AddSync;
        UseOffline(checked: boolean): void;
        private setCookie;
        getCookie(cname: any): string;
    }
    class Login extends ViewModel<object> {
        private returnurl;
        Identifier(): string;
        Title(): string;
        FormatIdentifier(p: Object): string;
        constructor(controller: ModelController);
        Action(p: Object): void;
        EmptyFields(): void;
        Login(): void;
        ShowSplashScreen(): void;
        SetLanguage(): void;
    }
    class Controller extends ModelController {
        constructor();
    }
}
declare class ValidationFuntionContainer {
    Required: (item: any) => boolean;
    Regex: (item: any, regex: any) => boolean;
    Number: (item: any, regex: any) => boolean;
    Functions(): Function[];
    constructor();
}
interface QueryLookupOptions {
    QueryName?: string;
    LookupFields?: string[];
    ValueField?: string;
    DisplayField?: string;
}
declare class HtmlHelpers {
    view: any;
    static dataentrypoint: string;
    static DateFormat: string;
    static DateTimeFormat: string;
    static DecimalFormat: string;
    static MonetaryFormat: string;
    static ResNvl: Function;
    static GetMinMaxDate: Function;
    Res(Key: string): string;
    ModelRes(Key: string): string;
    Encode(txt: string): string;
    Url(url: string): string;
    Link(url: string, title: string): string;
    Image(url: string, format: string): string;
    GetInputsFor(field: string, type: string, items: [], values?: [], source?: []): string;
    FilterFor(key: string, typename?: string): string;
    GetFilter(options: IUIFilterOptions): string;
    FieldFor(expression: string, hideifempty?: boolean): string;
    LabelFor(model: object, expression: Function, UIType: string, attributes: Object): string;
    ValueFor(model: any, meta: ObjectMeta, parent?: any): string;
    Value(model: any, key: string): string;
    ControlFor(model: any, key: string, scope?: string, accessorprefix?: string): string;
    labelFor(model: any, expression: Function, attributes: Object): string;
    GetLabel(key: string, attributes?: Object): string;
    GetLabelText(key: string): string;
    Text(key: string): string;
    LabelText(model: any, key: string): string;
    Label(model: any, key: string, attributes?: Object): string;
    ObjectPickerFor(model: any, expression: Function, labelexpression: Function, options: QueryLookupOptions, attributes: Object): string;
    AutoCompleteFor(model: any, expression: Function, accessorprefix: string, options: QueryLookupOptions, attributes: Object): string;
    InputFor(model: any, expression: Function, attributes: Object): string;
    TextAreaFor(model: any, expression: Function, attributes: Object): string;
    BoundInput(model: any, key: string, attributes?: any): string;
    Input(model: any, key: string, attributes: Object): string;
    FormattedLabelFor(model: object, expression: Function, formatstring: string, attributes: Object): string;
}
interface IMeta {
    MetaKey: string;
    Label: string;
    UIType: string;
    SourceType: string;
    Validations: string[];
    Editor: string;
    Validate(item: any): ValidationResult[];
}
declare class ValidationResult {
    target: Object;
    ID: string;
    Message: string;
}
declare class ObjectMeta {
    MetaKey: string;
    UIType: string;
    SourceType: string;
    Validations: string[];
    Editor: string;
    Namespace: string;
    DefaultValue: any;
    get Label(): string;
    get IsObject(): boolean;
    get IsArray(): boolean;
    get typeArgument(): string;
    get JSType(): string;
    get InputType(): string;
    Validate(item: any): ValidationResult[];
}
declare class PropertyMeta extends ObjectMeta {
    ReferenceField: string;
    static GetMetaFrom(obj: Object): PropertyMeta;
}
declare class EntityMeta extends ObjectMeta {
    Fields: PropertyMeta[];
    Keys: string[];
    IsEqualByKeys(a: Object, b: Object): boolean;
    HasKey(a: Object): boolean;
    SetProperties(data: Object, recursive?: boolean, level?: number): void;
    static GetMetaFrom(obj: Object, metakey: string, ns?: string): EntityMeta;
}
declare class MetaModels {
    ns: string;
    Entities: EntityMeta[];
    Load(obj: Object): void;
    CreateEntity(typename: string): {
        TypeName: string;
    };
    GenerateTSInterface(typename: string): string;
}
declare var metaModels: MetaModels;
declare var FieldOperators: string[];
interface Field {
    Name: string;
}
interface IClientFilter {
    Field: string;
    FieldFormat?: string;
    Operator: string;
    Values: string[];
    Type: string;
    Children?: IClientFilter[];
    Value?: string;
    Source?: string;
    SourceExpression?: string;
}
interface IFilter {
    GetQuery(): IClientFilter[];
    Field: string;
}
declare class Filter {
    Field: string;
    Expression: string;
    Value: any;
}
declare enum UIDataType {
    Text = 1,
    Date = 2,
    Boolean = 3,
    Number = 4
}
interface IUIFilterOptions {
    Field: string;
    Type: UIDataType;
    Value?: string;
    Label?: string;
    LabelKey?: string;
    ModelContext?: string;
    QueryName?: string;
    LookupTargetField?: string;
    LookUpFields?: string[];
    LookupMode?: boolean;
    ValueField?: string;
    DisplayField?: string;
    Callback?: Function;
    ShowNullFilters?: boolean;
}
declare class UIFilterOptions implements IUIFilterOptions {
    Field: string;
    Type: UIDataType;
    Value: string;
    LabelKey: string;
    ModelContext: string;
    QueryName: string;
    LookupTargetField: string;
    LookUpFields: string[];
    LookupMode: boolean;
    ValueField: string;
    DisplayField: string;
    Callback?: Function;
    ShowNullFilters: boolean;
}
declare class UIFilter {
    Field: string;
    LookupTargetField: string;
    Value: string;
    LabelKey: string;
    DataType: UIDataType;
    LookUp: DataLookup;
    static GetNullFilterElements(items: any[], options: any): void;
    static Create(options: IUIFilterOptions): UIFilter;
    GetQuery(): IClientFilter[];
    static Test(): void;
}
/**
 * Factory class for creating filters for queries.
 * */
declare class ClientFilter implements IClientFilter {
    Field: string;
    FieldFormat?: string;
    static DateFormat: string;
    Operator: string;
    Values: string[];
    Type: string;
    Children?: ClientFilter[];
    Source?: string;
    /**
     * Creates a simple filter.
     *
     * @param type the type of the field
     * @param field the name of the field
     * @param operator the operator to be used
     * @param val the value to be tested
     *
     * @returns The filter without a list.
     */
    static CreateSimple(type: UIDataType, field: string, operator: string, val: any): IClientFilter;
    /**
     * Creates a filter.
     *
     * @param type the type of the field
     * @param field the name of the field
     * @param val the value to be tested
     *
     * @returns The filter in a list.
     */
    static Create(type: UIDataType, field: string, val: any): IClientFilter[];
    /**
     * Creates an OR filter (the parameters with default value does not seem to do anything).
     *
     * @param children the list of its children
     * @param fieldFormat formating function, defaults to "upper({0})"
     * @param type the type of the field, defaults to "Text"
     * @param field the name of the field, defaults to "Id"
     *
     * @returns The filter in a list or the original child in a list if there is only one child.
     */
    static CreateOr(children: IClientFilter[], fieldFormat?: string, type?: string, field?: string): IClientFilter[];
    /**
     * Creates an AND filter (the parameters with default value does not seem to do anything).
     *
     * @param children the list of its children
     * @param fieldFormat formating function, defaults to "upper({0})"
     * @param type the type of the field, defaults to "Text"
     * @param field the name of the field, defaults to "Id"
     *
     * @returns The filter in a list or the original child in a list if there is only one child.
     */
    static CreateAnd(children: IClientFilter[], fieldFormat?: string, type?: string, field?: string): IClientFilter[];
}
declare class NumberFilter extends Filter implements IFilter {
    TypeName: string;
    GetQuery(): IClientFilter[];
    Min: number;
    Max: number;
    List: number[];
    get Html(): string;
    static CreateListFilter(fieldname: string, items: number[]): NumberFilter;
}
declare class StringFilter extends Filter implements IFilter {
    TypeName: string;
    CaseSensitive: boolean;
    IsExact: boolean;
    List: string[];
    constructor(src?: string);
    GetQuery(): IClientFilter[];
    static CreateListFilter(fieldname: string, items: string[]): StringFilter;
}
declare class DateFilter extends Filter implements IFilter {
    TypeName: string;
    GetQuery(): IClientFilter[];
    Min: Date;
    Max: Date;
    List: Date[];
}
declare class ClientQueryGroup {
    By: string[];
    Aggregates: DictionaryOf<string>;
}
declare class ClientQuery {
    QueryName: string;
    Fields: Dictionary[];
    Filters: IClientFilter[];
    Ordering: Dictionary;
    Grouping: ClientQueryGroup;
    Parameters: Dictionary;
    Skip: number;
    Take: number;
    GetCount: boolean;
    SetCP: boolean;
    Distinct?: boolean;
    SetFields(fields: string[]): void;
    SetField(field: string): void;
    SetFilters(filters: IClientFilter[]): void;
    SetFilter(filter: IClientFilter): void;
    CreateFilters(field: string, value: any, type?: UIDataType): ClientFilter[];
    static New(obj: object): ClientQuery;
    static CreateFrom(query: ClientQuery): QueryView;
    static CreateDetails(queryname: string, id: any): ClientQuery;
    static CreateList(queryname: string, fields?: string[]): ClientQuery;
}
declare class QueryView extends ClientQuery {
    UIColumns?: string[];
}
declare class FileData {
    File: any;
    Filename: string;
    Type: any;
}
declare class List<T> extends Array<T> {
    Add(item: T): void;
    Remove(item: T): void;
    Clear(): void;
    AddRange(items: Array<T>): void;
    static From<T>(items: Array<T>): List<T>;
    OnChanged: Function;
}
declare class ValidationRuleResult {
    Rule?: ValidationRule<any>;
    RuleIdentifier?: string;
    DataIdentifier?: string;
    Message: string;
    Messages: string[];
    OK: boolean;
    constructor(result?: boolean, msg?: string);
}
declare class ValidationRule<T> {
    Identifier?: string;
    Func: Func1<T, ValidationRuleResult>;
    DataFunc?: Func1<T, string>;
    Trigger?: string[];
    MessageTemplate?: string;
}
declare class Formula<T> {
    Identifier?: string;
    Func: Func1<T, any>;
    Trigger?: string[];
    Dependencies?: string[];
}
declare class Task {
    Id: string;
    Promise: Promise<any>;
    Function: Action2<Task, Function>;
    OnCompleted: Function;
    Started: Date;
    Finished: Date;
    Info: any;
}
declare class TaskExecutor {
    private threadnr;
    Id: string;
    OnCompleted(): void;
    Tasks: Task[];
    constructor(threadnr?: number);
    TaskFinished(task: Task): void;
    Start(): void;
    private GetNextTask;
    StartATask(): void;
}
declare class FileObject {
    FullName: string;
    Url: string;
    Content: any;
}
declare class Obsv {
    constructor(...params: any[]);
}
declare class IDB {
    private db;
    private storenames;
    private dbname;
    constructor(dbname: string, sdstorenames: string[]);
    IsAvailable(): boolean;
    private Connect;
    private GetStore;
    /**
     * Saves an object to IDB.
     *
     * @param obj the object to save ({Key: string, Data: JSON}). (Key: <Typename>-<date>-<5 digit hash>)
     * @param storename the name of the table.
     * @param callback callback function, if there is an error, the callbackobj will have an "error" property.
     * @param clearDB if true then clears the database.
     */
    Save(obj: object, storename: string, callback: Function, clearDB?: boolean): void;
    /**
     * Returns data from IDB.
     *
     * @param storename the name of the table.
     * @param callback callback function, if there is an error, the callbackobj will have an "error" property.
     * @param filter filter funcion.
     */
    GetData(storename: string, callback: Action<any[]>, filter?: Func1<any, boolean>): void;
    DeleteData(storename: string, callback: Action<any[]>, filter?: Func1<any, boolean>): void;
    ClearStore(storename: string, callback: Function): void;
}
declare class ModelFeatures {
    Views: string[];
    ListActions: string[];
    ListColumns: string[];
    DefaultListAction: string;
    ListFilters: IClientFilter[];
    UIFilters: IUIFilterOptions[];
    get DataColumns(): any[];
    get UIColumns(): any[];
}
declare class DataLookup {
    QueryName: string;
    LookUpFields: string[];
    ValueField: string;
    DisplayField: string;
    static LookupFunction: (textinput: string, queryname: string, lookupfields: string[], valuefieldname: string, displayfieldname: string, callback: Function) => void;
    Lookup(textinput: string, callback: Function): void;
}
declare class TaskAction {
    Tasks: string[];
    ActiveTasksNr: number;
    OnCompleted: Function;
}
declare class Waiter {
    private Waiters;
    SetWaiter(waiterid: string, oncompleted: Function): void;
    StartTask(waiterid: string, task?: string): void;
    SetTasks(waiterid: string, tasks: string[]): void;
    EndTask(waiterid: string, task?: string): void;
}
interface IViewTemplate {
    Compile(template: string): Function;
    LayoutPath: string;
    Bind(model: any, context: any, options?: BindOptions): string;
    BindToFragment(model: any, context: any): DocumentFragment;
    Extension: string;
    Copy(): IViewTemplate;
}
declare module Language {
    class Operator {
        Parameters: number;
        Value: string;
    }
    class Part {
        Content: string;
        Type: string;
        Children: Part[];
    }
    class CallStatement extends Part {
    }
    class Assignment extends Part {
    }
    class Variable extends Part {
    }
    class Block extends Part {
        Signature: string;
    }
    class Loop extends Block {
    }
    class Decision extends Part {
    }
    class Declaration extends Part {
    }
    class Function extends Block {
    }
    class Procedure extends Function {
    }
    class Trigger extends Function {
    }
    class Statement {
    }
    class Address {
        Alias: string;
        Reference: string;
    }
    class Query extends Part {
        Select: Statement;
        From: Statement;
        Join: Statement;
        Where: Statement;
        GroupBy: Statement;
        OrderBy: Statement;
        Skip: number;
        Take: number;
    }
    class View extends Query {
    }
    class Table extends Part {
    }
    class List extends Part {
    }
    class Literal extends Part {
    }
    class Command extends Part {
    }
    class Comment extends Part {
    }
    class Parser {
        Parse(part: Part, parent?: Part): Part;
        HandleComments(part: Part, parent?: Part): Part;
        HandleLiterals(part: Part, literaldictionary: DictionaryOf<string>): void;
    }
}
declare const keyattribute = "datakey";
declare class BindOptions {
    targetelement?: Element;
    targeselector?: string;
    excludedelements?: Element[];
    excludedselectors?: string[];
    map?: boolean;
    extension?: string;
    keeporderontarget?: boolean;
    triggerafterbind?: boolean;
    triggerbeforebind?: boolean;
}
declare class RazorSyntax {
    static BlockStart: string;
    static BlockEnd: string;
    static InlineBlockStart: string;
    static InlineBlockEnd: string;
    static RazorSwitch: string;
    static Foreach: string;
    static For: string;
    static If: string;
    static Else: string;
    static ElseIf: string;
    static Template: string;
}
declare class EncloseInfo {
    enclosed: boolean;
    prefix_start: number;
    enclose_start: number;
    enclose_end: number;
    content_start: number;
    content_end: number;
    get SplitStart(): number;
    get SplitEnd(): number;
    SetBackTo(ix: number): void;
    GetEnclosed(content: string): string;
    GetPrefix(content: string): string;
    static GetEncloseInfo(content: string, start: string, end: string): EncloseInfo[];
    static FixEncloseByPrefix(source: EncloseInfo[]): void;
    static Test(): void;
}
declare class partinterval {
    start: number;
    end: number;
    constructor(start?: number, end?: number);
}
declare class enclosedpart extends partinterval {
    pre: string;
    pre_start: number;
    enclose_start: number;
    enclose_end: number;
    constructor(start?: number, end?: number, enclose_start?: number, enclose_end?: number, pre?: string, pre_start?: number);
}
declare class encloseditem {
    prekey: string;
    pre: string;
    content: string;
    parent: encloseditem;
    children: encloseditem[];
}
declare class Code {
    TypeName: string;
    Value: string;
    constructor(value?: string);
    static Create(value: string): Code;
}
declare class InlineCode extends Code {
    TypeName: string;
    constructor(value?: string);
    static Create(value: string): InlineCode;
}
declare class SyntaxTreeNode {
    Value: string;
    Children: SyntaxTreeNode[];
    Parent: SyntaxTreeNode;
    TypeName: string;
    Name: string;
    Source: string;
    GetStringValue(): string;
    AddChild(node: SyntaxTreeNode): void;
    AddChildren(nodes: SyntaxTreeNode[], startix?: number): void;
    SetChildrenAt(ix: any, node: SyntaxTreeNode): void;
    GetString(span?: string): string;
    GetItems(span?: string): any[];
    static Create(content: string): SyntaxTreeNode;
}
declare class BlockNode extends SyntaxTreeNode {
    TypeName: string;
    static CreateFrom(nodes?: SyntaxTreeNode[]): SyntaxTreeNode;
    constructor();
    GetItems(span?: string): any[];
    static Create(content: string): BlockNode;
}
declare class ImplicitNode extends SyntaxTreeNode {
    TypeName: string;
    GetItems(span?: string): any[];
    static Create(content: string): ImplicitNode;
}
declare class Razor {
    MainStr: string;
    Block_Start: string;
    Block_End: string;
    Inline_Start: string;
    Inline_End: string;
    loop_for: string;
    loop_foreach: string;
    switch: string;
    if: string;
    else: string;
    static keywords: string[];
    Parse(razorstr: string): any[];
    GetBetween(content: string, start: string, end: string, blocktype?: string): SyntaxTreeNode;
    static GetEncloseInfo(content: string, start: string, end: string, rstarts?: string[], pre?: string): any;
    static GetPartIntervalInfo(content: string, start: string, end: string, rstart?: string): any;
    static GetEnclosedItems(content: string, start: string, end: string, rstarts?: string[]): encloseditem[];
}
declare class RazorParser {
    static GetSplitBy(content: string, start: string, end: string, pre: string): EncloseInfo[];
    static GetEncloseInfo(content: string, start: string, end: string, pre: string): EncloseInfo[];
    static GetFunction(nodes: any[]): Function;
    static Compile(code: string): Function;
    x(): void;
}
declare class RazorTemplate implements IViewTemplate {
    private _f;
    LayoutPath: string;
    Compile(template: string): Function;
    Bind(model: any, context: any, options?: BindOptions): string;
    BindToFragment(model: any, context: any): DocumentFragment;
    Extension: string;
    Copy(): IViewTemplate;
}
declare type Predicate<T> = (item: T) => boolean;
declare type SelectFunc<T> = (item: T) => any;
declare type Func<TOut> = () => TOut;
declare type Action<T> = (T: any) => any;
declare type Action2<T, T2> = (T: any, T2: any) => any;
declare type Func1<T, TOut> = (item: T) => TOut;
declare type Func2<T1, T2, TOut> = (item: T1, item2: T2) => TOut;
declare var Res: (key: string, culture?: string) => string;
declare var ModelRes: (key: string, viewpath?: string) => string;
declare var ResExists: (key: string, culture?: string) => boolean;
declare var GetResource: (key: string, culture?: string) => string;
declare var z: number;
declare var _Select: (CssSelector: string, from?: any) => Element[];
declare var _SelectFirst: (CssSelector: string, from?: any) => Element;
declare var _Find: (element: Element, CssSelector: string) => Element[];
declare var _FindFirst: (element: Element, CssSelector: string) => Element;
declare var _Parent: (element: Element, selector?: string) => Element;
declare var _Children: (element: Element, CssSelector?: string) => Element[];
declare var _FirstChildren: (element: Element, CssSelector?: string) => Element;
declare var _AddEventHandler: (element: any, eventname: string, handler: Function) => void;
declare var _RemoveEventHandler: (element: any, eventname: string, handler: Function) => void;
declare var _RemoveEventHandlers: (element: any, eventname: string) => void;
declare var _EnsureEventHandler: (element: any, eventname: string, handler: Function) => void;
declare var _Attribute: (element: any, attributename: string, attributevalue?: string) => string;
declare var _RemoveAttribute: (target: any, attributename: string) => void;
declare var _TagName: (element: any) => string;
declare var _Property: (element: any, propertyname: string) => string;
declare var _Value: (element: any, value?: string) => string;
declare var _Html: (element: any, html?: string) => string;
declare var _Text: (element: any, text?: string) => string;
declare var _Remove: (element: any) => void;
declare var _Append: (target: Element, element: Element) => void;
declare var _After: (target: Element, element: Element) => void;
declare var _Before: (target: Element, element: Element) => void;
declare var _HasClass: (element: any, classname: string) => boolean;
declare var _AddClass: (element: any, classname: string) => void;
declare var _RemoveClass: (element: any, classname: string) => void;
declare var _Css: (element: any, value: string) => void;
declare var _Width: (element: any, value?: any) => number;
declare var _Height: (element: any, value?: any) => number;
declare var _Focus: (element: any) => void;
declare var _Show: (element: any) => void;
declare var _Center: (element: any) => void;
declare var _Hide: (element: any) => void;
declare var _ShowHide: (element: any) => void;
declare var _ToggleClass: (element: Element, classname: string) => void;
declare var _ToggleClassForElements: (elements: Element[], classname: string) => void;
declare var _Create: <T>(tagname: string, attributes?: Object, html?: string) => T;
declare var _CreateElement: (tagname: string, attributes?: Object, html?: string) => Element;
declare var _IsVisible: (element: any) => boolean;
declare var _Clone: (element: Element) => Element;
declare var _SelectOne: (element: Element) => void;
declare var _Parents: (a: any, stopat?: any) => Element[];
declare var waitForFinalEvent: (callback: any, ms: any, uniqueId: any) => void;
interface Dictionary {
    [name: string]: any;
}
interface DictionaryOf<T> {
    [name: string]: T;
}
declare var formatDate: (dt: any, format: any) => any;
declare var e_testobj: {
    id: string;
    VoucherItems: {
        id: string;
        name: string;
        properties: {
            id: string;
            pname: string;
            value: number;
        }[];
    }[];
};
declare var __div: HTMLDivElement;
interface KeyValue {
    Key: any;
    Value: any;
}
interface Array<T> {
    FirstOrDefault(f?: Predicate<T>): T;
    Where(f?: Predicate<T>): T[];
    Distinct(f?: SelectFunc<T>): T[];
    OrderBy(f?: SelectFunc<T>): T[];
    OrderByDescending(f?: SelectFunc<T>): T[];
    Select(f?: SelectFunc<T>): any[];
    SelectAs<TOut>(f?: SelectFunc<T>): TOut[];
    SelectMany(f?: SelectFunc<T>): any[];
    Skip(val: number): T[];
    Sum(f?: SelectFunc<T>): number;
    Max(f?: SelectFunc<T>): number;
    Min(f?: SelectFunc<T>): number;
}
interface Date {
    IsWeekend(): boolean;
}
interface IDictionary<T> {
    [key: string]: T;
}
declare class Tasks {
    private static taskNr;
    static StartTask(name: string): void;
    static EndTask(name: string): void;
}
declare var dataURLToBlob: (dataURL: any) => Blob;
declare class Timer {
    private isrunning;
    tickms: number;
    Elpased: Function;
    constructor();
    Start(): void;
    Stop(): void;
    private Tick;
}
declare var numbers: readonly string[];
declare var __SyncronizationStore__: {};
