using ApiModel;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Web;

namespace DataService.Models
{
    public class DocumentDataService
    {
        public Result<StringObject> GetPdf(String html,String wsid, String filename)
        {
            var pdffolder= "~/Files/Documents/" + wsid + "/PDF/";
            var pdfpath = pdffolder + filename; ;
            var absolutepdffolder = ServerApp.Current.MapPath(pdffolder);
            var absolutepdfpath = absolutepdffolder + filename;
            var tempfolder = ServerApp.Current.MapPath("~/Files/Documents/Temp/");
            var temphtmlpath = tempfolder + filename+".html";
            try
            {
                if (!System.IO.Directory.Exists(absolutepdffolder))
                {
                    System.IO.Directory.CreateDirectory(absolutepdffolder);
                }
                if (!System.IO.Directory.Exists(tempfolder))
                {
                    System.IO.Directory.CreateDirectory(tempfolder);
                }
                System.IO.File.WriteAllText(temphtmlpath, html);
                var exitcode = CreatePdfFromHtml(absolutepdfpath, temphtmlpath);
                //System.IO.File.Delete(temphtmlpath);
                var result = new Result<StringObject>();
                result.Model.Value = pdfpath;
                result.ViewData.Add("ChromeExitCode", exitcode);
                return result;

            }
            catch (Exception ex) {
                return Result<StringObject>.Failed(ex);

            }

        }

        public string CreatePdfFromHtml(String absolutepdfpath,String temphtmlpath)
        {
            ProcessStartInfo info = new ProcessStartInfo(ServerApp.Current.Settings.ChromeExecutable);
            info.Arguments = "--headless --print-to-pdf=\"" + absolutepdfpath + "\" \"" +  temphtmlpath + "\"";
            info.CreateNoWindow = true;
            info.RedirectStandardOutput = true;
            //info.UseShellExecute = true;
            if (!String.IsNullOrEmpty(ServerApp.Current.Settings.Username))
            {
                info.UserName = ServerApp.Current.Settings.Username;
                var secure = new System.Security.SecureString();
                foreach (char c in ServerApp.Current.Settings.Password)
                {
                    secure.AppendChar(c);
                }
                info.Domain = ServerApp.Current.Settings.UserDomain;
                info.Password = secure;
                info.Verb = "runas";
            }
            info.UseShellExecute = false;
            var exitcode = "0";
            //info.WindowStyle = ProcessWindowStyle.Hidden;
            //using (new ERPService.Models.Impersonator(ServerApp.Current.Settings.Username, ServerApp.Current.Settings.UserDomain, ServerApp.Current.Settings.Password))
            //{
                using (Process process = Process.Start(info))
                {
                    process.ErrorDataReceived += Process_ErrorDataReceived;
                    //
                    // Read in all the text from the process with the StreamReader.
                    //
                    //using (StreamReader reader = process.StandardOutput)
                    //{
                    //    string result = reader.ReadToEnd();
                    //    Console.Write(result);
                    //}
                    process.WaitForExit(10 * 1000);
                    exitcode = process.ExitCode.ToString();
                    exitcode = exitcode + " " + info.Verb + " " + info.UserName;
                    process.Close();
                }
            //}
            return exitcode;
        }

        private void Process_ErrorDataReceived(object sender, DataReceivedEventArgs e)
        {
            throw new Exception("ChromeExecutionError_:"+e.Data);
        }


        public List<Dictionary<string, object>> GetItems(string TypeName)
        {
            var result = new List<Dictionary<string, object>>();
            var filedatapath = ServerApp.Current.MapPath("~/FileData/");
            if (System.IO.Directory.Exists(filedatapath))
            {
                var files = System.IO.Directory.GetFiles(filedatapath, "*-" + TypeName + ".json");

                foreach (var file in files)
                {
                    var item = new Dictionary<string, object>();
                    var itemcontent = System.IO.File.ReadAllText(file);
                    item = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, object>>(itemcontent);
                    result.Add(item);
                }
            }
            return result;
        }
        public Dictionary<string, object> GetItem(string TypeName, string id)
        {
            var filedatapath = ServerApp.Current.MapPath("~/FileData/");

            if (System.IO.Directory.Exists(filedatapath))
            {
                var result = new List<Dictionary<string, object>>();
                var filename = id + "-" + TypeName + ".json";
                var filepath = filedatapath + filename;
                var item = new Dictionary<string, object>();
                var itemcontent = System.IO.File.ReadAllText(filepath);
                item = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, object>>(itemcontent);
                return item;

            }
            else
            {
                return null;
            }
        }

        public string SaveItem(Dictionary<string, object> item)
        {
            var filedatapath = ServerApp.Current.MapPath("~/FileData/");
            if (!System.IO.Directory.Exists(filedatapath))
            {
                System.IO.Directory.CreateDirectory(filedatapath);
            }

            var typename = item["TypeName"];
            var idobj = item.ContainsKey("Id") ? item["Id"] : null;
            if (idobj == null)
            {
                idobj = Guid.NewGuid().ToString();
                if (!item.ContainsKey("id")) { item.Add("id", null); }
                item["id"] = idobj;
            }
            var filename = String.Format("{0}-{1}.json", idobj, typename);
            var filepath = filedatapath + filename;
            var jsondata = Newtonsoft.Json.JsonConvert.SerializeObject(item);
            System.IO.File.WriteAllText(filepath, jsondata);
            return String.Format("{0}",idobj);
        }
        public void Remove(string id)
        {
            var filedatapath = ServerApp.Current.MapPath("~/FileData/");

            if (System.IO.Directory.Exists(filedatapath))
            {


                var filename = String.Format("{0}-*.json", id);
                var filename2 = String.Format("{0}-*-removed.json", id);
                var filepath = filedatapath + filename;
                var filepath2 = filedatapath + filename2;
                System.IO.File.Move(filepath, filepath2);
            }
        }
    }
}