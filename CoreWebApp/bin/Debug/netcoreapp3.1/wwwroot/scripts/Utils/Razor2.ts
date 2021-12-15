const keyattribute = "datakey";

class BindOptions
{
    public targetelement?: Element= null;
    public targeselector?: string = "";
    public excludedelements?: Element[] = [];
    public excludedselectors?: string[] = [];
    public map?: boolean = true;
    public extension?: string = "razor";
    public keeporderontarget?: boolean = false;
}

class RazorSyntax {
    public static BlockStart: string = "{";
    public static BlockEnd: string = "}";
    public static InlineBlockStart: string = "(";
    public static InlineBlockEnd: string = ")";
    public static RazorSwitch: string = "@";
    public static Foreach: string = "foreach";
    public static For: string = "for";
    public static If: string = "if";
    public static Else: string = "else";
    public static ElseIf: string = "else if";
    public static Template: string = "template";
}

class EncloseInfo {
        public enclosed: boolean = false;

        public prefix_start: number = -1;
        public enclose_start: number = -1;
        public enclose_end: number = -1;
        public content_start: number = -1;
        public content_end: number = -1;

        public get SplitStart() {
            return this.prefix_start < -1 ? this.enclose_start : this.prefix_start;
        }
        public get SplitEnd() {
            return this.enclose_end;
        }

        public SetBackTo(ix: number) {
            var difference = this.enclose_end - ix;
            this.enclose_end = this.enclose_end - difference;
            this.content_end = this.content_end - difference;
        }

        public GetEnclosed(content: string): string {
            return content.substring(this.content_start, this.content_end);
        }
        public GetPrefix(content: string): string {
            return content.substring(this.prefix_start, this.enclose_start);

        }

        public static GetEncloseInfo(content: string, start: string, end: string): EncloseInfo[] {
            var result: EncloseInfo[] = [];

            var startcount = 0;
            var endcount = 0;
            var info = new EncloseInfo();
            var s_ix = content.indexOf(start);
            var e_ix = content.indexOf(end);
            var ix = 0;

            while (s_ix > -1 || e_ix > -1) {


                s_ix = content.indexOf(start, ix);
                e_ix = content.indexOf(end, ix);
                if (s_ix < e_ix && s_ix > -1) {
                    ix = s_ix + start.length;
                    startcount++
                }
                if ((s_ix > e_ix || s_ix == -1) && e_ix > -1) {
                    ix = e_ix + end.length;
                    endcount++
                }

                if (startcount - endcount == 1 && info.enclose_start == -1) {
                    info.enclose_start = s_ix;
                    info.content_start = s_ix + start.length;
                }
                if (endcount == startcount && info.enclose_start != -1) {
                    info.content_end = e_ix;
                    info.enclose_end = e_ix + end.length;
                    result.push(info);
                    info = new EncloseInfo();
                }
            }

            return result;
        }

        public static FixEncloseByPrefix(source: EncloseInfo[]) {
            var current = source.FirstOrDefault();
            while (current != null) {
                var previous = GetPrevious(source, current);
                if (current.prefix_start > -1) {
                    previous.SetBackTo(current.prefix_start);
                }
                current = GetNext(source, current);
            }
        }


        public static Test() {
            var content = "abc @(sdg(sdfg)sg)(a) saf ()sada@((as)sdf) sd (fgdf(as))asd";
            console.log(content);
            console.log(EncloseInfo.GetEncloseInfo(content, "(", ")"));
        }

    }

class partinterval {
    public start: number = -1;
    public end: number = -1;
    public constructor(start?: number, end?: number) {
        if (!IsNull(start)) { this.start = start; }
        if (!IsNull(end)) { this.end = end; }
    }
}
class enclosedpart extends partinterval {
    public pre: string = "";
    public pre_start: number = -1;
    public enclose_start: number = -1;
    public enclose_end: number = -1;

    public constructor(start: number = null, end: number = null, enclose_start: number = null, enclose_end: number = null, pre: string = null, pre_start: number = null) {
        super(start, end);
        if (!IsNull(enclose_start)) { this.enclose_start = enclose_start; }
        if (!IsNull(enclose_end)) { this.enclose_end = enclose_end; }
        if (!IsNull(pre)) { this.pre = pre; }
        if (!IsNull(pre_start)) { this.pre_start = pre_start; } else {
            this.pre_start = enclose_start
        }
    }
}

