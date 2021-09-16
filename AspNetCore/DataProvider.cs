using ApiModel;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;

namespace ApiModel
{
    public abstract class DataProvider
    {
        public abstract DbConnection GetConnection(string connectionstring);
        public abstract String ConnectionTypeName { get; }

        public virtual IDataReader GetReader(IDbCommand command)
        {
            return command.ExecuteReader();
        }

        public virtual IDataReader GetReader(string commandtext, IDbConnection connection, IDbTransaction transaction = null)
        {
            var command = connection.CreateCommand();
            command.Transaction = transaction;
            command.CommandText = commandtext;
            var reader = command.ExecuteReader();
            //command.Dispose();
            return reader;
        }
        public virtual async Task<DbDataReader> GetReaderAsync(string commandtext, DbConnection connection, DbTransaction transaction = null)
        {
            var command = connection.CreateCommand();
            command.Transaction = transaction;
            command.CommandText = commandtext;
            var reader = await command.ExecuteReaderAsync();
            //command.Dispose();
            return reader;
        }

        public virtual List<Dictionary<string, object>> GetData(string commandtext, IDbConnection connection, Dictionary<string, int> fielddictionary = null, bool addnulls = false, IDbTransaction transaction = null)
        {
            var result = new List<Dictionary<string, object>>();
            var reader = GetReader(commandtext, connection, transaction);
            fielddictionary = fielddictionary == null ? new Dictionary<string, int>() : fielddictionary;

            for (int i = 0; i < reader.FieldCount; i++)
            {
                var fieldname = reader.GetName(i);
                fielddictionary.Add(reader.GetName(i), i);
            }
            while (reader.Read())
            {
                var recorddictionary = new Dictionary<string, object>();

                for (int i = 0; i < reader.FieldCount; i++)
                {
                    var fieldname = reader.GetName(i);
                    var value = reader.GetValue(i);
                    if (value != DBNull.Value || addnulls)
                    {
                        recorddictionary.Add(fieldname, value);
                    }
                }
                result.Add(recorddictionary);
            }
            reader.Close();
            reader.Dispose();
            return result;
        }

        public virtual async Task<List<Dictionary<string, object>>> GetDataAsync(string commandtext, DbConnection connection, Dictionary<string, int> fielddictionary = null, bool addnulls = false, DbTransaction transaction = null)
        {
            var result = new List<Dictionary<string, object>>();
            //cnhere
            var reader = await GetReaderAsync(commandtext, connection, transaction);
            fielddictionary = fielddictionary == null ? new Dictionary<string, int>() : fielddictionary;

            for (int i = 0; i < reader.FieldCount; i++)
            {
                var fieldname = reader.GetName(i);
                fielddictionary.Add(reader.GetName(i), i);
            }
            while (await reader.ReadAsync())
            {
                var recorddictionary = new Dictionary<string, object>(reader.FieldCount);

                for (int i = 0; i < reader.FieldCount; i++)
                {
                    var fieldname = reader.GetName(i);
                    var value = reader.GetValue(i);
                    if (value != DBNull.Value || addnulls)
                    {
                        recorddictionary.Add(fieldname, value);
                    }
                }
                result.Add(recorddictionary);
            }
            reader.Close();
            //cnhere
            reader.Dispose();
            return result;
        }

        public virtual List<Dictionary<string, object>> GetData(IDbCommand command, Dictionary<string, int> fielddictionary = null, bool addnulls = false, IDbTransaction transaction = null)
        {
            var result = new List<Dictionary<string, object>>();
            var reader = GetReader(command.CommandText, command.Connection, command.Transaction);
            fielddictionary = fielddictionary == null ? new Dictionary<string, int>() : fielddictionary;

            for (int i = 0; i < reader.FieldCount; i++)
            {
                var fieldname = reader.GetName(i);
                fielddictionary.Add(reader.GetName(i), i);
            }
            while (reader.Read())
            {
                var recorddictionary = new Dictionary<string, object>();

                for (int i = 0; i < reader.FieldCount; i++)
                {
                    var fieldname = reader.GetName(i);
                    var value = reader.GetValue(i);
                    if (value != DBNull.Value || addnulls)
                    {
                        recorddictionary.Add(fieldname, value);
                    }
                }
                result.Add(recorddictionary);
            }
            reader.Close();
            reader.Dispose();
            return result;
        }

