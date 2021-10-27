declare function XXX(): void;
declare function EvalIn(context: object, code: string): any;
declare function GetObjectFromCode(context: object, code: string): any;
declare function returneval(code: any, me?: any): any;
declare function EvalX(context: object, code: string): any;
declare function BindAccess(obj: any, key: string): any;
declare function evalInContext(code: string): any;
declare function GetBoundElements(element: Element): any[];
declare function GetBoundObject(element: Element, target?: Element): {};
declare function ConvertToProperty(obj: object, key: string, onset?: Function): void;
declare function GetLinkedObj(element: Element, obj: object): object;
declare class FlowEditor extends HTMLElement {
    connectedCallback(): void;
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
declare function GetUIDataTypeFrom(sourcetype: string): UIDataType.Text | UIDataType.Date | UIDataType.Number;
declare function GetMeta(obj: Object): EntityMeta;
declare function GetMetaByTypeName(typename: string): EntityMeta;
declare function SetObjectTo(item: Object, typename: string): void;
declare function SetTypeName(item: Object, typename: string): void;
declare function __x(): void;
declare function MapObject(source: Object, target: Object, cleararray?: boolean, xmeta?: EntityMeta): void;
declare function MapObjectCI(source: Object, target: Object, cleararray?: boolean): void;
declare function GetMetaKeyChain(typename: string, key: string): object[];
declare function MetaAccessByTypeName(typename: string, key: string): PropertyMeta;
declare function MetaAccess(obj: any, key: string): PropertyMeta;
declare function DF_Meta(root: string, txt: string, callback: Function): void;
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
declare class ClientFilter implements IClientFilter {
    Field: string;
    FieldFormat?: string;
    static DateFormat: string;
    Operator: string;
    Values: string[];
    Type: string;
    Children?: ClientFilter[];
    Source?: string;
    static CreateSimple(type: UIDataType, field: string, operator: string, val: any): IClientFilter;
    static Create(type: UIDataType, field: string, val: any): IClientFilter[];
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
declare function GetFilters(obj: any, meta: EntityMeta): IFilter[];
declare class ClientQuery {
    QueryName: string;
    Fields: Dictionary[];
    Filters: IClientFilter[];
    Ordering: Dictionary;
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
    OK: boolean;
    constructor(result?: boolean);
}
declare class ValidationRule<T> {
    Identifier?: string;
    Func: Func1<T, ValidationRuleResult>;
    DataFunc?: Func1<T, string>;
    Trigger?: string[];
    MessageTemplate: string;
}
declare class Formula<T> {
    Identifier?: string;
    Func: Func1<T, any>;
    Trigger?: string[];
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
    Save(obj: object, storename: string, callback: Function): void;
    GetData(storename: string, callback: Action<any[]>, filter?: Func1<any, boolean>): void;
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
declare class Glyph {
    Value: string;
    Tag?: string;
    Children: Glyph[];
    Level?: number;
    AddChild(item: string): void;
    AddChildGlyph(item: Glyph): void;
    static GetString(instance: Glyph, start?: string, end?: string, level?: number): string;
    static All(instance: Glyph, level?: number): Glyph[];
    static ForAll(instance: Glyph, action: Action2<Glyph, Glyph>, parent?: Glyph, level?: number): void;
}
declare class SimpleGlyph extends Glyph {
}
declare class GroupGlyph extends Glyph {
}
declare class Reference<T> {
    value: T;
}
declare class GlyphParser {
    private startstr;
    private endstr;
    constructor(startstr?: string, endstr?: string);
    Parse(expression: string): Glyph;
    private _Parse;
    static Test(): void;
}
declare class RPart {
    Value: string;
    Copy(): RPart;
}
declare class RCodePart extends RPart {
    constructor(value?: string);
    Copy(): RCodePart;
}
declare class RUIPart extends RPart {
    Copy(): RUIPart;
}
declare class RMixPart extends RPart {
}
declare class RImplicitpart extends RPart {
    Copy(): RImplicitpart;
}
declare class RExplicitpart extends RPart {
    Copy(): RExplicitpart;
}
declare class RazorMarkupParser {
    CSwitch: string;
    USwitch: string;
    Inline_Start: string;
    Inline_End: string;
    Block_Start: string;
    Block_End: string;
    KeyWords: string[];
    Parse(body: string): any[];
    Simplify(items: RPart[]): RPart[];
    HandleExppressions(item: string): any[];
    private StartsWithKeyWord;
    static Test(): void;
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
declare function LoadJS(path: string): void;
declare function GetFunctionBody(f: Function): string;
declare function GetReturnStatement(f: Function): string;
declare function GetMemberExpression(f: Function): string;
declare function StringEquals(s1: any, s2: any): boolean;
declare function ToBool(item: string): boolean;
declare function keyPress(key: any): void;
declare function SendKeys(txt: string, element?: HTMLInputElement): void;
declare function ExcelColNameToIx(colname: string): string;
declare function ExcelColNameToPropertyName(obj: object, colname: string): string;
declare function GetNext<T>(items: T[], item: T): T;
declare function GetPrevious<T>(items: T[], item: T): T;
declare function HasNext(items: any[], item: any): any;
declare function GetPart(data: any, startix: number, endix: number): any[];
declare function EnumerateObject(target: Object, context: any, func: Function): void;
declare function StartsWith(text: string, item: string): boolean;
declare function EndsWith(text: string, item: string): boolean;
declare function GetLength(data: any): any;
declare function RemoveFrom(item: Object, items: any[]): void;
declare function LastFrom(items: any[]): any;
declare function CallFunctionFrom(eventcontainer: Object, eventname: string, args?: any[]): void;
declare function CallFunction(func: Function, args?: any[]): any;
declare function CallFunctionWithContext(context: any, func: Function, args?: any[]): any;
declare function callasync(func: Function, timeout?: number): void;
declare function GetHashPart(item: string): string;
declare function clearobject(item: any): void;
declare function GetErrorObj(exception: any, contenttype?: string): {
    message: string;
    stacktrace: string;
};
declare function SetProperty(target: Object, name: string, value: any): void;
declare function GetBaseURL(): string;
declare function TextBetween(text: string, begintag: string, endtag: string, withtags?: boolean): string;
declare function TextsBetween(text: string, begintag: string, endtag: string, withtags: boolean): string[];
declare function FormatSimpleTest(...any: any[]): string;
declare function FormatSimple(format: string, args: any[]): string;
declare function Format(...any: any[]): string;
declare function addDays(date: any, days: any): Date;
declare function StringToDate(item: string, format?: string): Date;
declare function IsDate(p: any): boolean;
declare function IsNumeric(n: any): boolean;
declare function IsInt(value: any): boolean;
declare function pad(a: any, b: any, c: any, d: any): any;
declare function Property(item: any, property: string, value?: any): any;
declare function IsDefined(value: any, path: any): boolean;
declare function AddToArray(item: any[], ...any: any[]): any[];
declare function In(item: any, ...any: any[]): boolean;
declare function IsAllNull(item: any, ...any: any[]): boolean;
declare function FirstNotNull(...any: any[]): any;
declare function IsAllNotNull(item: any, ...any: any[]): boolean;
declare function intersectArrays(a: any, b: any): any[];
declare function cleanArray(actual: any): any[];
declare function removeFromArray(arr: any, ...any: any[]): any;
declare function Equals(arg1: any, arg2: any): boolean;
declare function GetClientQueryString(hash?: string): KeyValue[];
declare function ToHierarchy(items: any, idproperty: any, parentproperty: any, rootid: any): any;
declare function GetHierarchy(items: any[], idproperty: string, parentproperty: string, setparents?: boolean): object[];
declare function HashCode(s: any): any;
declare function GetFlattenedHierarchy(items: any[], idproperty: string, childproperty?: string, level?: number): object[];
declare function ForAll(hierarchy: Object, childrenproperty: string, func: Function, parent?: Object, level?: number): void;
declare function Clone(obj: Object): Object;
declare function IsNull(item: any): boolean;
declare function Coalesce(...items: any[]): any;
declare function s4(): string;
declare function getRndInteger(min: any, max: any): any;
declare function Guid(): string;
declare function ToHtmlAttributeListString(obj: Object): string;
declare function RenderHierarchy(obj: Object, itemformatter?: Function, level?: number): string;
declare function HtmlToText(html: string): string;
declare function ToString(item: Object): string;
declare function Truncate(item: string, limit?: number): string;
declare function IsNumberBetween(min: any, max: any, value: number): boolean;
declare function IsDateBetween(startdate: any, enddate: any, date?: Date): boolean;
declare function JsonToDate(item: string): Date;
declare function ToDate(item: string): string;
declare function ToNormalDate(item: string): string;
declare function FormatDate(d: Date, format?: string): string;
declare var formatDate: (dt: any, format: any) => any;
declare function xpad(n: any, width: any, z?: any): any;
declare function leftpad(n: any, width: any, z?: any): any;
declare function rightpad(n: any, width: any, z?: any): any;
declare function sharedStart(array: any): any;
declare function longestCommonSubstring(array: any): any;
declare function commonwords(array: any[]): string;
/**End Proto/

/*Expressions*/
declare function parseExp(expression: any, model: any): {
    propertyname: string;
    fullpropertyname: string;
    obj: any;
    value: any;
    typename: string;
    resourceid: string;
};
declare function FilesIntoUL(viewmodel: any): string;
declare function browserSupportsWebWorkers(): boolean;
declare function ToOptionList(obj: Object, addemptyoption: boolean): string;
declare function NormalizeFolderPath(folder: any): string;
declare function Eval(obj: any): any;
declare function IsFunction(functionToCheck: any): boolean;
declare function IsObject(obj: any): boolean;
declare function IsArray(value: any): boolean;
declare function Split(text: string, delimeters: any, removeempty: boolean): any[];
declare function Access(obj: any, key: any, context?: any): any;
declare function SetPropertyPath(obj: object, path: string, value: any): void;
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
declare function ObjToPathList(obj: object): string[];
declare function ObjToPathValueList(obj: object, path?: string): string[];
declare function ExtractPaths(obj: object, paths: string[]): object;
declare function SetPath(obj: object, path: string, value: any): void;
declare function GetPath(obj: object, path: string): object;
declare function PathMap(source: object, target: object): void;
declare function HtmlEncode(s: any): any;
declare var __div: HTMLDivElement;
declare function HtmlDecode(s: any): string;
declare function OuterHtml(item: Element): string;
declare function Replace(text: string, texttoreplace: string, textwithreplace: string): string;
declare function Bind_Replace(text: string, texttoreplace: string, textwithreplace: string): string;
interface KeyValue {
    Key: Object;
    Value: Object;
}
declare function GetProperties(item: Object): KeyValue[];
declare function GetKeys(item: Object): any[];
declare function GetPropertiesArray(item: Object): Object[];
interface Array<T> {
    FirstOrDefault(f?: Predicate<T>): T;
    Where(f?: Predicate<T>): T[];
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
declare function dynamicSort(property: any, sortOrder?: number): (a: any, b: any) => number;
declare function ForeachInHierarchy(obj: object, func: Function, childrenpropertyname?: string): void;
declare function ForeachInHierarchy2(obj: object, func: Function, childrenpropertyname?: string): void;
declare function WhereInHierarchy(obj: object, func: Function, childrenpropertyname?: string): any[];
declare function ParentsOfHierarchy(obj: object, parentpropertyname?: string): any[];
declare function FindInHierarchy(obj: object, func: Function, childrenpropertyname?: string): object;
declare function Log(item: any, ext?: any): void;
declare function HttpRequest(method: any, url: any, callback: any): XMLHttpRequest;
interface IDictionary<T> {
    [key: string]: T;
}
declare class Tasks {
    private static taskNr;
    static StartTask(name: string): void;
    static EndTask(name: string): void;
}
declare function ShowProgress(src?: string): void;
declare function HideProgress(src?: string): void;
declare function IsDataContainer(element: Element): boolean;
declare function GetPropertyandValue(element: Element): {
    Key: any;
    Value: any;
};
declare function EnsureProperrty(obj: Object, property: string, defaultvalue?: any): void;
declare function CopyProperty(source: Object, target: Object, property: string, targetproperty?: string): void;
declare function getUrlParameter(name: any): string;
declare function getTextAreaLineNr(element: HTMLTextAreaElement): number;
declare function Activate(a: Element, container: Element): void;
declare function ActivateOld(a: Element): void;
declare function SelectElement(parent: Element, child: Element): void;
declare function ActivateFloat(element: Element): void;
declare function JsonCopy(obj: object): any;
declare function GetHtml2(obj: any, span?: string): string;
declare function GetHtml(obj: Object): string;
declare function download(filename: any, data: any): void;
declare function CsvLineSplit(text: string, delimiter?: string, enclose?: string): string[];
declare function compareString(a: any, b: any): 0 | 1 | -1;
declare function getStringCompareFunction(p: Function): (a: any, b: any) => 0 | 1 | -1;
declare function RestoreModel(item: object, fielddictionary: object): object;
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
declare function AsArrayOf<T>(obj: any): T[];
declare function GetPropertyByShortname(properties: Object[], shortname: string): string;
declare function TransformNumber(number: number, numberofdecimal: number): string;
declare var HttpStatusCodes: {
    '200': string;
    '201': string;
    '202': string;
    '203': string;
    '204': string;
    '205': string;
    '206': string;
    '300': string;
    '301': string;
    '302': string;
    '303': string;
    '304': string;
    '305': string;
    '306': string;
    '307': string;
    '400': string;
    '401': string;
    '402': string;
    '403': string;
    '404': string;
    '405': string;
    '406': string;
    '407': string;
    '408': string;
    '409': string;
    '410': string;
    '411': string;
    '412': string;
    '413': string;
    '414': string;
    '415': string;
    '416': string;
    '417': string;
    '418': string;
    '429': string;
    '500': string;
    '501': string;
    '502': string;
    '503': string;
    '504': string;
    '505': string;
};
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
    GetFilter(options: IUIFilterOptions): string;
    FieldFor(expression: string, hideifempty?: boolean): string;
    LabelFor(model: object, expression: Function, UIType: string, attributes: Object): string;
    ValueFor(model: any, meta: ObjectMeta, parent?: any): string;
    Value(model: any, key: string): string;
    labelFor(model: any, expression: Function, attributes: Object): string;
    GetLabel(key: string, attributes?: Object): string;
    Text(key: string): string;
    Label(model: any, key: string, attributes?: Object): string;
    ObjectPickerFor(model: any, expression: Function, labelexpression: Function, options: QueryLookupOptions, attributes: Object): string;
    AutoCompleteFor(model: any, expression: Function, labelexpression: Function, options: QueryLookupOptions, attributes: Object): string;
    InputFor(model: any, expression: Function, attributes: Object): string;
    TextAreaFor(model: any, expression: Function, attributes: Object): string;
    BoundInput(model: any, key: string): string;
    Input(model: any, key: string, attributes: Object): string;
    FormattedLabelFor(model: object, expression: Function, formatstring: string, attributes: Object): string;
}
