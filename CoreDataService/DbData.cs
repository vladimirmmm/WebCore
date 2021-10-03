using ApiModel;
using FirebirdSql.Data.FirebirdClient;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.OleDb;
using System.IO;
using System.Linq;
using System.Web;

namespace DataService.Models
{
    public class DbData
    {
        public Result<List<Dictionary<string, Object>>> GetDataDictionaryNormal(IDbConnection connection, List<SqlQuery> sqlqueries)
        {
            var result = new List<Dictionary<string, Object>>();
            var responsemodel = new Result<List<Dictionary<string, Object>>>();
            var maindatadictionary = new Dictionary<string, Object>();
            foreach (var qry in sqlqueries)
            {
                var sdate = DateTime.Now;
                var isexternal = qry.Name != "" && qry.Name != "Count";
                var iscount = qry.Name == "Count";
                var ismain = qry.Name == "";

                var command = connection.CreateCommand();
                command.CommandText = qry.Text;
                var reader = command.ExecuteReader(System.Data.CommandBehavior.Default);
               

                while (reader.Read())
                {
                    var recorddictionary = new Dictionary<string, object>();
                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        var fieldname = reader.GetName(i);
                        var value = reader.GetValue(i);
                        var container = recorddictionary;
                        container.Add(fieldname, value);
                    }
                    if (isexternal)
                    {
                        var keyvalues = qry.KeyFields.Select(i => recorddictionary[i]).ToList();
                        var keynamesstr = Strings.ListToString(qry.KeyFields, ", ");
                        var keystr = Strings.ListToString(keyvalues, "@");
                        if (!maindatadictionary.ContainsKey(keystr))
                        {
                            throw new Exception(String.Format("Keyvalue {0} defined on {1} was not found in the maindatadictionary qry: {2}", keystr, keynamesstr, qry.Name));
                        }
                        var parent = maindatadictionary[keystr] as Dictionary<string, object>;
                        if (!(parent[qry.Name] is List<Dictionary<string, object>>))
                        {
                            parent[qry.Name] = new List<Dictionary<string, object>>();
                        }
                        var exd = parent[qry.Name] as List<Dictionary<string, object>>;
                        exd.Add(recorddictionary);


                    }
                    if (ismain)
                    {
                        if (recorddictionary.ContainsKey("[KEY]"))
                        {
                            maindatadictionary.Add(String.Format("{0}", recorddictionary["[KEY]"]), recorddictionary);
                        }
                        result.Add(recorddictionary);

                    }
                    if (iscount)
                    {
                        responsemodel.ViewData["Count"] = recorddictionary["Count"];

                    }
                }
                reader.Close();
                command.Dispose();
                if (qry.ListFields.Count > 0 && ismain)
                {
                    foreach (var item in maindatadictionary)
                    {
                        var d = item.Value as Dictionary<string, object>;
                        foreach (var listfield in qry.ListFields)
                        {
                            if (d.ContainsKey(listfield))
                            {
                                var val = d[listfield];
                                if (val != null && (val.GetType() == typeof(String) || val.GetType() == typeof(string)))
                                {
                                    d[listfield] = new List<string>();
                                }
                            }
                        }
                    }
                }
                qry.Duration = DateTime.Now.Subtract(sdate).TotalMilliseconds;

            }

          
            responsemodel.Model = result;
            return responsemodel;
        }


