class Glyph {
    public Value: string;
    public Tag?: string;
    public Slot?: any;
    public Children: Glyph[] = [];
    public Level?: number;
    public AddChild(item:string) {
        var g = new SimpleGlyph();
        g.Value = item;
        this.Children.push(g);
    }
    public AddChildGlyph(item: Glyph) {
        this.Children.push(item);

    }
    public static GetString(instance: Glyph, start: string = "(", end: string = ")", level: number = 0) {
        var sb = [];
        if (!IsNull(instance.Value) || instance instanceof (SimpleGlyph)) {
            return Format("{0}", instance.Value);
        }
        else {
            sb.push(level != 0 ? start : "");
            for (var i = 0; i < instance.Children.length;i++)
            {
                var child = instance.Children[i];
                sb.push(Glyph.GetString(child,start, end, level + 1));
            }
            sb.push(level != 0 ? end : "");
        }
        return sb.join('');
    }

    public static All(instance: Glyph, level: number=0) {
        var result: Glyph[] = [];
        for (var i = 0; i < instance.Children.length; i++) {
            var child = instance.Children[i];
            child.Level = level;
            result.push(child);
            result = result.concat(Glyph.All(child,level+1));
        }
        return result;
    }

    public static ForAll(instance: Glyph, action: Action2<Glyph, Glyph>, parent: Glyph=null, level: number = 0) {
        action(instance, parent);
        for (var i = 0; i < instance.Children.length; i++) {
            var child = instance.Children[i];
            Glyph.ForAll(child, action, instance, level + 1);
        }
    }
}
class SimpleGlyph extends Glyph {

}
class GroupGlyph extends Glyph {

}
class Reference<T>{
    public value: T;
}
class GlyphParser {
    private startstr: string = "(";
    private endstr: string = ")";
    constructor(startstr: string = "(", endstr: string = ")") {
        this.startstr = startstr;
        this.endstr = endstr;
    }

    public  Parse( expression:string) {
        var s = expression;
        var refcontainer = { value: s };
        return this._Parse(refcontainer);
    }

    private _Parse(expr: Reference<string>, level: number = 0) {
        var me = this;
        var startstr = me.startstr;
        var endstr = me.endstr;

        var result = new Glyph();
        var cx = 0;

        var ixs = -1;
        var ixe = -1;
        var ix = -1;
        do {
            ixs = expr.value.indexOf(startstr);
            ixe = expr.value.indexOf(endstr);
            ix = ixs == -1 ? ixe : (ixe == -1 ? ixs : Math.min(ixs, ixe));
            if (ix > 0) {
                var spart = expr.value.substring(0, ix);
                result.AddChild(spart);
                expr.value = expr.value.substring(ix);
            }
            if (ix == 0) {
                if (expr.value.startsWith(startstr)) {
                    expr.value = expr.value.substring(startstr.length);

                    result.AddChildGlyph(this._Parse(expr, level + 1));

                }
                if (expr.value.startsWith(endstr)) {
                    expr.value = expr.value.substring(endstr.length);

                    return result;
                }
            }

        } while (ix > -1);
        if (expr.value.length > 0) {
            result.AddChild(expr.value);
            expr.value = "";
        }
        return result;
    }

    public static Test() {
        var expr = "asdfsa(ssd(dfgfd((ffff))fdsf(fff))fd(dsgdg)())asfsf";
        console.log("Expr", expr);
        var parser = new GlyphParser();
        var g = parser.Parse(expr);
        console.log("PExpr",Glyph.GetString(g));
    }
}


class RPart {
    public Value: string;

