using ApiModel.Query;
using System;
using System.Collections.Generic;
using System.Linq;

namespace ApiModel
{

    public abstract class SqlSyntax
    {
        public abstract string AliasFormat { get; }
        private Dictionary<string, string> _Functions = null;
        public virtual Dictionary<string, string> Functions { get; }

        public abstract string GetSQLQuery(SelectStatement select, bool enclose=true);
    }
}