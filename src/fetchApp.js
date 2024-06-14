const fetch = require('node-fetch');
const fs = require('fs')
const path = require('path');


const AbortController = require('abort-controller')
const controller = new AbortController();
const util = require('util')
const AdmZip = require('adm-zip');
const chalk = require('chalk');
const streamPipeline = util.promisify(require('stream').pipeline)
const { resolve } = require('path');

// making the path dynamic so that we easyly can swap between prod and test
const prodOrTest = require('./prodOrTest')
const basePath = prodOrTest()

function combinePath(basePath, filePath) {
    const fullPath = path.join(basePath, filePath);
    const module = require(fullPath);
    return module;
  }
const fileListNhm = combinePath(basePath, '/utils/fileListNhm');
const fileListTmu = combinePath(basePath, '/utils/fileListTmu');
const fileListUm = combinePath(basePath, '/utils/fileListUm');
const fileListNbh = combinePath(basePath, '/utils/fileListNbh');



const grandParentDirectory = path.join(__dirname, '../../');
const pathToCoremaDumps = path.join(__dirname, '../../../', 'coremaDumper/')
const pathToCoremaDumpsForPortal = path.join(grandParentDirectory, 'coremaDumper_forPortal/')
const pathToMusitDumps = path.join(grandParentDirectory, 'musitDumps/')
const pathToDatabases = path.join(grandParentDirectory, 'sqliteDatabases/')
const loanPath = path.join(basePath, '/data/nhm/');

  console.log('*********************************************************************');
  console.log('*********************************************************************');
  console.log('*********************************************************************');

// Function to create directories based on the museum array
function makeFolders(basePath) {
    const museum = ['nhm', 'tmu', 'um', 'nbh'];
    const subFolder = 'data'
    museum.forEach(museumName => {
        const dirPath = path.join(basePath, subFolder, museumName);
        try {
            fs.mkdirSync(dirPath, { recursive: true });
            // console.log(`Directory created at: ${dirPath}`);
        } catch (error) {
            console.error(`Error creating directory for ${museumName}: ${error}`);
        }
    });
}
  
const fsRenameFiles = (oldName,newName) => {
    // console.log(' vi kjører fsRenameFiles ');
    fs.rename(oldName, newName, (err) => {
        if (err){
            console.log(chalk.red('Rename error: ' + err));
        } 
        else {
            // console.log(chalk.green('Rename complete!'));
        }
    })
}

// rename files to include collection-name in file-name
// in: object from filelist
function makeFileNames (zipFile, museum) {
    museum = museum + "/"
    const oldPath = pathToMusitDumps
    const newPath = basePath + '/data/'
    if (zipFile.occurrenceFileSuffix.includes('occurrence')) {

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
}
  

// Hovedfunksjon
// download the musitfiles and unzip
async function download (fileList) {
    if (!fileList || fileList.length === 0) {
        throw new Error("File list is empty or not provided.");
    }
    const pathToLoanDump = path.join(pathToMusitDumps, 'NHM_loans.zip')
    const museum = fileList[0].filMetadata.museum
    console.log('vi laster ned data for: ' + museum)
    try {
        
        for (i = 1, len = fileList.length; i < len; i++) {
            const file = fileList[i];
            // console.log('her kommer source: ' + file.source);
            if (file.source === "musit") { 
                
                let fileName = path.join(pathToMusitDumps,`${file.zipFileName}.zip`)
                // Attempt to download the file
                const response = await fetch(file.url, { signal: controller.signal });
                if (!response.ok) {
                    // throw new Error(`Unexpected response ${response.statusText}`);
                    console.log(`Unexpected response ${response.statusText}`);
                }
                await streamPipeline(response.body, fs.createWriteStream(fileName));

                // // Extract the downloaded zip file
                const zip = new AdmZip(fileName);
                zip.extractAllTo(path.join(pathToMusitDumps,file.zipFileName), true)
                makeFileNames(file, museum);

            }  else if (file.source === "loans") {
            
                const response = await fetch(file.url, { signal: controller.signal });
                if (!response.ok) {
                    // throw new Error(`Unexpected response in Loans ${response.statusText}`);
                    console.log(`Unexpected response in Loans ${response.statusText}`);
                }
                await streamPipeline(response.body, fs.createWriteStream(pathToLoanDump));

                // Extract the downloaded zip file
                const zip = new AdmZip(pathToLoanDump);
                zip.extractAllTo(path.join(pathToMusitDumps, 'NHM_loans'), true)
                // makeFileNames(file, museum);
            }
            
        } 
    } catch (error) {
        console.log(chalk.red('her kommer feil i Download funsjonen: ' + error));   
    }
}
   

// Hovedfunksjon II
// download the coremafiles and unzip
async function downloadCorema (fileList) {
    for (i = 1, len = fileList.length; i < len; i++) {
        if (fileList[i].source == "corema") {
            pathToCoremaDumps
            let fileName = path.join( pathToCoremaDumps, fileList[i].akronym, fileList[i].akronym + '.zip')
            // extract all files from zip-file in coremaDump-folder to local coremaDump-folder for portal
            console.log(fileName)
            try {
                const zip = new AdmZip(fileName);
                // extracts everything, overwrite = true
                zip.extractAllTo(path.join(pathToCoremaDumpsForPortal + fileList[i].akronym), true)
                
            } catch (error) {
                console.log('feil med unzip' + chalk.red(error));
            }
        }
    } 
}


async function getFilesAllMuseum() {
    try {
        makeFolders(basePath)
        await download(fileListUm)
        await download(fileListTmu)
        await download(fileListNbh)
        await download(fileListNhm)
        await downloadCorema(fileListNhm)
        
    } catch (error) {
        console.log(error);   
    }
}

getFilesAllMuseum()

module.exports = { 
    getFilesAllMuseum
}