        public virtual Result<Dictionary<string, Dictionary<string, string>>> GetDBLayout(IDbConnection connection)
        {
            var result = new Result<Dictionary<string, Dictionary<string, string>>>();
            result.AddError(new NotImplementedException());
            return result;
        }
        public virtual async Task<DataCommand> SetConnectionInfo(DbOptions options, Result<List<Dictionary<string, object>>> result)
        {
            //var cs_start = GetConnectionParameterInsert();
            return null;
        }
        //public virtual async Task<DataCommand> SetConnectionInfo(DbConnection connection, DbTransaction transaction, Result<List<Dictionary<string, object>>> result, long userid=1) 
        //{
        //    //var cs_start = GetConnectionParameterInsert();
        //    return null;
        //}

        public virtual async Task<DataCommand> ClearConnectionInfo(DbOptions options, Result<List<Dictionary<string, object>>> result)
        {
            //var cs_start = GetConnectionParameterInsert();
            return null;
        }
    }
    public class DbOptions
    {
        public long UserId = -1;
        public long SessionId = -1;
        public DbConnection connection = null;
        public DbTransaction transaction = null;
        public Dictionary<string, Result<List<Dictionary<string, object>>>> results = new Dictionary<string, Result<List<Dictionary<string, object>>>>();
        public DbOptions()
        {

        }
        public DbOptions(DbConnection connection, DbTransaction transaction)
        {
            this.transaction = transaction;
            this.connection = connection;
        }
    }
    public abstract class TypedDataProvider : DataProvider
    {
        private QueryService _QueryService;
        public void SetQueryService(QueryService qs)
        {
            this._QueryService = qs;
        }

        public QueryService GetQueryService()
        {
            return _QueryService;
        }
        public virtual SqlSyntax Syntax { get { return null; } }

