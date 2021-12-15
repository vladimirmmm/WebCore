using ApiModel;
using DataService;
using DataService.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace Core.Controllers
{

    //[Authorize(AuthenticationSchemes = "Bearer")]
    public class CoreController : Controller
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<Controller> _logger;
        public AppDataService _appdataservice = null;
        internal readonly UserManager<IdentityUser> _userManager;
        internal readonly SignInManager<IdentityUser> _signInManager;
        internal IConfiguration _configuration;
        public AppDataService ds
        {
            get
            {
                if (_appdataservice == null)
                {
                    _appdataservice = new AppDataService(GetOptions());
                    //_appdataservice.Logics = new Models.ThermalLogic(ds);
                    _appdataservice.RegisterTypedDataProvider("Therm", "sqlserver");

                }
                return _appdataservice;
            }
        }
        public CoreController(ILogger<Controller> logger, IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _httpClientFactory = httpClientFactory;

        }
        public CoreController(ILogger<Controller> logger, IHttpClientFactory httpClientFactory, UserManager<IdentityUser> userManager, SignInManager<IdentityUser> signInManager, IConfiguration configuration)  {
            _logger = logger;
            _httpClientFactory = httpClientFactory;
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;

        }
        public ServiceOptions GetOptions()
        {
            //_httpClientFactory.
            var result = new ServiceOptions();
            result.Domain = GetDomain();
            result.Debug = GetQueryValue("debug") == "1" || GetQueryValue("debug") == "true";
            result.WebServiceIdentifier = GetHeaderValue("WebServiceIdentifier");
            result.Api_Token = GetHeaderValue("Api_Token");
            result.GetHttpClient = () => _httpClientFactory.CreateClient(result.Domain);
            return result;
        }

        public string GetDomain()
        {
            var domain = "";
            if (Request != null)
            {

                domain = GetHeaderValue("Domain");

            }
            return domain.ToUpper();
        }

        public string GetHeaderValue(string key)
        {
            var headerobj = this.Request.Headers.FirstOrDefault(x => x.Key.ToLower() == key.ToLower()).Value.FirstOrDefault();
            return String.Format("{0}", headerobj);

        }
        public string GetQueryValue(string key)
        {
            var headerobj = this.Request.Query.FirstOrDefault(i => i.Key.ToLower() == key.ToLower()).Value.FirstOrDefault();
            return String.Format("{0}", headerobj);

        }

        private ClientQuery GetQuery(out string error)
        {
            ClientQuery qry = null;
            error = "";
            var clientquerystr = GetHeaderValue("ClientQuery");

            if (!String.IsNullOrEmpty(clientquerystr))
            {
                try
                {
                    var decodedquerystr = Uri.UnescapeDataString(clientquerystr);
                    qry = Newtonsoft.Json.JsonConvert.DeserializeObject<ClientQuery>(decodedquerystr);

                }
                catch (Exception ex)
                {
                    error = "ClientQuery can't be deserialized: " + ex.ToString();

                }

            }
            return qry;
        }

        private List<ClientQuery> GetQueries(out string error)
        {
            List<ClientQuery> qry = new List<ClientQuery>();
            error = "";
            var clientquerystr = GetHeaderValue("ClientQueries");


            if (!String.IsNullOrEmpty(clientquerystr))
            {
                try
                {
                    var decodedquerystr = Uri.UnescapeDataString(clientquerystr);

                    qry = Newtonsoft.Json.JsonConvert.DeserializeObject<List<ClientQuery>>(decodedquerystr);

                }
                catch (Exception ex)
                {
                    error = "ClientQueries can't be deserialized: " + ex.ToString();

                }

            }
            return qry;
        }

        private static Dictionary<string, Dictionary<string, Dictionary<string, object>>> WebServiceIdentifiers = new Dictionary<string, Dictionary<string, Dictionary<string, object>>>();
        private string WebServiceIdentifier()
        {
            string wsid = GetHeaderValue("WebServiceIdentifier");
            return wsid;
        }

        private bool IsAuthenticated(string webserviceidentifer = "")
        {
            return true;
        }

        private string GetConnectionInfo()
        {
            var sb = new StringBuilder();
            sb.Append("Domain: " + GetDomain() + "; ");
            var domains = new Dictionary<string, Dictionary<string, string>>();
            foreach (var item in ServerApp.Current.Settings.PartnerERPServices)
            {
                if (!domains.ContainsKey(item.Key))
                {
                    domains.Add(item.Key, new Dictionary<string, string>());
                }
                var domaindictionary = domains[item.Key];
                domaindictionary.Add("URL", item.Value);
            }
            var keycontainers = WebServiceIdentifiers.Keys.Select(i => i + "(" + WebServiceIdentifiers[i].Count.ToString() + ")").ToList();
            var connectionstrings = ServerApp.Current.GetConnectionStrings()
                                    .Select(v => v.Key)
                                    .ToList();
            sb.Append("WSID: " + WebServiceIdentifier() + "; ");
            sb.Append("PartnerERPServices: " + ds.ToJson(domains) + "; ");
            sb.Append("KeyContainers: " + Strings.ListToString(keycontainers) + "; ");
            sb.Append("ConnectionStrings: " + Strings.ListToString(connectionstrings) + "; ");
            return sb.ToString();
        }

        public ActionResult CreateResponse<T>(Dictionary<string, Result<T>> result) where T : new()
        {
            var statuscode = StatusCodes.Status200OK;
            var firstresult = result.Values.FirstOrDefault(i => i.Errors.Count > 0);
            if (firstresult != null)
            {
                var firsterror = firstresult.Errors.FirstOrDefault();

                statuscode = StatusCodes.Status500InternalServerError;
                if (firsterror is UnauthorizedAccessException)
                {
                    statuscode = StatusCodes.Status401Unauthorized;

                }
            }
            var response = new JsonResult(result);
            response.StatusCode = statuscode;
            //Response.Headers.Add("DataUpdated", String.Format("{0:yyyy-MM-dd HH:mm:ss}", ServerApp.Current.DataUpdated));

            return response;
        }
        public ActionResult CreateResponse<T>(Result<T> result) where T : new()
        {
            var statuscode = StatusCodes.Status200OK;
            var firsterror = result.Errors.FirstOrDefault();
            if (firsterror != null)
            {
                statuscode = StatusCodes.Status500InternalServerError;
                if (firsterror is UnauthorizedAccessException)
                {
                    statuscode = StatusCodes.Status401Unauthorized;

                }
            }
            var response = new JsonResult(result);
            response.StatusCode = statuscode;
            return response;
        }
        public ActionResult CreateResponse(int statuscode, Object obj)
        {

            var response = new JsonResult(obj);
            response.StatusCode = statuscode;

            return response;
        }

        public ActionResult CreateErrorResponse(string error)
        {
            var statuscode = StatusCodes.Status500InternalServerError;

            var response = new JsonResult(new UnauthorizedAccessException(GetConnectionInfo()));
            response.StatusCode = statuscode;
            return response;
        }
        public ActionResult CreateResponse(Exception ex)
        {
            var statuscode = StatusCodes.Status500InternalServerError;

            var response = new JsonResult(ex);
            response.StatusCode = statuscode;
            return response;
        }
        private ActionResult CreateUnAthorizedResponse()
        {
            //return Request.CreateResponse(HttpStatusCode.Unauthorized, new UnauthorizedAccessException(GetConnectionInfo()));
            var result = new JsonResult(new UnauthorizedAccessException(GetConnectionInfo()));
            result.StatusCode = StatusCodes.Status401Unauthorized;
            return result;
        }
        public async Task<ActionResult> GetClientQueryResultAsync()
        {
            var error = "";
            ActionResult result = null;
            ClientQuery qry = GetQuery(out error);
            if (!String.IsNullOrEmpty(error))
            {
                return CreateResponse(StatusCodes.Status500InternalServerError, error);

            }
            List<ClientQuery> queries = GetQueries(out error);
            if (!String.IsNullOrEmpty(error))
            {
                return CreateResponse(StatusCodes.Status500InternalServerError, error);

            }

            var sb = new StringBuilder();

            if (qry != null)
            {
                //SetQuery(qry, wsid);
                ds.Logics.Handle(qry);
                sb.AppendLine(qry.Info);
                var options = new DbOptions();
                var responsmodelobj = await ds.GetDataAsync(qry, options);
                responsmodelobj.ViewData.Add("QueryLogic", sb.ToString());
                //appdataservice.CloseConnections();
                result = CreateResponse(responsmodelobj);
            }
            else if (queries.Count > 0)
            {
                foreach (var query in queries)
                {
                    //SetQuery(query, wsid);
                    ds.Logics.Handle(query);
                    sb.AppendLine(query.Info);

                }
                var responsmodelobj = await ds.GetMultiDataAsync(queries);
                //appdataservice.CloseConnections();


                result = CreateResponse(responsmodelobj);

            }
            else
            {

                result = CreateErrorResponse("No query found!");

            }
            return result;
        }
        [HttpGet("xclientquery")]
        [Authorize(AuthenticationSchemes = "Bearer", Roles = "Admin")]
        public async Task<ActionResult> ClientQueryAsync()
        {
            string wsid = WebServiceIdentifier();
            if (!IsAuthenticated())
            {

                return CreateResponse(StatusCodes.Status401Unauthorized, wsid);
            }
            if (ds.InitException != null)
            {
                return CreateResponse(ds.InitException);

            }
            ActionResult result;
            if (GetQueryValue("debug") == "1")
            {
                try
                {
                    result = await GetClientQueryResultAsync();
                    var s = ds.ToJson(result);
                }
                catch (Exception ex)
                {
                    result = CreateResponse(ex);
                }
            }
            else
            {
                result = await GetClientQueryResultAsync();

            }
            ds.CloseConnections();
            return result;
        }


        [HttpPost, Route("xclientquery")]
        [Authorize(AuthenticationSchemes = "Bearer", Roles = "Admin")]
        public async Task<ActionResult> ClientQueryAsync(List<ClientQuery> qry)
        {
            string wsid = WebServiceIdentifier();

            if (!IsAuthenticated()) { return CreateUnAthorizedResponse(); }

            var result = await ds.GetMultiDataAsync(qry);

            var response = CreateResponse(result);

            return response;
        }

        [HttpPost, Route("xclientcommand")]
        [Authorize(AuthenticationSchemes = "Bearer", Roles = "Admin")]
        public async Task<ActionResult> ClientCommandAsync([FromBody] List<DataCommand> command)
        {
            ActionResult response = null;
            if (!IsAuthenticated()) { return CreateUnAthorizedResponse(); }

            if (GetQueryValue("debug") == "1")
            {
                try
                {
                    var fcommand = command.Select(i => DataCommand.Create(AppDataService.FixJsonData(i))).ToList();
                    var result = await ds.ExecuteCommandsAsync(fcommand);
                    response = CreateResponse(result);

                    var s = ds.ToJson(response);

                }
                catch (Exception ex)
                {
                    response = CreateResponse(ex);
                }
            }
            else
            {
                var fcommand = command.Select(i => DataCommand.Create(AppDataService.FixJsonData(i))).ToList();
                var result = await ds.ExecuteCommandsAsync(fcommand);
                response = CreateResponse(result);

            }

            ds.CloseConnections();

            return response;
        }


      
    }
}
