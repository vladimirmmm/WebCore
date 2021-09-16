using System;
using System.Linq;
using System.Collections.Generic;
using System.Text;
using ApiModel.Query;
using System.Text.RegularExpressions;

namespace ApiModel
{
    public class DbQuery
    {
        private static List<DbQuery> Queries = new List<DbQuery>();
        public string ConnectionName { get; set; }
        public string Domain { get; set; }
        public string TypeName { get; set; }
        public string Name { get; set; }

        private List<string> _Keys = new List<string>();
        public List<string> Keys { get { return _Keys; } set { _Keys = value; } }

        private Dictionary<string, string> _Fields = new Dictionary<string, string>();
        private Dictionary<string, string> _FieldTypes = new Dictionary<string, string>();
        public Dictionary<string, string> Fields { get { return _Fields; } set { _Fields = value; } }
        public Dictionary<string, string> FieldTypes { get { return _FieldTypes; } set { _FieldTypes = value; } }

        private List<DbRelation> _Relations = new List<DbRelation>();
        public List<DbRelation> Relations { get { return _Relations; } set { _Relations = value; } }

        public List<string> Datasets = new List<string>();

        public string Source { get; set; }
        public string Folder { get; set; }

        public string Getsource()
        {
            if (this.Source.StartsWith("file:"))
            {
                var filename = this.Source.Substring(this.Source.IndexOf(":") + 1);
                var sglfilepath = Folder + filename;
                sglfilepath = sglfilepath.Replace("\\\\", "\\");
                if (System.IO.File.Exists(sglfilepath))
                {
                    var s = System.IO.File.ReadAllText(sglfilepath);
                    this.Source = s;
                }
            }
            return this.Source;
        }

        public string Where { get; set; }

        public string OrderBy { get; set; }

        public Boolean ExcludeTypeNames { get; set; }

        public DbQuery()
        {
        }

        public string Translate(string clientqualifier, QueryService qs)
        {
            var result = "";
            if (clientqualifier.IndexOf(".") > -1)
            {
                var parts = clientqualifier.Split('.');
                var alias = parts[0];
                var name = parts[1];
                var relation = this.Relations.FirstOrDefault(i => i.Alias == alias);
                if (relation != null)
                {
                    var relatedquery = qs.GetQueryByName(relation.QueryName);
                    result = String.Format("{0}.{1}", alias, relatedquery.Fields[name]);
                }
            }
            else
            {
                result = String.Format("{0}.{1}", this.Name, this.Fields[clientqualifier]);
            }
            return result;
        }

