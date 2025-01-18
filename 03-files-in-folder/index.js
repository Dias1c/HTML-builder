const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');

const pathToDir = path.join(__dirname, 'secret-folder');

const printFileInfoByPath = (pathToFile) => {
  fs.stat(pathToFile, async (err, stat) => {
    if (err) {
      console.error('ERROR: printFileInfo:', err);
      return;
    }

    const filename = path.basename(pathToFile);
    const filetext = path.extname(pathToFile);
    const filesize = stat.size;
    console.log(`${filename} - ${filetext.replace('.', '')} - ${filesize}b`);
  });
};

const getDirElements = async (path) => {
  return await fsp.readdir(path, {
    withFileTypes: true,
  });
};

const walkDir = async (pathDir, nesting = false) => {
  const elems = await getDirElements(pathDir);
  for (let i = 0; i < elems.length; i++) {
    const element = elems[i];
    const pathToWalk = path.join(element.path, element.name);
    if (element.isDirectory()) {
      if (nesting) {
        await walkDir(pathToWalk);
      }
      continue;
    }

    if (element.isFile()) {
      printFileInfoByPath(pathToWalk);
      continue;
    }
  }
};
walkDir(pathToDir);
