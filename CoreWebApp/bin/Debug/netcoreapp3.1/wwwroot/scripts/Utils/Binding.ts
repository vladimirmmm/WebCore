function XXX() {
    var x = 0;
} 
function EvalIn(context: object, code:string)
{
    var ff = eval("[" + code + "]")[0];
    return ff.call(context, code);
}
function GetObjectFromCode(context: object, code: string) {
    var ff = eval("[" + code + "]")[0];
    return ff;
} 

function returneval(code, me?:any)
{
    var ff = eval.call(me,"[" + code + "]")[0];
    return ff;
}

function EvalX( context:object,code:string) {
    //# Return the results of the in-line anonymous function we .call with the passed context
    return function () { return eval(code); }.call(context);
}
function BindAccess(obj: any, key: string)
{
    var result;
    var tobj = obj;
    this["model"] = tobj;

    if (key.indexOf("html.") == 0) {
        try {
            var ff = eval("[" + HtmlDecode(key) + "]")[0];
            result = ff;//.call({ model: tobj, meta: GetMeta(obj) });
            //result = evalInContext.call({ model: tobj, meta: GetMeta(obj) }, HtmlDecode(key));
            //result = eval(HtmlDecode(key));
            //result = eval(key);

            return result;
        } catch (err)
        {
            //console.error(err);
        }
    }

    if (key == "this" || key=="model")
    {
        return obj;
    }
    this["model"] = tobj;
    this["meta"] = GetMeta(obj);
    try {
        result = evalInContext(HtmlDecode(key));
    } catch (err)
    {
        //console.error(err);

    }
    //result = key.split(".").reduce(function (o, x) {
    //    return (typeof o == "undefined" || o === null) ? o : o[x];
    //}, tobj);

    return IsNull(result) ? "" : result;
}
function evalInContext(code: string)
{
    return eval(code);

}

function GetBoundElements(element: Element): any[]
{
    var nobinds = _Select("[no-bind]", element);
    var iswithinnobound = function (element: Element)
    {
        for (var i = 0; i < nobinds.length; i++)
        {
            if (nobinds[i].contains(element)) {
                return true;
            }
        }
        return false;
    }
    var boundelements = _Select("[bind]", element).Where(i => !iswithinnobound(i)).Select(function (i) {
        var propertyparts = i.getAttribute("bind").split(".");
        var propertyval = propertyparts[propertyparts.length - 1];
        var parents = _Parents(i, element);
        //parents = parents.splice(parents.indexOf(element) + 1);
        var parentsval = parents.Where(p => !p.hasAttribute("no-bind") && p.hasAttribute("binding-items"))
        var pathval = parentsval.Select(p => p.getAttribute("binding-items").replace("model.", ""));
        propertyparts.pop();
        return {
            element: i,
            property: propertyval,
            parents: parentsval,
            path: pathval.concat(propertyparts)
        }
    });
    
    for (var i = 0; i < boundelements.length; i++) {
        var be = boundelements[i];
        for (var pi = be.parents.length-1; pi > -1; pi--) {
            var parent: Element = be.parents[pi];
            var parentpath = parent.getAttribute("binding-items").replace("model.", "");
            for (var ci = 0; ci < parent.children.length; ci++) {
                var child = parent.children[ci];
                if (child.contains(be.element)) {
                    var index = Array.prototype.indexOf.call(parent.children, child);
                    var pathix = be.path.indexOf(parentpath);
                    be.path[pathix] = Format("{0}[{1}]", parentpath, index);
                }
            }
        }
    }
    return boundelements.Select(function (i) { return { element: i.element, path: i.path, property: i.property } });
}
function GetBoundObject(element: Element, target?: Element)
{
    var boundelements = GetBoundElements(element);
    if (!IsNull(target)) {
        boundelements = boundelements.Where(i => i.element == target);
    }
    var valueof = function (e: any) {
        if (e.tagName == "INPUT" && e.type == "radio") {
            return e.checked ? e.value : null;
        }
        if (!("value" in e)) {
            return e.innerHTML.trim();
        }
        return e.value; 
    };
    var obj = {};
    var setdictionary = {};
    for (var i = 0; i < boundelements.length; i++)
    {
        var be = boundelements[i];
        var path = be.path.concat([be.property]).join(".");
 
        if (!IsNull(path)) {
            if (!(path in setdictionary)) {
                setdictionary[path] = valueof(be.element);
            } else {
                setdictionary[path] = FirstNotNull(valueof(be.element), setdictionary[path]);
            }
            //SetPath(obj, path, valueof(be.element));
        }
    }
    for (var key in setdictionary) {
        SetPath(obj, key, setdictionary[key]);

    }
    return obj;

}

function ConvertToProperty(obj: object, key: string, onset: Function = null)
{
    if (!("__values" in obj)) {
        obj["__vlaues"] = {};

    }

    Object.defineProperty(obj, key, {
        get: function () {
            return obj["__vlaues"][key];
        },
        set: function (value) {
            obj["__vlaues"][key] = value;
            if (onset != null) { onset(value); }
        }
    });
}
function GetLinkedObj(element: Element, obj: object):object {
    var meta = GetMeta(obj);
    var linkedobj = JsonCopy(obj);
    var boundelements = GetBoundElements(element);
    for (var i = 0; i < boundelements.length; i++) {
        var uiobj = boundelements[i];
        var property = <string>uiobj.property;
        var cpath = <string>uiobj.path.join(".");
        var path = cpath + "." + property;
        var element = <Element>uiobj.element;
        var listener = <Function>uiobj.listener;

        var onuiset = function (val) {
            SetPath(linkedobj, this.path, (<HTMLInputElement>this.element).value);

        };
        var b_onuiset = onuiset.bind({ element:element,path:path });
        if (!IsNull(listener)) {
            element.removeEventListener("change", <any>listener);
        }
        else {
            listener = b_onuiset;
            uiobj.listener = listener
        }
        element.addEventListener("change", <any>listener);
        var container = IsNull(cpath) ? linkedobj : GetPath(linkedobj, cpath);
        var onmodelset = function (val) {
            this.value = val;
        };
        var b_onmodelset = onmodelset.bind(element);
        ConvertToProperty(container, property, b_onmodelset);

    }

    return linkedobj;
}



