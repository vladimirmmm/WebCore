using ApiModel;
using ApiModel.Query;
using DataService.Models.Data;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;


namespace DataService.Models
{
    public class ServiceOptions
    {
        public string Domain { get; set; } = "";
        public string WebServiceIdentifier { get; set; } = "";
        public string Api_Token { get; set; } = "";
        public bool Debug { get; set; } = false;
        public Func<HttpClient> GetHttpClient = null;
    }
    public class AppDataService : IDataService
    {
        private readonly Random getrandom = new Random();

        private long _SessionId = -1;
        public long SessionId
        {
            get
            {
                if (_SessionId == -1)
                {
                    _SessionId = 8000 * DateTime.Now.Millisecond + getrandom.Next(0, 1000);
                }
                return _SessionId;
            }
        }

        public LogicCollection Logics;
        public const string DefaultConnectionName = "Partner";
        public Dictionary<string, TypedDataProvider> DataProviders = new Dictionary<string, TypedDataProvider>()
        {
        };
        private Dictionary<string, DbConnection> _ProviderConnections = new Dictionary<string, DbConnection>();
        public Dictionary<string, DbConnection> ProviderConnections
        {
            get { return _ProviderConnections; }
        }

        private Dictionary<string, Dictionary<string, DbQuery>> QueryContainer = new Dictionary<string, Dictionary<string, DbQuery>>();


        private string _Domain;
        public static object querylocker = new object();
        public static object querylocker2 = new object();

        private QueryService _QueryService = null;
        public QueryService GetQueryService()
        {
            if (_QueryService == null)
            {
                lock (querylocker2)
                {
                    if (_QueryService == null)
                    {

                        var qs = new QueryService(QueryContainer[""].ToDictionary(k => k.Key, v => v.Value));
                        var domainqueries = QueryContainer.ContainsKey(_Domain) ? QueryContainer[_Domain] : new Dictionary<string, DbQuery>();

                        foreach (var qkey in domainqueries.Keys)
                        {
                            qs.AddQuery(qkey, domainqueries[qkey]);
                        }
                        _QueryService = qs;
                    }
                }
            }
            return _QueryService;
        }
        public DbQuery GetQueryByName(string name)
        {
            var qs = GetQueryService();
            return qs.GetQueryByName(name);
            //var basequeries = QueryContainer[""];
            //var domainqueries = QueryContainer.ContainsKey(_Domain) ? QueryContainer[_Domain] : new Dictionary<string, DbQuery>();
            //if (domainqueries.ContainsKey(name)) {
            //    return domainqueries[name];
            //}
            //if (basequeries.ContainsKey(name))
            //{
            //    return basequeries[name];
            //}
            //return null;
        }
        public DbQuery GetQueryByTypeName(string typename)
        {
            var qs = GetQueryService();
            return qs.GetQueryByTypeName(typename);
        }
        private Dictionary<string, Dictionary<string, DbQuery>> GetQueries()
        {
            var result = new Dictionary<string, Dictionary<string, DbQuery>>();
            var dbquerypath = ServerApp.Current.MapPath(@"~/data/DbQueries.json");
            var maindbquery = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, DbQuery>>(System.IO.File.ReadAllText(dbquerypath));
            foreach (var dbquery in maindbquery.Values)
            {
                dbquery.Folder = ServerApp.Current.MapPath(@"~/data/sql/");
            }
            result.Add("", maindbquery);

            var customisationsfolder = ServerApp.Current.MapPath("~/Customisations/");
            if (System.IO.Directory.Exists(customisationsfolder))
            {
                var folders = System.IO.Directory.GetDirectories(customisationsfolder);


                foreach (var customisationfolder in folders)
                {
                    var customisationname = Path.GetFileName(customisationfolder).ToLower();
                    var querypath = Path.Combine(customisationfolder, "data/DbQueries-" + customisationname + ".json");
                    if (System.IO.File.Exists(querypath))
                    {
                        var domainqueries = new Dictionary<string, DbQuery>();
                        result.Add(customisationname.ToUpper(), domainqueries);
                        var dbqueries = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, DbQuery>>(System.IO.File.ReadAllText(querypath));
                        foreach (var key in dbqueries.Keys)
                        {
                            var dbquery = dbqueries[key];
                            dbquery.Folder = Path.Combine(customisationfolder, "data/sql/");
                            var query = dbqueries[key];
                            query.Domain = customisationname.ToUpper();
                            domainqueries.Add(key, query);
                            //if (result.ContainsKey(key))
                            //{
                            //    result[key] = dbqueries[key];
                            //}
                            //else
                            //{
                            //    result.Add(key, dbqueries[key]);
                            //}
                        }
                    }
                }
            }
            foreach (var domain in result.Keys)
            {
                foreach (var kv in result[domain])
                {
                    /*
                     I Integer
                     F Float
                     N decimal
                     M monetary amount (decimal)
                     D datetime
                     S string
                     U unknown
                     */
                    var query = kv.Value;
                    var queryfields = query.Fields.ToList();
                    foreach (var fieldkv in queryfields)
                    {
                        var physicalname = fieldkv.Value;
                        var logicalname = fieldkv.Key;
                        var colonix = logicalname.IndexOf(":");
                        if (colonix > -1)
                        {
                            var type = logicalname.Substring(0, colonix);
                            var rootlogicalname = logicalname.Substring(colonix + 1);
                            query.Fields.Remove(logicalname);
                            query.Fields.Add(rootlogicalname, physicalname);
                            query.FieldTypes.Add(rootlogicalname, type);
                        }
                        else
                        {
                            query.FieldTypes.Add(fieldkv.Key, "U");

                        }
                    }
                }
            }
            return result;
        }
        public Exception InitException = null;
        public AppDataService(ServiceOptions options)
        {
            try
            {
                _Domain = options.Domain;
                if (QueryContainer.Count == 0)
                {
                    lock (AppDataService.querylocker)
                    {
                        if (QueryContainer.Count == 0)
                        {
                            //DbQuery.SetQueries(GetQueries());
                            QueryContainer = GetQueries();
                        }
                    }
                }


                foreach (var key in DataProviders.Keys)
                {
                    var cskey = String.Format("{0}_{1}", _Domain, key);
                    var provider = DataProviders[key];
                    provider.SetQueryService(GetQueryService());
                    var cs1 = ServerApp.Current.GetConnectionString(cskey);
                    var cs2 = ServerApp.Current.GetConnectionString(key);
                    var cs = String.IsNullOrEmpty(cs1) ? cs2 : cs1;
                    DbConnection connection = null;
                    if (!String.IsNullOrEmpty(cs))
                    {
                        connection = provider.GetConnection(cs);
                    }

                    _ProviderConnections.Add(key, connection);
                }
            }
            catch (Exception ex)
            {
                InitException = ex;
            }
        }

        public void DataModified(string key = null)
        {
            if (ServerApp.Current.DataUpdated.ContainsKey(key))
            {
                ServerApp.Current.DataUpdated[key] = DateTime.Now;
            }
        }

        public Dictionary<string, Func<TypedDataProvider>> GetProviders()
        {
            return new Dictionary<string, Func<TypedDataProvider>>
            {
                ["mysql"] = () => { return new MySqlDataProvider(); },
                ["firebird"] = () => { return new FireBirdDataProvider(); },
                ["sqlserver"] = () => { return new SqlServerDataProvider(); }
            };
        }

        public void RegisterTypedDataProvider(string name, string typename, string connectionstring = "")
        {
            var providers = GetProviders();
            if (providers.ContainsKey(typename))
            {
                if (!DataProviders.ContainsKey(name))
                {
                    var provider = providers[typename]();
                    DataProviders.Add(name, provider);
                    provider.SetQueryService(GetQueryService());
                    DbConnection connection = null;
                    if (String.IsNullOrEmpty(connectionstring))
                    {
                        connectionstring = ServerApp.Current.GetConnectionString(this._Domain + "_" + name);
                    }
                    if (String.IsNullOrEmpty(connectionstring))
                    {
                        connectionstring = ServerApp.Current.GetConnectionString(name);
                    }
                    if (!String.IsNullOrEmpty(connectionstring))
                    {
                        connection = provider.GetConnection(connectionstring);
                    }

                    if (!_ProviderConnections.ContainsKey(name))
                    {
                        _ProviderConnections.Add(name, connection);
                    }
                }
            }
        }
        public void CloseConnections()
        {
            //varhttpclientfactory=HttpClient
            foreach (var key in ProviderConnections.Keys)
            {
                var connection = ProviderConnections[key];
                var provider = DataProviders[key];
                if (provider != null)
                {
                    //var context = new DbOptions();
                    //context.connection = connection;
                    var context = GetContextFor(connection);
                    provider.ClearConnectionInfo(context, null);
                }
                if (connection != null)
                {
                    if (connection.State != ConnectionState.Closed)
                    {

                        connection.Close();
                    }
                    //connection.Dispose();
                }



            }
        }
        private DataProvider GetProviderOf(DbConnection connection)
        {
            return DataProviders.FirstOrDefault(i => i.Value.ConnectionTypeName == connection.GetType().Name).Value;
        }
        public void EnsureOpenedConnection(DbConnection connection)
        {
            EnsureOpenedConnection(GetContextFor(connection));
        }
        public void EnsureOpenedConnection(DbOptions context)
        {
            if (context.connection != null)
            {
                var connection = context.connection;
                if (connection.State != ConnectionState.Open)
                {
                    connection.Open();
                    var provider = GetProviderOf(connection);
                    if (provider != null && context.UserId != -1)
                    {
                        provider.SetConnectionInfo(context, null);
                    }
                }
            }
        }
        public bool IsConnectionOK(Result result, string connectionname)
        {
            var isok = true;
            if (!DataProviders.ContainsKey(connectionname))
            {
                result.AddError(String.Format("Provider not found for connection {0}", connectionname));
            }
            if (ProviderConnections[connectionname] == null)
            {
                result.AddError(String.Format("ConnectionString {0} is not configured", connectionname));
            }
            return isok;
        }
        private static Dictionary<string, Dictionary<string, Dictionary<string, object>>> Credentials = new Dictionary<string, Dictionary<string, Dictionary<string, object>>>();
        private static Dictionary<string, Dictionary<string, Dictionary<string, object>>> WebshopCredentials = new Dictionary<string, Dictionary<string, Dictionary<string, object>>>();

        private static User WebshopUser;

        private static Object locker = new Object();
        public bool IsAuthenticated(Dictionary<string, object> credentials)
        {
            var result = false;
            var domain = GetDomain();
            var authbydomain = ServerApp.Current.AuthenticationByDomain.ContainsKey(domain) ? ServerApp.Current.AuthenticationByDomain[domain] : null;
            if (authbydomain == null)
            {
                return false;
            }
            var token = credentials.GetValueAsString("Token");
            if (!String.IsNullOrEmpty(token))
            {
                EnsureIdentifiers();
                var keycontainer = Credentials[domain];
                result = keycontainer.ContainsKey(token);
                if (result)
                {
                    var company = authbydomain.CompaniesByToken.ContainsKey(token) ? authbydomain.CompaniesByToken[token] : null;
                    if (company == null)
                    {
                        var user = authbydomain.UsersByToken.ContainsKey(token) ? authbydomain.UsersByToken[token] : null;
                        if (user != null)
                        {
                            SetUser(user);
                        }
                    }
                    else
                    {
                        SetUser(company);
                    }
                }
            }
            return result;
        }

