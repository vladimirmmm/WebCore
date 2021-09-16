using System;
using System.Collections.Generic;

namespace ApiModel
{
    public static class DictionaryExtensions
    {
        public static object GetValue<Tkey, TValue>(this Dictionary<Tkey,TValue> item, Tkey key)
        {
            if (item.ContainsKey(key))
            {
                return item[key];
            }
            return null;
        }
        public static string GetValueAsString<Tkey, TValue>(this Dictionary<Tkey, TValue> item, Tkey key)
        {
            if (item.ContainsKey(key))
            {
                return String.Format("{0}", item[key]);
            }
            return "";
        }

        public static TValue GetValueAs<TValue>(this Dictionary<string, object> item, string key)
        {
            var result = item.GetValue(key);
            if (result != null)
            {
                if (result.GetType() == typeof(string))
                {
                    return (TValue)Convert.ChangeType(((string)result), typeof(TValue));
                }
                else if (result.GetType() == typeof(Int32) && typeof(TValue)==typeof(long)) {
                    return (TValue)(object)(Convert.ToInt64((int)result));
                }
                else
                {
                    return (TValue)((object)result);
                }
            }
            return default(TValue);
        }
    }
}