    public Copy() {
        var result = new RPart();
        result.Value = this.Value;
        return result;
    }
}
class RCodePart extends RPart {
    constructor(value?: string) {
        super();
        this.Value = value;
    }
    public Copy() {
        var result = new RCodePart();
        result.Value = this.Value;
        return result;
    }
}
class RUIPart extends RPart {
    public Copy() {
        var result = new RUIPart();
        result.Value = this.Value;
        return result;
    }
}
class RMixPart extends RPart {

}
class RImplicitpart extends RPart {
    public Copy() {
        var result = new RImplicitpart();
        result.Value = this.Value;
        return result;
    }
}
class RExplicitpart extends RPart {
    public Copy() {
        var result = new RExplicitpart();
        result.Value = this.Value;
        return result;
    }
}
class RazorMarkupParser {
    public CSwitch: string = "@";
    public USwitch: string = "<";
    public Inline_Start: string = "(";
    public Inline_End: string = ")";
    public Block_Start: string = "{";
    public Block_End: string = "}";
    public KeyWords: string[] = ["foreach", "while","switch","do","for","try","catch","finally","if","else","else if"];
    public Parse(body: string) {
        var me = this;
        var lines = body.split("\n");
        let linetype = 0;
        var result = [];
        var bag = [];
        var glyphparser = new GlyphParser();
        var gather = (item: string) => {
            var part: RPart = null;
            if (linetype == 1) {
                part = new RCodePart();
                part.Value = item;
            }
            if (linetype == 0) {
                part = new RUIPart();
                part.Value = item;
            }
            if (linetype == 2) {
                part = new RMixPart();
                part.Value = item;
            }
            bag.push(part);
        };
        var isuiline = (item: string, previouslinetype?: number) => {
            if (item.indexOf(me.CSwitch) > -1) {
                return false;
            } 
            return true;

        }
        var iscodeline = (item: string, previouslinetype?: number) => {
            if (item.indexOf(me.CSwitch) > -1) {
                //has @ this means it is mixed
                return false;
            }
            if (item.indexOf(me.USwitch) == 0) {
                //doesnt starts with <
                return false;
            }
            if (item.indexOf(me.USwitch) > 0) {
                //has <, but needs to checked if it is not within code
                var g = glyphparser.Parse(trimmedline);
                var items = Glyph.All(g);
                var xitem = items.FirstOrDefault(i =>
                    i.Level == 0
                    && i.Children.length == 0
                    && (Coalesce(i.Value, "").indexOf(me.USwitch)));
                if (xitem != null) {
                    return false;
                }

            }
            if (item.indexOf(me.Block_Start) == 0 || item.indexOf(me.Block_End) == 0) {
                return true;
            }
            if (item.indexOf(me.Inline_Start) == 0 || item.indexOf(me.Inline_End) == 0) {
                return true;
            }

            for (var i = 0; i < me.KeyWords.length; i++) {
                if (item.indexOf(me.KeyWords[i]) == 0) {
                    return true;
                }

            }
   
            return false;
        }
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            linetype = 2;
            var trimmedline = line.trim();
            if (iscodeline(trimmedline)) {
                linetype = 1;
            }
            if (linetype!=1 && isuiline(trimmedline)) {
                linetype = 0;
            }
           
            gather(line);

        }

        for (var i = 0; i < bag.length; i++) {
            var part = bag[i];
            if (part instanceof RMixPart) {
                var trimmedpart = part.Value.trim();
                if (trimmedpart.startsWith(me.CSwitch)) {
                    var partafterswitch = trimmedpart.substring(1);
                    if (me.StartsWithKeyWord(partafterswitch)) {
                        var cp = new RCodePart();
                        cp.Value = partafterswitch;// Replace( part.Value,"@","");
                        bag[i] = cp;
                        continue;
                    }
                }
                var items = me.HandleExppressions(part.Value);
                var sitems = me.Simplify(items);
                if (sitems.length > 0) {
                    bag[i] = sitems;
                }
                
            }
        }
        //console.log("Bag", bag);