        public bool IsWebshopAuthenticated(Dictionary<string, object> credentials)
        {
            var result = false;
            var domain = GetDomain();
            var authbydomain = ServerApp.Current.AuthenticationByDomain.ContainsKey(domain) ? ServerApp.Current.AuthenticationByDomain[domain] : null;
            if (authbydomain == null)
            {
                return false;
            }
            var token = credentials.GetValueAsString("Token");
            if (!String.IsNullOrEmpty(token))
            {
                EnsureIdentifiers();
                var keycontainer = WebshopCredentials[domain];
                result = keycontainer.ContainsKey(token);
                if (result)
                {
                    var company = authbydomain.CompaniesByToken.ContainsKey(token) ? authbydomain.CompaniesByToken[token] : null;
                    if (company == null)
                    {
                        var user = authbydomain.UsersByToken.ContainsKey(token) ? authbydomain.UsersByToken[token] : null;
                        if (user != null)
                        {
                            SetUser(user);

                        }
                    }
                    else
                    {
                        SetUser(company);
                    }
                }
            }
            return result;
        }
        public void LoadVoucherTypePermissions(Dictionary<string, List<Dictionary<string, object>>> permissions, TypedDataProvider provider)
        {
            var querystr = "select * from GET_ACCESSIBLE_VOUCHERTYPES";
            var connection = GetConnectionForProvider(provider);
            var p_vt_data = provider.GetData(querystr, connection);
            permissions.Add("VoucherType", p_vt_data);
        }

        public void LoadCompanyGroupPermissions(Dictionary<string, List<Dictionary<string, object>>> permissions, TypedDataProvider provider)
        {
            var querystr = "select * from GET_ACCESSIBLE_COMPANYGROUPS";
            var connection = GetConnectionForProvider(provider);
            var p_c_data = provider.GetData(querystr, connection);
            permissions.Add("CompanyGroups", p_c_data);
        }
        private DbOptions GetContextFor(DbConnection connection, long userid = -1)
        {
            var context = new DbOptions();
            context.connection = connection;
            if (userid != -1)
            {
                context.UserId = userid;
            }
            else
            {
                var user = GetUser();
                if (user != null && !String.IsNullOrEmpty(user.ID))
                {
                    long xuserid = -1;
                    long.TryParse(user.ID, out xuserid);
                    context.UserId = xuserid;//-1
                }
            }
            context.SessionId = SessionId;
            return context;
        }
        public async void LoadPermissions(Dictionary<string, object> authobj)
        {
            var provider = GetProvider("Voucher");
            var connection = GetConnectionForProvider(provider);
            var records = new List<Dictionary<string, object>>();
            var result = Result.SuccessWithModel(records);
            EnsureOpenedConnection(GetContextFor(connection));
            var domain = GetDomain();
            var authbydomain = ServerApp.Current.AuthenticationByDomain.ContainsKey(domain) ? ServerApp.Current.AuthenticationByDomain[domain] : null;
            if (authbydomain == null)
            {
                return;
            }
            User u = null;
            var authid = authobj.GetValueAsString("Id");

            if (authobj.GetValueAsString("TypeName") == "Company")
            {
                var company = authbydomain.CompaniesById.ContainsKey(authid) ? authbydomain.CompaniesById[authid] : null;
                //ServerApp.Current.Companies.Values.FirstOrDefault(i => i.ID == authobj.GetValueAsString("Id"));
                if (company != null && !String.IsNullOrEmpty(company.User.ID))
                {
                    u = company.User;
                }
            }
            else
            {
                var user = authbydomain.UsersById.ContainsKey(authid) ? authbydomain.UsersById[authid] : null;
                if (user != null)
                {
                    u = user;
                }
            }
            DataCommand cncommand = null;
            if (u != null)
            {
                //cncommand = await provider.SetConnectionInfo(connection, null, result, long.Parse(u.ID));

                var permissions = new Dictionary<string, List<Dictionary<string, object>>>();
                u.Permissions = permissions;
                if (!authobj.ContainsKey("Permissions"))
                {
                    authobj.Add("Permissions", permissions);
                }
                authobj["Permissions"] = permissions;

                LoadVoucherTypePermissions(permissions, provider);
                LoadCompanyGroupPermissions(permissions, provider);

                //if (cncommand != null)
                //{
                //    var cnclearcommand = await provider.ClearConnectionInfo(connection, null, cncommand, result);
                //}
            }
        }

        public Result<List<Dictionary<string, object>>> Authenticate(Dictionary<string, string> credentials)
        {
            var result = new Dictionary<string, object>();
            EnsureIdentifiers();
            var wsid = credentials != null ? credentials.GetValueAsString("WebServiceIdentifier") : "";
            var username = credentials != null ? credentials.GetValueAsString("UserName") : "";
            var password = credentials != null ? credentials.GetValueAsString("Password") : "";
            var encryptedpassword = PWEncryptor.EncryptPassword(password, "pannonszoftver");
            var keycontainer = Credentials[GetDomain()];
            var authresult = new Result<List<Dictionary<string, object>>>();
            authresult.Model = new List<Dictionary<string, object>>();
            if (!String.IsNullOrEmpty(password))
            {
                var user = keycontainer.Values.FirstOrDefault(i => i.GetValueAsString("UserName") == username);
                if (user != null)
                {
                    if (encryptedpassword == String.Format("{0}", user["Passwd"]))
                    {
                        var xuser = ParseJsonTo<Dictionary<string, object>>(ToJson(user));
                        xuser.Remove("Passwd");
                        authresult.Model.Add(xuser);
                    }
                    else
                    {
                        authresult.Errors.Add(new Exception("IncorrectPassword"));
                        return authresult;
                    }
                }
                else
                {
                    authresult.Errors.Add(new Exception("IncorrectUserName"));
                    return authresult;
                }
            }
            else
            {
                var obj = keycontainer.Values.FirstOrDefault(i => i.GetValueAsString("WebserviceIdentifier") == wsid);
                if (obj != null)
                {
                    authresult.Model.Add(obj);
                }
                else
                {
                    authresult.Errors.Add(new Exception("Incorrect WebServiceIdentifier"));
                }
            }
            if (authresult.Errors.Count == 0)
            {
                var authobj = authresult.Model.FirstOrDefault();

                var domain = GetDomain();
                var authbydomain = ServerApp.Current.AuthenticationByDomain.ContainsKey(domain) ? ServerApp.Current.AuthenticationByDomain[domain] : null;

                var id = authobj.GetValueAsString("Id");

                var company = authbydomain.CompaniesById.ContainsKey(id) ? authbydomain.CompaniesById[id] : null;
                if (company == null)
                {
                    var user = authbydomain.UsersById.ContainsKey(id) ? authbydomain.UsersById[id] : null;
                    if (user != null)
                    {
                        SetUser(user);
                    }
                }
                else
                {
                    SetUser(company);
                }

                LoadPermissions(authobj);
            }
            return authresult;
        }

        public async Task<Result<List<Dictionary<string, object>>>> AuthenticateCompanyWebshop(Dictionary<string, string> credentials)
        {
            var result = new Dictionary<string, object>();
            EnsureIdentifiers();
            var wsid = credentials != null ? credentials.GetValueAsString("WebServiceIdentifier") : "";
            var username = credentials != null ? credentials.GetValueAsString("UserName") : "";
            var email = credentials != null ? credentials.GetValueAsString("Email") : "";
            var password = credentials != null ? credentials.GetValueAsString("Password") : "";
            var encryptedpassword = PWEncryptor.EncryptPassword(password, "pannonszoftver");
            var keycontainer = WebshopCredentials[GetDomain()];
            var authresult = new Result<List<Dictionary<string, object>>>();
            authresult.Model = new List<Dictionary<string, object>>();

            Dictionary<string, object> company;
            bool iswsid = !String.IsNullOrEmpty(wsid);
            if (iswsid)
            {
                company = keycontainer.Values.FirstOrDefault(i => i.GetValueAsString("WebserviceIdentifier") == wsid);
            }
            else
            {
                company = keycontainer.Values.FirstOrDefault(i => i.GetValueAsString("WebshopUsername") == username || i.GetValueAsString("Email") == email);
            }
            if (company != null)
            {
                bool iscorrect = iswsid ? true : encryptedpassword == String.Format("{0}", company["WebshopPassword"]);
                if (iscorrect)
                {
                    var responsecompany = ParseJsonTo<Dictionary<string, object>>(ToJson(company));
                    responsecompany.Remove("WebshopPassword");
                    responsecompany.Remove("WebserviceIdentifier");

                    var partnerconnection = GetConnectionForTypeName("Company");
                    var partnerprovider = GetProvider("Company");
                    DbOptions options = GetContextFor(partnerconnection, 1);
                    Result<List<Dictionary<string, object>>> dbresult = new Result<List<Dictionary<string, object>>>();

                    authresult.Model.Add(responsecompany);

                    try
                    {
                        partnerconnection.Open();
                        await partnerprovider.SetConnectionInfo(options, dbresult);
                        if (dbresult.Errors.Count == 0)
                        {
                            var companyData = await partnerprovider.GetDataAsync(string.Format("SELECT ID as Id, CITY as City, ID_COUNTY as CountyId, ID_COUNTRY as CountryId, EMAIL as Email," +
                                "EU_TAX_NUMBER as EuTaxNumber, ID_DEFAULT_TRANSPORT_MODE as DefaultTransportModeId, ID_EMPLOYEE as EmployeeId, ID_ORIG_DOMICILE as OrigDomicileId," +
                                "GROUP_IDENTIFIER as GroupIdentifier, IDENTIFIER as Identifier, ID_TRANSPORT_CONDITION as TransportConditionId, IS_PERSON as IsPerson, NAME as Name," +
                                "PERSONAL_NUMBER as PersonalNumber, POSTALCODE as Postalcode, STREET_ADDRESS as StreetAddress, STREET_NUMBER as StreetNumber, TAX_IDENT_NUMBER as TaxIdentNumber," +
                                "TAX_NUMBER as TaxNumber, TELEPHONE as Telephone " +
                                " FROM COMPANY WHERE Id = '{0}'", responsecompany["Id"]), partnerconnection, null, false, null);

                            var addressData = await partnerprovider.GetDataAsync(string.Format("SELECT BUILDING as Building, CITY as City, DOOR as Door, EMAIL as Email, FLOOR as Floor, ID as Id," +
                                "IDENTIFIER as Identifier, ID_ADDRESS_GROUP as AddressGroupId, ID_ADDRESS_TYPE as AddressTypeId, ID_COMPANY as CompanyId, ID_COUNTRY as CountryId, ID_COUNTY as CountyId," +
                                "ID_SELLER as SellerId, NAME as Name, POSTALCODE as Postalcode, STAIRCASE as Staircase, STREET_ADDRESS as StreetAddress, STREET_NUMBER as StreetNumber " +
                                "FROM COMPANY_ADDRESS WHERE ID_COMPANY = '{0}'", responsecompany["Id"]), partnerconnection, null, false, null);
                            if (companyData.Count > 0)
                            {
                                authresult.Model.AddRange(companyData);
                            }
                            if (addressData.Count > 0)
                            {
                                authresult.Model.AddRange(addressData);
                            }
                        }

                    }
                    finally
                    {
                        await partnerprovider.ClearConnectionInfo(options, dbresult);
                        partnerconnection.Close();
                    }
                }
                else
                {
                    authresult.Errors.Add(new Exception("IncorrectPassword"));
                    return authresult;
                }
            }
            else
            {
                authresult.Errors.Add(new Exception(iswsid ? "Incorrect WebServiceIdentifier" : "IncorrectPassword"));
                return authresult;
            }
            if (authresult.Errors.Count == 0)
            {
                var authobj = authresult.Model.FirstOrDefault();

                var domain = GetDomain();
                var authbydomain = ServerApp.Current.AuthenticationByDomain.ContainsKey(domain) ? ServerApp.Current.AuthenticationByDomain[domain] : null;

                var id = authobj.GetValueAsString("Id");

                var company2 = authbydomain?.CompaniesById.ContainsKey(id) == true ? authbydomain.CompaniesById[id] : null;
                if (company2 == null)
                {
                    var user = authbydomain?.UsersById.ContainsKey(id) == true ? authbydomain.UsersById[id] : null;
                    if (user != null)
                    {
                        SetUser(user);
                    }
                }
                else
                {
                    SetUser(company2);
                }

                LoadPermissions(authobj);
            }
            return authresult;
        }

