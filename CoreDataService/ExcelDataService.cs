using ApiModel;
using DataService.Models.Data;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.OleDb;
using System.IO;
using System.Text;

namespace DataService.Models
{
    public class ExcelDataService
    {
        private DataProvider Provider = new ExcelDataProvider();
        public ExcelDataService()
        {
            
        }

        public Result<List<Dictionary<string, Object>>> GetQueryResult(string query,string options,string excelpath)
        {
            Exception ex2=null;
            var result = new List<Dictionary<string, Object>>();
            var responsemodel = new Result<List<Dictionary<string, Object>>>();

            string connString = "";
            string strFileType = Path.GetExtension(excelpath).ToLower();
            //";Extended Properties=\"Excel 8.0;HDR=Yes;IMEX=1\""
            //";Extended Properties=\"Excel 12.0;HDR=Yes;IMEX=1\""
            //if (strFileType.Trim() == ".xls")
            //{
            //    connString = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=" + excelpath + ";" + options;
            //}
            //else if (strFileType.Trim() == ".xlsx")
            //{
                connString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=" + excelpath + ";" + options;
            //}
            var connection = new OleDbConnection(connString);
            //var connection = new FbConnection(connetionstring);
            try {
                connection.Open();

            }
            catch (Exception ex) {
                ex.Data.Add("Connection", connString);
                throw ex;
            }
            responsemodel.ViewData.Add("Query", query);
            var dt = DateTime.Now;
            double duration=0;
            try
            {
                //responsemodel = dbData.GetDataDictionaryNormal(connection, sqlqueries);
                responsemodel.Model = Provider.GetData(query, connection, null, true);
                duration = DateTime.Now.Subtract(dt).TotalMilliseconds;
              
            }
            catch (Exception ex)
            {
                duration = DateTime.Now.Subtract(dt).TotalMilliseconds;
                responsemodel.AddError(ex);
            }
            finally
            {
                if (connection.State == ConnectionState.Open)
                {
                    connection.Close();
                }
            }
            responsemodel.ViewData.Add("Durations", duration);
            return responsemodel;

        }

        public void test()
        {
            //var path = @"C:\My\Development\DyntellSPA\docs\Alsena\Comandak\2.1 COMANDA KULMA W41 FX INTREG KIT.xlsx";
            var path = @"C:\My\Developement\DyntellSPA\docs\Alsena\Uj comandak\COMANDA VICTOR ECKSOFA MALMO-2sorral.xlsx";
            var excelservice = new ExcelDataService();
            //var result = excelservice.GetQueryResult("SELECT * FROM [Sheet1$]  WHERE [FURNIZOR] IS NOT NULL", path);
            var result = excelservice.GetQueryResult("SELECT * FROM [Sheet1$]  WHERE [FURNIZOR] IS NOT NULL", "Extended Properties=\"Excel 12.0;HDR=Yes;IMEX=1\"", path);
            var jsons = Newtonsoft.Json.JsonConvert.SerializeObject(result);
        }

        public void test2()
        {
            //var path = @"\\rows01142-02\Tasks\00530360\OTHREP-B0019-LUB0019_LU_RES010201_LDTIND_2018-12-31_00000000000000000_NEW.xlsx";
            var path = @"\\rows01142-02\Tasks\00530360\COFREP-B00000019-2018-12-CLDCON-00-C-N---CLDCON.xlsx";
            var outputpath2 = path.Replace(".xlsx",".dat");
            var sb = new StringBuilder();
            sb.AppendLine("H[1,DU_LDR_RT5000_CONS,DU_LDR_RT5000_CONS,20181231,20181231]");
            Export(path,sb, "T99.00","C1:D12");
            Export(path,sb, "T01.00","B4:Z74");
            Export(path,sb, "T02.00","C3:E21");
            Export(path,sb, "T03.01","A4:T15286");
            Export(path,sb, "T03.02","A4:J11");
            Export(path, sb, "T03.03", "A4:J9");

            System.IO.File.WriteAllText(outputpath2, sb.ToString());
        }

        public void Export(string file,StringBuilder sb, string sheet,string range,string where="") {
            var outputfolder = file.Substring(0, file.LastIndexOf("\\") + 1);
            var outputpath = outputfolder + sheet + ".json";
            var outputpath2 = outputfolder + sheet + ".dat";
            var excelservice = new ExcelDataService();
            var result = excelservice.GetQueryResult("SELECT * FROM ["+ sheet + "$"+range+"] "+ where, "Extended Properties=\"Excel 12.0;HDR=Yes;IMEX=1\"", file);

            var rowid = 1;
            foreach (var item in result.Model) {
                var row = item.ContainsKey("F1")?item["F1"]: "dynRow1";
                var extension = "Total";
                
                foreach (var key in item.Keys)
                {
                    var col = key;
                    var value = item[key];
                    sb.AppendLine(String.Format("D[5000,{0},{4},{5},{1},{2},{3},,,,,]", sheet, row, col, value,extension,rowid));
                }
                rowid++;
            }


            //var jsons = Newtonsoft.Json.JsonConvert.SerializeObject(result);
            //System.IO.File.WriteAllText(outputpath, jsons);
      

        }

    }
}