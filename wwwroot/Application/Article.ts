declare var tinymce: any;
import webcore = WebCore;
module Common.Article {
    import AppDataLayer = webcore.AppDataLayer;
    import BaseModel = webcore.BaseModel;
    import AppResponse = webcore.AppResponse;
    import View = webcore.View;
    import ModelController = webcore.ModelController;
    import ListViewModel = webcore.ListViewModel;
    import ViewModel = webcore.ViewModel;
    import AppUICommand = webcore.AppUICommand;
    import SearchParameters = webcore.SearchParameters;
    import AppDependencies = webcore.AppDependencies;
    
     
    export class List extends WebCore.ListViewModel<ErpApp.Model.Article[]>
    {
<<<<<<< HEAD
        public Identifier(): string { 
=======
        public Identifier(): string {
>>>>>>> b9b34fe8f309f856b9fcadb8ff80bf1cf3a26643
            return Format("{0}_{1}", this.Name, this.Area);
        }

        public Title(): string {
            var parameters = this.GetParameterDictionary();
            var typestr = IsNull(parameters.type) ? "Plural" : parameters.type;
            return Format("{0}", Res("models.Article." + typestr));
        }

        public FormatIdentifier(p: any, area: string = ""): string {
            var parameters = this.GetParameterDictionary(p);
            return Format("{0}_{1}_{2}", this.Name, area, parameters.type);

        }
        constructor(controller: WebCore.ModelController) {
            super("List", controller);
        }
        public Action(p: Object) {
            var viewmodel = this;
            var me = this;
            me.Bind(me.UIElement, {});

            var parameters = me.GetParameterDictionary(p);
     
            var titleelement = _SelectFirst("h2", viewmodel.UIElement);
            titleelement.innerHTML = Res("UI.Article." + parameters.type); 


            me.FilterUIElement = _SelectFirst(".filter", viewmodel.UIElement);

         
            this.Search(); 

        }

        public Search(parameters: SearchParameters = {}) {
            var me = this;
            parameters = SearchParameters.Ensure(parameters, me.GetParameterDictionary());
            var page = Coalesce(parameters.page, 1);
            var paramfilters = [];
            var code = parameters.type; 
            if (!IsNull(code)) {
                paramfilters = ClientFilter.Create(UIDataType.Text, "Category.Code", "[" + code + "]")

            }
            page = parseInt(parameters.page);
            page = isNaN(page) ? 1 : page;
            var pagesize = me.PageSize();
            var viewmodel: View = this;
            var listelement = _SelectFirst(".body", viewmodel.UIElement)
            //_Hide(voucherlistelement);
            var filterelement = _SelectFirst(".filter", me.UIElement);

            var uifilters = GetFiltersFromUI(filterelement);

            //var query = <any>{ TypeName: "Article" };
            var pageroptions = {
                page: page,
                pagesize: pagesize,
                urlformat: "#Article\\List\\" + code+"-{0}"
            }
            //ShowProgress();
            var query = AppDataLayer.CreateListQueryByName("Article");
            query.SetFields(["Category.Id", "Category.Title", "Category.Code","Translations.*"]);
            query.SetFilters(uifilters);
            query.SetFilters(paramfilters);
            query.Skip = (page - 1) * pagesize;
            query.Take = pagesize;
            query.GetCount = true;
            query.Ordering = {"Id":"DESC"};
            AppDependencies.httpClient.GetData(
                query,
                function (r: AppResponse) {
                    me.Model = <any>r.Model;
                    var count = r.ViewData["Count"];

                    me.Bind(".body", me.Model);
                    pageroptions["total"] = count;
                    CreatePager(_SelectFirst(".pager", viewmodel.UIElement), pageroptions);
                });

        }

    }