        public virtual Result<List<Dictionary<string, object>>> GetData(ClientQuery clientquery, IDbConnection connection, IDbTransaction transaction = null)
        {
            var records = new List<Dictionary<string, object>>();
            var result = Result.SuccessWithModel(records);

            var dbquery = _QueryService.GetQueryByName(clientquery.QueryName);
            List<SqlQuery> sqlqueries = new List<SqlQuery>();
            try
            {
                _QueryService.RemoveUndefinedFields = true;
                sqlqueries = dbquery.GetQueries(clientquery, _QueryService);
            }
            catch (Exception ex)
            {
                var dex = new ApiModel.DataException(ex, clientquery);
                result.AddError(dex);
                return result;
            }
            foreach (var sqlquery in sqlqueries)
            {

                sqlquery.FieldDictionary = new Dictionary<string, int>();
                var dt = DateTime.Now;
                try
                {
                    //if (sql)
                    var sqlquerytext = Syntax.GetSQLQuery(sqlquery.Select);

                    if (String.IsNullOrEmpty(sqlquerytext))
                    {
                        sqlquerytext = sqlquery.Text;
                    }
                    else
                    {
                        sqlquery.Text = sqlquerytext;
                    }
                    result.ViewData.Add("Query_" + sqlquery.Name, sqlquerytext);
                    sqlquery.Result = GetData(sqlquerytext, connection, sqlquery.FieldDictionary, false, transaction);
                    sqlquery.Duration = DateTime.Now.Subtract(dt).TotalMilliseconds;
                }
                catch (Exception ex)
                {
                    sqlquery.Duration = DateTime.Now.Subtract(dt).TotalMilliseconds;
                    sqlquery.Error = ex;
                    result.AddError(ex, sqlquery);
                    return result;
                }
            }
            var mainsqlquery = sqlqueries.FirstOrDefault(i => i.Name == "");
            var mainkeydictionary = GetMainKeyDictionary(sqlqueries, dbquery);

            var listfields = dbquery.Relations.Where(i => i.Type == 1).Select(i => i.Alias).ToList();
            foreach (var listfield in listfields)
            {
                mainsqlquery.FieldDictionary.Add(listfield, mainsqlquery.FieldDictionary.Count);
            }
            //mainsqlquery.FieldDictionary.Remove("[KEY]");

            mainsqlquery.Result.ForEach(r =>
            {
                foreach (var listfield in listfields)
                {
                    if (!r.ContainsKey(listfield))
                    {
                        r.Add(listfield, null);
                    }
                    r[listfield] = new List<Dictionary<string, object>>();
                }

            });

            result.ViewData.Add("FieldDictionary[]", mainsqlquery.FieldDictionary);
            var countsqlquery = sqlqueries.FirstOrDefault(i => i.Name == "Count");
            // var mainrecorddictionary = mainsqlquery.Result.ToDictionary(k => String.Format("{0}", k["[KEY]"]));
            foreach (var listfield in mainsqlquery.ListFields)
            {
                var listquery = sqlqueries.FirstOrDefault(i => i.Name == listfield);

                if (listquery != null)
                {
                    var keydict = mainkeydictionary[listquery.Name];
                    var functions = new List<Func<Dictionary<string, object>, Dictionary<string, object>, bool>>();
                    foreach (var item in keydict)
                    {
                        var l_list_field = item.Key;
                        var l_main_field = item.Value;
                        Func<Dictionary<string, object>, Dictionary<string, object>, bool> f = (main, list) =>
                        {
                            return main.ContainsKey(l_main_field) && Object.Equals(main[l_main_field], list[l_list_field]);
                        };
                        functions.Add(f);

                    }
                    Func<Dictionary<string, object>, Dictionary<string, object>, bool> thefunction = (main, list) =>
                    {
                        return functions.TrueForAll(i => i(main, list));
                    };
                    result.ViewData.Add("FieldDictionary[" + listquery.Name + "]", listquery.FieldDictionary);

                    foreach (var record in listquery.Result)
                    {
                        var nonexistent = listquery.KeyFields.FirstOrDefault(i => !record.ContainsKey(i));
                        if (nonexistent != null)
                        {
                            var d = new Dictionary<string, object>();
                            d.Add("key", nonexistent);
                            d.Add("record", record);
                            d.Add("listquery.Result", listquery);
                            throw new DataException("Keynotfound: ", d);
                        }
                        var keyvalues = listquery.KeyFields.Select(i => record[i]).ToList();
                        var keystr = Strings.ListToString(keyvalues, "||'@'||");

                        var relatedmainrecords = mainsqlquery.Result.Where(i => thefunction(i, record));
                        foreach (var relatedrecord in relatedmainrecords)
                        {
                            var container = relatedrecord[listfield] as List<Dictionary<string, object>>;
                            if (!clientquery.Compress.HasValue || clientquery.Compress.Value)
                            {
                                var compressedrecord = record.ToDictionary(i => listquery.FieldDictionary[i.Key].ToString(), i => i.Value);

                                container.Add(compressedrecord);

                            }
                            else
                            {
                                container.Add(record);
                            }
                        }
                    }
                }
            }
            var mainrecords = new List<Dictionary<string, object>>();
            foreach (var record in mainsqlquery.Result)
            {
                if (!clientquery.Compress.HasValue || clientquery.Compress.Value)
                {
                    var compressedrecord = new Dictionary<string, object>();
                    foreach (var item in record)
                    {
                        var newkey = mainsqlquery.FieldDictionary.ContainsKey(item.Key) ? mainsqlquery.FieldDictionary[item.Key].ToString() : "";
                        if (!String.IsNullOrEmpty(newkey))
                        {
                            if (!compressedrecord.ContainsKey(newkey))
                            {
                                compressedrecord.Add(newkey, null);
                            }
                            compressedrecord[newkey] = item.Value;
                        }
                    }
                    mainrecords.Add(compressedrecord);
                }
                else
                {
                    mainrecords.Add(record);
                }
            }
            records.AddRange(mainrecords);
            var durations = sqlqueries.Select(i => String.Format("{0}: {1}", i.Name, i.Duration)).ToList();
            result.ViewData.Add("Durations", Strings.ListToString(durations));

            if (countsqlquery != null)
            {
                var countrecord = countsqlquery.Result.FirstOrDefault();
                if (countrecord != null)
                {
                    result.ViewData.Add("Count", countrecord["Count"]);
                }
            }
            return result;
        }
        public virtual async Task<Result<List<Dictionary<string, object>>>> GetDataAsync(ClientQuery clientquery, DbConnection connection, DbTransaction transaction)
        {
            var options = new DbOptions();
            options.transaction = transaction;
            options.connection = connection;
            return await GetDataAsync(clientquery, options);
        }

