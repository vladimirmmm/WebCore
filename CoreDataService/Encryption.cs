using System;
using System.Collections.Generic;
using System.Text;

namespace DataService.Models
{
    public static class PWEncryptor
    {
        public static Encoding PasswordEncoding
        {
            get;
            set;
        }

        static PWEncryptor()
        {
            Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
            PasswordEncoding = Encoding.GetEncoding(1250);
        }

        public static string DecryptPassword(string pOrigValue, string key)
        {
            byte[] bytes = PasswordEncoding.GetBytes(key);
            byte[] bytes2 = PasswordEncoding.GetBytes(pOrigValue);
            byte[] array = new byte[bytes2.Length];
            for (int i = 0; i < bytes2.Length; i++)
            {
                array[i] = (byte)((bytes2[i] - 7 - bytes[i % bytes.Length]) % 255);
            }
            return PasswordEncoding.GetString(array, 0, array.Length);
        }

        public static string EncryptPassword(string pOrigValue, string key)
        {
            byte[] bytes = PasswordEncoding.GetBytes(key);
            byte[] bytes2 = PasswordEncoding.GetBytes(pOrigValue);
            byte[] array = new byte[bytes2.Length];
            for (int i = 0; i < pOrigValue.Length; i++)
            {
                array[i] = (byte)((bytes2[i] + bytes[i % bytes.Length]) % 255 + 7);
            }
            return PasswordEncoding.GetString(array, 0, bytes2.Length);
        }
    }
}