class encloseditem {
    public prekey: string = "";
    public pre: string = "";
    public content: string = "";
    public parent: encloseditem = null;
    public children: encloseditem[] = [];
}

class Code {
    public TypeName: string = "Code";
    public Value: string = "";

    constructor(value: string = "") {
        this.Value = value;
    }
    public static Create(value: string) {
        return new Code(value);
    }

}

class InlineCode extends Code {
    public TypeName: string = "InlineCode";

    constructor(value: string = "") {
        super(value);
    }
    public static Create(value: string) {
        return new InlineCode(value);
    }
}
class SyntaxTreeNode {
    public Value: string = "";
    public Children: SyntaxTreeNode[] = [];
    public Parent: SyntaxTreeNode;
    public TypeName: string = "SyntaxTreeNode";
    public Name: string = "";
    public Source: string = "";
    public GetStringValue(): string {
        return this.Value;
    }

    public AddChild(node: SyntaxTreeNode) {
        var z = 1;
        if (
            node.Value.trim().length > 0
            || node.Children.length > 0
            || z == 1
        ) {
            node.Parent = this;
            this.Children.push(node);
        } else {
            console.log(node);
        }

    }

    public AddChildren(nodes: SyntaxTreeNode[], startix: number = -1) {
        if (startix == -1) {
            this.Children = this.Children.concat(nodes);
        } else {
            this.Children.splice.apply(this.Children, (<any[]>[startix, 0]).concat(nodes));
        }
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].Parent = this;
        }

    }
    public SetChildrenAt(ix, node: SyntaxTreeNode) {
        if (ix > -1 && ix < this.Children.length) {
            if (node.Value.trim().length > 0 || node.Children.length > 0) {
                this.Children[ix].Parent = null;
                this.Children[ix] = node;
                node.Parent = this;
            } else {
                console.log(node);

            }
        } else { throw "Index out of range " + ix + " "; }
    }
    public GetString(span: string = ""): string {
        var result = this.GetStringValue() + "\n";
        this.Children.forEach(function (child) {
            result = result + child.GetString(span + "   ");
        });
        return result;
    }

    public GetItems(span: string = ""): any[] {
        var result = [];
        if (this.Value.trim().length > 0) {
            result.push(span + this.Value);
        }
        this.Children.forEach(function (child) {
            result = result.concat(child.GetItems(span));
        });
        return result;
    }

    public static Create(content: string) {
        var n = new SyntaxTreeNode();
        n.Value = content;
        return n;
    }
}

class BlockNode extends SyntaxTreeNode {
    public TypeName: string = "BlockNode";
    public static CreateFrom(nodes: SyntaxTreeNode[] = []): SyntaxTreeNode {
        var result: SyntaxTreeNode = null;
        if (nodes.length > 1) {
            var n1 = nodes[0];
            var n2 = nodes[1];
            if (n1.Value.endsWith(RazorSyntax.RazorSwitch + RazorSyntax.BlockStart)) {
                result = new BlockNode();
                result.Value = n2.Value;
                n1.Value = n1.Value.substring(0, n1.Value.length - 2);
            }
        }
        return result;
    }
    constructor() {
        super();
    }

    public GetItems(span: string = ""): any[] {
        var result = [];
        var tvalue = this.Value.trim();
        if (tvalue.length > 0) {
            result.push(new Code(this.Value));
        }
        this.Children.forEach(function (child) {
            result = result.concat(child.GetItems(span + "   "));
        });
        return result;
    }
    public static Create(content: string) {
        var n = new BlockNode();
        n.Value = content;
        return n;
    }
}

class ImplicitNode extends SyntaxTreeNode {
    public TypeName: string = "ImplicitNode";
    public GetItems(span: string = ""): any[] {
        var result = [];
        var code = this.Value;
        //result.push(new InlineCode("try{"+code+"}"));
        result.push(new InlineCode(code));
        return result;
    }
    public static Create(content: string): ImplicitNode {
        var n = new ImplicitNode();
        n.Value = content;
        return n;
    }
} 

