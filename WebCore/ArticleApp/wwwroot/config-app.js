var appsettings = {
    Domain: "Articles",
    Connections: ["App"],
    ClientValidation: true,
    Culture: "ro",
    Cultures: ["ro", "hu", "en"],
    DateTimeFormat: "yyyy-MM-dd hh:mm",
    DateFormat: "yyyy-MM-dd",
    MonetaryFormat: "{0:### ##0.00} {1}",
    QuantityFormat: "### ##0.00",
    DecimalFormat: "### ##0.########",
    DataEntryPoint: "",
    ScanField: "Barcode",
    PageSize: 10,
    CustomFiles: [
        "scripts\\Article\\Article.js",
        "scripts\\Article\\Models.js"
    ],
    Imports: [],
    Views: [
        "layout\\Article.List.razor.html",
        "layout\\Article.Save.razor.html",

    ],
    Employee: null,
    AllowedFeatures: {
     
    },
    RouteSymbols: {
    },
    Navigation: {
            "Key": "Root",
            "Children": [
                {
                    "Key": "ApartmentReservation.List",
                    "Url": "#ApartmentReservation\\List",
                },
                {
                    "Key": "Apartment.List",
                    "Url": "#Apartment\\List",
                },
                {
                    "Key": "Device.List",
                    "Url": "#Device\\List",
                },
                {
                    "Key": "Settings.Login",
                    "Url": "#Settings\\Login",
                }

            ]
    }
};

var domain_files = [
    "config-app.js"
];
var r_key = "?r=" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
var appbaseurl = window.location.origin + "\\";
if (typeof document !== 'undefined') {
    var configscriptelement = document.createElement("script");
    configscriptelement.async = false;
    configscriptelement.defer = true;
    configscriptelement.src = appbaseurl+"config.js" + r_key;
    configscriptelement.type = "text/javascript";
    window.document.head.appendChild(configscriptelement);
}
