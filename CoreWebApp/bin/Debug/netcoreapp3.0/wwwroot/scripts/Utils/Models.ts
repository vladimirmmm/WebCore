

var FieldOperators =
    [
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
interface Field {
    Name: string;
}
interface IClientFilter {
    Field: string;
    FieldFormat?: string;
    Operator: string;
    Values: string[];
    Type: string;
    Children?: IClientFilter[]
    Value?: string
    Source?: string
    SourceExpression?: string

}
interface IFilter {
    GetQuery(): IClientFilter[];
    Field: string;
}
class Filter {
    public Field: string = "";
    public Expression: string = "";
    public Value: any;
}
enum UIDataType {
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
class UIFilterOptions implements IUIFilterOptions {
    Field: string = "";
    Type: UIDataType = UIDataType.Text;
    Value: string = "";
    LabelKey: string = "";

    ModelContext: string = "";
    QueryName: string = "";
    LookupTargetField: string = "";
    LookUpFields: string[] = null;
    LookupMode: boolean = false;
    ValueField: string = "";
    DisplayField: string = "";
    Callback?: Function = null;
    ShowNullFilters: boolean = false;
}
class UIFilter {
    public Field: string;
    public LookupTargetField: string;
    public Value: string;
    public LabelKey: string;
    public DataType: UIDataType = UIDataType.Text;
    public LookUp: DataLookup = null;

    public static GetNullFilterElements(items: any[], options: any) {
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
    public static Create(options: IUIFilterOptions): UIFilter {
        var filter = new UIFilter();
        if (options == null || IsNull(options.Field)) {
            console.log("UIFilter not defined properly!");
            return null;
        } else {
            filter.Field = options.Field;
            filter.LookupTargetField = FirstNotNull(options.LookupTargetField, options.Field);
            filter.DataType = options.Type;
            filter.Value = options.Value;
            filter.LabelKey = options.LabelKey;//FirstNotNull(options.LabelKey, options.Field);
            if (!IsNull(options.QueryName)) {
                filter.LookUp = new DataLookup();
                filter.LookUp.QueryName = options.QueryName;
                if (typeof options.LookUpFields === 'string') {
                    options.LookUpFields = (<any>options.LookUpFields).split(',');
                }
                filter.LookUp.LookUpFields = FirstNotNull(options.LookUpFields, ["Name"]);
                filter.LookUp.ValueField = FirstNotNull(options.ValueField, "Id");
                filter.LookUp.DisplayField = FirstNotNull(options.DisplayField, "Name");
            }
        }
        return filter;
    }

    public GetQuery(): IClientFilter[] {
        var me = this;
        var result: IClientFilter[] = ClientFilter.Create(me.DataType, me.Field, me.Value);


        return result;
    }

    public static Test() {
        var clientfilters = {};
        var uifilters: UIFilter[] = [];
        var adduifilter = function (uifilter: IUIFilterOptions, value): UIFilter {
            var f = UIFilter.Create(uifilter);
            f.Value = value;
            uifilters.push(f);
            return f;
        }
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


        var items = uifilters.Select(i => { return { "value": i.Value, "clientfilters": i.GetQuery() } });

        console.log(items);



    }
}

class ClientFilter implements IClientFilter {
    public Field: string = "";
    public FieldFormat?: string;
    public static DateFormat = "yyyy-MM-dd";
    public Operator: string = "";
    public Values: string[] = [];
    public Type: string = "number";
    public Children?: ClientFilter[] = null;

    public Source?: string;
    public static CreateSimple(type: UIDataType, field: string, operator: string, val: any): IClientFilter {
        var filter = <IClientFilter>{
            Field: field,
            Type: UIDataType[type],
            Operator: operator,
            Values: [val]
        }
        return filter;
    }
    public static Create(type: UIDataType, field: string, val: any): IClientFilter[] {
        var result: IClientFilter[] = [];
        var value = Format("{0}", val);
        var TextFilterCreator = function (item: string): IClientFilter {
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
                        filter = <IClientFilter>{
                            Field: field,
                            Type: UIDataType[type],
                            Operator: "IS",
                            Values: [value]
                        }

                        return filter;
                    }
                    if (value == "!{NULL}") {
                        filter = <IClientFilter>{
                            Field: field,
                            Type: UIDataType[type],
                            Operator: "IS NOT",
                            Values: [value.substring(1)]
                        }

                        return filter;
                    }
                    filter = <IClientFilter>{
                        Field: field,
                        Type: UIDataType[type],
                        Operator: operator,
                        Values: [value]
                    }
                    return filter;
                }
            }
            value = value.toUpperCase();
            filter = <IClientFilter>{
                Field: field,
                FieldFormat: "upper({0})",
                Type: UIDataType[type],
                Operator: "LIKE",
                Values: [value]
            }

            return filter;
        };
        var NonStringFilterCreator = function (item: string): IClientFilter {
            var typestr = UIDataType[type];

            if (IsNull(item)) { return null; }
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

            var filter: IClientFilter = null;
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
                filter = <IClientFilter>{
                    Field: field,
                    Type: typestr,
                    Operator: operator,
                    Values: [value]
                };
            }
            if (value.indexOf("..") > -1) {
                var leftfilter = IsNull(parts[0]) ? null : <IClientFilter>{
                    Field: field,
                    Type: typestr,
                    Operator: isleftcontained ? ">=" : ">",
                    Values: [parts[0]]
                };
                var rightfilter = IsNull(parts[1]) ? null : <IClientFilter>{
                    Field: field,
                    Type: typestr,
                    Operator: isrightcontained ? "<=" : "<",
                    Values: [parts[1]]
                };

                var filters: IClientFilter[] = [];
                if (rightfilter != null) { filters.push(rightfilter); }
                if (leftfilter != null) { filters.push(leftfilter); }
                if (filters.length == 1) {
                    filter = filters.FirstOrDefault();
                }
                if (filters.length > 1) {
                    var andfilter = <IClientFilter>{
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
        }

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
        } else {
            var orfilter = new ClientFilter();
            orfilter.Operator = "OR";
            orfilter.Field = field;
            orfilter.Children = [];
            valueparts.forEach(function (valuepart) {
                var filter = filtercreator(valuepart);
                if (filter != null) {
                    if (filter.Values.length == 1 && filter.Values[0].startsWith("!") && filter.Operator == "=") {
                        filter.Values = [filter.Values[0].substring(1)];
                        filter.Operator = "<>"
                    }
                    orfilter.Children.push(filter)

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
            var datefixer = function (cf: IClientFilter) {
                for (var i = 0; i < cf.Values.length; i++) {
                    var cf_value = cf.Values[i];
                    if (cf_value != "NULL" && cf_value != "{NULL}") {
                        var d = StringToDate(cf_value, ClientFilter.DateFormat)
                        var sd = StringToDate(cf_value, "yyyy-MM-dd")
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
                            var andfilter = <ClientFilter>{
                                Operator: "AND",
                                Field: cf.Field,
                                Values: [],
                                Type: UIDataType[UIDataType.Date],
                                Children: [
                                    <ClientFilter>{
                                        Operator: "<",
                                        Field: cf.Field,
                                        Type: UIDataType[UIDataType.Date],
                                        Values: [Format("{0:yyyy-MM-dd}", nextday)]

                                    },
                                    <ClientFilter>{
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
                            cf.Values[0] = Format("{0:yyyy-MM-dd}", new_d)
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

            }
            result.forEach(datefixer);
        }
        return result;
    }


}
class NumberFilter extends Filter implements IFilter {
    public TypeName: string = "NumberFilter";

    GetQuery(): IClientFilter[] {
        var me = this;
        var result: IClientFilter[] = [];
        if (!IsNull(this.Value)) {
            result.push(<ClientFilter>{ Field: me.Field, Operator: "=", Values: [me.Value], Type: "number" });
        }
        if (!IsNull(this.List) && this.List.length > 0) {
            result.push(<ClientFilter>{ Field: me.Field, Operator: "IN", Values: <any>me.List, Type: "number" });

        }
        if (!IsNull(this.Min)) {
            result.push(<ClientFilter>{ Field: me.Field, Operator: ">=", Values: [Format("{0}", me.Min)], Type: "number" });

        }
        if (!IsNull(this.Max)) {
            result.push(<ClientFilter>{ Field: me.Field, Operator: "<=", Values: [Format("{0}", me.Max)], Type: "number" });

        }
        return result;
    }
    public Min: number;
    public Max: number;
    public List: number[];

    get Html(): string {
        var html = "";
        return html;
    }

    public static CreateListFilter(fieldname: string, items: number[]): NumberFilter {
        var filter = new NumberFilter();
        filter.Field = fieldname;
        filter.List = items;
        return filter;
    }
}
class StringFilter extends Filter implements IFilter {
    public TypeName: string = "StringFilter";
    public CaseSensitive: boolean = false;
    public IsExact: boolean = false;
    public List: string[];

    constructor(src: string = "") {
        super();
        var me = this;
        if (!IsNull(src)) {
            var ix = src.indexOf(":");
            me.Field = src.substring(0, ix);
            me.Value = src.substring(ix + 1);
        }
    }
    GetQuery(): IClientFilter[] {
        var me = this;
        var result: IClientFilter[] = [];
        var field = me.Field;
        var value = me.Value;
        var list = me.List;
        var format = "";
        if (!me.CaseSensitive) {
            format = "upper({0})";
            value = IsNull(value) ? value : (<string>value).toUpperCase();
            if (!IsNull(list)) {
                for (var i = 0; i < list.length; i++) {
                    list[i] = list[i].toUpperCase();
                }
            }
        }
        var cf: IClientFilter = null;
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
                } else {
                    operator = "=";
                }
            }
            value = Format(valueformat, value);
            cf = <IClientFilter>{ Type: "string", FieldFormat: format, Field: field, Operator: operator, Values: [value] };

        }
        if (!IsNull(list) && list.length > 0) {
            cf = <IClientFilter>{ Type: "string", FieldFormat: format, Field: field, Operator: "IN", Values: <any>list };
        }
        if (cf != null) {
            result.push(cf);
        }
        return result;
    }

    public static CreateListFilter(fieldname: string, items: string[]): StringFilter {
        var filter = new StringFilter();
        filter.Field = fieldname;
        filter.List = items;
        return filter;
    }
}
class DateFilter extends Filter implements IFilter {
    public TypeName: string = "DateFilter";

    GetQuery(): IClientFilter[] {
        var me = this;
        var result: IClientFilter[] = [];
        if (!IsNull(this.Value)) {
            result.push(<ClientFilter>{ Type: "Date", Field: me.Field, Operator: "=", Values: [me.Value] });
        }
        if (!IsNull(this.List) && this.List.length > 0) {
            result.push(<ClientFilter>{ Type: "Date", Field: me.Field, Operator: "IN", Values: <any>me.List });

        }
        var qry = "";
        var concatenator = "";
        if (!IsNull(this.Min)) {
            result.push(<ClientFilter>{ Type: "Date", Field: me.Field, Operator: ">=", Values: [Format("{0}", me.Min)] });

        }
        if (!IsNull(this.Max)) {
            result.push(<ClientFilter>{ Type: "Date", Field: me.Field, Operator: "<=", Values: [Format("{0}", me.Max)] });

        }
        return result;
    }
    public Min: Date;
    public Max: Date;
    public List: Date[];


}
function GetFilters(obj: any, meta: EntityMeta): IFilter[] {
    var results: IFilter[] = [];
    for (var x in obj) {
        var item = obj[x];
        var properties = GetProperties(item);
        var type = item.Type;
        var filter: IFilter = new StringFilter();
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

            } else {
                filter[keystr] = property.Value;

            }

        });
        results.push(filter);
    };
    return results;
}

class ClientQuery {
    QueryName: string;
    Fields: Dictionary[] = [];
    Filters: IClientFilter[] = [];
    Ordering: Dictionary = {};
    Parameters: Dictionary = {};
    Skip: number;
    Take: number;
    GetCount: boolean;
    SetCP: boolean;
    Distinct?: boolean = false;
    public SetFields(fields: string[]) {
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            this.SetField(field);
        }
    }
    public SetField(field: string) {
        var existing = this.Fields.FirstOrDefault(i => i.Name == field);
        if (existing == null) {
            this.Fields.push({ "Name": field });
        }

    }
    public SetFilters(filters: IClientFilter[]) {
        for (var i = 0; i < filters.length; i++) {
            var filter = filters[i];
            this.SetFilter(filter);
        }
    }
    public SetFilter(filter: IClientFilter) {
        if (!IsNull(filter)) {
            var existing = this.Filters.FirstOrDefault(i => i.Field == filter.Field && i.Source == filter.Source);
            var ix = this.Filters.indexOf(existing);
            if (ix > -1) {
                this.Filters[ix] = filter;
            } else {
                this.Filters.push(filter);
            }
        }

    }

    public static New(obj: object): ClientQuery {
        var r = new ClientQuery();
        for (var key in obj) {
            r[key] = obj[key];
        }
        return r;
    }
    public static CreateFrom(query: ClientQuery): QueryView {
        var qv = new QueryView();
        var copyobj = JsonCopy(query);
        for (var key in copyobj) {
            qv[key] = copyobj[key];
        }
        return qv;
    }
    public static CreateDetails(queryname: string, id: any): ClientQuery {
        var query = new ClientQuery();
        query.SetField("*");
        query.QueryName = queryname;
        query.SetFilter({
            "Type": "number",
            "Field": "Id",
            "Operator": "=",
            "Values": [id]
        })
        query.Take = 1;
        query.Skip = 0;
        query.GetCount = false;
        return query;
    }
    public static CreateList(queryname: string, fields: string[] = ["*"]): ClientQuery {

        var query = new ClientQuery();
        query.SetFields(fields);
        query.QueryName = queryname;
        query.Skip = 0;
        query.GetCount = false;
        return query;
    }
}

class QueryView extends ClientQuery {
    public UIColumns?: string[] = [];
}

class FileData
{
    public File: any;
    public Filename: string;
    public Type: any;
}
class List<T> extends Array<T>
{
    public Add(item: T)
    {
        this.push(item);
        this.OnChanged("Add", item, this.length-1);

    }
    public Remove(item: T)
    {
        var ix = this.indexOf(item);
        if (ix > -1) {
            this.splice(ix, 1);
            this.OnChanged("Remove", item, ix);

        }
    }
    public Clear()
    {
        this.splice(0, this.length);
        this.OnChanged("Clear");
    }
    public AddRange(items: Array<T>)
    {
        var ix = this.length;
        this.push.apply(this, items);
        this.OnChanged("AddRange", items, ix);

    }
    public static From<T>(items: Array<T>) {
        var list = new List<T>();
        items.push.apply(list, items);
        return list
    }


    public OnChanged: Function = function () { };
}



class ValidationRuleResult
{
    public Rule?: ValidationRule<any>;
    public RuleIdentifier?: string;
    public DataIdentifier?: string;
    public Message: string;
    public OK: boolean = true;

    constructor(result?: boolean)
    {
        if (!IsNull(result))
        {
            this.OK = result;
        }
    }

}
class ValidationRule<T>
{
    public Identifier?: string;
    public Func: Func1<T, ValidationRuleResult>;
    public DataFunc?: Func1<T, string>;
    public Trigger?: string[] = [];
    public MessageTemplate: string;

}
class Formula<T>
{
    public Identifier?: string;
    public Func: Func1<T, any>;
    public Trigger?: string[] = [];
}

class Task
{
    Id: string = "";
    Promise: Promise<any>;
    Function: Action2<Task,Function>;
    OnCompleted: Function;
    public Started: Date = null;
    public Finished: Date = null;
    public Info: any;
}
class TaskExecutor
{
    private threadnr: number = 1;
    public Id: string = "";
    public OnCompleted()
    {
        console.log("TaskExecutor " + this.Id + "Finished!");
    }
    public Tasks: Task[] = [];
    constructor(threadnr: number=1)
    {
        var me = this;
        me.threadnr = threadnr;
    }
    public TaskFinished(task: Task)
    {
        task.Finished = new Date();

        var diff = task.Finished.getTime() - task.Started.getTime();
        console.log("TaskFinished (" + task.Id + ") in "+diff);

        var me = this;
        var nexttask: Task = null;
        var isallcompleted = true;
        for (var i = 0; i < me.Tasks.length; i++)
        {
            var ctask = me.Tasks[i];
            if (!ctask.Finished) {
                isallcompleted = false;
                break;
            }
        }
        me.StartATask();
        if (isallcompleted)
        {
            me.OnCompleted();
        }

    }
    public Start()
    {
        var me = this;
        var startnr = Math.min(me.threadnr, me.Tasks.length);
        for (var i = 0; i < startnr; i++)
        {
            me.StartATask();
        }
    }
    private GetNextTask(): Task
    {
        var me = this;
        var task = me.Tasks.FirstOrDefault(i => IsNull(i.Started));
        if (task != null)
        {
            return task;
        }
        return null;
    }
    public StartATask()
    {
        var me = this;
        var task = me.GetNextTask();
        if (task != null) {
            task.Started = new Date();
            console.log("StartTask (" + task.Id + ")");

            task.Function(task, me.TaskFinished);
        }
    }


}

class FileObject
{
    public FullName: string;
    public Url: string;
    public Content: any;
}


class Obsv
{
    constructor(...params:any[])
    {
        if (!IsNull(params) && params.length>0)
        {
            var obj = params[0];
            //return new Proxy(obj,)
        }
    }
}
class IDB
{
    private db;
    private storenames: string[]=[];
    private dbname: string;
    public constructor(dbname:string, sdstorenames:string[])
    {
        this.storenames = sdstorenames;
        this.dbname = dbname;
    }
    public IsAvailable(): boolean
    {
        if (window.indexedDB) {
            return true;
        }
        return false;
    }
    private Connect(dbname: string, callback: Function) {
        var me = this;
        me.dbname = dbname;
        if (me.IsAvailable()) {
            var request = indexedDB.open(dbname, 8);
            request.onerror = function (event: any) {
                console.log("Error: ")
                callback({ error: "Error" });
            };
            //OnSuccess Handler
            request.onsuccess = function (event: any) {
                console.log("Success: ")
                me.db = event.target.result;
                callback({});

            };

            //OnUpgradeNeeded Handler
            request.onupgradeneeded = function (event: any) {
                console.log("On Upgrade Needed")

                me.db = event.target.result;
                // Create an objectStore for this database
                //Provide the ObjectStore name and provide the keyPath which acts as a primary key
                for (var i = 0; i < me.storenames.length; i++)
                {
                    var storename = me.storenames[i];
                    if (!me.db.objectStoreNames.contains(storename)) {
                        me.db.createObjectStore(storename, { keyPath: 'id', autoIncrement: true });
                    }
                }
               
            };
        } else
        {
            callback({ error: "indexedDB not available" });

        }
    }

    private GetStore(store_name: string, mode: string): any
    {
        var me = this;
        var tx = me.db.transaction(store_name, mode);
        return tx.objectStore(store_name);

    }

    public Save(obj: object, storename: string, callback: Function) {
        var me = this;
        var save = function () {
            if (!me.db.objectStoreNames.contains(storename)) {
                me.db.createObjectStore(storename);
            }
            var store = me.GetStore(storename, 'readwrite');
            var req;
            try {
                req = store.add(obj);
            } catch (e) {
                throw e;
            }
            req.onsuccess = function (evt) {
                callback({});
                console.log("Insertion in DB successful");
            };
            req.onerror = function () {
                callback({error:"error"});
                console.error("Insertion in DB Failed ", this.error);
            };
        };
        if (IsNull(this.db)) {
            this.Connect(me.dbname, save);
        } else
        {
            save();
        }
    }

    public GetData(storename: string, callback: Action<any[]>, filter:Func1<any,boolean>=null)
    {
        var me = this;
        var get = function ()
        {
            var objectStore = me.GetStore(storename, 'readwrite')
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
        }
        if (IsNull(this.db)) {
            me.Connect(me.dbname, get);
        } else {
            get();
        }

    }

    public ClearStore(storename: string, callback: Function) {
        var store = this.GetStore(storename, 'readwrite');
        //Clear the ObjectStore
        var req = store.clear();
        //Success Handler
        req.onsuccess = function (event) {
            callback({});
            console.log("clear successful")
        };
        //Error Handler
        req.onerror = function (event) {
            callback({error:"Error"});
            console.log("error clearing store")

        };
    }

}

class ModelFeatures
{
    public Views: string[]=[];
    public ListActions: string[] = [];
    public ListColumns: string[] = [];
    public DefaultListAction: string;
    public ListFilters: IClientFilter[] = [];
    public UIFilters: IUIFilterOptions[] = [];
    public get DataColumns() {
        return this.ListColumns.Where(i => i.indexOf("UI:") == -1).Select(i => {
            var ix = i.indexOf(":");
            if (ix == -1) {
                return i;
            } else {
                return i.substring(ix + 1);
            }

        });
    }
    public get UIColumns() {
        return this.ListColumns.Where(i => i.indexOf("D:") == -1).Select(i => {
            var ix = i.indexOf(":");
            if (ix == -1) {
                return i;
            } else {
                return i.substring(ix + 1);
            }

        });
    }
    
}

class DataLookup
{
    public QueryName: string;
    public LookUpFields: string[] = [];
    public ValueField: string = "";
    public DisplayField: string = "";
    public static LookupFunction = (textinput: string, queryname: string, lookupfields: string[], valuefieldname:string,displayfieldname:string, callback: Function) => { };
    public Lookup(textinput:string,callback: Function)
    {
        DataLookup.LookupFunction(textinput, this.QueryName, this.LookUpFields, this.ValueField, this.DisplayField, callback);
    }
}









class TaskAction {
    public Tasks: string[] = [];
    public ActiveTasksNr: number = 0;
    public OnCompleted: Function = () => { };
} 
class Waiter {
    private Waiters: IDictionary<TaskAction> = {};

    public SetWaiter(waiterid: string, oncompleted: Function) {
        var me = this;
        var a = new TaskAction();
        a.OnCompleted = oncompleted;
        a.ActiveTasksNr = 0;
        me.Waiters[waiterid] = a;
    }
    public StartTask(waiterid: string, task?: string) {
        var me = this;
        //Log("UI", "StartTask: " + task);

        var taskaction = me.Waiters[waiterid];
        taskaction.ActiveTasksNr++;
        if (taskaction.Tasks.indexOf(task) == -1) {
            taskaction.Tasks.push(task);
        }
    }
    public SetTasks(waiterid: string, tasks: string[]) {
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

    public EndTask(waiterid: string, task?: string) {
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

//interface initializable
//{
//    constructor(...any);
//    new: any;
//}

interface IViewTemplate
{
    Compile(template: string): Function
    LayoutPath: string
    Bind(model: any, context: any, options?: BindOptions): string;
    BindToFragment(model: any, context: any): DocumentFragment
    Extension: string;
    Copy(): IViewTemplate;
}


