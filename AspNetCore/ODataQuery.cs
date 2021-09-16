using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace ApiModel
{
    public class ODataQuery
    {
        public void test() 
        {
            Uri fullUri = new Uri("http://host/service/Customers?$select=Addresses&$filter=Price le 200 and Price gt 3.5&$top=5&$orderby=Country.Name,City,Street)&$expand=Addresses/Country", UriKind.Absolute);
            var query = GetClientQuery(fullUri);

        }

        public ClientQuery GetClientQuery(Uri uri) 
        {
            var query = new ClientQuery();
            Func<Dictionary<string, string>, string, string> ValueOf = (d, key) => {
                if (d.ContainsKey(key))
                {
                    return d[key];
                }
                return "";
            };
            var operatordictionary = new Dictionary<string, string>()
            {
                ["eq"] = "=",
                ["ne"] = "<>",
                ["gt"] = ">",
                ["ge"] = ">=",
                ["lt"] = "<",
                ["le"] = "<=",
                ["and"] = "AND",
                ["or"] = "OR",
                ["not"] = "NOT"
            };
            var stringfunctions = new Dictionary<string, string>()
            {
                ["toupper"] = "upper"
            };
            var querystr = Uri.UnescapeDataString(uri.Query);
            var requestquery = Regex.Matches(querystr, "([^?=&]+)(=([^&]*))?").Cast<Match>().ToDictionary(x => x.Groups[1].Value, x => x.Groups[3].Value);
            //var requestquery = uri.Query Request.Query.ToDictionary(i => i.Key, i => i.Value.ToString());
            var r_queryname = ValueOf(requestquery, "$queryname");
            var r_orderby = ValueOf(requestquery, "$orderby");
            var r_select = ValueOf(requestquery, "$select");
            var r_filter = ValueOf(requestquery, "$filter");
            var r_count = ValueOf(requestquery, "count");
            var r_skip = ValueOf(requestquery, "$skip");
            var r_take = ValueOf(requestquery, "$top");
            var fields = r_select.Split(new string[] { "," }, StringSplitOptions.RemoveEmptyEntries).Select(i => new QueryField(i.Trim())).ToList();
            var raw_filters = r_filter.Split(new string[] { " and " }, StringSplitOptions.RemoveEmptyEntries);
            var marker = "__||_";
            var processedfilters = Strings.ProcessWithoutLiterals(r_filter, s =>
            {
                var result = s;
                foreach (var key in operatordictionary.Keys)
                {
                    result = result.Replace(key, marker + key);
                }
                return result;
            }, "'");
            var xfilters = processedfilters.Split(new string[] { marker + "and" }, StringSplitOptions.RemoveEmptyEntries);
            var filters = new List<QueryFilter>();
            foreach (var xfilter in xfilters)
            {
                foreach (var op in operatordictionary.Keys) 
                {
                    var opstr = " " + marker+  op + " ";
                    if (xfilter.IndexOf(opstr) > -1) {
                        var parts = xfilter.Split(new string[] { opstr }, StringSplitOptions.RemoveEmptyEntries);
                        var queryfilter = new QueryFilter();
                        queryfilter.Field = parts[0].Trim();
                        queryfilter.Operator = operatordictionary[op];
                        queryfilter.Values = new List<string>() { parts[1].Trim() };
                        filters.Add(queryfilter);
                    }
                }
            }
            query.Filters = filters;
            query.Fields = fields;
            query.QueryName = r_queryname;
            if (!String.IsNullOrEmpty(r_take)) {
                query.Take = int.Parse(r_take); 
            }
            if (!String.IsNullOrEmpty(r_skip))
            {
                query.Skip = int.Parse(r_skip);
            }
            if (!String.IsNullOrEmpty(r_orderby))
            {
                var parts = r_orderby.Split(' ').ToList();
                if (parts.Count == 1) 
                {
                    parts.Add("asc");
                }

                query.Ordering = new Dictionary<string, string>();
                query.Ordering.Add(parts[0], parts[1].ToUpper());
            }
            if (!String.IsNullOrEmpty(r_count))
            {
                query.GetCount = r_count == "true";
            }
            return query;
        }
    }
}
