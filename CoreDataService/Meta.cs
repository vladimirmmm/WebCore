using ApiModel;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;

namespace DataService.Models
{
    public class FieldMeta
    {
        public string UIType { get; set; }
        public string SourceType { get; set; }
        public string Nullable { get; set; }
    }
    public class TypeCollection
    {
        public string DBType { get; set; }
        public string CLRType { get; set; }
        public string TSType { get; set; }
        public string UIType { get; set; }
    }
    public class Meta
    {
        private string GetCLRType(string dbtype, string fieldname)
        {
            var result = "string";
            var parts = dbtype.Split(' ');
            var tpart = parts[0];
            var dates = new HashSet<string>() { "DATE", "TIMESTAMP" };
            var integers = new HashSet<string>() { "INTEGER", "SMALLINT" };
            var doubles = new HashSet<string>() { "DOUBLE", "FLOAT" };
            if (dates.Contains(tpart))
            {
                result = "DateTime?";
            }
            if (integers.Contains(tpart))
            {
                result = "int?";
            }
            if (doubles.Contains(tpart))
            {
                result = "double?";
            }
            if (fieldname.EndsWith("Id"))
            {
                result = "long?";
            }
            return result;
        }
        public Dictionary<string, Dictionary<string, TypeCollection>> GetMeta(string jsonquery, string jsonlayout)
        {
            var result = new Dictionary<string, Dictionary<string, TypeCollection>>();
            var layout = JsonConvert.DeserializeObject<Dictionary<string, Dictionary<string, string>>>(jsonlayout);
            var queries = JsonConvert.DeserializeObject<Dictionary<string, DbQuery>>(jsonquery);
            var meta = new Dictionary<string, Dictionary<string, object>>();
            foreach (var query in queries)
            {
                var tablename = query.Value.Getsource();
                var typename = query.Value.TypeName;
                var querytypecontainer = new Dictionary<string, TypeCollection>();
                if (!result.ContainsKey(typename))
                {
                    result.Add(typename, querytypecontainer);

                }
                querytypecontainer = result[typename];

                var tabledict = layout.ContainsKey(tablename) ? layout[tablename] : new Dictionary<string, string>();
                if (!meta.ContainsKey(query.Key))
                {
                    meta.Add(query.Key, new Dictionary<string, object>());
                }
                var tablemeta = meta[query.Key];
                var properties = new Dictionary<string, TypeCollection>();

                foreach (var field in query.Value.Fields)
                {
                    var typecollection = new TypeCollection();
                    typecollection.CLRType = "object";

                    var fieldname = field.Value;
                    if (tabledict.ContainsKey(fieldname))
                    {
                        var dbtype = tabledict[fieldname];
                        var uitype = GetUIType(dbtype);
                        var clrtype = GetCLRType(dbtype, field.Key);
                        typecollection.CLRType = clrtype;
                        typecollection.DBType = dbtype;
                        typecollection.UIType = uitype;
                        var fm = new FieldMeta();
                        fm.UIType = uitype;
                        if (!tablemeta.ContainsKey(field.Key))
                        {
                            tablemeta.Add(field.Key, fm);
                        }

                    }
                    properties.Add(field.Key, typecollection);


                }
                if (query.Value.Keys.Count > 0)
                {
                    tablemeta.Add("[Keys]", query.Value.Keys);

                }
                foreach (var relation in query.Value.Relations)
                {
                    var rquery = queries.Values.FirstOrDefault(i => i.Name == relation.QueryName);
                    var rprop = rquery.TypeName;

                    var clrtype = (relation.Type == 0 ? rquery.TypeName : "List<" + rquery.TypeName + ">");
                    var uitype = (relation.Type == 0 ? rquery.TypeName : rquery.TypeName + "[]");
                    var fm = new FieldMeta();
                    fm.SourceType = rprop;
                    tablemeta.Add(relation.Alias, fm);
                    var typecollection = new TypeCollection();
                    typecollection.CLRType = clrtype;
                    typecollection.UIType = uitype;
                    properties.Add(relation.Alias, typecollection);

                }
                foreach (var property in properties)
                {
                    if (!querytypecontainer.ContainsKey(property.Key))
                    {
                        querytypecontainer.Add(property.Key, property.Value);
                    }

                }


            }
            return result;
        }
        public string Generate(string jsonquery, string jsonlayout)
        {
            var jsonmeta = "";
            var layout = JsonConvert.DeserializeObject<Dictionary<string, Dictionary<string, string>>>(jsonlayout);
            var queries = JsonConvert.DeserializeObject<Dictionary<string, DbQuery>>(jsonquery);
            var meta = new Dictionary<string, Dictionary<string, object>>();
            foreach (var query in queries)
            {
                var tablename = query.Value.Getsource();
                if (layout.ContainsKey(tablename))
                {
                    var tabledict = layout[tablename];
                    if (!meta.ContainsKey(query.Key))
                    {
                        meta.Add(query.Key, new Dictionary<string, object>());
                    }
                    var tablemeta = meta[query.Key];

                    foreach (var field in query.Value.Fields)
                    {
                        var fieldname = field.Value;
                        if (tabledict.ContainsKey(fieldname))
                        {
                            var dbtype = tabledict[fieldname];
                            var uitype = GetUIType(dbtype);
                            var fm = new FieldMeta();
                            fm.SourceType = uitype;
                            if (!tablemeta.ContainsKey(field.Key))
                            {
                                tablemeta.Add(field.Key, fm);
                            }
                        }

                    }
                    if (query.Value.Keys.Count > 0)
                    {
                        tablemeta.Add("[Keys]", query.Value.Keys);

                    }
                    foreach (var relation in query.Value.Relations)
                    {
                        var rprop = relation.QueryName;
                        rprop = rprop + (relation.Type == 0 ? "{}" : "[]");
                        var fm = new FieldMeta();
                        fm.SourceType = rprop;

                        tablemeta.Add(relation.Alias, fm);

                    }
                }
            }
            var settings = new JsonSerializerSettings();
            settings.NullValueHandling = NullValueHandling.Ignore;
            settings.Formatting = Formatting.Indented;
            jsonmeta = JsonConvert.SerializeObject(meta, settings);
            return jsonmeta;
        }
        private string GetUIType(string dbtype)
        {
            var result = "string";
            var parts = dbtype.Split(' ');
            var tpart = parts[0];
            var dates = new HashSet<string>() { "DATE", "TIMESTAMP" };
            var integers = new HashSet<string>() { "INTEGER", "SMALLINT" };
            var doubles = new HashSet<string>() { "DOUBLE", "FLOAT" };
            if (dates.Contains(tpart))
            {
                result = "Date";
            }
            if (integers.Contains(tpart))
            {
                result = "integer";
            }
            if (doubles.Contains(tpart))
            {
                result = "double";
            }
            return result;
        }

        public void Test()
        {
            var dblayoutpath = @"data\dblayout.json";
            var qeriespath = @"data\DbQueries.json";
            var metas = GetMeta(System.IO.File.ReadAllText(qeriespath), System.IO.File.ReadAllText(dblayoutpath));
            var csharpcodebuilder = new StringBuilder();
            var metabuilder = new StringBuilder();
            foreach (var key in metas.Keys)
            {
                var meta = metas[key];
                csharpcodebuilder.AppendLine("\tpublic partial class " + key + ": BaseData");
                csharpcodebuilder.AppendLine("\t{");
                foreach (var pkey in meta.Keys)
                {
                    var typecollection = meta[pkey];
                    var value = typecollection.CLRType;
                    var defaultvalue = value.StartsWith("List<") ? " = new " + value + "();" : "";

                    csharpcodebuilder.AppendLine(String.Format("\t\tpublic {0} {1} {{get; set;}}{2}", value, pkey, defaultvalue));
                }

                csharpcodebuilder.AppendLine("");
                csharpcodebuilder.AppendLine("\t}");
                csharpcodebuilder.AppendLine("");
            }


        }
    }


}