    export class Details extends ViewModel<ErpApp.Model.Article>
    {
        public Identifier(): string {
            return Format("{0}_{1}", this.Name, this.Model.Id);
        }
        public Title(): string {
            return Format("{0}", this.Model == null ? "" : this.Model.Title);
        }
        constructor(controller: ModelController) {
            super("Details", controller);
        }
        public Action(p: Object) {
            var me = this;
            var id = Format("{0}", p);
            var load = function () {
                me.Bind(me.UIElement, me.Model);
    
            }
            if (!IsNull(me.Model) && me.Model.Id == id) {
                load();
            }
            else {

                var query = AppDataLayer.CreateDetailsQueryByName("Article", id);
                AppDependencies.httpClient.GetData(
                    query,
                    function (r: AppResponse) {
                        me.Model = r.Model.FirstOrDefault();
                        load();
                    });
            }
        }
    }

    export class Save extends ViewModel<ErpApp.Model.Article>
    {
        
        private Files: FileData[] = [];

        constructor(controller: ModelController) {
            super("Save", controller);
            this.IsMultiInstance = true;
            var me = this;

            var commandobj = {
                Key: "Create",
                AppearsIn: ["header"],
                Prefix:"v-",
                IsInContext: function (model, view) {
                    var route = application.GetRouteProperties();
                    if (application.IsAdmin())
                    {
                        return view.Name == "List";
                    }
                    return false;
                },
                Render: function (model, view) {
                    var parameters = me.GetParameterDictionary()
                    var labeltext = Res("UI.Commands.v-Create");
                    var html = Format('<a class="icon v-Create" href="#Admin\\Article\\Save\\{0}-"><label>{1}</label></a>', parameters.type, labeltext);
                    return html;
                }
            }
            controller.RegisterCommand(AppUICommand.CreateFrom(commandobj));


        }
        public Identifier(): string {
            return Format("{0}_{1}", this.Name, this.Model.Id);
        }
        private _Title: string = "";
        public Title(): string {
            var parameters = this.GetParameterDictionary();
            var typestr = IsNull(parameters.type) ? "Plural" : parameters.type;
            var title = Access(this, "Model.Title");
            return Format("{0} {1}", Res("general.New"), FirstNotNull(title, Res("UI.Article." + typestr)));
        }

        public Action(p: any) {
            var me = this;
            var parameters = me.GetParameterDictionary(p);


            var id = parameters.id; 

            var me = this;
            //var query = <any>{ TypeName: "Article", Id: pstr};


            var load = function () {
                me.Bind(me.UIElement, me.Model);

                var htmleditors = _Select(".htmleditor", me.UIElement);
                if (htmleditors.length > 0) {
                    var tinyscriptelement = <HTMLScriptElement>_SelectFirst("#tinyscript");
                    if (IsNull(tinyscriptelement)) {
                        tinyscriptelement = <HTMLScriptElement>document.createElement('script');
                        tinyscriptelement.src = "tinymce/tinymce.min.js";
                        tinyscriptelement.id = "tinyscript";
                        tinyscriptelement.type = "text/javascript";
                        document.head.appendChild(tinyscriptelement);
                        tinyscriptelement.onload = function () { tinymce.init({ selector: '.htmleditor' }) };
                    } else {
                        tinymce.init({ selector: '.htmleditor' });
                    }
                }
            }
            if (!IsNull(me.Model) && me.Model.Id == id) {
                load(); 
            }
            else {
                if (IsNull(id)) {
                    me.Model = <ErpApp.Model.Article>{ TypeName: "Article" };
                    if (!IsNull(parameters.type)) {
                        var category = AppDataLayer.Data.AppCategorys.FirstOrDefault(i => i.Code == parameters.type);
                        if (category != null)
                        {
                            me.Model.CategoryId = category.Id;
                            me.Model.Category = category;
                        }
                    }
                    load();
                    me.AfterBind();
                } else {
                    var query = AppDataLayer.CreateDetailsQueryByName("Article", id);
                    query.SetField("Category.*");
                    AppDependencies.httpClient.GetData(
                        query,
                        function (r: AppResponse) {
                            me.Model = r.Model.FirstOrDefault();
                            //BindX(me.UIElement, me.Model);
                            load();
                            me.AfterBind();
                        });
                }
            }


        }

