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
            ["Partner"]=DateTime.Now,
            ["PartnerApp"]=DateTime.Now
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
            ["ADIX_Partner"] = "Server=192.168.88.27;port=3050; Database=ADIX; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["ADRIATIC_Partner"] = "Server=192.168.88.27;port=3050; Database=ADRIATIC; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["AGROVIR_Partner"] = "Server=192.168.88.27;port=3050; Database=EASTGRAIN; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["ALSENA_Partner"] = "Server=192.168.88.27;port=3050; Database=ALSENA2; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["ANIMA_Partner"] = "Server=192.168.88.27;port=3050; Database=ANIMA; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["B2B_Partner"] = "Server=192.168.88.27;port=3050; Database=B2B; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["BAUKNECHT_Partner"] = "Server=192.168.88.27;port=3050; Database=BAUKNECHT; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["CRAINIC_Partner"] = "Server=192.168.88.27;port=3050; Database=CRAINIC; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["EASTGRAIN_Partner"] = "Server=192.168.88.27;port=3050; Database=EASTGRAIN; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["ERDFA_Partner"] = "Server=192.168.88.27;port=3050; Database=ERDFA; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["GORETTI_Partner"] = "Server=192.168.88.27;port=3050; Database=GORETTI; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["MGA_Partner"] = "Server=192.168.88.27;port=3050; Database=MGA; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["MGA_PartnerDocument"] = "Server = 192.168.88.27; port=3050; Database=MGA_DOCUMENT; User=PANNON; Password=Ebv3fv; Charset=WIN1250;Pooling=false;",
            ["PASMATEX_Partner"] = "Server=192.168.88.27;port=3050; Database=PASMATEX_LIVE; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["PASMATEX_SIGNALLOG"] = "Server=192.168.88.31;Database=upon_signal;Uid=upon_signal2;Pwd=vSPyyex5DE9LFeY6;",
            ["PIERA_Partner"] = "character set=WIN1250;data source=192.168.88.27;port=3050;initial catalog=PIERA;user id=pannon;password=Ebv3fv;Pooling=false;",
            ["VENTUM_Partner"] = "character set=WIN1250;data source=192.168.88.27;port=3050;initial catalog=VENTUM;user id=pannon;password=Ebv3fv;Pooling=false;",
            ["ROTAPRINT_Partner"] = "Server=192.168.88.27;port=3050; Database=rotaprint; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["SERVICE_Partner"] = "Server=192.168.88.27;port=3050; Database=SEIV; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            
            ["Partner"] = "character set=WIN1250;data source=192.168.88.27;port=3050;initial catalog=MGA;user id=pannon;password=Ebv3fv;Pooling=false;",
            ["PartnerApp"] = "data source=DESKTOP-EMT79AQ\\SQLEXPRESS; initial catalog=PartnerApp;persist security info=True; User ID=partnerapp;Password=K4hvd_;Pooling=false;"
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

    public class PasmatexTestServerApp : ServerApp
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
            //["Partner"] = "character set=WIN1250;data source=82.78.35.92;port=3050;initial catalog=MGA;user id=pannon;password=Ebv3fv;Pooling=false;",
            ["PASMATEX_Partner"] = "Server=192.168.88.27;port=3050; Database=PASMATEX_LIVE; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["PASMATEX_SIGNALLOG"] = "Server=192.168.33.5;port=13306;Database=upon_signal;Uid=upon_signal2;Pwd=vSPyyex5DE9LFeY6;",
            ["Partner"] = "character set=WIN1250;data source=192.168.88.27;port=3050;initial catalog=MGA;user id=pannon;password=Ebv3fv;Pooling=false;",
            ["PartnerApp"] = "data source=ERP\\SQLEXPRESS; initial catalog=PartnerApp;persist security info=True; User ID=partnerapp;Password=K4hvd_;"
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
            //["Partner"] = "character set=WIN1250;data source=82.78.35.92;port=3050;initial catalog=MGA;user id=pannon;password=Ebv3fv;Pooling=false;",
            ["B2B_Partner"] = "Server=82.78.35.92;port=3050; Database=B2B; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["PASMATEX_Partner"] = "Server=82.78.35.92;port=3050; Database=PASMATEX_LIVE; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["BAUKNECHT_Partner"] = "Server=82.78.35.92;port=3050; Database=BAUKNECHT; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["ELECTROMEN_Partner"] = "Server=82.78.35.92;port=3050; Database=ELECTROMEN; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["PIERA_Partner"] = "Server=82.78.35.92;port=3050; Database=PIERA; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["PASMATEX_SIGNALLOG"] = "Server=82.78.35.92;Database=signaldb;Uid=root;Pwd=Dyntellsrv2019;",
            ["MGA_Partner"] = "Server=82.78.35.92;port=3050; Database=MGA; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["ALSENA_Partner"] = "Server=82.78.35.92;port=3050; Database=ALSENA2; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["CRAINIC_Partner"] = "Server=82.78.35.92;port=3050; Database=CRAINIC; User=PANNON; Password=Ebv3fv; Charset=WIN1250;Pooling=false;",
            ["EASTGRAIN_Partner"] = "Server=82.78.35.92;port=3050; Database=partner_EGRO; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["AGROVIR_Partner"] = "Server=82.78.35.92;port=3050; Database=EASTGRAIN; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["ERDFA_Partner"] = "Server=82.78.35.92;port=3050; Database=ERDFA; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["ADIX_Partner"] = "Server=82.78.35.92;port=3050; Database=ADIX; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["GORETTI_Partner"] = "Server=82.78.35.92;port=3050; Database=GORETTI; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["ADRIATIC_Partner"] = "Server=82.78.35.92;port=3050; Database=ADRIATIC; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["SERVICE_Partner"] = "Server=82.78.35.92;port=3050; Database=SEIV; User=PANNON; Password=Ebv3fv; Charset=WIN1250;",
            ["MGA_PartnerDocument"] = "Server = 82.78.35.92; port=3050; Database=MGA_DOCUMENT; User=PANNON; Password=Ebv3fv; Charset=WIN1250;Pooling=false;",
            ["Partner"] = "character set=WIN1250;data source=82.78.35.92;port=3050;initial catalog=MGA;user id=pannon;password=Ebv3fv;Pooling=false;",
            ["PartnerApp"] = "data source=82.78.35.92\\SQLEXPRESS; initial catalog=PartnerApp;persist security info=True; User ID=partnerapp;Password=K4hvd_;"


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