        return bag;
    }

    public Simplify(items: RPart[]): RPart[] {
        var result: RPart[] = [];
        if (items.length > 0) {
            var cpart: RPart = items[0].Copy();
            for (var i = 1; i < items.length; i++) {
                var part = items[i];
                if (cpart.constructor.name == part.constructor.name) {
                    cpart.Value = cpart.Value + part.Value;
                } else {
                    result.push(cpart);
                    cpart = part.Copy();
                }
            }
            result.push(cpart);

        }
        return result;
    }

    public HandleExppressions(item: string) {
        var me = this;
        var glyphparser = new GlyphParser();

        var expr = glyphparser.Parse(item);
        Glyph.ForAll(expr, (item: Glyph, parentitem: Glyph) => {
            if (parentitem != null && IsArray(item.Children)) {
                var ix = parentitem.Children.indexOf(item);
                if (ix > 0) {
                    var prec = parentitem.Children[ix - 1];
                    var newg = new SimpleGlyph();

                    if (prec.Value.endsWith(me.CSwitch)) {
                        prec.Value = prec.Value.substring(0, prec.Value.length - 1);
                        newg.Tag = "Explicit";
                        newg.Value = Glyph.GetString(item, me.Inline_Start, me.Inline_End, 0);
                        //console.log(expr);

                    } else {
                        newg.Value = Glyph.GetString(item, me.Inline_Start, me.Inline_End, 1);
                    }
                    parentitem.Children[ix] = newg;

                }
            }
        });

        Glyph.ForAll(expr, (item: Glyph, parentitem: Glyph) => {
            if (!IsNull(item.Value) && item.Value.indexOf(me.CSwitch) > -1) {
                var rsimpleregex = /@[a-zA-Z0-9_.]+/g;
                var matches = FirstNotNull(item.Value.match(rsimpleregex), []);
                if (matches.length > 0) {
                    var gg = new GroupGlyph();
                    var items = item.Value.split(rsimpleregex);
                    gg.AddChild(items[0]);
                    for (var i = 0; i < matches.length; i++) {
                        let match = matches[i];
                        var g = new Glyph();
                        g.Value = match.substring(1);
                        g.Tag = "Implicit";
                        gg.AddChildGlyph(g);
                        gg.AddChild(items[i + 1]);
                    }
                    if (parentitem != null) {
                        var ix = parentitem.Children.indexOf(item);
                        parentitem.Children[ix] = gg;
                    }
                    //console.log("changes", parentitem);
                }
            }
        });

        var result = [];
        var fadd = (g: Glyph) => {
            var part: RPart = null;
            if (g.Tag == "Implicit") {
                part = new RImplicitpart();
            }
            if (g.Tag == "Explicit") {
                part = new RExplicitpart();

            }
            if (IsNull(g.Tag)) {
                part = new RUIPart();
            }
            part.Value = g.Value;
            result.push(part);
        };
        for (var i = 0; i < expr.Children.length; i++) {
            let current = expr.Children[i];
            if (current instanceof GroupGlyph) {
                for (var gi = 0; gi < current.Children.length; gi++) {
                    var gitem = current.Children[gi];
                    fadd(gitem);
                }
            } else {
                fadd(current);
            }
        }
        
        return result;
      
    }

    private StartsWithKeyWord(item: string) {
        var me = this;
        var cswitchedkeywords = me.KeyWords.Select(i => me.CSwitch + i);
        var allkeywords = me.KeyWords.concat(cswitchedkeywords);
        for (var i = 0; i < allkeywords.length; i++) {
            if (item.indexOf(allkeywords[i]) == 0) {
                return true;
            }

        }
        return false;
    }
    public static Test() {
        var lines = [
            "<div class=\"reservations\">",
            "    <div class=\"Save\" onchange=\"view(this).OnChange(event)\">",
            "        <div class=\"field\">",
            "            <label>Id</label>",
            "            <input class=\"value\" bind=\"Id\" type=\"text\" disabled value=\"@context.CurrentReservation.Id\" />",
            "        </div>",
            "        <div class=\"field\">",
            "            <label>Apartment</label>",
            "            <app-autocomplete class=\"autocomplete value apartmentid\"",
            "                              datafunction=\"view(this).DF_Apartments\"",
            "                              valuefield=\"Id\"",
            "                              displayfield=\"Name\"",
            "                              minlengthtosearch=\"1\"",
            "                              value=\"@context.CurrentReservation.ApartmentId\"",
            "                              label=\"@context.CurrentReservation.Apartment.Name\"",
            "                              bind=\"ApartmentId\">",
            "            </app-autocomplete>",
            "        </div>",
            "        <div class=\"field\">",
            "            <label>Start</label>",
            "            <div class=\"value\">",
            "                <input type=\"date\" bind=\"StartDate\" value=\"@context.CurrentReservation.StartDate\" />",
            "            </div>",
            "        </div>",
            "        <div class=\"field\">",
            "            <label>Days</label>",
            "            <div class=\"value\">",
            "                <input type=\"number\" bind=\"_NrofDays\" min=\"1\" value=\"@context.CurrentReservation._NrofDays\"  />",
            "            </div>",
            "        </div>",
            "        <div class=\"field\">",
            "            <label>Code</label>",
            "            <div class=\"value\">",
            "                <input type=\"text\" bind=\"Code\" disabled value=\"@context.CurrentReservation.Code\"  />",
            "                <span class=\"button\" onclick=\"view(this).SetCode()\">G</span>",
            "            </div>",
            "        </div>",
            "        <div>",
            "            <button onclick=\"view(this).Save()\" class=\"Save\">@(Res(\"Save\"))</button>",
            "            <button onclick=\"view(this).New()\" class=\"New\">@(Res(\"New\"))</button>",
            "",
            "        </div>",
            "",
            "    </div>",
            "    <table class=\"model\" onclick=\"view(this).SelectReservation(event)\">",
            "        <thead>",
            "            <tr>",
            "                <th></th>",
            "                <th>Apartment</th>",
            "                <th>StartDate</th>",
            "                <th>EndDate</th>",
            "                <th>Code</th>",
            "            </tr>",
            "        </thead>",
            "        <tbody>",
            "",
            "            @foreach (var reservation in model){",
            "            <tr datakey=\"@reservation.Id\">",
            "                <td><span class=\"button i-f-Cancel\" onclick=\"view(this).Delete(event)\"></span></td>",
            "                <td>@reservation.Apartment.Name</td>",
            "                <td>@reservation.StartDate</td>",
            "                <td>@reservation.EndDate</td>",
            "                <td>@reservation.Code</td>",
            "",
            "            </tr>",
            "            }",
            "        </tbody>",
            "    </table>",
            "    <div class=\"pager\"></div>",
            "",
            "</div>"
        ];
        var rmp = new RazorMarkupParser();
        rmp.HandleExppressions("            <button onclick=\"view(this).Save()\" class=\"Save\">@(Res(\"Save\")) @model.Id dgdg @model.Name -- @model.Id</button> @(XF(\"GH\"))");
        rmp.Parse(lines.join("\n"));
    }

}