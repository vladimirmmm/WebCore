using ApiModel.Query;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace ApiModel
{
    public interface IDataService
    {
        long SessionId { get; }
        bool IsAuthenticated(Dictionary<string, object> credentials);
        Result<List<Dictionary<string, object>>> Authenticate(Dictionary<string, string> credentials);

        void EnsureOpenedConnection(DbOptions context);
        void EnsureOpenedConnection(DbConnection connection);
        DbQuery GetQueryByName(string name);
        DbQuery GetQueryByTypeName(string typename);
        QueryService GetQueryService();
        string MapPath(string path);
        TypedDataProvider GetProvider(string TypeName);

        Dictionary<string,Func<TypedDataProvider>> GetProviders();

        void RegisterTypedDataProvider(string name, string typename, string connectionstring = "");
        Task<Result<Dictionary<string, object>>> GetDataByIdAsync(string queryname, object id, IEnumerable<string> fields, DbTransaction transaction);
        Task<Result<List<Dictionary<string, object>>>> GetDataAsync(ClientQuery clientquery,DbOptions options);
        Task<Result<List<Dictionary<string, object>>>> GetDataAsync(SelectStatement selectstatement,string connectionname);
        Task<Dictionary<string, Result<List<Dictionary<string, object>>>>> GetMultiDataAsync(List<ClientQuery> clientqueries);
        Task<Result<List<Result<StandardDictionary>>>> ExecuteCommandsAsync(List<DataCommand> commands);
        //Result<List<Dictionary<string, object>>> ExecuteApi(string baseurl, string method, string data, Dictionary<string, string> headers, Company company=null);
        Task<Result<List<Dictionary<string, object>>>> ExecuteApiAsync(string baseurl, string method, string data, Dictionary<string, string> headers, Company company = null);
        
        void DataModified(string key = null);
        HttpClient GetHttpClient(string name = null);
        DbConnection GetConnection(string connectionname);
        DbConnection GetConnectionForTypeName(string TypeName);
        DbConnection GetConnectionForProvider(TypedDataProvider provider);
        User GetUser();
        Company GetCompany();
        Company GetAdminCompany();

        bool IsAdmin();
        string ERPAuthorization();
        string GetDomain();
        string GetBaseUrl();
        string ToJson(object item);
        void RestoreModel(Dictionary<string, object> item);
        Dictionary<string,object> ParseJson(string item);
        T ParseJsonTo<T>(string item);
        void SaveFile(string filepath, Stream stream);
        Result<StringObject> SendMail(EmailMessage msg);
        Task<Result<StringObject>> SendMailAsync(EmailMessage msg);
    }
}
