//declare global {
//    function Res(key: string, culture?: string): string;
//}
type Predicate<T> = (item: T) => boolean;
type SelectFunc<T> = (item: T) => any;
type Func<TOut> = () => TOut;
type Action<T> = (T)=>any;
type Action2<T,T2> = (T,T2)=>any;
type Func1<T, TOut> = (item: T) => TOut;
type Func2<T1, T2, TOut> = (item: T1, item2: T2) => TOut;
 
var Res = function (key: string, culture?: string): string { throw "Res not implemented"; };
var ModelRes = function (key: string, viewpath: string =""): string {
    throw "Res not implemented";
}; 
var ResExists = function (key: string, culture?: string): boolean { throw "Res not implemented"; };
var GetResource=function(key: string, culture?: string): string {
    throw "Res not implemented"; 
}
var z = 0;
var _Select = (CssSelector: string, from?: any): Element[] => {
    var container: Element =<any>document;
    if (!IsNull(from))
    {
        container = from;
    }
    return [].slice.call(container.querySelectorAll(CssSelector));
};
var _SelectFirst = (CssSelector: string, from?: any): Element => {
    var container: Element = <any>document;
    if (!IsNull(from)) {
        container = from;
    }
    return container.querySelector(CssSelector);
}; 
var _Find = (element : Element, CssSelector: string): Element[]=> null;
var _FindFirst = (element: Element, CssSelector: string): Element=> null;
var _Parent = (element: Element, selector?: string): Element => {
    if (!IsNull(element)) {
        return element.parentElement;
    }
    return null;
};
//var _Parents = (element: Element, selector?: string): Element[]=> [];

var _Children = (element: Element, CssSelector?: string): Element[]=> null;
var _FirstChildren = (element: Element, CssSelector?: string): Element=> null;

var _AddEventHandler = (element: any, eventname: string, handler: Function) => { };
var _RemoveEventHandler = (element: any, eventname: string, handler: Function) => { };
var _RemoveEventHandlers = (element: any, eventname: string) => { };
var _EnsureEventHandler = (element: any, eventname: string, handler: Function) => { };

var _Attribute = (element: any, attributename: string, attributevalue?: string): string => "";
var _RemoveAttribute = (target: any, attributename: string) => { };

var _TagName = (element: any): string => "";
var _Property = (element: any, propertyname: string): string => "";
var _Value = (element: any, value?: string): string => "";
var _Html = (element: any, html?: string): string => "";
var _Text = (element: any, text?: string): string => "";

var _Remove = (element: any) => {
    if (!IsNull(element)) { element.remove(); }
        };
var _Append = (target: Element, element: Element) => { };
var _After = (target: Element, element: Element) => { };
var _Before = (target: Element, element: Element) => { };


var _HasClass = (element: any, classname: string): boolean => false;
var _AddClass = (element: any, classname: string) => {
    if (IsNull(element)) { return; } element.classList.add(classname);
};
var _RemoveClass = (element: any, classname: string) => { if (IsNull(element)) { return; } element.classList.remove(classname);};
var _Css = (element: any, value: string) => { };
var _Width = (element: any, value?: any) : number => -1;
var _Height = (element: any, value?: any) : number => -1;

var _Focus = (element: any) => {
    if (IsNull(element)) { return;} element.focus(); };
var _Show = (element: any) => {
    if (element != null) {
        element.style.removeProperty("display");
    } 
};
var _Center = (element: any) => { };
var _Hide = (element: any) => {
    if (element != null) {
        element.style.display = "none";
    }
};
var _ShowHide = (element: any) => {
    if (element != null) {
        if (element.style.display == "none") {
            element.style.removeProperty("display");

        } else {
            element.style.display = "none";
        }
    }
};
var _ToggleClass = (element: Element, classname: string) => {
    if (IsNull(element)) { return; }
    element.classList.toggle(classname);
};
var _ToggleClassForElements = (elements: Element[], classname: string) => {

    if (IsNull(elements)) { return; }
    elements.forEach(function (element) {
        element.classList.toggle(classname);

    });
};
var _Create = function <T>(tagname: string, attributes?: Object, html?: string): T {
    return <T>(<any>_CreateElement(tagname, attributes, html));
}
var _CreateElement=function(tagname: string, attributes?: Object, html?:string): Element
{
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
    if (!IsNull(html))
    {
        element.innerHTML = html;
    }
    return element;
};
var _IsVisible = (element: any):boolean => false;
var _Clone = (element: Element): Element => null;

