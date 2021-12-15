declare var tinymce: any;

module Common.Contact {
    export class MessageCollection {
        public Incoming: Models.AppMessage[] = [];
        public Outgoing: Models.AppMessage[] = [];
        public get All()
        {
            return this.Incoming.concat(this.Outgoing);
        }
    }
    export class Details extends ViewModel<MessageCollection>
    {
        public Identifier(): string {
            return Format("{0}_{1}", this.Name, "");
        }

        public Title(): string {
            return Format("{0}", Res("UI.Contact.Title"));
        }

        public FormatIdentifier(p: Object): string {
            return Format("{0}_{1}", this.Name, "");

        }
        constructor(controller: ModelController) {
            super("Details", controller);
        }
        public Action(p: Object) {
            var viewmodel = this;
            var me = this;

            var headerelement = _SelectFirst(".header", viewmodel.UIElement)

            me.Bind(me.UIElement, {});
            //BindX(headerelement, {});
           
            //var filterelements = _Select(".filter", me.UIElement);
            //filterelements.forEach(function (filterelement) {
            //    BindX(filterelement, {});
            //});
            //var tabhead = _SelectFirst(".heads", me.UIElement);
            //BindX(tabhead, {});
            this.Search();

        }
        public DF_Companies(txt: string, callback: Function)
        {
            var me = this;
            var query = AppDataLayer.Queries.CompanyList;
            var wsfilter = ClientFilter.Create(UIDataType.Number, "WebserviceUserId", "{NULL}").FirstOrDefault();
            wsfilter.Operator = "IS NOT";
            query.SetFilter(wsfilter);
            query.Take = 10;
            AppDataLayer.DataLookupByQuery(txt, query, ["Name"], callback);
        }

        public Search(tag:string="") {
            var me = this;
            var viewmodel: View = this;
            var listelement = _SelectFirst(".body", viewmodel.UIElement)
            //_Hide(voucherlistelement);
      

            //ShowProgress();
            var query = AppDataLayer.CreateListQueryByName("AppMessage");
            query.GetCount = true;

            var incomingquery = ClientQuery.New(JsonCopy(query));
            var outgoingquery = ClientQuery.New(JsonCopy(query));
            var userid = application.Settings.Company["Id"]
            var incomingfilter = ClientFilter.Create(UIDataType.Number, "TargetUserId", [userid]);
            var outgoingfilter = ClientFilter.Create(UIDataType.Number, "CreatedByUserId", [userid]);
            incomingquery.SetFilters(incomingfilter);
            outgoingquery.SetFilters(outgoingfilter);
        

            if (IsNull(tag)) {
                me.LoadList(incomingquery, ".tab[name=incoming]", model => me.Model.Incoming = model)
                me.LoadList(outgoingquery, ".tab[name=outgoing]", model => me.Model.Outgoing = model)
            } else
            {
                if (tag == "Incoming") {
                    me.LoadList(incomingquery, ".tab[name=incoming]", model => me.Model.Incoming = model)

                }
                if (tag == "Outgoing") {
                    me.LoadList(outgoingquery, ".tab[name=outgoing]", model => me.Model.Outgoing = model)

                }
            }
            me.Model = new MessageCollection();
 
            me.AfterBind();
        }

        public LoadList(query: ClientQuery, selector: string, setmodel: Function, page: number = 1)
        {
            var me = this;
            var pagesize = me.PageSize();
            var pageroptions = {
                page: page,
                pagesize: pagesize,
                onclick: function (p)
                {
                    me.LoadList(query, selector, setmodel, p);
                }
            }
            var filterelement = _SelectFirst(selector + " .filter", me.UIElement);
            
            var uifilters = GetFiltersFromUI(filterelement);
            query.SetFilters(uifilters); 
            query.Skip = (page - 1) * pagesize;
            query.Take = pagesize;
  
            AppDependencies.httpClient.GetData(
                query,
                function (r: AppResponse) {
                    var messages = r.Model;
                    var count = r.ViewData["Count"];
                    setmodel(messages);
                    me.Bind(selector + " .generaltable", messages);
                    pageroptions["total"] = count;
                    CreatePager(_SelectFirst(selector + " .pager", me.UIElement), pageroptions);
                    //me.AfterBind();
                });
        }

