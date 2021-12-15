using ApiModel;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Web;
using DataService;

namespace ArticleApp
{


    public class AspNetCoreServerApp:ServerApp
    {
        private IWebHostEnvironment _hostenvironment = null;
        private IConfiguration _configuration = null;
        
        public AspNetCoreServerApp() { }
        public AspNetCoreServerApp(IWebHostEnvironment env, IConfiguration configuration) {
            _hostenvironment = env;
            _configuration = configuration;
        }
        public override string MapPath(string path)
        {
            var absolutepath = "";
            var rpath = path;
            if (rpath.StartsWith("~/"))
            {
                rpath = rpath.Substring(2);
                rpath = rpath.Replace("/", "\\");
            }
            absolutepath = Path.Combine(_hostenvironment.ContentRootPath+"\\", rpath);
            return absolutepath;
        }

        public override string GetConnectionString(string name)
        {
            var cs = _configuration.GetConnectionString(name);
            return cs; 

        }
        public override Dictionary<string,string> GetConnectionStrings()
        {
            var css = _configuration.GetSection("ConnectionStrings").GetChildren();
            var csd = new Dictionary<string, string>();
            foreach(var cs in css)
            {
                csd.Add(cs.Key, cs.Value);
            }
            return csd;
        }

    }
}