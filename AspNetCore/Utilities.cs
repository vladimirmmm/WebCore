using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;

namespace ApiModel
{
    public class KeyValue<TKey, TValue>
    {
        public TKey Key { get; set; }
        public TValue Value { get; set; }

        public KeyValue()
        {

        }
        public KeyValue(TKey key)
        {
            this.Key = Key;
        }

        public KeyValue(TKey key, TValue value)
        {
            this.Key = key;
            this.Value = value;
        }
        public override bool Equals(object obj)
        {
            var item = (KeyValue<TKey, TValue>)obj;

            if (item == null)
            {
                return false;
            }

            return this.Key.Equals(item.Key);
        }

        public override int GetHashCode()
        {
            return this.Key.GetHashCode();
        }

        public override string ToString()
        {
            return String.Format("{0} >> {1}", this.Key, this.Value);
        }
    }
    public class KeyValue
    {
        public string Key { get; set; }
        public object Value { get; set; }
        public KeyValue()
        {

        }
        public KeyValue(string key)
        {
            this.Key = key;
        }

        public KeyValue(string key, object value)
        {
            this.Key = key;
            this.Value = value;
        }
    }

    public partial class KeyWord2
    {
        public String Name;
        public int Density;
        public KeyWord2(String pName, int pDensity)
        {
            this.Name = pName;
            this.Density = pDensity;
        }
    }

    public class Strings
    {

        public string GetDictionaryValue(Dictionary<string, object> dictionary, string key)
        {
            return dictionary.ContainsKey(key) ? String.Format("{0}", dictionary[key]) : "";
        }
        public static void testc()
        {
            var str = "sdgsdg,dfgs,sdg,";
            var result = Strings.FactSplit(str, ',', 3);
        }
        public static List<string> FactSplit(string input, char splitter, int minlength = 1)
        {
            var Result = new List<string>(20);
            //foreach (var ch in input)
            char ch;
            int lastix = 0;
            for (int i = 0; i < input.Length; i++)
            {
                //ch = input[i];
                if (input[i] == splitter)
                {
                    var word = input.Substring(lastix, i - lastix);
                    if (!String.IsNullOrEmpty(word))
                    {
                        Result.Add(word);
                        lastix = i + 1;
                        i = i + minlength - 1;
                    }

                }

            }
            //if (Result.Count == 0) 
            //{
            //    Result.Add(input);
            //}
            return Result;
        }

        public static string GetFileExtension(string filepath)
        {
            if (String.IsNullOrEmpty(filepath)) { return ""; }
            var ix = filepath.LastIndexOf(".");
            if (ix > -1)
            {
                return filepath.Substring(ix + 1);
            }
            return "";
        }

        public static string GetFolder(string FilePath)
        {
            if (!String.IsNullOrEmpty(FilePath))
            {
                if (FilePath.Contains("\\") && !FilePath.EndsWith("\\"))
                {
                    return FilePath.Remove(FilePath.LastIndexOf("\\") + 1);
                }
                if (FilePath.Contains("/") && !FilePath.EndsWith("/"))
                {
                    return FilePath.Remove(FilePath.LastIndexOf("/") + 1);
                }
            }
            return FilePath;
        }
        public static string GetFolderName(string FilePath)
        {
            var folder = GetFolder(FilePath);
            var foldername = folder.Trim('\\').Trim('/');
            if (foldername.Contains("\\"))
            {
                foldername = foldername.Substring(foldername.LastIndexOf("\\") + 1);
            }
            if (foldername.Contains("/"))
            {
                foldername = foldername.Substring(foldername.LastIndexOf("/") + 1);
            }
            return foldername;
        }
        public static string GetStringForFilename(string value)
        {
            //string illegal = "\"M\"\\a/ry/ h**ad:>> a\\/:*?\"| li*tt|le|| la\"mb.?";
            string invalid = new string(Path.GetInvalidFileNameChars()) + new string(Path.GetInvalidPathChars());

            foreach (char c in invalid)
            {
                value = value.Replace(c.ToString(), "-");
            }
            return value;
        }
        public static string GetFileName(string FilePath)
        {
            var filename = "";
            if (!String.IsNullOrEmpty(FilePath))
            {
                if (FilePath.Contains("\\"))
                {
                    filename = FilePath.Substring(FilePath.LastIndexOf("\\") + 1);
                }
                if (FilePath.Contains("/"))
                {
                    filename = FilePath.Substring(FilePath.LastIndexOf("/") + 1);
                }
                var dot_ix = filename.LastIndexOf(".");
                var hash_ix = filename.LastIndexOf("#");
                if (hash_ix > dot_ix)
                {
                    filename = filename.Remove(hash_ix);
                }
            }
            return filename;
        }
        public static string GetFileNameWithoutExtension(string FilePath)
        {
            var filename = "";
            if (!String.IsNullOrEmpty(FilePath))
            {
                if (FilePath.Contains("\\"))
                {
                    filename = FilePath.Substring(FilePath.LastIndexOf("\\") + 1);
                }
                if (FilePath.Contains("/"))
                {
                    filename = FilePath.Substring(FilePath.LastIndexOf("/") + 1);
                }
                var dot_ix = filename.LastIndexOf(".");
                filename = filename.Remove(dot_ix);
            }
            return filename;
        }
        public static string GetRelativePath(string referencePath, string absolutePath)
        {
            var lowerref = referencePath.ToLower();
            var lowerabs = absolutePath.ToLower();
            var ix = lowerabs.IndexOf(lowerref);
            if (ix == 0)
            {
                var relpath = absolutePath.Substring(lowerref.Length);
                relpath = /*"..\\" +*/ relpath;
                return relpath;
            }
            return absolutePath;
        }
        public static string ResolveRelativePath(string referencePath, string relativePath, string localrootpath)
        {
            if (relativePath.StartsWith("http://") || relativePath.StartsWith("https://"))
            {
                return GetLocalPath(localrootpath, relativePath);
            }
            else
            {
                return ResolveRelativePath(referencePath, relativePath);
            }
        }

