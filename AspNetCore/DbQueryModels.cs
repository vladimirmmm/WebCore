using ApiModel.Query;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;

namespace ApiModel
{
    public enum ClienDataType
    {
        Unknown = 0,
        Text = 1,
        Number = 2,
        Date = 3,
        Booloean = 4
    }
    public class WhereQuery 
    {
        public DbQuery TargetDbQuery;
        public DbRelation Relation;
        public ClientQuery Query;
    }
    public class DbRelation
    {
        public string FlexKey = "";
        public string Prefix = "";
        public string QueryName = "";
        public string Alias = "";
        public int Type = 0;

        private string _QueryAlias = "";
        public string QueryAlias
        {
            get { return _QueryAlias; }
            set
            {
                _QueryAlias = value;
                BuildFrom(value);
            }
        }
        private Dictionary<string, string> _Keys = new Dictionary<string, string>();
        public Dictionary<string, string> Keys { get { return _Keys; } set { _Keys = value; } }

        public DbRelation Copy() 
        {
            var copy = new DbRelation();
            copy.Keys = this.Keys.ToDictionary(i=>i.Key,v=>v.Value);
            copy._QueryAlias = this.QueryAlias;
            copy.QueryName = this.QueryName;
            copy.Prefix = this.Prefix;
            copy.FlexKey = this.FlexKey;
            copy.Type = this.Type;
            return copy;
        }
        public void BuildFrom(string value)
        {
            this.QueryName = Strings.TextBetween(value, "Q:", ";").Trim();
            var astr = Strings.TextBetween(value, "A:", ";").Trim();
            if (astr.IndexOf("[]") > -1)
            {
                astr = astr.Remove(astr.Length - 2);
                this.Type = 1;
            }
           
            this.Alias = astr;
            var flexix = astr.IndexOf("{");
            if (flexix > -1)
            {
                var prefix = astr.Substring(0, flexix);
                var flexkey = astr.Substring(flexix).Trim();
                this.Prefix = prefix;
                this.FlexKey = flexkey;
                //var 
            }

        }

        public string GetJoin(DbQuery query, QueryService qs, string alias = "", string parentAlias = "")
        {
            var sb = new StringBuilder();
            var childalias = String.IsNullOrEmpty(alias) ? this.Alias : alias;
            var parentalias = String.IsNullOrEmpty(parentAlias) ? query.Name : parentAlias;
            if (childalias.IndexOf(".") > -1) { childalias = "\""+ childalias + "\""; }
            if (parentalias.IndexOf(".") > -1) { parentalias = "\""+ parentalias + "\""; }
            var targetquery = qs.GetQueryByName(this.QueryName);
            var source = targetquery.Getsource();
            var joinstr = " LEFT JOIN ";
            if (this.Type == 1) {
                joinstr = " INNER JOIN ";
                var keystr = Strings.ListToString(Keys.Values.ToList());
                var wherestr = childalias;
                source = String.Format("(SELECT DISTINCT {0} from {1} #where{2})", keystr, targetquery.Source, wherestr);
            }
            sb.AppendLine(joinstr);
            sb.Append(source);
            sb.Append(" as ");
            sb.Append(childalias);
            sb.AppendLine(" ON ");

            var keypairs = new List<string>();
            foreach (var key in Keys)
            {
                //if (key.Value.StartsWith("[") && key.Value.EndsWith("]"))
                //{
                //    var kval = key.Value.Trim('[').Trim(']');
                //    keypairs.Add(String.Format(" {0}.{1} = {2} ", parentalias, key.Key, kval));
                //}
                //else
                //{
                //    keypairs.Add(String.Format(" {0}.{1} = {2}.{3} ", parentalias, key.Key, childalias, key.Value));
                //}
                keypairs.Add(GetJoinClauseString(parentalias, key.Key, childalias,key.Value));

            }
            sb.AppendLine(Strings.ListToString(keypairs, " AND \r\n"));
            return sb.ToString();
        }
        private string GetJoinClauseString(string parentalias, string parentvalue, string childalias,string childvalue)
        {
            var result = String.Format(" {0}.{1} = {2}.{3} ", parentalias, parentvalue, childalias, childvalue);
            var childpart = String.Format("{0}.{1}", childalias, childvalue);
            if (childvalue.StartsWith("[") && childvalue.EndsWith("]"))
            {
                var kval = childvalue.Trim('[').Trim(']');
                childpart = String.Format("{0}", kval);
            }

            var parentpart = String.Format("{0}.{1}", parentalias, parentvalue);
            if (parentvalue.StartsWith("[") && parentvalue.EndsWith("]"))
            {
                var kval = parentvalue.Trim('[').Trim(']');
                parentpart = String.Format("{0}", kval);
            }

            return String.Format(" {0} = {1} ", parentpart, childpart);
        }
        public Query.JoinStatement GetJoinStatement(DbQuery query,QueryService qs, string alias = "", string parentAlias = "")
        {
            var join = new Query.JoinStatement();
            var childalias = String.IsNullOrEmpty(alias) ? this.Alias : alias;
            var parentalias = String.IsNullOrEmpty(parentAlias) ? query.Name : parentAlias;
            if (childalias.IndexOf(".") > -1 || childalias.StartsWith("#")) { childalias = "\"" + childalias + "\""; }
            if (parentalias.IndexOf(".") > -1|| parentalias.StartsWith("#")) { parentalias = "\"" + parentalias + "\""; }
            var targetquery = qs.GetQueryByName(this.QueryName);
            var source = targetquery.Getsource();
            SelectStatement sourcestatement = null;
            var joinstr = " LEFT JOIN ";
            var targetlogicalkeys = this.Keys.Select(i => targetquery.Fields.FirstOrDefault(j => j.Value == i.Value)).Select(i => i.Key).ToList();
            if (this.Type == 1)
            {
                joinstr = " INNER JOIN ";
                var keystr = Strings.ListToString(Keys.Values.ToList());
                var wherestr = childalias;
                var clientquery = new ClientQuery();
                clientquery.QueryName = targetquery.Name;
                //clientquery.Fields=
                sourcestatement = new SelectStatement();
                sourcestatement.From = new Symbol(targetquery.Getsource(),"");
                sourcestatement.Distinct = true;
                foreach (var kv in Keys) 
                {
                    sourcestatement.Fields.Add(new Symbol(kv.Value, kv.Value));
                }
                sourcestatement.Where.Add(new Predicate("#where"+wherestr));
                source = String.Format("(SELECT DISTINCT {0} from {1} #where{2})", keystr, targetquery.Getsource(), wherestr);
            }
            join.Source = new Query.Symbol(source,childalias);
            if (sourcestatement != null) 
            {
                join.Source = new Symbol(sourcestatement, childalias);
            }
            join.JoinType = joinstr;
            foreach (var key in Keys)
            {
                //join.Predicates.Add(new Query.Predicate(String.Format(" {0}.{1} = {2}.{3} ", parentalias, key.Key, childalias, key.Value)));
                join.Predicates.Add(new Query.Predicate(GetJoinClauseString(parentalias, key.Key, childalias, key.Value)));

            }
            return join;
        }