        public string TranslateToPhysicalName(string clientqualifier)
        {
            return String.Format("{0}", this.Fields[clientqualifier]);
        }
        private DbRelation GetRelation(string alias, DbQuery query, QueryService qs)
        {
            var relation = query.Relations.FirstOrDefault(i => i.Alias == alias);
            if (relation != null)
            {

            }
            else
            {
                var flexrelations = query.Relations.Where(i => !String.IsNullOrEmpty(i.Prefix)).ToList();
                var flexrelation = flexrelations.FirstOrDefault(i => alias.StartsWith(i.Prefix));
                if (flexrelation != null)
                {
                    relation = flexrelation.Copy();
                    var aliaskey = alias.Substring(relation.Prefix.Length);
                    var keys = relation.Keys.Keys.ToList();
                    foreach (var key in keys)
                    {
                        if (key.IndexOf(relation.FlexKey) > -1)
                        {
                            var newkey = key.Replace(relation.FlexKey, aliaskey);
                            var countervalue = relation.Keys[key];
                            relation.Keys.Remove(key);
                            relation.Keys.Add(newkey, countervalue);
                        }
                    }
                    foreach (var key in relation.Keys.Keys)
                    {
                        if (relation.Keys[key].IndexOf(relation.FlexKey) > -1)
                        {
                            var countervalue = relation.Keys[key].Replace(relation.FlexKey, aliaskey);
                            relation.Keys[key] = countervalue;
                        }
                    }
                    relation.Alias = relation.Prefix + aliaskey;
                }
            }
            return relation;
        }
        private List<DbQueryField> GetDbQueryField(
            string clientfield,
            Dictionary<string, string> joins,
            List<JoinStatement> joinclause,
            QueryService qs,
            bool isinwhere = false)
        {
            var result = new List<DbQueryField>();
            var dbqueryfield = new DbQueryField(clientfield);
            if (dbqueryfield.RelationPath.Count == 0)
            {
                dbqueryfield.Qualifier = this.Name;
            }
            var isok = true;
            var parentquery = this;
            var currentpaths = new List<String>(dbqueryfield.RelationPath.Count);
            var currentqualifier = "";
            var parentqualifier = "";
            var isall = dbqueryfield.Alias == "*";
            DbRelation rootrelation = null;
            foreach (var path in dbqueryfield.RelationPath)
            {
                currentpaths.Add(path);
                var relation = GetRelation(path, parentquery, qs);
                if (relation == null)
                {
                    isok = false;
                    break;
                }
                else
                {
                    var relatedquery = qs.GetQueryByName(relation.QueryName);
                    if (relatedquery == null)
                    {
                        throw new Exception("Relation by " + relation.QueryName + " was not found");
                    }
                    currentqualifier = Strings.ListToString(currentpaths, ".");
                    if (dbqueryfield.RelationPath.IndexOf(path) == 0)
                    {
                        rootrelation = relation;
                    }

                    if (relation.Type == 0)
                    {
                        currentqualifier = Strings.ListToString(currentpaths, ".");
                        if (!joins.ContainsKey(currentqualifier) && rootrelation.Type == 0)
                        {
                            joins.Add(currentqualifier, relation.GetJoin(parentquery, qs, currentqualifier, parentqualifier));
                            joinclause.Add(relation.GetJoinStatement(parentquery, qs, currentqualifier, parentqualifier));
                        }
                    }
                    else if (relation.Type == 1)
                    {

                        if (!joins.ContainsKey(currentqualifier))
                        {
                            if (isinwhere)
                            {
                                //joins.Add(currentqualifier, relation.GetJoin(parentquery, currentqualifier, parentqualifier));
                                //joinclause.Add(relation.GetJoinStatement(parentquery, currentqualifier, parentqualifier));
                            }
                        }
                    }
                    else
                    {
                        isok = false;
                        break;
                    }
                    parentquery = relatedquery;
                    parentqualifier = currentqualifier;
                }
            }
            isok = isok ? parentquery.Fields.ContainsKey(dbqueryfield.Alias) || isall : isok;
            if (isok)
            {
                dbqueryfield.PhysicalName = dbqueryfield.Alias == "*" ? "*" : parentquery.Fields[dbqueryfield.Alias];
                dbqueryfield.RelativeClientName = dbqueryfield.Alias;
                dbqueryfield.TypeName = parentquery.TypeName;
                dbqueryfield.QueryName = parentquery.Name;

                if (isall)
                {
                    if (rootrelation != null && rootrelation.Type == 0)
                    {
                        var query = qs.GetQueryByName(parentquery.Name);

                        foreach (var field in query.Fields)
                        {
                            var key = dbqueryfield.Qualifier.Trim('"') + "." + field.Key;
                            var newdbqueryfield = new DbQueryField(key);
                            newdbqueryfield.PhysicalName = field.Value;
                            newdbqueryfield.QueryName = query.Name;
                            newdbqueryfield.TypeName = query.TypeName;
                            newdbqueryfield.Qualifier = dbqueryfield.Qualifier;
                            result.Add(newdbqueryfield);
                        }
                    }
                    else
                    {
                        result.Add(dbqueryfield);
                    }
                }
                else
                {
                    result.Add(dbqueryfield);
                }
            }
            else
            {
                dbqueryfield = null;
            }
            return result;
        }

