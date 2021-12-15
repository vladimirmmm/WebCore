using ApiModel.Query;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace ApiModel
{
    public class QueryField
    {
        public string Name { get; set; }
        private List<QueryField> _Fields = new List<QueryField>();
        public List<QueryField> Fields { get { return _Fields; } set { _Fields = value; } }
        public QueryField() { }
        public QueryField(string name)
        {
            this.Name = name;
        }
    }

    public class QueryFilter
    {
        public string Type { get; set; }
        public string Field { get; set; }
        public string FieldFormat { get; set; }
        public string Operator { get; set; }
        public List<string> Values { get; set; }
        public bool ForceOuter { get; set; } = false;

        private ClienDataType _InferedType = ClienDataType.Unknown;
        private ClienDataType InferedType
        {
            get
            {
                if (_InferedType == ClienDataType.Unknown)
                {
                    var typename = String.Format("{0}", Type).ToLower();
                    switch (typename)
                    {
                        case "string":
                            _InferedType = ClienDataType.Text;
                            break;
                        case "text":
                            _InferedType = ClienDataType.Text;
                            break;
                        case "number":
                            _InferedType = ClienDataType.Number;
                            break;
                        case "date":
                            _InferedType = ClienDataType.Date;
                            break;
                        case "boolean":
                            _InferedType = ClienDataType.Booloean;
                            break;
                    }
                    
                }
                return _InferedType;
            }
        }
        private List<QueryFilter> _Children = new List<QueryFilter>();
        public List<QueryFilter> Children { get { return _Children; } set { _Children = value; } }
        private Regex FieldRegex = new Regex(@"^[a-zA-Z0-9_.-]*$");
        private Regex FieldFormatRegex = new Regex(@"^[a-zA-Z0-9(){}._-]*$");

        private Regex _ValueRegex = null;
        public Regex ValueRegex
        {
            get
            {
                if (_ValueRegex == null)
                {
                    if (InferedType == ClienDataType.Number)
                    {
                        _ValueRegex = new Regex(@"^[0-9e.-]*$");
                    }
                    if (InferedType == ClienDataType.Date)
                    {
                        _ValueRegex = new Regex(@"^[0-9/.\s:-]*$");
                    }
                    if (InferedType == ClienDataType.Text)
                    {
                        _ValueRegex = new Regex(@".*");
                    }
                    if (InferedType == ClienDataType.Booloean)
                    {
                        _ValueRegex = new Regex(@"^(?:(1|y(?:es)?|t(?:rue)?|on)|(0|n(?:o)?|f(?:alse)?|off))$");

                    }
                }
                return _ValueRegex;
            }
        }
        private HashSet<string> Operators = new HashSet<string>() {
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
        };

        public bool IsValid()
        {
            var isvalid = true;
            isvalid = isvalid ? FieldRegex.Match(Field).Success : isvalid;
            if (!String.IsNullOrEmpty(FieldFormat))
            {
                isvalid = isvalid ? FieldFormatRegex.Match(FieldFormat).Success : isvalid;
            }
            if (Operator == "AND" || Operator == "OR")
            {
                foreach (var childfilter in Children)
                {
                    isvalid = isvalid ? childfilter.IsValid() : isvalid;
                }
                isvalid = isvalid ? Operator == "OR" ? Children.Count > 1 : true : isvalid;
                isvalid = isvalid ? Operator == "AND" ? Children.Count > 1 : true : isvalid;
            }
            else
            {
                isvalid = isvalid ? InferedType != ClienDataType.Unknown : isvalid;

                isvalid = isvalid ? Operators.Contains(Operator) : isvalid;
                if (this.Values != null)
                {
                    foreach (var Value in Values)
                    {
                        isvalid = isvalid ? Value == "{NULL}" ? isvalid : ValueRegex.Match(Value).Success : isvalid;
                    }
                }
            }
            return isvalid;
        }

        public string SetNullValue(String val)
        {
            if (val == "{NULL}") { return "NULL"; }
            return val;
        }
        public string SetStringValue(String val)
        {
            var value = val;
            value = val.Trim().Trim('\'');
            value = value.Replace("'", "''");
            value = "'" + value + "'";
            return value;
        }

        public string GetSQL(DbQueryField field, Dictionary<string, DbQueryField> fields)
        {
            var sb = new StringBuilder();
            if (Children != null && Children.Count > 0)
            {
                var items = Children.Select(i => i.GetSQL(fields[i.Field], fields)).ToList();
                sb.AppendLine("   (");
                sb.Append(Strings.ListToString(items, "\n      " + Operator + " "));
                sb.AppendLine("   )\n");
            }
            else
            {
                var values = this.Values;
                if (this.Operator.StartsWith("IS"))
                {
                    values = Values.Select(i => SetNullValue(i)).ToList();
                }
                else
                {
                    if (InferedType == ClienDataType.Text || InferedType == ClienDataType.Date)
                    {
                        values = Values.Select(i => SetStringValue(i)).ToList();
                    }
                }

                var fieldname = String.Format("{0}.{1}", field.Qualifier, field.PhysicalName);
                if (!String.IsNullOrEmpty(FieldFormat))
                {
                    fieldname = String.Format(FieldFormat, fieldname);
                }

                if (this.Operator == "IN")
                {
                    var page = 0;
                    var count = 1000;
                    values = values.Distinct().ToList();
                    var valueset = values.Skip(page * count).Take(count).ToList();
                    sb.AppendLine("(");
                    while (valueset.Count > 0)
                    {
                        if (page > 0)
                        {
                            sb.AppendLine(" OR ");
                        }
                        sb.Append(String.Format("{0} {1} ", fieldname, Operator));

                        sb.Append("(");
                        sb.Append(Strings.ListToString(valueset, ", "));
                        sb.Append(")");
                        page++;
                        valueset = values.Skip(page * count).Take(count).ToList();
                    }
                    sb.AppendLine(")");
                }
                else
                {
                    sb.Append(String.Format("{0} {1} ", fieldname, Operator));

                    sb.Append(values.FirstOrDefault());
                }
            }
            return sb.ToString();
        }
        public string GetSQLForJoin(DbQueryField field, Dictionary<string, DbQueryField> fields)
        {
            var sb = new StringBuilder();
            if (Children != null && Children.Count > 0)
            {
                var items = Children.Select(i => i.GetSQL(fields[i.Field], fields)).ToList();
                sb.AppendLine("   (");
                sb.Append(Strings.ListToString(items, "\n      " + Operator + " "));
                sb.AppendLine("   )\n");
            }
            else
            {
                var values = this.Values;
                if (InferedType == ClienDataType.Text || InferedType == ClienDataType.Date)
                {
                    values = Values.Select(i => SetStringValue(i)).ToList();
                }
                var fieldname = String.Format("{0}", field.PhysicalName);
                if (!String.IsNullOrEmpty(FieldFormat))
                {
                    fieldname = String.Format(FieldFormat, fieldname);

                }
                sb.Append(String.Format("{0} {1} ", fieldname, Operator));

                if (this.Operator == "IN")
                {
                    sb.Append("(");
                    sb.Append(Strings.ListToString(values, ", "));
                    sb.Append(")");
                }
                else
                {
                    var vettedvalues = values.Select(i => i == "{NULL}" ? "NULL" : i);
                    sb.Append(vettedvalues.FirstOrDefault());
                }
            }
            return sb.ToString();
        }
        public static QueryFilter Create(ClienDataType Type, string Field, object Value, string fieldFormat = "")
        {
            return Create(Type, Field, Value.ToString(), fieldFormat);
        }
        public static QueryFilter Create(ClienDataType Type, string Field, string Value, string fieldFormat = "")
        {
            if (Value == null)
            {
                return null;
            }
            var filter = new QueryFilter();
            filter._InferedType = Type;
            filter.Type = Type.ToString();
            filter.Operator = "=";
            filter.Field = Field;
            filter.Values = new List<string>() { Value };
            filter.FieldFormat = fieldFormat;
            return filter;
        }
        public static QueryFilter CreateSimple(ClienDataType Type, string Field, string Operator, string Value, string fieldFormat = "")
        {
            if (Value == null)
            {
                return null;
            }
            var filter = new QueryFilter();
            filter._InferedType = Type;
            filter.Type = Type.ToString();
            filter.Operator = Operator;
            filter.Field = Field;
            filter.Values = new List<string>() { Value };
            filter.FieldFormat = fieldFormat;
            return filter;
        }
        public static QueryFilter Create(ClienDataType Type, string Field, IEnumerable<string> Values, string fieldFormat = "")
        {
            if (Values.Count() == 0)
            {
                return null;
            }
            var filter = new QueryFilter();
            filter._InferedType = Type;
            filter.Type = Type.ToString();
            filter.Operator = "IN";
            filter.Field = Field;
            filter.Values = Values.ToList();
            filter.FieldFormat = fieldFormat;
            return filter;
        }

        public static QueryFilter CreateOr(List<QueryFilter> children, string fieldFormat = "upper({0})", string type = "Text", string field = "Id")
        {
            if (children.Count() == 0)
            {
                return null;
            }
            if (children.Count() > 1)
            {
                var filter = new QueryFilter();
                filter.Field = field;
                filter.Operator = "OR";
                filter.Type = type;
                filter.FieldFormat = fieldFormat;
                filter.Values = new List<string>();
                filter.Children = children;
                return filter;
            }
            else
            {
                return children.FirstOrDefault();
            }
        }

        public static QueryFilter CreateAnd(List<QueryFilter> children, string fieldFormat = "upper({0})", string type = "Text", string field = "Id")
        {
            if (children.Count() == 0)
            {
                return null;
            }
            if (children.Count() > 1)
            {
                var filter = new QueryFilter();
                filter.Field = field;
                filter.Operator = "AND";
                filter.Type = type;
                filter.FieldFormat = fieldFormat;
                filter.Values = new List<string>();
                filter.Children = children;
                return filter;
            }
            else
            {
                return children.FirstOrDefault();
            }
        }
    }
    public class ClientQueryGroup
    {
        public static HashSet<string> AggregateFunctions = new HashSet<string>() {
            "SUM",
            "COUNT",
            "MAX",
            "MIN"
        };
        public List<string> By { get; set; } = new List<string>();

        public Dictionary<string, string> Aggregates { get; set; } = new Dictionary<string, string>();
    }

    public class ClientQuery
    {
        public string Info { get; set; }
        public string QueryName { get; set; }

        private List<QueryField> _Fields = new List<QueryField>();
        public List<QueryField> Fields { get { return _Fields; } set { _Fields = value; } }

        private List<QueryFilter> _Filters = new List<QueryFilter>();
        public List<QueryFilter> Filters { get { return _Filters; } set { _Filters = value; } }

        private List<string> _Include = new List<string>();
        public List<string> Include { get { return _Include; } set { _Include = value; } }

        private Dictionary<string, string> _Ordering = new Dictionary<string, string>();
        public Dictionary<string, string> Ordering { get { return _Ordering; } set { _Ordering = value; } }
        public ClientQueryGroup Grouping { get; set; }
        public Dictionary<string, string> Parameters { get; set; } = new Dictionary<string, string>();

        public Dictionary<string, List<object>> Datasets = new Dictionary<string, List<object>>();

        public int? Skip { get; set; }
        public int? Take { get; set; }
        public bool GetCount { get; set; }
        public bool? Distinct { get; set; }
        public bool? Compress { get; set; }
        public bool? SetCP { get; set; }

        public void SetFilter(QueryFilter filter)
        {
            if (filter == null)
            {
                return;
            }
            var existing = this.Filters.Where(i => i.Field == filter.Field).ToList();
            foreach (var existingfilter in existing)
            {
                this.Filters.Remove(filter);
            }
            this.Filters.Add(filter);
        }

        public void SetField(QueryField field)
        {
            var existing = this.Fields.FirstOrDefault(i => i.Name == field.Name);
            if (existing == null)
            {
                this.Fields.Add(field);
            }
        }
        public void SetField(string fieldname)
        {
            var field = new QueryField(fieldname);
            SetField(field);
        }

        public void RemoveField(QueryField field)
        {
            var existing = this.Fields.FirstOrDefault(i => i.Name == field.Name);
            this.Fields.Remove(existing);
        }

        public static ClientQuery CreateListQuery(string Queryname, IEnumerable<string> fields = null)
        {
            var result = new ClientQuery();
            if (fields != null)
            {
                foreach (var field in fields)
                {
                    result.SetField(field);
                }
            }
            else
            {
                result.SetField("*");
            }
            result.QueryName = Queryname;
            result.Skip = 0;
            result.Take = null;
            result.GetCount = false;
            result.Compress = false;
            result.Ordering = new Dictionary<string, string>() { ["Id"] = "ASC" };
            return result;
        }

        public static string SetResultParameters(QueryFilter filter, Dictionary<string, Result<List<Dictionary<string, object>>>> results)
        {
            var log = new StringBuilder();

            var values = new List<string>();
            foreach (var value in filter.Values)
            {
                var rp = ResultParameter.GetResultParameter(value);
                if (rp != null)
                {
                    log.AppendLine(String.Format("ResultParameter > {0}{1}{2}", rp.QueryKey, rp.Method, rp.FieldAccessor));
                    if (rp.Method == "List")
                    {
                        var resultset = results.ContainsKey(rp.QueryKey) ? results[rp.QueryKey] : null;
                        if (resultset != null)
                        {
                            log.AppendLine(String.Format("resultset: {0}: {1}", "", resultset.Model.Count));
                        }
                        var fvalues = ClientQuery.GetList(results, rp);
                        if (fvalues.Count == 0)
                        {
                            fvalues.Add("-1");
                        }
                        if (fvalues.Count > 1)
                        {
                            filter.Operator = "IN";
                        }
                        values.AddRange(fvalues);
                    }
                }
                else
                {
                    values.Add(value);
                }
            }
            filter.Values = values;
            if (filter.Children != null)
            {
                foreach (var childfilter in filter.Children)
                {
                    log.AppendLine(ClientQuery.SetResultParameters(childfilter, results));
                }
            }
            return log.ToString();

        }
        public static string SetResultParameters(ClientQuery query, Dictionary<string, Result<List<Dictionary<string, object>>>> results)
        {
            var log = new StringBuilder();
            log.AppendLine("SetResultParameters, Results: " + results.Count);
            foreach (var filter in query.Filters)
            {
                ClientQuery.SetResultParameters(filter, results);
            }
            return log.ToString();
        }

        public static Func<Dictionary<string, Result<List<Dictionary<string, object>>>>, ResultParameter, List<string>> GetList = (results, rp) =>
        {
            var result = new List<string>();
            var resultset = results.ContainsKey(rp.QueryKey) ? results[rp.QueryKey] : null;
            if (resultset != null)
            {
                var fielddictionary = resultset.ViewData.ContainsKey("FieldDictionary[]") ? (resultset.ViewData["FieldDictionary[]"] as Dictionary<string, int>) : null;
                if (fielddictionary != null)
                {
                    if (rp.FieldAccessor == "SortimentStocknos")
                    {
                        var six = fielddictionary.ContainsKey("SortimentValue") ? fielddictionary["SortimentValue"].ToString() : "-1";
                        if (six != "-1")
                        {
                            var stocknos = new HashSet<string>();
                            var sortimentvalues = resultset.Model.Where(i => i.ContainsKey(six)).Select(i => String.Format("{0}", i[six])).ToList();
                            foreach (var sortimentvalue in sortimentvalues)
                            {
                                if (!String.IsNullOrEmpty(sortimentvalue))
                                {
                                    var sortimentitems = sortimentvalue.Split(new string[] { ";" }, StringSplitOptions.RemoveEmptyEntries);
                                    foreach (var sortimentitem in sortimentitems)
                                    {
                                        var parts = sortimentitem.Split(new string[] { ":" }, StringSplitOptions.RemoveEmptyEntries);
                                        var stockno = parts.LastOrDefault().Trim();
                                        if (!stocknos.Contains(stockno))
                                        {
                                            stocknos.Add(stockno);
                                        }
                                    }
                                }
                            }
                            result = stocknos.ToList();
                        }
                    }
                    else
                    {
                        var ix = fielddictionary.ContainsKey(rp.FieldAccessor) ? fielddictionary[rp.FieldAccessor].ToString() : "-1";
                        if (ix != "-1")
                        {
                            result = resultset.Model.Where(i => i.ContainsKey(ix)).Select(i => String.Format("{0}", i[ix])).ToList();
                            if (result.Count == 0)
                            {
                                result = resultset.Model.Where(i => i.ContainsKey(rp.FieldAccessor)).Select(i => String.Format("{0}", i[rp.FieldAccessor])).ToList();
                            }
                        }
                    }
                }
            }
            return result;
        };

        public static object GetValueAtPath(Dictionary<string, object> obj, string path)
        {
            object result = null;
            var currentobj = obj;
            var parts = path.Split(new string[] { "." }, StringSplitOptions.RemoveEmptyEntries);
            var lastpart = parts.LastOrDefault();

            for (var i = 0; i < parts.Length - 1; i++)
            {
                var part = parts[i];
                if (currentobj == null) { return null; }
                currentobj = currentobj[part] as Dictionary<string, object>;
            }
            if (currentobj != null)
            {
                result = currentobj[lastpart];
            }
            return result;
        }
    }
       
    public class UriQuery {
        public string Query { get; set; }
        public List<Object> Fields { get; set; }
        public List<Object> Filters { get; set; }
        public string OrderBy{ get; set; }
        public int? Skip { get; set; }
        public int? Take { get; set; }
    }
    public class ResultParameter
    {
        public string QueryKey;
        public string Method;
        public string FieldAccessor;

        public static ResultParameter GetResultParameter(string value)
        {
            ResultParameter rp = null;
            if (value.StartsWith("@[Result:"))
            {
                var querykey = Strings.TextBetween(value, "@[Result:", "]");
                var method = Strings.TextBetween(value, "].", "(");
                var fieldaccessor = Strings.TextBetween(value, "(", ")");
                if (String.IsNullOrEmpty(querykey)) { return rp; }
                if (String.IsNullOrEmpty(method)) { return rp; }
                if (String.IsNullOrEmpty(fieldaccessor)) { return rp; }
                rp = new ResultParameter();
                rp.FieldAccessor = fieldaccessor;
                rp.QueryKey = querykey;
                rp.Method = method;
            }
            return rp;
        }
    }
    public class SqlQuery
    {
        public string Name { get; set; }
        public string TypeName { get; set; }
        public string Text { get; set; }
        public SelectStatement Select { get; set; }
        public double Duration { get; set; }

        private List<string> _KeyFields = new List<string>();
        public List<string> KeyFields { get { return _KeyFields; } set { _KeyFields = value; } }

        public Dictionary<string, string> RelationWithMain = new Dictionary<string, string>();

        private List<string> _ListFields = new List<string>();
        public List<string> ListFields { get { return _ListFields; } set { _ListFields = value; } }

        public List<Dictionary<string, object>> Result { get; set; }
        public Dictionary<string, int> FieldDictionary { get; set; }
        public Exception Error { get; set; }
    }
}