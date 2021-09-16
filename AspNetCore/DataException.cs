using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ApiModel
{
    public class DataException:Exception
    {
        private Dictionary<string,object> _Data = new Dictionary<string, object>();
        public override IDictionary Data { get { return _Data; } }

        private string _StackTrace="";
        public override string StackTrace { get { return _StackTrace; } }

        public DataException() {
        
        }
        public DataException(Exception ex) : base(ex.Message)
        {
            this._StackTrace = ex.StackTrace;
        }
        public DataException(Exception ex, object data) : base(ex.Message)
        {
            this._StackTrace = ex.StackTrace;
            SetData(data);
        }
        public DataException(string message): base(message)
        {
        }
        public DataException(string message, object data) : base(message)
        {
            _Data.Add("Data", data);
        }
        public void SetData(object data)
        {
            _Data = new Dictionary<string, object>();
            _Data.Add("Data", data);

        }
    }
}