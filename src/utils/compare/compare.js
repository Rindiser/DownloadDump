// compare data from musit and corema and find mismatches
const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')

function mapElementToColumns(fieldNames) {
    return function (element) {
        let fields = fieldNames.map(n => element[n] ? JSON.stringify(element[n]) : '""')
        return fields.join('\t')
    }
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

const collection = 'fungi'
db = new sqlite3.Database(`./../../../../sqliteDatabases/${collection}.db`)

let logger = fs.createWriteStream('fungi_corema_musit_diff_in_name2.txt', {
    flags: 'a' // means append
})

db.all(musitSelect, (err, rows) => {
    if (err) {
        console.error(err.message)
    }
    // numberOne = rows.filter(el => el.catalogNumber === 1)
    // console.log(numberOne)
    let fieldNames = Object.keys(rows[0]) //new
    logger.write(fieldNames.join('\t'))
    logger.write("\n")
    
    // rows.forEach(el => {
    for (i=0;i<rows.length;i++) {
        if (rows[i].coremaScientificName != null) {
            if (rows[i].scientificName != rows[i].coremaGenus + ' ' + rows[i].coremaSpecificEpithet) {
                if (rows[i].scientificName === rows[i].genus && rows[i].coremaScientificName === 'sp.') {
                    continue
                } else {
                    logger.write(Object.values(rows[i]).join('\t'))
                    logger.write("\n")    
                }
            }
        }
    }
    // console.log(rows[0])
})

db.close((err) => {
    if (err) {
        console.log(err.message)
    }
    console.log('Close the database connection')
    // resolve('success')
})