class Razor {
    public MainStr: string = "@";
    public Block_Start: string = "{";
    public Block_End: string = "}";
    public Inline_Start: string = "(";
    public Inline_End: string = ")";
    public loop_for: string = "for"
    public loop_foreach: string = "foreach"
    public switch: string = "switch"
    public if: string = "if"
    public else: string = "else"
    public static keywords: string[] = ["@template", "@foreach", "foreach", "@for", "else if", "@if", "if", "else", "@"];
    public Parse(razorstr: string): any[] {
        var result = [];

        return result;
    }

    public GetBetween(content: string, start: string, end: string, blocktype: string = ""): SyntaxTreeNode {
        var result = new SyntaxTreeNode();
        result.Source = "GetBetween container";
        var startix = 0;
        var startcount = 0;
        var endcount = 0;
        var temptext = "";
        var bstart = startix;
        for (var i = startix; i < content.length; i++) {
            var c = content[i];
            var isstartend = false;

            if (c == start) {
                startcount++;
                isstartend = true;

                if (i - 1 != bstart && (startcount - endcount == 1)) {
                    var node = new SyntaxTreeNode();
                    node.Source = "GetBetween 1";
                    node.Value = content.substring(bstart, i + 1);
                    result.AddChild(node);
                    //result.Children.push(node);
                    //node.Parent = result;
                }
            }
            if (c == end) {
                endcount++;
                isstartend = true;
            }
            var isfirst = false;
            if (c == start && (startcount - endcount) == 1) {
                isfirst = true;
            }
            if (
                !isfirst &&
                startcount > endcount) {
                temptext = temptext + c;
            }

            if (endcount == startcount && temptext.length > 0) {

                var bnode = new BlockNode();
                bnode.Value = temptext;
                result.AddChild(bnode);
                //result.Children.push(bnode);
                //bnode.Parent = result;
                temptext = "";
                bstart = i;
            }
        }
        if (bstart < content.length - 1) {
            var node = new SyntaxTreeNode();
            node.Source = "GetBetween 2";
            node.Value = content.substring(bstart, i);
            result.AddChild(node)
            //node.Parent = result;
            //result.Children.push(node);
        }
        if (result.Children.length == 1) {
            result.Children[0].Parent = result.Parent;
            result = result.Children[0];
        }
        return result;
    }
    //public TestEnclose()
    //{
    //    var str = "asadfas@foreach (var item in model.Items){ \n<div>\n foreach (var item2 in item.Codes) { @{var z=\"1a2\"} @(IsNull(model.Stockno)? 'hidden':'') \n @z<div>@item2.Title</div>}</div>}";
    //    str = str + '\n@template("TX1"){\n';
    //    str = str + "\n   @if(model.X==12){ @model.ShortName }else if(model.X==13){@model.Name } else {<p>@model.X</p>}dfgh"
    //    str = str + "\n}\n";
    //    var model = {
    //        Name:"MName",
    //        ShortName:"ShName",
    //        X:13,
    //        Items: [
    //            {
    //                Codes: [
    //                    {Title:"I0 C1"},
    //                    { Title:"I0 C2"}
    //                ]
    //            },
    //            {
    //                Codes: [
    //                    { Title: "I1 C11" },
    //                    { Title: "I1 C12" },
    //                    { Title: "I1 C13" }
    //                ]
    //            }
    //        ]
    //        }
    //    console.log({content: str });
    //    var intervalinfo = Razor.GetPartIntervalInfo(str, "{", "}");
    //    console.log(intervalinfo);
    //    var encloseinfo = Razor.GetEncloseInfo(str, "{", "}", Razor.keywords);
    //    console.log(encloseinfo);
    //    var parts = Razor.GetEnclosedItems(str, "{", "}", Razor.keywords);
    //    console.log(parts);

