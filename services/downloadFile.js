const fs = require('fs');
const https = require('https');

module.exports = (url, destination) => {
  return new Promise((resolve, reject) => {
    let file = fs.createWriteStream(destination);
    const request = https.get(url, function(response) {
      response.pipe(file);
      file.on('finish', function() {
        file.close()
        resolve()
      });
    });
  })
}