var _SelectOne = (element: Element) => {
    if (IsNull(element)) { return; }
    var elements = element.parentElement.children;
    for (var i = 0; i < elements.length; i++)
    {
        elements[i].classList.remove("selected");
        if (elements[i] == element)
        {
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
var _Parents = function (a: any, stopat: any = null): Element[] {
    var els = [];
    var p = a.parentElement;
    while (p != null) {
        if (!p.nodeName.startsWith("#")) {
            els.push(p);

        }
        if (p == stopat) { p = null; }
        else
        {
            if (p.parentNode != null && p.parentNode.nodeName == "#document-fragment") {
                p = p.parentNode.host;
            } else {
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
 
interface Dictionary {
    [name: string]: any;
}
interface DictionaryOf<T> {
    [name: string]: T;
}


function LoadJS(path:string)
{
    var fileref = document.createElement('script')
    fileref.setAttribute("type", "text/javascript")
    fileref.setAttribute("src", path)

}
function GetFunctionBody(f: Function):string
{
    var result = "";
    var entire = f.toString();
    var body = entire.slice(entire.indexOf("{") + 1, entire.lastIndexOf("}"));
    return result;
}


function GetReturnStatement(f: Function): string
{
    var body = GetFunctionBody(f);
    var body = body.substring(body.lastIndexOf("return "));
    return body.substring(body.indexOf(" ") + 1);

}

function GetMemberExpression(f: Function): string
{
    return "";
}
function StringEquals(s1: any, s2: any): boolean
{

    if (typeof s1 == "string" && typeof s2 == "string")
    {
        return s1.toString().toLowerCase() == s2.toString().toLowerCase();
    }
    return false;
}

function ToBool(item: string): boolean
{
    return In(item.toLowerCase(), "true", "1");
}
function keyPress(key) {
    var keyEvent = new KeyboardEvent("keypress", <any>{ key: 13, shiftKey: false });

    document.dispatchEvent(keyEvent);
}
function SendKeys(txt: string, element?: HTMLInputElement)
{
    var e = IsNull(element) ? <HTMLInputElement>document.activeElement : element;
    var e = <HTMLInputElement>e;
    e.focus();
   
    e.value = txt;
    if (txt.endsWith('\n')) {
        //keyPress(13);
        e.dispatchEvent(new KeyboardEvent('keypress', <any>{ 'key': 13, 'keyCode':13 }));
        e.dispatchEvent(new KeyboardEvent('keydown', <any>{ 'key': 13, 'keyCode': 13 }));
        e.dispatchEvent(new KeyboardEvent('keyup', <any>{ 'key': 13, 'keyCode': 13 }));
    }
    
}
function ExcelColNameToIx(colname: string): string
{
    var result = "";
    var c = 0;
    for (var i = 0; i < colname.length; i++)
    {
        var n = colname.charCodeAt(i);
        if (n < 65 && n > 90)
        {
            return "";
        }
        var ix = n - 65 + 1;
        var px = (colname.length - 1 - i);
        var cx = Math.pow(26, px);
        c = c + (cx *ix);
    }
    return Format("{0}",c-1);
}
function ExcelColNameToPropertyName(obj:object, colname: string): string {
    var keys = Object.keys(obj);
    return keys[ExcelColNameToIx(colname)];
}
function GetNext<T>(items: T[], item:T): T
{
    if (items != null)
    {
        var ix = items.indexOf(item);
        if (ix > -1 && ix < items.length)
        {
            return items[ix + 1];
        }
    }
    return null;
}
function GetPrevious<T>(items: T[], item: T): T {
    if (items != null) {
        var ix = items.indexOf(item);
        if (ix > -1 && ix > 0) {
            return items[ix - 1];
        }
    }
    return null;
}
function HasNext(items: any[], item): any {
    if (items != null) {
        var ix = items.indexOf(item);
        if (ix > -1 && ix < items.length) {
            return true;
        }
    }
    return false;
}
function GetPart(data: any, startix: number, endix: number) {
    var part: any[] = [];
    if (IsArray(data)) {
        part = data.slice(startix, endix);
    }
    else
    {
        var ix = 0;
        for (var propertyName in data) {
            if (data.hasOwnProperty(propertyName)) {
                if (ix >= startix && ix < endix)
                {
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

function EnumerateObject(target: Object, context:any, func:Function)
{
    if (IsArray(target)) {
        var ix = 0;
        (<any[]>target).forEach(function (item) {
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
function StartsWith(text: string, item: string) {
    return text.indexOf(item)==0;
}
function EndsWith(text: string, item: string)
{
    return text.substring(text.length - item.length) == item;
}
function GetLength(data: any) {

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

function RemoveFrom(item: Object, items: any[])
{
    var ix = items.indexOf(item);
    if (ix > -1) {
        items.splice(ix, 1);
    }
}

function LastFrom(items: any[]): any
{
    var result = null;
    if (items.length > 0)
    {
        result = items[items.length - 1];
    }
    return result;
}



function CallFunctionFrom(eventcontainer: Object, eventname: string, args?: any[])
{
    if (!IsNull(eventcontainer))
    {
        if (eventname in eventcontainer && IsFunction(eventcontainer[eventname]))
        {
            eventcontainer[eventname](args);
        }
    }
}

function CallFunction(func: Function, args?: any[]):any
{
    if (!IsNull(func) && IsFunction(func)) {
        return func.apply(this, args);

    }
    
}

function CallFunctionWithContext(context:any, func: Function, args?: any[]):any {
    if (!IsNull(func) && IsFunction(func)) {
        return func.apply(context, args);
    }
    return null
}


function callasync(func:Function, timeout:number=0) {
    setTimeout(function () {
       
        func();
    }, timeout);
}




function GetHashPart(item:string)
{
    var hash_ix = item.indexOf("#");
    item = hash_ix > -1 ? item.substring(hash_ix + 1) : "";
    return item;
}
function clearobject(item: any)
{
    if (typeof item == "string") {
        item = "";
    } else {
        for (var propertyName in item) {
            delete item[propertyName];
        }
    }
}


function GetErrorObj(exception, contenttype?:string) {
    var exceptiontext = "responseJSON" in exception ? exception["responseJSON"] : "";
    var stacktrace = "";
    var errorobj = { message: "", stacktrace: "" };
    if (contenttype == "text/html")
    {
        errorobj.message = exception["responseText"];
        return errorobj;
    }
    if ("responseJSON" in exception) {
        if (typeof (exception["responseJSON"]) == "object") {
            exceptiontext = exception["responseJSON"].Message;
            stacktrace = exception["responseJSON"].StackTrace;
        } else
        {
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

function SetProperty(target:Object, name:string, value:any)
{
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
};

/*Strings*/

function TextBetween(text: string, begintag: string, endtag: string, withtags?: boolean):string {
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
    if (withtags)
    {
        result = begintag + result + endtag;
    }
    return result;
};

function TextsBetween(text:string, begintag:string, endtag:string,withtags:boolean):string[] {
    var result:string[]=[];
    while (text.indexOf(begintag) > -1 && text.indexOf(endtag)>-1)
    {
        var item = TextBetween(text, begintag, endtag);
 
        if (withtags) {
            var fullitem = begintag + item + endtag;
            result.push(fullitem);
        } else
        {
            result.push(item);
        }

        text = text.substring(text.indexOf(endtag) + endtag.length);
    }
    return result;
};
function FormatSimpleTest(...any): string {
    var args = Array.prototype.slice.call(arguments, 1);
    var format = arguments[0];
    return format.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined'
            ? args[number]
            : match
            ;
    });
};
function FormatSimple(format:string ,args:any[]): string {
    return format.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] != 'undefined'
            ? args[number]
            : match
            ;
    });
};

function ResFormat(key, ...any): string {
    return Format(Res(key), arguments);
}
function Format(...any):string {
    var args:any[] = Array.prototype.slice.call(arguments, 1);
    //if (args.length == 1)
    //{
    //    if (IsArray(args[0]))
    //    {
    //        args = args[0];
    //    }
    //    //if 
    //}

    var format = <string>arguments[0];
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
        } else {
            ix = Number(inner);
        }
        var arg = args[ix]
        if (!IsNull(format)) {
            if (arg instanceof Date) {
                arg = FormatDate(<Date>arg, partformat);
            }
            if (IsNumeric(arg) && (!(arg instanceof Date))) {
                if (partformat.toLowerCase().indexOf("d") == 0) {
                    var padnr = Number(partformat.substring(1));
                    arg = pad(Number(arg), padnr, "0", 0);
                } else
                {
                    if (!IsNull(partformat)) {
                        arg = window["formatnumber"](partformat, arg);
                    }
                }
            }
        }
        result = Replace(result, "xF<w&", "{");
        result = Replace(result, "xF>w&" , "}");
        result = Replace(result, item, arg);
    });

    return result;
  
};
function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
} 
function StringToDate(item: string, format: string = ""): Date
{
    if (IsNull(item)) { return null; }
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
    } else
    {
        return new Date(item);
    }

    var d: Date = null;
    try {
        d = new Date(Number(parts[y_ix]),
            Number(FirstNotNull(parts[m_ix], 1)-1),
                Number(FirstNotNull(parts[d_ix], 1))
                );
    } catch (ex) {
        d = null;
    }
    return d;
}
function IsDate(p)
{
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
    return a = (a || c || 0) + '', b = new Array((++b || 3) - a.length).join(c || 0), d ? a + b : b + a
}
function Property(item: any, property: string, value?: any):any
{
    if (typeof value === "undefined" && !IsNull(item)) {
        if (property in item) { return item[property]; }
        return null;
    }
    else
    {
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
            value = eval(key); root = true;
        } else {
            value = value && value[key];
        }
    });
    return (typeof value != 'undefined' && value !== null);
};
function AddToArray(item:any[], ...any):any[]
{
    if (arguments.length < 2)
        return [];
    else {
        var array: any[] = Array.prototype.slice.call(arguments, 0);
        array.splice(0, 1);
        array.forEach(function (item_i:any) {
            if (item.indexOf(item_i) == -1)
            {
                item.push(item_i)
            }
        });
        return item;
    }
}
function In(item,...any) {
    if (arguments.length < 2)
        return false;
    else {
      
        var array: any[] = Array.prototype.slice.call(arguments, 0);
       
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
        var array:any[] = Array.prototype.slice.call(arguments, 0);
        array.splice(0, 0);
        var nullcount = 0;
        array.forEach(function (item_i) {
            if (IsNull(item_i))
            {
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
        var array: any[] = Array.prototype.slice.call(arguments, 0);
        for (var i = 0; i < array.length; i++)
        {
            if (!IsNull(array[i])){ return array[i];}
        }
 
        return null;
    }
}

function IsAllNotNull(item, ...any) {
    if (arguments.length < 1)
        return false;
    else {
        var array: any[] = Array.prototype.slice.call(arguments, 0);
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

function removeFromArray(arr,...any) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax = arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}

function Equals(arg1: any, arg2: any):boolean
{
    if (typeof (arg1) == "string" && typeof (arg2) == "string")
    {
        return (arg1.toLowerCase() == arg2.toLowerCase());
    }
    return arg1 == arg2;
}

function GetClientQueryString(hash?: string): KeyValue[] {
    if (hash==null) { hash = window.location.hash; }
    var parameters: KeyValue[] = [];
    if (hash.indexOf("?") > -1) {
        hash = hash.substring(hash.indexOf("?") + 1)
    }
    if (hash.length > 2) {

        var items = hash.split("&");
        items.forEach(function (item) {
            var kv = <KeyValue>{};
            var psplit = item.split("=");
            kv.Key = psplit[0].trim().toLowerCase();
            kv.Value = psplit[1].trim();
            parameters.push(kv);

        });
    }
    return parameters;
}

function ToHierarchy(items, idproperty, parentproperty, rootid) {
    if (!rootid) { rootid == null; }
    var Children = items.where(function (i) { return i[parentproperty] == rootid; });

    Children.forEach(function (item) {
        var parentid = item[idproperty];
        item.Children = ToHierarchy(items, idproperty, parentproperty, parentid);
    });
    return Children;
};

function GetHierarchy(items: any[], idproperty: string, parentproperty: string,setparents:boolean=false): object[]
{
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
    return s.split("").reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
}
function GetFlattenedHierarchy(items: any[], idproperty: string, childproperty: string="Children",level:number=0): object[] {
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

function ForAll(hierarchy: Object,childrenproperty:string, func:Function, parent:Object=null, level:number=0)
{
    func(hierarchy, parent, level);
    if (childrenproperty in hierarchy)
    {
        var children = hierarchy[childrenproperty];
        if (!IsNull(children) && IsArray(children))
        {
            (<any[]>children).forEach(function (item) {
                ForAll(item, childrenproperty, func, hierarchy, level+1);
            });
        }
    }
}

function Clone(obj:Object):Object {

    if (null == obj || "object" != typeof obj) return obj;
    var copy = {};
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function IsNull(item: any): boolean {
    //return item == 'undefined' || item == null || (typeof (item) == "string" && item == "");
    return item === undefined || item == null || item === "";
};

function IsNullObj(a): boolean {
    for (let key in a) {
        return false;
    }
    return true;
}

function Coalesce(...items: any[]): any {
    var result = null;
    for (var i = 0; i < items.length-1; i++) {
        if (!IsNull(items[i])) { return items[i]; }
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
function Guid():string {
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}
/*End Objects*/

/*HTML*/
function ToHtmlAttributeListString(obj:Object) {
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
};

function RenderHierarchy(obj: Object, itemformatter?: Function, level: number = 0) {
    var html = "";
    var children: any[] = obj["Children"];
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
};

function HtmlToText(html: string): string {
    var tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

function ToString(item: Object)
{
    return IsNull(item) ? "" : item.toString();
}



function Truncate(item: string, limit?: number) {
    var result = "";
    if (IsNull(limit)) { limit = 40; }
    if (typeof item == "string") {

        if (item.length > limit) {
            result = item.substring(0, limit) + "...";
        } else {
            result = item;
        }
    }
    return result;
}


/*End HTML*/
function IsNumberBetween(min: any, max: any, value: number): boolean {
    var result = false;
    result = min <= value && (IsNull(max) || max >= value);
    return result;
}
/*DateTime*/
function IsDateBetween(startdate: any, enddate: any, date?: Date): boolean {
    var result = false;
    if (IsNull(startdate)) { return false; }
    if (IsNull(date)) {
        date = new Date();
        date.setHours(0, 0, 0, 0);
    }
    if (startdate === startdate.toString())
    {
        startdate = JsonToDate(startdate);
    }
    if (startdate <= date) {
        if (IsNull(enddate)) {
            return true;
        } else
        {
            if (enddate === enddate.toString()) {
                enddate = JsonToDate(enddate);
            }
            return enddate >= date;
        }

    }
    return result;
}
function JsonToDate(item: string): Date {
    if (IsNull(item)) { return null; }
    var x = item.match(/\d+/)[0];
    var nr:any = +x;
    return new Date(nr);
}

function ToDate(item: string)
{
    return FormatDate(JsonToDate(item));
}

function DateDiff(startDate: string | Date, endDate: string | Date, by?: string): number {
    let date1: Date = <Date>startDate;
    let date2: Date = <Date>endDate;
    let allowed = ["d", "h", "m", "s", "ms"];

    if (allowed.indexOf(by) < 0) {
        console.warn("Invalid @by parameter in the DateDiff function. Try the followings: 'd', 'h', 'm', 's', 'ms' !");
    }

    if (typeof (startDate) == "string") {
        date1 = new Date(startDate);
    }

    if (typeof (endDate) == "string") {
        date2 = new Date(endDate);
    }

    let diffInTime = date2.getTime() - date1.getTime();
    let divider;

    switch (by) {
        case "d":
            divider = 1000 * 3600 * 24;
            break;
        case "h":
            divider = 1000 * 3600;
            break;
        case "m":
            divider = 1000 * 60;
            break;
        case "s":
            divider = 1000;
            break;
        case "ms":
            divider = 1;
            break;
        default:
            divider = 1000 * 3600;
            break;
    }

    return diffInTime / divider;
}

function ToNormalDate(item:string):string {
    return FormatDate(JsonToDate(item));
}
 
function FormatDate(d: Date, format?: string): string {
    if (IsNull(format)) { format = "yyyy/MM/dd hh:mm:ss"; }
    if (IsNull(d)) { return ""; }
    //return $.formatDateTime(format, d);
    return formatDate(d,format);
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
}
function xpad(n, width, z?) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
function leftpad(n, width, z?) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
function rightpad(n, width, z?) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : n + new Array(width - n.length + 1).join(z);
}
/*End DateTime*/
function sharedStart(array) {
    var A = array.concat().sort(),
        a1 = A[0], a2 = A[A.length - 1], L = a1.length, i = 0;
    while (i < L && a1.charAt(i) === a2.charAt(i)) i++;
    return a1.substring(0, i);
}
function longestCommonSubstring(array) {
    // Copy the array
    let arr = array.slice().sort();
    // For each individual string sort them 
    arr = arr.map(a => a.split('').sort().join(''));
    // Check the first and last string and check till chars match
    let a0 = arr[0],
        aLast = arr[arr.length - 1],
        len = arr[0].length,
        i = 0;
    while (i < len && a0[i] === aLast[i]) i++;
    // return
    return a0.substring(0, i);
}

function commonwords(array: any[])
{
    var strings = <string[]>array;
    var words = [];
    for (var i = 0; i < strings.length; i++)
    {
        words.push(strings[i].split(' ').Where(i=>!IsNull(i)));
    }
    var common = [];
    for (var i = 0; i < words.length; i++) {
        if (common.length == 0) {
            common = words[i];
        } else
        {
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
            if (result.obj) { result.typename = result.obj['TypeName']; }

        }
        if (c == parts.length - 1) {
            result.propertyname = key;
        }
        c++;
    });
    result.resourceid = Format("Models.{0}.{1}", result.typename, result.propertyname);
    var val = eval(exp);;
    result.value = val ? val : "";
    return result;
};
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
        } else {
            html += Format('<li class="file ext_{2}"><a href="#" rel="{1}{0}">{0}</a></li>', item.ID, item.Directory, item.Extension);
        }
    });
    html += "</ul>";
    return html;

}



function browserSupportsWebWorkers():boolean {
    //return typeof window.Worker === "function";
    return false;
}


function ToOptionList(obj: Object, addemptyoption:boolean): string
{
    var result = "";
    if (addemptyoption)
    {
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

function NormalizeFolderPath(folder: any): string
{
    if (folder == null) { folder = ""; }
    if (folder.indexOf("~") == 0) { folder = folder.substring(1); }
    if (folder[folder.lentgh - 1] != "/")
    {
        folder = folder + "/";
    }

    return folder;
}


function Eval(obj)
{
    if (IsNull(obj)) { return null; }
    if (IsFunction(obj)) { return obj(); }
    return obj;
}

function IsFunction(functionToCheck) {
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}
function IsObject(obj) {
    return obj === Object(obj);
}
function IsArray(value: any) {
    if (Array.isArray) {
        return Array.isArray(value);
    }
    return false;
}

function Split(text: string, delimeters: any, removeempty:boolean)
{
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
    if (removeempty)
    {
        var resultwithoutempty = [];
        result.forEach(function (item) {
            if (!IsNull(item.trim()))
            {
                resultwithoutempty.push(item);
            }
        });
        return resultwithoutempty;
    }
    return result;

}

function EvalOn<T>(obj: T,f:Func1<T,any>)
{
    var entire = f.toString();
    var body = entire;

    //var body = entire.slice(entire.indexOf("{") + 1, entire.lastIndexOf("}"));
    var parts:string[] = body.split("=>").Select(i => i.trim());
    var varpart = parts[0];
    var bodypart = parts[1];
    var varname = varpart.split(":").FirstOrDefault();
    bodypart = bodypart.replace(varname + ".", "");
    if (bodypart.indexOf("{") > -1) {
        bodypart = TextBetween(bodypart, "{", "}");
    }
    if (bodypart.startsWith("return"))
    {
        bodypart = bodypart.substring(7);
    }
    return Access(obj, bodypart);
}

function Access(obj, key, context?) {
    if (key == null) { return obj; }
    key = key.replace("model.", "this.");
    var encode = false;
    var encindex = key.indexOf("~");
    if (encindex == 0)
    {
        encode = true;
        key = key.substring(1);
    }
    var result = null;
    if (key.indexOf("html.") == 0)
    {
        try { 
            result = eval(HtmlDecode(key));
            return result;
        } catch (err)
        {
            console.error(err);
        }
    }
    if (key == "this") { result = obj; }
    else
    {
        result = key.split(".").reduce(function (o, x) {
            return (typeof o == "undefined" || o === null) ? o : o[x];
        }, obj);
    }
    result = IsNull(result) ? "" : result
    if (encode)
    {
        result = HtmlEncode(result);
    }
    return result;
}

function SetPropertyPath(obj: object, path: string, value: any) {

    var parts = path.split(".");
    var lastpart = parts[parts.length - 1];
    var currentobj = obj;
    var setpart = function (targetobj: any, part: string, val: any): any {
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
        } else {
            if (!(part in targetobj)) {
                targetobj[part] = val;
            }
            result = targetobj[part]
        }
        return result;
    }
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
                {id:"v1p1",pname:"p1",value:11}
            ]
        },
        {
            id: "v2", name: "v2 name", properties: [
                { id: "v2p1", pname: "p1", value: 101 },
                { id: "v2p2", pname: "p2", value: 102 }
            ]
        }

    ]
}
function ObjToPathList(obj: object): string[]
{
    var result = [];
    for (var key in obj) {
        var val = obj[key];
        if (!IsNull(val) && IsObject(val)) {
            var subpath = ObjToPathList(val);
            result.push.apply(result, subpath.Select(sp => key + "." + sp));
        } else {
            result.push(key);
        }
    }
    return result;
}

function ObjToPathValueList(obj: object, path:string=""): string[] {
    var result = [];
    for (var key in obj) {
        var val = obj[key];
        if (!IsNull(val) && IsObject(val)) {
            result.push.apply(result, ObjToPathValueList(val, path + key + "."));

        } else {
            result.push([path+key , val]);
        }
    }
    return result;
}


function ExtractPaths(obj: object, paths: string[]): object
{
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
                for (var ix = 0; ix < pathvalue.length; ix++)
                {
                    var item = pathvalue[ix];
                    result[path].push(ExtractPaths(item, subparts))
                    
                } 
            }
        }
        if (!(pathvalue instanceof Object)) {
            CopyProperty(obj, result, path);
        }
    }
    return result
}
function SetPath(obj: object, path: string, value: any)
{

    var parts = path.split(".");
    var lastpart = parts[parts.length - 1];
    var currentobj = obj;
    var setpart = function (targetobj:any, part: string, val:any): any
    {
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
        } else
        {
            //if (!(part in targetobj)) {
            //    targetobj[part] = val;
            //}
            targetobj[part] = val;

            result = targetobj[part]
        }
        return result;
    }
    for (var i = 0; i < parts.length-1; i++) {
        var part = parts[i];
        currentobj = setpart(currentobj, part, IsNull(currentobj[part]) ? {} : currentobj[part]);
    }
    var lastparts = lastpart.split(",");
    for (var i = 0; i < lastparts.length; i++)
    {
        setpart(currentobj, lastparts[i], value);

    }
}

function GetPath(obj: object, path: string) {

    var parts = path.split(".");
    var lastpart = parts[parts.length - 1];
    var currentobj = obj;
    var setpart = function (targetobj: any, part: string, val: any): any {
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
        } else {
            if (!(part in targetobj)) {
                targetobj[part] = val;
            }
            result = targetobj[part]
        }
        return result;
    }
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        currentobj = setpart(currentobj, part, {});
    }
    return currentobj;
}

function PathMap(source: object, target: object)
{
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
function OuterHtml(item: Element): string
{
    return item.outerHTML;
    //return item.wrapAll('<div>').parent().html(); 
}
async function Wait(duration: number): Promise<any> {
    var promise = new Promise<any>((resolve, reject) => {
        callasync(resolve, duration);
    });

    return promise;
}

function Replace(text:string, texttoreplace:string, textwithreplace:string):string
{
    textwithreplace = IsNull(textwithreplace) ? "" : textwithreplace;
    return "" + text.split(texttoreplace).join(textwithreplace);
}

function Bind_Replace(text: string, texttoreplace: string, textwithreplace: string): string {
    //return text.replace(Format("{0}", texttoreplace), textwithreplace);
    return text.split(texttoreplace).join(textwithreplace);
}
function RoundNumber(value: any, decimals: number): number
{
    if (IsNull(value)) { return null; }
    return Number((<number>value).toFixed(decimals));
}
interface KeyValue
{
    Key: any;
    Value: any;
}
 
function GetProperties(item: Object): KeyValue[]
{
    var properties: any[] = [];
    for (var propertyName in item) {
        if (item.hasOwnProperty(propertyName) && !(item[propertyName] instanceof Function)) {
            var propertyValue = item[propertyName];
            var kv = <KeyValue>{};
            kv["Key"] = propertyName;
            kv["Value"] = propertyValue;
            properties.push(kv)
        }
    }
    return properties;
}

function GetKeys(item: Object): any[] {
    var properties: any[] = [];
    for (var propertyName in item) {
        if (item.hasOwnProperty(propertyName)) {
            var propertyValue = item[propertyName];
            properties.push(propertyName);
        }
    }
    return properties;
}

function GetPropertiesArray(item: Object): Object[] {
    var properties: any[] = [];
    for (var propertyName in item) {
        if (item.hasOwnProperty(propertyName)) {
            var propertyValue = item[propertyName];
            properties.push(propertyValue)
        }
    }
    return properties;
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

Array.prototype.FirstOrDefault = function (func?:Function) {
    var items = this;
    if (func == null) {
        if (items.length > 0) { return items[0];}
    }
    for (var i = 0; i < items.length; i++) {
        if (func(items[i])) { return items[i];}
    }
    return null;
};

Array.prototype.Skip = function (val: number) {
    var items = this;
    var result = [];
    var startix = val - 1;
    for (var i = startix; i < items.length; i++) {
        result.push(items[i]); 
    }
    return result;
};

Array.prototype.Where = function (func?: Function) {
    var items = this;
    var result = [];
    for (var i = 0; i < items.length; i++) {
        if (func(items[i])) { result.push( items[i]); }
    }
    return result;
};

Array.prototype.OrderBy = function (func?: Function) {
    var items:[] = Array.prototype.slice.call(this);
    var sortfunction = function (a, b) {
        /* next line works with strings and numbers, 
         * and you may want to customize it to your needs
         */
        var result = (func(a) < func(b)) ? -1 : (func(a) > func(b)) ? 1 : 0;
        return result;
    }
    items.sort(sortfunction);
    return items;
};
Array.prototype.OrderByDescending = function (func?: Function) {
    var items: [] = Array.prototype.slice.call(this);
    var sortfunction = function (a, b) {
        /* next line works with strings and numbers, 
         * and you may want to customize it to your needs
         */
        var result = (func(a) < func(b)) ? -1 : (func(a) > func(b)) ? 1 : 0;
        return result * -1;
    }
    items.sort(sortfunction);
    return items;
};

Array.prototype.Select = function (func?: Function) {
    var items = this;
    var result = [];
    for (var i = 0; i < items.length; i++) {
        result.push(func(items[i]));
    }
    return result;
};

Array.prototype.Distinct = function (func?: Function) {
    var items: any[] = this;
    let funcresult = [];
    let result = [];
    for (let i = 0; i < items.length; i++) {
        let fi = func(items[i]);
        if (funcresult.indexOf(fi) == -1) {
            funcresult.push(fi)
            result.push(items[i]);
        }
    }
    return result;
};

Array.prototype.SelectAs = function (func?: Function) {
    var items = this;
    var result = [];
    for (var i = 0; i < items.length; i++) {
        result.push(func(items[i]));
    }
    return result;
};
Array.prototype.SelectMany = function (func?: Function) {
    var items = this;
    var result = [];
    for (var i = 0; i < items.length; i++) {
        result.push.apply(result, func(items[i]));
    }
    return result;
};
Array.prototype.Sum = function (func?: Function) {
    var items = this;
    var result = 0;
    for (var i = 0; i < items.length; i++) {
        var val = func(items[i]);
        result = result + (isNaN(val) ? 0 : val);
    }
    return result;
};
Array.prototype.Max = function (func?: Function) {
    var items = this;
    var result = null;
    for (var i = 0; i < items.length; i++) {
        var val = func(items[i]);
        if (result == null) {
            result = val;
        } else
        {
            if (val > result)
            {
                result = val;
            }
        }
    }
    return result;
};
Array.prototype.Min = function (func?: Function) {
    var items = this;
    var result = null;
    for (var i = 0; i < items.length; i++) {
        var val = func(items[i]);
        if (result == null) {
            result = val;
        } else {
            if (val < result) {
                result = val;
            }
        }
    }
    return result;
};

interface Date {
    IsWeekend(): boolean;
}

Date.prototype.IsWeekend = function (): boolean {
    return this.getDay() % 6 == 0;
}

function IsWeekend(date: Date): boolean {
    return date.getDay() % 6 == 0;
}

function dynamicSort(property, sortOrder=1) {
    return function (a, b) {
        /* next line works with strings and numbers, 
         * and you may want to customize it to your needs
         */
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

function ForeachInHierarchy(obj: object,func:Function, childrenpropertyname:string= "Children") {
    func(obj);
    var items = <[]>obj[childrenpropertyname];
    for (var i = 0; i < items.length; i++)
    {
        ForeachInHierarchy(items[i], func, childrenpropertyname);
    }
}
function ForeachInHierarchy2(obj: object, func: Function, childrenpropertyname: string = "Children") {
    var items = <[]>obj[childrenpropertyname];
    for (var i = 0; i < items.length; i++) {
        ForeachInHierarchy2(items[i], func, childrenpropertyname);
    }
    func(obj);

}
function WhereInHierarchy(obj: object, func: Function, childrenpropertyname: string = "Children") {
    var items = <[]>obj[childrenpropertyname];
    var result = [];
    if (func(obj))
    {
        result.push(obj);
    }
    for (var i = 0; i < items.length; i++) {
        result.push.apply(result, WhereInHierarchy(items[i], func, childrenpropertyname));
    }
    return result;

}
function ParentsOfHierarchy(obj: object, parentpropertyname: string = "Parent") {
    var items = [];
    var parent = obj[parentpropertyname];
    var maxcount = 100;
    var c = 0;
    while (parent != null && c < maxcount)
    {
        items.push(parent);
        parent = parent[parentpropertyname];
        c++;
    }
    return items;
}

function FindInHierarchy(obj: object, func: Function, childrenpropertyname: string = "Children"): object {
    if (func(obj)) {
        return obj;
       
    }
    else
    {
        var items = <[]>obj[childrenpropertyname];
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
function Log(item, ext?)
{
    var message = item + (ext == null ? "" : ":" + ext);
    console.log(message);
    if (getUrlParameter("debug") != "1") {
        var log = document.querySelector('#log');
        var msg = document.createElement('code');
        var verb = "log";
        msg.classList.add(verb);
        msg.textContent = FormatDate(new Date(),"hh:mm:ss")+" "+ message;
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

interface IDictionary<T> {
    [key: string]: T;
} 
class Tasks
{
    private static taskNr:number = 0;
    public static StartTask(name:string) {
        Tasks.taskNr = Tasks.taskNr + 1;
        ShowProgress(name);
    }
    public static EndTask(name:string) {
        Tasks.taskNr = Tasks.taskNr - 1;
        if (Tasks.taskNr == 0)
        {
            HideProgress(name);
        }
    }
}

function ShowProgress(src:string="" )
{
    var p = document.getElementById("progress");
    if (p != null) {
        _Show(p);
    }

}
function HideProgress(src: string = ""  ) {
    var p = document.getElementById("progress");
    if (p != null) {
        _Hide(p);
    }

}

function IsDataContainer(element: Element) {
    if (element.tagName == "TEXTAREA") { return true; }
    if (element.tagName == "SELECT") { return true; }
    var type = element.getAttribute("type");
    if (element.tagName == "INPUT" && type != "button") { return true; }
    if (element.hasAttribute("bind")) { return true;}
    return element.hasAttribute("value");

}
function GetPropertyandValue(element: Element)
{
    if (element != null)
    {
        var fieldname = FirstNotNull(element.getAttribute("bind"), element.getAttribute("name"));
        var hasvalue = element.hasAttribute("value");
        var value = element.getAttribute("value");
        var valueType = (fieldname == "Quantity") ? "valueAsNumber" : "value";
        if (!IsNull(fieldname)) {
            if (element.tagName == "INPUT"
                || element.tagName == "SELECT"
                || element.tagName =="APP-AUTOCOMPLETE"
                || element.tagName =="APP-OBJECTPICKER"
            ) {
                return { Key: fieldname, Value: (<HTMLInputElement>element)[valueType] };
            } else
            {
                return { Key: fieldname, Value: FirstNotNull(value, element.innerHTML) };

            }
          
        }

    }
    return null;
}




function EnsureProperrty(obj:Object,property:string,defaultvalue:any=null)
{
    if (!obj.hasOwnProperty(property))
    {
        obj[property] = defaultvalue;
    }
}
 
function CopyProperty(source: Object, target: Object, property: string, targetproperty:string="")
{
    if (source.hasOwnProperty(property)) {
        if (IsNull(targetproperty)) { targetproperty = property;}
        target[targetproperty] = source[property];
    }
} 
 




function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

function getTextAreaLineNr(element: HTMLTextAreaElement) {
    return element.value.substr(0, element.selectionStart).split("\n").length;
}​



function Activate(a: Element, container: Element)
{
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
function ActivateOld(a: Element) {
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
            } else {
                _Show(others[i])
            }
         
            // Do stuff
        }
        a.classList.add("selected");


    }
}
function SelectElement(parent: Element, child: Element) {

    for (var i = 0; i < parent.children.length; i++) {
        parent.children[i].classList.remove("selected");
        // Do stuff
    }
    child.classList.add("selected");
    child.scrollIntoView(false);
    parent.scrollLeft = (<any>child).offsetLeft-40;
}

function ActivateFloat(element: Element)
{

}

function JsonCopy(obj: object): any
{
    if (IsNull(obj)) { return null;}
    return JSON.parse(JSON.stringify(obj));
}
function GetHtml2(obj: any,span:string="") {
    var htmlbuilder = [];
    if (!(obj instanceof Object)) {
        return Format("{0}", obj);
    }
    htmlbuilder.push(span+'<ul>')
    for (var key in obj)
    {
        htmlbuilder.push(span + '<li>');
        htmlbuilder.push(span + key+": ");
        var val = obj[key];
        if (val instanceof Array) {
            htmlbuilder.push(span + Format("[{0}]", (<any[]>val).Select(i => GetHtml2(i)).join(',')));

        }
        else if  (val instanceof Element) {

        }
        else if (IsFunction(val)) {

        }
        else //if (val instanceof Object)
        {
            htmlbuilder.push(span + GetHtml2(val, span + "   "));
        }
        htmlbuilder.push(span + '</li>');
    }
    htmlbuilder.push(span + '</ul>')

    return"{"+ htmlbuilder.join('\n')+"}";
}
function GetHtml(obj: Object)
{
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
        } else
        {
            baseobject[propertyname] = propertyvalue
        }

    }
    if ("TypeName" in obj)
    {
        htmlbuilder.push(Format('<h2>{0}: {1}</h2>', obj["TypeName"], obj["Id"]));

    }
    htmlbuilder.push("<div class='content'>");
    for (var key in baseobject)
    {
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

function CsvLineSplit(text:string, delimiter: string = ",", enclose: string = '"'): string[]
{
    var result: string[] = [];
    text = Format("{0}", text);
    var encloseix = -1;
    var currentencloseix = -1;
    var isenclosed = false;
    var gathered = "";
    for (var i = 0; i < text.length; i++)
    {
        var c = text[i];
        if (c == delimiter) {
            if (isenclosed) {
                gathered = gathered + c;
            } else
            {
                result.push(gathered);
                gathered = "";
                
            }
            continue;
        }
        if (c == enclose)
        {
            if (encloseix==-1) {
                encloseix = i;
                isenclosed = true;
                continue;
            }
            if (encloseix >-1 && encloseix != i)
            {
                isenclosed = false;
                encloseix = -1;
            }
            continue;
        }
        gathered = gathered + c;
    }
    if (gathered.length > 0)
    {
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

function getStringCompareFunction(p: Function) {
    return function (a, b) { return compareString(p(a), p(b)); };
}
function RestoreModel(item:object, fielddictionary:object): object
{
    var modelitem = {};
    for (var key in fielddictionary) {
        var fieldix = fielddictionary[key];
        if (key.indexOf(".") == -1) {
            if (item[fieldix] !== undefined) {
                modelitem[key] = item[fieldix];
            }
        } else {
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
    var raw = <any>window.atob(parts[1]);
    var rawLength = raw.length;

    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
}

//This func. for checking if a required input field is filled out
function _RequiredFieldHandle(uielement) {
    var requiredSimpleFields = _Select("input.required", uielement);
    var requiredChildFields = _Select(".required input", uielement);
    var autocompletes = _Select("app-autocomplete.required", uielement);
    var discountType = _SelectFirst("select[bind=DiscountType]", uielement);

    var requiredFields = requiredSimpleFields.concat(requiredChildFields);
    var allRequiredFields = requiredFields.concat(autocompletes);

    if (!IsNull(discountType)) {
        allRequiredFields.push(discountType);
    }

    allRequiredFields.forEach((field: HTMLInputElement) => {
        var event = new Event("load");
        setBackground(event, field);
        field.addEventListener("keyup", setBackground);
        field.addEventListener("change", setBackground);
    });

    function setBackground(event, field?) {
        var target = Coalesce(field, event.target);
        var input = target;
        var requiredFields = ["Quantity", "Unitprice", "Discount"];
        var canBeZero = true;
        var value = input.value;

        if (target.tagName == "APP-AUTOCOMPLETE") {
            input = target.shadowRoot.querySelector("input[type=text]");
        }

        var bind = input.getAttribute("bind");

        if (requiredFields.indexOf(bind) > -1 && value == 0) {
            canBeZero = false;
        }

        if (bind == "Discount") {
            var discounttype = input.getAttribute("discounttype");
            if (discounttype == 33 || IsNull(discounttype)) {
                canBeZero = true;
                value = " ";
            }
        }

        if (target.tagName == "SELECT") {
            input = <HTMLInputElement>_SelectFirst("input[bind=Discount]", uielement);
            if (input.value == "") {
                (value == 33) ? value = " " : value = "";
            } else {
                (value != 33 && input.value == 0) ? canBeZero = false : canBeZero = true;
            }
        }

        if ((!IsNull(value) && canBeZero)) {
            input.style.background = "white";
        } else {
            input.style.background = "var(--required-field-color)";
        }
    }
}

//Use it if you want to dispatch an event after setting an input value.
function SetInputValueWithEvent(input: HTMLInputElement, value: any, event: string | Event) {
    input.value = value;
    var ev = (typeof event == "string") ? new Event(event) : event;
    input.dispatchEvent(ev);
}

class Timer
{
    private isrunning = false;
    public tickms:number = 1000;
    public Elpased: Function = () => { };
    constructor() { }
    public Start()
    {
        var me = this;
        this.isrunning = true;
        setTimeout(me.Tick.bind(me), me.tickms);
    }
    public Stop()
    {
        this.isrunning = false;
    }
    private Tick()
    {
        var me = this;
        if (this.isrunning) {
            setTimeout(me.Tick.bind(me), me.tickms);
            me.Elpased();

        }
    }
}

function AsArrayOf<T>(obj: any): T[]
{
    if (IsNull(obj)) { return []; }
    if (!IsArray(obj)) { return []; }
    return <T[]>obj;
}

        /*Custom functions to MGA*/

function GetPropertyByShortname(properties: Object[], shortname: string): string {
    var propertyvalue: string;
    for (var i in properties) {
        if (properties[i]["ShortName"] == shortname) {
            propertyvalue = properties[i]["Value"];
            return propertyvalue;
        }
    }
}

function TransformNumber(number: number, numberofdecimal: number): string {
    var numberofzeros = rightpad('', numberofdecimal);
    var format = '{0:####.' + numberofzeros + '}';
    var formatednumber = Format(format, number);
    var result = formatednumber.replace('.', '');
    return result;
}

var numbers = Object.freeze([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(m => m.toFixed(0)));

function Hash(length: number, date: Date = new Date()): string {
    let hash = date.getTime().toFixed(0);
    while (length > hash.length) {
        hash += numbers[Math.floor(Math.random() * (numbers.length - 1))];
    }
    hash = hash.substring(hash.length - length);

    for (let i = 0; i < Math.floor(length / 2) + 1; ++i) {
        hash = hash.replace(numbers[Math.floor(Math.random() * (numbers.length - 1))], String.fromCharCode(Math.floor(Math.random() * 25 + 97)));
    }

    return hash;
}

function generateIDBKey(model): string {
    let date = new Date();
    let hash = Hash(5, date);
    return model.TypeName + "-" + FormatDate(date, "yyyyMMdd") + "-" + hash;
}

var __SyncronizationStore__ = {};

/**
 * Syncronizes the given function by the given key.
 *
 * @param key
 * @param callback annonimus innerfunction containing the block that needed to be syncronized.
 * @returns the result is typeof T.
 */
function SyncronizeAs<T>(key: string, callback: Func<T>): T {
    if (!__SyncronizationStore__[key]) {
        try {
            __SyncronizationStore__[key] = true;
            return callback();
        } finally {
            __SyncronizationStore__[key] = false;
        }
    }
}

/**
 * Syncronizes the given function by the given key.
 *
 * @param key
 * @param callback annonimus innerfunction containing the block that needed to be syncronized.
 * @returns the result is any.
 */
function Syncronize(key: string, callback: Func<any>): any {
    if (!__SyncronizationStore__[key]) {
        try {
            __SyncronizationStore__[key] = true;
            return callback();
        } finally {
            __SyncronizationStore__[key] = false;
        }
    }
}

/**
 * Syncronizes the given function by the given key.
 *
 * @param key
 * @param callback annonimus innerfunction containing the block that needed to be syncronized.
 * @returns the result is Promise<typeof T>.
 */
function PromiseSyncronizeAs<T>(key: string, callback: Func2<Action<T>, Action<any>, T>): Promise<T> {
    if (!__SyncronizationStore__[key]) {
        try {
            __SyncronizationStore__[key] = true;
            return new Promise(async (a, r) => {
                await callback(a, r);
                __SyncronizationStore__[key] = false;
            })
        } catch (ex) {
            __SyncronizationStore__[key] = false;
        }
    }
}

/**
 * Syncronizes the given function by the given key.
 * 
 * @param key
 * @param callback annonimus innerfunction containing the block that needed to be syncronized.
 * @returns the result is Promise<typeof any>.
 */
function PromiseSyncronize(key: string, callback: Action2<Action<any>, Action<any>>): Promise<any> {
    if (!__SyncronizationStore__[key]) {
        try {
            __SyncronizationStore__[key] = true;
            return new Promise(async (a, r) => {
                await callback(a, r);
                __SyncronizationStore__[key] = false;
            })
        } catch (ex) {
            __SyncronizationStore__[key] = false;
        }
    }
}