        public virtual async Task<Result<List<Dictionary<string, object>>>> GetDataAsync(ClientQuery clientquery, DbOptions options)
        {
            var records = new List<Dictionary<string, object>>();
            var result = Result.SuccessWithModel(records);
            DataCommand cncommand = null;

            var dbquery = _QueryService.GetQueryByName(clientquery.QueryName);
            List<SqlQuery> sqlqueries = new List<SqlQuery>();
            result.SetViewData("TypeName", dbquery.TypeName);

            try
            {
                var log = ClientQuery.SetResultParameters(clientquery, options.results);
                result.SetViewData("RPLog", log);
                sqlqueries = dbquery.GetQueries(clientquery, _QueryService);
            }
            catch (Exception ex)
            {
                var dex = new ApiModel.DataException(ex, clientquery);
                result.AddError(dex);
                return result;
            }
            foreach (var sqlquery in sqlqueries)
            {
                sqlquery.FieldDictionary = new Dictionary<string, int>();
                var dt = DateTime.Now;
                try
                {
                    if (sqlquery.Name == "")
                    {
                        var tnfield = sqlquery.Select.Fields.FirstOrDefault(i => i.Alias == "TypeName");
                        if (tnfield != null)
                        {
                            sqlquery.Select.Fields.Remove(tnfield);
                        }
                    }
                    var sqlquerytext = Syntax.GetSQLQuery(sqlquery.Select);
                    if (string.IsNullOrEmpty(sqlquerytext) || clientquery.Datasets.Count > 0)
                    {
                        sqlquerytext = sqlquery.Text;
                    }
                    else
                    {
                        sqlquery.Text = sqlquerytext;
                    }
                    result.ViewData.Add("Query_" + sqlquery.Name, sqlquerytext);
                    sqlquery.Result = await GetDataAsync(sqlquerytext, options.connection, sqlquery.FieldDictionary, false, options.transaction);
                    sqlquery.Duration = DateTime.Now.Subtract(dt).TotalMilliseconds;
                }
                catch (Exception ex)
                {
                    sqlquery.Duration = DateTime.Now.Subtract(dt).TotalMilliseconds;
                    sqlquery.Error = ex;
                    result.AddError(ex, sqlquery);
                    return result;
                }
            }
            var mainsqlquery = sqlqueries.FirstOrDefault(i => i.Name == "");
            var mainkeydictionary = GetMainKeyDictionary(sqlqueries, dbquery);

            var listfields = dbquery.Relations.Where(i => i.Type == 1).Select(i => i.Alias).ToList();
            foreach (var listfield in listfields)
            {
                mainsqlquery.FieldDictionary.Add(listfield, mainsqlquery.FieldDictionary.Count);
            }

            mainsqlquery.Result.ForEach(r =>
            {
                foreach (var listfield in listfields)
                {
                    if (!r.ContainsKey(listfield))
                    {
                        r.Add(listfield, null);
                    }
                }
            });

            result.ViewData.Add("FieldDictionary[]", mainsqlquery.FieldDictionary);
            var countsqlquery = sqlqueries.FirstOrDefault(i => i.Name == "Count");
            foreach (var listfield in mainsqlquery.ListFields)
            {
                var listquery = sqlqueries.FirstOrDefault(i => i.Name == listfield);
                if (listquery != null)
                {
                    result.ViewData.Add("FieldDictionary[" + listquery.Name + "]", listquery.FieldDictionary);
                    var keydict = mainkeydictionary[listquery.Name];
                    var functions = new List<Func<Dictionary<string, object>, Dictionary<string, object>, bool>>();
                    foreach (var item in keydict)
                    {
                        var l_list_field = item.Key;
                        var l_main_field = item.Value;
                        Func<Dictionary<string, object>, Dictionary<string, object>, bool> f = (main, list) =>
                        {
                            return main.ContainsKey(l_main_field) && Object.Equals(main[l_main_field], list[l_list_field]);
                        };
                        functions.Add(f);
                    }
                    Func<Dictionary<string, object>, Dictionary<string, object>, bool> thefunction = (main, list) =>
                    {
                        return functions.TrueForAll(i => i(main, list));
                    };
                    foreach (var record in listquery.Result)
                    {
                        var nonexistent = listquery.KeyFields.FirstOrDefault(i => !record.ContainsKey(i));
                        if (nonexistent != null)
                        {
                            var d = new Dictionary<string, object>();
                            d.Add("key", nonexistent);
                            d.Add("record", record);
                            d.Add("listquery.Result", listquery);
                            throw new DataException("Keynotfound: ", d);
                        }
                        var keyvalues = listquery.KeyFields.Select(i => record[i]).ToList();
                        var keystr = Strings.ListToString(keyvalues, "||'@'||");

                        var relatedmainrecords = mainsqlquery.Result.Where(i => thefunction(i, record)).ToList();
                        if (relatedmainrecords.Count == 0)
                        {

                        }
                        foreach (var relatedrecord in relatedmainrecords)
                        {
                            var container = relatedrecord[listfield] as List<Dictionary<string, object>>;
                            if (container == null)
                            {
                                container = new List<Dictionary<string, object>>();
                                relatedrecord[listfield] = container;
                            }
                            if (!clientquery.Compress.HasValue || clientquery.Compress.Value)
                            {
                                var compressedrecord = record.ToDictionary(i => listquery.FieldDictionary[i.Key].ToString(), i => i.Value);

                                container.Add(compressedrecord);

                            }
                            else
                            {
                                container.Add(record);
                            }
                        }
                    }
                }
            }
            var mainrecords = new List<Dictionary<string, object>>();
            foreach (var record in mainsqlquery.Result)
            {
                record.Remove("[KEY]");
                if (!clientquery.Compress.HasValue || clientquery.Compress.Value)
                {
                    var compressedrecord = new Dictionary<string, object>();
                    foreach (var item in record)
                    {
                        var newkey = mainsqlquery.FieldDictionary.ContainsKey(item.Key) ? mainsqlquery.FieldDictionary[item.Key].ToString() : "";
                        if (!String.IsNullOrEmpty(newkey))
                        {
                            if (!compressedrecord.ContainsKey(newkey))
                            {
                                compressedrecord.Add(newkey, null);
                            }
                            compressedrecord[newkey] = item.Value;
                        }
                    }
                    mainrecords.Add(compressedrecord);
                }
                else
                {
                    mainrecords.Add(record);
                }
            }
            records.AddRange(mainrecords);
            var durations = sqlqueries.Select(i => String.Format("{0}: {1}", i.Name, i.Duration)).ToList();
            result.ViewData.Add("Durations", Strings.ListToString(durations));

            if (countsqlquery != null)
            {
                var countrecord = countsqlquery.Result.FirstOrDefault();
                if (countrecord != null)
                {
                    result.ViewData.Add("Count", countrecord["Count"]);
                }
            }

            return result;
        }