        public HandleUploadedFiles(element: Element) {
            var me = <Common.Article.Save>view(element);
            var files = (<HTMLInputElement>event.target).files;
            var filecontainer = _SelectFirst(".files", me.UIElement);
            var imageurlelement = <HTMLInputElement>_SelectFirst("[bind=ImageUrl]", me.UIElement)
            var GetThumbnailFilename = function (filename: any): string
            {
                return Format("thmbn.{0}", filename);
            }
            var AddFile = function (p: any)
            {
                var divelement = document.createElement("div");
                filecontainer.appendChild(divelement);
                divelement.classList.add("file");
                var img = <HTMLImageElement>document.createElement("img");
                img.src = "images/file_256x256-32.png";
                divelement.appendChild(img);
                var label = document.createElement("label");
                divelement.appendChild(label);
                divelement.setAttribute("filename", p.filename);
                var deletebutton = document.createElement("span");
                deletebutton.classList.add("button");
                deletebutton.classList.add("delete");
                deletebutton.classList.add("a-Cancel");
                divelement.appendChild(deletebutton);
                divelement.addEventListener("click", function (e: MouseEvent) {
                    var targetlement = (<HTMLElement>e.target);
                    var el = targetlement.parentElement;

                    if (targetlement.classList.contains("delete")) {
                        var filename = el.getAttribute("filename");
                        var thumbnailfilename = GetThumbnailFilename(p.filename);
                        var files = me.Files.Where(i => i.Filename == thumbnailfilename || i.Filename == filename);
                        for (var i = 0; i < files.length; i++)
                        {
                            RemoveFrom(files[i], me.Files);
                        }
                        if (imageurlelement.value == thumbnailfilename) {
                            imageurlelement.value = "";
                            var imagefile = me.Files.FirstOrDefault(i => i.Type.match(/image.*/));
                            if (imagefile != null) {
                                var thumbfilename = imagefile.Filename.startsWith("thmbn.") ? thumbfilename : GetThumbnailFilename(imagefile.Filename);
                                imageurlelement.value = thumbfilename;
                            }
                        }
                        el.remove();
                        return;
                    }
                    if (p.type.match(/image.*/)) {
                        var spanelement = _SelectFirst("span", el);
                        imageurlelement.value = spanelement.getAttribute("clickvalue");
                    }
                });
                if (p.type.match(/image.*/)) {
                    var thumbnailfilename =GetThumbnailFilename(p.filename);
                    img.setAttribute("src", p.url);
                 
                    var fd = new FileData();
                    fd.File = p.blob;
                    fd.Filename = thumbnailfilename;
                    fd.Type = p.type;
                    me.Files.push(fd);
                    if (IsNull(imageurlelement.value)) {
                        imageurlelement.value = thumbnailfilename;

                    }
                    label.setAttribute("clickvalue", thumbnailfilename);
                }
              
                label.innerHTML = p.filename;
            }
            for (var i = 0; i < files.length; i++)
            {
                var file = files[i];

                if (file.type.match(/image.*/)) {
                    ResizeImages(file, 150, AddFile)
                }
                else
                {
                    AddFile({ type: file.type, filename:file.name });
                }
                var fd = new FileData();
                fd.File = file;
                fd.Filename = file.name;
                fd.Type = file.type;
                me.Files.push(fd);
            }
        }

