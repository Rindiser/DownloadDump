const fetch = require('node-fetch');
const fs = require('fs')
// const fileListNhm = require('./../../test/src/utils/fileListNhm')
// const fileListTmu = require('./../../test/src/utils/fileListTmu')
// const fileListUm = require('./../../test/src/utils/fileListUm')
// const fileListNbh = require('./../../test/src/utils/fileListNbh')
const fileListNhm = require('./../../portal/src/utils/fileListNhm')
const fileListTmu = require('./../../portal/src/utils/fileListTmu')
const fileListUm = require('./../../portal/src/utils/fileListUm')
const fileListNbh = require('./../../portal/src/utils/fileListNbh')

// const loanPath = "./../../test/src/data/nhm"
const loanPath = "./../../portal/src/data/nhm"
const AbortController = require('abort-controller')
const util = require('util')
const AdmZip = require('adm-zip');
const chalk = require('chalk');
const streamPipeline = util.promisify(require('stream').pipeline)
const mkdirp = require('mkdirp');
const { resolve } = require('path');

const controller = new AbortController();

// tror ikke vi trenger denne, hopperover dette steget. eller -er det for datene inne i nettportal?
// nei, for dataene går ikke rett dit...
// making sure that renamed folder exist, if not create it
const makeFolders = ()=> {
    // ta denne fra fileList (?)
    const museum = ['nhm','tmu','um', 'nbh']
    for (let index = 0; index < museum.length; index++) {
        made = mkdirp.sync('./../../portal/src/data/' + museum[index])
        // made = mkdirp.sync('./../../test/src/data/' + museum[index])
    }
}
  
const fsRenameFiles = (oldName,newName) => {
    fs.rename(oldName, newName, (err) => {
        if (err){
            console.log(chalk.red('Rename error: ' + err));
        } 
        // else {
        //     console.log(chalk.green('Rename complete!'));
        // }
    })
}

// rename files to include collection-name in file-name
// in: object from filelist
function makeFileNames (zipFile, museum) {
    museum = museum + "/"
    const oldPath = "./../../musitDumps/"
    // const newPath = `./../../test/src/data/`
    const newPath = `./../../portal/src/data/`
    if (zipFile.occurrenceFileSuffix.includes('occurrence')) {
        //  const newPath = "./src/data/renamed/" 
        // const newPath = `./../../NHM-portaler/src/data/` 
        let oldName = oldPath + zipFile.zipFileName + '/' + zipFile.zipFileName +".txt"
        let newName = newPath + museum + zipFile.name + "_occurrence.txt"
        fsRenameFiles(oldName,newName)
    
        let mediaOldName = ""
        let mediaNewName = ""
    
        if (zipFile.source === "musit") {   
            mediaOldName = oldPath + zipFile.zipFileName + '/' + zipFile.zipFileName + zipFile.mediaFile + ".txt"
            mediaNewName = newPath + museum + zipFile.name + "_media.txt"
            fsRenameFiles(mediaOldName,mediaNewName)
        }
    } 
    // else if (zipFile.occurrenceFileSuffix.includes('stitch')) {
    //     const newPath = `./../musitDumps/${zipFile.zipFileName}/` 
    //     let oldName = oldPath + zipFile.zipFileName + ".txt"
    //     let newName = newPath + zipFile.zipFileName + ".txt"
    //     fsRenameFiles(oldName,newName)
    // }
}
  

// Hovedfunksjon
// download the musitfiles and unzip
async function download (fileList, callback) {
    const museum = fileList[0].filMetadata.museum
    console.log(museum)
    for (i = 1, len = fileList.length; i < len; i++) {
        if (fileList[i].source == "musit") {
            // let fileName = './src/data/' + fileList[i].name + "_" + museum + '.zip'
            // let fileName = './data/' + fileList[i].zipFileName +  '.zip'
            let fileName = './../../musitDumps/' + fileList[i].zipFileName +  '.zip'
            const response = await fetch(fileList[i].url, { signal: controller.signal })
            .then(response =>  streamPipeline(response.body, fs.createWriteStream(fileName)))
            .catch(err => console.log(chalk.red(err)))
            // reading archives
            try {
                const zip = new AdmZip(fileName);
                // extracts everything, overwrite = true
                zip.extractAllTo('./../../musitDumps/' + fileList[i].zipFileName, true)
                makeFileNames (fileList[i], museum)
            } catch (error) {
                console.log(chalk.red(error));
            }
        } else if (fileList[i].source == "loans") {
            console.log('loans')
            const response = await fetch(fileList[i].url, { signal: controller.signal })
            .then(response =>  streamPipeline(response.body, fs.createWriteStream('./../../musitDumps/NHM_loans.zip')))
            .catch(err => console.log(chalk.red(err)))
        } 
        try {
            const zip = new AdmZip('./../../musitDumps/NHM_loans.zip');
            // extracts everything, overwrite = true
            zip.extractAllTo(loanPath, true)
            
        } catch (error) {
            console.log(chalk.red(error));
        }
    } 
}
   
// Hovedfunksjon II
// download the coremafiles and unzip
async function downloadCorema (fileList, callback) {
    //let fileName = './../../../coremaDumper/NHMO-DAR/NHMO-DAR.zip'
    //const zip = new AdmZip(fileName);
    // extracts everything, overwrite = true
    //zip.extractAllTo('./../../coremaDumper_forPortal/NHMO-DAR/', true)

    for (i = 1, len = fileList.length; i < len; i++) {
        if (fileList[i].source == "corema") {
            let fileName = './../../../coremaDumper/' + fileList[i].akronym + '/' + fileList[i].akronym + '.zip'
            // extract all files from zip-file in coremaDump-folder to local coremaDump-folder for portal
            console.log(fileName)
            try {
                const zip = new AdmZip(fileName);
                // extracts everything, overwrite = true
                zip.extractAllTo('./../../coremaDumper_forPortal/' + fileList[i].akronym, true)
                
            } catch (error) {
                console.log(chalk.red(error));
            }
        }
    } 
}


async function getFilesAllMuseum() {
    try {
        makeFolders()
        await download(fileListUm)
        await download(fileListTmu)
        await download(fileListNbh)
        await download(fileListNhm)
        await downloadCorema(fileListNhm)
        // resolve('success')
        // this is now in downloadAndProcessDumps.js:
        // process.exit() // hvis alle filer er downloaded og unzipped så slå av programmet
        
    } catch (error) {
        console.log(error);   
    }
}
  
getFilesAllMuseum()

module.exports = { 
    getFilesAllMuseum
}