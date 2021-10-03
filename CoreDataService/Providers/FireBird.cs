using ApiModel;
using FirebirdSql.Data.FirebirdClient;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataService.Models.Data
{
    public class FireBirdDataProvider : TypedDataProvider
    {
        private readonly Random getrandom = new Random();
        public override SqlSyntax Syntax { get { return new SQLSyntax.FireBirdSyntax(); } }

        public override string ConnectionTypeName { get { return typeof(FbConnection).Name; } }

        public override DbConnection GetConnection(string connectionstring)
        {
            Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
            var c = new FbConnection(connectionstring);  

            return c;
        }
        public virtual DataCommand GetConnectionParameterInsert(long sessionid, long userid = 1 )
        {
            var connectionObj = new DataCommand();
            connectionObj["TypeName"] = "ConnectionParameters";
            connectionObj["CommandName"] = "INSERT";

            connectionObj["ConnectionId"] = sessionid;
            connectionObj["Created"] = String.Format("{0:yyyy-MM-dd HH:mm:ss}", DateTime.Now);
            //connectionObj["Created"] = DateTime.Now.ToOADate();
            connectionObj["HasSynchronize"] = 0;
            connectionObj["Id"] = getrandom.Next(0, int.MaxValue);
            //connectionObj["DomicileId"] = 1;
            connectionObj["FinancialYearId"] = DateTime.Now.Year;
            connectionObj["LanguageId"] = 2;
            connectionObj["PartnerId"] = 1;
            connectionObj["PdaId"] = "{NULL}";
            connectionObj["SyncDomicileId"] = "{NULL}";
            connectionObj["UserId"] = userid;
            connectionObj["WorkstationId"] = "{NULL}";
            connectionObj["IsAccounting"] = 0;
            connectionObj["IsAccountingPermissionSync"] = 0;
            connectionObj["IsBackuprestore"] = 0;
            connectionObj["IsDbservice"] = "{NULL}";
            connectionObj["IsDbupdate"] = 0;
            connectionObj["IsPartnerUpdate"] = 0;
            connectionObj["IsRecalcingJournal"] = 0;
            connectionObj["IsSynchronizing"] = 0;
            connectionObj["IsTesting"] = 0;
            connectionObj["LastActivity"] = "{NULL}";
            connectionObj["ParentConnectionId"] = "{NULL}";
            connectionObj["TransactionIdShift"] = "{NULL}";
            return connectionObj;

        }

        public virtual DataCommand GetConnectionParameterDelete(long connectionid)
        {
            var connectionObj = new DataCommand();
            connectionObj["TypeName"] = "ConnectionParameters";
            connectionObj["CommandName"] = "DELETE";

            connectionObj["ConnectionId"] = connectionid;

            return connectionObj;

        }

        public override async Task<DataCommand> SetConnectionInfo(DbOptions options, Result<List<Dictionary<string, object>>> result) 
        {
            var cs_start = GetConnectionParameterInsert(options.SessionId, options.UserId);
            var cs_start_sqlcommand = GetCommand(cs_start, -1);
            var cs_start_dbconcommand = options.connection.CreateCommand();
            cs_start_dbconcommand.CommandText = cs_start_sqlcommand.Text;
            cs_start_dbconcommand.Transaction = options.transaction;
            try
            {
                var rx = await cs_start_dbconcommand.ExecuteNonQueryAsync();
                return cs_start;
            }
            catch (Exception ex) {
                result.AddError(ex);
            }
            return null;
        }
        public override async Task<DataCommand> ClearConnectionInfo(DbOptions options, Result<List<Dictionary<string, object>>> result)
        {
            if (options.connection == null) {
                return null;
            }
            var cs_end = GetConnectionParameterDelete(options.SessionId);
            var cs_end_sqlcommand = GetCommand(cs_end, 3);
            var cs_end_dbconcommand = options.connection.CreateCommand();
            cs_end_dbconcommand.CommandText = cs_end_sqlcommand.Text;
            cs_end_dbconcommand.Transaction = options.transaction;
            try
            {
                if (options.connection.State != ConnectionState.Open) {
                    options.connection.Open();
                }
                var rx = await cs_end_dbconcommand.ExecuteNonQueryAsync();
                return cs_end;
            }
            catch (Exception ex)
            {
                if (result != null)
                {
                    result.AddError(ex);
                }
            }
            return null;
        }
        //public override async Task<List<Dictionary<string, object>>> GetDataAsync(string commandtext, DbConnection connection, Dictionary<string, int> fielddictionary = null, bool addnulls = false, DbTransaction transaction = null)
        //{
        //    var result = new List<Dictionary<string, object>>();

        //    var cs_start = GetConnectionParameterInsert();
        //    var connectionid = (int)cs_start["ConnectionId"];
        //    var cs_end = GetConnectionParameterDelete(connectionid);
        //    var cs_start_sqlcommand = GetCommand(cs_start, -1);
        //    var cs_end_sqlcommand = GetCommand(cs_end, 3);

        //    var cs_start_dbconcommand = connection.CreateCommand();
        //    cs_start_dbconcommand.CommandText = cs_start_sqlcommand.Text;
        //    cs_start_dbconcommand.Transaction = transaction;

        //    var cs_end_dbconcommand = connection.CreateCommand();
        //    cs_end_dbconcommand.CommandText = cs_end_sqlcommand.Text;
        //    cs_end_dbconcommand.Transaction = transaction;

        //    cs_start_dbconcommand.ExecuteNonQuery();
        
        //    result = await base.GetDataAsync(commandtext, connection, fielddictionary, addnulls, transaction);
            
        //    cs_end_dbconcommand.ExecuteNonQuery();

        //    return result;
        //}
        public override SqlQuery GetCommand(DataCommand commandobj, int ix)
        {
            var commanderrors = commandobj.Errors;
            if (commanderrors.Count > 0)
            {
                throw new ApiModel.DataException("Can't generate SQL query. "+ commanderrors.FirstOrDefault(), commanderrors);
            }

            var sqlquery = new SqlQuery();
            sqlquery.Text = "";
            if (!String.IsNullOrEmpty(commandobj.CommandText)) {
                sqlquery.Text = commandobj.CommandText;
                return sqlquery;
            }
            var fielddictionary = new Dictionary<string, object>();
            var datadictionary = new Dictionary<string, object>();
            var keydictionary = new Dictionary<string, object>();
            var query = GetQueryService().GetQueryByName(commandobj.TypeName);
            foreach (var key in commandobj.Keys)
            {
                if (query.Fields.ContainsKey(key))
                {
                    object val = commandobj[key];
                    if (val != null)
                    {
                        var valtype = val.GetType();
                        if (typeof(string) == valtype)
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
                        if (typeof(double) == valtype 
                            || typeof(Decimal) == valtype 
                            || typeof(Double) == valtype 
                            || typeof(float) == valtype 
                            || typeof(decimal) == valtype) {
                            var valstr = String.Format("{0}", val);
                            valstr = valstr.Replace(",", ".");
                            val = valstr;
                        }
                        if (typeof(DateTime) == valtype) {
                            var dvalue = (DateTime)val;
                            var dtformat = "{0:yyyy-MM-dd HH:mm:ss}";
                            var dformat = "{0:yyyy-MM-dd}";
                            var format = (dvalue.Hour == 0 && dvalue.Minute == 0 && dvalue.Second == 0) ? dformat : dtformat;
                            //val = String.Format("'{0}'", String.Format("{0:yyyy-MM-dd HH:mm:ss}", val).Replace("'", "''"));
                            val = String.Format("'{0}'", String.Format(format, val).Replace("'", "''"));

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
            sqlquery.Name = String.Format("Command {0}", ix);
            if (commandobj.CommandName == CommandName.WORKSTART)
            {
                var querybuilder = new StringBuilder();
                var workname = commandobj.Name;
                var parameters = commandobj.PARAMETERS;

                querybuilder.Append("SELECT * FROM ");
                querybuilder.Append(workname);
                if (!String.IsNullOrEmpty(parameters))
                {
                    var parmparts = parameters.Split(',');
                    var paramvalues = new List<string>();
                    foreach (var parampart in parmparts)
                    {
                        var paramvalue = parampart;
                        if (parampart.StartsWith("#"))
                        {
                            var pkey = parampart.Substring(1);
                            var physicalpkey = query.TranslateToPhysicalName(pkey);
                            if (datadictionary.ContainsKey(physicalpkey))
                            {
                                paramvalue = datadictionary[physicalpkey].ToString();
                            }
                        }
                        paramvalues.Add(paramvalue);
                    }
                    parameters = Strings.ListToString(paramvalues);
                    //var keyvalues = Strings.ListToString(keydictionary.Values.ToList());
                    querybuilder.Append("(" + parameters + ")");

                }
                else
                {
                    querybuilder.Append("(NULL)");

                }
                sqlquery.Text = querybuilder.ToString();
                sqlquery.Name = commandobj.Name;
                return sqlquery;
            }
            if (commandobj.CommandName == CommandName.WORKBODY)
            {
                var workidfieldname = query.TranslateToPhysicalName("WorkId");
                var workidvalue = (fielddictionary.ContainsKey(workidfieldname) ? fielddictionary[workidfieldname] : "-1");
                var querybuilder = new StringBuilder();
                querybuilder.Append("UPDATE ");
                querybuilder.Append(query.Source);
                querybuilder.Append(" SET ");
                var updatefields = new List<string>();
                foreach (var key in datadictionary.Keys)
                {
                    updatefields.Add(String.Format("{0} = {1}", key, datadictionary[key]));
                }
                querybuilder.AppendLine(Strings.ListToString(updatefields, ", \n"));
                querybuilder.Append(" WHERE ");

                var wherefields = new List<string>();
                wherefields.Add(String.Format("{0} = {1}", workidfieldname, workidvalue));

                querybuilder.AppendLine(Strings.ListToString(wherefields, "\n AND "));

                sqlquery.Text = querybuilder.ToString();
                return sqlquery;
            }
            if (commandobj.CommandName == CommandName.WORKEND)
            {
                var querybuilder = new StringBuilder();
                var workname = commandobj.Name;
                var worktype = commandobj.ContainsKey("TYPE") ? commandobj["TYPE"].ToString() : "SELECT";
                var starter = (worktype == "SELECT" ? "SELECT * FROM " : "EXECUTE PROCEDURE ");
                var parameters = commandobj.PARAMETERS;

                querybuilder.Append(starter);
                querybuilder.Append(workname);
                var workidfieldname = query.TranslateToPhysicalName("WorkId");
                if (!String.IsNullOrEmpty(parameters))
                {
                    var parmparts = parameters.Split(',');
                    var paramvalues = new List<string>();
                    foreach (var parampart in parmparts)
                    {
                        var paramvalue = parampart;
                        if (parampart.StartsWith("#"))
                        {
                            var pkey = parampart.Substring(1);
                            var physicalpkey = query.TranslateToPhysicalName(pkey);
                            if (datadictionary.ContainsKey(physicalpkey))
                            {
                                paramvalue = datadictionary[physicalpkey].ToString();
                            }
                        }
                        paramvalues.Add(paramvalue);
                    }
                    parameters = Strings.ListToString(paramvalues);
                    //var keyvalues = Strings.ListToString(keydictionary.Values.ToList());
                    querybuilder.Append("(" + parameters + ")");

                }
                else
                {
                    querybuilder.Append("(" + (fielddictionary.ContainsKey(workidfieldname) ? fielddictionary[workidfieldname] : "NULL") + ")");
                }
                sqlquery.Text = querybuilder.ToString();
                sqlquery.Name = commandobj.Name;
                return sqlquery;
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
                        updatefields.Add(String.Format("{0} = {1}", key, datadictionary[key]));
                    }
                }
                if (updatefields.Count == 0)
                {
                    return null;
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
                querybuilder.Append(" ) VALUES ( ");

                var valuefields = new List<string>();
                foreach (var key in fielddictionary.Keys)
                {
                    var value = fielddictionary[key];
                    var strval = String.Format("{0} /*{1}*/", value,value.GetType().Name);
                    valuefields.Add(strval);
                }
                querybuilder.AppendLine(Strings.ListToString(valuefields, ",\n"));

                querybuilder.AppendLine(") RETURNING ");

                var returnkeys = keydictionary.Keys.ToList();
                if (returnkeys.Count == 0)
                {
                    returnkeys.AddRange(query.Keys);
                }
                querybuilder.AppendLine(Strings.ListToString(returnkeys));


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
                var keys = keydictionary.Keys.Count > 0 ? keydictionary.Keys : fielddictionary.Keys;

                foreach (var key in keys)
                {
                    wherefields.Add(String.Format("{0} = {1}", key, fielddictionary[key]));

                }
                querybuilder.AppendLine(Strings.ListToString(wherefields, "\n AND "));


                sqlquery.Text = querybuilder.ToString();
                return sqlquery;
            }
            if (commandobj.CommandName == CommandName.SELECT)
            {
                var querybuilder = new StringBuilder();
                querybuilder.Append("SELECT * FROM ");
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
        //    var ix = -1;
        //    foreach (var commandobj in command)
        //    {
        //        ix++;
        //        var query = GetCommand(commandobj, ix);
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

        public override Result<List<Result<StandardDictionary>>> ExecuteCommands(List<DataCommand> xcommands, DbConnection connection, DbTransaction transaction = null, bool setconnectioninfo=true)
        {

            var mainresult = new Result<List<Result<StandardDictionary>>>();
            var ix = 0;
            var maininfo = new CommandInfo();
            mainresult.ViewData.Add("CommandInfo", maininfo);
            //mainresult.ViewData.Add("CommandInfo", results);

            var commands = SetCommands(xcommands);
            var sqlcommands = GetCommands(commands);
            //var csd = GetConnectionParameterInsert();
            //var connectionid = (int)csd["ConnectionId"];
            //var csdr = GetConnectionParameterDelete(connectionid);
            var ds = "";
            //if (!String.IsNullOrEmpty(ds))
            //{
            //    csd["Created"] = ds;
            //}
            //var cssqlcommand = GetCommand(csd, -1);
            var preconnectioninfo = new CommandInfo();
            maininfo.Children.Add(preconnectioninfo);
            var postconnectioninfo = new CommandInfo();
            maininfo.Children.Add(postconnectioninfo);

            //var csdeletesqlcommand = GetCommand(csdr, sqlcommands.Count);


            //var dbconcommand = connection.CreateCommand();
            //dbconcommand.CommandText = cssqlcommand.Text;
            //dbconcommand.Transaction = transaction;
            //preconnectioninfo.SetFrom(dbconcommand,null);
            //try
            //{
            //    preconnectioninfo.Result = dbconcommand.ExecuteNonQuery();
            //}
            //catch (Exception ex)
            //{
            //    preconnectioninfo.Error = ex;
            //    return mainresult;
            //}
            // var resval = 1;

            int? workid = null;
            //var transaction = connection.BeginTransaction();
            foreach (var sqlcommand in sqlcommands)
            {
                var commandinfo = new CommandInfo();
                maininfo.Children.Add(commandinfo);
                var dbcommand = connection.CreateCommand();
                dbcommand.Transaction = transaction;
                dbcommand.CommandText = sqlcommand.Text;
                var commanditem = commands[ix];

                var commandresultvalue = "";
                //if (workid.HasValue)
                //{
                //    var werrors = new List<string>();
                //    if (!commanditem.ContainsKey("WorkId"))
                //    {
                //        commanditem.Add("WorkId", workid.Value);
                //    }
                //    var worksqlcommand = DbQuery.GetCommand(commanditem, werrors, ix);
                //    dbcommand.CommandText = worksqlcommand.Text;
                //}
                commandinfo.SetFrom(dbcommand, commanditem);
                var commandresult = new Result<StandardDictionary>();
                mainresult.Model.Add(commandresult);
                commandresult.Model.Add("Command", commanditem);

                //mainresult.ViewData.Add("CommandInfo", commandinfo);
                try
                {
                    if (commanditem.CommandName == CommandName.WORKSTART)
                    {

                        var resval = dbcommand.ExecuteScalar();
                        commandresultvalue = String.Format("{0}", resval);
                        //var worksheets = GetData("SELECT * FROM WORK_WORKSHEET WHERE ID_WORK=" + commandresult, connection,null,true, transaction);
                        //var worksheetmaterials = GetData("SELECT * FROM WORK_WORKSHEET_MATERIALS WHERE ID_WORK=" + commandresult, connection,null, true, transaction);

                        workid = int.Parse(commandresultvalue);

                    }
                    else if (commanditem.CommandName == CommandName.WORKEND)
                    {
                        //transaction.Commit();

                        var resval = dbcommand.ExecuteScalar();
                        commandresultvalue = String.Format("{0}", resval);
                    }
                    else
                    {
                        //var resval = dbcommand.ExecuteNonQuery();
                        //var resval = GetData(dbcommand);
                        var resval = dbcommand.ExecuteScalar();

                        // var resval = 1;
                        commandresultvalue = String.Format("{0}", resval);
                    }
                    commandresult.Model.Add("Value",commandresultvalue);
                  
                }
                catch (Exception ex)
                {
                    commandinfo.Error = ex;
                    commandresult.AddError(ex);
                    mainresult.AddError(ex);
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

            //var dbcaftercommand = connection.CreateCommand();
            //dbcaftercommand.CommandText = csdeletesqlcommand.Text;
            //dbcaftercommand.Transaction = transaction;
            //postconnectioninfo.SetFrom(dbcaftercommand,null);
            //try
            //{
            //    postconnectioninfo.Result = dbcaftercommand.ExecuteNonQuery();
            //}
            //catch (Exception ex)
            //{
            //    postconnectioninfo.Error = ex;

            //}
            //foreach (var result in mainresult.Model)
            //{
            //    if (result.Exception != null)
            //    {
            //        mainresult.AddError(result.Exception);
            //    }
            //}
            return mainresult;
        }

        public async override Task<Result<List<Result<StandardDictionary>>>> ExecuteCommandsAsync(List<DataCommand> xcommands, DbConnection connection, DbTransaction transaction = null, bool setconnectioninfo=true)
        {

            var mainresult = new Result<List<Result<StandardDictionary>>>();
            var ix = 0;
            var maininfo = new CommandInfo();
            mainresult.ViewData.Add("CommandInfo", maininfo);
            //mainresult.ViewData.Add("CommandInfo", results);

            var commands = SetCommands(xcommands);
            var sqlcommands = GetCommands(commands);
            maininfo.CommandText = "FireBird.ExecuteCommandsAsync> xcommands: "+ xcommands.Count+";commands: " + commands.Count+ "; sqlcommands: "+ sqlcommands.Count;

            //var csd = GetConnectionParameterInsert();
            //var connectionid = (int)csd["ConnectionId"];
            //var csdr = GetConnectionParameterDelete(connectionid);
            var ds = "";
            //if (!String.IsNullOrEmpty(ds))
            //{
            //    csd["Created"] = ds;
            //}
            //var cssqlcommand = GetCommand(csd, -1);
            var preconnectioninfo = new CommandInfo();
            maininfo.Children.Add(preconnectioninfo);
            var postconnectioninfo = new CommandInfo();
            maininfo.Children.Add(postconnectioninfo);

            //var csdeletesqlcommand = GetCommand(csdr, sqlcommands.Count);


            //var dbconcommand = connection.CreateCommand();
            //dbconcommand.CommandText = cssqlcommand.Text;
            //dbconcommand.Transaction = transaction;
            //preconnectioninfo.SetFrom(dbconcommand, null);
            //if (setconnectioninfo)
            //{
            //    try
            //    {
            //        preconnectioninfo.Result = await dbconcommand.ExecuteNonQueryAsync();
            //    }
            //    catch (Exception ex)
            //    {
            //        preconnectioninfo.Error = ex;
            //        return mainresult;
            //    }
            //}
            // var resval = 1;

            int? workid = null;
            //var transaction = connection.BeginTransaction();
            foreach (var sqlcommand in sqlcommands)
            {
                var commandinfo = new CommandInfo();
                maininfo.Children.Add(commandinfo);
                var dbcommand = connection.CreateCommand();
                dbcommand.Transaction = transaction;
                dbcommand.CommandText = sqlcommand.Text;
                var commanditem = commands[ix];

                var commandresultvalue = "";
                //if (workid.HasValue)
                //{
                //    var werrors = new List<string>();
                //    if (!commanditem.ContainsKey("WorkId"))
                //    {
                //        commanditem.Add("WorkId", workid.Value);
                //    }
                //    var worksqlcommand = DbQuery.GetCommand(commanditem, werrors, ix);
                //    dbcommand.CommandText = worksqlcommand.Text;
                //}
                commandinfo.SetFrom(dbcommand, commanditem);
                var commandresult = new Result<StandardDictionary>();
                mainresult.Model.Add(commandresult);
                commandresult.Model.Add("Command", commanditem);

                //mainresult.ViewData.Add("CommandInfo", commandinfo);
                try
                {
                    if (commanditem.CommandName == CommandName.WORKSTART)
                    {

                        var resval = await dbcommand.ExecuteScalarAsync();
                        commandresultvalue = String.Format("{0}", resval);
                        //var worksheets = GetData("SELECT * FROM WORK_WORKSHEET WHERE ID_WORK=" + commandresult, connection,null,true, transaction);
                        //var worksheetmaterials = GetData("SELECT * FROM WORK_WORKSHEET_MATERIALS WHERE ID_WORK=" + commandresult, connection,null, true, transaction);

                        workid = int.Parse(commandresultvalue);

                    }
                    else if (commanditem.CommandName == CommandName.WORKEND)
                    {
                        //transaction.Commit();

                        var resval = await dbcommand.ExecuteScalarAsync();
                        commandresultvalue = String.Format("{0}", resval);
                    }
                    else
                    {
                        //var resval = dbcommand.ExecuteNonQuery();
                        //var resval = GetData(dbcommand);
                        commandresult.ViewData.Add("CommandText", dbcommand.CommandText);

                        var resval = await dbcommand.ExecuteScalarAsync();

                        // var resval = 1;
                        commandresultvalue = String.Format("{0}", resval);
                    }
                    commandresult.Model.Add("Value", commandresultvalue);

                }
                catch (Exception ex)
                {
                    commandinfo.Error = new ApiModel.DataException(ex, dbcommand.CommandText);
                    commandresult.AddError(commandinfo.Error);
                    mainresult.AddError(commandinfo.Error);
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

            //var dbcaftercommand = connection.CreateCommand();
            //dbcaftercommand.CommandText = csdeletesqlcommand.Text;
            //dbcaftercommand.Transaction = transaction;
            //postconnectioninfo.SetFrom(dbcaftercommand, null);
            //if (setconnectioninfo)
            //{
            //    try
            //    {
            //        postconnectioninfo.Result = dbcaftercommand.ExecuteNonQuery();
            //    }
            //    catch (Exception ex)
            //    {
            //        postconnectioninfo.Error = ex;

            //    }
            //}
            //foreach (var result in mainresult.Model)
            //{
            //    if (result.Exception != null)
            //    {
            //        mainresult.AddError(result.Exception);
            //    }
            //}
            return mainresult;
        }

        public override Result<Dictionary<string, Dictionary<string, string>>> GetDBLayout(IDbConnection connection)
        {
            var commandtext = "SELECT   R.RDB$RELATION_NAME,   R.RDB$FIELD_NAME,F.RDB$FIELD_LENGTH,   F.RDB$FIELD_TYPE,   F.RDB$FIELD_SCALE ,   F.RDB$FIELD_SUB_TYPE FROM   RDB$RELATION_FIELDS R   JOIN RDB$FIELDS F     ON F.RDB$FIELD_NAME = R.RDB$FIELD_SOURCE   JOIN RDB$RELATIONS RL     ON RL.RDB$RELATION_NAME = R.RDB$RELATION_NAME WHERE   COALESCE(R.RDB$SYSTEM_FLAG, 0) = 0   AND   COALESCE(RL.RDB$SYSTEM_FLAG, 0) = 0   AND   RL.RDB$VIEW_BLR IS NULL ORDER BY   R.RDB$RELATION_NAME,   R.RDB$FIELD_NAME";

            var command = connection.CreateCommand();
            command.CommandText = commandtext;
            var result = new Dictionary<string, Dictionary<string, string>>();
            Exception ex2 = null;
            try
            {
                var reader = command.ExecuteReader(System.Data.CommandBehavior.Default);
                while (reader.Read())
                {

                    var d_tablename = reader.GetString(reader.GetOrdinal("RDB$RELATION_NAME")).Trim();
                    var d_fieldname = reader.GetString(reader.GetOrdinal("RDB$FIELD_NAME")).Trim();
                    var i_length = reader.GetOrdinal("RDB$FIELD_LENGTH");
                    var i_scale = reader.GetOrdinal("RDB$FIELD_SCALE");
                    var i_type = reader.GetOrdinal("RDB$FIELD_TYPE");
                    var i_subtype = reader.GetOrdinal("RDB$FIELD_SUB_TYPE");
                    var d_length = reader.IsDBNull(i_length) ? -1 : reader.GetInt32(i_length);
                    var d_scale = reader.IsDBNull(i_scale) ? -1 : reader.GetInt32(i_scale);
                    var d_type = reader.GetInt32(i_type);
                    var d_subtype = reader.IsDBNull(i_subtype) ? -1 : reader.GetInt32(i_subtype);
                    var stype = GetFirDBType(d_type, d_subtype);

                    if (!result.ContainsKey(d_tablename))
                    {
                        result.Add(d_tablename, new Dictionary<string, string>());
                    }
                    var dx = result[d_tablename];
                    dx.Add(d_fieldname, String.Format("{0} ({1},{2})", stype, d_length, d_scale));
                }
                reader.Close();

            }
            catch (Exception ex)
            {
                ex2 = ex;

            }
            finally
            {
             
            }
            if (ex2 != null)
            {
                return Result<Dictionary<string, Dictionary<string, string>>>.Failed(ex2);
            }
            return Result.SuccessWithModel(result);

        }

        private string GetFirDBType(int type, int subtype)
        {
            var stype = type.ToString();
            switch (type)
            {
                case 7:
                    switch (subtype)
                    {
                        case 0:
                            stype = "SMALLINT";
                            break;
                        case 1:
                            stype = "NUMERIC";
                            break;
                        case 2:
                            stype = "DECIMAL";
                            break;
                    }
                    break;
                case 8:
                    switch (subtype)
                    {
                        case 0:
                            stype = "INTEGER";
                            break;
                        case 1:
                            stype = "NUMERIC";
                            break;
                        case 2:
                            stype = "DECIMAL";
                            break;
                    }
                    break;
                case 9:
                    stype = "QUAD";
                    break;
                case 10:
                    stype = "FLOAT";
                    break;
                case 12:
                    stype = "DATE";
                    break;
                case 13:
                    stype = "TIME";
                    break;
                case 14:
                    stype = "CHAR";
                    break;
                case 16:
                    switch (subtype)
                    {
                        case 0:
                            stype = "BIGINT";
                            break;
                        case 1:
                            stype = "NUMERIC";
                            break;
                        case 2:
                            stype = "DECIMAL";
                            break;
                    }
                    break;
                case 27:
                    stype = "DOUBLE";
                    break;
                case 35:
                    stype = "TIMESTAMP";
                    break;
                case 37:
                    stype = "VARCHAR";
                    break;
                case 40:
                    stype = "CSTRING";
                    break;
                case 45:
                    stype = "BLOB_ID";
                    break;
                case 261:
                    stype = "BLOB SUB_TYPE " + subtype;
                    break;
                default:
                    Console.WriteLine("The color is unknown.");
                    break;
            }
            return stype;
        }
    }
}