        public List<SqlQuery> GetQueries(ClientQuery clientQuery, QueryService qs)
        {
            var result = new List<SqlQuery>();
            var sqlstatement = new SelectStatement();

            var joins = new Dictionary<string, string>();
            var fields = new Dictionary<string, string>();
            var listfields = new Dictionary<string, ClientQuery>();
            var wheres = new List<string>();
            var orderbys = new List<string>();
            var allfields = new List<string>();
            var groupselectfields = new Dictionary<string, DbQueryField>();
            var groupfields = new Dictionary<string, DbQueryField>();

            var queryfields = this.Fields.Select(i => i.Key).Distinct().ToDictionary<string, string, DbQueryField>(i => i, i => null);
            var selectfields = clientQuery.Fields.Select(i => i.Name).Distinct().ToDictionary<string, string, DbQueryField>(i => i, i => null);
            var wherefields = clientQuery.Filters.Select(i => i.Field).Distinct().ToDictionary<string, string, DbQueryField>(i => i, i => null);
            var wherechildfields = clientQuery.Filters.Where(i => i.Children != null).SelectMany(i => i.Children).Select(i => i.Field).Distinct().ToDictionary<string, string, DbQueryField>(i => i, i => null);

            var parameters = clientQuery.Parameters;
            var rsimpleregex = "@[a-zA-Z0-9_.]+";
            var originalsource = this.Getsource();
            var matchedsource = originalsource;
            var sourceparameters = Regex.Matches(originalsource, rsimpleregex);
            foreach (Match sp in sourceparameters)
            {
                var key = sp.Value;
                var val = parameters.ContainsKey(key) ? parameters[key] : "NULL";
                if (val.IndexOf("|") > -1)
                {
                    var values = val.Split('|');
                    var xval = "'" + Strings.ListToString(values.Select(i => i.Replace("'", "")).ToList(), "|") + "'";
                    val = xval;
                }
                else
                {
                    var isstring = val.StartsWith("'") && val.EndsWith("'");
                    if (isstring)
                    {
                        val = val.Trim('\'');
                        val = val.Replace("'", "''");
                        val = "'" + val + "'";
                    }
                    else
                    {
                        val = val.Replace("'", "''");
                    }
                }
                matchedsource = matchedsource.Replace(key, val);
            }

            var orderbyfields = clientQuery.Ordering.Keys.ToDictionary<string, string, string>(i => i, i => clientQuery.Ordering[i]);
            if (selectfields.Any(i => i.Key == "*"))
            {
                selectfields.Remove("*");
                foreach (var queryfield in queryfields)
                {
                    if (!selectfields.ContainsKey(queryfield.Key))
                    {
                        selectfields.Add(queryfield.Key, null);
                    }
                }
            }
            var incompletelistselects = selectfields.Where(i => Relations.Any(r => r.Type == 1 && r.Alias == i.Key)).ToList();
            foreach (var irl in incompletelistselects)
            {
                selectfields.Remove(irl.Key);
                selectfields.Add(irl.Key + ".*", null);
            }

            var allDbFields = new Dictionary<string, DbQueryField>();
            allfields.AddRange(selectfields.Keys);
            allfields.AddRange(wherefields.Keys);
            allfields.AddRange(orderbyfields.Keys);
            allfields.AddRange(wherechildfields.Keys);
            allfields = allfields.Distinct().ToList();

            if (clientQuery.Grouping != null)
            {
                foreach (var field in clientQuery.Grouping.By)
                {
                    var dbqueryfield = GetDbQueryField(field, joins, sqlstatement.Join, qs, false).FirstOrDefault();
                    groupselectfields.Add(field, dbqueryfield);
                    groupfields.Add(field, dbqueryfield);
                }
                foreach (var aggregate in clientQuery.Grouping.Aggregates)
                {
                    var af = aggregate.Key;
                    var field = aggregate.Value;
                    var dbqueryfield = GetDbQueryField(field, joins, sqlstatement.Join, qs, false).FirstOrDefault();
                    dbqueryfield.FunctionFS = af + "({0})";
                    groupselectfields.Add(field, dbqueryfield);
                }
            }

            foreach (var clientfield in allfields)
            {
                var isinwhere = wherefields.ContainsKey(clientfield) || wherechildfields.ContainsKey(clientfield);
                var dbqueryfields = GetDbQueryField(clientfield, joins, sqlstatement.Join, qs, isinwhere);
                var isinselect = selectfields.ContainsKey(clientfield);
                foreach (var dbqueryfield in dbqueryfields)
                {
                    if (!allDbFields.ContainsKey(dbqueryfield.ClientFieldName))
                    {
                        allDbFields.Add(dbqueryfield.ClientFieldName, dbqueryfield);
                    }
                    if (isinselect)
                    {
                        if (!selectfields.ContainsKey(dbqueryfield.ClientFieldName))
                        {
                            selectfields.Add(dbqueryfield.ClientFieldName, null);
                        }
                        selectfields[dbqueryfield.ClientFieldName] = dbqueryfield;
                    }
                }
                if (dbqueryfields.Count > 1 && isinselect)
                {
                    selectfields.Remove(clientfield);
                }
            }

            var tab = "   ";

            orderbys = orderbyfields.Select(i => allDbFields[i.Key].Qualifier + "." + allDbFields[i.Key].PhysicalName + " " + i.Value).ToList();

            var undefinedfields = selectfields.Where(i => i.Value == null).Select(i => i.Key).ToList();
            if (undefinedfields.Count > 0 && !qs.RemoveUndefinedFields)
            {
                throw new Exception(String.Format("The following fields are not defined for query {0}: {1}", clientQuery.QueryName, Strings.ListToString(undefinedfields)));
            }
            var selectlistrelations = this.Relations.Where(i => i.Type == 1 && selectfields.ContainsKey(i.Alias)).ToList();
            var listrelations = this.Relations.Where(i => i.Type == 1).ToDictionary(i => i.Alias);
            foreach (var relation in listrelations.Values)
            {
                var fieldsofrelation = selectfields.Where(i => i.Value.RelationPath.FirstOrDefault() == relation.Alias).ToList();
                if (fieldsofrelation.Count > 0)
                {
                    if (!listfields.ContainsKey(relation.Alias))
                    {
                        var eclientquery = new ClientQuery();
                        eclientquery.QueryName = relation.QueryName;
                        listfields.Add(relation.Alias, eclientquery);
                    }
                    foreach (var field in fieldsofrelation)
                    {
                        var qualifiers = field.Value.RelationPath.Skip(1).ToList();

                        qualifiers.Add(field.Value.Alias);
                        var fieldname = Strings.ListToString(qualifiers, ".");
                        listfields[relation.Alias].Fields.Add(new QueryField(fieldname));
                        selectfields.Remove(field.Key);
                    }
                }
            }
            sqlstatement.Take = clientQuery.Take;
            sqlstatement.Skip = clientQuery.Skip;
            if (clientQuery.Distinct.HasValue && clientQuery.Distinct.Value)
            {
                sqlstatement.Distinct = true;
            }

            var sqlbuilder = new List<string>();
            sqlbuilder.Add("SELECT");
            var preselect = "";
            if (clientQuery.Take.HasValue)
            {
                preselect = preselect + String.Format(" FIRST {0} ", clientQuery.Take);
            }
            if (clientQuery.Skip.HasValue)
            {
                preselect = preselect + String.Format(" SKIP {0} ", clientQuery.Skip);
            }
            sqlbuilder.Add(preselect);
            var selectdbfields = selectfields.Values.Where(i => i != null).OrderBy(i => i.ClientFieldName).ToList();
            var groupbyfields = new List<DbQueryField>();
            if (groupfields.Count > 0)
            {
                selectdbfields = groupselectfields.Values.Where(i => i != null).ToList();
                groupbyfields = groupfields.Values.Where(i => i != null).ToList();
            }
            var selecttypenames = new HashSet<string>();
            var selectbuilder = new List<string>();
            var wherebuilder = new List<string>();
            foreach (var item in selectdbfields)
            {
                if (!selecttypenames.Contains(item.Qualifier))
                {
                    var typenamequalifier = item.Qualifier.Trim('"');
                    if (typenamequalifier == this.Name)
                    {
                        typenamequalifier = "";
                    }
                    else
                    {
                        typenamequalifier = typenamequalifier + ".";
                    }
                    selectbuilder.Add(tab + String.Format("'{0}' as \"{1}TypeName\"", item.TypeName, typenamequalifier));
                    sqlstatement.Fields.Add(new Symbol("'" + item.TypeName + "'", typenamequalifier + "TypeName"));

                    selecttypenames.Add(item.Qualifier);
                }
                selectbuilder.Add(tab + String.Format("{0}.{1} as \"{2}\"", item.Qualifier, item.PhysicalName, item.ClientFieldName));
                sqlstatement.Fields.Add(new Symbol(String.Format(item.FunctionFS, item.Qualifier + "." + item.PhysicalName), item.ClientFieldName));

            }
            foreach (var item in groupbyfields)
            {
                sqlstatement.GroupByFields.Add(new Symbol(item.Qualifier + "." + item.PhysicalName, item.ClientFieldName));
            }
            sqlbuilder.Add(Strings.ListToString(selectbuilder, ",\r\n"));

            var bodystartix = sqlbuilder.Count;

            sqlbuilder.Add("FROM");
            sqlbuilder.Add(tab + String.Format("{0} as {1}", this.Getsource(), this.Name));

            sqlstatement.From = new Symbol(matchedsource, this.Name);
            var prefixedrelations = new HashSet<string>();
            var validfilters = clientQuery.Filters.Where(filter =>
            filter != null && filter.IsValid()
            && (
                allDbFields.ContainsKey(filter.Field)
                || filter.Operator == "OR"
                )
            ).ToList();
            var invalidfilters = clientQuery.Filters.Where(filter => !filter.IsValid()).ToList();
            if (invalidfilters.Count > 0)
            {
                var sb = new StringBuilder();
                sb.AppendLine("Invalid Filters Detected:");
                invalidfilters.ForEach(f =>
                {
                    sb.AppendLine(String.Format("Field: {0} {1} {2}", f.Field, f.Operator, Strings.ListToString(f.Values)));
                });
                throw new Exception(sb.ToString());
            }
            var wheredictionary = new Dictionary<string, List<string>>();
            var wherejoindictionary = new Dictionary<string, WhereQuery>();
            var forcedleft = new List<string>();

            foreach (var filter in validfilters)
            {
                if (filter.Operator == "OR")
                {
                    wherebuilder.Add(tab + filter.GetSQL(null, allDbFields));
                    sqlstatement.Where.Add(new Predicate(filter.GetSQL(null, allDbFields)));
                    continue;
                }
                var dbfield = allDbFields[filter.Field];
                var qualifier = dbfield.RelationPath.FirstOrDefault();
                if (qualifier != null && listrelations.ContainsKey(qualifier))
                {
                    var r = listrelations[qualifier];
                    var rtargetdbquery = qs.GetQueryByName(r.QueryName);
                    var logicaltargetkeys = r.Keys.Select(i => rtargetdbquery.Fields.FirstOrDefault(f => f.Value == i.Value)).Select(i => i.Key).ToList();
                    var fullqualifier = Strings.ListToString(dbfield.RelationPath, ".");
                    var tag = "#where" + fullqualifier;

                    if (!wheredictionary.ContainsKey(tag))
                    {
                        wheredictionary.Add(tag, new List<string>());
                    }
                    if (!wherejoindictionary.ContainsKey(tag))
                    {
                        if (filter.Children != null && filter.Children.Count > 0)
                        {
                            throw new Exception("Child Filters are not supported on List Relation: " + filter.Field);
                        }
                        var wq = new WhereQuery();
                        wq.Relation = r.Copy();
                        wq.TargetDbQuery = rtargetdbquery;
                        var q = new ClientQuery();
                        wq.Query = q;
                        q.Distinct = true;
                        q.QueryName = r.QueryName;
                        q.Fields.AddRange(logicaltargetkeys.Select(i => new QueryField(i)));
                        wherejoindictionary.Add(tag, wq);
                        if (filter.ForceOuter)
                        {
                            forcedleft.Add(tag);
                        }
                    }
                    var wq2 = wherejoindictionary[tag];
                    var fx = new QueryFilter();
                    fx.Values = filter.Values;
                    fx.Operator = filter.Operator;
                    fx.Type = filter.Type;
                    fx.FieldFormat = filter.FieldFormat;
                    fx.Field = filter.Field.Substring(qualifier.Length + 1);
                    wq2.Query.Filters.Add(fx);

                    wheredictionary[tag].Add(tab + filter.GetSQLForJoin(dbfield, allDbFields));
                }
                else
                {
                    wherebuilder.Add(tab + filter.GetSQL(dbfield, allDbFields));
                    sqlstatement.Where.Add(new Predicate(filter.GetSQL(dbfield, allDbFields)));
                }
            }
            foreach (var join in joins.Values)
            {
                var tag = Strings.TextBetween(join, "#where", ")");
                var joinsql = join;
                if (!string.IsNullOrEmpty(tag))
                {
                    tag = "#where" + tag;
                    var dwhere = "";
                    if (wheredictionary.ContainsKey(tag))
                    {
                        dwhere = "WHERE \n " + Strings.ListToString(wheredictionary[tag], "\n AND ");
                    }
                    joinsql = joinsql.Replace(tag, dwhere);
                }
                sqlbuilder.Add(tab + joinsql);
            }
            var wherejoins = new List<JoinStatement>();
            var normaljoins = new List<JoinStatement>();
            foreach (var join in sqlstatement.Join)
            {
                var tag = Strings.TextBetween(join.Source.PhysicalPath, "#where", ")");
                var joinsql = join;
                if (!string.IsNullOrEmpty(tag))
                {
                    tag = "#where" + tag;
                    var dwhere = "";
                    if (wheredictionary.ContainsKey(tag))
                    {
                        dwhere = "WHERE \n " + Strings.ListToString(wheredictionary[tag], "\n AND ");
                    }
                    join.Source.PhysicalPath = join.Source.PhysicalPath.Replace(tag, dwhere);
                    wherejoins.Add(join);
                }
                else
                {
                    normaljoins.Add(join);
                }
            }
            foreach (var kv in wherejoindictionary)
            {
                var clientquery = kv.Value.Query;
                var relation = kv.Value.Relation.Copy();
                var targetdbquery = kv.Value.TargetDbQuery;
                var rkeys = relation.Keys.Keys.ToList();
                foreach (var rkey in rkeys)
                {
                    var fkv = targetdbquery.Fields.FirstOrDefault(i => i.Value == relation.Keys[rkey]);
                    relation.Keys[rkey] = fkv.Key;
                }
                var js = relation.GetJoinStatement(this, qs, "" + kv.Key + "");
                if (forcedleft.Contains(kv.Key))
                {
                    js.JoinType = "LEFT JOIN";
                }
                else
                {
                    js.JoinType = "INNER JOIN";
                }
                var fq = targetdbquery.GetQueries(clientquery, qs).FirstOrDefault();
                js.Source = new Symbol(fq.Select, "\"" + kv.Key + "\"");
                wherejoins.Add(js);
            }

            sqlstatement.Join = new List<JoinStatement>();
            sqlstatement.Join.AddRange(wherejoins);
            sqlstatement.Join.AddRange(normaljoins);

            if (wherebuilder.Count > 0)
            {
                sqlbuilder.Add("WHERE");

                sqlbuilder.Add(Strings.ListToString(wherebuilder, "\r\n AND "));
            }

            var bodytakeforcount = sqlbuilder.Count - bodystartix;

            if (orderbys.Count > 0)
            {
                sqlbuilder.Add("ORDER BY");
                sqlbuilder.Add(tab + Strings.ListToString(orderbys, ","));
                sqlstatement.Ordering.AddRange(orderbys.Select(s => new Ordering(s)));
            }
            var bodytake = sqlbuilder.Count - bodystartix;

            sqlbuilder.Add("");

            var mainqry = new SqlQuery();
            mainqry.TypeName = this.TypeName;
            mainqry.Name = "";
            mainqry.Select = sqlstatement;
            mainqry.Text = Strings.ListToString(sqlbuilder, "\r\n");

            foreach (var datasetname in this.Datasets)
            {
                if (clientQuery.Datasets.ContainsKey(datasetname))
                {
                    var raw = clientQuery.Datasets[datasetname];
                    var data = string.Join(",", raw.Select(s => s.ToString()));
                    mainqry.Text = mainqry.Text.Replace("{"+datasetname+"}", data);
                }
                else
                {
                    mainqry.Error = new Exception(string.Format("No dataset send ({0})!", datasetname), mainqry.Error);
                }
            }

            mainqry.ListFields = this.Relations.Where(e => e.Type == 1).Select(i => i.Alias).ToList();
            result.Add(mainqry);
            var querybody = Strings.ListToString(sqlbuilder.Skip(bodystartix).Take(bodytake).ToList(), "\r\n");
            var querybodyforcount = Strings.ListToString(sqlbuilder.Skip(bodystartix).Take(bodytakeforcount).ToList(), "\r\n");

            if (listfields.Count > 0)
            {
                foreach (var listfield in listfields)
                {
                    var queryexternal = new StringBuilder();
                    var fieldkey = listfield.Key;
                    var listquery = listfield.Value;

                    var relation = this.Relations.FirstOrDefault(i => i.Alias == fieldkey);
                    var listdbquery = qs.GetQueryByName(relation.QueryName);
                    var ecounterFields = listdbquery.Fields.ToDictionary(i => i.Value, i => i.Key);

                    var sqlapiquery = listdbquery.GetQueries(listquery, qs).FirstOrDefault();
                    var sqlquery = sqlapiquery.Text;
                    var where = "";
                    var whereindex = sqlquery.IndexOf("WHERE");
                    if (whereindex != -1)
                    {
                        where = sqlquery.Substring(whereindex);
                        sqlquery = sqlquery.Substring(0, whereindex);
                    }
                    var joinfields = relation.GetJoinFields(listdbquery, qs, "Main");
                    var joinpredicates = relation.GetJoinPredicates(listdbquery, qs, "Main");
                    var mainjoinfields = new List<string>();
                    foreach (var relkey in relation.Keys)
                    {
                        var physical_mainkey = relkey.Key;
                        var physical_listkey = relation.Keys[relkey.Key];
                        if (!physical_mainkey.StartsWith("[") && !physical_mainkey.StartsWith("["))
                        {
                            mainjoinfields.Add(physical_mainkey);
                        }
                    }
                    var keylist = Strings.ListToString(mainjoinfields);

                    var mainquerypart = String.Format("INNER JOIN (SELECT {0} {1} {2}) as Main {3}", preselect, keylist, querybody, joinfields);
                    sqlquery = sqlquery + " --Main: {\n" + mainquerypart + "\n--}\n";
                    queryexternal.AppendLine();
                    queryexternal.AppendLine("/*" + relation.Alias + ":*/");

                    queryexternal.AppendLine(sqlquery);
                    queryexternal.AppendLine(where);
                    var qry = new SqlQuery();

                    qry.Select = new SelectStatement();
                    var mainstatement = mainqry.Select.Copy();
                    var relationfields = this.Fields.Where(i => relation.Keys.ContainsKey(i.Value)).ToList();
                    var relationkeyfields = relationfields.Select(i => new Symbol(mainstatement.From.Alias + "." + i.Value, i.Value)).ToList();
                    var allkeyfields = relationkeyfields;
                    var allkeyfielddictionary = new Dictionary<string, Symbol>();
                    foreach (var sfield in allkeyfields)
                    {
                        if (!allkeyfielddictionary.ContainsKey(sfield.PhysicalPath))
                        {
                            allkeyfielddictionary.Add(sfield.PhysicalPath, sfield);
                        }
                    }
                    mainstatement.Fields.Clear();
                    mainstatement.Fields.AddRange(allkeyfielddictionary.Values);

                    qry.Select.Fields.AddRange(sqlapiquery.Select.Fields);
                    qry.Select.From = new Symbol(listdbquery.Getsource(), listquery.QueryName);
                    qry.Select.Join.Add(new JoinStatement(new Symbol(mainstatement, "Main"), joinpredicates));
                    qry.Select.Join.AddRange(sqlapiquery.Select.Join);

                    qry.TypeName = listdbquery.TypeName;
                    qry.Name = relation.Alias;
                    qry.Text = queryexternal.ToString();

                    foreach (var datasetname in this.Datasets)
                    {
                        if (clientQuery.Datasets.ContainsKey(datasetname))
                        {
                            var raw = clientQuery.Datasets[datasetname];
                            var data = string.Join(",", raw.Select(s => s.ToString()));
                            qry.Text = qry.Text.Replace("{" + datasetname + "}", data);
                        }
                        else
                        {
                            qry.Error = new Exception(string.Format("No dataset send ({0})!", datasetname), qry.Error);
                        }
                    }

                    foreach (var externalrelationkey in relation.Keys)
                    {
                        var key = ecounterFields[externalrelationkey.Value];
                        qry.KeyFields.Add(key);
                    }
                    result.Add(qry);
                }
            }
            var querycount = new StringBuilder();

            if (clientQuery.GetCount)
            {
                querycount.AppendLine();
                querycount.AppendLine("/*Count:*/");
                querycount.AppendLine("SELECT COUNT(*) as \"Count\" ");
                querycount.AppendLine(querybodyforcount.ToString());
                var qry = new SqlQuery();

                qry.Select = new SelectStatement();
                qry.Select.Fields.Add(new Symbol("Count(*)", "Count"));
                qry.Select.From = mainqry.Select.From;
                qry.Select.Where = mainqry.Select.Where;
                qry.Select.Join = mainqry.Select.Join;

                qry.Name = "Count";
                qry.Text = querycount.ToString();
                result.Add(qry);
            }
            return result;
        }
    }


    public class QueryService
    {
        public bool RemoveUndefinedFields = false;
        private Dictionary<string, DbQuery> queries = new Dictionary<string, DbQuery>();
        public QueryService(Dictionary<string, DbQuery> queries)
        {
            this.queries = queries;
        }
        public void AddQuery(string key, DbQuery q)
        {
            if (queries.ContainsKey(key))
            {
                queries[key] = q;
            }
            else
            {
                queries.Add(key, q);
            }
        }

        public DbQuery GetQueryByName(string name)
        {
            if (queries.ContainsKey(name))
            {
                return queries[name];
            }
            return null;
        }
        public DbQuery GetQueryByTypeName(string typename)
        {
            var query = queries.Values.FirstOrDefault(i => i.TypeName == typename);
            return query;
        }
    }
}
