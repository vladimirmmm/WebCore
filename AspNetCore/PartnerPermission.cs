namespace ApiModel
{
    public enum PermissionLoadEnum
    {
        UNKNOWN,
        FORM
    }
    public class PartnerPermission
    {
        public PartnerPermission()
        {

        }
        public PermissionLoadEnum PermissionLoadType { get; set; }

        public string ActionName { get; set; }
        public long Tag { get; set; }
    }
}