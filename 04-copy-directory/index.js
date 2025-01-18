const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

/**
 *
 * @param {string} targetPath
 */
async function rmSafe(targetPath) {
  await new Promise((res, rej) => {
    fs.rm(
      targetPath,
      {
        recursive: true,
      },
      (err) => {
        if (err && err.code != 'ENOENT') {
          rej(err);
          return;
        }
        res();
      },
    );
  });
}

/**
 * @param {string} src
 * @returns {fs.Stats}
 */
async function getPathStat(src) {
  return await new Promise((res, rej) => {
    fs.stat(src, async (err, stat) => {
      if (err) {
        rej(err);
        return;
      }

      res(stat);
    });
  });
}

/**
 * @param {string} src
 * @param {string} target
 */
async function deepCopy(src, target, withRemove = true) {
  if (withRemove) {
    await rmSafe(target);
  }
  const srcStat = await getPathStat(src);
  if (srcStat.isFile()) {
    fs.copyFile(src, target, (err) => {
      if (!err) {
        return;
      }
      console.error(err);
    });
    return;
  }

  if (!srcStat.isDirectory()) {
    return;
  }

  await new Promise((res, rej) => {
    fs.mkdir(
      target,
      {
        mode: srcStat.mode,
        recursive: true,
      },
      (err) => {
        if (err) {
          rej(err);
          return;
        }
        res();
      },
    );
  });

  const paths = await fsp.readdir(src);
  for (let i = 0; i < paths.length; i++) {
    const el = paths[i];
    const elemSrc = path.join(src, el);
    const elemTarget = path.join(target, el);
    await deepCopy(elemSrc, elemTarget);
  }
}

const pathSrc = path.join(__dirname, 'files');
const pathTarget = path.join(__dirname, 'files-copy');

deepCopy(pathSrc, pathTarget);