        public static string ProcessWithoutLiterals(string input, Func<string, string> process, string literalstr="\"" )
        {
            var result = input;
            Regex regExpr = new Regex(literalstr+"[^"+literalstr+"]*"+literalstr, RegexOptions.IgnoreCase);
            var strings = new List<string>();
            var matchlist = new List<Match>();
            foreach (Match m in regExpr.Matches(result))
            {

                matchlist.Insert(0, m);

            }
            var mix = 0;
            foreach (var m in matchlist)
            {
                var literal = m.Value.Trim('"');
                strings.Add(literal);
                result = result.Remove(m.Index, m.Value.Length);
                result = result.Insert(m.Index, "\"literal_" + mix + "\"");
                mix++;
            }

            result = process(result);
            for (int i = 0; i < strings.Count; i++)
            {
                result = result.Replace("literal_" + i + "", strings[i]);
            }

            return result;
        }

        public static string RemoveDoubleParenthesis(string initialString)
        {
            //var parts = initialString.Split('(');
            //var sb = new StringBuilder();
            //foreach (var part in parts)
            //{
            //    var nval = part.Trim();
            //}

            var strval = initialString;
            while (strval.IndexOf(" (") > -1)
            {
                strval = strval.Replace(" (", "(");
            }
            while (strval.IndexOf("( ") > -1)
            {
                strval = strval.Replace("( ", "(");
            }
            while (strval.IndexOf(" )") > -1)
            {
                strval = strval.Replace(" )", ")");
            }
            while (strval.IndexOf(") ") > -1)
            {
                strval = strval.Replace(") ", ")");
            }
            var pairs = new List<KeyValue<int, int>>();
            var pairstoremove = new List<KeyValue<int, int>>();
            var pix = -1;
            var ix = 0;
            foreach (var c in strval)
            {
                if (c == '(')
                {
                    pairs.Add(new KeyValue<int, int>(ix, -1));
                    pix = pairs.Count - 1;
                    Console.WriteLine("( " + pix.ToString() + " at " + ix.ToString());
                }
                if (c == ')')
                {
                    pairs[pix].Value = ix;
                    Console.WriteLine(") " + pix.ToString() + " at " + ix.ToString());
                    while (pix > -1 && pairs[pix].Value != -1)
                    {
                        pix--;
                    }

                }
                ix++;
            }

            for (int i = 0; i < pairs.Count - 1; i++)
            {
                if (pairs[i].Key + 1 == pairs[i + 1].Key
                    && pairs[i].Value == pairs[i + 1].Value + 1
                    )
                {
                    //pairstoremove.Add(pairs[i]);
                    pairstoremove.Add(pairs[i + 1]);
                }
            }
            for (int i = pairstoremove.Count - 1; i > -1; i--)
            {
                strval = strval.Remove(pairstoremove[i].Value, 1);
                strval = strval.Remove(pairstoremove[i].Key, 1);
            }


            return strval;

        }

        public static string NormalizeParanthesis(string val)
        {
            var tmpresult = val;
            var result = RemoveDoubleParenthesis(tmpresult);
            while (result.Length != tmpresult.Length)
            {
                tmpresult = result;
                result = RemoveDoubleParenthesis(tmpresult);
            }
            return result;
        }