    //    var ec = new encloseditem();
    //    ec.children = parts;
    //    console.log("Parsing")
    //    var sn = Razor.ParseX(ec);
    //    console.log(sn);
    //    Razor.SetExplicitNodes(sn);
    //    console.log(sn);
    //    Razor.SetInlineNodes(sn);
    //    console.log(sn);
    //    var items = sn.GetItems("   ");
    //    console.log(items);
    //    var rt = <RazorTemplate>Razor.ComplileX(items);

    //    console.log(rt);
    //    console.log(rt.Bind(model));
    //    for (var i = 0; i < parts.length; i++)
    //    {

    //    }
    //    //var fx=
    //} 
    public static GetEncloseInfo(content: string, start: string, end: string, rstarts: string[] = [], pre: string = ""): any {
        var result = <partinterval[]>Razor.GetPartIntervalInfo(content, start, end, "");
        var enclosedresult = [];
        for (var i = 0; i < result.length; i++) {
            var partinterval = result[i];
            var refix = 0;
            var prestr = content.substring(0, partinterval.start);
            if (i > 0) {
                var previous = result[i - 1];
                prestr = content.substring(previous.end, partinterval.start);
                refix = previous.end;
            }

            if (rstarts.length > 0) {
                for (var j = 0; j < rstarts.length; j++) {
                    var rstart = rstarts[j];
                    var pre_value = null;
                    var pres_start = null;
                    var preix = prestr.indexOf(rstart);

                    if (preix > -1) {
                        pre_value = prestr.substring(preix);
                        pres_start = refix + preix;
                    }

                    if (!IsNull(pres_start)) {
                        var enclosedinfo = new enclosedpart(
                            partinterval.start,
                            partinterval.end,
                            partinterval.start - start.length,
                            partinterval.end + end.length,
                            pre_value,
                            pres_start
                        );
                        enclosedresult.push(enclosedinfo);
                        break;
                    }
                }
            }
            else {
                if (!IsNull(pre)) {
                    var newresult = [];
                    //var rsix = partinterval.start - pre.length;
                    var rsix = partinterval.start - start.length - pre.length
                    if (rsix > -1) {
                        var item = content.substr(rsix, pre.length);
                        if (item == pre) {
                            var prestart = partinterval.start - start.length - pre.length;
                            //newresult.push({ start: rsix, end: partinterval.end });
                            var enclosedinfo = new enclosedpart(
                                partinterval.start,
                                partinterval.end,
                                prestart,
                                partinterval.end + end.length,
                                pre
                            );
                            enclosedresult.push(enclosedinfo);
                        }
                    }

                } else {
                    var enclosedinfo = new enclosedpart(
                        partinterval.start,
                        partinterval.end,
                        partinterval.start - start.length,
                        partinterval.end + end.length,
                    );
                    enclosedresult.push(enclosedinfo);
                }
            }


        }
        return enclosedresult;
    }

    public static GetPartIntervalInfo(content: string, start: string, end: string, rstart: string = ""): any {
        var result = [];
        var startcount = 0;
        var endcount = 0;
        var info = { start: -1, end: -1 };
        for (var i = 0; i < content.length; i++) {
            var c = content[i];
            if (c == start) {
                startcount = startcount + 1;
            }
            if (c == end) {
                endcount = endcount + 1;

            }
            if (startcount - endcount == 1 && info.start == -1) {
                info.start = i + 1;
            }
            if (endcount == startcount && info.start != -1) {
                info.end = i;
                result.push(info);
                info = { start: -1, end: -1 };
            }
        }
        if (!IsNull(rstart)) {
            var newresult = [];
            for (var i = 0; i < result.length; i++) {
                var encloseinfo = result[i];
                var rsix = encloseinfo.start - rstart.length - 1;
                if (rsix > -1) {
                    var item = content.substr(rsix, rstart.length);
                    if (item == rstart) {
                        newresult.push({ start: rsix, end: encloseinfo.end });
                    }
                }
            }
            result = newresult;
        }

        return result;
    }

