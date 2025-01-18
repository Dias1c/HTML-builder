const { stdin } = require('process');
const path = require('path');
const fs = require('fs');

const fileName = path.join(__dirname, 'text.txt');

stdin.on('data', (chunk) => {
  fs.appendFile(fileName, chunk.toString(), (err) => {
    if (!err) {
      return;
    }
    console.error('ERROR: fs.appendFile');
  });
});