        public static void testxy()
        {
            var str = "return ((functions.StringLength(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))))  ==  5m  &  ((functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 1m, 1m))  +  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 3m, 1m)))  ==  0m)  &  (functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 5m, 1m))  ==  0m))  |  (functions.StringLength(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))))  ==  5m  &  ((10m  -  (functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 1m, 1m))  +  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 3m, 1m))))  ==  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 5m, 1m))))  |  (functions.StringLength(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))))  ==  6m  &  ((functions.Number(functions.Substring(functions.String((functions.XS_Integer(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 1m, 1m))  *  2m)), 1m, 1m))  +  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 2m, 1m))  +  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 4m, 1m)))  ==  0m)  &  (functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 6m, 1m))  ==  0m))  |  (functions.StringLength(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))))  ==  6m  &  ((10m  -  (functions.Number(functions.Substring(functions.String((functions.XS_Integer(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 1m, 1m))  *  2m)), 1m, 1m))  +  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 2m, 1m))  +  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 4m, 1m))))  ==  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 6m, 1m))))  |  (functions.StringLength(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))))  ==  7m  &  ((functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 1m, 1m))  +  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 3m, 1m))  +  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 5m, 1m)))  ==  0m)  &  (functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 7m, 1m))  ==  0m))  |  (functions.StringLength(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))))  ==  7m  &  ((10m  -  (functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 1m, 1m))  +  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 3m, 1m))  +  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 5m, 1m))))  ==  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 7m, 1m))))  |  (functions.StringLength(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))))  ==  8m  &  ((functions.Number(functions.Substring(functions.String((functions.XS_Integer(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 1m, 1m))  *  2m)), 1m, 1m))  +  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 2m, 1m))  +  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 4m, 1m)))  ==  0m)  &  (functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 8m, 1m))  ==  0m))  |  (functions.StringLength(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))))  ==  8m  &  ((10m  -  (functions.Number(functions.Substring(functions.String((functions.XS_Integer(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 1m, 1m))  *  2m)), 1m, 1m))  +  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 2m, 1m))  +  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 4m, 1m))))  ==  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 8m, 1m))))  |  (functions.StringLength(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))))  ==  9m  &  ((functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 1m, 1m))  +  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 3m, 1m))  +  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 5m, 1m)))  ==  0m)  &  (functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 9m, 1m))  ==  0m))  |  (functions.StringLength(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))))  ==  9m  &  ((10m  -  (functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 1m, 1m))  +  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 3m, 1m))  +  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 5m, 1m))))  ==  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 9m, 1m))))); ";
            var str3 = "return((functions.StringLength(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))))==  5m  &((functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 1m, 1m))+  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 3m, 1m)))==  0m)&(functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 5m, 1m))==  0m))|(functions.StringLength(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))))==  5m  &((10m  -(functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 1m, 1m))+  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 3m, 1m))))==  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 5m, 1m))))|(functions.StringLength(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))))==  6m  &((functions.Number(functions.Substring(functions.String((functions.XS_Integer(functions.Substing(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 1m, 1m))*  2m)), 1m, 1m))+  functions.Number(functios.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 2m, 1m))+  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 4m, 1m)))==  0m)&(functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 6m, 1m))==  0m))|(functions.StringLength(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))))==  6m  &((10m  -(functions.Number(functions.Substring(functions.String((functions.XS_Integer(functions.Substring(functions.String(fuctions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 1m, 1m))*  2m)), 1m, 1m))+  functions.Number(functions.Substring(functions.Sring(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 2m, 1m))+  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 4m, 1m))))==  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 6m, 1m))))|(functions.StringLength(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))))==  7m  &((functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 1m, 1m))+  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 3m, 1m))+  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 5m, 1m)))==  0m)&(functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 7m, 1m))==  0m))|(functions.StringLength(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))))==  7m  &((10m  -(functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 1m, 1m))+  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 3m, 1m))+  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 5m, 1m))))==  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 7m, 1m))))|(functions.StringLength(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))))==  8m  &((functions.Number(functions.Substring(functions.String((functions.XS_Integer(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, function.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 1m, 1m))*  2m)), 1m, 1m))+  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, unctions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 2m, 1m))+  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 4m, 1m)))==  0m)&(functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 8m, 1m))==  0m))|(functions.StringLength(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))))==  8m  &((10m  -(functions.Number(functions.Substring(functions.String((functions.XS_Integer(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.rg.il/xbrl/dict/dim\", \"TDD\"))), 1m, 1m))*  2m)), 1m, 1m))+  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://ww.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 2m, 1m))+  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 4m, 1m))))==  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 8m, 1m))))|(functions.StringLength(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))))==  9m  &((functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 1m, 1m))+  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 3m, 1m))+  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 5m, 1m)))==  0m)&(functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 9m, 1m))==  0m))|(functions.StringLength(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))))==  9m  &((10m  -(functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 1m, 1m))+  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 3m, 1m))+  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 5m, 1m))))==  functions.Number(functions.Substring(functions.String(functions.XFI_Fact_Typed_Dimension_Value(p_a, functions.QName(\"http://www.boi.org.il/xbrl/dict/dim\", \"TDD\"))), 9m, 1m))))); ";
            var str2 = NormalizeParanthesis(str);
            var str4 = NormalizeParanthesis(str3);
        }

