// script stitches data from musit- and coremadumpfiles together, both by adding coremadata to musitfile, 
// and adding musitdata to coremafile

// 0. Create databases if they do not exist
// 1. delete data from tables in a sqlite-database (one per organismgroup), and fill tables again from musit- and coremadumpfiles
// only musit-collections:
// 2. create view combining musit-table and relatedresourceID in corema, to be able to match between them
// 3. create view combining all corema-tables
// corema- and musitcollections: 
// 4. select data from tables or views, from corema or both databases, give new column-names if desirable

// do some more stitcing, write data to file
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const papa = require('papaparse')
const fileList = require('./../../NHM-portaler/src/utils/fileListNhm')
const csvParser = require('csv-parser')
const { join, resolve } = require('path')
const { Console } = require('console')
const { on } = require('events')

              
const pathToCoremaDumps = './../../coremaDumper/'
const pathToMusitDumps = './../../musitDumps/'
const pathToDatabases = './../../sqliteDatabases/'
const outfilePath = '../../NHM-portaler/src/data/nhm/'
// const outfilePath = '../../src/data/nhm/'

// 0. Create databases if they do not exist
// function createDatabase(file,source,mainTable,collection){
    async function createDatabase(file,source,mainTable,collection){
    //  return new Promise (function(resolve, reject) {
        // try {
            
            
            if(!fs.existsSync(file)){
                db = new sqlite3.Database(file) // lichens
                fs.openSync(file, "w");
                if (source === "musit") {
                    db.serialize(function() {
                        db.run("CREATE TABLE amplification ( coreid TEXT, geneticAccessionURI TEXT, geneticAccessionNumber TEXT, BOLDProcessID TEXT)")
                        .run("CREATE TABLE materialsample ( coreid TEXT, materialSampleType TEXT, concentration TEXT, concentrationUnit TEXT )")
                        .run("CREATE TABLE multimedia ( coreid TEXT, type TEXT, format TEXT, identifier TEXT, title TEXT, created TEXT, creator TEXT, source TEXT, license TEXT )")
                        .run("CREATE TABLE permit ( coreid TEXT, permitType TEXT, permitStatus TEXT, permitStatusQualifier TEXT, permitText TEXT )")
                        .run("CREATE TABLE preparation ( coreid TEXT, preparationType TEXT, preparationMaterials TEXT, preparedBy TEXT, preparationDate TEXT )")
                        .run("CREATE TABLE preservation ( coreid TEXT, preservationType TEXT )")
                        .run("CREATE TABLE resourcerelationship ( coreid TEXT, relatedResourceID TEXT, relationshipOfResource TEXT, relationshipAccordingTo TEXT, relationshipEstablishedDate TEXT, relationshipRemarks TEXT , cleanCatalogNumberRecRel INTEGER, relCollectionCode TEXT)")
                        .run("CREATE TABLE simpledwc ( id TEXT, type TEXT, modified TEXT, rightsHolder TEXT, accessRights TEXT, collectionID TEXT, datasetID TEXT, institutionCode TEXT, collectionCode TEXT, ownerInstitutionCode TEXT, basisOfRecord TEXT, informationWithheld TEXT, occurrenceID TEXT, catalogNumber TEXT, recordNumber TEXT, recordedBy TEXT, sex TEXT, lifeStage TEXT, preparations TEXT, disposition TEXT, associatedMedia TEXT, organismID TEXT, materialSampleID TEXT, eventDate TEXT, country TEXT, stateProvince TEXT, county TEXT, locality TEXT, minimumElevationInMeters TEXT, decimalLatitude TEXT, decimalLongitude TEXT, identificationQualifier TEXT, identifiedBy TEXT, dateIdentified TEXT, scientificName TEXT, 'order' TEXT, family TEXT, genus TEXT, specificEpithet TEXT, infraspecificEpithet TEXT, taxonRank TEXT, scientificNameAuthorship TEXT, typeStatus TEXT , cleanCatalogNumber INTEGER)")
                        .run(`CREATE TABLE ${mainTable} ( modified TEXT, institutionCode TEXT, collectionCode TEXT, basisOfRecord TEXT, catalogNumber TEXT, scientificName TEXT, scientificNameAuthorship TEXT, kingdom TEXT, phylum TEXT, class TEXT, 'order' TEXT, family TEXT, genus TEXT, specificEpithet TEXT, infraspecificEpithet TEXT, identifiedBy TEXT, dateIdentified TEXT, typeStatus TEXT, recordNumber TEXT, fieldNumber TEXT, recordedBy TEXT, eventDate TEXT, continent TEXT, country TEXT, stateProvince TEXT, county TEXT, locality TEXT, decimalLongitude TEXT, decimalLatitude TEXT, coordinateUncertaintyInMeters TEXT, verbatimElevation TEXT, verbatimDepth TEXT, sex TEXT, lifeStage TEXT, preparations TEXT, individualCount TEXT, otherCatalogNumbers TEXT, occurrenceRemarks TEXT, samplingProtocol TEXT, identificationRemarks TEXT, habitat TEXT, associatedTaxa TEXT, georeferenceRemarks TEXT, verbatimCoordinates TEXT, verbatimSRS TEXT, associatedMedia TEXT, CreativeCommonsLicense TEXT, ArtObsID TEXT, occurrenceID TEXT, UTMsone TEXT, UTMX TEXT, UTMY TEXT, datasetName TEXT, createdDate TEXT, bioGeoRegion TEXT, recordedById TEXT, identifiedById TEXT , cleanCatalogNumber INTEGER)`)
                    })
                } else if (source === "corema") {
                    db.serialize(function() {
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
                // resolve(db)
            } else if ( mainTable === "fungus_o" || mainTable === "fungus_lichens_o" || mainTable === "lichens_o") {
                db = new sqlite3.Database(file)
                db.run(`CREATE TABLE IF NOT EXISTS ${mainTable} ( modified TEXT, institutionCode TEXT, collectionCode TEXT, basisOfRecord TEXT, catalogNumber TEXT, scientificName TEXT, scientificNameAuthorship TEXT, kingdom TEXT, phylum TEXT, class TEXT, 'order' TEXT, family TEXT, genus TEXT, specificEpithet TEXT, infraspecificEpithet TEXT, identifiedBy TEXT, dateIdentified TEXT, typeStatus TEXT, recordNumber TEXT, fieldNumber TEXT, recordedBy TEXT, eventDate TEXT, continent TEXT, country TEXT, stateProvince TEXT, county TEXT, locality TEXT, decimalLongitude TEXT, decimalLatitude TEXT, coordinateUncertaintyInMeters TEXT, verbatimElevation TEXT, verbatimDepth TEXT, sex TEXT, lifeStage TEXT, preparations TEXT, individualCount TEXT, otherCatalogNumbers TEXT, occurrenceRemarks TEXT, samplingProtocol TEXT, identificationRemarks TEXT, habitat TEXT, associatedTaxa TEXT, georeferenceRemarks TEXT, verbatimCoordinates TEXT, verbatimSRS TEXT, associatedMedia TEXT, CreativeCommonsLicense TEXT, ArtObsID TEXT, occurrenceID TEXT, UTMsone TEXT, UTMX TEXT, UTMY TEXT, datasetName TEXT, createdDate TEXT, bioGeoRegion TEXT, recordedById TEXT, identifiedById TEXT , cleanCatalogNumber INTEGER)`)
                return db
                // resolve(db)
            
            } else {
                console.log('db exist already')
                db = new sqlite3.Database(file)
                // db = new sqlite3.Database(file, sqlite3.OPEN_READWRITE, (err) => {
                //     if (err) {
                //         console.log('error')
                //         console.error(err.message)
                //         // reject(new Error(error))
                //     } else {
                //         
                //         // return db
                //     }
                // })
                
                // db = openDB(file, collection)
                console.log(`Connected to the ${collection} database`)
                // db = await openDB(file, collection)
                return db
                // resolve(db)
                
            }
            
            
            // db.close()

        // } catch (error) {
            // reject(new Error(error))
            // console.log(error)
        // }                 
    // })
    

}


// 2. create view combining musit-table and relatedresourceID in corema, to be able to match between them
// create sqlite-view to combine musitdata and id from corema so that connection can be made between corema and musit
const createViewMusitRel = (musitFile,double) => { 
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
                ${musitFile}.identificationRemarks,
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
        relatedResourceID,
        resourcerelationship.coreid
        
        FROM ${musitFile}
        LEFT JOIN resourcerelationship on ${joinClause}`)
}

// 3. create view combining all corema-tables
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
    simpledwc.identificationQualifier AS identificationRemarks,
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
    resourcerelationship.relatedResourceID

    FROM simpledwc
    LEFT JOIN preservation on simpledwc.occurrenceID = preservation.coreid
    LEFT JOIN preparation on simpledwc.occurrenceID = preparation.coreid
    LEFT JOIN amplification on simpledwc.occurrenceID = amplification.coreid
    LEFT JOIN materialsample on simpledwc.occurrenceID = materialsample.coreid
    LEFT JOIN resourcerelationship on simpledwc.occurrenceID = resourcerelationship.coreid
    `
    // if (double === "no") {return viewCoremaFields}
    // else {
        return viewCoremaFields 
    // }
}
// 4. select data from tables or views, from corema or both databases, give new column-names if desirable
// sqlite-select musitdata adding coremadata
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
musitRel.identificationRemarks,
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
coremaFields.itemID, organismID, coremaFields.fullCatalogNumber AS RelCatNo, coremaFields.catalogNumber AS RelCleanCatNo, rightsHolder, coremaFields.basisOfRecord AS coremaBasisOfRecord, informationWithheld, coremaFields.preparations, coremaFields.materialSampleType,

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
coremaFields.identificationRemarks AS coremaIdentificationRemarks,
coremaFields.typeStatus AS coremaTypeStatus,
coremaFields.identifiedBy AS coremaIdentifiedBy,
coremaFields.dateIdentified AS coremaDateIdentified,
coremaFields.scientificName AS coremaScientificName,
coremaFields.genus AS coremaGenus,
coremaFields.specificEpithet AS coremaSpecificEpithet

FROM musitRel
LEFT JOIN coremaFields ON musitRel.coreid = coremaFields.itemID

ORDER BY organismID ASC`

// 4. select data from tables or views, from corema or both databases, give new column-names if desirable
// sqlite-select coremadata adding musitdata
const coremaSelectWithMusit = `SELECT 
coremaFields.itemID, coremaFields.organismID, coremaFields.institutionCode, coremaFields.collectionCode, coremaFields.fullCatalogNumber, coremaFields.catalogNumber, coremaFields.rightsHolder, coremaFields.informationWithheld, coremaFields.basisOfRecord,
coremaFields.recordedBy, coremaFields.preparations,  coremaFields.eventDate, 
coremaFields.country, coremaFields.stateProvince, coremaFields.county, coremaFields.locality, 
coremaFields.decimalLatitude, coremaFields.decimalLongitude, coremaFields.identificationRemarks, coremaFields.typeStatus,
coremaFields.identifiedBy,coremaFields.dateIdentified, coremaFields.scientificName, coremaFields."order", coremaFields.family, coremaFields.genus, coremaFields.specificEpithet,
coremaFields.infraspecificEpithet, coremaFields.scientificNameAuthorship,
coremaFields.preservationType,
coremaFields.preparationType, coremaFields.preparationMaterials, coremaFields.preparedBy, preparationDate,
geneticAccessionNumber, BOLDProcessID,
materialSampleType,concentration, concentrationUnit,

coremaFields.relatedResourceID,

musitRel.basisOfRecord AS musitBasisOfRecord,
musitRel.collectionCode AS musitCollectionCode,
musitRel.catalogNumber AS RelCatNo

FROM coremaFields
LEFT JOIN musitRel ON coremaFields.itemID = musitRel.coreid
ORDER BY organismID ASC`

// sqlite-seelct coremadata where there no musitdata
const coremaSelect = `SELECT 
simpledwc.occurrenceID as itemID, organismID, materialSampleID, institutionCode, collectionCode, catalogNumber AS fullCatalogNumber, cleanCatalogNumber AS catalogNumber, rightsHolder, basisOfRecord AS coremaBasisOfRecord, informationWithheld, recordedBy, sex, lifeStage, preparations, disposition, eventDate, country, stateProvince,
    county, locality, minimumElevationInMeters, decimalLatitude, decimalLongitude, identificationQualifier as identificationRemarks, identifiedBy, dateIdentified, typeStatus, scientificName, "order", family, genus, specificEpithet, infraspecificEpithet, taxonRank, scientificNameAuthorship,
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
    LEFT JOIN multimedia on multimedia.coreid = simpledwc.occurrenceID
    ORDER BY organismID ASC`


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
                            return console.error(err.message)
                        }
                    } else {
                        console.log(`Row(s) deleted ${this.changes} in ${tableName}`)
                        resolve('success')
                    }
                })
        } catch (error) {
            reject(new Error(error))
            console.log(error)
        }
    })
}

// concatenate fungus- and lichen-musit-dumpfiles to stitch musit data to fungi-lichen-corema-data
async function makeNewMycFile () {
    if (fs.existsSync(`${pathToMusitDumps}fungus_lichens_o/fungus_lichens_o.txt`)) { fs.unlinkSync(`${pathToMusitDumps}fungus_lichens_o/fungus_lichens_o.txt`) }    
    const fungusFile = fs.readFileSync(`${pathToMusitDumps}fungus_o/fungus_o.txt`)
    fs.writeFileSync(`${pathToMusitDumps}fungus_lichens_o/fungus_lichens_o.txt`, fungusFile, function (err) {
        if (err) return console.log(err)
    })
    const lichenFile = fs.readFileSync(`${pathToMusitDumps}lichens_o/lichens_o.txt`)
    fs.appendFileSync(`${pathToMusitDumps}fungus_lichens_o/fungus_lichens_o.txt`,lichenFile, function (err) {
        if (err) return console.log(err)
        resolve('success')
    })
}

// finds latest time of change in record in table
// reads dumpfile, singels out records with newer modified-times and puts them into new file
// to be used in appendTable
async function makeFileOnlyNew (db, tableName, dumpFolder, source) {
    return new Promise (function(resolve, reject) {
        let pathToFolder 
        if (source === "corema") {pathToFolder = pathToCoremaDumps}
        else if (source === "musit") {pathToFolder = pathToMusitDumps}
        // let dataBaseFile = `${pathToDatabases}${collection}.db`
        // const dbPromise = createDatabase(dataBaseFile, "corema", coremaFile, collection)
        // dbPromise.then(function(db) {
            // db.serialize(() => { // måtta ha med denne på coremastitch - men ikke på musitstitch?
                db.all(`SELECT MAX(modified) AS date FROM ${tableName}`, (err, latestModified) => {
                    if (err) {console.log(err.message)}
                    let newFileRows = []
                    fs.createReadStream(`${pathToFolder}${dumpFolder}/${tableName}.txt`)
                    .pipe(csvParser({"separator":"\t"}))
                    .on('data', (row) => {
                        if (latestModified[0].date < row.modified) {
                            newFileRows.push(row)
                        }
                    }).on('end', () => {
                        let newFileResult = papa.unparse(newFileRows, {
                            delimiter: "\t",
                        })
                        let outfilePathLocal
                        if (source === 'corema') {outfilePathLocal = `../../coremaDumper/${dumpFolder}/`}
                        else {outfilePathLocal = `../../musitDumps/${dumpFolder}/`}
                        const outfile = outfilePathLocal + `${tableName}_new.txt`
                        fs.writeFileSync(outfile, newFileResult)
                        resolve('success')
                    })
                    
                })
            // })
        // })
      
    })    
}

async function makeOtherFileOnlyNew (tableName, coremaFolder) {
    return new Promise (function(resolve, reject) {
        // les simpledwc_new-fila, samle inn occurrencIDs
        // les annen-tabell-fil, plukk ut de med disse occurrenceIDs og lag ny fil
        let newOccIDs = []
        let newOtherFileRows = []
        fs.createReadStream(`${pathToCoremaDumps}${coremaFolder}/simpledwc_new.txt`)
        .pipe(csvParser({"separator":"\t"}))
        .on('data', (row) => {
            newOccIDs.push(row.occurrenceID)
        })
        .on('end', () => {
            if (!fs.existsSync(`${pathToCoremaDumps}${coremaFolder}/${tableName}.txt`)) {
                resolve('success')
            } else {
                fs.createReadStream(`${pathToCoremaDumps}${coremaFolder}/${tableName}.txt`)
                .pipe(csvParser({"separator":"\t"}))
                .on('data', (row2) => {
                    if (newOccIDs.includes(row2.coreid)) {
                        newOtherFileRows.push(row2)
                    }
                }).on('end', () => {
                    let newOtherFileResult = papa.unparse(newOtherFileRows, {delimiter: "\t"})
                    const outfilePathLocal =`../../coremaDumper/${coremaFolder}/`
                    const outfile = outfilePathLocal + `${tableName}_new.txt`
                    fs.writeFileSync(outfile, newOtherFileResult)
                    resolve('success')
                })
            }
            
        })
       
    })    
}


// removes double quotes and part of haeder containing ":" in musit-dumpfile, changes encoding to utf8 (from possibly utf-8-bom)
// in: infile (string, name of musit-dumpfile)
async function changeEncoding (infile) {
    if (!fs.existsSync(infile)) {return}
    else {
        return new Promise (function(resolve, reject) {
            try {
                const file = fs.readFileSync(infile, 'utf8')
                data = file.replace(/^\uFEFF/, '')
                data1 = data.replace(/"/g, '')
                data2 = data1.replace(/dcterms:/, '')
                //fs.writeFileSync(infile, file, 'utf8')
                    fs.writeFileSync(infile,data2, 'utf8', function (err) {
                        if (err) return console.log(err)
                    })
                resolve('success')
                // })
            } catch (error) {
                reject(new Error(error))
            }
        })
    }
}



// fills table in database after data has been removed
// in: db (sqlite-database containing one organismgroup)
//     tableName (string, name of table to be deleted in database)
//     filename (string, name of dumpfile where data is fetched)
async function fillTable(db,tablename,filename) {
    return new Promise (function(resolve, reject) {
        try {
            if (!fs.existsSync(filename)) {
                console.log('return from filltable ' + tablename)
                resolve('success')
            } else {
                fs.createReadStream(filename)
                //csv-parser converts CSV into JSON
                .pipe(csvParser({"separator":"\t"}))
                .on('data', (row) => {
                    // headers and first line
                    // let properties = Object.getOwnPropertyNames(row)
                    // let marks = [] // tror ikke denne brukes
                    // for (i=0;i<properties.length;i++) {
                    //     marks.push('?')
                    // }
                    if (!filename.includes('corema')) {    // i.e. musitfile. if-statement only works because the corema-files lie in a folder named smth with "corema", so "corema" is in the file-path   
                        db.run(`DELETE FROM ${tablename} WHERE catalogNumber = "${row.catalogNumber}"`)
                        db.prepare( `INSERT INTO ${tablename} (modified, institutionCode, collectionCode, basisOfRecord, catalogNumber, scientificName, scientificNameAuthorship, kingdom, phylum, class, "order", family, genus, specificEpithet, identifiedBy, dateIdentified, typeStatus, recordNumber,
                        fieldNumber, recordedBy, eventDate, continent, country, stateProvince, county, locality, decimalLongitude, decimalLatitude, coordinateUncertaintyInMeters, verbatimElevation, verbatimDepth, sex, lifeStage, preparations,individualCount, otherCatalogNumbers, occurrenceRemarks, samplingProtocol, identificationRemarks,
                        habitat, associatedTaxa, georeferenceRemarks, verbatimCoordinates, verbatimSRS, associatedMedia, CreativeCommonsLicense, ArtObsID, occurrenceID, UTMsone, UTMX, UTMY, datasetName, createdDate, bioGeoRegion, recordedById, identifiedById) 
                        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
                        .run(row.modified, row.institutionCode, row.collectionCode, row.basisOfRecord, row.catalogNumber, row.scientificName, row.scientificNameAuthorship, row.kingdom, row.phylum, row.class, row.order, row.family, row.genus, row.specificEpithet, row.identifiedBy, row.dateIdentified, row.typeStatus, row.recordNumber,
                            row.fieldNumber, row.recordedBy, row.eventDate, row.continent, row.country, row.stateProvince, row.county, row.locality, row.decimalLongitude, row.decimalLatitude, row.coordinateUncertaintyInMeters, row.verbatimElevation, row.verbatimDepth, row.sex, row.lifeStage, row.preparations, row.individualCount, row.otherCatalogNumbers, row.occurrenceRemarks, row.samplingProtocol, row.identificationRemarks,
                            row.habitat, row.associatedTaxa, row.georeferenceRemarks, row.verbatimCoordinates, row.verbatimSRS, row.associatedMedia, row.CreativeCommonsLicense, row.ArtObsID, row.occurrenceID, row.UTMsone, row.UTMX, row.UTMY, row.datasetName, row.createdDate, row.bioGeoRegion, row.recordedById, row.identifiedById)
                    } else if (tablename == 'amplification') {
                        db.run(`DELETE FROM amplification WHERE coreid = "${row.coreid}"`)
                        db.prepare( `INSERT INTO amplification (coreid, geneticAccessionURI, geneticAccessionNumber, BOLDProcessID) VALUES (?,?,?,?)`).run(row.coreid, row.geneticAccessionURI, row.geneticAccessionNumber, row.BOLDProcessID)
                    } else if (tablename == 'materialsample') {
                        db.run(`DELETE FROM materialsample WHERE coreid = "${row.coreid}"`)
                        db.prepare( `INSERT INTO materialsample (coreid, materialSampleType, concentration, concentrationUnit) VALUES (?,?,?,?)`).run(row.coreid, row.materialSampleType, row.concentration, row.concentrationUnit)
                    } else if (tablename == 'multimedia') {
                        db.run(`DELETE FROM multimedia WHERE coreid = "${row.coreid}"`)
                        db.prepare( `INSERT INTO ${tablename} (coreid, type,format,identifier,title,created,creator,source,license) VALUES (?,?,?,?,?,?,?,?,?)`).run(row.coreid, row.type, row.format, row.identifier, row.title, row.created, row.creator, row.source, row.license)
                    } else if (tablename == 'permit') {
                        db.run(`DELETE FROM permit WHERE coreid = "${row.coreid}"`)
                        db.prepare( `INSERT INTO ${tablename} (coreid, permitType, permitStatus, permitStatusQualifier, permitText) VALUES (?,?,?,?,?)`).run(row.coreid, row.permitType, row.permitStatus, row.permitStatusQualifier, row.permitText)
                    } else if (tablename == 'preparation') {
                        db.run(`DELETE FROM preparation WHERE coreid = "${row.coreid}"`)
                        db.prepare( `INSERT INTO ${tablename} (coreid, preparationType, preparationMaterials, preparedBy, preparationDate) VALUES (?,?,?,?,?)`).run(row.coreid, row.preparationType, row.preparationMaterials, row.preparedBy, row.preparationDate)
                    } else if (tablename == 'preservation') {
                        db.run(`DELETE FROM preservation WHERE coreid = "${row.coreid}"`)
                        db.prepare( `INSERT INTO ${tablename} (coreid, preservationType) VALUES (?,?)`).run(row.coreid,row.preservationType)
                    } else if (tablename == 'resourcerelationship') {
                        db.run(`DELETE FROM resourcerelationship WHERE coreid = "${row.coreid}"`)
                        db.prepare( `INSERT INTO ${tablename} (coreid, relatedResourceID, relationshipOfResource, relationshipAccordingTo, relationshipEstablishedDate, relationshipRemarks) VALUES (?,?,?,?,?,?)`).run(row.coreid, row.relatedResourceID, row.relationshipOfResource, row.relationshipAccordingTo, row.relationshipEstablishedDate, row.relationshipRemarks)
                    } else if (tablename == 'simpledwc') {
                        db.run(`DELETE FROM simpledwc WHERE occurrenceID = "${row.occurrenceID}"`)
                        db.prepare( `INSERT INTO ${tablename} (type, modified, rightsHolder, accessRights, collectionID, datasetID, institutionCode, collectionCode, ownerInstitutionCode, basisOfRecord, informationWithheld, occurrenceID, catalogNumber, recordNumber, recordedBy, sex, lifeStage, preparations, disposition, associatedMedia, organismID, materialSampleID, eventDate, country, stateProvince,
                            county, locality, minimumElevationInMeters, decimalLatitude, decimalLongitude, identificationQualifier, identifiedBy, dateIdentified, scientificName, "order", family, genus, specificEpithet, infraspecificEpithet, taxonRank, scientificNameAuthorship, typeStatus) 
                            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(row.type, row.modified, row.rightsHolder, row.accessRights, row.collectionID, row.datasetID, row.institutionCode, row.collectionCode, row.ownerInstitutionCode, row.basisOfRecord, row.informationWithheld, row.occurrenceID, row.catalogNumber, row.recordNumber, row.recordedBy, row.sex, row.lifeStage, row.preparations, row.disposition, row.associatedMedia, row.organismID, row.materialSampleID, row.eventDate, row.country, row.stateProvince,
                                row.county, row.locality, row.minimumElevationInMeters, row.decimalLatitude, row.decimalLongitude, row.identificationQualifier, row.identifiedBy, row.dateIdentified, row.scientificName, row.order, row.family, row.genus, row.specificEpithet, row.infraspecificEpithet, row.taxonRank, row.scientificNameAuthorship, row.typeStatus)
                    }
                })
                .on('end', () => {
                console.log('CSV file successfully processed for ' + tablename);
                resolve('success')
                });   
            
        
            }
        } catch (error) {
            reject(new Error(error))
        }
    })
}


// opens database
// in: dataBaseFile (string, name of databasefile)
//     collection (string, name of collection, only used in a console.log)
// out: db (database-object)
async function openDB(dataBaseFile, collection) {
// function openDB(dataBaseFile, collection) {
    // return new Promise (function(resolve, reject) {
        // try {
            db = new sqlite3.Database(dataBaseFile, sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                    console.log('error')
                    console.error(err.message)
                    // reject(new Error(error))
                } else {
                    console.log(`Connected to the ${collection} database`)
                    // return(db)
                }
            })
            return db
        // } catch (error) {
        //     console.log(error)
        //     reject(new Error(error))
        // }
    // })
    
}

// puts item-information for several items in one line, resulting in one line for each object for coremadata.
// in: rows (JSON object? or similar, coming from sqlite-query)
// out: processedRows (?)
const itemToArraysOnSameLine = (rows,basedOn) => {
    // go through all objects, put organism ids in array
    // if object exist in array, transform (or add) relevant properties to arrays in that object, and add item-info to object
    let processedRows = []
    let existingRow = 'nothing'
    for (i=0; i<rows.length; i++) {
        if (i == rows.length-1) { // we reached the end of the file
            if (existingRow != 'nothing') {
                processedRows.push(existingRow)
                existingRow = 'nothing'
            } else {
                processedRows.push(rows[i])
            }
        } else if (rows[i].organismID != null) {
            if (rows[i].organismID == rows[i+1].organismID) { // next line is item of same organism
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
                    
                    if (Array.isArray(rows[i].RelCatNo) ) {
                        let len = rows[i].RelCatNo.length
                        if (existingRow.RelCatNo != rows[i].RelCatNo[len-1]) {
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
                        existingRow.preparationType.unshift(rows[i].basisOfRecord)
                    } else if (basedOn === 'corema') {
                        existingRow.preparationType.push(rows[i].musitBasisOfRecord)
                        existingRow.fullCatalogNumber.push(rows[i].fullCatalogNumber)
                    }
                    existingRow.materialSampleType.push(rows[i].materialSampleType)
                    
                    if (Array.isArray(rows[i].RelCatNo)) { // HVA ER DETTE?
                        let len = rows[i].RelCatNo.length
                        if (existingRow.RelCatNo != rows[i].RelCatNo[len-1]) {
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
                    if (basedOn === 'musit') {
                        rows[i].preparationType = [rows[i].preparationType]
                        rows[i].preparationType.unshift(rows[i].basisOfRecord)
                        rows[i].preparationType = rows[i].preparationType.join(' | ')
                    } else if (basedOn === 'corema') {
                        rows[i].preparationType = [rows[i].preparationType]
                        rows[i].preparationType.push(rows[i].musitBasisOfRecord)
                        rows[i].preparationType = rows[i].preparationType.join(' | ')
                    }
                    processedRows.push(rows[i])
                }
            }
            // if row does not have data for organismID (i.e., is not in corema)
        } else {
            if (basedOn === 'musit') {
                if (!rows[i].preparationType) {
                    rows[i].preparationType = rows[i].basisOfRecord
                } else {
                    rows[i].preparationType.unshift(rows[i].basisOfRecord)
                }
                rows[i].preparationType = [rows[i].preparationType]
                rows[i].preparationType = rows[i].preparationType.join(' | ')
                
            } else if (basedOn === 'corema') {
                rows[i].preparationType = [rows[i].preparationType]
                rows[i].preparationType.push(rows[i].musitBasisOfRecord)
                rows[i].preparationType = rows[i].preparationType.join(' | ')
            }
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
    
    for (i=0; i<rowsArray.length; i++) {
        if (rowsArray[i] === rowsArray[i+1]) {
            duplicates.push(rowsArray[i])
        }
    }

    const sortedRows = processedRows.sort((a, b) => {
        if (a.catalogNumber !== 'null' && b.catalogNumber !== 'null') {
            return a.catalogNumber > b.catalogNumber ? 1 : -1
        } else {
            return a.catalogNumber !== 'null' ? 1 : -1
        }
    })
    
    duplicates.forEach(el => {
        let first = sortedRows.find(element => element.catalogNumber === el)
        let secondIndex = sortedRows.indexOf(sortedRows.find(element => element.catalogNumber === el))
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
        
        first.RelCatNo.push(sortedRows[secondIndex+1].RelCatNo)
        first.RelCleanCatNo.push(sortedRows[secondIndex+1].RelCleanCatNo)
        first.materialSampleType.push(sortedRows[secondIndex+1].materialSampleType)
        first.preservationType.push(sortedRows[secondIndex+1].preservationType)
        first.preparationType.push(sortedRows[secondIndex+1].preparationType)
        first.preparationMaterials.push(sortedRows[secondIndex+1].preparationMaterials)
        first.preparedBy.push(sortedRows[secondIndex+1].preparedBy)
        first.preparationDate.push(sortedRows[secondIndex+1].preparationDate)
        first.geneticAccessionNumber.push(sortedRows[secondIndex+1].geneticAccessionNumber)
        first.BOLDProcessID.push(sortedRows[secondIndex+1].BOLDProcessID)
        first.concentration.push(sortedRows[secondIndex+1].concentration)
        first.concentrationUnit.push(sortedRows[secondIndex+1].concentrationUnit)

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
        
        sortedRows.splice(secondIndex+1,1)
    })
    return sortedRows
}


    


// main-function that opens db, query database, stitch data, and writes to file for collections that only have data in corema (e.g. birds)
// in: collection (string, name of collection)
//     coremaFolder (string, name of folder with corema dwc-archive files for that collection)
//     outfile (string, name of final stitched file)
// out: outfile (the final stitched file)
async function runCoremaStitch(collection, coremaFile, coremaFolder, outfile) {
    let dataBaseFile = `${pathToDatabases}${collection}.db`
    db = await createDatabase(dataBaseFile, "corema", coremaFile, collection)
        ////får ikke denne for-loopen til å virke, den hopper over noen av tabellene. de samme hver gang. for mammals: materialsample, multimedia og preparation. har den noe med async await å gjøre, som er satt opp feil?
        // for (i=0;i<coremaTables.length;i++) {
        //     console.log(coremaTables[i])
        //     if (fs.existsSync(`./../data/coremaDumps_220308/${coremaFolder}/${coremaTables[i]}.txt`)) {
        //         console.log(`${coremaTables[i]}` + ' exists')
        //         let file = `./../data/coremaDumps_220308/${coremaFolder}/${coremaTables[i]}.txt`
        //         // corema-txt-files comes with utf-8-BOM-encoding, here we change to utf8-encoding. otherwise sql won't read all data in them
        //         //await replaceQuotes(file)
        //         await changeEncoding(file)
        //         await deleteFromTable(db,`${coremaTables[i]}`)
        //         await fillTable(db,`${coremaTables[i]}`,file)
        //     } 
        // }
        
        await makeFileOnlyNew(db, 'simpledwc',coremaFolder,'corema')
    
        await makeOtherFileOnlyNew('amplification',coremaFolder)
        await makeOtherFileOnlyNew('materialsample',coremaFolder)
        await makeOtherFileOnlyNew('multimedia',coremaFolder)
        await makeOtherFileOnlyNew('permit',coremaFolder)
        await makeOtherFileOnlyNew('preparation',coremaFolder)
        await makeOtherFileOnlyNew('preservation',coremaFolder)
        await makeOtherFileOnlyNew('resourcerelationship',coremaFolder)
        

        await changeEncoding(`${pathToCoremaDumps}${coremaFolder}/amplification_new.txt`)
        await changeEncoding(`${pathToCoremaDumps}${coremaFolder}/materialsample.txt`)
        await changeEncoding(`${pathToCoremaDumps}${coremaFolder}/multimedia.txt`)
        await changeEncoding(`${pathToCoremaDumps}${coremaFolder}/permit.txt`)
        await changeEncoding(`${pathToCoremaDumps}${coremaFolder}/preparation.txt`)
        await changeEncoding(`${pathToCoremaDumps}${coremaFolder}/preservation.txt`)
        await changeEncoding(`${pathToCoremaDumps}${coremaFolder}/resourcerelationship.txt`)
        await changeEncoding(`${pathToCoremaDumps}${coremaFolder}/simpledwc_new.txt`)
        
        await fillTable(db,'amplification',`${pathToCoremaDumps}${coremaFolder}/amplification_new.txt`)
        await fillTable(db,'materialsample',`${pathToCoremaDumps}${coremaFolder}/materialsample_new.txt`)
        await fillTable(db,'multimedia',`${pathToCoremaDumps}${coremaFolder}/multimedia_new.txt`)
        await fillTable(db,'permit',`${pathToCoremaDumps}${coremaFolder}/permit_new.txt`)
        await fillTable(db,'preparation',`${pathToCoremaDumps}${coremaFolder}/preparation_new.txt`)
        await fillTable(db,'preservation',`${pathToCoremaDumps}${coremaFolder}/preservation_new.txt`)
        await fillTable(db,'resourcerelationship',`${pathToCoremaDumps}${coremaFolder}/resourcerelationship_new.txt`)
        await fillTable(db,'simpledwc',`${pathToCoremaDumps}${coremaFolder}/simpledwc_new.txt`)

        // await fillTable(db,'amplification',`${pathToCoremaDumps}${coremaFolder}/amplification.txt`)
        // await fillTable(db,'materialsample',`${pathToCoremaDumps}${coremaFolder}/materialsample.txt`)
        // await fillTable(db,'multimedia',`${pathToCoremaDumps}${coremaFolder}/multimedia.txt`)
        // await fillTable(db,'permit',`${pathToCoremaDumps}${coremaFolder}/permit.txt`)
        // await fillTable(db,'preparation',`${pathToCoremaDumps}${coremaFolder}/preparation.txt`)
        // await fillTable(db,'preservation',`${pathToCoremaDumps}${coremaFolder}/preservation.txt`)
        // await fillTable(db,'resourcerelationship',`${pathToCoremaDumps}${coremaFolder}/resourcerelationship.txt`)
        // await fillTable(db,'simpledwc',`${pathToCoremaDumps}${coremaFolder}/simpledwc.txt`)
        

        const start = coremaFolder.length + 2
        
        db.serialize(() => { // å ta bort denne fører oss ikke videre, inn i først db.run
            // only first time:
            // db.run(`ALTER TABLE simpledwc  
            //    ADD cleanCatalogNumber INTEGER`)
            // //remove prefix (coll-urn) from cleanCatNo
            db.run(`UPDATE simpledwc SET cleanCatalogNumber = SUBSTR(catalogNumber,${start},LENGTH(catalogNumber)-${start}-3)`, function(err) {
                if (err) {
                    return console.error(err.message)
                } 
            })
            .all(coremaSelect, (err, rows) => {
                if (err) {
                    console.error(err.message)
                }
                // go through all objects
                // put organism id in array
                // if object exist in array, transform (or add) relevant properties to arrays in that object, and add item-info to object
                let processedRows = []
                let existingRow = 'nothing'
                for (i=0; i<rows.length; i++) {
                    if (i == rows.length-1) {
                        if (existingRow != 'nothing') {
                            processedRows.push(existingRow)
                            existingRow = 'nothing'
                        } else {
                            processedRows.push(rows[i])
                        }
                        
                    } else 
                    if (rows[i].organismID == rows[i+1].organismID) {
                        if (existingRow == 'nothing') { // if this is the first line for this object
                            rows[i].fullCatalogNumber = [rows[i].fullCatalogNumber]
                            rows[i].preservationType = [rows[i].preservationType]
                            if (!rows[i].preparationType) {rows[i].preparationType = rows[i].coremaBasisOfRecord}
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
                        } else { // if this is not the first line for this object
                            // check if associatedMedia is the only difference between the lines
                            if (rows[i].materialSampleID == rows[i-1].materialSampleID) {
                                if (rows[i].associatedMedia) {
                                    existingRow.associatedMedia.push(rows[i].associatedMedia)    
                                }
                                
                            } else {
                                existingRow.fullCatalogNumber.push(rows[i].fullCatalogNumber)
                                existingRow.preservationType.push(rows[i].preservationType)
                                if (!rows[i].preparationType) {rows[i].preparationType = rows[i].coremaBasisOfRecord}
                                existingRow.preparationType.push(rows[i].preparationType)
                                existingRow.preparationMaterials.push(rows[i].preparationMaterials)
                                existingRow.preparedBy.push(rows[i].preparedBy)
                                existingRow.preparationDate.push(rows[i].preparationDate)
                                existingRow.materialSampleType.push(rows[i].materialSampleType)
                                existingRow.geneticAccessionNumber.push(rows[i].geneticAccessionNumber)
                                existingRow.BOLDProcessID.push(rows[i].BOLDProcessID)
                                existingRow.concentration.push(rows[i].concentration)
                                existingRow.concentrationUnit.push(rows[i].concentrationUnit)
                            }
                        }
                    } else {
                        if (existingRow != 'nothing') {
                            // check if associatedMedia is the only difference between the lines
                            if (rows[i].materialSampleID == rows[i-1].materialSampleID) {
                                if (rows[i].associatedMedia) {
                                    existingRow.associatedMedia.push(rows[i].associatedMedia)    
                                }
                                
                            } else {
                                existingRow.fullCatalogNumber.push(rows[i].fullCatalogNumber)
                                existingRow.preservationType.push(rows[i].preservationType)
                                if (!rows[i].preparationType) {rows[i].preparationType = rows[i].coremaBasisOfRecord}
                                existingRow.preparationType.push(rows[i].preparationType)
                                existingRow.preparationMaterials.push(rows[i].preparationMaterials)
                                existingRow.preparedBy.push(rows[i].preparedBy)
                                existingRow.preparationDate.push(rows[i].preparationDate)
                                existingRow.materialSampleType.push(rows[i].materialSampleType)
                                existingRow.geneticAccessionNumber.push(rows[i].geneticAccessionNumber)
                                existingRow.BOLDProcessID.push(rows[i].BOLDProcessID)
                                existingRow.concentration.push(rows[i].concentration)
                                existingRow.concentrationUnit.push(rows[i].concentrationUnit)
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
                        } else {
                            if (!rows[i].preparationType) {rows[i].preparationType = rows[i].coremaBasisOfRecord}
                            processedRows.push(rows[i])
                        }
                    }
                }
                let newResults = papa.unparse(processedRows, {
                    delimiter: "\t",
                })
                
                outfile = outfilePath + outfile
                fs.writeFileSync(outfile, newResults) 
            })

        db.close((err) => {
            if (err) {
                console.log(err.message)
            }
            console.log('Close the database connection')
        })
    })
}


// main-function that opens db, query database, stitch data, and writes to file for collections that have data in both musit and  corema (e.g. fungi)
// in: collection (string, name of collection)
//     musitFile (string, name of musit-dumpfile)
//     coremaFolder (string, name of folder with corema dwc-archive files for that collection)
//     outfile (string, name of final stitched file)
//     basedOn (string, depicting whether this is corema-data getting musit-data added, or musit-data getting corema-data added)
// out: outfile (the final stitched file)
//await runMusitCoremaStitch('fungi','fungus_o', 'O-DFL', 'sopp_stitched.txt','musit')
async function runMusitCoremaStitch(collection, musitFile, coremaFolder, outfile, basedOn) {
    // return new Promise (function(resolve, reject) {
        let dbSelect
    if (basedOn === 'corema') { dbSelect = coremaSelectWithMusit} else { dbSelect = musitSelect}
    let double
    // to choose different stitchfunction when corema-fungi-and-lichens shall have musit-fungi and musit-lichen data attached
    if (musitFile.includes("fung") && basedOn === "corema") {double = "yes"} else {double = "no"}
    if (double === "yes") {
        await makeNewMycFile()
    }

    let dataBaseFile = `${pathToDatabases}${collection}.db`
    
    db = await createDatabase(dataBaseFile, "musit", musitFile, collection)

    
    await makeFileOnlyNew(db,'simpledwc',coremaFolder, 'corema')
    await makeFileOnlyNew(db, musitFile, musitFile,'musit')
    await makeOtherFileOnlyNew('amplification', coremaFolder)
    await makeOtherFileOnlyNew('materialsample',coremaFolder)
    await makeOtherFileOnlyNew('multimedia',coremaFolder)
    await makeOtherFileOnlyNew('permit',coremaFolder)
    await makeOtherFileOnlyNew('preparation',coremaFolder)
    await makeOtherFileOnlyNew('preservation',coremaFolder)
    await makeOtherFileOnlyNew('resourcerelationship',coremaFolder)
                
    // db.serialize(() => {
    // // 1. delete data from tables in a sqlite-database (one per organismgroup), and fill tables again from musit- and coremadumpfiles
    await changeEncoding(`${pathToMusitDumps}${musitFile}/${musitFile}_new.txt`)
    await changeEncoding(`${pathToCoremaDumps}${coremaFolder}/amplification_new.txt`)
    await changeEncoding(`${pathToCoremaDumps}${coremaFolder}/materialsample_new.txt`)
    await changeEncoding(`${pathToCoremaDumps}${coremaFolder}/multimedia_new.txt`)
    await changeEncoding(`${pathToCoremaDumps}${coremaFolder}/permit_new.txt`)
    await changeEncoding(`${pathToCoremaDumps}${coremaFolder}/preparation_new.txt`)
    await changeEncoding(`${pathToCoremaDumps}${coremaFolder}/preservation_new.txt`)
    await changeEncoding(`${pathToCoremaDumps}${coremaFolder}/resourcerelationship_new.txt`)
    await changeEncoding(`${pathToCoremaDumps}${coremaFolder}/simpledwc_new.txt`) 
    
    // // 1.1 If we stitch corema-fungi-lichens with both of their musitfiles (from corema's perspective):
    // if (double === "yes") {
    //      changeEncoding(`${pathToMusitDumps}lichens_o/lichens_o.txt`)
    //      deleteFromTable(db, 'fungus_lichens_o')
    //     db.run("BEGIN TRANSACTION")
    //      fillTable(db, 'fungus_lichens_o', `${pathToMusitDumps}fungus_lichens_o/fungus_lichens_o.txt`)
    // //      fillTable(db, 'fungus_lichens_o', `${pathToMusitDumps}lichens_o/lichens_o.txt`)
    //     db.run("COMMIT")
    // }


    // // // fill tables - this now works without transaction, with await 
    // // db.run("BEGIN TRANSACTION");
    await fillTable(db, `${musitFile}`,`${pathToMusitDumps}${musitFile}/${musitFile}_new.txt`)
    await fillTable(db,'amplification',`${pathToCoremaDumps}${coremaFolder}/amplification_new.txt`)
    await fillTable(db,'materialsample',`${pathToCoremaDumps}${coremaFolder}/materialsample_new.txt`)
    await fillTable(db,'multimedia',`${pathToCoremaDumps}${coremaFolder}/multimedia_new.txt`)
    await fillTable(db,'permit',`${pathToCoremaDumps}${coremaFolder}/permit_new.txt`)
    await fillTable(db,'preparation',`${pathToCoremaDumps}${coremaFolder}/preparation_new.txt`)
    await fillTable(db,'preservation',`${pathToCoremaDumps}${coremaFolder}/preservation_new.txt`)
    await fillTable(db,'resourcerelationship',`${pathToCoremaDumps}${coremaFolder}/resourcerelationship_new.txt`)
    await fillTable(db,'simpledwc',`${pathToCoremaDumps}${coremaFolder}/simpledwc_new.txt`) 
    // // db.run("COMMIT");

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
    
    db.serialize(() => {

        // remove from resourcerelationship entries other than musit-regno-connections
        // db.run(`DELETE FROM resourcerelationship
        // WHERE SUBSTR (relatedResourceID,13,${length}) != '${prefix}';`)
        db.run(deleteStatement)
        // only first time: (not relevant any longer, is fixed when database is created)
        // .run(`ALTER TABLE resourcerelationship  
        //    ADD cleanCatalogNumberRecRel INTEGER`)
        // .run(`ALTER TABLE simpledwc  
        //    ADD cleanCatalogNumber INTEGER`)
        // // remove prefix (coll-urn) from cleanCatNo
        //.run(`UPDATE resourcerelationship SET cleanCatalogNumberRecRel = SUBSTR(relatedResourceID,14+${length})`)
        .run(updateStatement)
        .run(`UPDATE simpledwc SET cleanCatalogNumber = SUBSTR(catalogNumber,${start},LENGTH(catalogNumber)-${start}-3)`)
        .run(`DROP VIEW IF EXISTS musitRel`)
        .run(createViewMusitRel(musitFile,double))
        .run(`DROP VIEW IF EXISTS coremaFields`)
        // create view with all corema-fields in one table
        .run(createViewCoremaFields())
        .all( dbSelect, (err, rows) => {
            if (err) {
                console.error(err.message)
            }
            console.log('before making items into arrays: ' + rows.length)
            processedRows = itemToArraysOnSameLine(rows,basedOn)
            console.log('after putting items into arrays: ' + processedRows.length)
            sortedRows = removeCoremaDuplicates(processedRows)
            console.log('after removing corema-duplicates of musitentries: ' + sortedRows.length)
            let newResults = papa.unparse(sortedRows, {
                delimiter: "\t",
            })
            
            outfile = outfilePath + outfile
            fs.writeFileSync(outfile, newResults) 
        })    
    })

    db.close((err) => {
        if (err) {
            console.log(err.message)
        }
        console.log('Close the database connection')
        resolve('success')
    })
// })
}



async function mainSQLiteFunction () {
    
    await runCoremaStitch('birds', 'no_file', 'NHMO-BI','birds_stitched.txt')
    // await runCoremaStitch('mammals','no_file', 'NHMO-DMA','mammals_stitched.txt')
    // await runCoremaStitch('fish_herptiles','no_file', 'NHMO-DFH','dna_fish_herptiles_stitched.txt')
    // await runCoremaStitch('DNA_other','no_file', 'NHMO-DOT','dna_other_stitched.txt')
    
    // // ///// from musit's point of view; all musits data, add from corema
    // await runMusitCoremaStitch('fungi','fungus_o', 'O-DFL', 'sopp_stitched.txt','musit')
    // await runMusitCoremaStitch('lichens','lichens_o','O-DFL', 'lav_stitched.txt','musit')
    // await runMusitCoremaStitch('vascular','vascular_o', 'O-DP', 'vascular_stitched.txt','musit')
    //  await runMusitCoremaStitch('entomology','entomology_nhmo', 'NHMO-DAR', 'entomology_stitched.txt','musit')

    /////// from coremas point of fiew; all corema data, add from musit
    // await runMusitCoremaStitch('fungi','fungus_lichens_o', 'O-DFL', 'dna_fungi_lichens_stitched.txt','corema')
    // await runMusitCoremaStitch('vascular','vascular_o', 'O-DP', 'dna_vascular_stitched.txt','corema')
    // await runMusitCoremaStitch('entomology','entomology_nhmo', 'NHMO-DAR', 'dna_entomology_stitched.txt','corema')
}

mainSQLiteFunction()
module.exports = { 
    mainSQLiteFunction
}

