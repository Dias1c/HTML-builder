const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

/**
 *
 * @param {string} src
 * @returns {fs.Stats}
 */
async function getPathStat(src) {
  return new Promise((res, rej) => {
    fs.stat(src, (err, stat) => {
      if (err) {
        rej(err);
        return;
      }
      res(stat);
    });
  });
}

/**
 *
 * @param {string} src
 * @returns
 */
function getCSSFileData(src) {
  return new Promise((res, rej) => {
    fs.readFile(src, 'utf-8', (err, data) => {
      if (err) {
        rej(err);
        return;
      }
      res(data);
    });
  });
}

/**
 *
 * @param {string} src
 * @param {string} target
 */
async function buildStyles(srcDir, targetFile, nesting = false) {
  const paths = await fsp.readdir(srcDir, {
    recursive: nesting,
  });

  const contents = [];
  for (const p of paths) {
    const filePath = path.join(srcDir, p);
    const stat = await getPathStat(filePath);
    if (stat.isDirectory()) {
      continue;
    }

    if (path.extname(p) != '.css') {
      continue;
    }
    const data = await getCSSFileData(filePath);
    contents.push(data);
  }

  const writeStream = fs.createWriteStream(targetFile);
  for (const content of contents) {
    await new Promise((res, rej) => {
      writeStream.write(content, (err) => {
        if (err) {
          rej(err);
          return;
        }
        res();
      });
    });
  }
  writeStream.close();
}

const pathSrcDir = path.join(__dirname, 'styles');
const pathTargetFile = path.join(__dirname, 'project-dist/bundle.css');

buildStyles(pathSrcDir, pathTargetFile);
