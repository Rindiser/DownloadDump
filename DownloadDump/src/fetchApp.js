//https://www.npmjs.com/package/node-fetch

const fetch = require('node-fetch');
const fs = require('fs')
const fileList = require('./utils/fileList')
const AbortController = require('abort-controller')
const util = require('util')
const AdmZip = require('adm-zip');
const chalk = require('chalk');
const streamPipeline = util.promisify(require('stream').pipeline)
const mkdirp = require('mkdirp')

console.log('Starting download....');
// makingsure that renamed folder exist, if not create it
const made = mkdirp.sync('./src/data//renamed')
console.log(chalk.green(`made directories, starting with ${made}`))

const controller = new AbortController();
const timeout = setTimeout(
  () => { controller.abort(); },
  180000, // timeout etter 3 minutt
);

const fsRename = (oldName,newName) => {
  console.log(oldName);
  console.log(newName);
  fs.rename(oldName, newName, (err) => {
    if (err){
      console.log(chalk.red('Rename error' + err));
    } else {
    console.log(chalk.green('Rename complete!'));
    } })
  
}

// move and rename the files
function rename (zipFile) {
console.log(zipFile);

let oldName = "./src/data/unzip/" + zipFile.zipFileName + ".txt"
let newName = "./src/data/renamed/" + zipFile.name + "_occurences.txt"
fsRename(oldName,newName)

let mediaOldName = ""
let mediaNewName = ""

if (zipFile.source === "musit") {   
  mediaOldName = "./src/data/unzip/" + zipFile.zipFileName + zipFile.mediaFile + ".txt"
  mediaNewName = "./src/data/renamed/" + zipFile.name + "_media.txt"
} else if (zipFile.source === "corema") {
    mediaOldName = "./src/data/unzip/"  + zipFile.mediaFile + ".txt"
    mediaNewName = "./src/data/renamed/" + zipFile.name + "_media.txt"
} 
fsRename(mediaOldName,mediaNewName)
}

// Hovedfunksjon
// download the files and unzip
async function download (someThing, callback) {
 for (i = 0, len = fileList.length; i < len; i++) {
    let fileName = './src/data/' + fileList[i].name + '.zip'

    const response = await fetch(fileList[i].url, { signal: controller.signal })
    .then(response =>  streamPipeline(response.body, fs.createWriteStream(fileName)))
    .catch(err => console.log(chalk.red(err)))
    
    // reading archives
    try {
      const zip = new AdmZip(fileName);
      // extracts everything, overwrite = true
     zip.extractAllTo("./src/data/unzip/", true)
     rename(fileList[i] )
    } catch (error) {
      console.log(chalk.red(error));
    }

} 
if (i = fileList.length) {
  
  console.log(chalk.green('done!'))
  process.exit() // hvis alle filer er downloaded og unzipped så slå av programmet
} 
}

download ()