        private Dictionary<string, Dictionary<string, string>> GetMainKeyDictionary(List<SqlQuery> sqlqueries, DbQuery mainquery)
        {
            var result = new Dictionary<string, Dictionary<string, string>>();
            var resultf = new Dictionary<object, Func<Dictionary<string, object>, List<Dictionary<string, object>>>>();
            var mainsqlquery = sqlqueries.FirstOrDefault(i => i.Name == "");
            var listqueries = sqlqueries.Where(i => i.Name != "" && i.Name != "Count");
            foreach (var listquery in listqueries)
            {
                result.Add(listquery.Name, new Dictionary<string, string>());
                var relation = mainquery.Relations.FirstOrDefault(i => i.Alias == listquery.Name);
                if (relation != null)
                {
                    var relatedquery = _QueryService.GetQueryByName(relation.QueryName);
                    var logicalrelationkeys = new Dictionary<string, string>();
                    foreach (var relkey in relation.Keys)
                    {
                        var physical_mainkey = relkey.Key;
                        var physical_listkey = relation.Keys[relkey.Key];
                        if (!physical_mainkey.StartsWith("[") && !physical_mainkey.StartsWith("["))
                        {

                            if (mainquery.Fields.ContainsValue(physical_mainkey) && relatedquery.Fields.ContainsValue(physical_listkey))
                            {
                                var logical_mainfield = mainquery.Fields.FirstOrDefault(i => i.Value == physical_mainkey).Key;
                                var logical_listfield = relatedquery.Fields.FirstOrDefault(i => i.Value == physical_listkey).Key;
                                logicalrelationkeys.Add(logical_listfield, logical_mainfield);
                                result[listquery.Name].Add(logical_listfield, logical_mainfield);
                            }
                        }
                    }


                }
            }
            return result;

        }