        public CloseElement(element: Element)
        {
            var msg = _Parents(element).FirstOrDefault(i => i.classList.contains("msg"));
            if (msg != null)
            {
                var modal = _SelectFirst(".modal", view(element).UIElement);
                _Hide(modal);
                _Hide(msg);
            }
        }
        public NewMessage(msg: Models.AppMessage)
        {
            var me = this;
         
            var newmessage = _SelectFirst(".modal .msg.new", me.UIElement);
            var modal = _SelectFirst(".modal", me.UIElement);
            if (application.Settings.Company["WebserviceUserId"] != 1) {
                var tofield = _SelectFirst(".field.to", newmessage);
                _Hide(tofield);
            }
            var companycontrol:any = _SelectFirst(".company.autocomplete", newmessage);
            me.Bind(".modal .msg.new", FirstNotNull(msg, {}));
            companycontrol.connectedCallback();

            _Show(newmessage);
            _Show(modal);
        }
        public ViewMessage(id:any) {
            var me = this;
            var viewmessage = _SelectFirst(".modal .msg.view", me.UIElement);
            var modal = _SelectFirst(".modal", me.UIElement);
            var msg = me.Model.All.FirstOrDefault(i => i.Id == id);
            me.Bind(".modal .msg.view", msg);
            _Show(viewmessage);
            _Show(modal);
        }
        public ReplyTo(id: any) {
            var me = this;
            var viewmessage = _SelectFirst(".modal .msg.view", me.UIElement);

            var msg_original = me.Model.All.FirstOrDefault(i => i.Id == id);
            var msg_reply = new Models.AppMessage();
            msg_reply.ParentId = msg_original.Id;
            msg_reply.Subject = Format("Re: {0}", msg_original.Subject); 
            msg_reply.TargetUserId = msg_original.CreatedByUserId;
            msg_reply.ToName = msg_original.FromName;
            _Hide(viewmessage);
            me.NewMessage(msg_reply);
      
        }
        public SendMessage() {
            var me = this;
            var modal = _SelectFirst(".modal", me.UIElement);
            var message = _SelectFirst(".msg.new", modal);
            var msg = GetBoundObject(modal);
            var command = GetUpdateCommand(msg, "AppMessage", "INSERT");
            var tbcompany = <HTMLInputElement>_SelectFirst(".autocomplete.company .textbox", message);
            command["ToName"] = tbcompany.placeholder;
            command["Keys"] = "Id";
            var commands = [command];
            AppDependencies.httpClient.Post("~/webui/api/xclientcommand", JSON.stringify(commands),
                function (xhttp: XMLHttpRequest) {
                    var response = <AppResponse>JSON.parse(xhttp.responseText);
                    var model = response.Model.FirstOrDefault();
                    if (!IsNull(model)) { model = model["Model"];}
                    var id =model["Value"];
                    if (id > 0)
                    {
                        Toast_Success(Res("UI.Contact.MessageSent"), "");
                        me.Search();
                    }
                },
                null,
                "application/json");
            _Hide(message);
            _Hide(modal);
        }
    }

    export class Feedback extends ViewModel<any>
    {
        public Identifier(): string {
            return Format("{0}_{1}", this.Name, "");
        }

        public Title(): string {
            return Format("{0}", Res("UI.Contact.Title"));
        }

        public FormatIdentifier(p: Object): string {
            return Format("{0}_{1}", this.Name, "");

        }
        constructor(controller: ModelController) {
            super("Feedback", controller);
        }
        public Action(p: Object) {
            var viewmodel = this;
            var me = this;

            var headerelement = _SelectFirst(".header", viewmodel.UIElement)

            me.Bind(me.UIElement, {});
          

        }

        public SavePost()
        {
            //xnotify Email,Email,Body
        }
        public SendMessage() {
            var me = this;
            var modal = _SelectFirst(".modal", me.UIElement);
            var message = _SelectFirst(".msg.new", modal);
            var msg = GetBoundObject(modal);
            var subject = msg["Subject"];
            var content = msg["Content"];
            msg["Email"] = "vladi@live.com";
            msg["Body"] = content;
            AppDependencies.httpClient.Post("~/webui/api/xnotify", JSON.stringify(msg),
                function (xhttp: XMLHttpRequest) {
                    var response = <AppResponse>JSON.parse(xhttp.responseText);
                    var model = response.Model.FirstOrDefault();
                    //if (!IsNull(model)) { model = model["Model"]; }
                    //var id = model["Value"];
                    //if (id > 0) {
                        Toast_Success(Res("UI.Contact.MessageSent"), "");
                    //}
                },
                null,
                "application/json");
        }
    }
  

    export class Controller extends ModelController {
        constructor() {
            super();
            var me = this;
            this.ModelName = "Contact";
            this.Views = [
                new Contact.Details(me),
                new Contact.Feedback(me)
                //new Contact.Save(me), 
            ];
            this.Views.forEach(function (v) {
                v.Controller = me;
            });
        }

    }
}


AddControllerToApplication(application, new Common.Contact.Controller());
