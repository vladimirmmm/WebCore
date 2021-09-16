
declare var JsBarcode: Function;
module BaseModel 
{
    export function GetDbCommandForObject(obj, commandname, keys: string = "Id", excludes: string[] = []):any {
        var meta = GetMeta(obj);
        var updateobj = {};
        for (var i = 0; i < meta.Fields.length; i++) {
            var field = meta.Fields[i];
            if (
                !field.IsArray && !field.IsObject 
                && excludes.indexOf(field.MetaKey) == -1
            ) {
                if (field.MetaKey in obj) {
                    var val = obj[field.MetaKey];
                    if (!IsNull(val)) {
                        updateobj[field.MetaKey] = val;
                    }
                }
            }
            updateobj["Keys"] = keys;
            updateobj["TypeName"] = meta.MetaKey;
            updateobj["CommandName"] = commandname;
        }
        FIxUpdateObj(updateobj);
        return updateobj;
    }
    export function GetUpdateCommand(obj, typename, commandname, keys:string="Id", excludes: string[] = ["Id"]) {
        var meta = GetMetaByTypeName(typename);
        var updateobj = {};
        for (var i = 0; i < meta.Fields.length; i++) {
            var field = meta.Fields[i];
            if (
                !field.IsArray && !field.IsObject
                && excludes.indexOf(field.MetaKey) == -1
            ) {
                if (field.MetaKey in obj) {
                    var val = obj[field.MetaKey];
                    if (!IsNull(val)) {
                        updateobj[field.MetaKey] = val;
                    }
                }
            }
            updateobj["Keys"] = keys;
            updateobj["TypeName"] = typename;
            updateobj["CommandName"] = commandname;
        }
        return updateobj;
    }

    export function GetDeleteCommand(typename, id:any) {
        var command = {};
        command["TypeName"] = typename;
        command["CommandName"] = "Delete";
        command["Keys"] = "Id";
        command["Id"] = id;
        return command;
    }

    export function FIxUpdateObj(obj)
    {
        var mt = GetMeta(obj);
        for (var key in obj)
        {
            if (!IsNull(obj[key]) && !IsNull(mt) && (key in mt))
            {
                var pmt = <PropertyMeta>mt[key];
                if (pmt != null && In(pmt.SourceType,"Date"))
                {
                    var d = IsDate(obj[key]) ? obj[key] : StringToDate(obj[key], application.Settings.DateFormat);

                    obj[key] = Format("{0:yyyy-MM-dd}", d);
                }
                if (pmt != null && In(pmt.SourceType, "DateTime")) {
                    var d = IsDate(obj[key]) ? obj[key] : StringToDate(obj[key], application.Settings.DateFormat);

                    obj[key] = Format("{0:yyyy-MM-ddTHH:mm:ss}", d);
                }
                if ( pmt != null && In(pmt.SourceType, "double", "integer", "money")) {
                    obj[key] = Number(obj[key]);

                }
            }
            if (IsNull(obj[key])) {
                delete obj[key];
            } else
            {
                if (IsArray(obj[key])) {
                    for (var i = 0; i < obj[key].length; i++)
                    {
                        FIxUpdateObj(obj[key][i]);
                    }
                }
               
            }

        }
    }

    export function SaveCompanyAddress(element: Element)
    {
        var uiobj = GetBoundObject(element);
        var commands = [];
        var commandname = "INSERT";
        var excludes = ["Id"];
        if (!IsNull(uiobj["Id"])) {
            excludes = [];
            commandname = "UPDATE";
        }
        var updateobj = GetUpdateCommand(uiobj, "CompanyAddress", commandname,"Id", excludes);

        if (!IsNull(uiobj["Address"])) {
            updateobj = GetUpdateCommand(uiobj["Address"], "CompanyAddress", commandname,"Id", excludes);
        }
        updateobj["CompanyId"] = application.Settings.Company["Id"];
        commands.push(updateobj);
        BaseModel.Dependencies.httpClient.Post("~/webui/api/xclientcommand", JSON.stringify(commands),
            function (xhttp: XMLHttpRequest) {
                var data: AppResponse = JSON.parse(xhttp.responseText);
                if (!IsNull(data.Errors) && data.Errors.length == 0)
                {
                    Toast_Success(Res("UI.CompanyAddress.Saved"));
                }
            }, null, "application/json");
    }

    export class Dependencies {
        public static Container(): Element { return null; };
        public static httpClient: HttpClient;
        public static LoadContent(element: Element) { };
        public static ClientValidation: boolean = true;
        public static DataLayer: AppDataLayer = null;
    } 

    export class List extends ListViewModel<any[]>
    {

        public Identifier(): string {
            return Format("{0}_{1}", this.Name, "");
        }

        public Title(): string {
            return Format("{0}", Res("models." + this.LogicalModelName+".Plural"));
        }

        public FormatIdentifier(p: Object): string
        {
            return Format("{0}_{1}", this.Name, "");

        }

        constructor(controller: ModelController)
        {
            super("List", controller);
            var me = this;
           
        }

        public Switch() {
            var me = this;
            me.FilterUIElement = null;
        }

