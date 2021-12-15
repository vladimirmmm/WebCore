module Settings {
    export class List extends ViewModel<object>
    {
        public Identifier(): string {
            return "Settings";
        } 

        public Title(): string {
            return Res("general.Settings");
        }
        constructor(controller: ModelController) {
            super("List", controller);
        }
        public Action(p: Object) {
            var viewmodel = this;
            var me = this;


            var d: Dictionary =
            {
                screenresolution: screen.width + "*" + screen.height,
                devicePixelRatio: window.devicePixelRatio,
                pixelDepth: window.screen.pixelDepth,
                orientation: JSON.stringify(window.screen.orientation),
                "user-agent": navigator.userAgent
            };
            var properties = GetProperties(d);
            //BindX(viewmodel.UIElement, properties);
            me.Bind(viewmodel.UIElement, properties);

            var langelement = <HTMLSelectElement>_SelectFirst(".culture", me.UIElement);
            langelement.innerHTML = "";
            var cultures = FirstNotNull(application.Settings.Cultures, []);
            var currentoption: HTMLOptionElement = null;
            cultures.forEach(function (item) {
                var option = <HTMLOptionElement>document.createElement("option");
                if (item == application.Settings.Culture) {
                    currentoption = option;
                }
                option.text = Res("general.languages." + item);
                option.value = item;
                langelement.add(option);
            });
            if (currentoption != null) {
                currentoption.selected = true;
            }

            var label = document.querySelector("span.WebServiceIdentifier");
            var wsid = GetParameter("WebServiceIdentifier");
            if (!IsNull(wsid)) {
                var wsidcontrol = <HTMLInputElement>document.querySelector("#WebServiceIdentifier");

                var maskedwsid = Format("{0}**********", wsid.substring(0, 7));
                wsidcontrol.value = maskedwsid;
            }

            var datentrycontrol = <HTMLInputElement>document.querySelector("#DataEntryPoint");
            datentrycontrol.value = application.Settings.DataEntryPoint;
            var resourcesdiv = _SelectFirst(".resourcelist", me.UIElement);
            var resourcebuilder = [];
            var resourcefilename = "resources-" + application.Settings.Culture + ".json";
            var resourcefiles = ["configdata\\" + resourcefilename];
            resourcefiles = resourcefiles.concat(application.Settings.CustomFiles.Where(i => i.endsWith(resourcefilename)));
            resourcefiles.forEach(function (file) {
                var filename = file.substring(file.lastIndexOf("\\") + 1);
                resourcebuilder.push(Format('<a href="{1}" target="_blank">{0}</a>', filename, file))

            });
            resourcesdiv.innerHTML = resourcebuilder.join("\n");
            viewmodel.AfterBind();
        }

        public Refresh(key: string) {
            var r_ls = function () {
                var wsid = GetParameter("WebServiceIdentifier");
                var dep = application.Settings.DataEntryPoint;
                localStorage.clear();
                application.ReloadSettings();
                application.Settings.DataEntryPoint = dep;
                SetParameter("WebServiceIdentifier", wsid);
            };
            var r_idb = function () {
                application.RefreshStaticData(function () { location.reload(); });

            }
            var r_fs = function () {
        
                application.Refresh(function () { window.location.reload(); });

            }
            var options = {
                "ALL": function () {
                    application.RefreshStaticData(function () { r_ls(); location.reload(); });
                },
                "IDB": r_idb,
                "LS": r_ls,
                "FS": r_fs
            };
            if (key in options) {
                console.log('Refreshing ' + key)
                options[key]();
            }
        }

        public SetLanguage() {
            var me = this;
            var langelement = <HTMLSelectElement>_SelectFirst(".culture", me.UIElement);
            application.Settings.Culture = langelement.value;
            application.SaveSettings();
            location.reload();

        }
        public ShowSettings() {
            var me = this;
            var container = _SelectFirst(".appsettings", me.UIElement);
            container.innerHTML = GetHtml2(application.Settings);
        }

        public GetDbLayout() {
            AppDependencies.httpClient.Get("~/webui/api/xdblayout?commandtext=", {}, function (r: XMLHttpRequest) {
                var response = <AppResponse>JSON.parse(r.responseText);
                download("DBLayouts.json", response.Model);

            }, function (r: XMLHttpRequest) {
                var response = <AppResponse>JSON.parse(r.responseText);
                var datalink = Format('data:application/octet-stream;charset=utf-8,{0}', encodeURIComponent(JSON.stringify(response.Model, null, 4)));

                download("DBLayouts.json", datalink);

            });
        }

        public GetResourceCsv() {
            var namedresources = application.Resources.Cultures[application.Settings.Culture];
            var resources = application.Resources[application.Settings.Culture];
            var head = ["Key", "Dyntell", "Customisation"];
            var csv = [];
            for (var key in resources) {
                var line = [];
                line.push(key);
                for (var nkey in namedresources) {
                    var nc = namedresources[nkey];
                    line.push(nc[key]);
                }
                csv.push(line);
                //csv.push('"' + line.join('","') + '"');
            }
            csv = csv.sort(getStringCompareFunction(p => p[0]));
            var csvbuilder = [];
            csvbuilder.push(head.join(","));
            for (var i = 0; i < csv.length; i++) {
                var linestr = csv[i];
                csvbuilder.push('"' + linestr.join('","') + '"');
            }
            var csvcontent = csvbuilder.join("\n");
            console.log(csvcontent);
        }

        public ShowMissingResources() {
            var me = this;
            var container = _SelectFirst(".missingresources", me.UIElement);
            container.innerHTML = GetHtml2(missingresources);
        }

        public ExecuteSQL(element: Element) {
            var me = View.GetView(this, element);
            var q1 = (<any>_SelectFirst("#SqlCommand", me.UIElement)).value;
            var connection = (<any>document.getElementById("connection")).value;

            application.httpClient.Post("~/webui/api/xdbquery",
                JSON.stringify({ commandtext: q1, connectionname: connection }),
                function (r) { window["Result"] = JSON.parse(r.responseText); console.log(window["Result"]); },
                function (r) { console.log(r.responseText) },
                "application/json");

        }

        public ExecuteApi(element: Element) {
            var me = View.GetView(this, element);

            var q1 = (<any>_SelectFirst("#ApiCommand")).value;
            var url = (<any>_SelectFirst("#apiurl")).value;
            var method = (<any>_SelectFirst("#apimethod")).value;

            //AppDependencies.httpClient.ExecuteApi(url, method, q1, function (xhttp) {
            //    var response = JSON.parse(xhttp.responseText);
            //    console.log(response)
            //}, function (xhttp) {
            //    var response = JSON.parse(xhttp.responseText);
            //    console.log(response)
            //});
        }
    }

    export class Login extends ViewModel<object>
    {
        private returnurl: string = "";
        public Identifier(): string {
            return "Login";
        }

        public Title(): string {
            return Res("general.Login");
        }
        public FormatIdentifier(p: Object): string {
            return Format("{0}_{1}", this.Name, "");
        }
        constructor(controller: ModelController) {
            super("Login", controller);
            this.IsMultiInstance = false;

        }
        public Action(p: Object) {
            var me = this;
            me.returnurl = decodeURI(Format("{0}", p));
            me.Model = {};
            me.Bind(me.UIElement, me.Model);

            var langelement = <HTMLSelectElement>_SelectFirst(".culture", me.UIElement);
            langelement.innerHTML = "";
            var cultures = FirstNotNull(application.Settings.Cultures, []);
            cultures.forEach(function (item) {
                var option = document.createElement("option");
                option.text = Res("general.languages." + item);
                option.value = item;
                langelement.add(option);
            });
            //BindX(me.UIElement, me.Model);
            //me.AfterBind();

        }

        public Login()
        {
            var me = this;
            var loginobj = GetBoundObject(me.UIElement);
            var wsid = loginobj["WSID"];
            var uname = loginobj["Username"];
            var pw = loginobj["Password"];
            SetParameter("WebServiceIdentifier", wsid);
            SetParameter("UserName", uname);
            SetParameter("Password", pw);
            application.SetCulture(loginobj["Language"]);
            var success = function (model:any)
            {
                OnAuthenticated(model);
                callasync(me.ShowSplashScreen);
                window.location.hash = FirstNotNull(me.returnurl, application.Settings.MainHash);
            }
            application.Authenticate(success);
            
        }
     
        public ShowSplashScreen()
        {
            var rsx = FirstNotNull(AppDataLayer.Data["Contents"], []);
            var splasharticle = (<any[]>rsx).FirstOrDefault(i => i.Title == "SplashScreen");
            if (splasharticle != null)
            {
                var c = document.createElement("div");
                c.setAttribute("class", "modal");
                var builder = [];
                builder.push("<div>");
                builder.push('<span class="icon entypo-cancel topleft" onclick="this.parentElement.parentElement.remove()"></span>')
                builder.push(splasharticle.Content);
                builder.push("</div>");
                c.innerHTML = builder.join('\n');
                document.body.appendChild(c);
            }
        }

        //public GetActions(): AppUICommand[]
        //{
        //    return [];
        //}
    }
    export class Controller extends ModelController {
        constructor() {
            super();
            var me = this;
            this.ModelName = "Settings";
            this.Views = [
                new Settings.List(me),
                new Settings.Login(me)
            ];
            this.Views.forEach(function (v) {
                v.Controller = me;
            });
        }

    }
}

AddControllerToApplication(application, new Settings.Controller());