        public Result<List<Dictionary<string, Object>>> GetDataDictionary(IDbConnection connection, List<SqlQuery> sqlqueries)
        {

            var result = new List<Dictionary<string, Object>>();
            var responsemodel = new Result<List<Dictionary<string, Object>>>();
            var maindatadictionary = new Dictionary<string, Object>();
            var mainfielddictionary = new Dictionary<string, string>();

            foreach (var qry in sqlqueries)
            {
                var sdate = DateTime.Now;
                var isexternal = qry.Name != "" && qry.Name != "Count";
                var iscount = qry.Name == "Count";
                var ismain = qry.Name == "";

                var command = connection.CreateCommand();
                command.CommandText = qry.Text;
                var reader = command.ExecuteReader(System.Data.CommandBehavior.Default);
                var fielddictionary = new Dictionary<string, string>();
              
                if (!iscount)
                {
                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        fielddictionary.Add(reader.GetName(i), i.ToString());
                    }
                    responsemodel.ViewData.Add("FieldDictionary[" + qry.Name+"]", fielddictionary);
                    if (ismain)
                    {
                        mainfielddictionary = fielddictionary;
                    }
                }

                while (reader.Read())
                {
                    var recorddictionary = new Dictionary<string, object>();
                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        var fieldname = reader.GetName(i);
                        var value = reader.GetValue(i);
                        if (value != DBNull.Value)
                        {
                            var container = recorddictionary;
      
                            var propertyname = fielddictionary.ContainsKey(fieldname) ? fielddictionary[fieldname] : fieldname;
                            container.Add(propertyname, value);
                        }
                    }
                    if (isexternal)
                    {
                        var keyvalues = qry.KeyFields.Select(i => recorddictionary[fielddictionary[i]]).ToList();
                        var keynamesstr = Strings.ListToString(qry.KeyFields, ", ");
                        var keystr = Strings.ListToString(keyvalues, "@");
                        if (!maindatadictionary.ContainsKey(keystr))
                        {
                            responsemodel.AddError(String.Format("Keyvalue {0} defined on {1} was not found in the maindatadictionary qry: {2}", keystr, keynamesstr, qry.Name));
                        }
                        else
                        {
                            var parent = maindatadictionary[keystr] as Dictionary<string, object>;
                            if (!mainfielddictionary.ContainsKey(qry.Name))
                            {
                                mainfielddictionary.Add(qry.Name, mainfielddictionary.Count.ToString());
                            }
                            var fielddkey = mainfielddictionary[qry.Name];
                            if (!parent.ContainsKey(fielddkey) || !(parent[fielddkey] is List<Dictionary<string, object>>))
                            {
                                parent[fielddkey] = new List<Dictionary<string, object>>();
                            }
                            var exd = parent[fielddkey] as List<Dictionary<string, object>>;
                            exd.Add(recorddictionary);
                        }

                    }
                    if (ismain)
                    {

                        if (recorddictionary.ContainsKey(fielddictionary["[KEY]"]))
                        {
                            maindatadictionary.Add(String.Format("{0}", recorddictionary[fielddictionary["[KEY]"]]), recorddictionary);
                        }
                        result.Add(recorddictionary);

                    }
                    if (iscount)
                    {
                        responsemodel.ViewData["Count"] = recorddictionary["Count"];

                    }
                }
                reader.Close();
                command.Dispose();
                if (qry.ListFields.Count > 0 && ismain)
                {
                    foreach (var item in maindatadictionary)
                    {
                        if (!item.Key.StartsWith("FieldDictionary"))
                        {
                            var d = item.Value as Dictionary<string, object>;
                            foreach (var listfield in qry.ListFields)
                            {
                                if (!mainfielddictionary.ContainsKey(listfield)) {
                              
                                    mainfielddictionary.Add(listfield, mainfielddictionary.Count.ToString());
                                    //var keys = Strings.ListToString(mainfielddictionary.Keys.ToList());
                                    //throw new KeyNotFoundException(listfield +" in "+ keys);
                                }
                                var listfieldkey = mainfielddictionary[listfield];
                                if (d.ContainsKey(listfieldkey))
                                {
                                    var val = d[listfieldkey];
                                    if (val != null && (val.GetType() == typeof(String) || val.GetType() == typeof(string)))
                                    {
                                        d[listfieldkey] = new List<string>();
                                    }
                                }
                                else {
                                    d[listfieldkey] = new List<string>();

                                }
                                //if (d.ContainsKey(listfield))
                                //{
                                //    var val = d[listfield];
                                //    if (val != null && (val.GetType() == typeof(String) || val.GetType() == typeof(string)))
                                //    {
                                //        d[listfield] = new List<string>();
                                //    }
                                //}
                            }
                        }
                    }
                }
                qry.Duration = DateTime.Now.Subtract(sdate).TotalMilliseconds;

            }
            responsemodel.Model = result;
            return responsemodel;
        }

        //public Result<List<Dictionary<string, Object>>> GetDataList(IDbConnection connection, List<SqlQuery> sqlqueries)
        //{
        //    var result = new List<Dictionary<string, Object>>();
        //    var responsemodel = new Result<List<XJSON>>();
        //    var maindatadictionary = new Dictionary<string, Object>();
        //    foreach (var qry in sqlqueries)
        //    {
        //        var sdate = DateTime.Now;
        //        var isexternal = qry.Name != "" && qry.Name != "Count";
        //        var iscount = qry.Name == "Count";
        //        var ismain = qry.Name == "";

        //        var command = connection.CreateCommand();
        //        command.CommandText = qry.SQLQuery;
        //        var reader = command.ExecuteReader(System.Data.CommandBehavior.Default);
        //        while (reader.Read())
        //        {
        //            var recorddictionary = new Dictionary<string, object>();
        //            for (int i = 0; i < reader.FieldCount; i++)
        //            {
        //                var fieldname = reader.GetName(i);
        //                var value = reader.GetValue(i);
        //                var container = recorddictionary;
        //                if (fieldname.IndexOf(".") > -1)
        //                {
        //                    var parts = fieldname.Split('.');
        //                    var alias = parts[0];
        //                    fieldname = parts[1];
        //                    if (!recorddictionary.ContainsKey(alias))
        //                    {
        //                        recorddictionary.Add(alias, new Dictionary<string, object>());
        //                    }
        //                    container = recorddictionary[alias] as Dictionary<string, object>;
        //                }
        //                container.Add(fieldname, value);
        //            }
        //            if (isexternal)
        //            {
        //                var keyvalues = qry.KeyFields.Select(i => recorddictionary[i]).ToList();
        //                var keynamesstr = Strings.ListToString(qry.KeyFields, ", ");
        //                var keystr = Strings.ListToString(keyvalues, "@");
        //                if (!maindatadictionary.ContainsKey(keystr))
        //                {
        //                    throw new Exception(String.Format("Keyvalue {0} defined on {1} was not found in the maindatadictionary qry: {2}", keystr, keynamesstr, qry.Name));
        //                }
        //                var parent = maindatadictionary[keystr] as Dictionary<string, object>;
        //                if (!(parent[qry.Name] is List<Dictionary<string, object>>))
        //                {
        //                    parent[qry.Name] = new List<Dictionary<string, object>>();
        //                }
        //                var exd = parent[qry.Name] as List<Dictionary<string, object>>;
        //                exd.Add(recorddictionary);


        //            }
        //            if (ismain)
        //            {
        //                if (recorddictionary.ContainsKey("[KEY]"))
        //                {
        //                    maindatadictionary.Add(String.Format("{0}", recorddictionary["[KEY]"]), recorddictionary);
        //                }
        //                result.Add(recorddictionary);

        //            }
        //            if (iscount)
        //            {
        //                responsemodel.ViewData["Count"] = recorddictionary["Count"];

        //            }
        //        }
        //        reader.Close();
        //        command.Dispose();
        //        if (qry.ListFields.Count > 0 && ismain)
        //        {
        //            foreach (var item in maindatadictionary)
        //            {
        //                var d = item.Value as Dictionary<string, object>;
        //                foreach (var listfield in qry.ListFields)
        //                {
        //                    if (d.ContainsKey(listfield))
        //                    {
        //                        var val = d[listfield];
        //                        if (val != null && (val.GetType() == typeof(String) || val.GetType() == typeof(string)))
        //                        {
        //                            d[listfield] = new List<string>();
        //                        }
        //                    }
        //                }
        //            }
        //        }
        //        qry.Duration = DateTime.Now.Subtract(sdate).TotalMilliseconds;

        //    }
        //    responsemodel.Model = result;
        //    return responsemodel;
        //}


        public Result<List<Dictionary<string, Object>>> GetDataDictionary(IDataReader reader, List<SqlQuery> sqlqueries)
        {
            var result = new List<Dictionary<string, Object>>();
            var responsemodel = new Result<List<Dictionary<string, Object>>>();
            var maindatadictionary = new Dictionary<string, Object>();
            foreach (var sqlquery in sqlqueries)
            {
                var isexternal = sqlquery.Name != "" && sqlquery.Name != "Count";
                var iscount = sqlquery.Name == "Count";
                var ismain = sqlquery.Name == "";

                while (reader.Read())
                {
                    var recorddictionary = new Dictionary<string, object>();
                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        var fieldname = reader.GetName(i);
                        var value = reader.GetValue(i);
                        var container = recorddictionary;
                        if (fieldname.IndexOf(".") > -1)
                        {
                            var parts = fieldname.Split('.');
                            var alias = parts[0];
                            fieldname = parts[1];
                            if (!recorddictionary.ContainsKey(alias))
                            {
                                recorddictionary.Add(alias, new Dictionary<string, object>());
                            }
                            container = recorddictionary[alias] as Dictionary<string, object>;
                        }
                        container.Add(fieldname, value);
                    }

                    if (isexternal)
                    {
                        var keyvalues = sqlquery.KeyFields.Select(i => recorddictionary[i]).ToList();
                        var keynamesstr = Strings.ListToString(sqlquery.KeyFields, ", ");
                        var keystr = Strings.ListToString(keyvalues, "@");
                        if (!maindatadictionary.ContainsKey(keystr))
                        {
                            throw new Exception(String.Format("Keyvalue {0} defined on {1} was not found in the maindatadictionary", keystr, keynamesstr));
                        }
                        var parent = maindatadictionary[keystr] as Dictionary<string, object>;
                        if (!(parent[sqlquery.Name] is List<Dictionary<string, object>>))
                        {
                            parent[sqlquery.Name] = new List<Dictionary<string, object>>();
                        }
                        var exd = parent[sqlquery.Name] as List<Dictionary<string, object>>;
                        exd.Add(recorddictionary);


                    }
                    if (ismain)
                    {
                        maindatadictionary.Add(String.Format("{0}", recorddictionary["[KEY]"]), recorddictionary);
                        result.Add(recorddictionary);

                    }
                    if (iscount)
                    {
                        responsemodel.ViewData["Count"] = recorddictionary["Count"];

                    }
                }
                reader.NextResult();
            }
            responsemodel.Model = result;
            return responsemodel;
        }


        public void ServiceTest()
        {

            


        }
        //public void test()
        //{
        //    var path = @"C:\My\Developement\DyntellSPA\Partner\ERPAspNetCoreApp\data\DbData.json";
        //    var dbquerypath = @"C:\My\Developement\DyntellSPA\Partner\ERPAspNetCoreApp\data\DbQueries.json";
        //    var clientquerypath = @"C:\My\Developement\DyntellSPA\Partner\ERPAspNetCoreApp\data\ClientQueries.json";

        //    var cart = new PartnerLogic.Models.Cart();
        //    var catalogitem = new PartnerLogic.Models.Partner.CatalogItem();
        //    var cartitem = new PartnerLogic.Models.CartItem();
        //    cartitem.SourceCatalogItem = catalogitem;
        //    //cart.Items.Add(cartitem);
        //    ServerApp.Current = new TestServerApp();
        //    var appdat = new AppDataService(new ServiceOptions());
        //    var jsonstr1 = appdat.ToJson(catalogitem);
        //    var jsonstr = appdat.ToJson(cart);

        //    //var wdata = JsonConvert.DeserializeObject<Dictionary<string,List< Dictionary<string, object>>>>(System.IO.File.ReadAllText(path));
        //    //var xdat = wdata["Main"][0];
        //    //var xdat2 = AppDataService.FixJsonData(xdat);

        //    var clientqueries = JsonConvert.DeserializeObject<Dictionary<string, ClientQuery>>(System.IO.File.ReadAllText(clientquerypath));
        //    var dbqueries = JsonConvert.DeserializeObject<Dictionary<string, DbQuery>>(System.IO.File.ReadAllText(dbquerypath));
        //    DbQuery.SetQueries(dbqueries);

        //    var query = new ClientQuery();
        //    query.QueryName = "ERDFAProduction";
        //    var f = new QueryField();
        //    f.Name = "*";
        //    query.Skip = 0;
        //    query.Take = null;
        //    var filter = new QueryFilter();
        //    filter.Field = "Voucher_Id";
        //    filter.Operator = "=";
        //    filter.Type = "Number";
        //    filter.Values = new List<string>() { "1701" };
        //    query.Filters.Add(filter);
        //    query.Fields.Add(f);
        //    query.Compress = false;
        //    var xdbquery = DbQuery.GetQueryByName(query.QueryName);
        //    var xsqlqueries = xdbquery.GetQueries(query);
        //    var provider = new Data.FireBirdDataProvider();

        //    var clientquery = clientqueries["ProductionOrderItem"];

        //    var csquery = new ClientQuery();
        //    csquery.QueryName = "MGAProductionDetail";
        //    csquery.SetField(new QueryField("*"));
        //    csquery.Take = 1;
        //    csquery.Skip = 0;
        //    csquery.Ordering = new Dictionary<string, string>() { ["CreatedOn"] = "DESC" };
        //    csquery.SetFilter(QueryFilter.Create(ClienDataType.Text, "PartnerItemCode", "000090"));
        //    csquery.SetFilter(QueryFilter.Create(ClienDataType.Number, "PartnerOperationsId", "1401"));
        //    csquery.SetFilter(QueryFilter.Create(ClienDataType.Number, "NrCRT", "2"));
        //    var csdbquery = DbQuery.GetQueryByName(csquery.QueryName);
        //    var cssqlqueries = csdbquery.GetQueries(csquery);

        //    var dbquery = DbQuery.GetQueryByName(clientquery.QueryName);
        //    var sqlqueries = dbquery.GetQueries(clientquery);
        //    var sqlserverprovider = new Data.SqlServerDataProvider();
        //    foreach (var sqlquery in sqlqueries)
        //    {
        //        var psql = sqlserverprovider.Syntax.GetSQLQuery(sqlquery.Select);
        //    }

        //    //var cs = ConfigurationManager.ConnectionStrings["Partner"];
        //    //var connection = new FbConnection(cs.ConnectionString);
      

        //    clientquery = clientqueries["Remaining"];

        //    dbquery = DbQuery.GetQueryByName(clientquery.QueryName);
        //    sqlqueries = dbquery.GetQueries(clientquery);

        //    var commandtext = Strings.ListToString(sqlqueries.Select(i => i.Text).ToList(), "\r\n");

        //    var result = appdat.GetDataAsync(clientquery,new GetDataOptions()).Result;

        //    var jsondata = System.IO.File.ReadAllText(path);
        //    DataSet dataSet = JsonConvert.DeserializeObject<DataSet>(jsondata);

        //    var reader = dataSet.CreateDataReader(dataSet.Tables.Cast<DataTable>().ToArray());

        //    var dd = GetDataDictionary(reader, sqlqueries);
        //    reader.Close();

        //    var json = JsonConvert.SerializeObject(dd);
        //}
        public void TestDBF()
        {
            var connection = new OleDbConnection(@"Provider=VFPOLEDB.1;Data Source=C:\My\Developement\DyntellSPA\docs\saga\");
            FreeFoxTable("intrari", connection);

            try
            {
                connection.Open();

            }
            catch (Exception ex)
            {
                ex.Data.Add("Connection", connection.ConnectionString);
                throw ex;
            }
            var sqlquery = new SqlQuery();
            sqlquery.Name = "";
            sqlquery.Text = "SELECT * FROM intrari";
            var sqlqueries = new List<SqlQuery>() { sqlquery };
            try
            {
                var result = this.GetDataDictionaryNormal(connection, sqlqueries);
            }
            catch (Exception ex)
            {
            }
            finally
            {
                if (connection.State == ConnectionState.Open)
                {
                    connection.Close();
                }
            }
        }

        private void FreeFoxTable(string cTableName, OleDbConnection connection)
        {
            string dataDIR = Path.GetDirectoryName(cTableName);
            string connString = connection.ConnectionString;
            string CDXFile = Path.ChangeExtension(cTableName, "CDX");
            OleDbConnection conn = new OleDbConnection(connString);
            OleDbCommand cmd = new OleDbCommand("EXECS([USE " + cTableName + "])", conn);
            conn.Open();
            try
            {
                // Use the table. If it's a member of a (missing) DBC we get
                // an error cannot open file .... <something>.dbc
                cmd.ExecuteNonQuery();
            }
            catch (Exception err)
            {
                if (err.Message.ToLower().Contains("cannot open file") && err.Message.ToLower().Contains("dbc"))
                {
                    // Free the DBF from the DBC container.
                    // We use the FoxPro command "FREE TABLE" to do this
                    // and execute it through the VFP OLE DB Provider
                    // usign the FoxPro EXECS() function.
                    cmd.CommandText = "EXECS([FREE TABLE " + cTableName + "])";
                    cmd.ExecuteNonQuery();
                    conn.Close();
                    conn.Dispose();
                    cmd.Dispose();
                }
            }
            // Delete any index file that may be associated with the table being checked.
            // This prevents a "variable not found" error opening the table if there happens
            // to be an index expression that uses long field names which may be no longer
            // valid since we removed the DBF from the DBC.
            if (File.Exists(CDXFile))
            {
                File.Delete(CDXFile);
            }
        }
    }


}