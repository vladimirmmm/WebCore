using ApiModel;
using FirebirdSql.Data.FirebirdClient;
using MySql.Data.MySqlClient;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Web;

namespace DataService.Models.Data
{
    public class MySqlDataProvider : TypedDataProvider
    {
        public override SqlSyntax Syntax { get { return new SQLSyntax.MySqlSyntax(); } }

        public override string ConnectionTypeName { get { return typeof(MySqlConnection).Name; } }


        public override DbConnection GetConnection(string connectionstring)
        {
            return new MySqlConnection(connectionstring);
        }

        public override SqlQuery GetCommand(DataCommand commandobj,int ix=0)
        {
            var commanderrors = commandobj.Errors;
            if (commanderrors.Count > 0)
            {
                throw new ApiModel.DataException("Can't generate SQL query.", commanderrors);
            }

            var sqlquery = new SqlQuery();
            sqlquery.Text = "";
            var fielddictionary = new Dictionary<string, object>();
            var datadictionary = new Dictionary<string, object>();
            var keydictionary = new Dictionary<string, object>();
            var query = GetQueryService().GetQueryByTypeName(commandobj.TypeName);
            foreach (var key in commandobj.Keys)
            {
                if (query.Fields.ContainsKey(key))
                {
                    object val = commandobj[key];
                    if (val != null)
                    {
                        if (typeof(string) == val.GetType())
                        {
                            if (val.Equals("{NULL}"))
                            {
                                val = "NULL";
                            }
                            else
                            {
                                val = String.Format("'{0}'", val.ToString().Replace("'", "''"));
                            }
                        }

                        if (query.Keys.IndexOf(key) > -1)
                        {
                            keydictionary.Add(query.TranslateToPhysicalName(key), val);
                        }
                        else
                        {
                            datadictionary.Add(query.TranslateToPhysicalName(key), val);

                        }
                        fielddictionary.Add(query.TranslateToPhysicalName(key), val);
                    }
                }
            }
            if (commandobj.ContainsKey("Keys"))
            {
                var keys = commandobj["Keys"].ToString().Split(',');
                keydictionary.Clear();
                foreach (var key in keys)
                {
                    object val = commandobj.ContainsKey(key) ? commandobj[key] : (Object)(-1);
                    keydictionary.Add(query.TranslateToPhysicalName(key), val);

                }
            }

            if (commandobj.CommandName == CommandName.UPDATE)
            {
                var querybuilder = new StringBuilder();
                querybuilder.Append("UPDATE ");
                querybuilder.Append(query.Source);
                querybuilder.Append(" SET ");
                var updatefields = new List<string>();
                foreach (var key in datadictionary.Keys)
                {
                    if (!keydictionary.ContainsKey(key))
                    {
                        var val = datadictionary[key];
                        if (val.GetType() == typeof(DateTime))
                        {
                            //val = String.Format("'{0:yyyy-MM-dd HH:mm:ss}'", val);
                            val = Convert.ToSingle(((DateTime)val).ToOADate());
                        }
                    
                        updatefields.Add(String.Format("{0} = {1}", key, val));
                    }
                }
                querybuilder.AppendLine(Strings.ListToString(updatefields, ", \n"));
                querybuilder.Append(" WHERE ");

                var wherefields = new List<string>();
                foreach (var key in keydictionary.Keys)
                {
                    wherefields.Add(String.Format("{0} = {1}", key, keydictionary[key]));
                }
                querybuilder.AppendLine(Strings.ListToString(wherefields, "\n AND "));

                sqlquery.Text = querybuilder.ToString();
                return sqlquery;
            }
            if (commandobj.CommandName == CommandName.INSERT)
            {
                var querybuilder = new StringBuilder();
                querybuilder.Append("INSERT INTO ");
                querybuilder.Append(query.Source);
                querybuilder.Append(" ( ");
                var insertfields = new List<string>();
                foreach (var key in fielddictionary.Keys)
                {
                    insertfields.Add(String.Format("{0}", key));
                }
                querybuilder.AppendLine(Strings.ListToString(insertfields, ", \n"));
                querybuilder.Append(" )");

                querybuilder.AppendLine(" OUTPUT ");
                var returnkeys = keydictionary.Keys.Select(i => "Inserted." + i).ToList();
                querybuilder.AppendLine(Strings.ListToString(returnkeys));

                querybuilder.Append(" VALUES ( ");

                var valuefields = new List<string>();
                foreach (var key in fielddictionary.Keys)
                {
                    var val = fielddictionary[key];
                    if (val.GetType() == typeof(DateTime))
                    {
                        //val = String.Format("'{0:yyyy-MM-dd HH:mm:ss}'", val);
                        val = Convert.ToSingle(((DateTime)val).ToOADate());
                    }
                    valuefields.Add(String.Format("{0}", val));
                }
                querybuilder.AppendLine(Strings.ListToString(valuefields, ",\n"));

                querybuilder.Append(")");



                sqlquery.Text = querybuilder.ToString();
                return sqlquery;
            }
            if (commandobj.CommandName == CommandName.DELETE)
            {
                var querybuilder = new StringBuilder();
                querybuilder.Append("DELETE FROM ");
                querybuilder.Append(query.Source);
                querybuilder.Append(" WHERE ");
                var wherefields = new List<string>();
                foreach (var key in fielddictionary.Keys)
                {
                    wherefields.Add(String.Format("{0} = {1}", key, fielddictionary[key]));

                }
                querybuilder.AppendLine(Strings.ListToString(wherefields, "\n AND "));


                sqlquery.Text = querybuilder.ToString();
                return sqlquery;
            }
            return null;
        }

