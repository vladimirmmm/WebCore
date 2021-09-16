using System;
using System.Collections.Generic;
using System.Text;

namespace ApiModel
{
    public class Result
    {
        List<Exception> _Errors = new List<Exception>();
        public List<Exception> Errors { get { return _Errors; } set { _Errors = value; } }

        Dictionary<String, Object> _ViewData = new Dictionary<String, Object>();
        public Dictionary<String, Object> ViewData { get { return _ViewData; } set { _ViewData = value; } }


        public void AddError(string error)
        {
            this.Errors.Add(new Exception(error));
        }
        public void AddError(string error, Object data)
        {
            this.Errors.Add(new DataException(error, data));
        }
        public void AddError(Exception ex, Object data)
        {
            this.Errors.Add(new DataException(ex, data));
        }
        public void AddError(Exception ex)
        {
            if (ex != null)
            {
                this.Errors.Add(ex);
            }
        }
        public void SetViewData(string key,object value)
        {
            if (!ViewData.ContainsKey(key)) {
                ViewData.Add(key, null);
            }
            ViewData[key] = value;
        }

        public static Result<T> SuccessWithModel<T>(T model) where T:new()
        {
            var result = new Result<T>();
            result.Model = model;
            return result;
        }
        public void SetFromResult(Result source,bool includemodel=false)
        {
            this.Errors.AddRange(source.Errors);
            foreach (var key in source.ViewData.Keys)
            {
                if (this.ViewData.ContainsKey(key))
                {
                    this.ViewData[key] = source.ViewData[key];
                }
                else
                {
                    this.ViewData.Add(key, source.ViewData[key]);

                }
            }
           
        }


    }
    public class Result<T> : Result where T : new()
    {
        private T _Model = new T();
        public T Model { get {return _Model; } set {_Model=value; } }

        public static Result<T> Failed(Exception ex)
        {
            var result = new Result<T>();
            result.AddError(ex);
            return result;
        }
        public static Result<T> Failed(String ex)
        {
            var result = new Result<T>();
            result.AddError(ex);
            return result;
        }

        public void Append(Result<T> presult,bool includemodel=true)
        {
            if (includemodel) {
                this.Model = presult.Model;
            }
            SetFromResult(presult);
            
        }
    }
}