        public SavePost(element: Element) {
            var me = this;
            var obj: ErpApp.Model.Article = <any>GetBoundObject(me.UIElement);
       
            var fileuploader = <HTMLInputElement>_SelectFirst(".fileuploader", me.UIElement);
            //var files = IsNull(fileuploader) ? [] : fileuploader.files;
            var files = me.Files;
            var formdata = new FormData();
            var hasfile = files.length > 0;
            //var file;
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                formdata.append("file" + i.toString(), file.File, file.Filename);
            }
            var command = "INSERT";
            if (_SelectFirst(".htmleditor", me.UIElement) != null) {
                obj.Content = tinymce.activeEditor.getContent();
            }
            var model = <ErpApp.Model.Article>JsonCopy(me.Model);
            MapObject(obj, model);
            var updateobj = BaseModel.GetUpdateCommand(model, "Article", command);
            var commandmessage = "created";
            if (!IsNull(me.Model.Id))
            {
                command = "UPDATE";
                updateobj = BaseModel.GetUpdateCommand(model, "Article", command);
                updateobj["Id"] = me.Model.Id;
                var commandmessage = "saved";

            }
            var category = AppDataLayer.Data["AppCategorys"].FirstOrDefault(i => i.Id == model.CategoryId);
  
            updateobj["Keys"] = "Id";
            var commands = [updateobj];
            formdata.append("commands", JSON.stringify(commands));
            AppDependencies.httpClient.PostOld("~/webui/api/xclientcommandmultipart", formdata,
                function (xhttp: XMLHttpRequest) {
                    var response = <AppResponse>JSON.parse(xhttp.responseText);
                    var model = IsArray(response.Model) ? response.Model.FirstOrDefault() : response.Model;
                    var id = model["Model"]["Value"];
                    var itemlink = Format('<a href="#Article\\Details\\{0}">{1}</a>', id, id)

                    if (command == "INSERT") {
                        commandmessage = "Article " + itemlink + " was created successfully"
                    } else {
                        commandmessage = "Article was saved successfully"
                    }
<<<<<<< HEAD
                    webcore.Toast_Success(commandmessage);
=======
                    Toast_Success(commandmessage);
>>>>>>> b9b34fe8f309f856b9fcadb8ff80bf1cf3a26643
                },
                null,
                null);
            
        }

        public AddCategory()
        {
            var category = { Id:5, Code: "CNT", Title: "Content" };
            var updateobj = BaseModel.GetUpdateCommand(category, "AppCategory", "UPDATE");
            updateobj["Keys"] = "Id";
            updateobj["Id"] = category.Id;
            AppDependencies.httpClient.Post("~/webui/api/xclientcommand", JSON.stringify([updateobj]),
                function (xhttp: XMLHttpRequest) {
                    var response = <AppResponse>JSON.parse(xhttp.responseText);
                    var model = response.Model.FirstOrDefault();
                    var id = model.Model["Value"]
<<<<<<< HEAD
                    webcore.Toast_Success("Category added", id);
=======
                    Toast_Success("Category added", id);
>>>>>>> b9b34fe8f309f856b9fcadb8ff80bf1cf3a26643
                },
                null,
                "application/json");

        }
    }

    export class Controller extends ModelController {
        constructor() {
            super();
            var me = this;
            this.ModelName = "Article";
            this.Views = [
                new Article.List(me),
                new Article.Details(me),
                new Article.Save(me),
            ];
            this.Views.forEach(function (v) {
                v.Controller = me;
            });
        }

        public GetControllerSpecificActions(model: ErpApp.Model.Article): AppUICommand[]{
            // 
            var commands: AppUICommand[] = [];
            if (!IsNull(model.Id)) {
                var deletecommand = AppUICommand.Create("model[TypeName=Article]",["item","header"], "Delete", "controller(this).Delete(this,'{0}')");
                deletecommand.IsInContext((model) => !IsNull(model.Id));
                commands.push(deletecommand);
            }
            return commands;
        }

