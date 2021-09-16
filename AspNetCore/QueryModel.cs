using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ApiModel.Query
{
    public class Symbol
    {
        public SelectStatement Statement= null;
        public string PhysicalPath = "";
        public string Alias = "";
        public Symbol() { }
        public Symbol(string physicalpath, string alias) {
            this.PhysicalPath = physicalpath;
            this.Alias = alias;
        }
        public Symbol(SelectStatement statement, string alias)
        {
            this.Statement = statement;
            this.Alias = alias;
        }
    }
    public class JoinStatement
    {
        public string JoinType = "INNER JOIN";
        public Symbol Source;
        public List<Predicate> Predicates = new List<Predicate>();
        public JoinStatement() { }
        public JoinStatement(Symbol item,string joinfields)
        {
            this.Source = item;
            this.Predicates.Add(new Predicate(joinfields));
        }
        public JoinStatement(Symbol item, List<Predicate> predicates)
        {
            this.Source = item;
            this.Predicates.AddRange(predicates);
        }
    }
    public class Predicate
    {
        public string Value = "";

        public Predicate() { }
        public Predicate(string value) {
            this.Value = value;
        }
    }
    public class Ordering
    {
        public string Value = "";
        public string By="ASC";
        public Ordering() { }
        public Ordering(string val)
        {
            var parts = val.Split(' ');
            if (parts.Length > 0)
            {
                Value = parts[0];
                if (parts.Length > 1)
                {
                    By = parts[1];
                }
            }
        }
    }
    public class SelectStatement
    {
        public List<Symbol> Fields = new List<Symbol>();
        public List<Symbol> GroupByFields = new List<Symbol>();
        public Symbol From;
        public List<JoinStatement> Join =new List<JoinStatement>();
        public List<Predicate> Where=new List<Predicate>();
        public List<Ordering> Ordering=new List<Ordering>();
        public int? Skip = 0;
        public int? Take = null;
        public bool Distinct = false;

        public SelectStatement Copy()
        {
            var result = new SelectStatement();
            result.Fields = this.Fields.ToList();
            result.From = this.From;
            result.Join = this.Join.ToList();
            result.Where = this.Where.ToList();
            result.Ordering = this.Ordering.ToList();
            result.Skip = this.Skip;
            result.Take = this.Take;
            result.Distinct = this.Distinct;
            return result;
        }
    }
    public class JoinClause
    {
        public List<JoinStatement> Predicates = new List<JoinStatement>();

    }

    public class WhereClause
    {
        public List<Predicate> Predicates = new List<Predicate>();
    }
    public class QueryModel
    {
    }
}