        public static string ResolveRelativePath(string referencePath, string relativePath)
        {
            if (relativePath.StartsWith("./"))
            {
                relativePath = relativePath.Substring(2);
            }

            relativePath = GetUrlWithoutHash(relativePath);


            Uri uri = new Uri(Path.Combine(referencePath, relativePath));
            var path = "";
            if (uri.Scheme != "http")
            {
                path = Path.GetFullPath(uri.AbsolutePath);
                //path = HttpUtility.UrlDecode(path);

            }
            else
            {
                path = uri.AbsoluteUri;
            }
            return path;
        }
        public static string ResolveHref(string localbasepath, string referencePath, string href)
        {
            var localpath = "";
            if (Strings.IsRelativePath(href))
            {
                localpath = Strings.ResolveRelativePath(referencePath, href);
            }
            else
            {
                localpath = Strings.GetLocalPath(localbasepath, href);
                localpath = Strings.GetUrlWithoutHash(localpath);
            }
            return localpath;
        }
        public static string GetUrlWithoutHash(string url)
        {
            var hashix = url.IndexOf("#");
            if (hashix > -1)
            {
                url = url.Remove(hashix);
            }
            return url;
        }
        public static bool IsRelativePath(string FilePath)
        {
            if (!IsWebPath(FilePath) && !System.IO.Path.IsPathRooted(FilePath))
            {
                return true;
            }
            return false;
            //if ((!FilePath.Contains("\\") && !FilePath.Contains("/"))
            //    || FilePath.StartsWith("..") || FilePath.StartsWith("."))
            //{
            //    return true;
            //}
            //return false;
        }

        public static bool IsWebPath(string FilePath)
        {
            if (FilePath.StartsWith("www.") || FilePath.StartsWith("http://"))
            {
                return true;
            }
            return false;
        }

        public static String WebToLocalPath(string localrootfolder, string sourcepath)
        {
            sourcepath = sourcepath.Replace("http://", "").Replace("/", "\\");
            sourcepath = localrootfolder + sourcepath;
            return sourcepath;
        }

        public static String LocalToLocalPath(string localrootfolder, string sourcepath)
        {
            var w3index = sourcepath.IndexOf("www.");
            if (w3index > -1)
            {
                sourcepath = sourcepath.Substring(w3index);
            }
            if (!sourcepath.StartsWith(localrootfolder.ToLower()))
            {
                sourcepath = localrootfolder + sourcepath;
            }
            return sourcepath;
        }

        public static String GetLocalPath(string localrootfolder, string sourcepath)
        {
            if (IsWebPath(sourcepath))
            {
                return WebToLocalPath(localrootfolder, sourcepath);
            }
            else
            {
                return LocalToLocalPath(localrootfolder, sourcepath);

            }
        }

        public static List<KeyValue> ReadKeyValues(string file)
        {
            List<KeyValue> result = new List<KeyValue>();
            string content = System.IO.File.ReadAllText(file);
            string[] lines = content.Split(new string[] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries);
            foreach (var line in lines)
            {
                if (line.IndexOf(":") > -1)
                {
                    string key = line.Remove(line.IndexOf(":")).Trim();
                    string value = line.Substring(line.IndexOf(":") + 1).Trim();
                    result.Add(new KeyValue(key, value));
                }
            }
            return result;
        }

        public static string[] SplitSimple(string text, string separator)
        {
            return text.Split(new string[] { separator }, StringSplitOptions.RemoveEmptyEntries);
        }

        public static string[] SplitPreserve(string text, string[] separators)
        {
            var result = new List<string>();
            for (int i = 0; i < separators.Length; i++)
            {
                var separator = separators[i];
                var s_ix = 0;
                var ix = text.IndexOf(separator, s_ix);
                while (ix > -1)
                {
                    var item = text.Substring(s_ix, ix);
                    var sepitem = text.Substring(ix, separator.Length);
                    result.Add(item);
                    result.Add(sepitem);
                    s_ix = ix + separator.Length;
                    ix = text.IndexOf(separator, s_ix);
                }
            }
            foreach (var item in result)
            {

            }
            return result.ToArray();
        }

