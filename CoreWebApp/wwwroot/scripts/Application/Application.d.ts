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
declare namespace OdataQueryOptions {
    class Operators {
        static Dictionary: {
            eq: any;
            ne: any;
            gt: any;
            ge: any;
            lt: any;
            le: any;
            and: any;
            or: any;
            not: any;
            add: any;
            sub: any;
            mul: any;
            div: any;
            mod: any;
        };
    }
    class Functions {
        static Dictionary: {
            endswith: any;
            startswith: any;
            substringof: any;
            indexof: any;
            replace: any;
            substring: any;
            tolower: any;
            toupper: any;
            trim: any;
            concat: any;
            round: any;
            floor: any;
            div: any;
            ceiling: any;
            day: any;
            hour: any;
            minute: any;
            month: any;
            second: any;
            year: any;
        };
    }
    class E {
    }
    class E_Reference extends E {
    }
    class E_Value extends E {
    }
    class E_Operator extends E {
    }
    class E_Function extends E {
    }
    class Query extends E {
        Select: Select;
        Filter: Filter;
        Expand: Expand;
        OrderBy: OrderBy;
        Top: Top;
        Skip: Skip;
        Count: Count;
    }
    class Filter extends E {
        Items: E[];
    }
    class Expand {
        Path: string;
        Query: Query;
    }
    class Select {
        Fields: string[];
    }
    class OrderBy {
        Clauses: Object;
    }
    class Top {
        Value: string;
    }
    class Skip {
        Value: string;
    }
    class Count {
        Value: boolean;
    }
}
declare class Odataparser {
    static GlyphTags: {
        Function: string;
        Operator: string;
        Variable: string;
        DValue: string;
        TValue: string;
        IValue: string;
        SValue: string;
    };
    Parse(item: string): void;
    GetClientFilters(value: string): ClientFilter[];
    BuildQuery(g: Glyph, q: OdataQueryOptions.Query): DictionaryOf<Glyph>;
    static test(): void;
    static testquery(q: string): void;
}
declare class Glyph {
    Value: string;
    Tag?: string;
    Slot?: any;
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
declare var _TrimLeft: (item: any, chars: any) => any;
declare var _TrimRight: (item: any, chars: any) => any;
declare var _Trim: (item: any, chars: any) => any;
declare function GetStringWithLiterals(text: string, literalstr?: string): {
    aliasedtext: string;
    literaldictionary: {};
};
declare function CsvLineSplit(text: string, delimiter?: string, enclose?: string): string[];
declare function compareString(a: any, b: any): 1 | 0 | -1;
declare function getStringCompareFunction(p: Function): (a: any, b: any) => 1 | 0 | -1;
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
declare class ImportScript {
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
declare class ExcelImport extends ImportScript {
    ExcelQuery: string;
    ExcelOptions: string;
    Url: string;
    SetExcelVersion(extension: string): void;
    ExcelData: any;
    CallBack_ExcelData: Function;
    LoadExcel(data: any): void;
    ReloadExcel(): void;
    Clear(): void;
}
declare function GetDbCommandForObject(obj: any, commandname: any, keys?: string, excludes?: string[]): any;
declare function GetUpdateCommand(obj: any, typename: any, commandname: any, keys?: string, excludes?: string[]): {};
declare function GetDeleteCommand(typename: any, id: any): {};
declare function FIxUpdateObj(obj: any): void;
declare class Dependencies {
    static Container(): Element;
    static httpClient: HttpClient;
    static LoadContent(element: Element): void;
    static ClientValidation: boolean;
    static DataLayer: AppDataLayer;
}
declare class AppDataLayer {
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
}
interface NavigationItem {
    Key: string;
    Name: string;
    Content?: string;
    ContentURL?: string;
    ParentKey?: string;
    Parameters?: Object;
    Children?: NavigationItem[];
    Url?: string;
}
interface IParameterDictionary extends IDictionary<string> {
    page?: any;
    type?: any;
    id?: any;
    orderby?: any;
}
declare class SearchParameters implements Object {
    page?: any;
    type?: any;
    id?: any;
    orderby?: any;
    initiator?: any;
    static Ensure(obj: Object, paramdictionary?: IParameterDictionary): SearchParameters;
}
declare class View {
    Name: string;
    LayoutPath: string;
    Templates: DictionaryOf<IViewTemplate>;
    Commands: DictionaryOf<AppUICommand>;
    CopyTemplates(): DictionaryOf<IViewTemplate>;
    Close(): boolean;
    AddTemplate(extension: string, template: IViewTemplate): void;
    GetTemplate(extension: string): IViewTemplate;
    Bind(itemorselector: any, model: any, context?: any, poptions?: BindOptions): void;
    static GetView<T>(me: T, element?: any): T;
    parameterstr(): string;
    GetParameterDictionary(p?: any): IParameterDictionary;
    Area: string;
    UIElement: Element;
    OriginalTemplateHtml: string;
    TemplateHtml: string;
    RazorTemplate: RazorTemplate;
    ViewBag: DictionaryOf<Object>;
    Controller: ModelController;
    IsDirty: boolean;
    IsMultiInstance: boolean;
    LogicalModelName: string;
    SelectFirst(selector: string): Element;
    Identifier(): string;
    IsList(): boolean;
    FormatIdentifier(p: any, area?: string): string;
    Title(): string;
    constructor(Name: string, controller?: ModelController);
    Copy(): View;
    Action(p: Object): void;
    BeforeBind(): void;
    AfterBind(navigate?: boolean): void;
    Changed(): void;
    BeforePrint(printarea: Element): void;
    PageSize(): number;
    SavePageSize(pagesize: number): void;
}
declare class ViewModel<T> extends View {
    Model: T;
    constructor(Name: string, controller?: ModelController);
    RegisterCommand(command: AppUICommand): void;
    Copy(): ViewModel<T>;
    AfterBind(navigate?: boolean): void;
    GetCommandbarHtml(model: any): string;
    GetCommandbarContentHtml(model?: any): string;
    DownloadModel(): void;
    ShowValidationResults(results: ValidationRuleResult[], item: T): Promise<boolean>;
}
declare class DataList<T> {
    Items: T[];
    Columns: string[];
}
declare class SaveViewModel<T> extends ViewModel<T> {
    constructor(Name: string, controller?: ModelController);
    SaveDraft(): void;
    LoadDraft(ondataload?: Function): void;
    ClearDraft: any;
}
declare class CreateViewModel<T> extends SaveViewModel<T> {
    constructor(Name: string, controller?: ModelController);
}
declare class ListViewModel<T> extends ViewModel<T> {
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
declare class ViewInstance {
    Id: string;
    Title: string;
    Url: string;
    ViewModel: View;
    Parameters: Object;
    LogicalModelName: string;
    UIElement: Element;
}
declare class ModelController {
    ModelName: string;
    NS: string;
    Container: () => Element;
    Views: View[];
    private _ViewDictionary;
    Instances: DictionaryOf<ViewInstance>;
    AddView(view: View): void;
    get ViewDictionary(): DictionaryOf<View>;
    RegisterActions(): void;
    Navigate(p: Object): void;
    ShowView(vm: View): void;
    PrepareView(vm: View, p?: Object): void;
    SetViewUIElement(vm: View, viewinstanceid?: string): void;
    Load(vm: View, p: Object, modeltypename: string, area: string): View;
    Download(name: string, waiter: Waiter): void;
    Open(vm: View, p: Object, modeltypename: string, area: string): View;
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
declare class HttpClient {
    EntryPointBase: string;
    private token;
    OnResponse: Function;
    OnRequest: Function;
    OnError: Function;
    GetUrl(url: string): string;
    private setHeaders;
    Get(url: string, header: object, onSuccess: Function, onError?: Function): XMLHttpRequest;
    Decompress(data: any): any;
    GetMultiData(queries: ClientQuery[], onSuccess: Function, onError?: Function, cachemaxage?: number): XMLHttpRequest;
    GetData(query: ClientQuery, onSuccess: Function, onError?: Function, cachemaxage?: number): XMLHttpRequest;
    Post(url: string, data: any, onSuccess: Function, onError?: Function, contenttype?: string, marker?: string): XMLHttpRequest;
    PostOld(url: string, data: any, onSuccess: Function, onError?: Function, contenttype?: string, headers?: object): XMLHttpRequest;
    Put(url: string, data: any, onSuccess: Function, onError?: Function, contenttype?: string, marker?: string): XMLHttpRequest;
    Authenticate(success: Function, failure: Function, credentials?: {}): void;
}
declare function modelobj(element: Element): object;
declare function view(element: Element): View;
declare function controller(element: Element): ModelController;
declare module BaseModel {
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
declare var tinymce: any;
declare module Common.Contact {
    class MessageCollection {
        Incoming: Models.AppMessage[];
        Outgoing: Models.AppMessage[];
        get All(): Models.AppMessage[];
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
        NewMessage(msg: Models.AppMessage): void;
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
declare class Controls {
    static DateFormat: string;
}
declare class Diff {
    Property: string;
    Val1: any;
    Val2: any;
    Ref1: any;
    Ref2: any;
    Children: Diff[];
}
declare class AttributeDiff extends Diff {
    Container1: any;
    Container2: any;
}
declare class DiffOptions {
    keeporderontarget?: boolean;
    excludedelements?: Element[];
    excludednodes?: Node[];
    excludedselectors?: string[];
}
declare class DomDiff {
    static Test(): void;
    Difflist: Diff[];
    static CompareElements(element1: Node, element2: Node, options: DiffOptions): Diff[];
    static GetPropertyDiff(element1: Node, element2: Node, properties: string[]): Diff[];
    GetTagDiff(element1: Node, element2: Node): Diff;
    static GetAttributeDiff(element1: Node, element2: Node): Diff[];
    private static Attributes;
    private static Attribute;
    static Map(target: Node, source: Node, poptions?: DiffOptions): void;
    static MapDiff(difference: Diff, parent?: Diff): void;
}
declare function customcontrol(element: any): Element;
declare function TreeMenu(target: Element, obj: any): string;
declare function GetControlSheet(): CSSStyleSheet;
declare function GetDynamicalSheet(): CSSStyleSheet;
declare function addCSSRule(sheet: any, selector: any, rules: any, index: any): void;
declare class App_FileUploader extends HTMLElement {
    private uploadelement;
    get Files(): any[];
    constructor();
    connectedCallback(): void;
    private OnChange;
}
declare class App_Field extends HTMLElement {
    private label;
    static get observedAttributes(): string[];
    attributeChangedCallback(attrName: any, oldValue: any, newValue: any): void;
    connectedCallback(): void;
    load(): void;
}
declare class App_Header extends HTMLElement {
    constructor();
    connectedCallback(): void;
    EnsureLayout(): void;
}
declare class App_CommandBar extends HTMLElement {
    Commands: AppUICommand[];
    get activatorindex(): string;
    set activatorindex(val: string);
    constructor();
    connectedCallback(): void;
    ContentChanged(): void;
    EnsureActivator(): void;
    ToggleState(): void;
    AddCommands(...commands: AppUICommand[]): void;
}
declare class App_ColumnFilter extends HTMLElement {
    IsExact: boolean;
    Value: any;
    Field: string;
    Type: UIDataType;
    private input;
    private exact_input;
    private clear_element;
    get value(): any;
    set value(val: any);
    GetFilters(): ClientFilter[];
    constructor();
    connectedCallback(): void;
}
declare class App_DataTable extends HTMLTableElement {
    private stylenode;
    private instancekey;
    private Data;
    private originalrows;
    private filteredrows;
    private sortedrows;
    private typename;
    sortfunction: Function;
    filterfunction: Function;
    flags: DictionaryOf<boolean>;
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    private styleproperties;
    private AlignCells;
    OnDataBound(): void;
    OnClick(event: MouseEvent): void;
    static GetCellValue(r: HTMLElement, index: number, utype: UIDataType): any;
    GetRowElements(): HTMLElement[];
    Sort(field: string, by: string, type?: UIDataType): void;
    Filter(field: string, value: string, type?: UIDataType): void;
    SizeChanged(entries: any): void;
    private MakeResizable;
    private MakeFilterable;
    private MakeSortable;
    private Setup;
}
declare class App_InputWithAction extends HTMLElement {
    private _value;
    get value(): string;
    set value(val: string);
    connectedCallback(): void;
}
declare class App_QueryEditor extends HTMLElement {
    private QueryTemplate;
    private Query;
    private VisibleFields;
    get roottype(): string;
    set roottype(val: string);
    constructor();
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
declare class App_FilterEditor extends HTMLElement {
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
declare class App_ProgressButton extends HTMLElement {
    private _value;
    get value(): string;
    set value(val: string);
    connectedCallback(): void;
}
declare class App_Tabs extends HTMLElement {
    connectedCallback(): void;
    private Activate;
}
declare class App_MetaBrowser extends HTMLElement {
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
declare class App_Validation extends HTMLElement {
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
declare class App_RadioList extends HTMLElement {
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
declare class App_DictionaryEditor extends HTMLElement {
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
declare class App_ModalWindow extends HTMLElement {
    connectedCallback(): void;
    load(): void;
    ContentChanged(): void;
}
declare class App_AutoComplete extends HTMLElement {
    options: AutoCompleteOption;
    private _input;
    private c_value;
    private c_display;
    ShowDisplaynameInTextInput: boolean;
    private _value;
    get displayText(): string;
    set label(val: any);
    get value(): string;
    set value(val: string);
    OnSelected(container: Element, dataitem: any): void;
    constructor();
    static get observedAttributes(): string[];
    attributeChangedCallback(attrName: any, oldValue: any, newValue: any): void;
    GetDataItemDisplayText(item: object): string;
    GetDataItemValue(item: any): any;
    private SetValueOfControl;
    connectedCallback(): void;
    disconnectedCallback(): void;
    Search(): void;
    Clear(): void;
    GetValue(): string;
    SetInput(txt: string): void;
    SetValue(value: any, displaytext: any): void;
}
declare class App_ObjectPicker extends App_AutoComplete {
    private _tagsnode;
    private _hinput;
    private _uitype;
    get uitype(): UIDataType;
    set uitype(val: UIDataType);
    GetTagText(data: any): any;
    GetTagValue(data: any): any;
    OnSelected(container: Element, dataitem: any): void;
    constructor();
    GetValue(): string;
    Remove(value: string): void;
    AddTag: (id: any, name: any) => boolean;
    Clear(): void;
    connectedCallback(): void;
}
declare class App_QueryViewFields extends HTMLElement {
    constructor();
    Fieldlist: any[];
    SetFieldlist(fieldlist: any[]): void;
    loadList(fieldlist: any[]): any;
    updatedList(fieldlist: any[]): any;
    ChangeFields(): void;
    connectedCallback(): void;
}
declare class AutoCompleteOption {
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
declare function GetContextMenu(): HTMLElement;
declare function SetContextPosition(item: HTMLElement, refitem: HTMLElement): void;
declare function Focus(e: HTMLElement, asyncc?: boolean): void;
declare class UILogger {
    logbuilder: any[];
    element: HTMLElement;
    private GetStringFromHtmlElement;
    logevent(e: Event, other?: string): void;
    private GetStringFromEvent;
    start(e: Element): void;
    stop(): void;
    GetLogs(): string;
}
declare class BarcodeScaner {
    timeoutms: number;
    eventname: string;
    logevent(e: Event, other?: string): void;
    initialize: () => void;
    close: () => void;
    timeoutHandler: number;
    inputString: string;
    keyup: (e: any) => void;
}
declare var barcodereaderEventHandling: BarcodeScaner;
declare function LogToast(verb: string, stitle: string, smessage?: string): void;
declare function Toast_Error(stitle: string, smessage?: string, sdata?: string): void;
declare function Toast_Notification(stitle: string, smessage?: string): void;
declare function Toast_Warning(stitle: string, smessage?: string, sdata?: string): void;
declare function Toast_Success(stitle: string, smessage?: string): void;
declare function GetMinMaxDate(inputhtml: string): string;
declare function SetMinDate(source: HTMLInputElement, target: HTMLInputElement): void;
declare function SetMaxDate(source: HTMLInputElement, target: HTMLInputElement): void;
declare function CreatePager(container: Element, options: Object): void;
declare function SetFloatLayout(element: HTMLElement): void;
declare function ToggleFloatBox(element: HTMLElement, setheight?: boolean): void;
declare function FloatList(listdata: [], fields: []): string;
declare function CellDetails(html: any, setheight?: boolean): string;
declare function ClearFilter(viewelement: Element): void;
declare var JsBarcode: Function;
declare function LoadBarcodes(): void;
declare function GetFiltersFromUI(filtercontainer: Element): IClientFilter[];
declare function resizableGrid(tbl: any, headonly?: boolean): void;
declare function ResizeImages(file: any, maxsize: number, callback: Function): void;
declare function LabelProxy(prefixes?: string[]): {};
declare class AppSelectorOptions {
    DisplayProperty: string;
    ValueProperty: string;
    OnSelected: string;
    MinLengtToSearch: string;
    Modes: string[];
    DataFunction: string;
}
declare class App_Selector extends HTMLElement {
    private TextInput;
    private List;
    private Activator;
    private Clearer;
    private _value;
    get value(): any;
    set value(val: any);
    static get observedAttributes(): string[];
    constructor();
    attributeChangedCallback(attrName: any, oldValue: any, newValue: any): void;
    connectedCallback(): void;
    SetDataItem(obj: any): void;
    SetDisplayText(txt: string): void;
    Clear(): void;
    ClearInput(): void;
    private SelectNext;
    private SelectPrev;
    private SelectElement;
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
    GetMinMaxDateControl(bind: string, udt: any): any;
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
declare module Settings {
    class List extends ViewModel<object> {
        Identifier(): string;
        Title(): string;
        constructor(controller: ModelController);
        Action(p: Object): void;
        Refresh(key: string): void;
        SetLanguage(): void;
        ShowSettings(): void;
        GetDbLayout(): void;
        GetResourceCsv(): void;
        ShowMissingResources(): void;
        ExecuteSQL(element: Element): void;
        ExecuteApi(element: Element): void;
    }
    class Login extends ViewModel<object> {
        private returnurl;
        Identifier(): string;
        Title(): string;
        FormatIdentifier(p: Object): string;
        constructor(controller: ModelController);
        Action(p: Object): void;
        Login(): void;
        ShowSplashScreen(): void;
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
declare class AppDependencies {
    static Container(): Element;
    static httpClient: HttpClient;
    static LoadContent(element: Element): void;
    static ClientValidation: boolean;
    static DataLayer: AppDataLayer;
}
interface NavigationItemDetails {
}
interface RouteProperties {
    area: string;
    controller: string;
    view: string;
    parameters: string;
}
declare function StartJS(): any;
declare function OnAuthenticated(result: any): void;
declare function GetParameter(key: string): string;
declare function SetParameter(key: string, value: any): void;
declare function SetWebServiceIdentifier(): void;
declare function SetDataEntryPoint(): void;
declare function Login(): void;
declare var missingresources: {};
declare function RetrieveResource(key: string): string;
declare function ResNvl(keys: string[], key?: string): string;
declare class ResourceContainer implements Dictionary {
    Cultures: {};
    Load(culture: string, obj: Dictionary, key: string): void;
}
interface AppResponse {
    Model: any[];
    Errors: any[];
    ViewData: object;
}
declare class AppUICommand {
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
interface AppScript {
    script: string;
    children?: AppScript[];
}
declare const default_MoneyFormat: String;
declare function FormatCurrencyAmount(value: any): number;
interface AppSettings {
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
}
interface IQueryAction {
    query: ClientQuery;
    onready: Function;
}
declare class Application {
    Resources: ResourceContainer;
    data: Object;
    private _Container;
    private _ScriptsReady;
    private _scriptwaiter;
    private get scriptwaiter();
    Commands: DictionaryOf<AppUICommand>;
    StaticDataQueryActions: DictionaryOf<IQueryAction>;
    RegisterCommand(command: AppUICommand): void;
    UnRegisterCommand(key: string): void;
    ScriptsReady(): void;
    IsInDebugMode(): boolean;
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
    Authenticate(callback?: Function): void;
    Navigate(source: Element, args: any): void;
    NavigateTo(controller: string, view: string, p: any, area?: string): void;
    GetView(controllername: string, viewname: string, viewid?: string): View;
    GetRouteProperties(url?: string): RouteProperties;
    NavigateUrl(url: string): void;
    LoadX(): void;
    Load(): void;
    private _storename;
    private _Settings;
    get Settings(): AppSettings;
    SaveSettings(settings?: AppSettings): void;
    private NavigationItems;
    Layouts: {
        Dictionary: {};
        Templates: {};
        load: () => void;
    };
    LoadLayouts(): void;
    SetCulture(culture: string): void;
    LoadResources(callback: Function): void;
    LoadData(company: object): void;
    LoadMenu(): void;
    LoadUI(): void;
    ClearFloats(except?: Element): void;
    ToggleFloat(selector: string, ev: MouseEvent): void;
    CloseHovering(element: Element, path?: Element[]): void;
    UIClick(e: MouseEvent): void;
    CurrentView(): View;
    private _idb;
    SaveToClient(data: any, storename: string, callback: Function): void;
    GetFromClient<T>(storename: string, callback: Action<T[]>, filter?: Func1<T, boolean>): void;
    RefreshStaticData(callback: Function): void;
    Refresh: any;
}
declare class App_ActionCenter extends HTMLElement {
    constructor();
    attributeChangedCallback(attrName: any, oldValue: any, newValue: any): void;
    connectedCallback(): void;
}
declare var application: Application;
declare function AddImportToApplication(s: ImportScript): void;
declare function RegisterController(app: Application, controllerF: Func<ModelController>): void;
declare function AddControllerToApplication(app: Application, controller: ModelController): void;
declare module Models {
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
