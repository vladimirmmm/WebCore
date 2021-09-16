using ApiModel.Query;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ApiModel
{
    public abstract class CommandHandler
    {
        public async virtual Task<List<DataCommand>> HandleAsync(List<DataCommand> commands)
        {
            return commands;
        }

        public virtual DataCommand OnExecuting(DataCommand command, List<DataCommand> commands) { return command; }

        public virtual DataCommand OnExecuted(DataCommand command, List<DataCommand> commands) { return command; }
    }

    public abstract class QueryHandler
    {
        public virtual ClientQuery Handle(ClientQuery query) { return query; }

        public virtual SelectStatement Handle(SelectStatement selectstatement) { return selectstatement; }

        public virtual void HandleResult(Result<List<Dictionary<string, object>>> result)
        {
        }
    }

    public abstract class CommandLogic : CommandHandler
    {
        public string TypeName = "";
        public List<CommandName> Actions = new List<CommandName>();
        public string Domain = "";

        public CommandLogic(IDataService service) { }

        public CommandInfo GetCommandInfo(DataCommand command)
        {
            if (!command.Result.ViewData.ContainsKey("CommandInfo"))
            {
                var commandinfo = new CommandInfo();
                commandinfo.Provider = this.GetType().FullName;
                command.Result.ViewData.Add("CommandInfo", commandinfo);
            }
            return command.Result.ViewData["CommandInfo"] as CommandInfo;
        }

        public void TransactionCommit(System.Data.Common.DbTransaction transaction, DataCommand command)
        {
            try
            {
                transaction.Commit();
            }
            catch (Exception ex)
            {
                transaction.Rollback();
                command.Result.AddError(ex);
                //throw ex;
            }
        }

        public ClientQuery GetWorkQuery(string queryname, long? workid)
        {
            var query = new ClientQuery();
            query.QueryName = queryname;
            query.Compress = false;
            query.SetField("*");
            if (workid.HasValue)
            {
                var workfilter = new QueryFilter();
                workfilter.Field = "WorkId";
                workfilter.Operator = "=";
                workfilter.Type = "Number";
                workfilter.Values = new List<string>() { String.Format("{0}", workid) };
                query.SetFilter(workfilter);
            }
            return query;
        }
    }
    public abstract class QueryLogic : QueryHandler
    {
        public List<string> QueryNames = new List<string>();
        public string Domain = "";

        public QueryLogic(IDataService service)
        {
        }
    }

    public class LogicCollection
    {
        public Dictionary<string, Dictionary<string, List<Func<IDataService, QueryLogic>>>> QueryLogics = new Dictionary<string, Dictionary<string, List<Func<IDataService, QueryLogic>>>>();
        public Dictionary<string, Dictionary<string, List<Func<IDataService, CommandLogic>>>> CommandLogics = new Dictionary<string, Dictionary<string, List<Func<IDataService, CommandLogic>>>>();

        private IDataService service = null;
        public LogicCollection(IDataService service)
        {
            this.service = service;

        }
        public void AddQueryLogic(Func<IDataService, QueryLogic> logic)
        {
            var item = logic(null);
            var domain = item.Domain;
            var Querynames = item.QueryNames;
            if (!QueryLogics.ContainsKey(domain))
            {
                QueryLogics.Add(domain, new Dictionary<string, List<Func<IDataService, QueryLogic>>>());
            }
            var container = QueryLogics[domain];
            foreach (var queryname in Querynames)
            {
                if (!container.ContainsKey(queryname))
                {
                    container.Add(queryname, new List<Func<IDataService, QueryLogic>>());
                }
                var logiclist = container[queryname];
                logiclist.Add(logic);
            }
        }

        public void AddCommandLogic(Func<IDataService, CommandLogic> logic)
        {
            var item = logic(null);
            var domain = item.Domain;
            if (!CommandLogics.ContainsKey(domain))
            {
                CommandLogics.Add(domain, new Dictionary<string, List<Func<IDataService, CommandLogic>>>());
            }
            var container = CommandLogics[domain];
            var typename = item.TypeName;
            if (!container.ContainsKey(typename))
            {
                container.Add(typename, new List<Func<IDataService, CommandLogic>>());
            }
            container[typename].Add(logic);
        }

        public async Task<List<DataCommand>> HandleAsync(List<DataCommand> commands, string action)
        {
            var handledcommands = new List<DataCommand>();
            string domain = service.GetDomain();

            var baselogics = CommandLogics.ContainsKey("") ? CommandLogics[""] : new Dictionary<string, List<Func<IDataService, CommandLogic>>>();
            var domainlogics = CommandLogics.ContainsKey(domain) ? CommandLogics[domain] : new Dictionary<string, List<Func<IDataService, CommandLogic>>>();

            var genericbaselogics = baselogics.ContainsKey("") ? baselogics[""] : new List<Func<IDataService, CommandLogic>>();
            var genericdomainlogics = domainlogics.ContainsKey("") ? domainlogics[""] : new List<Func<IDataService, CommandLogic>>();
            var genericlogics = new List<Func<IDataService, CommandLogic>>();
            genericlogics.AddRange(genericbaselogics);
            genericlogics.AddRange(genericdomainlogics);

            var commandsx = commands.ToArray().ToList();
            foreach (var command in commandsx)
            {
                var typedbaselogics = baselogics.ContainsKey(command.TypeName) ? baselogics[command.TypeName] : new List<Func<IDataService, CommandLogic>>();
                var typeddomainlogics = domainlogics.ContainsKey(command.TypeName) ? domainlogics[command.TypeName] : new List<Func<IDataService, CommandLogic>>();

                var logic = typeddomainlogics.Select(i => i(service)).FirstOrDefault(i => i.Actions.Contains(command.CommandName));
                if (logic == null)
                {
                    logic = typedbaselogics.Select(i => i(service)).FirstOrDefault(i => i.Actions.Contains(command.CommandName));
                }
                if (logic == null)
                {
                    logic = genericlogics.Select(i => i(service)).FirstOrDefault(i => i.Actions.Contains(command.CommandName));
                }
                if (logic != null)
                {
                    var commandcontainer = new List<DataCommand>() { command };
                    handledcommands.AddRange(await logic.HandleAsync(commandcontainer));
                    if (commandcontainer.Count == 0)
                    {
                        commands.Remove(command);
                    }
                }
            }
            return handledcommands;
        }
        public ClientQuery Handle(ClientQuery query)
        {
            ClientQuery q = query;
            string domain = service.GetDomain();

            var baselogics = QueryLogics.ContainsKey("") ? QueryLogics[""] : new Dictionary<string, List<Func<IDataService, QueryLogic>>>();
            var domainlogics = QueryLogics.ContainsKey(domain) ? QueryLogics[domain] : new Dictionary<string, List<Func<IDataService, QueryLogic>>>();

            var querylogics = new List<Func<IDataService, QueryLogic>>();
            querylogics.AddRange(baselogics.ContainsKey(query.QueryName) ? baselogics[query.QueryName] : new List<Func<IDataService, QueryLogic>>());
            querylogics.AddRange(domainlogics.ContainsKey(query.QueryName) ? domainlogics[query.QueryName] : new List<Func<IDataService, QueryLogic>>());

            var logics = querylogics.Select(i => i(service)).ToList();

            foreach (var logic in logics)
            {
                logic.Handle(query);
                query.Info = query.Info + logic.GetType().FullName + "; ";
            }
            return query;
        }

    }
}
