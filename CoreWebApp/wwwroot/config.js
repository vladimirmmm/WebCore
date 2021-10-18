var rkey ="?r="+ Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
var base_files = [
    "scripts/iziToast.min.js",
    "scripts/jsforce.min.js",
    "scripts/format.20110630-1100.min.js",
    "scripts/Application.js",
    "UI-version.js" + rkey,
    "css/iziToast.min.css"

];
var base_viewfiles = [
  
];
var otherfiles = [
    "configdata/resources-en.json",
    "configdata/meta.json",
    "configdata/extendedmeta.json",
    "css/FlowUI/flow.css",
    "css/FlowUI/controls.css",
    "css/segoeui.ttf",
    "favicon.png"
];
var d_customfiles = typeof appsettings.CustomFiles !== 'undefined' ? appsettings.CustomFiles : [];
var d_imports = typeof appsettings.Imports !== 'undefined' ? appsettings.Imports : [];
var d_views = typeof appsettings.Views !== 'undefined' ? appsettings.Views : [];
var domain_files = d_customfiles.concat(d_imports).concat(d_views);

var start = async function ()
{
    var response = await fetch("UI-version.js" + rkey, { credentials: 'include' });
    if (response.ok) {
        var text = await response.text();
        var versionstr = text.substring(text.indexOf('"') + 1);
        versionstr = versionstr.substring(0, versionstr.indexOf('"'));
        var lsuiversion = localStorage.getItem("UI_version");
        if (lsuiversion == null || lsuiversion === undefined || lsuiversion == "") {
            localStorage.setItem("UI_version", versionstr);
            console.log("Loading UI (no UI_version)");

            loadresources();
        }
        else
        {
            if (versionstr > lsuiversion) {
                console.log("Reloading UI");
                _RefreshFiles(function () {
                    localStorage.setItem("UI_version", versionstr);
                    loadresources();
                });
            } else
            {
                console.log("UI is up to date");
                loadresources();
            }
        }
        console.log(versionstr);

    }
}


var files = base_files.concat(typeof domain_files !== 'undefined' ? domain_files:[]).concat(otherfiles);

function _isnull(item) {
    //return item == 'undefined' || item == null || (typeof (item) == "string" && item == "");
    return item === undefined || item == null || item === "";
};
var scriptstoload = {};
var allloaded = false;
var checkloaded = function () {
    for (var key in scriptstoload) {
        if (!scriptstoload[key]) {
            return;
        }
    }
    if (!allloaded) {
        allloaded = true;
        var customcommands = ("customuicommands" in window) ? customuicommands : [];
        for (var i = 0; i < customcommands.length; i++) {
            var uicommand = customcommands[i];
            application.RegisterCommand(uicommand);

        }
        application.ScriptsReady();
    }
}
function loadresources() {
    if (typeof document !== 'undefined') {
        var __df = document.createDocumentFragment();
        function AddScriptBySrc(src) {
            var s = GetScriptBySrc(src);
            __df.append(s);
            return s;
        }
        function GetScriptBySrc(src) {
            var s = document.createElement("script");
            s.type = "text/javascript";
            s.src = src;
            s.async = false;
            s.defer = true;
            s.setAttribute("defer","");
            return s
        }

        var lastscript = null;
        var uiversionscript = null;
        var scripts = {};

        for (var i = 0; i < files.length; i++) {
            let src = files[i];
            let srcbase = src;
            if (src.indexOf("?") > -1) {
                srcbase = src.substring(0, src.indexOf("?"));

            }
            if (srcbase.endsWith(".js")) {
                scriptstoload[src] = false;

            }
        }
        for (var i = 0; i < files.length; i++) {
            let src = files[i];
            let srcbase = src;
            if (src.indexOf("?") > -1) {
                srcbase = src.substring(0, src.indexOf("?"));

            }
            if (srcbase.endsWith(".js")) {
                let script = AddScriptBySrc(src);
                script.onload = function () {
                    var src = this.getAttribute("src");
                    //console.log("LOADED " + src);
                    scriptstoload[src] = true;
                    checkloaded();
                }
            }
            if (srcbase.endsWith(".css")) {
                var existing = document.head.querySelector('link[href="' + src + '"]');
                if (existing == null) {
                    var linkelement = document.createElement("link");
                    linkelement.href = src;
                    linkelement.rel = "stylesheet";
                    __df.append(linkelement);
                }
            }
        }

        window.document.head.append(__df);

        var loge = function () { return document.querySelector('#log') };
        ['error', 'warn'].forEach(function (verb) {
            console[verb] = (function (method, verb, log) {
                return function (text) {
                    method(text);
                    // handle distinguishing between methods any way you'd like
                    var msg = document.createElement('code');
                    msg.classList.add(verb);
                    msg.textContent = verb + ': ' + text;
                    if (loge() != null) {
                        loge().appendChild(msg);
                    }
                };
            })(console[verb].bind(console), verb, loge());
        });

        console.log("ui contentloaded");
        if ('serviceWorker' in navigator) {
        
        }
    }
}
function _RefreshFiles(callback)
{
    var appfiles = window["files"];
    var tasks = [];

    var f = function (result, error) {
        if (!_isnull(error)) {
            console.log("error:" + error);

        }
        callback();
    }
    if (Array.isArray(appfiles)) {
        for (var i = 0; i < appfiles.length; i++) {
            var appresource = appfiles[i];
            tasks.push(fetch(appresource, { cache: 'reload', credentials: 'include' }));

        }
        Promise.all(tasks.map(p => p.catch(e => e)))
            .then(results => f(results, "")) // 1,Error: 2,3
            .catch(e => f("", e));
    }

}

start();

