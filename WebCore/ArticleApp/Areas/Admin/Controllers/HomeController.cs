using Core.Controllers;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;

namespace ArticleApp.Areas.Admin.Controllers
{
    public class HomeController : CoreController
    {
        public HomeController(ILogger<Controller> logger, IHttpClientFactory httpClientFactory, UserManager<IdentityUser> userManager, SignInManager<IdentityUser> signInManager, IConfiguration configuration) : base(logger, httpClientFactory, userManager, signInManager, configuration)
        {

        }
        public IActionResult Index()
        {
            return View();
        }
    }
}
