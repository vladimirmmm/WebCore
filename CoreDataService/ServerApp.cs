using ApiModel;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using System.IO;
using DataService.Models;

namespace DataService
{
    public class AuthenticationContainer {
        public Dictionary<string, User> UsersByToken = new Dictionary<string, User>();
        public Dictionary<string, Company> CompaniesByToken = new Dictionary<string, Company>();

        public Dictionary<string, User> UsersByUsername = new Dictionary<string, User>();

        public Dictionary<string, User> UsersById = new Dictionary<string, User>();
        public Dictionary<string, Company> CompaniesById = new Dictionary<string, Company>();

        public void AddUserByToken(string token, User u) {
            if (!UsersByToken.ContainsKey(token)) {
                UsersByToken.Add(token, null);
            }
            UsersByToken[token] = u;
        }
        public void AddUser(User u)
        {
            if (!String.IsNullOrEmpty(u.ID))
            {
                if (!UsersById.ContainsKey(u.ID))
                {
                    UsersById.Add(u.ID, null);
                }
                if (!UsersByUsername.ContainsKey(u.UserName))
                {
                    UsersByUsername.Add(u.UserName, null);
                }
                UsersById[u.ID] = u;
                UsersByUsername[u.UserName] = u;
            }
        }
    }
    public abstract class ServerApp 
    {
        public static ServerApp Current =null;
        private AppSettings _Settings = null;
        public AppSettings Settings { get { return _Settings; } }

        public Dictionary<string,DateTime> DataUpdated { get; set; } = new Dictionary<string, DateTime>() { 
        };

        public Dictionary<string, AuthenticationContainer> AuthenticationByDomain = new Dictionary<string, AuthenticationContainer>();
        //public Dictionary<string, User> Users = new Dictionary<string, User>();
        //public Dictionary<string, Company> Companies = new Dictionary<string, Company>();

        public virtual string MapPath(string path) {
            throw new NotImplementedException();
        }
        public virtual string GetConnectionString(string name)
        {
            throw new NotImplementedException();
        }
        public virtual Dictionary<string,string> GetConnectionStrings() { 
            throw new NotImplementedException();
        }
        public void Load()
        {
            var path = MapPath("~/data/serverconfig.json");
            var config = System.IO.File.ReadAllText(path);
            this._Settings = Newtonsoft.Json.JsonConvert.DeserializeObject<AppSettings>(config);
        }
        public void Load(string path)
        {
            var config = System.IO.File.ReadAllText(path);
            this._Settings = Newtonsoft.Json.JsonConvert.DeserializeObject<AppSettings>(config);
        }

    }
    public class WithinBureauTestServerApp : ServerApp
    {
        public override string MapPath(string path)
        {
            var absolutepath = path;
            var rpath = path;
            if (rpath.StartsWith("~/"))
            {
                rpath = rpath.Substring(2);
                rpath = rpath.Replace("/", "\\");
                //absolutepath = Path.Combine(@"C:\My\Developement\DyntellSPA\Partner\ERPAspNetCoreApp\", rpath);
                absolutepath = Path.Combine(AppContext.BaseDirectory, rpath);

            }
            return absolutepath;
        }
        private Dictionary<string, string> _ConnectionStrings = new Dictionary<string, string>()
        {
        };
        public override string GetConnectionString(string name)
        {
            return _ConnectionStrings.ContainsKey(name) ? _ConnectionStrings[name] : null;
        }
        public override Dictionary<string, string> GetConnectionStrings()
        {
            return _ConnectionStrings;
        }
    }

    public class TestServerApp : ServerApp
    {


        public override string MapPath(string path)
        {
            var absolutepath = path;
            var rpath = path;
            if (rpath.StartsWith("~/"))
            {
                rpath = rpath.Substring(2);
                rpath = rpath.Replace("/", "\\");
                absolutepath = Path.Combine(AppContext.BaseDirectory, rpath);

            }
            return absolutepath;
        }
        private Dictionary<string, string> _ConnectionStrings = new Dictionary<string, string>()
        {


        };
        public override string GetConnectionString(string name)
        {
            return _ConnectionStrings.ContainsKey(name) ? _ConnectionStrings[name] : null;
        }
        public override Dictionary<string, string> GetConnectionStrings()
        {
            return _ConnectionStrings;
        }
    }
    public class AppSettings
    {
        private Dictionary<string,string> _PartnerERPServices = new Dictionary<string, string>();
        public Dictionary<string, string> PartnerERPServices { get { return _PartnerERPServices; } set { _PartnerERPServices = value; } }

        public Dictionary<string, SmtpAccount> SmtpAccounts { get; set; }
        public string DefaultNotificationEmail {get;set;}
        
        public string ServerAddress { get;set;}
        public string ChromeExecutable { get;set;}
        public string OutputFolder { get; set;}
        public string Username { get; set;}
        public string UserDomain { get; set;}
        public string Password { get; set;}
        public string Domain { get; set;}
        public bool AllowFullSQL { get; set;}
        public bool IsWebshop { get; set; }
        public string WebshopUserWsid { get; set; }

        public AppSettings() {
            this.ChromeExecutable = @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe";
            this.OutputFolder = @"~/Output/";
            this.SmtpAccounts = new Dictionary<string, SmtpAccount>();
        }

        public void text()
        {
            var d = new Dictionary<string, string>();
            d.Add("", "srfs");
            Console.WriteLine(d[""]);
        }
    }
    
}