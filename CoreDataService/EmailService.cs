using ApiModel;
using MailKit.Net.Smtp;
using MimeKit;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace DataService.Models
{
    public class SmtpAccount
    {
        public string EmailAddress { get; set; }
        public string Server { get; set; }
        public int Port { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
    }

    public class EmailService
    {
        private Dictionary<string, SmtpAccount> Accounts = new Dictionary<string, SmtpAccount>();

        public EmailService()
        {

        }
        public EmailService(Dictionary<string, SmtpAccount> Accounts) {
            this.Accounts = Accounts;
        }
        public Result<StringObject> SendEmail(EmailMessage msg) {
            var message = new MimeMessage();
            var Account = this.Accounts["Default"];
            foreach (var item in msg.To) {
                message.To.Add(new MailboxAddress(item));
            }
            foreach (var item in msg.CC)
            {
                message.Cc.Add(new MailboxAddress(item));
            }
            foreach (var item in msg.BCC)
            {
                message.Bcc.Add(new MailboxAddress(item));
            }
            message.From.Add(new MailboxAddress(Account.EmailAddress));
            message.Subject = msg.Subject;

            // create our message text, just like before (except don't set it as the message.Body)
            var body = new TextPart(MimeKit.Text.TextFormat.Html)
            {
                Text = msg.Body
            };

            // create an image attachment for the file located at path
            var multipart = new Multipart("mixed");
            multipart.Add(body);
            foreach(var attachemnt in msg.Attachments)
            {
                var path = ServerApp.Current.MapPath(attachemnt.Path);
                //var stream = File.OpenRead(path);
                var attachment = new MimePart()
                {
                    Content = new MimeContent(new FileStream(path, FileMode.Open, FileAccess.Read)),               
                    ContentDisposition = new ContentDisposition(ContentDisposition.Attachment),
                    ContentTransferEncoding = ContentEncoding.Base64,
                    FileName = Path.GetFileName(path)
                };
                //stream.Close();
                // now create the multipart/mixed container to hold the message text and the
                // image attachment

                multipart.Add(attachment);
            }


            // now set the multipart/mixed as the message body
            message.Body = multipart;


            using (var client = new SmtpClient())
            {
                client.ServerCertificateValidationCallback = (s, c, h, e) => true;
                try
                {
                    //client.Connect("smtp.office365.com", 587);
                    client.Connect(Account.Server, Account.Port);
                } catch (Exception ex) {
                    return Result<StringObject>.Failed(String.Format("Connect ({0},{1}): {2}", Account.Server, Account.Port, ex));
                }
                // Note: since we don't have an OAuth2 token, disable
                // the XOAUTH2 authentication mechanism.
                client.AuthenticationMechanisms.Remove("XOAUTH2");

                // Note: only needed if the SMTP server requires authentication
                try
                {
                    client.Authenticate(Account.Username, Account.Password);
                }
                catch (Exception ex)
                {
                    return Result<StringObject>.Failed("Authenticate: " + ex.Message);

                }
                var result = new Result<StringObject>();
                try
                {
                    client.Send(message);
                    client.Disconnect(true);
                    result.Model.Value = "";
                }
                catch (Exception ex)
                {
                    result.AddError(ex);

                }
                return result;

            }
        }

        public async Task<Result<StringObject>> SendEmailAsync(EmailMessage msg)
        {
            var message = new MimeMessage();
            var Account = this.Accounts["Default"];
            foreach (var item in msg.To)
            {
                message.To.Add(new MailboxAddress(item));
            }
            foreach (var item in msg.CC)
            {
                message.Cc.Add(new MailboxAddress(item));
            }
            foreach (var item in msg.BCC)
            {
                message.Bcc.Add(new MailboxAddress(item));
            }
            message.From.Add(new MailboxAddress(Account.EmailAddress));
            message.Subject = msg.Subject;

            // create our message text, just like before (except don't set it as the message.Body)
            var body = new TextPart(MimeKit.Text.TextFormat.Html)
            {
                Text = msg.Body
            };

            // create an image attachment for the file located at path
            var multipart = new Multipart("mixed");
            multipart.Add(body);
            foreach (var attachemnt in msg.Attachments)
            {
                var path = ServerApp.Current.MapPath(attachemnt.Path);
                //var stream = File.OpenRead(path);
                var attachment = new MimePart()
                {
                    Content = new MimeContent(new FileStream(path, FileMode.Open, FileAccess.Read)),
                    ContentDisposition = new ContentDisposition(ContentDisposition.Attachment),
                    ContentTransferEncoding = ContentEncoding.Base64,
                    FileName = Path.GetFileName(path)
                };
                //stream.Close();
                // now create the multipart/mixed container to hold the message text and the
                // image attachment

                multipart.Add(attachment);
            }


            // now set the multipart/mixed as the message body
            message.Body = multipart;


            using (var client = new SmtpClient())
            {
                client.ServerCertificateValidationCallback = (s, c, h, e) => true;
                try
                {
                    //client.Connect("smtp.office365.com", 587);
                    await client.ConnectAsync(Account.Server, Account.Port);
                }
                catch (Exception ex)
                {
                    return Result<StringObject>.Failed(String.Format("Connect ({0},{1}): {2}", Account.Server, Account.Port, ex));
                }
                // Note: since we don't have an OAuth2 token, disable
                // the XOAUTH2 authentication mechanism.
                client.AuthenticationMechanisms.Remove("XOAUTH2");

                // Note: only needed if the SMTP server requires authentication
                try
                {
                    await client.AuthenticateAsync(Account.Username, Account.Password);
                }
                catch (Exception ex)
                {
                    return Result<StringObject>.Failed("Authenticate: " + ex.Message);

                }
                var result = new Result<StringObject>();
                try
                {
                    await client.SendAsync(message);
                    await client.DisconnectAsync(true);
                    result.Model.Value = "";
                }
                catch (Exception ex)
                {
                    result.AddError(ex);

                }
                return result;

            }
        }


        public void Test()
        {
            var msg = new EmailMessage();
            ServerApp.Current = new TestServerApp();
            ServerApp.Current.Load(@"C:\My\Developement\DyntellSPA\Partner\XPartnerApi\data\serverconfig.json");
            var emailservice = new EmailService(ServerApp.Current.Settings.SmtpAccounts);
            msg.To = new List<string>() { "cas_vladimir@yahoo.com" };
            msg.Subject = "Test1";
            msg.Body = "<div style=\"background: red\">message 2</div>";
            var r= emailservice.SendEmail(msg);
        }
    }
}