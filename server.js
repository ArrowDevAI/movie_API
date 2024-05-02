const http = require('http');
const fs = require('fs');
const { URL } = require('url');

const server = http.createServer((req, res) => {
  let addr = req.url;
  let q = new URL(addr, 'http://'+ req.headers.host);
  let logFilePath = "./log.txt";

  console.log(`Received Request: ${addr}`);
  console.log(`Requested URL: ${req.url}`);

  fs.appendFile(logFilePath, 'URL: ' + addr + '\nTimestamp: ' + new Date() + '\n\n', (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Added Request to log.');
    }
  });

  if (q.pathname.includes('documentation')) {
    filePath = (__dirname + '/documentation.html');
  } else {
    filePath = 'index.html';
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      throw err;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(data);
    res.end();

  });

}).listen(8080);
console.log('Server is running on Port 8080.');