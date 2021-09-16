using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Web;

namespace ApiModel
{
    public enum CommandName
    {
        UNKNOWN,
        WORKSTART,
        WORKBODY,
        WORKEND,
        SELECT,
        INSERT,
        UPDATE,
        DELETE
    }
    public class DataCommand:Dictionary<string,object>
    {
        private List<DataCommand> _Children = new List<DataCommand>();
        public List<DataCommand> Children { get { return _Children; } set { _Children = value; } }

        public Result<Dictionary<string,object>> Result=new Result<Dictionary<string, object>>();
        public DataCommand()
        {
            Result.Model = new Dictionary<string, object>();
        }
        public CommandName CommandName {
            get {
                CommandName command=CommandName.UNKNOWN;
                Enum.TryParse(GetValueAsString("CommandName").ToUpper(), out command);
                return command;
            }
            set { SetValue("CommandName",Enum.GetName(typeof(CommandName), value).ToUpper()); }

        }
        public string Id
        {
            get
            {
                return GetValueAsString("Id");
            }
            set { SetValue("Id",value); }
        }
        public string TypeName
        {
            get
            {
                return GetValueAsString("TypeName");
            }
            set { SetValue("TypeName",value); }

        }
        public string ConnectionId
        {
            get
            {
                return GetValueAsString("ConnectionId");
            }
            set { SetValue("ConnectionId",value); }

        }
        public string PARAMETERS
        {
            get
            {
                return GetValueAsString("PARAMETERS");
            }
            set { SetValue("PARAMETERS",value); }

        }
        public string CommandText
        {
            get
            {
                return GetValueAsString("CommandText");
            }
            set { SetValue("CommandText", value); }

        }
        public string Name
        {
            get
            {
                return GetValueAsString("NAME"); 
            }
            set { SetValue("NAME", value); }

        }
        public List<string> DataKeys
        {
            get
            {
                return GetValueAsString("Keys").Split(',').ToList();
            }
        }
        public List<string> FieldNames
        {
            get
            {
                var keys = this.Keys.ToList();
                keys = keys.Except(ownkeys.ToList()).ToList();
                var ix = keys.IndexOf("TypeName");
                if (ix > -1) 
                {
                    keys.RemoveAt(ix);
                }
                return keys;
            }
        }
        //public DbQuery Query
        //{
        //    get { return DbQuery.GetQueryByTypeName(this.TypeName); }
        //}
        public List<string> Errors
        {
            get
            {
                var errors = new List<string>();
                if (!String.IsNullOrEmpty(this.CommandText)) {
                    return errors;
                }
                if (String.IsNullOrEmpty(this.TypeName)) {
                    errors.Add(String.Format("Command {0} has no TypeName", Id));
                }
                if (String.IsNullOrEmpty(this.TypeName))
                {
                    errors.Add(String.Format("Command {0} has not Specified", Id));
                }
                //var query = Query;
                //if (query == null)
                //{
                //    errors.Add(String.Format("Command {0} has a TypeName {1} with no definition", Id, TypeName));
                //}
                //else
                //{
                    //if (this.CommandName == CommandName.DELETE || this.CommandName == CommandName.UPDATE)
                    //{
                    //    if (query.Keys.Count == 0)
                    //    {
                    //        errors.Add(String.Format("Command {0} has a Type {1}, which has no Keys associated", Id, TypeName));
                    //        return null;
                    //    }
                    //}
                //}
                return errors;
            }
        }
        private HashSet<string> ownkeys = new HashSet<string>() { "Keys", "NAME", "PARAMETERS", "ConnectionId", "CommandName", "CommandText" };
        public Dictionary<string, object> GetDataObject()
        {
            var result = new Dictionary<string, object>();
            foreach (var key in this.Keys)
            {
                if (!ownkeys.Contains(key))
                {
                    result.Add(key, this[key]);
                }
            }
            return result;
        }
       
        public void SetDataObject(Dictionary<string, object> source )
        {
            var result = new Dictionary<string, object>();
            foreach (var key in source.Keys)
            {
                this.SetValue(key, source[key]);
            }
        }

        public List<string> GetFields()
        {
            var result = new List<string>();
            foreach (var key in this.Keys)
            {
                if (!ownkeys.Contains(key))
                {
                    result.Add(key);
                }
            }
            return result;
        }

        public string GetValueAsString(string key)
        {
            return this.ContainsKey(key) ? String.Format("{0}", this[key]) : "";
        }
        public object GetValue(string key)
        {
            return this.ContainsKey(key) ?  this[key]: null;
        }

        public void SetValue(string key, object value)
        {
            if (!this.ContainsKey(key)) {
                this.Add(key, null);
            }
            this[key] = value;
        }
        public static DataCommand Create(Dictionary<string, object> source, CommandName commandname=CommandName.UNKNOWN, string TypeName="") {
            var datacommand = new DataCommand();
            foreach (var key in source.Keys)
            {
                datacommand.Add(key, source[key]);
            }
            if (commandname != CommandName.UNKNOWN) 
            {
                datacommand.CommandName = commandname;
            }
            if (!String.IsNullOrEmpty(TypeName)) {
                datacommand.TypeName = TypeName;
            }
            return datacommand;
        }

        public void Log(string text, string vdkey = "Logs") 
        {
            if (!Result.ViewData.ContainsKey(vdkey)) 
            {
                Result.ViewData.Add(vdkey, "");
            }
            Result.ViewData[vdkey] = Result.ViewData[vdkey] + "\n" +String.Format("{0:yyyy-MM-dd HH:mm:ss:fffff} \n", DateTime.Now)+ text;
        }
        public void Log(IEnumerable<string> texts, string vdkey = "Logs")
        {
            if (!Result.ViewData.ContainsKey(vdkey))
            {
                Result.ViewData.Add(vdkey, "");
            }
            var logbuilder = new StringBuilder();
            foreach (var text in texts) 
            {
                logbuilder.AppendLine(text);
            }
            Result.ViewData[vdkey] = Result.ViewData[vdkey] + "\n" + logbuilder.ToString();
        }
    }

    public class DataCommandResult
    {
        public DataCommand Command;
        public string CommandName { get; set; }
        public Dictionary<string, object> Result { get; set; }
        public int Index { get; set; }
        public Exception Exception { get; set; }
        public string CommandText { get; set; }
        public string ProviderName { get; set; }

        public void SetError(Exception ex)
        {
            this.Exception = ex;
        }
        public void SetError(string msg)
        {
            this.Exception = new Exception(msg);
        }

        public DataCommandResult()
        {
            this.Result = new Dictionary<string, object>();
        }
    }

    public class CommandInfo
    {
        public string CommandText { get; set; }
        public string Provider { get; set; }
        public string Identifier { get; set; }
        public object CommandObject { get; set; }
        public object Result { get; set; }
        public string ConnectionInfo { get; set; }
        public String Logs { get; set; }
        public Exception Error { get; set; }

        private List<CommandInfo> _Children = new List<CommandInfo>();
        public List<CommandInfo> Children { get { return _Children; }set { _Children = value; } }

        public void SetFrom(IDbCommand dbcommand, Dictionary<string,object> datacommand)
        {
            this.CommandObject = datacommand;
            this.CommandText = dbcommand.CommandText;
            this.ConnectionInfo=String.Format("{0} - {1}", dbcommand.Connection.Database, dbcommand.Connection.GetType().FullName);
        }

        public void Log(string v)
        {
            this.Logs = this.Logs + v + "\n";
        }
    }
}