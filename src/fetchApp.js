//https://www.npmjs.com/package/node-fetch

const fetch = require('node-fetch');
const fs = require('fs')
const fileListNhm = require('./utils/fileList')
const fileListTmu = require('./utils/fileListTmu')
const fileListUm = require('./utils/fileListUm')
const AbortController = require('abort-controller')
const util = require('util')
const AdmZip = require('adm-zip');
const chalk = require('chalk');
const streamPipeline = util.promisify(require('stream').pipeline)
const mkdirp = require('mkdirp')


// console.log(chalk.red(fileList.length));
console.log('Starting download....');
// makingsure that renamed folder exist, if not create it
const makeFolders = ()=> {
  const museum = ['nhm','tmu','um']
  let made = mkdirp.sync('./src/data//renamed')
  for (let index = 0; index < museum.length; index++) {
    made = mkdirp.sync('./src/data//renamed/' + museum[index])
    console.log(chalk.green(`made directories, starting with ${made}`))
  }
}




const controller = new AbortController();
const timeout = setTimeout(
  () => { controller.abort(); },
  180000, // timeout etter 3 minutt
);

const fsRenameFiles = (oldName,newName) => {
  console.log(oldName);
  console.log(newName);
  fs.rename(oldName, newName, (err) => {
    if (err){
      console.log(chalk.red('Rename error: ' + err));
    } else {
    console.log(chalk.green('Rename complete!'));
    } })
  
}

// move and rename the files
function makeFileNames (zipFile, museum) {
  console.log(zipFile);
  museum = museum + "/"
  const oldPath = "./src/data/unzip/"
  const newPath = "./src/data/renamed/" 

  let oldName = oldPath + zipFile.zipFileName + ".txt"
  let newName = newPath + museum + zipFile.name + "_occurrence.txt"
  fsRenameFiles(oldName,newName)

  let mediaOldName = ""
  let mediaNewName = ""

  if (zipFile.source === "musit") {   
    mediaOldName = oldPath + zipFile.zipFileName + zipFile.mediaFile + ".txt"
    mediaNewName = newPath + museum + zipFile.name + "_media.txt"
    fsRenameFiles(mediaOldName,mediaNewName)
  } else if (zipFile.source === "corema") {
    for (ii = 1, lens = fileListNhm[0].coremaFiles.length; ii < lens; ii++) {
      miscOldName = oldPath + fileListNhm[0].coremaFiles[ii] + ".txt"
      miscNewName = newPath + museum + zipFile.name + "_" + fileListNhm[0].coremaFiles[ii] + ".txt"
      fsRenameFiles(miscOldName,miscNewName)      
    }
  } 
 
}

// Hovedfunksjon
// download the files and unzip
async function download (samlinger, callback) {
 const fileList = samlinger
 const museum = fileList[0].filMetadata.museum
 for (i = 1, len = fileList.length; i < len; i++) {
//  for (i = 1, len = fileList.length; i < 4; i++) {
    let fileName = './src/data/' + fileList[i].name + "_" + museum + '.zip'

    const response = await fetch(fileList[i].url, { signal: controller.signal })
    .then(response =>  streamPipeline(response.body, fs.createWriteStream(fileName)))
    .catch(err => console.log(chalk.red(err)))
    
    // reading archives
    try {
      const zip = new AdmZip(fileName);
      // extracts everything, overwrite = true
     zip.extractAllTo("./src/data/unzip/", true)
     makeFileNames (fileList[i], museum)
    } catch (error) {
      console.log(chalk.red(error));
    }
  } 
  if (i = fileList.length) {
    console.log(chalk.green('done!'))
    // process.exit() // hvis alle filer er downloaded og unzipped så slå av programmet
  } 
}


async function getFilesAllMuseum() {
  makeFolders()
  await download(fileListUm)
  await download(fileListTmu)
  await download(fileListNhm)
  process.exit() // hvis alle filer er downloaded og unzipped så slå av programmet
}

getFilesAllMuseum()

