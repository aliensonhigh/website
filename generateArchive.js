const fs = require("fs");
const path = require("path");

const archiveRoot = path.join(__dirname, "archive");
const outputFile = path.join(__dirname, "data", "archive.json");

function readMeta(folder){

  const metaFile = path.join(folder, "meta.json");

  if(!fs.existsSync(metaFile)){
    return {
      title: path.basename(folder),
      year: "",
      medium: "",
      description: ""
    };
  }

  return JSON.parse(fs.readFileSync(metaFile, "utf8"));
}

function scanFolder(dir, relativePath){

  const items = fs.readdirSync(dir, { withFileTypes:true });

  const folders = [];
  const works = [];

  items.forEach(item => {

    if(!item.isDirectory()) return;

    const fullPath = path.join(dir, item.name);
    const relPath = `${relativePath}/${item.name}`;

    const metaFile = path.join(fullPath, "meta.json");

    if(fs.existsSync(metaFile)){

      const meta = readMeta(fullPath);

      const imageDir = path.join(fullPath, "images");

let images = [];

if(fs.existsSync(imageDir)){

  images = fs.readdirSync(imageDir)
    .filter(file => /\.(jpg|jpeg|png|gif|webp|mp4)$/i.test(file))
    .sort();

}

works.push({
  title: meta.title,
  year: meta.year,
  medium: meta.medium,
  short: meta.short,
  slug: item.name,
  video: meta.video || null,
  images: images
});

    } else {

      folders.push(
        scanFolder(fullPath, relPath)
      );

    }

  });

  return {
    name: path.basename(dir),
    path: relativePath,
    folders: folders.length ? folders : undefined,
    works: works.length ? works : undefined
  };
}

const rootItems = fs.readdirSync(archiveRoot, { withFileTypes:true });

const result = { folders: [] };

rootItems.forEach(item => {

  if(!item.isDirectory()) return;

  const folderPath = path.join(archiveRoot, item.name);

  result.folders.push(
    scanFolder(folderPath, `archive/${item.name}`)
  );

});

fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));

console.log("archive.json generated.");