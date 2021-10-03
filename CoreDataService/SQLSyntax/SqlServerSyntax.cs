using ApiModel;
using ApiModel.Query;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;

namespace DataService.Models.Data.SQLSyntax
{
    public class SqlServerSyntax : SqlSyntax
    {
        public override string AliasFormat { get { return "{0} as '{1}'"; } }

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

        public override string GetSQLQuery(SelectStatement statement, bool enclose = true)
        {
            var sb = new StringBuilder();
            sb.AppendLine("SELECT");
            if (statement.Distinct)
            {
                sb.AppendLine(" DISTINCT ");
            }
            var selects = statement.Fields.Select(i => String.Format("   {0} as '{1}'", i.PhysicalPath, i.Alias)).ToList();
            sb.AppendLine(Strings.ListToString(selects, ",\n"));
            sb.AppendLine("FROM");
            sb.AppendLine(String.Format("   {0} as {1}", statement.From.PhysicalPath, statement.From.Alias));
            foreach (var join in statement.Join)
            {
                var joinhead = String.Format("{0} as {1}", join.Source.PhysicalPath, join.Source.Alias);
                if (join.Source.Statement != null)
                {
                    joinhead = String.Format("(SELECT DISTINCT * FROM ({0}) as x) as {1}", GetSQLQuery(join.Source.Statement, false), join.Source.Alias);

                    //joinhead = String.Format("({0}) as {1}", GetSQLQuery(join.Source.Statement), join.Source.Alias);
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
                //foreach (var predicate in statement.Where)
                //{
                //    sb.AppendLine(String.Format("   {0}", predicate.Value));
                //}

            }
            if (statement.GroupByFields.Count > 0)
            {
                var groupbys = statement.GroupByFields.Select(i => String.Format("   {0}", i.Alias)).ToList();
                sb.AppendLine("GROUP BY ");
                sb.AppendLine(Strings.ListToString(groupbys, ",\n"));
            }
            if ((statement.Skip.HasValue || statement.Take.HasValue) && statement.Ordering.Count == 0)
            {
                statement.Ordering.Add(new Ordering("1 ASC"));
            }
            if (statement.Take.HasValue && !statement.Skip.HasValue) {
                statement.Skip = 0;
            }
            if (statement.Ordering.Count > 0)
            {
                sb.AppendLine("ORDER BY");
                sb.AppendLine(Strings.ListToString(
                   statement.Ordering.Select(i => String.Format("   {0} {1}", i.Value, i.By)).ToList()
                   ));
            }
            if (statement.Skip.HasValue)
            {
                sb.AppendLine(String.Format( "OFFSET {0} ROWS",statement.Skip.Value));

            }
            if (statement.Take.HasValue)
            {
                sb.AppendLine(String.Format("FETCH NEXT {0} ROWS ONLY", statement.Take.Value));

            }
            //FETCH NEXT 10 ROWS ONLY;
            return sb.ToString();
        }
    }
}