    public static GetEnclosedItems(content: string, start: string, end: string, rstarts: string[] = []) {
        var encloseinfo = this.GetEncloseInfo(content, start, end, rstarts);
        var result: encloseditem[] = [];
        var enclosedresult: encloseditem[] = [];
        if (encloseinfo.length > 0) {
            var first = encloseinfo.FirstOrDefault();
            var firststart = FirstNotNull(first.pre_start, first.enclose_start);
            var firstitem = new encloseditem();
            firstitem.content = content.substring(0, firststart);
            result.push(firstitem);
            var item: enclosedpart = null;
            for (var i = 0; i < encloseinfo.length; i++) {
                item = encloseinfo[i];
                var eitem = new encloseditem();
                eitem.prekey = item.pre;
                eitem.content = content.substring(item.start, item.end);
                eitem.pre = content.substring(item.pre_start, item.enclose_start);
                result.push(eitem);
                enclosedresult.push(eitem);

                if (i < (encloseinfo.length - 1)) {
                    var nextinfo = <enclosedpart>encloseinfo[i + 1];
                    var startix = FirstNotNull(nextinfo.pre_start, nextinfo.enclose_start);
                    var betweenitem = new encloseditem();
                    betweenitem.content = content.substring(item.enclose_end, startix)
                    result.push(betweenitem);

                }
            }
            var lastitem = new encloseditem();
            lastitem.content = content.substring(item.enclose_end);
            result.push(lastitem);

        }
        for (var i = 0; i < enclosedresult.length; i++) {
            var eitem = enclosedresult[i];
            eitem.children = Razor.GetEnclosedItems(eitem.content, start, end, rstarts);
            eitem.children.forEach(function (eich) { eich.parent = eitem; })
        }
        return result;
    }


}

class RazorParser {
        public static GetSplitBy(content: string, start: string, end: string, pre: string): EncloseInfo[] {
            var result: EncloseInfo[] = [];
            var encloseinfo = RazorParser.GetEncloseInfo(content, start, end, pre);
            if (encloseinfo.length == 0) {
                var ec = new EncloseInfo();
                ec.enclosed = false;
                ec.content_start = 0;
                ec.content_end = content.length;
                result.push(ec);
            } else {
                var nec = new EncloseInfo();
                nec.enclosed = false;
                nec.content_start = 0;
                for (var i = 0; i < encloseinfo.length; i++) {
                    var ec = encloseinfo[i];

                    nec.content_end = ec.prefix_start;
                    result.push(nec);
                    nec = new EncloseInfo()
                    nec.enclosed = false;
                    nec.content_start = ec.enclose_end;
                    result.push(ec);

                }
                nec.content_end = content.length;
                result.push(nec);
            }
            return result;
        }
        public static GetEncloseInfo(content: string, start: string, end: string, pre: string): EncloseInfo[] {
            var mix = 0;
            var result: EncloseInfo[] = [];
            var preix = content.indexOf(pre, mix);
            var preixcheck = -1;
            while (preix > -1) {
                if (preix == preixcheck) {
                    throw "Razor Syntax Error"
                } else
                {
                    preixcheck = preix;
                }
                var ix = preix + pre.length;
                var startcount = 0;
                var endcount = 0;
                while (ix < content.length) {
                    if (ix + start.length > content.length) { break; }
                    if (ix + end.length > content.length) { break; }
                    var xstart = content.substr(ix, start.length);
                    var xend = content.substr(ix, end.length);
                    if (startcount == 0 && xstart != start) {
                        preix = content.indexOf(pre, preix + 1);
                        break;
                    }
                    else {
                        if (xstart == start) {
                            startcount++;
                        }
                        if (xend == end) {
                            endcount++;
                        }
                        if (startcount == endcount) {
                            var ec = new EncloseInfo();
                            ec.prefix_start = preix;
                            ec.enclose_start = preix + pre.length;
                            ec.content_start = ec.enclose_start + start.length;
                            ec.enclose_end = ix + end.length;
                            ec.content_end = ix;
                            ec.enclosed = true;
                            result.push(ec);
                            preix = content.indexOf(pre, ix);
                            break;

                        }
                    }
                    ix++;

                }
            }
            return result;
        }

