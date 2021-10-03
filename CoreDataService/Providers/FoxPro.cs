using ApiModel;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Data.OleDb;
using System.Linq;
using System.Web;

namespace DataService.Models.Data
{
    public class Foxpro : DataProvider
    {
        public override string ConnectionTypeName { get { return typeof(OleDbConnection).Name; } }


        public override DbConnection GetConnection(string connectionstring)
        {
            return new OleDbConnection(connectionstring);
        }

    }
}