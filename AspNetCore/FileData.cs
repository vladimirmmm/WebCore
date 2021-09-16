using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace ApiModel
{
    public class FileData
    {
        public string filename = "";
        
        private Stream _Stream = null;

        public Stream GetStream()
        {
            return _Stream;
        }
        public void SetStream(Stream stream)
        {
            _Stream = stream;
        }
    }
}
