const fs = require('fs');
const path = require('path');
const { stdout } = require('node:process');

const filePath = path.join(__dirname, 'text.txt');

const readStream = fs.createReadStream(filePath);
readStream.on('data', (chunk) => {
  stdout.write(chunk);
});
