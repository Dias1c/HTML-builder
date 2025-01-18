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
function getFileData(src) {
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
 * @param {string} src
 * @param {string} target
 * @returns {Promise}
 */
async function deepCopy(src, target) {
  const srcStat = await getPathStat(src);
  if (srcStat.isFile()) {
    fs.copyFile(src, target, (err) => {
      if (!err) {
        return err;
      }
      console.error(err);
    });
    return null;
  }

  if (!srcStat.isDirectory()) {
    return null;
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
    const err = await deepCopy(elemSrc, elemTarget);
    if (err) {
      return err;
    }
  }

  return null;
}

/**
 *
 * @param {string} src
 * @param {string} target
 * @param {boolean} nesting
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
    const data = await getFileData(filePath);
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

/**
 * @param {string} targetPath
 */
async function makeDir(targetPath) {
  await new Promise((res, rej) => {
    fs.mkdir(
      targetPath,
      {
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
}

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
 *
 * @param {string} str
 * @param {Object} obj
 * @returns {string}
 */
function getBundledContent(str, obj) {
  let result = str;

  for (const [name, content] of Object.entries(obj)) {
    result = result.replaceAll(`{{${name}}}`, content);
  }

  return result;
}

/**
 *
 * @param {string} templatePath
 * @param {string} componentsDir
 * @param {string} targetPath
 */
async function buildHtmlTemplate(templatePath, componentsDir, targetPath) {
  const componentsPaths = await fsp.readdir(componentsDir);
  const contentsObj = {};
  for (const p of componentsPaths) {
    const filePath = path.join(componentsDir, p);
    const stat = await getPathStat(filePath);
    if (stat.isDirectory()) {
      continue;
    }
    if (path.extname(p) != '.html') {
      continue;
    }
    const content = await getFileData(filePath);
    const fileBaseName = path.basename(p, '.html');
    contentsObj[fileBaseName] = content;
  }

  const htmlTemplateContent = await getFileData(templatePath);
  const htmlEntryPointContent = getBundledContent(
    htmlTemplateContent,
    contentsObj,
  );

  await writeContentToFile(targetPath, htmlEntryPointContent);
}

/**
 *
 * @param {string} targetPath
 * @param {string} content
 */
async function writeContentToFile(targetPath, content) {
  const writeStream = fs.createWriteStream(targetPath);
  await new Promise((res, rej) => {
    writeStream.write(content, (err) => {
      if (err) {
        rej(err);
        return;
      }
      res();
    });
  });
  writeStream.close();
}

/**
 *
 * @param {Object} src
 * @param {string} targetDir
 */
async function buildProject(
  {
    /**
     * @type {string}
     */
    pathToStylesDir,
    /**
     * @type {string}
     */
    pathToAssetsDir,
    /**
     * @type {string}
     */
    pathToComponentsDir,
    /**
     * @type {string}
     */
    pathToTempleteFile,
  },
  /**
   * @type {string}
   */
  targetDir,
) {
  if (!targetDir) {
    throw new Error('buildProject: property "targetDir" is required');
  }
  await rmSafe(targetDir);
  await makeDir(targetDir);

  if (!pathToTempleteFile) {
    throw new Error('buildProject: property "pathToTempleteFile" is required');
  }

  if (!pathToComponentsDir) {
    throw new Error('buildProject: property "pathToComponentsDir" is required');
  }

  const pathToEntryPointHtml = path.join(targetDir, 'index.html');
  buildHtmlTemplate(
    pathToTempleteFile,
    pathToComponentsDir,
    pathToEntryPointHtml,
  );

  if (pathToStylesDir) {
    const targetPathToStyles = path.join(targetDir, 'style.css');
    await buildStyles(pathToStylesDir, targetPathToStyles);
  } else {
    console.warn(
      'buildProject: param "pathToStylesDir" is empty: styles not included',
    );
  }

  if (pathToAssetsDir) {
    const targetPathToAssets = path.join(targetDir, 'assets');
    await deepCopy(pathToAssetsDir, targetPathToAssets);
  } else {
    console.warn(
      'buildProject: param "pathToAssetsDir" is empty: assets not included',
    );
  }
}

const targetDir = path.join(__dirname, 'project-dist');

buildProject(
  {
    pathToStylesDir: path.join(__dirname, 'styles'),
    pathToAssetsDir: path.join(__dirname, 'assets'),
    pathToComponentsDir: path.join(__dirname, 'components'),
    pathToTempleteFile: path.join(__dirname, 'template.html'),
  },
  targetDir,
);