        public Action(p: Object) {
            var me = this;
     
            var parameters = me.GetParameterDictionary(page);
            var page = parameters.page;
            page = isNaN(page) ? 1 : page;
            var viewmodel=this;

            if (me.FilterUIElement == null) {
                var filters =
                    [
                        {
                            Field: "Name",
                            Type: "Text",
                        }

                    ];
                var filterelement = _SelectFirst(".header", viewmodel.UIElement);
                var listelement = _SelectFirst(".generallist", viewmodel.UIElement);
                me.Bind(me.UIElement, {}, { "Filters": filters });
                me.FilterUIElement = _SelectFirst(".filter", viewmodel.UIElement);
            }

            this.Search(page);
        }

        public Search(parameters: SearchParameters = {}) {
            var me = this;
            var viewmodel: View = this;
            parameters = SearchParameters.Ensure(parameters, me.GetParameterDictionary());
            var page = Coalesce(parameters.page, 1);
            var pagesize = me.PageSize();
            var filterelement = _SelectFirst(".filter", me.UIElement);
            var filters = GetFiltersFromUI(filterelement);  

            var query = Coalesce(AppDataLayer.GetQueryByName(me.LogicalModelName + me.Name), AppDataLayer.CreateListQueryByName(me.LogicalModelName));
            query.SetFilters(filters);

            query.GetCount = true;
            query.Skip = (page - 1) * pagesize;
            query.Take = pagesize;
            var pageroptions = {
                page: page,
                pagesize: pagesize,
                urlformat: "#" + me.LogicalModelName+"\\List\\{0}"
            }
            //ShowProgress();
            //return;
            Dependencies.httpClient.GetData(query,
                function (r) {
                    var data = r;
                    var items = <any[]>data["Model"];
                    var count = data["ViewData"]["Count"];
                    me.Model = items;
                    me.Bind(".generallist", me.Model);
                    //BindX(voucherlistelement, items);
                    pageroptions["total"] = count;
                    CreatePager(_SelectFirst(".pager", viewmodel.UIElement), pageroptions);
                    //HideProgress();
                    if (!IsNull(filterelement)) {
                        _AddClass(_SelectFirst('.items.list', filterelement), "hidden");
                    }
             
                    var tableelement = _SelectFirst("table", me.UIElement);
                    resizableGrid(tableelement);
                },
                null);

        }
    }

    export class Details extends ViewModel<any>
    {

        constructor(controller: ModelController) {
            super("Details", controller);
            this.IsMultiInstance = false;
        }
        public Identifier(): string {
            return Format("{0}_{1}", this.Name, this.Model.Id);
        }
        public Title(): string {
            return Format("{0}", this.Model == null ? "" : this.Model.Name);
        }
        public Action(p: Object) {
            var viewmodel = this;
     
            var me = this;
            var query = AppDataLayer.CreateDetailsQueryByName(me.LogicalModelName, Format("{0}", p));
            var meta = GetMetaByTypeName(me.LogicalModelName);

            var dmeta = {
                SimpleFields: [],
                ListFields: [],
                ObjectFields: [],
                IdFields: [],
                TypeName: me.LogicalModelName
            }
            dmeta.IdFields = meta.Fields.Where(i => i.MetaKey.endsWith("Id"));
            dmeta.ObjectFields = meta.Fields.Where(i => i.SourceType.endsWith("{}"));
            dmeta.ListFields = meta.Fields.Where(i => i.SourceType.endsWith("[]"));
            dmeta.SimpleFields = meta.Fields.Where(i =>
                dmeta.IdFields.indexOf(i) == -1
                && dmeta.ListFields.indexOf(i) == -1
                && dmeta.ObjectFields.indexOf(i) == -1
            )
            var load = function () {
                //BindX(viewmodel.UIElement, me.Model);
                me.Bind(viewmodel.UIElement, me.Model, { meta: dmeta});
            }
            if (!IsNull(me.Model) && me.Model.Id == parseInt(p.toString())) {
                load();

            }
            else {
                Dependencies.httpClient.GetData(query,
                    function (r: AppResponse) {

                        me.Model = r.Model.FirstOrDefault();


                        load();
               
                    },
                    null);
            }
        }
    }


    export class Controller extends ModelController {
        constructor() {
            super();
            var me = this;
            this.ModelName = "BaseModel";
            this.Views = [
                new BaseModel.List(me),
                new BaseModel.Details(me),
            ];
            this.Views.forEach(function (v) {
                v.Controller = me;
            });
        }
        public PrepareView(vm: View) {
            var me = this;
            var vmx = <BaseModel.List>vm;

            vmx.Query = AppDataLayer.GetQueryByName(vmx.LogicalModelName + vmx.Name);
            if (vmx.Query == null) {
            }

            //vm.TemplateHtml = vmx.GenerateTemplateHtml(null);
        }
        public Load(vm: View, p: Object, modeltypename: string, area: string): View {
            
            var me = this;
            return me.Open(vm, p, modeltypename,area);
        }
     
        

        public IsAvailable(logicalmodelname: string): boolean
        {
            var me = this;
            var result = true;
            var listquery = Format("{0}List", logicalmodelname);
            var detailsquery = Format("{0}Details", logicalmodelname);
            var meta = GetMetaByTypeName(logicalmodelname);
            if (IsNull(meta))
            {
                result = false;
            }
            //result = IsNull(Dependencies.DataLayer.GetQueryByName(listquery)) ? false : result;
            //result = IsNull(Dependencies.DataLayer.GetQueryByName(detailsquery)) ? false : result;
            return result;
        }

    }
}


AddControllerToApplication(application, new BaseModel.Controller());