        public virtual Result<List<Result<StandardDictionary>>> ExecuteCommands(List<DataCommand> commands, DbConnection connection, DbTransaction transaction = null, bool setconnectioninfo = true)
        {
            var mainresult = new Result<List<Result<StandardDictionary>>>();

            var ix = 1;
            var maininfo = new CommandInfo();
            mainresult.ViewData.Add("CommandInfo", maininfo);

            //var results = new List<Dictionary<string, Object>>();
            var dbresults = new List<string>();

            var scommands = SetCommands(commands);
            var sqlcommands = GetCommands(scommands);



            // var resval = 1;

            //var transaction = connection.BeginTransaction();
            foreach (var sqlcommand in sqlcommands)
            {
                var commandinfo = new CommandInfo();
                maininfo.Children.Add(commandinfo);


                var dbcommand = connection.CreateCommand();
                dbcommand.Transaction = transaction;
                dbcommand.CommandText = sqlcommand.Text;
                var commanditem = scommands[ix - 1];

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

                    return mainresult;


                }

                ix++;
            }

            return mainresult;
        }

        public virtual Result<StandardDictionary> ExecuteCommand(DataCommand command, DbConnection connection, DbTransaction transaction)
        {
            var result = new Result<StandardDictionary>();
            var commandinfo = new CommandInfo();
            result.ViewData.Add("CommandInfo", commandinfo);
            commandinfo.ConnectionInfo = this.ConnectionTypeName + "; ";
            commandinfo.CommandObject = command;

            var sqlcommand = GetCommand(command);
            var dbcommand = connection.CreateCommand();
            dbcommand.Transaction = transaction;
            dbcommand.CommandText = sqlcommand.Text;
            commandinfo.CommandText = sqlcommand.Text;


            try
            {

                var resval = dbcommand.ExecuteScalar();

                var commandresult = String.Format("{0}", resval);
                result.Model.Add("Value", commandresult);

            }
            catch (Exception ex)
            {
                result.AddError(ex);


            }




            return result;

        }
        public async virtual Task<Result<List<Result<StandardDictionary>>>> ExecuteCommandsAsync(List<DataCommand> commands, DbConnection connection, DbTransaction transaction = null, bool setconnectioninfo = true)
        {
            var mainresult = new Result<List<Result<StandardDictionary>>>();

            var ix = 1;
            var maininfo = new CommandInfo();
            mainresult.ViewData.Add("CommandInfo", maininfo);

            //var results = new List<Dictionary<string, Object>>();
            var dbresults = new List<string>();

            var scommands = SetCommands(commands);
            var sqlcommands = GetCommands(scommands);
            maininfo.CommandText = "scommands: " + scommands.Count + "; sqlcommands:" + sqlcommands.Count;


            // var resval = 1;

            //var transaction = connection.BeginTransaction();
            foreach (var sqlcommand in sqlcommands)
            {
                var commandinfo = new CommandInfo();
                maininfo.Children.Add(commandinfo);


                var dbcommand = connection.CreateCommand();
                dbcommand.Transaction = transaction;
                dbcommand.CommandText = sqlcommand.Text;
                var commanditem = scommands[ix - 1];

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
                    commandresult.ViewData.Add("CommandText", dbcommand.CommandText);

                    var resval = await dbcommand.ExecuteScalarAsync();

                    // var resval = 1;
                    commandresultvalue = String.Format("{0}", resval);
                    commandresult.Model.Add("Value", commandresultvalue);

                }
                catch (Exception ex)
                {
                    commandinfo.Error = ex;
                    commandresult.AddError(ex);
                    var resultobj = new Result<List<DataCommandResult>>();

                    return mainresult;


                }

                ix++;
            }

