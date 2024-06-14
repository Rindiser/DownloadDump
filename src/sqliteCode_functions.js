const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const { TextEncoder } = require('util');
const { pipeline } = require('stream');
const { Transform } = require('stream');
const papa = require('papaparse')
const csvParser = require('csv-parser')
const { resolve } = require('path')
const chalk = require('chalk');

const path = require('path');

// making the path dynamic so that we easyly can swap between prod and test
const prodOrTest = require('./prodOrTest');
const { log } = require('console');
const basePath = prodOrTest()
function combinePath(basePath, filePath) {
    const fullPath = basePath + filePath;
    const module = require(fullPath);
    return module;
  }
const fileList = combinePath(basePath, '/utils/fileListNhm');


const grandParentDirectory = path.join(__dirname, '../../');
const pathToCoremaDumps = path.join(grandParentDirectory, 'coremaDumper/')
const pathToCoremaDumpsForPortal = path.join(grandParentDirectory, 'coremaDumper_forPortal/')
const pathToMusitDumps = path.join(grandParentDirectory, 'musitDumps/')
const pathToDatabases = path.join(grandParentDirectory, 'sqliteDatabases/')

const outfilePath = path.join(basePath, 'data/nhm/')


const  array_to_file = (outfile,subArray) => {

    let logger = fs.createWriteStream(outfile, {
        flags: 'a' // means append
    })
    
    // console.log("array_to_file starts")
    for (let i = 0; i<subArray.length; i++) {
        logger.write(subArray[i].replace(/"/g,""))
        logger.write("\n")
    }
}

function writePartToFile(part,lap,processedRows,fieldNames,outfile) {
    let logger = fs.createWriteStream(outfile, {
        flags: 'a' // means append
    })
    let partOfProcessedRows = processedRows.slice(part*(lap-1), part * lap)
    let partCsvtxt = partOfProcessedRows.map(mapElementToColumns(fieldNames))
    partOfProcessedRows.length = 0
    for (let i = 0; i < partCsvtxt.length; i++) {
        // writes to outfile:
        logger.write(partCsvtxt[i].replace(/"/g, ""))
        logger.write("\n")
    }
    return partCsvtxt
}
// opens database. Create new one if it doesn't exist
// in: file (string, name of file)
//     source (string, "corema" or "musit", indicates which database the data comes from)
//     mainTable (string, name of table with musitdata)
//     collection (string, name of collection)
// out: a sqlite database-object
async function createDatabase(file, source, mainTable, collection) {
    // console.log('file line 66: ' + file);
    // if database does not exist. This is not tested for a while, and not on server      
    if (!fs.existsSync(file)) {
        db = new sqlite3.Database(file)
        fs.openSync(file, "w");
        if (source === "musit") {
            db.serialize(function () {
                db.run("CREATE TABLE amplification ( coreid TEXT, geneticAccessionURI TEXT, geneticAccessionNumber TEXT, BOLDProcessID TEXT)")
                    .run("CREATE TABLE materialsample ( coreid TEXT, materialSampleType TEXT, concentration TEXT, concentrationUnit TEXT )")
                    .run("CREATE TABLE multimedia ( coreid TEXT, type TEXT, format TEXT, identifier TEXT, title TEXT, created TEXT, creator TEXT, source TEXT, license TEXT )")
                    .run("CREATE TABLE permit ( coreid TEXT, permitType TEXT, permitStatus TEXT, permitStatusQualifier TEXT, permitText TEXT )")
                    .run("CREATE TABLE preparation ( coreid TEXT, preparationType TEXT, preparationMaterials TEXT, preparedBy TEXT, preparationDate TEXT )")
                    .run("CREATE TABLE preservation ( coreid TEXT, preservationType TEXT )")
                    .run("CREATE TABLE resourcerelationship ( coreid TEXT, relatedResourceID TEXT, relationshipOfResource TEXT, relationshipAccordingTo TEXT, relationshipEstablishedDate TEXT, relationshipRemarks TEXT , cleanCatalogNumberRecRel INTEGER, relCollectionCode TEXT)")
                    .run("CREATE TABLE simpledwc ( id TEXT, type TEXT, modified TEXT, rightsHolder TEXT, accessRights TEXT, collectionID TEXT, datasetID TEXT, institutionCode TEXT, collectionCode TEXT, ownerInstitutionCode TEXT, basisOfRecord TEXT, informationWithheld TEXT, occurrenceID TEXT, catalogNumber TEXT, recordNumber TEXT, recordedBy TEXT, sex TEXT, lifeStage TEXT, preparations TEXT, disposition TEXT, associatedMedia TEXT, organismID TEXT, materialSampleID TEXT, eventDate TEXT, country TEXT, stateProvince TEXT, county TEXT, locality TEXT, minimumElevationInMeters TEXT, decimalLatitude TEXT, decimalLongitude TEXT, identificationQualifier TEXT, identifiedBy TEXT, dateIdentified TEXT, scientificName TEXT, 'order' TEXT, family TEXT, genus TEXT, specificEpithet TEXT, infraspecificEpithet TEXT, taxonRank TEXT, scientificNameAuthorship TEXT, typeStatus TEXT , cleanCatalogNumber INTEGER)")
                    .run(`CREATE TABLE ${mainTable} ( modified TEXT, institutionCode TEXT, collectionCode TEXT, basisOfRecord TEXT, catalogNumber TEXT, scientificName TEXT, scientificNameAuthorship TEXT, kingdom TEXT, phylum TEXT, class TEXT, 'order' TEXT, family TEXT, genus TEXT, specificEpithet TEXT, infraspecificEpithet TEXT, identifiedBy TEXT, dateIdentified TEXT, typeStatus TEXT, recordNumber TEXT, fieldNumber TEXT, recordedBy TEXT, eventDate TEXT, continent TEXT, country TEXT, stateProvince TEXT, county TEXT, locality TEXT, decimalLongitude TEXT, decimalLatitude TEXT, coordinateUncertaintyInMeters TEXT, verbatimElevation TEXT, verbatimDepth TEXT, sex TEXT, lifeStage TEXT, preparations TEXT, individualCount TEXT, otherCatalogNumbers TEXT, occurrenceRemarks TEXT, samplingProtocol TEXT, identificationQualifier TEXT, habitat TEXT, associatedTaxa TEXT, georeferenceRemarks TEXT, verbatimCoordinates TEXT, verbatimSRS TEXT, associatedMedia TEXT, CreativeCommonsLicense TEXT, ArtObsID TEXT, occurrenceID TEXT, UTMsone TEXT, UTMX TEXT, UTMY TEXT, datasetName TEXT, createdDate TEXT, bioGeoRegion TEXT, recordedById TEXT, identifiedById TEXT , cleanCatalogNumber INTEGER)`)
            })
        } else if (source === "corema") {
            db.serialize(function () {
                db.run("CREATE TABLE amplification ( coreid TEXT, geneticAccessionURI TEXT, geneticAccessionNumber TEXT, BOLDProcessID TEXT)")
                    .run("CREATE TABLE materialsample ( coreid TEXT, materialSampleType TEXT, concentration TEXT, concentrationUnit TEXT )")
                    .run("CREATE TABLE multimedia ( coreid TEXT, type TEXT, format TEXT, identifier TEXT, title TEXT, created TEXT, creator TEXT, source TEXT, license TEXT )")
                    .run("CREATE TABLE permit ( coreid TEXT, permitType TEXT, permitStatus TEXT, permitStatusQualifier TEXT, permitText TEXT )")
                    .run("CREATE TABLE preparation ( coreid TEXT, preparationType TEXT, preparationMaterials TEXT, preparedBy TEXT, preparationDate TEXT )")
                    .run("CREATE TABLE preservation ( coreid TEXT, preservationType TEXT )")
                    .run("CREATE TABLE resourcerelationship ( coreid TEXT, relatedResourceID TEXT, relationshipOfResource TEXT, relationshipAccordingTo TEXT, relationshipEstablishedDate TEXT, relationshipRemarks TEXT , cleanCatalogNumberRecRel INTEGER, relCollectionCode TEXT)")
                    .run("CREATE TABLE simpledwc ( id TEXT, type TEXT, modified TEXT, rightsHolder TEXT, accessRights TEXT, collectionID TEXT, datasetID TEXT, institutionCode TEXT, collectionCode TEXT, ownerInstitutionCode TEXT, basisOfRecord TEXT, informationWithheld TEXT, occurrenceID TEXT, catalogNumber TEXT, recordNumber TEXT, recordedBy TEXT, sex TEXT, lifeStage TEXT, preparations TEXT, disposition TEXT, associatedMedia TEXT, organismID TEXT, materialSampleID TEXT, eventDate TEXT, country TEXT, stateProvince TEXT, county TEXT, locality TEXT, minimumElevationInMeters TEXT, decimalLatitude TEXT, decimalLongitude TEXT, identificationQualifier TEXT, identifiedBy TEXT, dateIdentified TEXT, scientificName TEXT, 'order' TEXT, family TEXT, genus TEXT, specificEpithet TEXT, infraspecificEpithet TEXT, taxonRank TEXT, scientificNameAuthorship TEXT, typeStatus TEXT , cleanCatalogNumber INTEGER)")
            })
        }
        return db
    // if database exist, but we are working with fungi og lichens: create new main-table. I am not sure of status for this July 2022
    } else if (mainTable === "fungus_o" || mainTable === "fungus_lichens_o" || mainTable === "lichens_o") {
        db = new sqlite3.Database(file)
        db.run(`CREATE TABLE IF NOT EXISTS ${mainTable} ( modified TEXT, institutionCode TEXT, collectionCode TEXT, basisOfRecord TEXT, catalogNumber TEXT, scientificName TEXT, scientificNameAuthorship TEXT, kingdom TEXT, phylum TEXT, class TEXT, 'order' TEXT, family TEXT, genus TEXT, specificEpithet TEXT, infraspecificEpithet TEXT, identifiedBy TEXT, dateIdentified TEXT, typeStatus TEXT, recordNumber TEXT, fieldNumber TEXT, recordedBy TEXT, eventDate TEXT, continent TEXT, country TEXT, stateProvince TEXT, county TEXT, locality TEXT, decimalLongitude TEXT, decimalLatitude TEXT, coordinateUncertaintyInMeters TEXT, verbatimElevation TEXT, verbatimDepth TEXT, sex TEXT, lifeStage TEXT, preparations TEXT, individualCount TEXT, otherCatalogNumbers TEXT, occurrenceRemarks TEXT, samplingProtocol TEXT, identificationQualifier TEXT, habitat TEXT, associatedTaxa TEXT, georeferenceRemarks TEXT, verbatimCoordinates TEXT, verbatimSRS TEXT, associatedMedia TEXT, CreativeCommonsLicense TEXT, ArtObsID TEXT, occurrenceID TEXT, UTMsone TEXT, UTMX TEXT, UTMY TEXT, datasetName TEXT, createdDate TEXT, bioGeoRegion TEXT, recordedById TEXT, identifiedById TEXT , cleanCatalogNumber INTEGER)`)
         
        return db
    // database exist, we just open it
    } else {
        console.log('db exist already')
        db = new sqlite3.Database(file)
        console.log(`Connected to the ${collection} database`)
        return db
    }
}

// not used in update-version
// deletes data from tables in database
// in: db (sqlite-database containing one organismgroup)
//      tableName (string, name of table to be deleted in database)
async function deleteFromTable (db, tableName) {
    return new Promise (function(resolve, reject) {
        try {
                    // await db_delete(db,tableName)
                db.run(`DELETE FROM ${tableName} ;`, function(err) {
                    if (err) {
                        if(err.message.includes('no such table:')) {
                            resolve('success')
                        } else {
                            return console.error(chalk.red(err.message))
                        }
                    } else {
                        // console.log(`Row(s) deleted ${this.changes} in ${tableName}`)
                        resolve('success')
                    }
                })
        } catch (error) {
            console.log(chalk.red('error in DeleteFromTable: ') + error)
            reject(new Error(error))
            
        }
    })
}

// concatenate fungus- and lichen-musit-dumpfiles to stitch musit data to fungi-lichen-corema-data
// out: a txt-file with data from both fungus-musit-dump and lichen-musit-dump
async function makeNewMycFile(fungus2,lichen2) {
    console.log(chalk.yellow('makeNewMycFile'));
    console.log('fungus2: ' + fungus2);
    console.log('lichen2: ' + lichen2);
    const combinedFilePath = path.join(pathToMusitDumps, 'fungus_lichens_o', 'fungus_lichens_o.txt');
    if (fs.existsSync(combinedFilePath)) {
        fs.unlinkSync(combinedFilePath);
    }
    let fungusFile = fs.readFileSync(fungus2)
    // let fungusFileArray = fungusFile.toString().split('\n')
    // fungusFileArray.shift()
   
    fs.writeFileSync(path.join(pathToMusitDumps,'fungus_lichens_o','fungus_lichens_o2.txt'), fungusFile, function (err) {
        if (err){
            console.log('error in makeNewMycFile: ' + err);
            return console.log(err)
        }
    })
    let lichensFile = fs.readFileSync(lichen2)
    let fileAsArray = lichensFile.toString().split('\n')
    fileAsArray.shift()
    lichensFile = fileAsArray.join('\n')
    fs.appendFileSync(path.join(pathToMusitDumps, 'fungus_lichens_o', 'fungus_lichens_o2.txt'), lichensFile, function (err) {
        if (err){
            console.log('error in makeNewMycFile: ' + err);
            return console.log(err)
        }
        console.log(chalk.green('done combining myc and lichens'));
        resolve('success')
    })
}


// finds latest time of change in record in table and latest time of approved-date
// reads dumpfile, singels out records with newer modified-times or approved-dates and puts them into new file
// in: db (string, name of sqlite-database)
//     tableName (string, name of table in sqlite-database)
//     dumpFolder (string, name of folder with musit-dump-files)
//     source (string, "musit" or "corema")
// out: txt-file with only records that where modified since last time
// is called in runMusitCoremaStitch() and runCoremaStitch()
async function makeFileOnlyNew(db, tableName, dumpFolder, source) {
    console.log(chalk.yellow('makeFileOnlyNew'));
    return new Promise(function (resolve, reject) {
        let pathToFolder = ''
        if (source === "corema") { pathToFolder = pathToCoremaDumpsForPortal }
        else if (source === "musit") { pathToFolder = pathToMusitDumps }
        db.all(`SELECT MAX(modified) AS modifiedDate, MAX(approvedDate) AS approvedDate FROM ${tableName}`, (err, latestModified) => {
            if (err) { console.log(chalk.red('makeFileOnlyNew har følgende feil line 183: ') + err.message);}
            // console.log('latestModified line 185: ')
            // console.log(latestModified)
            let newFileRows = []
            const date = new Date()
            let file = ''
            if (tableName === 'simpledwc') { 
                file = path.join(pathToFolder, dumpFolder, tableName + '.txt')
            } else {
                file = path.join(pathToFolder, dumpFolder, tableName + '2.txt')
            }
            // console.log('file hva er du?: ' + file);
            fs.createReadStream(file)
                .pipe(csvParser({ "separator": "\t" }))
                .on('data', (row) => {
                    // if(row.catalogNumber == '78787') {console.log('her kommer row line 191: '); console.log(row);} // hva er dette??
                    if(latestModified) {
                        if (latestModified[0].modifiedDate < row.modified) {
                            newFileRows.push(row)
                        } else if(source=="musit" && latestModified[0].modifiedDate < row.approvedDate) {
                            newFileRows.push(row)
                        }
                    }
                    
                }).on('end', () => {
                    let newFileResult = papa.unparse(newFileRows, {
                        delimiter: "\t",
                    })
                    let outfilePathLocal = ''
                    if (source === 'corema') { outfilePathLocal = path.join(pathToCoremaDumpsForPortal, dumpFolder)}
                    else { outfilePathLocal = path.join( pathToMusitDumps, dumpFolder)}
                    const outfile = path.join(outfilePathLocal, `${tableName}_new.txt`)
                    fs.writeFileSync(outfile, newFileResult)
                    
                    resolve('success')
                })
        })

    })
}


// makes file for corema-archive-dump-files containing only records for which the corresponding record
// in the corresponding simpledwc-file (main file for corema-dumps) are modified since last time
async function makeOtherFileOnlyNew(tableName, coremaFolder) {
    return new Promise(function (resolve, reject) {
        let newOccIDs = []
        let newOtherFileRows = []
        try {
            

        fs.createReadStream(path.join(pathToCoremaDumpsForPortal, coremaFolder, 'simpledwc_new.txt'))
            .pipe(csvParser({ "separator": "\t" }))
            .on('data', (row) => {
                newOccIDs.push(row.occurrenceID)
            })
            .on('end', () => {
                if (!fs.existsSync(path.join(pathToCoremaDumpsForPortal, coremaFolder, tableName + '.txt'))) {
                    // !fs.existsSync(`${pathToCoremaDumpsForPortal}${coremaFolder}/${tableName}.txt`)
                    resolve('success')
                } else {
                    fs.createReadStream(path.join(pathToCoremaDumpsForPortal, coremaFolder, `${tableName}.txt`))
                        .pipe(csvParser({ "separator": "\t" }))
                        .on('data', (row2) => {
                            if (newOccIDs.includes(row2.coreid)) {
                                newOtherFileRows.push(row2)
                            }
                        }).on('end', () => {
                            let newOtherFileResult = papa.unparse(newOtherFileRows, { delimiter: "\t" })
                            const outfilePathLocal = path.join(pathToCoremaDumpsForPortal, coremaFolder);
                            const outfile = path.join(outfilePathLocal, `${tableName}_new.txt`);
                            fs.writeFileSync(outfile, newOtherFileResult)
                            resolve('success')
                        })
                }
            })
        } catch (error) {
            console.log(chalk.red('Her kommer feil i makeOtherFileOnlyNew(): ') + error)
        }
    })

}

// removes double quotes and part of header containing ":" in musit-dumpfile, changes encoding to utf8 (from possibly utf-8-bom)
// in: infile (string, name of musit-dumpfile)
async function changeEncoding(infile) {
    return new Promise(function (resolve, reject) {
        if (!fs.existsSync(infile)) { 
            resolve('no file') 
        } else {
            try {
                const outfile = infile.replace('.txt','2.txt')
                // Create a readable stream to read the input file
                const readableStream = fs.createReadStream(infile, {
                  encoding: 'utf8',
                  highWaterMark: 64 * 1024 // Adjust the chunk size as per your requirement
                })
                // Create a writable stream to write the output file
                const writableStream = fs.createWriteStream(outfile, {
                  encoding: 'utf8'
                });
                // Create a transform stream to encode the content to UTF-8
                const textEncoder = new TextEncoder();
                // Handle the data event of the readable stream
                readableStream.on('data', (chunk) => {
                    const chunk2 = chunk.replace(/^\uFEFF/, '')
                    const chunk3 = chunk2.replace(/"/g, '')
                    const chunk4 = chunk3.replace(/dcterms:/, '')
                    // Encode the replaced chunk to UTF-8
                    const encodedChunk = textEncoder.encode(chunk4);
                    writableStream.write(encodedChunk);
                });
               // Handle the end event of the readable stream
                readableStream.on('end', () => {
                  // Close the writable stream
                  writableStream.end();
                });
                // Handle the error event of the readable stream
                readableStream.on('error', (err) => {
                  console.error(chalk.red('An error occurred while reading the file: '), err);
                });
                // Handle the error event of the writable stream
                writableStream.on('error', (err) => {
                    console.error(chalk.red('An error occurred while reading the file: '), err);
                });
                // Handle the finish event of the writable stream
                writableStream.on('finish', () => {
                //   console.log('File encoding converted to UTF-8 with character replacement successfully for ' + infile);
                //   resolve('success')
                  resolve(outfile)
                  
                });
            } catch (error) {
                reject(new Error(error))
            }
        }
    })
}

// fills table in database (either deleting records to be updated, and then update, or fill entire table after data has been removed)
// in: db (sqlite-database containing one organismgroup)
//     tableName (string, name of table to fill data into)
//     filename (string, name of dumpfile where data is fetched)
async function fillTable(db, tablename, filename, update) {
    return new Promise(function (resolve, reject) {
        
        try {
            if (!fs.existsSync(filename)) {
                resolve('success')
            } else {
                fs.createReadStream(filename)
                    .pipe(csvParser({ separator: "\t"}))
                    .on('data', (row) => {
                        
// console.log(row)
                        if (!filename.includes('corema')) {  // i.e. musitfile. if-statement only works because the corema-files lie in a folder named smth with "corema", so "corema" is in the file-path   
                            db.serialize(() => {
                                let indexOfDash // I used this in line 268, but removed it, don't remember why. as of june -23, is not used
                                if (row.catalogNumber.indexOf('/')) {indexOfDash = row.catalogNumber.indexOf('/')} else { indexOfDash = row.catalogNumber.length}
                                if (update === 'update') { 
                                    db.run(`DELETE FROM ${tablename} WHERE catalogNumber = "${row.catalogNumber}"`) 
                                }
                                db.prepare(`INSERT INTO ${tablename} (modified, institutionCode, collectionCode, basisOfRecord, catalogNumber, scientificName, scientificNameAuthorship, kingdom, phylum, class, "order", family, genus, specificEpithet, identifiedBy, dateIdentified, typeStatus, recordNumber,
                                fieldNumber, recordedBy, eventDate, continent, country, stateProvince, county, locality, decimalLongitude, decimalLatitude, coordinateUncertaintyInMeters, verbatimElevation, verbatimDepth, sex, lifeStage, preparations,individualCount, otherCatalogNumbers, occurrenceRemarks, samplingProtocol, identificationQualifier,
                                habitat, associatedTaxa, georeferenceRemarks, verbatimCoordinates, verbatimSRS, associatedMedia, CreativeCommonsLicense, ArtObsID, occurrenceID, UTMsone, UTMX, UTMY, datasetName, createdDate, bioGeoRegion, recordedById, identifiedById, approvedDate) 
                                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
                                .run(row.modified, row.institutionCode, row.collectionCode, row.basisOfRecord, row.catalogNumber/*.substring(0,indexOfDash)*/, row.scientificName, row.scientificNameAuthorship, row.kingdom, row.phylum, row.class, row.order, row.family, row.genus, row.specificEpithet, row.identifiedBy, row.dateIdentified, row.typeStatus, row.recordNumber,
                                row.fieldNumber, row.recordedBy, row.eventDate, row.continent, row.country, row.stateProvince, row.county, row.locality, row.decimalLongitude, row.decimalLatitude, row.coordinateUncertaintyInMeters, row.verbatimElevation, row.verbatimDepth, row.sex, row.lifeStage, row.preparations, row.individualCount, row.otherCatalogNumbers, row.occurrenceRemarks, row.samplingProtocol, row.identificationQualifier,
                                row.habitat, row.associatedTaxa, row.georeferenceRemarks, row.verbatimCoordinates, row.verbatimSRS, row.associatedMedia, row.CreativeCommonsLicense, row.ArtObsID, row.occurrenceID, row.UTMsone, row.UTMX, row.UTMY, row.datasetName, row.createdDate, row.bioGeoRegion, row.recordedById, row.identifiedById, row.approvedDate)
                            })
                        } else if (tablename == 'amplification') {
                            // console.log(row)
                            db.serialize(() => {
                                if (update === 'update') { db.run(`DELETE FROM amplification WHERE coreid = "${row.coreid}"`) }
                                db.prepare(`INSERT INTO amplification (coreid, geneticAccessionURI, geneticAccessionNumber, BOLDProcessID) VALUES (?,?,?,?)`).run(row.coreid, row.geneticAccessionURI, row.geneticAccessionNumber, row.BOLDProcessID)
                            })
                        } else if (tablename == 'materialsample') {
                            db.serialize(() => {
                                if (update === 'update') { db.run(`DELETE FROM materialsample WHERE coreid = "${row.coreid}"`) }
                                db.prepare(`INSERT INTO materialsample (coreid, materialSampleType, concentration, concentrationUnit) VALUES (?,?,?,?)`).run(row.coreid, row.materialSampleType, row.concentration, row.concentrationUnit)
                            })
                        } else if (tablename == 'multimedia') {
                            db.serialize(() => {
                                // if (update === 'update') { db.run(`DELETE FROM multimedia WHERE identifier = "${row.identifier}"`)} // with this, not all new photos are imported into database
                                db.prepare(`INSERT INTO ${tablename} (coreid, type,format,identifier,title,created,creator,source,license) VALUES (?,?,?,?,?,?,?,?,?)`).run(row.coreid, row.type, row.format, row.identifier, row.title, row.created, row.creator, row.source, row.license)
                            })
                        } else if (tablename == 'permit') {
                            db.serialize(() => {
                                if (update === 'update') { db.run(`DELETE FROM permit WHERE coreid = "${row.coreid}"`) }
                                db.prepare(`INSERT INTO ${tablename} (coreid, permitType, permitStatus, permitStatusQualifier, permitText) VALUES (?,?,?,?,?)`).run(row.coreid, row.permitType, row.permitStatus, row.permitStatusQualifier, row.permitText)
                            })
                        } else if (tablename == 'preparation') {
                            db.serialize(() => {
                                if (update === 'update') { db.run(`DELETE FROM preparation WHERE coreid = "${row.coreid}"`) }
                                db.prepare(`INSERT INTO ${tablename} (coreid, preparationType, preparationMaterials, preparedBy, preparationDate) VALUES (?,?,?,?,?)`).run(row.coreid, row.preparationType, row.preparationMaterials, row.preparedBy, row.preparationDate)
                            })
                        } else if (tablename == 'preservation') {
                            db.serialize(() => {
                                if (update === 'update') { db.run(`DELETE FROM preservation WHERE coreid = "${row.coreid}"`) }
                                db.prepare(`INSERT INTO ${tablename} (coreid, preservationType) VALUES (?,?)`).run(row.coreid, row.preservationType)
                            })
                        } else if (tablename == 'resourcerelationship') {
                            db.serialize(() => {
                                if (update === 'update') { db.run(`DELETE FROM resourcerelationship WHERE coreid = "${row.coreid}"`) }
                                db.prepare(`INSERT INTO ${tablename} (coreid, relatedResourceID, relationshipOfResource, relationshipAccordingTo, relationshipEstablishedDate, relationshipRemarks) VALUES (?,?,?,?,?,?)`).run(row.coreid, row.relatedResourceID, row.relationshipOfResource, row.relationshipAccordingTo, row.relationshipEstablishedDate, row.relationshipRemarks)
                            })
                        } else if (tablename == 'simpledwc') {
                            db.serialize(() => {
                                if (update === 'update') { db.run(`DELETE FROM simpledwc WHERE occurrenceID = "${row.occurrenceID}"`) }
                                db.prepare(`INSERT INTO ${tablename} (type, modified, rightsHolder, accessRights, collectionID, datasetID, institutionCode, collectionCode, ownerInstitutionCode, basisOfRecord, informationWithheld, occurrenceID, catalogNumber, recordNumber, recordedBy, sex, lifeStage, preparations, disposition, associatedMedia, organismID, materialSampleID, eventDate, country, stateProvince,
                                county, locality, minimumElevationInMeters, decimalLatitude, decimalLongitude, identificationQualifier, identifiedBy, dateIdentified, scientificName, "order", family, genus, specificEpithet, infraspecificEpithet, taxonRank, scientificNameAuthorship, typeStatus) 
                                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(row.type, row.modified, row.rightsHolder, row.accessRights, row.collectionID, row.datasetID, row.institutionCode, row.collectionCode, row.ownerInstitutionCode, row.basisOfRecord, row.informationWithheld, row.occurrenceID, row.catalogNumber, row.recordNumber, row.recordedBy, row.sex, row.lifeStage, row.preparations, row.disposition, row.associatedMedia, row.organismID, row.materialSampleID, row.eventDate, row.country, row.stateProvince,
                                    row.county, row.locality, row.minimumElevationInMeters, row.decimalLatitude, row.decimalLongitude, row.identificationQualifier, row.identifiedBy, row.dateIdentified, row.scientificName, row.order, row.family, row.genus, row.specificEpithet, row.infraspecificEpithet, row.taxonRank, row.scientificNameAuthorship, row.typeStatus)
                            })    
                        }
                    })
                    .on('end', () => {
                        // console.log('CSV file successfully processed for ' + tablename)
                        resolve('success')
                    })
            }
        } catch (error) {
            console.error(chalk.red('An error occurred while fillTable(): '), error);
            reject(new Error(error))
        }
    })
}

// create view combining musit-table and relatedresourceID in corema, to be able to match between them
const createViewMusitRel = (musitFile, double) => {
    let joinClause
    if (double === 'no') {
        joinClause = `resourcerelationship.cleanCatalogNumberRecRel = ${musitFile}.catalogNumber`
    } else {
        joinClause = `resourcerelationship.cleanCatalogNumberRecRel = 'O:' || ${musitFile}.collectionCode || ':' || ${musitFile}.catalogNumber`
    }
    return (
        `CREATE VIEW musitRel AS
                SELECT 
                ${musitFile}.basisOfRecord,
                ${musitFile}.catalogNumber,
                ${musitFile}.scientificName,
                ${musitFile}.institutionCode,
                ${musitFile}.collectionCode,
                ${musitFile}.scientificName,
                ${musitFile}.scientificNameAuthorship,
                ${musitFile}.kingdom,
                ${musitFile}.phylum,
                ${musitFile}.class,
                ${musitFile}."order",
                ${musitFile}.family,
                ${musitFile}.genus,
                ${musitFile}.specificEpithet,
                ${musitFile}.infraspecificEpithet,
                ${musitFile}.identificationQualifier,
                ${musitFile}.identifiedBy,
                ${musitFile}.dateIdentified,
                ${musitFile}.typeStatus,
                ${musitFile}.recordNumber,
                ${musitFile}.fieldNumber,
                ${musitFile}.recordedBy,
                ${musitFile}.eventDate,
                ${musitFile}.continent,
                ${musitFile}.country,
                ${musitFile}.stateProvince,
                ${musitFile}.county,
                ${musitFile}.locality,
                ${musitFile}.decimalLongitude,
                ${musitFile}.decimalLatitude,
                ${musitFile}.coordinateUncertaintyInMeters,
                ${musitFile}.verbatimElevation,
                ${musitFile}.verbatimDepth,
                ${musitFile}.habitat,
                ${musitFile}.associatedMedia,
                ${musitFile}.CreativeCommonsLicense,
                ${musitFile}.ArtObsID,
                ${musitFile}.modified,
        relatedResourceID,
        resourcerelationship.coreid
        
        FROM ${musitFile}
        LEFT JOIN resourcerelationship on ${joinClause}`)
}

// create sqlite-view combining all corema-dump files (darwin core archive files)
const createViewCoremaFields = () => {
    const viewCoremaFields = `CREATE VIEW coremaFields AS
    SELECT simpledwc.occurrenceID AS itemID, organismID, simpledwc.institutionCode, simpledwc.collectionCode, simpledwc.catalogNumber AS fullCatalogNumber, simpledwc.cleanCatalogNumber AS catalogNumber, rightsHolder, informationWithheld, simpledwc.preparations, simpledwc.basisOfRecord,
    materialSampleType, 
    preservationType,
    preparationType, preparationMaterials, preparedBy, preparationDate,
    geneticAccessionNumber, BOLDProcessID,
    concentration, concentrationUnit,

    simpledwc.recordNumber,
    simpledwc.recordedBy,
    simpledwc.eventDate,
    simpledwc.country,
    simpledwc.stateProvince,
    simpledwc.county,
    simpledwc.locality,
    simpledwc.minimumElevationInMeters,
    simpledwc.decimalLatitude,
    simpledwc.decimalLongitude,
    simpledwc.identificationQualifier,
    simpledwc.typeStatus,
    simpledwc.identifiedBy,
    simpledwc.dateIdentified,
    simpledwc.scientificName,
    simpledwc."order",
    simpledwc.family,
    simpledwc.genus,
    simpledwc.specificEpithet,
    simpledwc.infraspecificEpithet,
    simpledwc.scientificNameAuthorship,
    resourcerelationship.relatedResourceID,
    modified

    FROM simpledwc
    LEFT JOIN preservation on simpledwc.occurrenceID = preservation.coreid
    LEFT JOIN preparation on simpledwc.occurrenceID = preparation.coreid
    LEFT JOIN amplification on simpledwc.occurrenceID = amplification.coreid
    LEFT JOIN materialsample on simpledwc.occurrenceID = materialsample.coreid
    LEFT JOIN resourcerelationship on simpledwc.occurrenceID = resourcerelationship.coreid
    `
    return viewCoremaFields
}

// select data from tables or views, from corema or both databases, give new column-names if desirable
const musitSelect = `SELECT 
musitRel.basisOfRecord,
musitRel.catalogNumber,
musitRel.scientificName,
musitRel.institutionCode,
musitRel.collectionCode,
musitRel.scientificName,
musitRel.scientificNameAuthorship,
musitRel.kingdom,
musitRel.phylum,
musitRel.class,
musitRel."order",
musitRel.family,
musitRel.genus,
musitRel.specificEpithet,
musitRel.infraspecificEpithet,
musitRel.identifiedBy,
musitRel.identificationQualifier,
musitRel.dateIdentified,
musitRel.typeStatus,
musitRel.recordNumber,
musitRel.fieldNumber,
musitRel.recordedBy,
musitRel.eventDate,
musitRel.continent,
musitRel.country,
musitRel.stateProvince,
musitRel.county,
musitRel.locality,
musitRel.decimalLongitude,
musitRel.decimalLatitude,
musitRel.coordinateUncertaintyInMeters,
musitRel.verbatimElevation,
musitRel.verbatimDepth,
musitRel.habitat,
musitRel.associatedMedia,
musitRel.CreativeCommonsLicense,
musitRel.ArtObsID,
musitRel.relatedResourceID,
musitRel.coreid,
musitRel.modified AS musitModified,
coremaFields.itemID, organismID, coremaFields.fullCatalogNumber AS RelCatNo, coremaFields.catalogNumber AS RelCleanCatNo, rightsHolder, coremaFields.basisOfRecord AS coremaBasisOfRecord, informationWithheld, coremaFields.preparations, coremaFields.materialSampleType,
coremaFields.modified AS coremaModified,

preservationType,
preparationType, preparationMaterials, preparedBy, preparationDate,
geneticAccessionNumber, BOLDProcessID,
concentration, concentrationUnit,

coremaFields.recordNumber AS coremaRecordNumber,
coremaFields.recordedBy AS coremaRecordedBy,
coremaFields.eventDate AS coremaEventDate,
coremaFields.country AS coremaCountry,
coremaFields.stateProvince AS coremaProvince,
coremaFields.county AS coremaCounty,
coremaFields.locality AS coremaLocality,
coremaFields.minimumElevationInMeters AS coremaElevation,
coremaFields.decimalLatitude AS coremaLat,
coremaFields.decimalLongitude AS coremaLong,
coremaFields.identificationQualifier AS coremaIdentificationQualifier,
coremaFields.typeStatus AS coremaTypeStatus,
coremaFields.identifiedBy AS coremaIdentifiedBy,
coremaFields.dateIdentified AS coremaDateIdentified,
coremaFields.scientificName AS coremaScientificName,
coremaFields.genus AS coremaGenus,
coremaFields.specificEpithet AS coremaSpecificEpithet

FROM musitRel
LEFT JOIN coremaFields ON musitRel.coreid = coremaFields.itemID

ORDER BY organismID ASC`

function dbSelectFunction (start,end) {
    const shortMusitSelect = `SELECT 
    musitRel.basisOfRecord,
    musitRel.catalogNumber,
    musitRel.scientificName,
    musitRel.institutionCode,
    musitRel.collectionCode,
    musitRel.scientificName,
    musitRel.scientificNameAuthorship,
    musitRel.kingdom,
    musitRel.phylum,
    musitRel.class,
    musitRel."order",
    musitRel.family,
    musitRel.genus,
    musitRel.specificEpithet,
    musitRel.infraspecificEpithet,
    musitRel.identifiedBy,
    musitRel.identificationQualifier,
    musitRel.dateIdentified,
    musitRel.typeStatus,
    musitRel.recordNumber,
    musitRel.fieldNumber,
    musitRel.recordedBy,
    musitRel.eventDate,
    musitRel.continent,
    musitRel.country,
    musitRel.stateProvince,
    musitRel.county,
    musitRel.locality,
    musitRel.decimalLongitude,
    musitRel.decimalLatitude,
    musitRel.coordinateUncertaintyInMeters,
    musitRel.verbatimElevation,
    musitRel.verbatimDepth,
    musitRel.habitat,
    musitRel.associatedMedia,
    musitRel.CreativeCommonsLicense,
    musitRel.ArtObsID,
    musitRel.relatedResourceID,
    musitRel.coreid,
    musitRel.modified AS musitModified,
    coremaFields.itemID, organismID, coremaFields.fullCatalogNumber AS RelCatNo, coremaFields.catalogNumber AS RelCleanCatNo, rightsHolder, coremaFields.basisOfRecord AS coremaBasisOfRecord, informationWithheld, coremaFields.preparations, coremaFields.materialSampleType,
    coremaFields.modified AS coremaModified,
    
    preservationType,
    preparationType, preparationMaterials, preparedBy, preparationDate,
    geneticAccessionNumber, BOLDProcessID,
    concentration, concentrationUnit,
    
    coremaFields.recordNumber AS coremaRecordNumber,
    coremaFields.recordedBy AS coremaRecordedBy,
    coremaFields.eventDate AS coremaEventDate,
    coremaFields.country AS coremaCountry,
    coremaFields.stateProvince AS coremaProvince,
    coremaFields.county AS coremaCounty,
    coremaFields.locality AS coremaLocality,
    coremaFields.minimumElevationInMeters AS coremaElevation,
    coremaFields.decimalLatitude AS coremaLat,
    coremaFields.decimalLongitude AS coremaLong,
coremaFields.identificationQualifier AS coremaIdentificationQualifier,
    coremaFields.typeStatus AS coremaTypeStatus,
    coremaFields.identifiedBy AS coremaIdentifiedBy,
    coremaFields.dateIdentified AS coremaDateIdentified,
    coremaFields.scientificName AS coremaScientificName,
    coremaFields.genus AS coremaGenus,
    coremaFields.specificEpithet AS coremaSpecificEpithet
    
    FROM musitRel
    LEFT JOIN coremaFields ON musitRel.coreid = coremaFields.itemID
    WHERE musitRel.catalogNumber > ${start} AND musitRel.catalogNumber < ${end}
    
    ORDER BY organismID ASC`
    return shortMusitSelect
    
}

// sqlite-select coremadata adding musitdata
const coremaSelectWithMusit = `SELECT 
coremaFields.itemID, coremaFields.organismID, coremaFields.institutionCode, coremaFields.collectionCode, coremaFields.fullCatalogNumber, coremaFields.catalogNumber, coremaFields.rightsHolder, coremaFields.informationWithheld, coremaFields.basisOfRecord,
coremaFields.recordedBy, coremaFields.preparations,  coremaFields.eventDate, 
coremaFields.country, coremaFields.stateProvince, coremaFields.county, coremaFields.locality, 
coremaFields.decimalLatitude, coremaFields.decimalLongitude, coremaFields.identificationQualifier, coremaFields.typeStatus,
coremaFields.identifiedBy,coremaFields.dateIdentified, coremaFields.scientificName, coremaFields."order", coremaFields.family, coremaFields.genus, coremaFields.specificEpithet,
coremaFields.infraspecificEpithet, coremaFields.scientificNameAuthorship,
coremaFields.preservationType,
coremaFields.preparationType, coremaFields.preparationMaterials, coremaFields.preparedBy, preparationDate,
geneticAccessionNumber, BOLDProcessID,
materialSampleType,concentration, concentrationUnit,

coremaFields.relatedResourceID,
coremaFields.modified AS coremaModified,

musitRel.basisOfRecord AS musitBasisOfRecord,
musitRel.collectionCode AS musitCollectionCode,
musitRel.catalogNumber AS RelCatNo,
musitRel.modified AS musitModified

FROM coremaFields
LEFT JOIN musitRel ON coremaFields.itemID = musitRel.coreid
ORDER BY organismID ASC`

// sqlite-select coremadata where there no musitdata
const coremaSelect = `SELECT 
simpledwc.occurrenceID as itemID, organismID, materialSampleID, institutionCode, collectionCode, catalogNumber AS fullCatalogNumber, cleanCatalogNumber AS catalogNumber, rightsHolder, basisOfRecord AS coremaBasisOfRecord, informationWithheld, recordedBy, sex, lifeStage, preparations, disposition, eventDate, country, stateProvince,
    county, locality, minimumElevationInMeters, decimalLatitude, decimalLongitude, identificationQualifier, identifiedBy, dateIdentified, typeStatus, scientificName, "order", family, genus, specificEpithet, infraspecificEpithet, taxonRank, scientificNameAuthorship,
    preservationType,

    preparationType, preparationMaterials, preparedBy, preparationDate,

    geneticAccessionNumber, BOLDProcessID,

    materialSampleType, concentration, concentrationUnit,

    identifier AS associatedMedia

    FROM simpledwc
    LEFT JOIN preservation on simpledwc.occurrenceID = preservation.coreid
    LEFT JOIN preparation on simpledwc.occurrenceID = preparation.coreid
    LEFT JOIN amplification on simpledwc.occurrenceID = amplification.coreid
    LEFT JOIN materialsample on simpledwc.occurrenceID = materialsample.coreid
    LEFT JOIN multimedia on simpledwc.occurrenceID = multimedia.coreid
    ORDER BY organismID ASC`


// puts item-information for several items in one line, resulting in one line for each object for coremadata.
// in: rows (JSON object? or similar, coming from sqlite-query)
// out: processedRows (?)
// called in runMusitCoremaStitch()
const itemToArraysOnSameLine = (rows, basedOn) => {
    // go through all objects, put organism ids in array
    // if object exist in array, transform (or add) relevant properties to arrays in that object, and add item-info to object
    let processedRows = []
    let existingRow = 'nothing'
    for (i = 0; i < rows.length; i++) {
        if (i == rows.length - 1) { // we reached the end of the file
            if (existingRow != 'nothing') {
                processedRows.push(existingRow)
                existingRow = 'nothing'
            } else {
                processedRows.push(rows[i])
            }
        } else if (rows[i].organismID != null) {
            if (rows[i].organismID == rows[i + 1].organismID) { // next line is item of same organism
                if (existingRow == 'nothing') { // first of two or more items
                    rows[i].fullCatalogNumber = [rows[i].fullCatalogNumber]
                    rows[i].materialSampleType = [rows[i].materialSampleType]
                    if (rows[i].RelCatNo != '') {
                        rows[i].RelCatNo = [rows[i].RelCatNo]
                        rows[i].RelCleanCatNo = [rows[i].RelCleanCatNo]
                    }
                    rows[i].preservationType = [rows[i].preservationType]
                    rows[i].preparationType = [rows[i].preparationType]
                    rows[i].preparationMaterials = [rows[i].preparationMaterials]
                    rows[i].preparedBy = [rows[i].preparedBy]
                    rows[i].preparationDate = [rows[i].preparationDate]
                    rows[i].geneticAccessionNumber = [rows[i].geneticAccessionNumber]
                    rows[i].BOLDProcessID = [rows[i].BOLDProcessID]
                    rows[i].concentration = [rows[i].concentration]
                    rows[i].concentrationUnit = [rows[i].concentrationUnit]
                    existingRow = rows[i]
                } else { // second or higher number of items for one organism
                    if (basedOn === 'corema') {
                        existingRow.fullCatalogNumber.push(rows[i].fullCatalogNumber)
                    }
                    existingRow.materialSampleType.push(rows[i].materialSampleType)

                    if (Array.isArray(rows[i].RelCatNo)) {
                        let len = rows[i].RelCatNo.length
                        if (existingRow.RelCatNo != rows[i].RelCatNo[len - 1]) {
                            existingRow.RelCatNo.push(rows[i].RelCatNo)
                            existingRow.RelCleanCatNo.push(rows[i].RelCleanCatNo)
                        }
                    } else if (rows[i].RelCatNo != existingRow.RelCatNo) { // blir dette rett?
                        existingRow.RelCatNo.push(rows[i].RelCatNo)
                        existingRow.RelCleanCatNo.push(rows[i].RelCleanCatNo)
                    }
                    existingRow.preservationType.push(rows[i].preservationType)
                    existingRow.preparationType.push(rows[i].preparationType)
                    existingRow.preparationMaterials.push(rows[i].preparationMaterials)
                    existingRow.preparedBy.push(rows[i].preparedBy)
                    existingRow.preparationDate.push(rows[i].preparationDate)
                    existingRow.geneticAccessionNumber.push(rows[i].geneticAccessionNumber)
                    existingRow.BOLDProcessID.push(rows[i].BOLDProcessID)
                    existingRow.concentration.push(rows[i].concentration)
                    existingRow.concentrationUnit.push(rows[i].concentrationUnit)
                }
            } else { // next line is not the same organism
                if (existingRow != 'nothing') { // previous line(s) are items of same organism as this, and this is the last item
                    if (basedOn === 'musit') {
                        // existingRow.preparationType.unshift(rows[i].basisOfRecord)
                    } else if (basedOn === 'corema') {
                        // jeg endrer her slik at item-arrayen bare inneholder items fra corema. musit-item'et får være for seg selv.
                        // if (existingRow.musitBasisOfRecord != null) {
                        //     existingRow.preparationType.push(rows[i].musitBasisOfRecord)
                        // }
                        
                        existingRow.fullCatalogNumber.push(rows[i].fullCatalogNumber)
                    }
                    existingRow.materialSampleType.push(rows[i].materialSampleType)

                    if (Array.isArray(rows[i].RelCatNo)) { // HVA ER DETTE?
                        let len = rows[i].RelCatNo.length
                        if (existingRow.RelCatNo != rows[i].RelCatNo[len - 1]) {
                            existingRow.RelCatNo.push(rows[i].RelCatNo)
                            existingRow.RelCleanCatNo.push(rows[i].RelCleanCatNo)
                        }
                    } else if (rows[i].RelCatNo != existingRow.RelCatNo) { // blir dette rett?
                        existingRow.RelCatNo.push(rows[i].RelCatNo)
                        existingRow.RelCleanCatNo.push(rows[i].RelCleanCatNo)
                    }
                    existingRow.preservationType.push(rows[i].preservationType)
                    existingRow.preparationType.push(rows[i].preparationType)
                    existingRow.preparationMaterials.push(rows[i].preparationMaterials)
                    existingRow.preparedBy.push(rows[i].preparedBy)
                    existingRow.preparationDate.push(rows[i].preparationDate)
                    existingRow.geneticAccessionNumber.push(rows[i].geneticAccessionNumber)
                    existingRow.BOLDProcessID.push(rows[i].BOLDProcessID)
                    existingRow.concentration.push(rows[i].concentration)
                    existingRow.concentrationUnit.push(rows[i].concentrationUnit)

                    existingRow.fullCatalogNumber = existingRow.fullCatalogNumber.join(' | ')
                    existingRow.materialSampleType = existingRow.materialSampleType.join(' | ')
                    existingRow.RelCatNo = existingRow.RelCatNo.join(' | ')
                    existingRow.RelCleanCatNo = existingRow.RelCleanCatNo.join(' | ')
                    existingRow.preparationType = existingRow.preparationType.join(' | ')
                    existingRow.preservationType = existingRow.preservationType.join(' | ')
                    existingRow.preparationMaterials = existingRow.preparationMaterials.join(' | ')
                    existingRow.preparedBy = existingRow.preparedBy.join(' | ')
                    existingRow.preparationDate = existingRow.preparationDate.join(' | ')
                    existingRow.geneticAccessionNumber = existingRow.geneticAccessionNumber.join(' | ')
                    existingRow.BOLDProcessID = existingRow.BOLDProcessID.join(' | ')
                    existingRow.concentration = existingRow.concentration.join(' | ')
                    existingRow.concentrationUnit = existingRow.concentrationUnit.join(' | ')
                    processedRows.push(existingRow)
                    existingRow = 'nothing'

                } else {
                    processedRows.push(rows[i])
                }
            }
            // if row does not have data for organismID (i.e., is not in corema)
        } else {
            processedRows.push(rows[i])
        }
    }
    return (processedRows)
}

// finds duplicate entries in corema of one musit-entry, concatenate them, and remove superfluous row
// (happens when erroneously one musit-object is entered twice into corema, as accessions. should be items)
// in: processedRows (?)
// out: sortedRows (?)
const removeCoremaDuplicates = (processedRows) => {
    let rowsArray = []
    processedRows.forEach(el => {
        if (!el.catalogNumber.toString().includes('|')) {
            if (el.catalogNumber) {
                rowsArray.push(el.catalogNumber)
            }
        }
    })
    rowsArray.sort()
    let duplicates = []

    for (i = 0; i < rowsArray.length; i++) {
        if (rowsArray[i] === rowsArray[i + 1]) {
            duplicates.push(rowsArray[i])
        }
    }

    // const sortedRows = processedRows.sort((a, b) => {
    processedRows.sort((a, b) => {
        if (a.catalogNumber !== 'null' && b.catalogNumber !== 'null') {
            return a.catalogNumber > b.catalogNumber ? 1 : -1
        } else {
            return a.catalogNumber !== 'null' ? 1 : -1
        }
    })

    duplicates.forEach(el => {
        // let first = sortedRows.find(element => element.catalogNumber === el)
        // let secondIndex = sortedRows.indexOf(sortedRows.find(element => element.catalogNumber === el))
        let first = processedRows.find(element => element.catalogNumber === el)
        let secondIndex = processedRows.indexOf(processedRows.find(element => element.catalogNumber === el))
        first.RelCatNo = [first.RelCatNo]
        first.RelCleanCatNo = [first.RelCleanCatNo]
        first.materialSampleType = [first.materialSampleType]
        first.preservationType = [first.preservationType]
        first.preparationType = [first.preparationType]
        first.preparationMaterials = [first.preparationMaterials]
        first.preparedBy = [first.preparedBy]
        first.preparationDate = [first.preparationDate]
        first.geneticAccessionNumber = [first.geneticAccessionNumber]
        first.BOLDProcessID = [first.BOLDProcessID]
        first.concentration = [first.concentration]
        first.concentrationUnit = [first.concentrationUnit]

        // bytter sorted med processed herfra og ut funksjonen
        first.RelCatNo.push(processedRows[secondIndex + 1].RelCatNo)
        first.RelCleanCatNo.push(processedRows[secondIndex + 1].RelCleanCatNo)
        first.materialSampleType.push(processedRows[secondIndex + 1].materialSampleType)
        first.preservationType.push(processedRows[secondIndex + 1].preservationType)
        first.preparationType.push(processedRows[secondIndex + 1].preparationType)
        first.preparationMaterials.push(processedRows[secondIndex + 1].preparationMaterials)
        first.preparedBy.push(processedRows[secondIndex + 1].preparedBy)
        first.preparationDate.push(processedRows[secondIndex + 1].preparationDate)
        first.geneticAccessionNumber.push(processedRows[secondIndex + 1].geneticAccessionNumber)
        first.BOLDProcessID.push(processedRows[secondIndex + 1].BOLDProcessID)
        first.concentration.push(processedRows[secondIndex + 1].concentration)
        first.concentrationUnit.push(processedRows[secondIndex + 1].concentrationUnit)

        first.RelCatNo = first.RelCatNo.join(' | ')
        first.RelCleanCatNo = first.RelCleanCatNo.join(' | ')
        first.materialSampleType = first.materialSampleType.join(' | ')
        first.preservationType = first.preservationType.join(' | ')
        first.preparationType = first.preparationType.join(' | ')
        first.preparationMaterials = first.preparationMaterials.join(' | ')
        first.preparedBy = first.preparedBy.join(' | ')
        first.preparationDate = first.preparationDate.join(' | ')
        first.geneticAccessionNumber = first.geneticAccessionNumber.join(' | ')
        first.BOLDProcessID = first.BOLDProcessID.join(' | ')
        first.concentration = first.concentration.join(' | ')
        first.concentrationUnit = first.concentrationUnit.join(' | ')

        processedRows.splice(secondIndex + 1, 1)
    })
    return processedRows
}

// is called in runMusitCoremaStitch(9)
function mapElementToColumns(fieldNames) {
    return function (element) {
        // field names = headere
        // The map() method creates a new array populated with the results of calling a provided function on every element in the calling array.
        let fields = fieldNames.map(n => element[n] ? JSON.stringify(element[n]) : '""')
        return fields.join('\t')
    }
}


// main-function that opens db, query database, stitch data, and writes to file for collections that only have data in corema (e.g. birds)
// in: collection (string, name of collection)
//     coremaFolder (string, name of folder with corema dwc-archive files for that collection)
//     outfile (string, name of final stitched file)
//     update (string, either 'update' to update db-tables with only new and changed posts,
//             or 'empty_fill' to empty tabels and fill from scratch)
// out: outfile (the final stitched file)
async function runCoremaStitch(collection, coremaFile, coremaFolder, outfile, update) {
    let dataBaseFile = `${pathToDatabases}${collection}.db`
    db = await createDatabase(dataBaseFile, "corema", coremaFile, collection)
    
    let fileSuffix = ''
    // find new or newly changed records in simpledwc and put in separate file (_new)
    if (update === 'update') {
        await makeFileOnlyNew(db, 'simpledwc', coremaFolder, 'corema')
        await makeOtherFileOnlyNew('amplification', coremaFolder)
        await makeOtherFileOnlyNew('materialsample', coremaFolder)
        await makeOtherFileOnlyNew('multimedia', coremaFolder)
        await makeOtherFileOnlyNew('permit', coremaFolder)
        await makeOtherFileOnlyNew('preparation', coremaFolder)
        await makeOtherFileOnlyNew('preservation', coremaFolder)
        await makeOtherFileOnlyNew('resourcerelationship', coremaFolder)
        fileSuffix = '_new'
    }

    const fileTypes = ['amplification', 'materialsample', 'multimedia', 'permit', 'preparation', 'preservation', 'resourcerelationship', 'simpledwc'];
    
    for (const fileType of fileTypes) {
        const filePath = path.join(pathToCoremaDumpsForPortal, coremaFolder, `${fileType}${fileSuffix}.txt`);
        await changeEncoding(filePath);
    }
    
    // delete data from tables in a sqlite-database (one per organismgroup)
    if (update === 'empty_fill') {
        await deleteFromTable (db, 'amplification')
        await deleteFromTable (db, 'materialsample')
        await deleteFromTable (db, 'multimedia')
        await deleteFromTable (db, 'permit')
        await deleteFromTable (db, 'preparation')
        await deleteFromTable (db, 'preservation')
        await deleteFromTable (db, 'resourcerelationship')
        await deleteFromTable (db, 'simpledwc')
    }

    await fillTable(db, 'amplification', path.join(pathToCoremaDumpsForPortal, coremaFolder, `amplification${fileSuffix}2.txt`));
    await fillTable(db, 'materialsample', path.join(pathToCoremaDumpsForPortal, coremaFolder, `materialsample${fileSuffix}2.txt`));
    await fillTable(db, 'multimedia', path.join(pathToCoremaDumpsForPortal, coremaFolder, `multimedia${fileSuffix}2.txt`));
    await fillTable(db, 'permit', path.join(pathToCoremaDumpsForPortal, coremaFolder, `permit${fileSuffix}2.txt`));
    await fillTable(db, 'preparation', path.join(pathToCoremaDumpsForPortal, coremaFolder, `preparation${fileSuffix}2.txt`));
    await fillTable(db, 'preservation', path.join(pathToCoremaDumpsForPortal, coremaFolder, `preservation${fileSuffix}2.txt`));
    await fillTable(db, 'resourcerelationship', path.join(pathToCoremaDumpsForPortal, coremaFolder, `resourcerelationship${fileSuffix}2.txt`));
    await fillTable(db, 'simpledwc', path.join(pathToCoremaDumpsForPortal, coremaFolder, `simpledwc${fileSuffix}2.txt`));

    const start = coremaFolder.length + 2
    return new Promise(function (resolve, reject) {
        try {
            db.serialize(() => { // å ta bort denne fører oss ikke videre, inn i først db.run
                // only first time:
                // db.run(`ALTER TABLE simpledwc  
                //    ADD cleanCatalogNumber INTEGER`)
                // //remove prefix (coll-urn) from cleanCatNo
                // return new Promise(function (resolve, reject) {
                db.run(`UPDATE simpledwc SET cleanCatalogNumber = SUBSTR(catalogNumber,${start},LENGTH(catalogNumber)-${start}-3)`, function (err) {
                    if (err) {
                        return console.error(err.message)
                    } else {
                        console.log(chalk.green('No error i db.serialize'))
                    }
                })
                    .all(coremaSelect, (err, rows) => {
                        if (err) {
                            console.error(chalk.red(err.message))
                        }
                        
                        // go through all objects
                        // put organism id in array
                        // if object exist in array, transform (or add) relevant properties to arrays in that object, and add item-info to object
                        let processedRows = []
                        let existingRow = 'nothing'
                        // console.log(rows.length + ' lengde')
                        for (i = 0; i < rows.length; i++) {
                            if (i == rows.length - 1) { // we reached the end of the file
                                if (existingRow != 'nothing') {
                                    processedRows.push(existingRow)
                                    existingRow = 'nothing'
                                } else {
                                    processedRows.push(rows[i])
                                }

                            } else if (rows[i].organismID != null) {
                                if (rows[i].organismID === rows[i + 1].organismID) { // next line is item of same organism
                                    
                                    if (existingRow === 'nothing') { // if this is the first line for this object
                                        rows[i].fullCatalogNumber = [rows[i].fullCatalogNumber]
                                        rows[i].preservationType = [rows[i].preservationType]
                                        if (!rows[i].preparationType) { rows[i].preparationType = rows[i].coremaBasisOfRecord }
                                        rows[i].preparationType = [rows[i].preparationType]
                                        rows[i].preparationMaterials = [rows[i].preparationMaterials]
                                        rows[i].preparedBy = [rows[i].preparedBy]
                                        rows[i].preparationDate = [rows[i].preparationDate]
                                        rows[i].materialSampleType = [rows[i].materialSampleType]
                                        rows[i].geneticAccessionNumber = [rows[i].geneticAccessionNumber]
                                        rows[i].BOLDProcessID = [rows[i].BOLDProcessID]
                                        rows[i].concentration = [rows[i].concentration]
                                        rows[i].concentrationUnit = [rows[i].concentrationUnit]
                                        rows[i].associatedMedia = [rows[i].associatedMedia]
                                        existingRow = rows[i]
                                    } else { // second or higher number of items (or of same item) for one organism
                                            if (rows[i].associatedMedia) {
                                                if (!existingRow.associatedMedia.includes(rows[i].associatedMedia) ) {
                                                    existingRow.associatedMedia.push(rows[i].associatedMedia)
                                                }    
                                            }

                                        // is this next line a new item 
                                        if (!existingRow.fullCatalogNumber.includes(rows[i].fullCatalogNumber)) {
                                            // this row is an actual new item
                                            existingRow.fullCatalogNumber.push(rows[i].fullCatalogNumber)
                                            existingRow.preservationType.push(rows[i].preservationType)
                                            if (!rows[i].preparationType) { rows[i].preparationType = rows[i].coremaBasisOfRecord }
                                            existingRow.preparationType.push(rows[i].preparationType)
                                            existingRow.preparationMaterials.push(rows[i].preparationMaterials)
                                            existingRow.preparedBy.push(rows[i].preparedBy)
                                            existingRow.preparationDate.push(rows[i].preparationDate)
                                            existingRow.materialSampleType.push(rows[i].materialSampleType)
                                            existingRow.concentration.push(rows[i].concentration)
                                            existingRow.concentrationUnit.push(rows[i].concentrationUnit)
                                            existingRow.geneticAccessionNumber.push(rows[i].geneticAccessionNumber)
                                            existingRow.BOLDProcessID.push(rows[i].BOLDProcessID)
                                        } else { // same item as prev. row. always?
                                            if (!Array.isArray(existingRow.geneticAccessionNumber[existingRow.geneticAccessionNumber.length-1])) { // turn genAccNo for this item into array, and add genAccno
                                                existingRow.geneticAccessionNumber[existingRow.geneticAccessionNumber.length-1] = [existingRow.geneticAccessionNumber[existingRow.geneticAccessionNumber.length-1]]
                                                existingRow.geneticAccessionNumber[existingRow.geneticAccessionNumber.length-1].push(rows[i].geneticAccessionNumber)
                                            } else {
                                                existingRow.geneticAccessionNumber[existingRow.geneticAccessionNumber.length-1].push(rows[i].geneticAccessionNumber)
                                            }
                                            if (!Array.isArray(existingRow.BOLDProcessID[existingRow.BOLDProcessID.length-1])) { // turn genAccNo for this item into array, and add genAccno
                                                existingRow.BOLDProcessID[existingRow.BOLDProcessID.length-1] = [existingRow.BOLDProcessID[existingRow.BOLDProcessID.length-1]]
                                                existingRow.BOLDProcessID[existingRow.BOLDProcessID.length-1].push(rows[i].BOLDProcessID)
                                            } else {
                                                existingRow.BOLDProcessID[existingRow.BOLDProcessID.length-1].push(rows[i].BOLDProcessID)
                                            }
                                        }
                                        
                                    }
                                } else { // next line is not the same organism
                                    if (existingRow != 'nothing') { // previous line(s) are items of same organism as this, and this is the last item
                                        
                                        if (rows[i].associatedMedia) {
                                            if (!existingRow.associatedMedia.includes(rows[i].associatedMedia) ) {
                                                existingRow.associatedMedia.push(rows[i].associatedMedia)
                                            }    
                                        }
                                        // it is actually a new item
                                        if (!existingRow.fullCatalogNumber.includes(rows[i].fullCatalogNumber)) {
                                            existingRow.fullCatalogNumber.push(rows[i].fullCatalogNumber)
                                            existingRow.preservationType.push(rows[i].preservationType)
                                            if (!rows[i].preparationType) { rows[i].preparationType = rows[i].coremaBasisOfRecord }
                                            existingRow.preparationType.push(rows[i].preparationType)
                                            existingRow.preparationMaterials.push(rows[i].preparationMaterials)
                                            existingRow.preparedBy.push(rows[i].preparedBy)
                                            existingRow.preparationDate.push(rows[i].preparationDate)
                                            existingRow.materialSampleType.push(rows[i].materialSampleType)
                                            existingRow.concentration.push(rows[i].concentration)
                                            existingRow.concentrationUnit.push(rows[i].concentrationUnit)
                                            existingRow.geneticAccessionNumber.push(rows[i].geneticAccessionNumber)
                                            existingRow.BOLDProcessID.push(rows[i].BOLDProcessID)
                                        } else { // same item as prev. row. always?
                                            if (!Array.isArray(existingRow.geneticAccessionNumber[existingRow.geneticAccessionNumber.length-1])) { // turn genAccNo for this item into array, and add genAccno
                                                existingRow.geneticAccessionNumber[existingRow.geneticAccessionNumber.length-1] = [existingRow.geneticAccessionNumber[existingRow.geneticAccessionNumber.length-1]]
                                                existingRow.geneticAccessionNumber[existingRow.geneticAccessionNumber.length-1].push(rows[i].geneticAccessionNumber)
                                            } else {
                                                existingRow.geneticAccessionNumber[existingRow.geneticAccessionNumber.length-1].push(rows[i].geneticAccessionNumber)
                                            }
                                            if (!Array.isArray(existingRow.BOLDProcessID[existingRow.BOLDProcessID.length-1])) { // turn genAccNo for this item into array, and add genAccno
                                                existingRow.BOLDProcessID[existingRow.BOLDProcessID.length-1] = [existingRow.BOLDProcessID[existingRow.BOLDProcessID.length-1]]
                                                existingRow.BOLDProcessID[existingRow.BOLDProcessID.length-1].push(rows[i].BOLDProcessID)
                                            } else {
                                                existingRow.BOLDProcessID[existingRow.BOLDProcessID.length-1].push(rows[i].BOLDProcessID)
                                            }
                                        }
                                        existingRow.fullCatalogNumber = existingRow.fullCatalogNumber.join(' | ')
                                        existingRow.preservationType = existingRow.preservationType.join(' | ')
                                        existingRow.preparationType = existingRow.preparationType.join(' | ')
                                        existingRow.preparationMaterials = existingRow.preparationMaterials.join(' | ')
                                        existingRow.preparedBy = existingRow.preparedBy.join(' | ')
                                        existingRow.preparationDate = existingRow.preparationDate.join(' | ')
                                        existingRow.materialSampleType = existingRow.materialSampleType.join(' | ')
                                        existingRow.geneticAccessionNumber = existingRow.geneticAccessionNumber.join(' | ')
                                        existingRow.BOLDProcessID = existingRow.BOLDProcessID.join(' | ')
                                        existingRow.concentration = existingRow.concentration.join(' | ')
                                        existingRow.concentrationUnit = existingRow.concentrationUnit.join(' | ')
                                        existingRow.associatedMedia = existingRow.associatedMedia.join(' | ')
                                        processedRows.push(existingRow)
                                        existingRow = 'nothing'
                                    } else { // what is this?
                                        if (!rows[i].preparationType) { rows[i].preparationType = rows[i].coremaBasisOfRecord }
                                        processedRows.push(rows[i])
                                    }
                                }
                            }
                        }
                        let newResults = papa.unparse(processedRows, {
                            delimiter: "\t",
                        })
                        // console.log('her kommer newresults: ' + newResults)
                        outfile = outfilePath + outfile
                        // console.log('her kommer outfile: ' + outfile)
                        fs.writeFileSync(outfile, newResults)


                    })

                db.close((err) => {
                    if (err) {
                        console.log(err.message)
                    }
                    // console.log('Close the database connection')
                    resolve('success')
                })
            })
        } catch (error) {
            console.log(chalk.red(error))
            reject(new Error(error))
            
        }
    })
    
    // })
}



// main-function that opens db, query database, stitch data, and writes to file for collections that have data in both musit and corema
// in: collection (string, name of collection)
//     musitFile (string, name of musit-dump-file)
//     coremaFolder (string, name of folder with corema dwc-archive files for that collection)
//     outfile (string, name of final stitched file)
//     basedOn (string, either 'corema' or 'musit', deciding which select (musit data or corema-with-musit-data) to choose)
//     update (string, either 'update' to update db-tables with only new and changed posts,
//             or 'empty_fill' to empty tabels and fill from scratch)
// out: outfile (the final stitched file)
// await runMusitCoremaStitch('fungi','fungus_lichens_o', 'O-DFL', 'dna_fungi_lichens_stitched.txt','corema', update)

async function runMusitCoremaStitch(collection, musitFile, coremaFolder, outfile, basedOn, update) {
    // remove double quotes and part of haeder containing ":" in musit-dumpfile, changes encoding to utf8 (from possibly utf-8-bom)
    // let musitFile2 = 
    await changeEncoding(path.join(pathToMusitDumps, musitFile, `${musitFile}.txt`))
    let dbSelect
    let dbSelect2
    let dbSelect3
    let dbSelect4
    if (basedOn === 'corema') {
        dbSelect = coremaSelectWithMusit 
    } else if (collection === 'vascular' || collection === "entomology") {
        dbSelect = dbSelectFunction('0','250001')
        dbSelect2 = dbSelectFunction('250000','500001')
        dbSelect3 = dbSelectFunction('500000','1000001')
        dbSelect4 = dbSelectFunction('1000000','3000000')
    } else { 
        dbSelect = musitSelect 
    }
    // to choose different stitchfunction when corema-fungi-and-lichens shall have musit-fungi and musit-lichen data attached
    let double
    if (musitFile.includes("fung") && basedOn === "corema") { double = "yes" } else { double = "no" }

    if (double === "yes") {
        console.log('her skal makeMyc funksjon starte');

        let fungus2 = await changeEncoding(path.join(pathToMusitDumps, 'fungus_o', 'fungus_o.txt'))
        let lichen2 = await changeEncoding(path.join(pathToMusitDumps, 'lichens_o', 'lichens_o.txt'))
        console.log('fungus2: ' + fungus2);
        await makeNewMycFile(fungus2, lichen2)
    }
    let dataBaseFile = `${pathToDatabases}${collection}.db`
    db = await createDatabase(dataBaseFile, "musit", musitFile, collection)

    let fileSuffix = ''
    // make new dumpfiles with only records that have been changed since last time
    if (update === 'update') {      
        await makeFileOnlyNew(db, musitFile, musitFile, 'musit')
        await makeFileOnlyNew(db, 'simpledwc', coremaFolder, 'corema')
        await makeOtherFileOnlyNew('amplification', coremaFolder)
        await makeOtherFileOnlyNew('materialsample', coremaFolder)
        await makeOtherFileOnlyNew('multimedia', coremaFolder)
        await makeOtherFileOnlyNew('permit', coremaFolder)
        await makeOtherFileOnlyNew('preparation', coremaFolder)
        await makeOtherFileOnlyNew('preservation', coremaFolder)
        await makeOtherFileOnlyNew('resourcerelationship', coremaFolder)
        fileSuffix = '_new'

    }    
    await changeEncoding(path.join(pathToMusitDumps, musitFile, `${musitFile}${fileSuffix}.txt`));
    await changeEncoding(path.join(pathToCoremaDumpsForPortal, coremaFolder, `amplification${fileSuffix}.txt`));
    await changeEncoding(path.join(pathToCoremaDumpsForPortal, coremaFolder, `materialsample${fileSuffix}.txt`));
    await changeEncoding(path.join(pathToCoremaDumpsForPortal, coremaFolder, `multimedia${fileSuffix}.txt`));
    await changeEncoding(path.join(pathToCoremaDumpsForPortal, coremaFolder, `permit${fileSuffix}.txt`));
    await changeEncoding(path.join(pathToCoremaDumpsForPortal, coremaFolder, `preparation${fileSuffix}.txt`));
    await changeEncoding(path.join(pathToCoremaDumpsForPortal, coremaFolder, `preservation${fileSuffix}.txt`));
    await changeEncoding(path.join(pathToCoremaDumpsForPortal, coremaFolder, `resourcerelationship${fileSuffix}.txt`));
    await changeEncoding(path.join(pathToCoremaDumpsForPortal, coremaFolder, `simpledwc${fileSuffix}.txt`));
    
    // console.log('sqliteCode_functions linje  1298')
    // delete data from tables in a sqlite-database (one per organismgroup)
    if (update === 'empty_fill') {
        await deleteFromTable (db, musitFile)
        await deleteFromTable (db, 'amplification')
        await deleteFromTable (db, 'materialsample')
        await deleteFromTable (db, 'multimedia')
        await deleteFromTable (db, 'permit')
        await deleteFromTable (db, 'preparation')
        await deleteFromTable (db, 'preservation')
        await deleteFromTable (db, 'resourcerelationship')
        await deleteFromTable (db, 'simpledwc')
    }
    
        // fill or update tables from musit- and coremadumpfiles
    await fillTable(db, `${musitFile}`, path.join(pathToMusitDumps, musitFile, `${musitFile}${fileSuffix}2.txt`), update);
    await fillTable(db, 'amplification', path.join(pathToCoremaDumpsForPortal, coremaFolder, `amplification${fileSuffix}2.txt`), update);
    await fillTable(db, 'materialsample', path.join(pathToCoremaDumpsForPortal, coremaFolder, `materialsample${fileSuffix}2.txt`), update);
    await fillTable(db, 'multimedia', path.join(pathToCoremaDumpsForPortal, coremaFolder, `multimedia${fileSuffix}2.txt`), update);
    await fillTable(db, 'permit', path.join(pathToCoremaDumpsForPortal, coremaFolder, `permit${fileSuffix}2.txt`), update);
    await fillTable(db, 'preparation', path.join(pathToCoremaDumpsForPortal, coremaFolder, `preparation${fileSuffix}2.txt`), update);
    await fillTable(db, 'preservation', path.join(pathToCoremaDumpsForPortal, coremaFolder, `preservation${fileSuffix}2.txt`), update);
    await fillTable(db, 'resourcerelationship', path.join(pathToCoremaDumpsForPortal, coremaFolder, `resourcerelationship${fileSuffix}2.txt`), update);
    await fillTable(db, 'simpledwc', path.join(pathToCoremaDumpsForPortal, coremaFolder, `simpledwc${fileSuffix}2.txt`), update);
    

    let samling
    let prefix
    let length
    let deleteStatement
    let updateStatement

    if (double === "no") {
        samling = fileList.find(el => el.zipFileName === musitFile)
        prefix = samling.urn
        length = prefix.length
        deleteStatement = `DELETE FROM resourcerelationship
        WHERE SUBSTR (relatedResourceID,13,${length}) != '${prefix}';`
        updateStatement = `UPDATE resourcerelationship SET cleanCatalogNumberRecRel = SUBSTR(relatedResourceID,14+${length})`
    } else if (double === "yes") {
        deleteStatement = `DELETE FROM resourcerelationship
        WHERE (SUBSTR (relatedResourceID,13,3) != 'O:F') AND (SUBSTR (relatedResourceID,13,3) != 'O:L')`
        updateStatement = `UPDATE resourcerelationship SET cleanCatalogNumberRecRel = SUBSTR(relatedResourceID,13)`
    }

    const start = coremaFolder.length + 2
    outfile = outfilePath + outfile


    return new Promise(function (resolve, reject) { // if we use promise, we cannot use await inside
        try {
            db.serialize(() => {
                
                db.run(deleteStatement)
                .run(updateStatement)
                .run(`UPDATE simpledwc SET cleanCatalogNumber = SUBSTR(catalogNumber,${start},LENGTH(catalogNumber)-${start}-3)`)
                .run(`DROP VIEW IF EXISTS musitRel`)
                .run(createViewMusitRel(musitFile, double))
                .run(`DROP VIEW IF EXISTS coremaFields`)
                // create view with all corema-fields in one table
                .run(createViewCoremaFields())

                db.all(dbSelect, (err, rows) => {
                    if (err) {
                        console.log('error')
                        console.error(err.message)
                    }
                    processedRows = itemToArraysOnSameLine(rows, basedOn)
                    rows.length = 0
                    console.log('after putting items into arrays: ' + processedRows.length)
                    removeCoremaDuplicates(processedRows)
                    // console.log('after removing corema-duplicates of musitentries: ' + processedRows.length)
                
                    
                    let fieldNames = Object.keys(processedRows[0]) //new
                    fs.writeFileSync(outfile, fieldNames.join('\t'))
                    fs.appendFileSync(outfile,"\n")
                    
                    let csvtxt = processedRows.map(mapElementToColumns(fieldNames))
                    let logger = fs.createWriteStream(outfile, {
                        flags: 'a' // means append
                    })
                    for (let i = 0; i<csvtxt.length; i++) {
                        logger.write(csvtxt[i].replace(/"/g,""))
                        logger.write("\n")
                    }
                })
                if (dbSelect2) {
                    db.all(dbSelect2, (err, rows) => {
                        if (err) {
                            console.error(err.message)
                        }
                        // console.log('length rows round 2 ' + rows.length)
                        processedRows = itemToArraysOnSameLine(rows, basedOn)
                        rows.length = 0
                        // console.log('after putting items into arrays: ' + processedRows.length)
                        removeCoremaDuplicates(processedRows)
                        console.log('length after remove coremaduplicates ' + processedRows.length)
                        let fieldNames = Object.keys(processedRows[0]) //new
                        
                    let csvtxt = processedRows.map(mapElementToColumns(fieldNames))
                        array_to_file(outfile,csvtxt)
                    })
                    db.all(dbSelect3, (err, rows) => {
                        if (err) {
                            
                            console.error(chalk.red(err.message))
                        }
                        // console.log('length rows round 3 ' + rows.length)
                        processedRows = itemToArraysOnSameLine(rows, basedOn)
                        rows.length = 0
                        // console.log('after putting items into arrays: ' + processedRows.length)
                        removeCoremaDuplicates(processedRows)
                        
                        // console.log('length after remove coremaduplicates ' + processedRows.length)
                        if (processedRows[0]) {
                            let fieldNames = Object.keys(processedRows[0]) //new
                        
                            let csvtxt = processedRows.map(mapElementToColumns(fieldNames))
                            array_to_file(outfile,csvtxt)
                        }
                        
                    })
                    db.all(dbSelect4, (err, rows) => {
                        if (err) {
                            console.error(chalk.red(err.message))
                        }
                        // console.log('length rows round 4 ' + rows.length)
                        processedRows = itemToArraysOnSameLine(rows, basedOn)
                        rows.length = 0
                        // console.log('length after item to arrays on same line ' + processedRows.length)
                        removeCoremaDuplicates(processedRows)
                        // console.log('length after remove coremaduplicates ' + processedRows.length)
                        if (processedRows[0]) {
                            let fieldNames = Object.keys(processedRows[0]) //new
                            let csvtxt = processedRows.map(mapElementToColumns(fieldNames))
                            array_to_file(outfile,csvtxt)
                        }
                    })
                }
                
            })

            db.close((err) => {
                if (err) {
                    console.log(chalk.red('Error in db.close: ') + err.message)
                }
                // console.log('Close the database connection')
                resolve('success')
            })
        } catch (error) {
            console.log(chalk.red('Error in db.serialize: ') + error)
            reject(new Error(error))
            
        }
    })
}


async function mainSQLiteFunction(update) {

    const coremaTasks = [
        // ['birds', 'no_file', 'NHMO-BI', 'birds_stitched.txt'],
        // ['mammals', 'no_file', 'NHMO-DMA', 'mammals_stitched.txt'],
        // ['fish_herptiles', 'no_file', 'NHMO-DFH', 'dna_fish_herptiles_stitched.txt'],
        // ['DNA_other', 'no_file', 'NHMO-DOT', 'dna_other_stitched.txt'],
        // ['invertebrates_with_dna', 'no_file', 'NHMO-IN', 'invertebrates_with_dna_stitched.txt'],
       
    ];

    // first 4 from from musit's point of view; all musits data, add from corema
    // last 3 from coremas point of fiew; all corema data, add from musit    
    const musitTasks = [

        // ['fungi', 'fungus_o', 'O-DFL', 'sopp_stitched.txt','musit'],
        // ['lichens', 'lichens_o', 'O-DFL', 'lav_stitched.txt','musit'],
        // ['vascular', 'vascular_o', 'O-DP', 'vascular_stitched.txt','musit'],
        // ['entomology', 'entomology_nhmo', 'NHMO-DAR', 'entomology_stitched.txt','musit'],
        ['fungi', 'fungus_lichens_o', 'O-DFL', 'dna_fungi_lichens_stitched.txt','corema'],
        // ['vascular', 'vascular_o', 'O-DP', 'dna_vascular_stitched.txt','corema'],
        // ['entomology', 'entomology_nhmo', 'NHMO-DAR', 'dna_entomology_stitched.txt','corema'],
    ];

    try {
        for (const task of coremaTasks) {
            console.log(`Starting runCoremaStitch ${chalk.blue(task[0])}`);
            await runCoremaStitch(...task, update);
            console.log(`runCoremaStitch ${chalk.green(task[0])} completed`);

        }

        for (const task of musitTasks) {
            console.log(`Starting runMusitCoremaStitch ${chalk.blue(task[0])}`);
            await runMusitCoremaStitch(...task, update);
            console.log(`runMusitCoremaStitch ${chalk.green(task[0])} completed`);
        }

        console.log('All tasks completed');
    } catch (error) {
        console.error(chalk.red(`An error occurred in mainSQLiteFunction(): ${error.message}`));
    }
}



// async function mainSQLiteFunction(update) {
    
//     await runCoremaStitch('birds', 'no_file', 'NHMO-BI','birds_stitched.txt', update)
//     await runCoremaStitch('mammals','no_file', 'NHMO-DMA','mammals_stitched.txt', update)
//     await runCoremaStitch('fish_herptiles','no_file', 'NHMO-DFH','dna_fish_herptiles_stitched.txt', update)
//     await runCoremaStitch('DNA_other','no_file', 'NHMO-DOT','dna_other_stitched.txt', update)
//     await runCoremaStitch('invertebrates_with_dna','no_file', 'NHMO-IN','invertebrates_with_dna_stitched.txt', update)

//     ///// from musit's point of view; all musits data, add from corema    
//     await runMusitCoremaStitch('fungi','fungus_o', 'O-DFL', 'sopp_stitched.txt','musit',update)
//     await runMusitCoremaStitch('lichens', 'lichens_o', 'O-DFL', 'lav_stitched.txt', 'musit',update)
//     await runMusitCoremaStitch('vascular','vascular_o', 'O-DP', 'vascular_stitched.txt','musit',update)
//     await runMusitCoremaStitch('entomology', 'entomology_nhmo', 'NHMO-DAR', 'entomology_stitched.txt', 'musit',update)

//     // // ///// from coremas point of fiew; all corema data, add from musit    
//     await runMusitCoremaStitch('fungi','fungus_lichens_o', 'O-DFL', 'dna_fungi_lichens_stitched.txt','corema', update)
//     await runMusitCoremaStitch('vascular','vascular_o', 'O-DP', 'dna_vascular_stitched.txt','corema', update)
//     await runMusitCoremaStitch('entomology','entomology_nhmo', 'NHMO-DAR', 'dna_entomology_stitched.txt','corema', update)
//     resolve('success')
// }

let update = ''
update = 'update'
// update = 'empty_fill'
mainSQLiteFunction(update)

module.exports = {
    mainSQLiteFunction
}