        //public virtual List<SqlQuery> GetCommands(List<DataCommand> command)
        //{
        //    var result = new List<SqlQuery>();
      
        //    foreach (var commandobj in command)
        //    {
         
        //        var query = GetCommand(commandobj);
        //        if (query != null)
        //        {
        //            result.Add(query);
        //        }

        //    }

        //    return result;
        //}

        public override List<DataCommand> SetCommands(List<DataCommand> commands)
        {
            var result = new List<DataCommand>();
            var workstart = commands.FirstOrDefault(i => i.CommandName == CommandName.WORKSTART);
            var workbody = commands.FirstOrDefault(i => i.CommandName == CommandName.WORKBODY);
            var workend = commands.FirstOrDefault(i => i.CommandName == CommandName.WORKEND);
            if (workstart != null)
            {
                var typenames = commands.Where(i => !i.CommandName.ToString().StartsWith("WORK")).Select(i => String.Format("{0}", i["TypeName"])).Distinct().ToList();

                result.Add(workstart);
                result.Add(workbody);
                foreach (var typename in typenames)
                {
                    var typecommands = commands.Where(i => i["TypeName"].ToString() == typename).ToList();
                    var deletecommand = new DataCommand();
                    deletecommand.Add("Keys", "WorkId");
                    deletecommand.Add("CommandName", "Delete");
                    deletecommand.Add("TypeName", typename);
                    result.Add(deletecommand);
                    result.AddRange(typecommands);

                }
                result.Add(workend);

            }
            else
            {
                result = commands;
            }

            return result;
        }

        public override Result<List<Result<StandardDictionary>>> ExecuteCommands(List<DataCommand> xcommands, DbConnection connection, DbTransaction transaction = null, bool setconnectioninfo = true)
        {
            var mainresult = new Result<List<Result<StandardDictionary>>>();

            var ix = 1;
            var maininfo = new CommandInfo();
            mainresult.ViewData.Add("CommandInfo", maininfo);

            //var results = new List<Dictionary<string, Object>>();
            var dbresults = new List<string>();

            var commands = SetCommands(xcommands);
            var sqlcommands = GetCommands(commands);



            // var resval = 1;

            //var transaction = connection.BeginTransaction();
            foreach (var sqlcommand in sqlcommands)
            {
                var commandinfo = new CommandInfo();
                maininfo.Children.Add(commandinfo);


                var dbcommand = connection.CreateCommand();
                dbcommand.Transaction = transaction;
                dbcommand.CommandText = sqlcommand.Text;
                var commanditem = commands[ix - 1];

                var commandresultvalue = "";

                commandinfo.SetFrom(dbcommand, commanditem);
                var commandresult = new Result<StandardDictionary>();
                mainresult.Model.Add(commandresult);
                commandresult.Model.Add("Command", commanditem);
                //mainresult.ViewData.Add("CommandInfo", commandinfo);
                try
                {

                    //var resval = dbcommand.ExecuteNonQuery();
                    //var resval = GetData(dbcommand);
                    var resval = dbcommand.ExecuteScalar();

                    // var resval = 1;
                    commandresultvalue = String.Format("{0}", resval);
                    commandresult.Model.Add("Value", commandresultvalue);

                }
                catch (Exception ex)
                {
                    commandinfo.Error = ex;
                    commandresult.AddError(ex);
                    var resultobj = new Result<List<DataCommandResult>>();

                    //if (transaction != null)
                    //{
                    //    transaction.Rollback();
                    //}
                    return mainresult;


                }

                ix++;
            }
            //if (transaction != null)
            //{
            //    transaction.Commit();
            //}


            return mainresult;
        }

        public static void Test() {
            var cs = "Server=uponsmart.eu;Database=upon_signal;Uid=upon_signal;Pwd=vSPyyex5DE9LFeY6;";
            var connection = new MySqlConnection(cs);
            connection.Open();
            connection.Close();
        }
    }
}