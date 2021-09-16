using System;
using System.Collections.Generic;
using System.Text;

namespace ApiModel
{
    public class StringObject
    {
        public string Value { get; set; }
    }
    public class StandardDictionary : Dictionary<string, object>
    {
        public T GetValue<T>(string key)
        {
            if (this.ContainsKey(key))
            {
                var val = this[key];
                if (val != null)
                {
                    if (val.GetType() == typeof(string))
                    {
                        return (T)Convert.ChangeType(((string)val), typeof(T));
                    }
                    else if (val.GetType() == typeof(Int32) && typeof(T) == typeof(long))
                    {
                        return (T)(object)(Convert.ToInt64((int)val));
                    }
                    else
                    {
                        return (T)val;
                    }
                }
            }
            return default(T);
        }
   

        public T GetValue<T>(string key, T def)
        {
            if (!this.ContainsKey(key))
            {
                SetValue(key, def);
            }
            return (T)this[key];
        }

        public void SetValue<T>(string key, T value)
        {
            if (!this.ContainsKey(key)) { this.Add(key, value); }
            else
            {
                this[key] = value;
            }
        }

        public void Load(Dictionary<string, object> source)
        {
            foreach (var key in source.Keys)
            {
                if (!this.ContainsKey(key)) {
                    this.Add(key, null);
                }
                this[key] = source[key];
            }
        }

        public static T Create<T>(Dictionary<string,object> source) where T:StandardDictionary, new()
        {
            var result = new T();
            result.Load(source);
            return result;
        }

        public static void SetValue(Dictionary<string,object> target, string key, object value) {
            if (target != null) 
            {
                if (!target.ContainsKey(key)) {
                    target.Add(key, null);
                }
                target[key] = value;
            }
        }
        public static object GetValue(Dictionary<string,object> target, string key) {
            if (target != null && target.ContainsKey(key)) 
            {
                return target[key];
            }
            return null;
        }

        public static string GetValueAsString(Dictionary<string, object> target, string key)
        {
            if (target.ContainsKey(key))
            {
                var val = target[key];
                return String.Format("{0}", val);
            }
            return "";
        }

        public static void RemoveKey(Dictionary<string, object> target, string key)
        {
            if (target != null && target.ContainsKey(key))
            {
                target.Remove(key);
            }
        }

        public static List<StandardDictionary> GetAsList(Dictionary<string, object> dict, string listpath)
        {
            var result = new List<StandardDictionary>();
            var items = dict.ContainsKey(listpath) ? dict[listpath] as List<Dictionary<string, object>> : new List<Dictionary<string, object>>();
            foreach (var item in items)
            {
                var d = new StandardDictionary();
                d.Load(item);
                result.Add(d);
            }
            return result;

        }
    }

    public class StandardDictionary<T>: Dictionary<string,T>
    {
        public T GetValue(string key)
        {
            if (this.ContainsKey(key))
            {
                return this[key];
            }
            return default(T);
        }


        public void SetValue(string key, T value)
        {
            if (!this.ContainsKey(key)) { this.Add(key, value); }
            else
            {
                this[key] = value;
            }
        }
    }
}