        public async Task<Result<bool>> RegisterCompanyWebshop(Dictionary<string, string> credentials)
        {
            var username = credentials != null ? credentials.GetValueAsString("UserName") : "";
            var password = credentials != null ? credentials.GetValueAsString("Password") : "";
            var email = credentials != null ? credentials.GetValueAsString("Email") : "";
            var companyName = credentials != null ? credentials.GetValueAsString("Name") : "";
            var city = credentials != null ? credentials.GetValueAsString("City") : "";
            var streetAddress = credentials != null ? credentials.GetValueAsString("StreetAddress") : "";
            var telephone = credentials != null ? credentials.GetValueAsString("Telephone") : "";
            var webshopbaselink = credentials != null ? credentials.GetValueAsString("BaseLink") : "";
            var encryptedpassword = PWEncryptor.EncryptPassword(password, "pannonszoftver");

            if (String.IsNullOrEmpty(username) || String.IsNullOrEmpty(password) || String.IsNullOrEmpty(email))
            {
                var result = new Result<bool>();
                result.Model = false;
                result.Errors.Add(new Exception("Missing Email/Username/Password!"));
                return result;
            }

            EnsureIdentifiers();
            var partnerconnection = GetConnectionForTypeName("Company");
            var partnerprovider = GetProvider("Company");
            var appconnection = GetConnectionForTypeName("RegisterWebshopCompany");
            var appprovider = GetProvider("RegisterWebshopCompany");

            DbOptions options = GetContextFor(partnerconnection, 1);
            Result<List<Dictionary<string, object>>> dbresult = new Result<List<Dictionary<string, object>>>();

            Result<StandardDictionary> insertHash = null;
            Result<StandardDictionary> insertcompany = null;
            Result<StringObject> mailresponse = null;
            var errors = new List<Exception>();

            DbTransaction partnertransaction = null;
            DbTransaction apptransaction = null;
            try
            {
                partnerconnection.Open();
                appconnection.Open();
                await partnerprovider.SetConnectionInfo(options, dbresult);
                if (dbresult.Errors.Count == 0)
                {
                    var duplicates = await partnerprovider.GetDataAsync(string.Format("SELECT WEBSHOP_USERNAME, EMAIL FROM COMPANY WHERE WEBSHOP_USERNAME = '{0}' OR EMAIL = '{1}'", username, email), partnerconnection, null, false, null);
                    if (duplicates.Count > 0)
                    {
                        foreach (var d in duplicates)
                        {
                            if (d.ContainsKey("EMAIL") && email.Equals(d.GetValue("EMAIL")))
                            {
                                errors.Add(new Exception("Duplicate email!"));
                                break;
                            }
                            else if (d.ContainsKey("WEBSHOP_USERNAME") && username.Equals(d.GetValue("WEBSHOP_USERNAME")))
                            {
                                errors.Add(new Exception("Duplicate username!"));
                                break;
                            }
                        }
                    }
                    else
                    {
                        var company = new Dictionary<string, object>();
                        company["WebshopUsername"] = username;
                        company["WebshopPassword"] = encryptedpassword;
                        company["Email"] = email;
                        company["Name"] = companyName;
                        company["PriceTypeId"] = Convert.ToInt64(1102);
                        company["PaymentMethodId"] = Convert.ToInt64(4);
                        company["CountryId"] = 1;
                        company["IsPerson"] = 1;
                        company["Dissolved"] = 0;
                        company["IsActive"] = 0;
                        //company["TaxIdentNumber"] = "Companygroup";
                        //company["VatPayer"] = "Companygroup";
                        company["City"] = city;
                        company["StreetAddress"] = streetAddress;
                        company["Telephone"] = telephone;
                        company["TypeName"] = "Company";

                        var companygroups = new List<Dictionary<string, object>>();
                        company["Companygroups"] = companygroups;
                        var companygroup = new Dictionary<string, object>();
                        companygroups.Add(companygroup);
                        companygroup["TypeName"] = "Companygroup";
                        companygroup["Id"] = Convert.ToInt64(2);
                        companygroup["PriceTypeId"] = company["PriceTypeId"];
                        companygroup["PaymentMethodId"] = company["PaymentMethodId"];

                        var command = DataCommand.Create(company, CommandName.INSERT, "WebshopInsertCompany");

                        partnertransaction = partnerconnection.BeginTransaction();

                        insertcompany = await partnerprovider.ExecuteCommandAsync(command, partnerconnection, partnertransaction);
                        if (insertcompany.Errors.Count == 0)
                        {
                            var cid = -1L;
                            long.TryParse((string)insertcompany.Model["Value"], out cid);
                            var registerWebshopCompany = new Dictionary<string, object>();
                            registerWebshopCompany["CompanyId"] = cid;
                            registerWebshopCompany["Date"] = DateTime.Now;
                            registerWebshopCompany["Hash"] = new Random().Next().GetHashCode();

                            command = DataCommand.Create(registerWebshopCompany, CommandName.INSERT, "RegisterWebshopCompany");

                            apptransaction = appconnection.BeginTransaction();

                            insertHash = await appprovider.ExecuteCommandAsync(command, appconnection, apptransaction);
                            if (insertHash.Errors.Count == 0)
                            {
                                var subject = "Email verification test";
                                var link = String.Format("{0}/Auth/Verify/Hash:{1}", webshopbaselink.EndsWith("/") ? webshopbaselink.Substring(0, webshopbaselink.Length - 1) : webshopbaselink, registerWebshopCompany["Hash"]);
                                var emailbody = String.Format("<div><h2>Email verification</h2><div><a href='{0}'>Click to verify</a></div></div>", link);

                                EmailMessage emailMessage = new EmailMessage();
                                emailMessage.To.Add(email);
                                emailMessage.Subject = subject;
                                emailMessage.Body = emailbody;
                                mailresponse = SendMail(emailMessage);

                                if (mailresponse.Errors.Count == 0)
                                {
                                    var errorResult2 = new Result<bool>();
                                    try
                                    {
                                        partnertransaction.Commit();
                                        apptransaction.Commit();
                                    }
                                    catch (Exception ex)
                                    {
                                        partnertransaction.Rollback();
                                        apptransaction.Rollback();
                                        errorResult2.AddError(ex);
                                        errorResult2.Model = false;
                                        return errorResult2;
                                    }
                                }
                                return Result.SuccessWithModel(true);
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                partnertransaction?.Rollback();
                apptransaction?.Rollback();
            }
            finally
            {
                await partnerprovider.ClearConnectionInfo(options, dbresult);
                appconnection.Close();
                partnerconnection.Close();
            }

            var errorResult = new Result<bool>();
            if (insertcompany != null)
            {
                errorResult.Errors.AddRange(insertcompany.Errors);
            }
            if (insertHash != null)
            {
                errorResult.Errors.AddRange(insertHash.Errors);
            }
            if (mailresponse != null)
            {
                errorResult.Errors.AddRange(mailresponse.Errors);
            }
            errorResult.Errors.AddRange(errors);
            if (errorResult.Errors.Count == 0)
            {
                errorResult.Errors.Add(new Exception("Unidentified error!"));
            }
            errorResult.Model = false;
            return errorResult;
        }

        public Dictionary<string, object> getWebshopCredentials(string token)
        {
            return WebshopCredentials[GetDomain()][token];
        }

        public async Task<Result<bool>> ValidateCompanyWebshop(string hash)
        {
            var registerWebshopCompany = new Dictionary<string, object>();
            registerWebshopCompany["Hash"] = hash;

            var appconnection = GetConnectionForTypeName("RegisterWebshopCompany");
            var appprovider = GetProvider("RegisterWebshopCompany");
            try
            {
                appconnection.Open();

                var selcommand = DataCommand.Create(registerWebshopCompany, CommandName.SELECT, "RegisterWebshopCompany");
                var selhash = await appprovider.ExecuteCommandAsync(selcommand, appconnection, null);
                if (selhash.Errors.Count == 0 && !string.IsNullOrEmpty(selhash.Model.FirstOrDefault().Value as string))
                {
                    var apptransaction = appconnection.BeginTransaction();
                    var delcommand = DataCommand.Create(registerWebshopCompany, CommandName.DELETE, "RegisterWebshopCompany");
                    var delhash = await appprovider.ExecuteCommandAsync(delcommand, appconnection, apptransaction);
                    if (delhash.Errors.Count == 0)
                    {
                        apptransaction.Commit();

                        var selhash2 = await appprovider.ExecuteCommandAsync(selcommand, appconnection, null);
                        if (selhash2.Errors.Count == 0 && string.IsNullOrEmpty(selhash2.Model.FirstOrDefault().Value as string))
                        {
                            return Result.SuccessWithModel(true);
                        }
                        else
                        {
                            return Result.SuccessWithModel(false);
                        }
                    }
                    else
                    {
                        var model = Result.SuccessWithModel(false);
                        model.Errors.AddRange(delhash.Errors);
                        apptransaction.Rollback();
                        return model;
                    }
                }
                return Result.SuccessWithModel(false);
            }
            catch (Exception ex)
            {
                var model = Result.SuccessWithModel(false);
                model.Errors.Add(ex);
                return model;
            }
            finally
            {
                appconnection.Close();
            }
        }

        private void EnsureIdentifiers()
        {
            var domain = GetDomain();

            Func<bool> shouldload = () =>
            {
                if (!Credentials.ContainsKey(domain))
                {
                    return true;
                }
                var keycontainer = Credentials[domain];
                if (keycontainer.Count == 0)
                {
                    return true;
                }
                return false;
            };
            if (shouldload())
            {
                lock (locker)
                {
                    if (shouldload())
                    {
                        if (!ServerApp.Current.AuthenticationByDomain.ContainsKey(domain))
                        {
                            ServerApp.Current.AuthenticationByDomain.Add(domain, new AuthenticationContainer());
                        }
                        var provider = GetProvider("Company");
                        var connection = GetConnectionForProvider(provider);
                        var options = GetContextFor(connection, 1);
                        EnsureOpenedConnection(connection);
                        provider.SetConnectionInfo(options, null);

                        LoadCompanies();
                        LoadWebshopCompanies();
                        LoadUsersByWSID();
                        LoadUsers();

                        provider.ClearConnectionInfo(options, null);
                        CloseConnections();

                    }
                }
            }
        }
        private void LoadCompanies()
        {
            var query = new ClientQuery();
            query.QueryName = "Company";
            query.SetField("*");
            query.SetField("WebServiceUser.Id");
            query.SetField("WebServiceUser.EmployeeId");
            query.SetField("WebServiceUser.Email");
            query.SetField("WebServiceUser.UserName");
            query.SetField("WebServiceUser.FullName");
            query.SetField("Companygroups.*");
            query.Skip = 0;
            query.Take = null;
            var filter = new QueryFilter();
            filter.Field = "WebserviceIdentifier";
            filter.Operator = "IS NOT";
            filter.Type = "string";
            filter.Values = new List<string>() { "{NULL}" };
            query.Filters.Add(filter);
            query.Compress = false;
            var provider = GetProvider("Company");
            var connection = GetConnectionForProvider(provider);
            //EnsureOpenedConnection(GetContextFor(connection));

            //var identifierobjects = this._data.GetQueryResult(query, out commandtext);
            var identifierobjects = provider.GetData(query, connection, null);

            var hs = new Dictionary<string, Dictionary<string, object>>();

            if (identifierobjects.Errors.Count > 0)
            {
                //throw new ApiModel.DataException("Can't retrieve identifierobjects", identifierobjects.Errors);
            }
            else
            {
                foreach (var identifierobject in identifierobjects.Model)
                {
                    identifierobject.Add("API_Token", "");
                    identifierobject.Add("API_TokenDate", null);
                    var token = String.Format("{0}", Guid.NewGuid());
                    identifierobject.Add("Token", token);
                    Company company = CreateCompany(identifierobject);
                    SetUser(company);

                    hs.Add(token, company);
                }
            }
            var domain = GetDomain();
            if (!Credentials.ContainsKey(domain))
            {
                Credentials.Add(domain, hs);
            }
            Credentials[domain] = hs;
        }

        private void LoadWebshopCompanies()
        {
            if (ServerApp.Current.Settings?.IsWebshop == false)
            {
                return;
            }
            var companyquery = new ClientQuery();
            companyquery.QueryName = "WebshopCompany";
            companyquery.SetField("*");
            companyquery.Skip = 0;
            companyquery.Take = null;
            var filter1 = new QueryFilter();
            filter1.Field = "WebserviceIdentifier";
            filter1.Operator = "IS NOT";
            filter1.Type = "string";
            filter1.Values = new List<string>() { "{NULL}" };

            var filter2 = new QueryFilter();
            filter2.Field = "WebshopPassword";
            filter2.Operator = "IS NOT";
            filter2.Type = "string";
            filter2.Values = new List<string>() { "{NULL}" };

            var filteror = new QueryFilter();
            filteror.Field = "Id";
            filteror.Operator = "OR";
            filteror.Type = "number";
            filteror.Children.Add(filter1);
            filteror.Children.Add(filter2);

            companyquery.Filters.Add(filteror);
            companyquery.Compress = false;
            companyquery.Ordering.Add("Id", "ASC");
            var provider = GetProvider("Company");

            var connection = GetConnectionForProvider(provider);
            var identifierobjects = provider.GetData(companyquery, connection, null);
            try
            {
                var webshopuserquery = new ClientQuery();
                webshopuserquery.QueryName = "Company";
                webshopuserquery.SetField("*");
                webshopuserquery.Skip = 0;
                webshopuserquery.Take = null;
                var wsqfilter = new QueryFilter();
                wsqfilter.Field = "WebserviceIdentifier";
                wsqfilter.Operator = "=";
                wsqfilter.Type = "string";
                wsqfilter.Values = new List<string>() { ServerApp.Current.Settings.WebshopUserWsid };
                webshopuserquery.Compress = false;
                webshopuserquery.Ordering.Add("Id", "ASC");
                webshopuserquery.SetFilter(wsqfilter);

                var wsqresponse = provider.GetData(webshopuserquery, connection, null);

                var webshopuserId = wsqresponse.Model.FirstOrDefault()["WebserviceUserId"];
                var wuserQuery = new ClientQuery();
                wuserQuery.QueryName = "Users";
                wuserQuery.SetField("Id");
                wuserQuery.SetField("Passwd");
                wuserQuery.SetField("UserName");
                wuserQuery.SetField("EmployeeId");
                wuserQuery.SetField("FullName");
                wuserQuery.SetField("Email");
                wuserQuery.SetField("CompanyId");
                wuserQuery.SetField("UserRoleId");
                wuserQuery.SetField("GroupId");
                wuserQuery.Skip = 0;
                wuserQuery.Take = null;
                var wsufilter = new QueryFilter();
                wsufilter.Field = "Id";
                wsufilter.Operator = "=";
                wsufilter.Type = "number";
                wsufilter.Values = new List<string>() { webshopuserId.ToString() };
                wuserQuery.Compress = false;
                wuserQuery.Ordering.Add("Id", "ASC");
                wuserQuery.SetFilter(wsufilter);
                var wsuresponse = provider.GetData(wuserQuery, connection, null);
                WebshopUser = CreateUser(wsuresponse.Model.FirstOrDefault());
            }
            catch
            {

            }
            var hs = new Dictionary<string, Dictionary<string, object>>();

            if (identifierobjects.Errors.Count > 0)
            {
                //throw new ApiModel.DataException("Can't retrieve identifierobjects", identifierobjects.Errors);
            }
            else
            {
                var registerquery = new ClientQuery();
                registerquery.QueryName = "RegisterWebshopCompany";
                registerquery.SetField("Id");
                registerquery.SetField("CompanyId");
                registerquery.SetField("Date");
                registerquery.SetField("Hash");
                registerquery.Skip = 0;
                registerquery.Take = null;

                var provider2 = GetProvider("RegisterWebshopCompany");
                var connection2 = GetConnectionForProvider(provider2);
                try
                {
                    connection2.Open();

                    var RegisterWebshopCompanys = provider2.GetData(registerquery, connection2, null);

                    if (RegisterWebshopCompanys.Errors.Count > 0)
                    {
                        //throw new ApiModel.DataException("Can't retrieve identifierobjects", identifierobjects.Errors);
                    }
                    else
                    {
                        foreach (var identifierobject in identifierobjects.Model)
                        {
                            var id = identifierobject["Id"] as int?;
                            var regobj = RegisterWebshopCompanys.Model.FirstOrDefault(f => int.Parse("" + f["1"]) == id);
                            if (regobj != null)
                            {
                                continue;
                            }

                            identifierobject.Add("API_Token", "");
                            identifierobject.Add("API_TokenDate", null);
                            var token = String.Format("{0}", Guid.NewGuid());
                            identifierobject.Add("Token", token);
                            Company company = CreateCompany(identifierobject);
                            SetUser(company);

                            hs.Add(token, company);
                        }
                    }
                }
                finally
                {
                    connection2.Close();
                }
            }
            var domain = GetDomain();
            if (!WebshopCredentials.ContainsKey(domain))
            {
                WebshopCredentials.Add(domain, hs);
            }
            WebshopCredentials[domain] = hs;
        }
        private void LoadUsers()
        {
            var query = new ClientQuery();
            query.QueryName = "Users";
            query.SetField("Id");
            query.SetField("Passwd");
            query.SetField("UserName");
            query.SetField("EmployeeId");
            query.SetField("FullName");
            query.SetField("Email");
            query.SetField("CompanyId");
            query.SetField("UserRoleId");
            query.SetField("GroupId");
            query.Skip = 0;
            query.Take = null;
            var filter = new QueryFilter();
            filter.Field = "Passwd";
            filter.Operator = "IS NOT";
            filter.Type = "string";
            filter.Values = new List<string>() { "{NULL}" };
            query.Filters.Add(filter);
            query.Compress = false;

            var provider = GetProvider("Users");
            var connection = GetConnectionForProvider(provider);
            //EnsureOpenedConnection(GetContextFor(connection));

            //var identifierobjects = this._data.GetQueryResult(query, out commandtext);
            var identifierobjects = provider.GetData(query, connection, null);
            //connection.Close();
            if (identifierobjects.Errors.Count > 0)
            {
                throw new ApiModel.DataException("Can't retrieve identifierobjects", identifierobjects.Errors);
            }
            else
            {
                var domain = GetDomain();
                if (!Credentials.ContainsKey(domain))
                {
                    Credentials.Add(domain, new Dictionary<string, Dictionary<string, object>>());
                }
                var hs = new Dictionary<string, Dictionary<string, object>>();

                foreach (var identifierobject in identifierobjects.Model)
                {
                    var token = String.Format("{0}", Guid.NewGuid());
                    identifierobject.Add("Token", token);
                    User user = CreateUser(identifierobject);
                    //appdataservice.SetUser(user);
                    Credentials[domain].Add(token, identifierobject);
                }


            }
        }
        private void LoadUsersByWSID()
        {
            var query = new ClientQuery();
            query.QueryName = "Users";
            query.SetField("Id");
            query.SetField("WebserviceIdentifier");
            query.SetField("Passwd");
            query.SetField("UserName");
            query.SetField("EmployeeId");
            query.SetField("FullName");
            query.SetField("Email");
            query.SetField("CompanyId");
            query.SetField("UserRoleId");
            query.SetField("GroupId");
            query.Skip = 0;
            query.Take = null;
            var filter = new QueryFilter();
            filter.Field = "WebserviceIdentifier";
            filter.Operator = "IS NOT";
            filter.Type = "string";
            filter.Values = new List<string>() { "{NULL}" };
            query.Filters.Add(filter);
            query.Compress = false;

            var provider = GetProvider("Users");
            var connection = GetConnectionForProvider(provider);
            //EnsureOpenedConnection(GetContextFor(connection));

            //var identifierobjects = this._data.GetQueryResult(query, out commandtext);
            var identifierobjects = provider.GetData(query, connection, null);
            //connection.Close();
            if (identifierobjects.Errors.Count > 0)
            {
                //throw new ApiModel.DataException("Can't retrieve identifierobjects", identifierobjects.Errors);
            }
            else
            {
                var domain = GetDomain();
                if (!Credentials.ContainsKey(domain))
                {
                    Credentials.Add(domain, new Dictionary<string, Dictionary<string, object>>());
                }
                var hs = new Dictionary<string, Dictionary<string, object>>();

                foreach (var identifierobject in identifierobjects.Model)
                {
                    var token = String.Format("{0}", Guid.NewGuid());
                    identifierobject.Add("Token", token);
                    User user = CreateUser(identifierobject);
                    //appdataservice.SetUser(user);
                    Credentials[domain].Add(token, identifierobject);
                }


            }
        }
        public string GetConnectionName(string connectionname)
        {
            if (String.IsNullOrEmpty(connectionname))
            {
                connectionname = DefaultConnectionName;
            }
            return connectionname;
        }
        public async Task<Result<List<Dictionary<string, object>>>> GetDataAsync(string sqlquery, string connectionname)
        {
            var result = new Result<List<Dictionary<string, object>>>();
            if (!ServerApp.Current.Settings.AllowFullSQL)
            {
                if (Regex.Match(sqlquery.ToLower(), @"\b(insert|update|delete|drop|create|recreate|alter)\b").Length > 0)
                {
                    result.AddError("Command Not allowed");
                    return result;
                }
            }

            connectionname = GetConnectionName(connectionname);
            if (!IsConnectionOK(result, connectionname))
            {
                return result;
            }
            TypedDataProvider provider = DataProviders[connectionname];

            var connection = ProviderConnections[connectionname];
            try
            {
                EnsureOpenedConnection(GetContextFor(connection));
                long userid = 1;
                var user = GetUser();
                if (user != null && !String.IsNullOrEmpty(user.ID))
                {
                    long.TryParse(user.ID, out userid);
                }
                //cmcon = await provider.SetConnectionInfo(connection, null, result, userid);

                result.Model = await provider.GetDataAsync(sqlquery, connection);


            }
            catch (Exception ex)
            {
                result.AddError(ex);
            }
            finally
            {
                //if (cmcon != null) 
                //{
                //    var cmconend = await provider.ClearConnectionInfo(connection, null, cmcon, result);
                //}
                var options = new DbOptions();
                options.connection = connection;
                options.SessionId = SessionId;
                options.UserId = GetUserId();
                try
                {
                    provider.ClearConnectionInfo(options, null);
                }
                catch (Exception ex)
                {

                }
                connection.Close();
            }
            result.ViewData.Add("CommandText", sqlquery);
            return result;
        }
        public async Task<Result<List<Dictionary<string, object>>>> GetDataAsync(ClientQuery clientquery, DbOptions options)
        {
            var result = new Result<List<Dictionary<string, object>>>();

            var query = _QueryService.GetQueryByName(clientquery.QueryName);

            if (query == null)
            {
                result.AddError(String.Format("Query {0} is not Defined", clientquery.QueryName));
                return result;
            }
            var connectionname = GetConnectionName(query.ConnectionName);
            if (!IsConnectionOK(result, connectionname))
            {
                return result;
            }
            TypedDataProvider provider = DataProviders[connectionname];
            var connection = ProviderConnections[connectionname];


            try
            {
                var qoptions = new DbOptions();
                qoptions.results = options.results;
                qoptions.connection = connection;
                qoptions.transaction = options.transaction;
                qoptions.UserId = GetUserId();

                qoptions.SessionId = SessionId;
                EnsureOpenedConnection(qoptions);
                result = await provider.GetDataAsync(clientquery, qoptions);

            }
            catch (Exception ex)
            {
                result.AddError(ex);
            }
            return result;
        }

        public async Task<Result<List<Dictionary<string, object>>>> WebshopGetDataAsync(ClientQuery clientquery, DbOptions options)
        {
            var result = new Result<List<Dictionary<string, object>>>();

            var query = _QueryService.GetQueryByName(clientquery.QueryName);

            if (query == null)
            {
                result.AddError(String.Format("Query {0} is not Defined", clientquery.QueryName));
                return result;
            }
            var connectionname = GetConnectionName(query.ConnectionName);
            if (!IsConnectionOK(result, connectionname))
            {
                return result;
            }
            TypedDataProvider provider = DataProviders[connectionname];
            var connection = ProviderConnections[connectionname];


            try
            {
                var qoptions = new DbOptions();
                qoptions.results = options.results;
                qoptions.connection = connection;
                qoptions.transaction = options.transaction;
                qoptions.UserId = options.UserId;

                qoptions.SessionId = SessionId;
                EnsureOpenedConnection(qoptions);
                result = await provider.GetDataAsync(clientquery, qoptions);

            }
            catch (Exception ex)
            {
                result.AddError(ex);
            }
            return result;
        }

        public async Task<Result<List<Dictionary<string, object>>>> GetDataAsync(SelectStatement selectstatement, string connectionname)
        {
            var result = new Result<List<Dictionary<string, object>>>();

            connectionname = GetConnectionName(connectionname);
            if (!IsConnectionOK(result, connectionname))
            {
                return result;
            }
            TypedDataProvider provider = DataProviders[connectionname];
            var connection = ProviderConnections[connectionname];

            try
            {
                EnsureOpenedConnection(GetContextFor(connection));
                var sqlquerytext = provider.Syntax.GetSQLQuery(selectstatement);
                result.Model = provider.GetData(sqlquerytext, connection);

            }
            catch (Exception ex)
            {
                result.AddError(ex);
                return result;
            }
            return result;
        }

        public async Task<Dictionary<string, Result<List<Dictionary<string, object>>>>> GetMultiDataAsync(List<ClientQuery> clientqueries)
        {
            var result = new Dictionary<string, Result<List<Dictionary<string, object>>>>();
            var options = new DbOptions();
            options.results = result;
            var i = 0;
            //var provider = GetProvider("Voucher");
            //var connection = GetConnectionForProvider(provider);
            //var cncommand = await provider.SetConnectionInfo(connection, null, result, long.Parse(u.ID));




            foreach (var query in clientqueries)
            {
                var key = query.QueryName + "|" + i.ToString();
                //@[Result].List(QueryKey:FieldName)
                result.Add(key, await GetDataAsync(query, options));
                i++;
            }

            //if (cncommand != null)
            //{
            //    var cnclearcommand = await provider.ClearConnectionInfo(connection, null, cncommand, result);
            //}
            return result;

        }

        class RestrictedQuery
        {
            public string QueryName { get; set; }
            public List<string> FilterNames { get; set; } = new List<string>();
            public RestrictedQuery(string QueryName, params string[] FilterNames)
            {
                this.QueryName = QueryName;
                this.FilterNames.AddRange(FilterNames);
            }
        }

        private static List<RestrictedQuery> GetRestrictedQueries()
        {
            var path = ServerApp.Current.MapPath("~/data/restricted_queries.json");
            var restrictedqueries = new List<RestrictedQuery>();
            if (System.IO.File.Exists(path))
            {
                var textFromFile = System.IO.File.ReadAllText(path);
                try
                {
                    restrictedqueries = JsonConvert.DeserializeObject<List<RestrictedQuery>>(textFromFile);
                }
                catch (Exception ex) { 
                }
            }
            return restrictedqueries;
        }

        private List<RestrictedQuery> RestrictedQueries = GetRestrictedQueries();

        public async Task<Dictionary<string, Result<List<Dictionary<string, object>>>>> WebshopGetMultiDataAsync(List<ClientQuery> clientqueries, string token)
        {
            var result = new Dictionary<string, Result<List<Dictionary<string, object>>>>();
            var options = new DbOptions();
            options.results = result;

            var i = 0;
            var provider = GetProvider("Voucher");

            var company = getWebshopCredentials(token);

            foreach (var query in clientqueries)
            {
                var oldUser = GetUser();
                var rq = RestrictedQueries.Find(nrq => nrq.QueryName.Equals(query.QueryName));
                if (rq != null)
                {
                    foreach (var filtername in rq.FilterNames)
                    {
                        query.SetFilter(QueryFilter.Create(ClienDataType.Number, filtername, ((int)company["Id"]).ToString()));
                    }
                    options.UserId = long.Parse(WebshopUser.ID);
                    SetUser(WebshopUser);
                }
                else
                {
                    options.UserId = GetUserId();
                }

                Logics.Handle(query);

                var key = query.QueryName + "|" + i.ToString();
                result.Add(key, await WebshopGetDataAsync(query, options));
                i++;
                SetUser(oldUser);
            }

            return result;

        }

        public async Task<Result<Dictionary<string, object>>> GetDataByIdAsync(string queryname, object id, IEnumerable<string> fields, DbTransaction transaction = null)
        {
            var clientquery = new ClientQuery();
            clientquery.QueryName = queryname;

            var filter = new QueryFilter();
            filter.Field = "Id";
            filter.Operator = "=";
            filter.Type = "Number";
            filter.Values = new List<string> { String.Format("{0}", id) };
            if (fields == null) { fields = new List<string>(); }
            clientquery.Filters.Add(filter);
            clientquery.Compress = false;
            if (fields == null || fields.Count() == 0)
            {
                fields = new List<string>() { "*" };
            }
            clientquery.Fields = fields.Select(i => new QueryField(i)).ToList();
            clientquery.Ordering = new Dictionary<string, string>() { ["Id"] = "ASC" };
            clientquery.Take = 1;
            clientquery.Skip = 0;
            var options = new DbOptions();
            options.transaction = transaction;
            var data = await GetDataAsync(clientquery, options);

            var result = new Result<Dictionary<string, object>>();
            result.ViewData = data.ViewData;
            result.Errors = data.Errors;
            result.Model = data.Model == null ? new Dictionary<string, object>() : data.Model.FirstOrDefault();
            return result;
        }

        public async Task<Result<List<Result<StandardDictionary>>>> ExecuteWebshopCommandsAsync(List<DataCommand> commands, string token)
        {
            var aggregatedresult = new Result<List<Result<StandardDictionary>>>();

            if (commands == null || commands.Count == 0)
            {
                aggregatedresult.AddError("EmptyCommand");
                return aggregatedresult;
            }

            var providercommands = new Dictionary<string, List<DataCommand>>();
            foreach (var cm in commands)
            {
                var q = GetQueryByTypeName(cm.TypeName);
                var cn = DefaultConnectionName;
                if (q != null)
                {
                    cn = GetConnectionName(q.ConnectionName);
                }
                if (!providercommands.ContainsKey(cn))
                {
                    providercommands.Add(cn, new List<DataCommand>());
                }
                providercommands[cn].Add(cm);
            }

            foreach (var key in providercommands.Keys)
            {

                var pcommands = providercommands[key];
                if (!IsConnectionOK(aggregatedresult, key))
                {
                    return aggregatedresult;
                }
                var pr = DataProviders[key];
                var c = ProviderConnections[key];

                if (!hasPermission(pcommands, token))
                {
                    aggregatedresult.Errors.Add(new Exception("You do not have permission to execute this commands!"));
                    return aggregatedresult;
                }

                DbOptions options = GetContextFor(c, long.Parse(WebshopUser.ID));
                EnsureOpenedConnection(options);

                Result<List<Dictionary<string, object>>> dbresult = new Result<List<Dictionary<string, object>>>();

                var handledcommands = await Logics.HandleAsync(pcommands, "");

                if (pcommands.Count > 0)
                {
                    var presults = await pr.ExecuteCommandsAsync(pcommands, c);
                    aggregatedresult.Model.AddRange(presults.Model);
                    aggregatedresult.SetFromResult(presults);
                }

                await pr.ClearConnectionInfo(options, dbresult);

                var commandresults = handledcommands.Select(i =>
                {
                    var result = new Result<StandardDictionary>();
                    var model = new StandardDictionary();
                    model.Load(i.Result.Model);
                    result.Model = model;
                    result.ViewData = i.Result.ViewData;
                    result.Errors = i.Result.Errors;

                    return result;
                }).ToList();

                var commandwitherror = handledcommands.FirstOrDefault(i => i.Result.Errors.Count > 0);
                if (commandwitherror != null)
                {
                    aggregatedresult.AddError(commandwitherror.Result.Errors.FirstOrDefault());
                }

                aggregatedresult.Model.AddRange(commandresults);

            }

            return aggregatedresult;

        }
        class RestrictedCommand
        {
            public string TypeName { get; set; }
            public List<string> Restrictions { get; set; }
            //public RestrictedCommand(string tn, params string[] r) {
            //    TypeName = tn;
            //    Restrictions = new List<string>(r);
            //}
        }

        private static List<RestrictedCommand> GetNotRestrictedCommands()
        {
            var path = ServerApp.Current.MapPath("~/data/not_restricted_commands.json");
            var notrestrictedcommands = new List<RestrictedCommand>();
            if (System.IO.File.Exists(path))
            {
                var textFromFile = System.IO.File.ReadAllText(path);
                try
                {
                    notrestrictedcommands = JsonConvert.DeserializeObject<List<RestrictedCommand>>(textFromFile);
                }
                catch (Exception ex) { 
                }
            }
            return notrestrictedcommands;
        }

        private List<RestrictedCommand> NotRestrictedCommands = GetNotRestrictedCommands();

        private bool hasPermission(List<DataCommand> pcommands, string token)
        {
            var company = WebshopCredentials[GetDomain()][token];

            foreach (DataCommand command in pcommands)
            {
                try
                {
                    var restreictedcommand = NotRestrictedCommands.FirstOrDefault(c => c.TypeName == command.TypeName);
                    if (restreictedcommand != null)
                    {
                        foreach (var restriction in restreictedcommand.Restrictions)
                        {
                            var temp = restriction.Split("=");
                            var keys = temp[0].Split(".");
                            object datakey = command;
                            foreach (var key in keys)
                            {
                                var val = (datakey as Dictionary<string, object>)?.GetValueOrDefault(key);
                                if (val == null)
                                {
                                    datakey = null;
                                    break;
                                }
                                datakey = val;
                            }
                            if (datakey == null)
                            {
                                continue;
                            }

                            var datavalue = temp[1];
                            object refObj = null;
                            if (datavalue.StartsWith("{") && datavalue.EndsWith("}"))
                            {
                                var value = datavalue.Substring(1, datavalue.Length - 2);
                                var splittedValue = value.Split(".");
                                var obj = splittedValue[0];


                                switch (obj)
                                {
                                    case "c":
                                        refObj = company;
                                        break;
                                }

                                foreach (string key in splittedValue.Skip(1))
                                {
                                    var val = (refObj as Dictionary<string, object>)?.GetValueOrDefault(key);
                                    if (val == null)
                                    {
                                        refObj = null;
                                        break;
                                    }
                                    refObj = val;
                                }
                            }

                            if (datakey?.ToString()?.Equals(refObj?.ToString()) == false)
                            {
                                return false;
                            }
                        }
                    }
                    else
                    {
                        return false;
                    }
                }
                catch (Exception ex)
                {
                    return false;
                }
            }
            return true;
        }

        public async Task<Result<List<Result<StandardDictionary>>>> ExecuteCommandsAsync(List<DataCommand> commands)
        {
            var aggregatedresult = new Result<List<Result<StandardDictionary>>>();

            if (commands == null || commands.Count == 0)
            {
                aggregatedresult.AddError("EmptyCommand");
                return aggregatedresult;
            }

            var providercommands = new Dictionary<string, List<DataCommand>>();
            foreach (var cm in commands)
            {
                var q = GetQueryByTypeName(cm.TypeName);
                var cn = DefaultConnectionName;
                if (q != null)
                {
                    cn = GetConnectionName(q.ConnectionName);
                }
                if (!providercommands.ContainsKey(cn))
                {
                    providercommands.Add(cn, new List<DataCommand>());
                }
                providercommands[cn].Add(cm);
            }

            foreach (var key in providercommands.Keys)
            {

                var pcommands = providercommands[key];
                if (!IsConnectionOK(aggregatedresult, key))
                {
                    return aggregatedresult;
                }
                var pr = DataProviders[key];
                var c = ProviderConnections[key];
                EnsureOpenedConnection(GetContextFor(c));

                var handledcommands = await Logics.HandleAsync(pcommands, "");

                if (pcommands.Count > 0)
                {
                    var presults = await pr.ExecuteCommandsAsync(pcommands, c);
                    aggregatedresult.Model.AddRange(presults.Model);
                    aggregatedresult.SetFromResult(presults);
                }

                var commandresults = handledcommands.Select(i =>
                {
                    var result = new Result<StandardDictionary>();
                    var model = new StandardDictionary();
                    model.Load(i.Result.Model);
                    result.Model = model;
                    result.ViewData = i.Result.ViewData;
                    result.Errors = i.Result.Errors;

                    return result;
                }).ToList();

                var commandwitherror = handledcommands.FirstOrDefault(i => i.Result.Errors.Count > 0);
                if (commandwitherror != null)
                {
                    aggregatedresult.AddError(commandwitherror.Result.Errors.FirstOrDefault());
                }

                aggregatedresult.Model.AddRange(commandresults);

            }

            return aggregatedresult;

        }
        public User CreateUser(Dictionary<string, object> identifierobject)
        {
            User u = null;
            var username = identifierobject.GetValueAsString("UserName");
            var token = identifierobject.GetValueAsString("Token");
            var domain = GetDomain();
            var authcontainer = ServerApp.Current.AuthenticationByDomain.ContainsKey(domain) ? ServerApp.Current.AuthenticationByDomain[domain] : null;
            if (authcontainer == null) { return null; }
            if (!authcontainer.UsersByUsername.ContainsKey(username))
            {
                u = new User();
                u.ID = identifierobject.GetValueAsString("Id");
                u.UserName = username;
                authcontainer.AddUserByToken(token, u);
                authcontainer.AddUser(u);
            }
            else
            {
                u = authcontainer.UsersByUsername[username];
            }
            if (!authcontainer.UsersByToken.ContainsKey(token))
            {
                authcontainer.AddUserByToken(token, u);

            }
            return u;
        }
        public Company CreateCompany(Dictionary<string, object> identifierobject)
        {
            var userid = String.Format("{0}", StandardDictionary.GetValue(identifierobject, "WebserviceUserId"));
            var wsid = String.Format("{0}", StandardDictionary.GetValue(identifierobject, "WebserviceIdentifier"));
            var token = String.Format("{0}", StandardDictionary.GetValue(identifierobject, "Token"));
            Dictionary<string, object> userdictionary = null;
            if (identifierobject.ContainsKey("WebserviceUserId"))
            {
                var d = new Dictionary<string, object>();
                var wsukeys = identifierobject.Keys.Where(i => i.StartsWith("WebServiceUser.")).ToList();
                foreach (var wsukey in wsukeys)
                {
                    var ukey = wsukey.Substring(wsukey.IndexOf(".") + 1);
                    d.Add(ukey, identifierobject[wsukey]);
                }
                userdictionary = d;
                //userdictionary = identifierobject["WebServiceUser"] as Dictionary<string, object>;
            }
            else
            {
                StandardDictionary.SetValue(identifierobject, "Log", "No WebServiceUser");
            }
            Company company;
            User user = null;
            var domain = GetDomain();
            var authcontainer = ServerApp.Current.AuthenticationByDomain.ContainsKey(domain) ? ServerApp.Current.AuthenticationByDomain[domain] : null;
            if (authcontainer == null) { return null; }

            if (!authcontainer.UsersById.ContainsKey(userid))
            {
                user = new User();
                user.ID = userid;
                if (userdictionary != null)
                {
                    StandardDictionary.SetValue(identifierobject, "Log", ToJson(userdictionary));

                    user.Email = String.Format("{0}", StandardDictionary.GetValue(userdictionary, "Email"));
                    user.UserName = String.Format("{0}", StandardDictionary.GetValue(userdictionary, "UserName"));
                    user.EmployeeId = String.Format("{0}", StandardDictionary.GetValue(userdictionary, "EmployeeId"));
                    user.FullName = String.Format("{0}", StandardDictionary.GetValue(userdictionary, "FullName"));

                }
                authcontainer.AddUserByToken(token, user);
                authcontainer.AddUser(user);
                //ServerApp.Current.Users.Add(userid, user);

            }
            if (!String.IsNullOrEmpty(userid))
            {
                user = authcontainer.UsersById[userid];
            }
            if (!authcontainer.CompaniesByToken.ContainsKey(token))
            {
                company = new Company(identifierobject);
                company.User = user;
                authcontainer.CompaniesByToken.Add(token, company);
                if (!authcontainer.CompaniesById.ContainsKey(company.ID))
                {
                    authcontainer.CompaniesById.Add(company.ID, company);
                }

            }
            company = authcontainer.CompaniesByToken[token];
            user.Companies.Add(company);
            return company;

        }

        public bool IsAdmin()
        {
            //var user = 
            return GetUser().ID == "1";
        }

        public HttpClient GetHttpClient(string name = null)
        {
            return new HttpClient();
        }
        public async Task<Result<List<Dictionary<string, object>>>> ExecuteApiAsync(string url, string method, string data, Dictionary<string, string> headers, Company company = null)
        {
            var result = new Result<List<Dictionary<string, object>>>();

            var xurl = GetBaseUrl() + url;
            result.ViewData.Add("url", xurl);
            var contextcompany = company == null ? GetCompany() : company;
            var _ERPAuthorization = "";
            try
            {
                DateTime? tokendate = contextcompany.ContainsKey("API_TokenDate") ? contextcompany["API_TokenDate"] == null ? null : (DateTime?)contextcompany["API_TokenDate"] : null;
                var loginneeded = (!contextcompany.ContainsKey("API_Token") || !tokendate.HasValue || tokendate.Value.AddHours(1) <= DateTime.Now);
                if (loginneeded)
                {
                    var loginresult = await ApiLoginAsync(contextcompany);
                    if (loginresult.Errors.Count > 0)
                    {
                        result.Errors = loginresult.Errors;
                        result.Model = new List<Dictionary<string, object>>();
                        result.ViewData = loginresult.ViewData;
                        return result;
                    }
                    else
                    {
                        result.ViewData["Login"] = loginresult;
                        result.Model = new List<Dictionary<string, object>>();
                        _ERPAuthorization = String.Format("{0}", contextcompany["API_Token"]);

                    }
                }
                else
                {
                    _ERPAuthorization = String.Format("{0}", contextcompany["API_Token"]);
                }
            }
            catch (Exception ex)
            {
                result.AddError(ex);
                result.Model = new List<Dictionary<string, object>>();
                return result;
            }
            result.ViewData.Add("API_Token", _ERPAuthorization);
            result.ViewData.Add("API_TokenDate", contextcompany["API_TokenDate"]);

            var httpmethod = HttpMethod.Get;
            switch (method)
            {
                case "POST":
                    httpmethod = HttpMethod.Post;
                    break;
                case "PUT":
                    httpmethod = HttpMethod.Put;
                    break;
                case "DELETE":
                    httpmethod = HttpMethod.Delete;
                    break;
            }
            var datatext = "";
            HttpRequestMessage request = null;
            try
            {
                request = new HttpRequestMessage
                {
                    Method = httpmethod,
                    RequestUri = new Uri(xurl),
                    Headers = {
                        { HttpRequestHeader.Authorization.ToString(), _ERPAuthorization },
                        { HttpRequestHeader.ContentType.ToString(), "application/json" }
                    },
                    Content = new StringContent(data, Encoding.UTF8, "application/json")
                };

            }
            catch (Exception ex)
            {
                result.AddError(ex, xurl);
                return result;
            }
            try
            {
                var startdate = DateTime.Now;
                using (HttpClient client = new HttpClient())
                {
                    var response = await client.SendAsync(request);
                    datatext = await response.Content.ReadAsStringAsync();
                    var enddate = DateTime.Now;
                    result.ViewData.Add("Duration", enddate.Subtract(startdate).TotalMilliseconds);

                    result.ViewData.Add("RawResult", datatext);
                    var dataobj = ParseJson(datatext);
                    var errors = (dataobj.ContainsKey("errors") ? dataobj["errors"] as List<Dictionary<string, object>> : new List<Dictionary<string, object>>());
                    var message = String.Format("{0}", dataobj.ContainsKey("message") ? dataobj["message"] : null);
                    var statuscode = String.Format("{0}", dataobj.ContainsKey("statusCode") ? dataobj["statusCode"] : null);
                    if (errors != null)
                    {
                        result.Errors = errors.Select(err => new Exception(ToJson(err))).ToList();
                    }
                    if (result.Errors.Count == 0 && statuscode != "200")
                    {
                        result.AddError(message);

                    }
                    if (response.StatusCode == HttpStatusCode.OK)
                    {

                        result.Model = new List<Dictionary<string, object>>() { dataobj["result"] as Dictionary<string, object> };
                    }
                }
            }
            catch (Exception ex)
            {
                var d = new Dictionary<string, object>();
                d.Add("datatext", datatext);
                d.Add("dataobj", ParseJson(datatext));
                result.AddError(ex, d);
            }
            return result;
        }
        private async Task<Result<StringObject>> ApiLoginAsync(Company company = null)
        {
            var result = new Result<StringObject>();
            var xurl = GetBaseUrl() + "/api/Authenticate";
            var contextcompany = company == null ? GetCompany() : company;
            var startdate = DateTime.Now;
            var wsidobj = "{ \"webserviceIdentifier\":\"" + contextcompany["WebserviceIdentifier"] + "\"}";
            result.ViewData.Add("loginobj", wsidobj);
            result.ViewData.Add("loginurl", xurl);
            var request = new HttpRequestMessage
            {
                Method = HttpMethod.Post,
                RequestUri = new Uri(xurl),
                Headers = {
                    { HttpRequestHeader.ContentType.ToString(), "application/json" }
                },
                Content = new StringContent(wsidobj, Encoding.UTF8, "application/json")
            };
            var datatext = "";
            try
            {
                using (HttpClient client = new HttpClient())
                {
                    var response = await client.SendAsync(request);
                    datatext = await response.Content.ReadAsStringAsync();
                    var enddate = DateTime.Now;
                    result.ViewData.Add("LoginDuration", enddate.Subtract(startdate).TotalMilliseconds);

                    result.ViewData.Add("RawResponse", datatext);

                    var dataobj = ParseJson(datatext);
                    var errors = dataobj.GetValue("errors") as List<Dictionary<string, object>>;
                    if (errors != null)
                    {
                        result.Errors = errors.Select(err => new Exception(ToJson(err))).ToList();
                    }
                    if (response.StatusCode == HttpStatusCode.OK)
                    {

                        result.Model.Value = String.Format("{0}", dataobj["result"]);
                        var token = "Bearer " + result.Model.Value;
                        contextcompany["API_Token"] = token;
                        DateTime? tdate = DateTime.Now;
                        contextcompany["API_TokenDate"] = tdate;

                    }
                    else
                    {
                        result.AddError("Request Failed. StatusCode: " + response.StatusCode.ToString());
                    }
                }
            }
            catch (Exception ex)
            {
                result.AddError(ex, datatext);
            }
            return result;
        }


        //public Result<List<Dictionary<string, object>>> ExecuteApi(string url, string method, string data, Dictionary<string, string> headers, Company company = null)
        //{
        //    var result = new Result<List<Dictionary<string, object>>>();
        //    result.SetViewData("Start", string.Format("{0:yyyy-MM-dd HH:mm:ss:ffff}", DateTime.Now));

        //    var xurl = GetBaseUrl() + url;
        //    result.ViewData.Add("url", xurl);
        //    var contextcompany = company == null ? GetCompany() : company;
        //    var _ERPAuthorization = "";

        //    try
        //    {
        //        DateTime? tokendate = contextcompany.ContainsKey("API_TokenDate") ? contextcompany["API_TokenDate"] == null ? null : (DateTime?)contextcompany["API_TokenDate"] : null;
        //        var loginneeded = (!contextcompany.ContainsKey("API_Token") || !tokendate.HasValue || tokendate.Value.AddHours(1) <= DateTime.Now);
        //        if (loginneeded)
        //        {
        //            result.ViewData.Add("Login", "true");

        //            var loginresult = ApiLogin(contextcompany);
        //            if (loginresult.Errors.Count > 0)
        //            {
        //                result.Errors = loginresult.Errors;
        //                result.Model = new List<Dictionary<string, object>>();
        //                result.ViewData = loginresult.ViewData;
        //                return result;
        //            }
        //            else
        //            {
        //                result.ViewData["Login"] = loginresult;

        //                result.Model = new List<Dictionary<string, object>>();
        //                _ERPAuthorization = String.Format("{0}", contextcompany["API_Token"]);

        //            }
        //        }
        //        else
        //        {
        //            _ERPAuthorization = String.Format("{0}", contextcompany["API_Token"]);
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        result.AddError(ex);
        //        result.Model = new List<Dictionary<string, object>>();
        //        return result;
        //    }
        //    result.ViewData.Add("API_Token", _ERPAuthorization);
        //    result.ViewData.Add("API_TokenDate", contextcompany["API_TokenDate"]);

        //    var httpmethod = HttpMethod.Get;
        //    switch (method)
        //    {
        //        case "POST":
        //            httpmethod = HttpMethod.Post;
        //            break;
        //        case "PUT":
        //            httpmethod = HttpMethod.Put;
        //            break;
        //        case "DELETE":
        //            httpmethod = HttpMethod.Delete;
        //            break;
        //    }
        //    var datatext = "";
        //    HttpRequestMessage request = null;
        //    try
        //    {
        //        request = new HttpRequestMessage
        //        {
        //            Method = httpmethod,
        //            RequestUri = new Uri(xurl),
        //            Headers = {
        //                { HttpRequestHeader.Authorization.ToString(), _ERPAuthorization },
        //                { HttpRequestHeader.ContentType.ToString(), "application/json" }
        //            },
        //            Content = new StringContent(data, Encoding.UTF8, "application/json")
        //        };

        //    }
        //    catch (Exception ex)
        //    {
        //        result.AddError(ex, xurl);
        //        return result;
        //    }
        //    try { 
        //    using (HttpClient client = new HttpClient())
        //        {
        //            var response = client.SendAsync(request).Result;
        //            datatext = response.Content.ReadAsStringAsync().Result;
        //            result.ViewData.Add("RawResult", datatext);
        //            var dataobj = ParseJson(datatext);
        //            var errors = dataobj["errors"] as List<Dictionary<string, object>>;
        //            if (errors != null)
        //            {
        //                result.Errors = errors.Select(err => new Exception(ToJson(err))).ToList();
        //            }
        //            if (response.StatusCode == HttpStatusCode.OK)
        //            {

        //                result.Model = new List<Dictionary<string, object>>() { dataobj["result"] as Dictionary<string, object> };
        //            }
        //            else 
        //            {
        //                var errorstr = "Error";
        //                if (dataobj.ContainsKey("message")) {
        //                    errorstr = String.Format("{0}",dataobj["message"]);
        //                }
        //                result.Errors.Add(new ApiModel.DataException(errorstr, dataobj));
        //            }
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        result.AddError(ex, datatext);
        //    }
        //    result.SetViewData("End", string.Format("{0:yyyy-MM-dd HH:mm:ss:ffff}", DateTime.Now));
        //    return result;
        //}

        //private Result<StringObject> ApiLogin(Company company = null)
        //{
        //    var result = new Result<StringObject>();
        //    var xurl = GetBaseUrl() + "/api/Authenticate";
        //    var contextcompany = company == null ? GetCompany() : company;

        //    var wsidobj = "{ \"webserviceIdentifier\":\"" + contextcompany["WebserviceIdentifier"] + "\"}";
        //    result.ViewData.Add("loginobj", wsidobj);
        //    result.ViewData.Add("loginurl", xurl);
        //    var request = new HttpRequestMessage
        //    {
        //        Method = HttpMethod.Post,
        //        RequestUri = new Uri(xurl),
        //        Headers = {
        //            { HttpRequestHeader.ContentType.ToString(), "application/json" }
        //        },
        //        Content = new StringContent(wsidobj, Encoding.UTF8, "application/json")
        //    };
        //    var datatext = "";
        //    try
        //    {
        //        using (HttpClient client = new HttpClient())
        //        {
        //            var response = client.SendAsync(request).Result;
        //            datatext = response.Content.ReadAsStringAsync().Result;
        //            result.ViewData.Add("RawResponse", datatext);

        //            var dataobj = ParseJson(datatext);
        //            var errors = dataobj.GetValue("errors") as List<Dictionary<string, object>>;
        //            if (errors != null)
        //            {
        //                result.Errors = errors.Select(err => new Exception(ToJson(err))).ToList();
        //            }
        //            if (response.StatusCode == HttpStatusCode.OK)
        //            {

        //                result.Model.Value = String.Format("{0}", dataobj["result"]);
        //                var token = "Bearer " + result.Model.Value;
        //                contextcompany["API_Token"] = token;
        //                DateTime? tdate = DateTime.Now;
        //                contextcompany["API_TokenDate"] = tdate;

        //            }
        //            else 
        //            {
        //                result.AddError("Request Failed. StatusCode: " + response.StatusCode.ToString());
        //            }
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        result.AddError(ex, datatext);
        //    }
        //    return result;
        //}

        public Result<Dictionary<string, Dictionary<string, Dictionary<string, string>>>> GetDbLayout()
        {
            var result = new Result<Dictionary<string, Dictionary<string, Dictionary<string, string>>>>();
            result.Model = new Dictionary<string, Dictionary<string, Dictionary<string, string>>>();

            var infos = new List<string>();
            foreach (var key in DataProviders.Keys)
            {
                var connectionname = GetConnectionName(key);
                if (IsConnectionOK(result, connectionname))
                {
                    var provider = DataProviders[connectionname];
                    var connection = ProviderConnections[connectionname];
                    EnsureOpenedConnection(GetContextFor(connection));
                    var dblayoutresult = provider.GetDBLayout(connection);
                    result.Model.Add(connectionname, dblayoutresult.Model);
                    result.Errors.AddRange(dblayoutresult.Errors);
                }
                infos.Add(String.Format("DataProvider:{0}; connectionname:{1}", key, connectionname));



            }
            result.ViewData.Add("Info", infos);

            CloseConnections();

            return result;
        }

        public TypedDataProvider GetProvider(string TypeName)
        {
            var query = GetQueryByTypeName(TypeName);
            var connectionname = String.IsNullOrEmpty(query.ConnectionName) ? "Default" : query.ConnectionName;
            TypedDataProvider provider = DataProviders.ContainsKey(connectionname) ? DataProviders[connectionname] : null;
            return provider;
        }


        public DbConnection GetConnection(string connectionname)
        {
            if (ProviderConnections.ContainsKey(connectionname))
            {
                return ProviderConnections[connectionname];
            }
            return null;
        }

        public Result<List<Dictionary<string, object>>> GetData(ClientQuery clientquery, DbConnection connection, DbTransaction transaction)
        {
            var result = new Result<List<Dictionary<string, object>>>();

            var query = _QueryService.GetQueryByName(clientquery.QueryName);

            if (query == null)
            {
                result.AddError(String.Format("Query {0} is not Defined", clientquery.QueryName));
                return result;
            }
            var connectionname = GetConnectionName(query.ConnectionName);
            if (!IsConnectionOK(result, connectionname))
            {
                return result;
            }
            TypedDataProvider provider = DataProviders[connectionname];
            if (connection == null)
            {
                connection = GetConnectionForProvider(provider);
            }
            //if (provider.ConnectionTypeName != connection.GetType().Name)
            //{
            //    result.AddError("Connection Type mismatch!");
            //    return result;
            //}

            EnsureOpenedConnection(GetContextFor(connection));
            result = provider.GetData(clientquery, connection, transaction);

            return result;
        }

        public DbConnection GetConnectionForProvider(TypedDataProvider provider)
        {
            var kv = DataProviders.FirstOrDefault(i => i.Value == provider);
            var connectionname = kv.Key;
            var connection = GetConnection(connectionname);
            return connection;

        }

        public DbConnection GetConnectionForTypeName(string TypeName)
        {
            var query = _QueryService.GetQueryByName(TypeName);

            if (query != null)
            {
                var connectionname = GetConnectionName(query.ConnectionName);
                return GetConnection(connectionname);
            }
            return null;

        }
        private Company _Company = null;
        private Company _AdminCompany = null;
        private User _User = null;
        public void SetUser(User u)
        {
            _User = u;
        }
        public void SetUser(Company company, string ERPAuthorization = "")
        {
            if (company != null)
            {
                _User = company.User;
                _Company = company;
                if (_User.ID == "1")
                {
                    _AdminCompany = company;
                }
            }
            else
            {
                _User = null;
                _Company = null;
                _AdminCompany = null;
            }
        }
        public Company GetCompany()
        {
            return _Company;
        }
        public Company GetAdminCompany()
        {
            var domain = GetDomain();
            var authcontainer = ServerApp.Current.AuthenticationByDomain.ContainsKey(domain) ? ServerApp.Current.AuthenticationByDomain[domain] : null;
            if (authcontainer == null) { return null; }
            return authcontainer.CompaniesById.Values.FirstOrDefault(i => i.User.ID == "1");
        }
        public User GetUser()
        {
            return _User;
        }

        public long GetUserId()
        {
            long userid = -1;
            var user = GetUser();
            if (user != null)
            {
                long.TryParse(user.ID, out userid);
            }
            return userid;
        }

        public string ERPAuthorization()
        {
            return String.Format("{0}", GetCompany()["API_Token"]);
        }

        public string BaseUrl = "";
        public string GetBaseUrl()
        {
            var cadress = ServerApp.Current.Settings.ServerAddress;
            var domain = GetDomain();
            var dict = ServerApp.Current.Settings.PartnerERPServices == null ? new Dictionary<string, string>() : ServerApp.Current.Settings.PartnerERPServices;
            if (dict.ContainsKey(domain))
            {
                var url = dict[domain];
                if (!url.StartsWith("http://"))
                {
                    url = "http://" + url;
                }
                return url;
            }
            if (dict.ContainsKey(""))
            {
                var url = dict[""];
                if (!url.StartsWith("http://"))
                {
                    url = "http://" + url;
                }
                return url;
            }
            return String.IsNullOrEmpty(cadress) ? BaseUrl : cadress;
        }
        public string ToJson(object item)
        {
            try
            {
                var settings = new JsonSerializerSettings
                {
                    NullValueHandling = NullValueHandling.Ignore
                };
                return JsonConvert.SerializeObject(item, settings);
            }
            catch (Exception ex)
            {
                return item == null ? "" : item.ToString();
            }
        }
        public T ParseJsonTo<T>(string item)
        {
            return Newtonsoft.Json.JsonConvert.DeserializeObject<T>(item);
        }
        public Dictionary<string, object> ParseJson(string item)
        {
            try
            {
                var jsondata = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, object>>(item);
                return FixJsonData(jsondata);
            }
            catch (Exception ex)
            {
                var r = new Dictionary<string, object>();
                var error = new Dictionary<string, object>();
                error.Add("Error", ex.Message);
                r.Add("Errors", new List<Dictionary<string, object>> { error });
                return r;
            }
        }
        public List<Dictionary<string, object>> ParseJsonList(string item)
        {

            var jsondata = Newtonsoft.Json.JsonConvert.DeserializeObject<List<Dictionary<string, object>>>(item);
            var result = new List<Dictionary<string, object>>();
            foreach (var jsonitem in jsondata)
            {
                result.Add(FixJsonData(jsonitem));
            }
            return result;
            //return FixJsonData(jsondata);

        }
        public static Dictionary<string, object> FixJsonData(Dictionary<string, object> data)
        {
            var fixeddata = new Dictionary<string, object>();

            foreach (var key in data.Keys)
            {
                var item = data[key];
                var array = item as Newtonsoft.Json.Linq.JArray;
                var obj = item as Newtonsoft.Json.Linq.JObject;
                if (array != null)
                {
                    var isobjectarray = true;
                    if (array.HasValues && array.First != null)
                    {
                        if (array.First.Type != Newtonsoft.Json.Linq.JTokenType.Object)
                        {
                            isobjectarray = false;
                        }
                    }
                    if (isobjectarray)
                    {
                        var list = array.ToObject<List<Dictionary<string, object>>>().Select(i => FixJsonData(i)).ToList();
                        fixeddata.Add(key, list);
                    }
                    else
                    {
                        var list = array.ToObject<List<Object>>().Select(i => i).ToList();
                        fixeddata.Add(key, list);

                    }

                }
                else if (obj != null)
                {
                    var dict = FixJsonData(obj.ToObject<Dictionary<string, object>>());
                    fixeddata.Add(key, dict);

                }
                else
                {
                    fixeddata.Add(key, data[key]);
                }
            }
            return fixeddata;
        }
        public void RestoreModel(Dictionary<string, object> item)
        {
            var keys = item.Keys.ToList();
            foreach (var key in keys)
            {
                var list = item[key] as List<Dictionary<string, object>>;
                if (list != null)
                {
                    for (var i = 0; i < list.Count; i++)
                    {
                        var element = list[i];
                        RestoreModel(element);
                    }
                }
                if (key.IndexOf(".") > -1)
                {
                    SetPath(item, key);
                }
            }
        }
        public void SetPath(Dictionary<string, object> item, string path, object value = null)
        {
            if (item.ContainsKey(path))
            {
                var val = value == null ? item[path] : value;
                if (path.Contains("."))
                {
                    var parts = path.Split('.');
                    var current = item;
                    for (var i = 0; i < parts.Length - 1; i++)
                    {
                        var part = parts[i];
                        if (!current.ContainsKey(part))
                        {
                            current.Add(part, new Dictionary<string, object>());
                        }
                        current = current[part] as Dictionary<string, object>;
                        if (current == null)
                        {
                            current[part] = new Dictionary<string, object>();
                        }

                    }
                    var lastpart = parts[parts.Length - 1];
                    current[lastpart] = val;
                }
            }
        }

        public void SaveFile(string filepath, Stream stream)
        {
            var filePath = ServerApp.Current.MapPath(filepath);
            var folder = Strings.GetFolder(filePath);
            if (!System.IO.Directory.Exists(folder))
            {
                System.IO.Directory.CreateDirectory(folder);
            }
            using (var fileStream = new FileStream(filePath, FileMode.Create, FileAccess.Write))
            {
                stream.CopyTo(fileStream);
            }

            stream.Close();
        }

        public Result<StringObject> SendMail(EmailMessage msg)
        {
            var result = new Result<StringObject>();
            var emailservice = new EmailService(ServerApp.Current.Settings.SmtpAccounts);
            return emailservice.SendEmail(msg);
        }

        public async Task<Result<StringObject>> SendMailAsync(EmailMessage msg)
        {
            var result = new Result<StringObject>();
            var emailservice = new EmailService(ServerApp.Current.Settings.SmtpAccounts);
            return await emailservice.SendEmailAsync(msg);
        }

        public string GetDomain()
        {
            //return ServerApp.Current.Settings.Domain;
            return _Domain.ToUpper();
        }

        public string MapPath(string path)
        {
            return ServerApp.Current.MapPath(path);
        }
    }


}