const os = require('os');
const process = require('process');
const path = require('path');
const fs = require('fs');
const stdin = process.stdin;

const fileName = path.join(__dirname, 'text.txt');

console.log('Enter your text (write "exit" or use "ctrl+c" to finish):');
fs.writeFile(fileName, '', (err) => {
  if (!err) {
    return;
  }
  console.error('ERROR: fs.writeFile', err);
});

const breakListeningWithMessage = () => {
  console.log('Bye');
  stdin.destroy();
};

process.on('SIGINT', () => breakListeningWithMessage());

stdin.on('data', (chunk) => {
  const text = chunk.toString();
  if (text == `exit${os.EOL}`) {
    breakListeningWithMessage();
    return;
  }

  fs.appendFile(fileName, text, (err) => {
    if (!err) {
      return;
    }
    console.error('ERROR: fs.appendFile', err);
  });
});