            return mainresult;
        }

        public async virtual Task<Result<StandardDictionary>> ExecuteCommandAsync(DataCommand command, DbConnection connection, DbTransaction transaction)
        {
            var result = new Result<StandardDictionary>();
            var commandinfo = new CommandInfo();
            result.ViewData.Add("CommandInfo", commandinfo);
            commandinfo.ConnectionInfo = this.ConnectionTypeName + "; ";
            commandinfo.CommandObject = command;

            var sqlcommand = GetCommand(command);
            if (sqlcommand != null)
            {
                Console.WriteLine(new DateTimeOffset(DateTime.Now).ToUnixTimeSeconds());
                Console.WriteLine(sqlcommand.Text);
                var dbcommand = connection.CreateCommand();
                dbcommand.Transaction = transaction;
                dbcommand.CommandText = sqlcommand.Text;
                commandinfo.CommandText = sqlcommand.Text;

                try
                {
                    var resval = await dbcommand.ExecuteScalarAsync();

                    var commandresult = String.Format("{0}", resval);
                    result.Model.Add("Value", commandresult);
                    result.ViewData.Add("CommandText", dbcommand.CommandText);
                }
                catch (Exception ex)
                {
                    result.AddError(ex);
                }
            }
            else
            {
                result.Model.Add("Value", -1);
            }
            return result;
        }

        public virtual SqlQuery GetCommand(DataCommand commandobj, int ix = 0)
        {
            return null;
        }

        public virtual List<SqlQuery> GetCommands(List<DataCommand> command)
        {
            var result = new List<SqlQuery>();
            var ix = 0;
            foreach (var commandobj in command)
            {

                var query = GetCommand(commandobj, ix);
                if (query != null)
                {
                    result.Add(query);
                }
                ix++;
            }

            return result;
        }
        public virtual List<DataCommand> SetCommands(List<DataCommand> commands)
        {
            return commands;
        }

    }
}