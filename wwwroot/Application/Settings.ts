module Settings {
    import AppDataLayer = webcore.AppDataLayer;
    import AppResponse = webcore.AppResponse;
    import View = webcore.View;
    import ModelController = webcore.ModelController;
    import ViewModel = webcore.ViewModel;
    import AppDependencies = webcore.AppDependencies;
    import AppEvent = webcore.AppEvent;
    function GetParameter(key): any {
        return AppDependencies.GetParameter(key);
    }
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

            let up = me.getCookie('up');
            let upPartial = me.getCookie('upPartial');
            let down = me.getCookie('down');

            me.Bind(viewmodel.UIElement, properties, {
                up: JSON.parse(IsNull(up) ? "[]" : up),
                upPartial: JSON.parse(IsNull(upPartial) ? "[]" : upPartial),
                down: JSON.parse(IsNull(down) ? "[]" : down),
            });

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

        public Refresh(key: string, callback: Function = null) {
            var iscallbacknull = IsNull(callback);
            if (iscallbacknull) {
                callback = () => { };
            }
            var r_ls = function () {
                var wsid = GetParameter("WebServiceIdentifier");
                var dep = application.Settings.DataEntryPoint;
                localStorage.clear();
                application.ReloadSettings();
                application.Settings.DataEntryPoint = dep;
<<<<<<< HEAD
                AppDependencies.SetParameter("WebServiceIdentifier", wsid);
=======
                SetParameter("WebServiceIdentifier", wsid);
>>>>>>> b9b34fe8f309f856b9fcadb8ff80bf1cf3a26643
                callback();
            };
            var r_idb = function () {
                application.RefreshStaticData(function () { if (iscallbacknull) { location.reload(); } }, () => { callback(); });
            }
            var r_fs = function () {
                application.Refresh(function () { window.location.reload(true); callback(); });
            }
            var options = {
                "ALL": function () {
                    application.RefreshStaticData(function () { r_ls(); location.reload(); callback(); })
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
<<<<<<< HEAD
            container.innerHTML = GetHtml2(window["missingresources"]);
=======
            container.innerHTML = GetHtml2(missingresources);
>>>>>>> b9b34fe8f309f856b9fcadb8ff80bf1cf3a26643
        }

        public ExecuteSQL(element: Element) {
            var me = View.GetView(this, element);
            var q1 = (<any>_SelectFirst("#SqlCommand", me.UIElement)).value;
            var connection = (<any>document.getElementById("connection")).value;

            application.httpClient.Post("~/webui/api/xdbquery",
                JSON.stringify({ commandtext: q1, connectionname: connection }),
                function (r) { window["Result"] = JSON.parse(r.responseText); console.log(window["Result"]); },
                function (r) { console.log(r.responseText) },
                "application/json", "", { XKS: GetParameter("XKS") });

        }

        public ExecuteApi(element: Element) {
            var me = View.GetView(this, element);

            var q1 = (<any>_SelectFirst("#ApiCommand")).value;
            var url = (<any>_SelectFirst("#apiurl")).value;
            var method = (<any>_SelectFirst("#apimethod")).value;

            AppDependencies.httpClient.ExecuteApi(url, method, q1, function (xhttp) {
                var response = JSON.parse(xhttp.responseText);
                console.log(response)
            }, function (xhttp) {
                var response = JSON.parse(xhttp.responseText);
                console.log(response)
            });
        }

        public async ExecuteTest(element: Element) {
            var me = this;
            var ta = <HTMLTextAreaElement>_SelectFirst("div[name=test] textarea", me.UIElement);
            //try {
            //var orc = console.error;
            //console.error = function (...data: any[]) {
            //    Toast_Error("Test Error", data.FirstOrDefault());
            //    orc.call(console, data);
            //}
            var oe = window.onerror;
            window.onerror = function (msg, url, lineNo, columnNo, error) {
                // ... handle error ...
<<<<<<< HEAD
                webcore.Toast_Error("Error", <any>msg);
=======
                Toast_Error("Error", <any>msg);
>>>>>>> b9b34fe8f309f856b9fcadb8ff80bf1cf3a26643

                return false;
            }

            await AppDependencies.RunTest(ta.value);
<<<<<<< HEAD
            webcore.LogToast("test", "Test Completed");
=======
            LogToast("test", "Test Completed");
>>>>>>> b9b34fe8f309f856b9fcadb8ff80bf1cf3a26643
            //console.error = orc;
            window.onerror = oe;
            //} catch (ex) {
            //LogToast("error", "Test Completed with error " + ex);

            //}
        }

        public setSettingsParam(key: string, value: boolean | number | string) {
            var val;
            switch (typeof value) {
                case "string": {
                    val = parseInt(value).toString()
                    break;
                }
                case "number": {
                    val = value.toString()
                    break;
                }
                case "boolean": {
                    val = value ? "1" : "0";
                    break;
                }
                default:
                    val = "0";
            }
<<<<<<< HEAD
            AppDependencies.SetParameter(key, val)
=======
            SetParameter(key, val)
>>>>>>> b9b34fe8f309f856b9fcadb8ff80bf1cf3a26643
        }

        public SyncUp(isPartialSyncup: boolean = false) {
            var me = this;
            if (isPartialSyncup) {
                me.AddSync(new Date(), "upPartial")
            } else {
                me.AddSync(new Date(), "up")
            }
        }

        public SyncDown(callback: Function = () => { }) {
            var me = this;
<<<<<<< HEAD
            AppDependencies.SetParameter("DBDate", "")
=======
            SetParameter("DBDate", "")
>>>>>>> b9b34fe8f309f856b9fcadb8ff80bf1cf3a26643
            me.Refresh('IDB', callback)
            me.AddSync(new Date(), "down")
        }

        private AddSync(date: Date, type: string): void {
            var me = this;

            let cookie = me.getCookie(type);
            let cookieobj = [];
            if (!IsNull(cookie)) {
                cookieobj = JSON.parse(cookie);
            }

            cookieobj.push({ Date: FormatDate(new Date(date), "yyyy-MM-dd hh:mm:ss") });

            while (cookieobj.length > 5) {
                cookieobj.shift();
            }

            me.setCookie(type, JSON.stringify(cookieobj));

            var d: Dictionary = {
                screenresolution: screen.width + "*" + screen.height,
                devicePixelRatio: window.devicePixelRatio,
                pixelDepth: window.screen.pixelDepth,
                orientation: JSON.stringify(window.screen.orientation),
                "user-agent": navigator.userAgent
            };
            var properties = GetProperties(d);

            let up = me.getCookie('up');
            let upPartial = me.getCookie('upPartial');
            let down = me.getCookie('down');

            me.Bind(me.UIElement, properties, {
                up: JSON.parse(IsNull(up) ? "[]" : up),
                upPartial: JSON.parse(IsNull(upPartial) ? "[]" : upPartial),
                down: JSON.parse(IsNull(down) ? "[]" : down),
            });
        }

        public UseOffline(checked: boolean) {
            var me = this;
            me.setSettingsParam('UseOffline', checked);
            if (checked) {
                window.location.reload();
            } 
        }

        private setCookie(cname, cvalue) {
            document.cookie = cname + "=" + cvalue + ";path=/";
        }

        public getCookie(cname) {
            var name = cname + "=";
            var decodedCookie = decodeURIComponent(document.cookie);
            var ca = decodedCookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) == 0) {
                    return c.substring(name.length, c.length);
                }
            }
            return "";
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

        }

        public EmptyFields() {
            var me = this;
            var fieldContainer = _SelectFirst(".loginbox", me.UIElement);
            var fields = _Select("input:not([type=button])", fieldContainer);

            fields.forEach((f: HTMLInputElement) => {
                f.value = "";
            })

        }

        public Login() {
            var me = this;
            var loginobj = GetBoundObject(me.UIElement);
            var wsid = loginobj["WSID"];
            var parameters = me.GetParameterDictionary();
            var returnurl = Coalesce(parameters["Url"], "");
            returnurl = Replace(returnurl, "/", "\\");
            returnurl = Coalesce(returnurl, "Home\\Index");
            AppDependencies.SetParameter("WebServiceIdentifier", wsid);
            AppDependencies.SetParameter("Credentials", JSON.stringify(loginobj));
            application.SetCulture(loginobj["Language"]);
            AppDependencies.SetParameter("DBDate", "");

            var success = function (model: any) {

                me.NotifyApplication(AppEvent.Create("Index", "Home", {}));

<<<<<<< HEAD
                webcore.OnAuthenticated(model);
=======
                OnAuthenticated(model);
>>>>>>> b9b34fe8f309f856b9fcadb8ff80bf1cf3a26643
                callasync(me.ShowSplashScreen);
                //window.location.hash = FirstNotNull(me.returnurl, application.Settings.MainHash);
                window.location.hash = "#" + returnurl; //Navigate to the Home page
            }
            application.Authenticate(success);
            me.EmptyFields();
            
        }

        public ShowSplashScreen() {
            var rsx = FirstNotNull(AppDataLayer.Data["Contents"], []);
            var splasharticle = (<ErpApp.Model.Article[]>rsx).FirstOrDefault(i => i.Title == "SplashScreen");
            if (splasharticle != null) {
                var c = document.createElement("div");
                c.setAttribute("class", "modal");
                var builder = [];
                builder.push("<div>");
                builder.push('<span class="icon a-Cancel topleft" onclick="this.parentElement.parentElement.remove()"></span>')
                builder.push(splasharticle.Content);
                builder.push("</div>");
                c.innerHTML = builder.join('\n');
                document.body.appendChild(c);
            }
        }

        public SetLanguage() {
            var me = this;
            var langelement = <HTMLSelectElement>_SelectFirst(".culture", me.UIElement);
            application.Settings.Culture = langelement.value;
            application.SaveSettings();
            location.reload();

        }
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