        public static void testx()
        {
            var str = "asd,asd:21";
        }

        public static string[] splitToBlocks(string data, int numBlocks, char sep)
        {
            // We return an array of the request length
            if (numBlocks <= 1 || data.Length == 0)
            {
                return new string[] { data };
            }

            string[] result = new string[numBlocks];

            // The optimal size of each block
            int blockLen = (data.Length / numBlocks);

            int idx = 0; int pos = 0; int lastSepPos = blockLen;
            while (idx < numBlocks)
            {
                // Search backwards for the first sep starting from the lastSepPos
                char c = data[lastSepPos];
                while (c != sep) { lastSepPos--; c = data[lastSepPos]; }

                // Get the block data in the result array
                result[idx] = data.Substring(pos, (lastSepPos + 1) - pos);

                // Reposition for then next block
                idx++;
                pos = lastSepPos + 1;

                if (idx == numBlocks - 1)
                    lastSepPos = data.Length - 1;
                else
                    lastSepPos = blockLen * (idx + 1);
            }
            return result;
        }

        public static void test()
        {
            var nr = new List<List<int>>();
            var filepath = "xf.dat";
            for (int i = 0; i < 10000000; i++)
            {
                var l = new List<int>();
                l.Add(1);
                l.Add(1123534671);
                l.Add(-123534671);
                nr.Add(l);
            }
            var fs = File.OpenWrite(filepath);
            var writer = new BinaryWriter(fs);
            for (int i = 0; i < nr.Count; i++)
            {
                var l = nr[i];
                var b1 = BitConverter.GetBytes(l[0]);
                var b2 = BitConverter.GetBytes(l[1]);
                var b3 = BitConverter.GetBytes(l[2]);
                writer.Write(b1);
                writer.Write(b2);
                writer.Write(b3);


            }
            writer.Close();

        }
        public static void test22()
        {
            var nr = new List<List<int>>();
            var filepath = "xf.dat";
            var fs2 = File.OpenRead(filepath);
            using (Stream source = fs2)
            {
                byte[] buffer = new byte[12];
                int bytesRead;
                while ((bytesRead = source.Read(buffer, 0, buffer.Length)) > 0)
                {
                    var b1 = new byte[4];
                    var b2 = new byte[4];
                    var b3 = new byte[4];
                    Array.Copy(buffer, 0, b1, 0, 4);
                    Array.Copy(buffer, 4, b2, 0, 4);
                    Array.Copy(buffer, 8, b3, 0, 4);
                    var i1 = BitConverter.ToInt32(b1, 0);
                    var i2 = BitConverter.ToInt32(b2, 0);
                    var i3 = BitConverter.ToInt32(b3, 0);
                    //dest.Write(buffer, 0, bytesRead);
                }
            }
        }

        public static IEnumerable<string> GetSplit(string s, char c)
        {
            int l = s.Length;
            int i = 0, j = s.IndexOf(c, 0, l);
            if (j == -1) // No such substring
            {
                yield return s; // Return original and break
                yield break;
            }

            while (j != -1)
            {
                if (j - i > 0) // Non empty? 
                {
                    yield return s.Substring(i, j - i); // Return non-empty match
                }
                i = j + 1;
                j = s.IndexOf(c, i, l - i);
            }

            if (i < l) // Has remainder?
            {
                yield return s.Substring(i, l - i); // Return remaining trail
            }
        }
        public static string TextBetween(String text, string begintag, string endtag, int startindex = 0)
        {
            if (!String.IsNullOrEmpty(text))
            {
                int i1 = text.IndexOf(begintag, startindex, StringComparison.Ordinal);
                if (i1 > -1)
                {
                    i1 = i1 + begintag.Length;
                    int i2 = text.IndexOf(endtag, i1, StringComparison.Ordinal);
                    if (i2 > -1)
                    {
                        return text.Substring(i1, i2 - i1);
                    }
                }
            }
            return "";
        }
        public static void testz()
        {
            var items = TextsBetween("$a, \"^None$\"", "\"", "\"");
        }
        public static List<string> TextsBetween(string Text, string BeginTag, string EndTag)
        {
            List<string> StringList = new List<string>();
            string cs = "";
            var six = Text.IndexOf(BeginTag);
            while (six > -1 && Text.IndexOf(EndTag, six, StringComparison.Ordinal) > -1)
            {
                cs = TextBetween(Text, BeginTag, EndTag, six);
                //Text = RemoveString(Text, BeginTag + cs + EndTag);
                StringList.Add(cs);
                //six = Text.IndexOf(BeginTag, six, StringComparison.Ordinal) + BeginTag.Length;
                six = Text.IndexOf(BeginTag, six + BeginTag.Length + EndTag.Length + cs.Length, StringComparison.Ordinal);
            }
            return StringList;
        }