        public Delete(uielement: Element, id: any)
        {
            var check = confirm(Res("general.SureDelete"));
            if (check) {
                var commands = [];
                var commandobj = BaseModel.GetDeleteCommand("Article", id);
                commands.push(commandobj);
                var formdata = new FormData();
                formdata.append("commands", JSON.stringify(commands));
                AppDependencies.httpClient.PostOld("~/webui/api/xclientcommandmultipart", formdata,
                    function (xhttp: XMLHttpRequest) {
                        var response = <AppResponse>JSON.parse(xhttp.responseText);
                        var model = IsArray(response.Model) ? response.Model.FirstOrDefault() : response.Model;
<<<<<<< HEAD
                        webcore.Toast_Success("Article with " + id + " was deleted successfully");
=======
                        Toast_Success("Article with " + id + " was deleted successfully");
>>>>>>> b9b34fe8f309f856b9fcadb8ff80bf1cf3a26643
                    },
                    null,
                    null);
            }
            var item = _Parents(uielement).FirstOrDefault(i => i.classList.contains("item"));
            if (!IsNull(item) && check)
            {
                item.remove();
            }

        }  
        public TransformActionHtml(action: string, model: ErpApp.Model.Article, html: string, area: string): string {
            if (action == "Save")
            {
                var url = TextBetween(html, 'href="', '"');
                var category = AppDataLayer.Data.AppCategorys.FirstOrDefault(i => i.Id == model.CategoryId);
                if (category != null) {
                    var newurl = Format("#{0}\\{1}\\{2}-{3}", model.TypeName, "Save", category.Code, model.Id);

                    if (area.length > 0) {
                        newurl = Format("#{0}\\{1}\\{2}\\{3}-{4}",area, model.TypeName, "Save", category.Code, model.Id);

                    }

                    var ix = html.indexOf(url);
                    var newhtml = html.substring(0, ix) + newurl + html.substring(ix + url.length);
                    return newhtml;
                }
            }
            if (action == "List") {
                var url = TextBetween(html, 'href="', '"');
                var category = AppDataLayer.Data.AppCategorys.FirstOrDefault(i => i.Id == model.CategoryId);
                if (category != null) {
                    var newurl = Format("#{0}\\{1}\\{2}-", model.TypeName, "List", category.Code);
                    if (area.length > 0) {
                        newurl = Format("#{0}\\{1}\\{2}\\{3}-", area, model.TypeName, "List", category.Code);

                    }
                    var ix = html.indexOf(url);
                    var newhtml = html.substring(0, ix) + newurl + html.substring(ix + url.length);
                    return newhtml;
                }
            }
            return html;
        }
        public PrepareView(vm: View, p: any = null) {
            var me = this;
            var parameters = vm.GetParameterDictionary(p);
            var rp = application.GetRouteProperties();
            
            var roottlayouts = [
                Format("layout\\{0}.{1}.{2}.razor.html", vm.LogicalModelName, vm.Name, parameters.type),
                Format("layout\\{0}.{1}.razor.html", vm.LogicalModelName, vm.Name)
            ];
            var arealayouts = (rp.area.length > 0) ? roottlayouts.Select(i => i.replace("layout\\", "layout\\" + rp.area + "\\")) : [];

            var defaultlayouts = arealayouts.length > 0 ? arealayouts : roottlayouts;
            var customisedlayouts = [];
            for (var i = 0; i < defaultlayouts.length; i++)
            {
                var customlayoutpath = defaultlayouts[i].replace("layout\\", "Customisations\\" + application.Settings.Domain + "\\layout\\");
                customisedlayouts.push(customlayoutpath);
            }
            var layouts = customisedlayouts.concat(defaultlayouts);
            var existinglayouts = layouts.Where(i => i in application.Layouts.Templates);
            console.log(existinglayouts);
            var templates = layouts.Select(i => { return { layoutpath: i, content: application.Layouts.Templates[i] } });
            var template = templates.FirstOrDefault(i=>!IsNull(i.content));
            if (!IsNull(template)) {

                //vm.TemplateHtml = html;
                //vm.OriginalTemplateHtml = html;
                var t = new RazorTemplate();
                t.LayoutPath = template.layoutpath;
                t.Compile(template.content);
                vm.AddTemplate("razor", t)
            }
            
        }
    }
}

 
AddControllerToApplication(application, new Common.Article.Controller());
