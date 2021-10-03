using ApiModel;
using ApiModel.Query;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;

namespace DataService.Models.Data.SQLSyntax
{
    public class FireBirdSyntax : SqlSyntax
    {
        public override string AliasFormat { get { return "{0} as \"{1}\""; } }

        private Dictionary<string, string> _Functions = null;
        public override Dictionary<string, string> Functions
        {
            get
            {
                if (_Functions == null)
                {
                    _Functions = new Dictionary<string, string>()
                    {
                        { "upper({0})","upper({0})" }
                    };
                }
                return _Functions;
            }
        }

        public override string GetSQLQuery(SelectStatement statement,bool enclose=true)
        {
            var sb = new StringBuilder();
            sb.AppendLine("SELECT");
            var preselect = "";
          
            if (statement.Take.HasValue)
            {
                preselect = preselect + String.Format(" FIRST {0} ", statement.Take);
            }
            if (statement.Skip.HasValue)
            {
                preselect = preselect + String.Format(" SKIP {0} ", statement.Skip);
            }
            if (statement.Distinct)
            {
                preselect = preselect + " DISTINCT ";
            }
            sb.AppendLine(preselect);
            Func<string, string> EncloseAlias = (s) => {
                if (enclose) {
                    return "\"" + s + "\"";
                }
                //if (s.IndexOf(".")>-1 || s.IndexOf("[")>-1) { return "\"" + s + "\""; }
                return s;
            };
            var selects = statement.Fields.Select(i => String.Format("   {0} as {1}", i.PhysicalPath, EncloseAlias(i.Alias))).ToList();
            sb.AppendLine(Strings.ListToString(selects, ",\n"));
            sb.AppendLine("FROM");
            sb.AppendLine(String.Format("   {0} as {1}", statement.From.PhysicalPath, statement.From.Alias));
            foreach (var join in statement.Join)
            {
                var joinhead = String.Format("{0} as {1}", join.Source.PhysicalPath, join.Source.Alias);
                if (join.Source.Statement != null)
                {
                    //var fields = Strings.ArrayToString(join.Source.Statement.Fields.Select(i => i.PhysicalPath).ToArray());
                    joinhead = String.Format("(SELECT DISTINCT * FROM ({0})) as {1}", GetSQLQuery(join.Source.Statement,false), join.Source.Alias);
                }
                sb.AppendLine(String.Format("   {0}", join.JoinType));
                sb.AppendLine(String.Format("       {0} ON ", joinhead));
                var predicatevalues = join.Predicates.Select(i => i.Value).ToList();
                sb.AppendLine("           " + Strings.ListToString(predicatevalues, "\n            AND"));

            }
         
            if (statement.Where.Count > 0)
            {
                sb.AppendLine("WHERE");
                var whereitems = statement.Where.Select(i => i.Value).ToList();
                sb.AppendLine(Strings.ListToString(whereitems, " \n   AND "));

            }
            if (statement.GroupByFields.Count > 0)
            {
                var groupbys = statement.GroupByFields.Select(i => String.Format("   {0}", EncloseAlias(i.Alias))).ToList();
                sb.AppendLine("GROUP BY ");
                sb.AppendLine(Strings.ListToString(groupbys, ",\n"));
            }
            if ((statement.Skip.HasValue || statement.Take.HasValue) && statement.Ordering.Count == 0)
            {
                statement.Ordering.Add(new Ordering("1 ASC"));
            }
            if (statement.Take.HasValue && !statement.Skip.HasValue)
            {
                statement.Skip = 0;
            }
            if (statement.Ordering.Count > 0)
            {
                sb.AppendLine("ORDER BY");
                sb.AppendLine(Strings.ListToString(
                    statement.Ordering.Select(i=> String.Format("   {0} {1}", i.Value, i.By)).ToList()
                    ));
            }
            //FETCH NEXT 10 ROWS ONLY;
            return sb.ToString();
        }
    }
}