        public static string RemoveString(string Text, string StringToRemove)
        {
            int i1 = Text.IndexOf(StringToRemove);
            if (i1 > -1)
            {
                Text = Text.Remove(i1, StringToRemove.Length);
            }
            return Text;
        }

        public static String Format(string format, object value)
        {
            if (value == null)
            {
                return "";
            }
            else
            {
                return String.Format(format, value);
            }
        }

        public static int GetLevensteinDistance(string firstString, string secondString)
        {
            if (firstString == null)
                throw new ArgumentNullException("firstString");
            if (secondString == null)
                throw new ArgumentNullException("secondString");

            if (firstString == secondString)
                return 0;

            int[,] matrix = new int[firstString.Length + 1, secondString.Length + 1];

            for (int i = 0; i <= firstString.Length; i++)
                matrix[i, 0] = i; // deletion
            for (int j = 0; j <= secondString.Length; j++)
                matrix[0, j] = j; // insertion

            for (int i = 0; i < firstString.Length; i++)
                for (int j = 0; j < secondString.Length; j++)
                    if (firstString[i] == secondString[j])
                        matrix[i + 1, j + 1] = matrix[i, j];
                    else
                    {
                        matrix[i + 1, j + 1] = Math.Min(matrix[i, j + 1] + 1, matrix[i + 1, j] + 1); //deletion or insertion
                        matrix[i + 1, j + 1] = Math.Min(matrix[i + 1, j + 1], matrix[i, j] + 1); //substitution
                    }
            return matrix[firstString.Length, secondString.Length];
        }

        public static double GetSimilarity(string firstString, string secondString)
        {
            if (firstString == null)
                throw new ArgumentNullException("firstString");
            if (secondString == null)
                throw new ArgumentNullException("secondString");
            firstString = Strings.ConvertToEnglishChars(firstString.Trim().Replace(" ", ""));
            secondString = Strings.ConvertToEnglishChars(secondString.Trim().Replace(" ", ""));
            if (firstString == secondString)
                return 1;

            int longestLenght = Math.Max(firstString.Length, secondString.Length);
            int distance = GetLevensteinDistance(firstString, secondString);
            double percent = distance / (double)longestLenght;
            return 1 - percent;
        }
        public static bool IsDigitsOnly(string str)
        {
            foreach (char c in str)
            {
                if (c < '0' || c > '9')
                    return false;
            }

            return true;
        }

        public static bool IsDigitsOnly(string str, params char[] except)
        {
            foreach (char c in str)
            {
                if (c < '0' || c > '9')
                {
                    if (!except.Contains(c))
                    {
                        return false;
                    }
                }
            }

            return true;
        }
        public static void testnum()
        {
            var items = new List<string>() { "df", "-dsf", "11", "11.2", "123.12.", "-15.2", "-9", "-12.12.12", "-12.dds12", "" };
            var result = "";
            foreach (var item in items)
            {
                result += String.Format("{0}: {1}\r\n", item, IsNumeric(item));
            }
        }
        public static bool IsNumeric(string str)
        {
            var ix = str.StartsWith("-") ? 1 : 0;
            var separatorindex = str.IndexOf('.');
            for (int i = ix; i < str.Length; i++)
            {
                var c = str[i];
                if (c < '0' || c > '9')
                {
                    if (c == '.' && i == separatorindex)
                    {
                        continue;
                    }
                    return false;
                }
            }

            return !String.IsNullOrEmpty(str);
        }

        public static bool IsInteger(string str)
        {
            var ix = str.StartsWith("-") ? 1 : 0;
            for (int i = ix; i < str.Length; i++)
            {
                var c = str[i];
                if (c < '0' || c > '9')
                {
                    return false;
                }
            }

            return !String.IsNullOrEmpty(str);
        }

        public static string ArrayToString(string[] arr, string delimiter = ", ")
        {
            string rs = "";
            for (int i = 0; i < arr.Length; i++)
            {
                rs += delimiter + arr[i];
            }
            if (rs.StartsWith(delimiter))
            {
                rs = rs.Substring(delimiter.Length);
            }
            return rs;
        }
        public static string ArrayToString<T>(T[] arr, string delimiter = ", ")
        {
            string rs = "";
            for (int i = 0; i < arr.Length; i++)
            {
                rs += delimiter + arr[i];
            }
            if (rs.StartsWith(delimiter))
            {
                rs = rs.Substring(delimiter.Length);
            }
            return rs;
        }

