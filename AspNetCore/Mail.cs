using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace ApiModel
{
    public class EmailAttachment
    {
        public string Path { get; set; }

        private Stream _Stream = null;
        public Stream GetStream() { return _Stream; }
        public void SetStream(Stream value) { _Stream = value; }
    }
    public class EmailMessage
    {
        private List<string> _To = new List<string>();
        public List<string> To { get { return _To; } set { _To = value; } }

        private List<string> _CC = new List<string>();
        public List<string> CC { get { return _CC; } set { _CC = value; } }

        private List<string> _BCC = new List<string>();
        public List<string> BCC { get { return _BCC; } set { _BCC = value; } }

        public string Subject { get; set; }

        public string Body { get; set; }

        public List<EmailAttachment> Attachments = new List<EmailAttachment>();
    }
}