        public static GetFunction(nodes: any[]): Function {
            var f = (model) => "";
            var functionbuilder = [];
            functionbuilder.push("function (model, context){");
            functionbuilder.push("var view=context[\"view\"];");
            functionbuilder.push("var html=new HtmlHelpers();");
            functionbuilder.push("html.view = view;");
            functionbuilder.push("var htmlbuilder=[];");
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                var prevnode = i > 0 ? nodes[i-1] : null;
                if (node instanceof InlineCode) {
                    var parts = node.Value.split(".");
                    var str = "htmlbuilder.push("
                    if (parts.length > 1) {
                        str = str + Format("Access({0},'{1}')", parts[0], parts.slice(1).join("."));
                    } else {
                        str = str + node.Value;
                    }
                    str = str + ");";
                    functionbuilder.push(str);
                    continue;
                }
                if (node instanceof Code) {
                    if (prevnode != null) {
                        if (prevnode.Value.startsWith("@foreach") && node.Value.trim() == "{") {
                            continue; 
                        }

                    }
                    if (node.Value.startsWith("@foreach")) {
                        var varname = TextBetween(node.Value, "var ", " in");
                        var propname = TextBetween(node.Value, "in ", ")");

                        functionbuilder.push(Format("for (var i_{0}=0; i_{0}<FirstNotNull({1},[]).length; i_{0}++){", varname, propname))
                        functionbuilder.push(Format(" var {0} = {1}[i_{0}];", varname, propname));
                    } else {
                        if (node.Value.startsWith("@")) {
                            functionbuilder.push(node.Value.substring(1));

                        } else {
                            functionbuilder.push(node.Value);
                        }
                    }
                    continue;
                }

                if (node instanceof ImplicitNode) {
                    var str = "htmlbuilder.push("
                    str = str + node.Value;
                    str = str + ");";
                    functionbuilder.push(str);
                    continue;
                }
                if (node instanceof SyntaxTreeNode) {
                    var encval = Replace(node.Value, "'", "\\'");
                    encval = Replace(encval, "\r\n", "\\n");
                    encval = Replace(encval, "\n", "\\n");
                    functionbuilder.push(Format("htmlbuilder.push('{0}');", encval));

                    continue;
                }
            }
            functionbuilder.push("return htmlbuilder.join('')");
            functionbuilder.push("}");
            //console.log(functionbuilder.join("\n"));
            try {
                f = evalInContext("[" + functionbuilder.join("\n") + "]")[0];
            } catch (ex)
            {
                console.log(functionbuilder.join("\n"));
                throw ex;
            }
            return f;
        }
   
        public static Compile(code:string) {


            //var ecs = RazorParser.GetEncloseInfo(code, "(", ")", "@");
            //var necs = RazorParser.GetSplitBy(code, "(", ")", "@");

            var xitems = Razor.GetEnclosedItems(code, "(", ")", ["@foreach", "@if", "@else if"]);
            var nodes = [];
            xitems.forEach(function (xitem) {
                if (!IsNull(xitem.pre)) {
                    var node = new Code(xitem.pre + "(" + xitem.content + ")");
                    //node.Value = xitem.content;
                    nodes.push(node)
                } else {
                    nodes.push(SyntaxTreeNode.Create(xitem.content));
                }
            });
            if (nodes.length == 0)
            {
                nodes.push(SyntaxTreeNode.Create(code));
            }
            //console.log(nodes);
            var nodes2 = [];
            nodes.forEach(function (node) {
                if (node["TypeName"] == "SyntaxTreeNode") {
                    var explicites = RazorParser.GetSplitBy(node.Value, "(", ")", "@");
                    for (var i = 0; i < explicites.length; i++) {
                        var exp = explicites[i];
                        if (exp.enclosed) {
                            var newnode = ImplicitNode.Create(exp.GetEnclosed(node.Value));
                            //node.Value = xitem.content;
                            nodes2.push(newnode)
                        } else {
                            nodes2.push(SyntaxTreeNode.Create(exp.GetEnclosed(node.Value)));
                        }
                    }

                } else {
                    nodes2.push(node);
                }
            });

            var nodes3 = [];
            nodes2.forEach(function (node) {
                if (node["TypeName"] == "SyntaxTreeNode") {
                    var rsimpleregex = /@[a-zA-Z0-9_.]+/g;
                    var matches = FirstNotNull(node.Value.match(rsimpleregex), []);
                    var splits = node.Value.split(rsimpleregex);
                    if ((matches.length + 1) == splits.length && matches.length > 0) {
                        var items: SyntaxTreeNode[] = [];
                        for (var i = 0; i < matches.length; i++) {
                            if (splits[i].trim().length > 0) {
                                nodes3.push(SyntaxTreeNode.Create(splits[i]));

                            }
                            var expr = matches[i].substring(1);
                            nodes3.push(InlineCode.Create(expr));
                        }
                        nodes3.push(SyntaxTreeNode.Create(splits[splits.length - 1]));
                        //node.Parent.Children.splice.apply(node.Parent.Children, (<any[]>[ix, 0]).concat(items));

                    } else {
                        nodes3.push(node);

                    }
                    //node.Parent.Children.splice.apply(node.Parent.Children, (<any[]>[ix, 0]).concat(items));


                } else {
                    nodes3.push(node);
                }
            });


            //console.log(nodes3);
            var nodes4 = [];
            for (var i = 0; i < nodes3.length; i++) {
                var node = nodes3[i];
                if (node["TypeName"] == "SyntaxTreeNode") {
                    var explicites = RazorParser.GetSplitBy(node.Value, "{", "}", "@");
                    for (var j = 0; j < explicites.length; j++) {
                        var exp = explicites[j];
                        if (exp.enclosed) {
                            var newnode = Code.Create(exp.GetEnclosed(node.Value));
                            //node.Value = xitem.content;
                            nodes4.push(newnode)
                        } else {
                            nodes4.push(SyntaxTreeNode.Create(exp.GetEnclosed(node.Value)));
                        }
                    }
                } else
                {
                    nodes4.push(node);
                }
            }
            var nodes5 = [];
            for (var i = 0; i < nodes4.length; i++) {
                var node = nodes4[i];
                if (node["TypeName"] == "SyntaxTreeNode") {
                    var prevnode = i == 0 ? null : nodes4[i - 1];

                    var lines = node.Value.split("\n");
                    var ismarkup = true;
                    if (prevnode != null && prevnode["TypeName"] == "Code") {
                        ismarkup = false;
                    }
                    for (var j = 0; j < lines.length; j++) {
                        var line: string = lines[j];
                        var islast = j == lines.length - 1;
                        var matches = FirstNotNull(line.match(/<[a-zA-Z_]+/g), line.match(/<\/[a-zA-Z_]+/g), []);
                        var trimmedline = line.trim();
                        if (matches.length > 0) {
                            ismarkup = true;
                        }
                        if (trimmedline.startsWith("}")) {
                            ismarkup = false;
                        }
                        //if (trimmedline.startsWith("@{")) {
                        //    line = trimmedline.substring(2);
                        //    ismarkup = false;
                        //}
                        if (ismarkup) {
                            var lval = islast ? line : line + "\n";
                           
                            nodes5.push(SyntaxTreeNode.Create(lval));

                        } else {
                            nodes5.push(Code.Create(line + "\n"));

                        }
                    }


                } else {
                    nodes5.push(node);
                }

            }

            //console.log(nodes4);
            //console.log(RazorParser.GetFunction(nodes4));

            var f = RazorParser.GetFunction(nodes5);
            return f;
        }

        public x() {
            var z = null;
        }
    }

class RazorTemplate implements IViewTemplate {
    private _f = null;
    public LayoutPath: string = "";
    public Compile(template: string): Function {
        if (this._f == null) {
            this._f = RazorParser.Compile(template);
        }
        return this._f;
    }
    public Bind(model: any, context: any, options?: BindOptions): string {
        if (this._f != null) {
            return this._f(model, context);
        }
        return "";
    }
    public BindToFragment(model: any, context: any): DocumentFragment {
        var f = document.createDocumentFragment();
        var tpl = document.createElement("template");
        tpl.innerHTML = this.Bind(model, context);
        f.appendChild(tpl.content); 
        return f;
    }
    public Extension: string = "razor";

    public Copy(): IViewTemplate {
        var me = this;
        var t = new RazorTemplate();
        for (var key in me)
        {
            (<any>t)[key] = me[key];
        }
        return t;
    }
}