        public static string ArrayToString(decimal[] arr)
        {
            string rs = "";
            var delimiter = ", ";
            for (int i = 0; i < arr.Length; i++)
            {
                rs += delimiter + arr[i].ToString();
            }
            if (rs.StartsWith(delimiter))
            {
                rs = rs.Substring(delimiter.Length);
            }
            return rs;
        }
        public static string ArrayToString(int[] arr)
        {
            string rs = "";
            var delimiter = ", ";
            for (int i = 0; i < arr.Length; i++)
            {
                rs += delimiter + arr[i].ToString();
            }
            if (rs.StartsWith(delimiter))
            {
                rs = rs.Substring(delimiter.Length);
            }
            return rs;
        }

        public static string RemoveHTMLTags(string html)
        {
            string result = "";
            if (!string.IsNullOrEmpty(html))
            {
                result = Regex.Replace(html, "<.*?>", string.Empty);
            }
            return result;

        }

        public static string RemoveHTMLComments(string html)
        {
            string result = "";
            if (!string.IsNullOrEmpty(html))
            {
                result = Regex.Replace(html, "<!--.*?-->", String.Empty, RegexOptions.Singleline);
            }
            return result;
        }

        public static string RemoveHTMLTags(string html, string tags)
        {

            //@"</?(?i:script|embed|object|frameset|frame|iframe|meta|link|style)(.|\n)*?>"
            //script|embed|object|frameset|frame|iframe|meta|link|style
            html = Regex.Replace(html, @"</?(?i:" + tags + ")(.|\n)*?>", "");

            return html;
        }

        public static String OnlyOneSpace(String text)
        {
            while (text.Contains("  "))
            {
                text = text.Replace("  ", " ");
            }
            return text.Trim();
        }

        public static String AlfaNumericOnly(String text)
        {
            return Regex.Replace(text, "[^a-zA-Z0-9 - @]", "");
        }

        public static int ContainsCount(string pattern, string text)
        {
            int result = 0;
            pattern = pattern.ToLower();
            text = text.ToLower();
            if (!string.IsNullOrEmpty(pattern))
            {
                while (text.Contains(pattern))
                {
                    result = result + 1;
                    text = text.Remove(text.IndexOf(pattern), pattern.Length);
                }
            }
            return result;

        }

        public static List<List<string>> GetPhrases(string text, int Wordcount)
        {
            string result = "";
            string[] words = text.Split(new string[] { " " }, StringSplitOptions.RemoveEmptyEntries);
            List<string> wordlist = new List<string>();
            List<List<string>> wordSlist = new List<List<string>>();
            int i = 0;
            int j = 0;
            string NotKeyWords = "";
            for (i = 1; i <= Wordcount; i++)
            {
                wordlist = new List<string>();
                int counter = 0;
                string word = "";
                for (j = 0; j <= words.Length - 1; j++)
                {
                    counter = counter + 1;
                    word += " " + words[j];
                    if (counter == i)
                    {
                        word = word.Trim().ToLower();
                        if (wordlist.Contains(word) == false & word.Length > (2 * i) + i & !NotKeyWords.Contains("," + word + ","))
                        {
                            wordlist.Add(word);

                        }
                        counter = counter - 1;
                        if (word.Contains(" "))
                        {
                            word = word.Substring(word.IndexOf(" "));
                        }
                        else
                        {
                            word = "";
                        }

                    }
                    else
                    {
                    }
                }
                wordSlist.Add(wordlist);

            }
            return wordSlist;
        }

        public static String ConvertToEnglishChars(String text)
        {
            text = text == null ? "" : text;
            char[] mixchars = @"áéíóöőúüűșşţțâăîëêèçåäãöôõóőòćĉĝěęėĕēéāġģğċčŝśšúűũūŭůżźžķĵï".ToCharArray();
            char[] engchars = @"aeiooouuussttaaieeecaaaooooooccgeeeeeeagggccsssuuuuuuzzzkji".ToCharArray();
            for (int i = 0; i < mixchars.Length; i++)
            {
                string strChar = mixchars.GetValue(i).ToString();
                string strEngChar = engchars.GetValue(i).ToString();
                if (text.Contains(strChar))
                {
                    text = text.Replace(strChar, strEngChar);
                }
                if (text.Contains(strChar.ToUpper()))
                {
                    text = text.Replace(strChar.ToUpper(), strEngChar.ToUpper());
                }
            }
            return text;
        }

