
namespace OdataQueryOptions {
    export class Operators {
        public static Dictionary = {
            "eq": null,
            "ne": null,
            "gt": null,
            "ge": null,
            "lt": null,
            "le": null,
            "and": null,
            "or": null,
            "not": null,

            "add": null,
            "sub": null,
            "mul": null,
            "div": null,
            "mod": null
        };
    }
    export class Functions {
        public static Dictionary = {
            "endswith": null,
            "startswith": null,
            "substringof": null,
            "indexof": null,
            "replace": null,
            "substring": null,
            "tolower": null,
            "toupper": null,
            "trim": null,
            "concat": null,
            "round": null,
            "floor": null,
            "div": null,
            "ceiling": null,

            "day": null,
            "hour": null,
            "minute": null,
            "month": null,
            "second": null,
            "year": null
        };
    }
    export class E {

    }
    export class E_Reference extends E {

    }
    export class E_Value extends E  {

    }
    export class E_Operator extends E  {

    }
    export class E_Function extends E {

    }
    export class Query extends E {
        public Select: Select = new Select();
        public Filter: Filter;
        public Expand: Expand;
        public OrderBy: OrderBy;
        public Top: Top;
        public Skip: Skip;
        public Count: Count;
    }
    export class Filter extends E {
        public Items: E[] = [];
    }
    export  class Expand {
        public Path: string;
        public Query: Query;
    }
    export class Select {
        public Fields: string[] = ["*"];
    }
    export class OrderBy {
        public Clauses: Object;
    }
    export class Top {
        public Value: string;
    }
    export class Skip {
        public Value: string;

    }
    export class Count {
        public Value: boolean;

    }
}

class Odataparser {
    public static GlyphTags = {
        Function:"Function",
        Operator:"Operator",
        Variable:"Variable",
        DValue:"DValue",
        TValue:"TValue",
        IValue:"IValue",
        SValue:"SValue"
    }
    public Parse(item: string) {
        var me = this;
        var parts = Split(item, "&", true);

        var gparser = new GlyphParser();
        var gmain = new Glyph();
        parts.forEach(p => {
            gmain.AddChild(p);
        });
       
        console.log("Glyph", gmain);
        var qry = new OdataQueryOptions.Query();
        gmain.Children.forEach(g => {
            var eix = g.Value.indexOf("=");
            var key = g.Value.substring(1, eix);
            var value = g.Value.substring(eix + 1);
            switch (key) {
                case "select":
                    qry.Select = <any>{ raw: value, Fields:[] }
                    break;
                case "filter":
                    qry.Filter = <any>{ raw: value, filters: me.GetClientFilters(value) }
                    break;
                case "expand":
                    qry.Expand = <any>{ raw: value }
                    break;
                case "orderby":
                    qry.OrderBy = <any>{ raw: value }
                    break;
                case "count":
                    qry.Count = <any>{ va: value }
                    break;
                case "top":
                    qry.Select = <any>{ raw: value }
                    break;
                case "skip":
                    qry.Select = <any>{ raw: value }
                    break;
            }

        });
    }

    public GetClientFilters(value: string) { 
        var filters: ClientFilter[] = [];
        var ls = GetStringWithLiterals(value, "'");
        var gp = new GlyphParser();
        var g = gp.Parse(ls.aliasedtext);
        Glyph.ForAll(g, (gl: Glyph, p) => {
            if (gl instanceof SimpleGlyph) {
                var parts:string[] = Split(gl.Value, [" ",","], true);
                var gparsed = new Glyph();
                for (var i = 0; i < parts.length; i++) {
                    var part = parts[i].trim();
                    var sg = new SimpleGlyph();
                    sg.Value = part;
                
                    if (part in OdataQueryOptions.Functions.Dictionary) {
                        sg.Tag = Odataparser.GlyphTags.Function;
                        gparsed.AddChildGlyph(sg);
                        continue;
                    }
                    if (part in OdataQueryOptions.Operators.Dictionary) {

                        sg.Tag = Odataparser.GlyphTags.Operator;
                        gparsed.AddChildGlyph(sg);
                        continue;
                    }
                    if (part.startsWith("'") && part.endsWith("'")) {
                        sg.Tag = Odataparser.GlyphTags.SValue;
                        gparsed.AddChildGlyph(sg);
                        continue;
                    }
                    if (part.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/) != null) {
                        sg.Tag = Odataparser.GlyphTags.Variable;
                        gparsed.AddChildGlyph(sg);
                        continue;

                    }
                    if (part.indexOf("-") > -1) {
                        sg.Tag = Odataparser.GlyphTags.TValue;
                        gparsed.AddChildGlyph(sg);
                        continue;

                    }
                    if (part.indexOf(".") > -1) {
                        sg.Tag = Odataparser.GlyphTags.DValue;
                        gparsed.AddChildGlyph(sg);
                        continue;

                    }
                    sg.Tag = Odataparser.GlyphTags.IValue;
                    gparsed.AddChildGlyph(sg);
                }

                gl.Slot = gparsed;

            }
        });
        console.log("FG", g);
        return filters
    }

    public BuildQuery(g: Glyph, q: OdataQueryOptions.Query) {
        var result: DictionaryOf<Glyph> = {};



        return result
    }

    public static test() {

        var q = "$select=Rating,ReleaseDate&$expand=Products($orderby=ReleaseDate asc, Rating desc $count=true)&$filter=(FirstName ne 'Mary' or LastName eq 'White') and UserName eq 'marywhite'&$top=10&$skip=10";
        this.testquery(q);
    }
    public static testquery(q: string) {
        var parser = new Odataparser();
        var qry = parser.Parse(q);
        console.log("Query", qry);
    }



}