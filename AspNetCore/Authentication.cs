using System;
using System.Collections.Generic;
using System.Text;

namespace ApiModel
{
    public enum UserType
    {
        Administrator=1,
        Internal=2,
        External=3,
    }
    public class User
    {
        public UserType Type = UserType.External;
        public string UserName;
        public string ID;
        public string EmployeeId;
        public string FullName;
        public string Email;

        public List<Role> Roles = new List<Role>();
        public List<Company> Companies = new List<Company>();
        public Dictionary<string, List<Dictionary<string, object>>> Permissions = new Dictionary<string, List<Dictionary<string, object>>>();

    }

    public class Company:Dictionary<string, object>
    {
        public string ID
        {
            get { return String.Format("{0}", this["Id"]); }
            set
            {
                if (!this.ContainsKey("Id")) { this.Add("Id", null); }
                this["Id"] = value;
            }
        }
        public string Email
        {
            get { return String.Format("{0}", this["Email"]); }
            set
            {
                if (!this.ContainsKey("Email")) { this.Add("Email", null); }
                this["Email"] = value;
            }
        }
        public string Name
        {
            get { return String.Format("{0}", this["Name"]); }
            set
            {
                if (!this.ContainsKey("Name")) { this.Add("Name", null); }
                this["Name"] = value;
            }
        }
        public Company() { }
        public Company(Dictionary<string, object> source) {
            foreach (var kv in source)
            {
                this.Add(kv.Key, kv.Value);
            }
        }
        public User User { get; set; }
    }

    public class Role
    {
        public string ID;
        public string Name;
    }


}