        public static string GetForURL(string text)
        {
            text = ConvertToEnglishChars(text);
            text = text.Replace("-", " ");
            text = Regex.Replace(text, "[^a-zA-Z0-9 - @ -]", "");
            text = OnlyOneSpace(text);
            text = text.Replace(" ", "-");

            return text;
        }

        public static string GetKeyWords(string Title, string text)
        {
            Title = ConvertToEnglishChars(Title);
            text = ConvertToEnglishChars(text);

            Title = AlfaNumericOnly(Title);
            Title = Title.Replace(" at ", ",").Replace(" @ ", ",");
            string result = "";
            if (Title.Length < 80)
            {
                result = Title;
            }
            else
            {
                text = Title + ", " + Title + ", " + text;
            }
            NameValueCollection keywords = new NameValueCollection();
            text = Strings.RemoveHTMLTags(text);
            text = OnlyOneSpace(text);
            text = AlfaNumericOnly(text);
            string[] words = text.Split(new string[] { " " }, StringSplitOptions.RemoveEmptyEntries);
            int totalwordcount = words.Length;
            List<List<string>> phrases = new List<List<string>>();
            phrases = GetPhrases(text, 3);
            List<KeyWord2> keywordlist = new List<KeyWord2>();

            int counter = 0;
            int counter2 = 0;
            foreach (List<string> phrasetype in phrases)
            {
                counter2 = counter2 + 1;
                foreach (string phrase in phrasetype)
                {
                    if (ContainsCount(" " + phrase + " ", " " + text + " ") > 1)
                    {
                        //result += phrase + "," ' ":" + ContainsCount(" " + phrase + " ", " " + text + " ").ToString + ", "
                        KeyWord2 kw = new KeyWord2(phrase.Trim(), ContainsCount(" " + phrase + " ", " " + text + " ") + phrases.Count - counter);

                        //GetGoogleCount(phrase)

                        keywordlist.Add(kw);
                    }
                }
                counter = counter + 1;
                //result += "<br/> <<<<< " + counter.ToString + " word Phrases<br/>"

            }
            keywordlist.OrderByDescending(k => k.Density);
            int limit = keywordlist.Count;
            if (limit > 8)
            {
                limit = 8;
            }

            for (int i = 0; i < limit; i++)
            {
                result += "," + keywordlist[i].Name;
            }
            if (result.Length > 300)
            {
                result = result.Remove(result.LastIndexOf(",", 300, 300));
            }
            return result;
        }

        public static byte[] GetBytes(string str)
        {
            byte[] bytes = new byte[str.Length * sizeof(char)];
            System.Buffer.BlockCopy(str.ToCharArray(), 0, bytes, 0, bytes.Length);
            return bytes;
        }

        public static string GetString(byte[] bytes)
        {
            char[] chars = new char[bytes.Length / sizeof(char)];
            System.Buffer.BlockCopy(bytes, 0, chars, 0, bytes.Length);
            return new string(chars);
        }

        public static string TrimTo(string name, int p)
        {
            if (name.Length > p + 3)
            {
                name = name.Remove(p);
                name = name + "...";
            }
            return name;
        }

        public static string RemoveFrom(string name, int p)
        {
            if (name.Length > p + 3)
            {
                name = name.Remove(p);
                name = name + "...";
            }
            return name;
        }

        public static string HtmlDecode(string text)
        {
            return System.Net.WebUtility.HtmlDecode(text);
        }

        public static string HtmlEncode(string text)
        {
            if (text == null)
                return null;

            StringBuilder sb = new StringBuilder(text.Length);

            int len = text.Length;
            for (int i = 0; i < len; i++)
            {
                switch (text[i])
                {

                    case '<':
                        sb.Append("&lt;");
                        break;
                    case '>':
                        sb.Append("&gt;");
                        break;
                    case '"':
                        sb.Append("&quot;");
                        break;
                    case '&':
                        sb.Append("&amp;");
                        break;
                    default:
                        if (text[i] > 159)
                        {
                            // decimal numeric entity
                            sb.Append("&#");
                            sb.Append(((int)text[i]).ToString(CultureInfo.InvariantCulture));
                            sb.Append(";");
                        }
                        else
                            sb.Append(text[i]);
                        break;
                }
            }
            return sb.ToString();
        }


        public static string ListToString<T>(IList<T> items, string delimiter = ", ")
        {
            var rs = new StringBuilder();
            for (int i = 0; i < items.Count; i++)
            {
                if (i > 0)
                {
                    rs.Append(delimiter);
                }
                rs.Append(items[i]);
            }

            return rs.ToString();
        }

        public static bool IsXMLFile(string path)
        {
            return (path.EndsWith(".xml") || path.EndsWith(".xsd"));
        }
    }
}