        public string GetJoinFields(DbQuery query,QueryService qs, string parentAlias = "")
        {
            var sb = new StringBuilder();
            var alias = String.IsNullOrEmpty(parentAlias) ? this.Alias : parentAlias;
            var targetquery = qs.GetQueryByName(this.QueryName);
            sb.AppendLine(" ON ");

            var keypairs = new List<string>();
            foreach (var key in this.Keys)
            {
                //keypairs.Add(String.Format(" {0}.{1} = {2}.{3} ", query.Name, key.Value, alias, key.Key));
                keypairs.Add(GetJoinClauseString(query.Name, key.Value, alias, key.Key));

            }
            sb.AppendLine(Strings.ListToString(keypairs, " AND \r\n"));
            return sb.ToString();
        }
        public List<Query.Predicate> GetJoinPredicates(DbQuery query, QueryService qs, string parentAlias = "")
        {
            var predicates = new List<Query.Predicate>();
            var alias = String.IsNullOrEmpty(parentAlias) ? this.Alias : parentAlias;
            var targetquery = qs.GetQueryByName(this.QueryName);
            foreach (var key in this.Keys)
            {
                //predicates.Add(new Query.Predicate(String.Format(" {0}.{1} = {2}.{3} ", query.Name, key.Value, alias, key.Key)));
                predicates.Add(new Query.Predicate(GetJoinClauseString( query.Name, key.Value, alias, key.Key)));
            }
            return predicates;
        }
    }

    public class DbQueryField
    {
        public string FunctionFS = "{0}";
        public string Alias = "";
        public string PhysicalName = "";
        public string RelativeClientName = "";
        public string TypeName = "";
        public string QueryName = "";
        public string Qualifier = "";
        public string ClientFieldName = "";
        public List<string> RelationPath = new List<string>();
        public DbQueryField() {

        }
        public DbQueryField(string clientfieldname)
        {
            var parts = clientfieldname.Split('.');
            Alias = parts.LastOrDefault();
            RelationPath = parts.Take(parts.Length - 1).ToList();
            Qualifier = Strings.ListToString(RelationPath, ".");
            if (RelationPath.Count > 1)
            {
                Qualifier = "\"" + Qualifier.Trim('"') + "\"";
            }
            ClientFieldName = clientfieldname;
        }
        public DbQueryField(string clientfieldname, string physicalname, string typename, string qualifier)
        {
            var parts = clientfieldname.Split('.');
            Alias = parts.LastOrDefault();
            RelationPath = parts.Take(parts.Length - 1).ToList();
            Qualifier = Strings.ListToString(RelationPath, ".");
            if (RelationPath.Count > 1)
            {
                Qualifier = "\"" + Qualifier.Trim('"') + "\"";
            }
            ClientFieldName = clientfieldname;
            this.TypeName = typename;
            this.PhysicalName = physicalname;
            this.Qualifier = qualifier;
        }
    }
}