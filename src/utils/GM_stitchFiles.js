const fs = require('fs')
const readline = require('readline')
const papa = require('papaparse')

// filenames
const birdMultimediaFile = '../../src/data/birds_multimedia.txt'
const birdPreservationFile = '../../src/data/birds_preservation.txt'
const birdMaterialsampleFile = '../../src/data/birds_materialsample.txt'
const birdAmplificationFile = '../../src/data/dna_birds_amplification.txt'
const birdPreparationFile = '../../src/data/dna_birds_preparation.txt'
const birdOccurrenceFile = '../../src/data/birds_occurrence_short.txt' // switch to non-short

const mammalMultimediaFile = '../../src/data/mammals_multimedia.txt'
const mammalPreservationFile = '../../src/data/mammals_preservation.txt'
const mammalMaterialsampleFile = '../../src/data/mammals_materialsample.txt'
const mammalAmplificationFile = '../../src/data/dna_mammals_amplification.txt'
const mammalPreparationFile = '../../src/data/dna_mammals_preparation.txt'
const mammalOccurrenceFile = '../../src/data/mammals_occurrence_short.txt' // switch to non-short

const fishHerpMultimediaFile = '../../src/data/fishHerps_multimedia.txt'
const fishHerpPreservationFile = '../../src/data/fishHerps_preservation.txt'
const fishHerpMaterialsampleFile = '../../src/data/fishHerps_materialsample.txt'
const fishHerpAmplificationFile = '../../src/data/dna_fishHerps_amplification.txt'
const fishHerpPreparationFile = '../../src/data/dna_fishHerps_preparation.txt'
const fishHerpOccurrenceFile = '../../src/data/fishHerps_occurrence_short.txt' // switch to non-short

const otherMultimediaFile = '../../src/data/others_multimedia.txt'
const otherPreservationFile = '../../src/data/others_preservation.txt'
const otherMaterialsampleFile = '../../src/data/others_materialsample.txt'
const otherAmplificationFile = '../../src/data/dna_others_amplification.txt'
const otherPreparationFile = '../../src/data/dna_others_preparation.txt'
const otherOccurrenceFile = '../../src/data/others_occurrence.txt'

function fillProperty(prop, value) {
    tempArray = prop.split(",")
    tempArray.push(value)
    prop = tempArray.toString()
    return prop
}

const readDumpFile = (filename, callback) => {
    let dumpResults = ''
    const readInterface = readline.createInterface({
        input: fs.createReadStream(filename),
        console: false
    })
    let count = 0
    readInterface.on('line', function(line) {
        count ++
        if (count === 1 ) {
            // header row
            dumpResults = line
        } else {
            dumpResults = dumpResults + '\n' + line
        }
    })
    .on('close', function () {
        // parse the results, work with data in arrays to add column with items, then unparse back to string-format
        const parsedDumpResults = papa.parse(dumpResults, {
            delimiter: "\t",
            newline: "\n",
            quoteChar: '',
            header: true,
        })
        callback(undefined, parsedDumpResults.data)
    })
}

const stitchCoremaFiles = (occurrenceFile, preparationFile, amplificationFile, materialsampleFile, preservationFile, multimediaFile, outfileName) => {
    // read corema-occurrence-file and store each accession as an object in an array [orgArray]
    readDumpFile(occurrenceFile,(error, occurrenceResults) => {
        // make an array of all organismID's, and a new with only unique values
        const organismIDArray = []
        occurrenceResults.forEach( element => organismIDArray.push(element.organismID))   
        const uniqueOrganismIDArray = Array.from(new Set(organismIDArray))
        
        const orgArray = []
        uniqueOrganismIDArray.forEach (element => orgArray.push({id1: element}))
        
        occurrenceResults.forEach( element => {
            //find this orgID in orgArray
            relEl = orgArray.find(el => el.id1 === element.organismID)
            // and put the data for this organism into an object. If more items, add items to object
            if (!relEl.hasOwnProperty('type')) {
                // The Object.assign() method copies all enumerable own properties from one or more source objects to a target object. It returns the target object.
                relEl = Object.assign(relEl, element)
                relEl.items = element.preparations
                // item-id
                relEl.item_uuid = element.id
                // item-number
                relEl.itemNumbers = element.catalogNumber
                // date - for i.e. blood: date of sampling, same as eventDate(collecting date)
                // turn item-number into acc-number (i.e. catalogNumber)
                relEl.catalogNumber = relEl.catalogNumber.substring(0, relEl.catalogNumber.indexOf("/"))
                delete relEl.accessRights   // very long text that we don't think we need
                
            } else {
                relEl.items = fillProperty(relEl.items, element.preparations)
                relEl.items = relEl.items.replace(/,/g, ", ")
                relEl.itemNumbers = fillProperty(relEl.itemNumbers, element.catalogNumber)
                relEl.item_uuid = fillProperty(relEl.item_uuid, element.id)    
            }
        })
        
        readDumpFile(preparationFile,(error, dnaResults) => {
            orgArray.forEach(element => {
                if (element.accessRights) {
                    delete element.accessRights // very long text that we don't think we need 
                }
                tarray = element.item_uuid.split(",")
                dateArray = []
                methodArray = []
                preparedByArray = []
                tarray.forEach(uuid => {
                    dnaEl = dnaResults.find(el => el.id === uuid)
                    if (dnaEl) {
                        if (dnaEl.preparationDate) {
                            dateArray.push(dnaEl.preparationDate)
                        } else {
                            // if tissue: probably same as eventDNA. True????
                            dateArray.push(element.eventDate)    
                        }
                        if (dnaEl.preparationMaterials) {
                            methodArray.push(dnaEl.preparationMaterials)
                        } else {
                            methodArray.push('')
                        }
                        if (dnaEl.preparedBy) {
                            preparedByArray.push(dnaEl.preparedBy.replace(',',';'))

                        } else {
                            preparedByArray.push ('')
                        }
                    } else {
                        dateArray.push('')
                        methodArray.push('')
                        preparedByArray.push('')
                    }
                })
                element.itemDates = dateArray.toString()
                element.itemMethods = methodArray.toString()
                element.itemPreparedBys = preparedByArray.toString()
            })
            
            readDumpFile(amplificationFile,(error,sequenceResults) => {
                orgArray.forEach(element => {
                    tarray = element.item_uuid.split(",")
                    genArray = []
                    boldArray = []
                    uriArray = []
                    tarray.forEach(uuid => {
                        amplEl = sequenceResults.find(el => el.id === uuid)
                        if (amplEl) {
                            if (amplEl.geneticAccessionNumber) {
                                genArray.push(amplEl.geneticAccessionNumber)
                            } else {
                                genArray.push('')
                            }
                            if(amplEl.BOLDProcessID) {
                                boldArray.push(amplEl.BOLDProcessID)
                            } else {
                                boldArray.push('')
                            }
                            if (amplEl.geneticAccessionURI) {
                                uriArray.push(amplEl.geneticAccessionURI)
                            } else {
                                uriArray.push('')
                            }
                        } else {
                            genArray.push('')
                            boldArray.push('')
                            uriArray.push('')
                        }
                    })
                    element.itemGenAccNos = genArray.toString()
                    element.itemProcessIDs = boldArray.toString()
                    element.itemGenAccUris = uriArray.toString()
                })
                readDumpFile(materialsampleFile, (error,materialsampleResults) => {
                    orgArray.forEach(element => {
                        tarray = element.item_uuid.split(",")
                        concArray = []
                        unitArray = []
                        tarray.forEach(uuid => {
                            matEl = materialsampleResults.find(el => el.id === uuid)
                            if (matEl) {
                                if (matEl.concentration) {
                                    concArray.push(matEl.concentration)
                                } else {
                                    concArray.push('')
                                }
                                if (matEl.concentrationUnit) {
                                    unitArray.push(matEl.concentrationUnit)
                                } else {
                                    unitArray.push('')
                                }
                            } else {
                                concArray.push('')
                                unitArray.push('')
                            }
                        })
                        element.itemConcentrations = concArray.toString()
                        element.itemUnits = unitArray.toString()
                    })

                    readDumpFile(preservationFile, (error, preservationResults) => {
                        orgArray.forEach(element => {
                            tarray = element.item_uuid.split(",")
                            presArray = []
                            tarray.forEach(uuid => {
                                presEl = preservationResults.find(el => el.id === uuid)
                                if (presEl) {
                                    if (presEl.preservationType) {
                                        presArray.push(presEl.preservationType.replace(',',';'))
                                    } else {
                                        presArray.push('')
                                    }
                                } else {
                                    presArray.push('')
                                }
                            })
                            element.itemPreservations = presArray.toString()
                        })

                        // photo
                        readDumpFile(multimediaFile, (error, photoResults) => {
                            // make array with  unique ids from photoResults
                            const mediaIDArray = []
                            photoResults.forEach( element => mediaIDArray.push(element.id))   
                            const uniqueMediaIDArray = Array.from(new Set(mediaIDArray))
                            
                            const uniqueMediaObjArray = []
                            uniqueMediaIDArray.forEach (element => uniqueMediaObjArray.push({id1: element}))
                            

                            photoResults.forEach (element => {
                                //find this id in uniqueMediaObjArray
                                medEl = uniqueMediaObjArray.find(el => el.id1 === element.id)
                                if (medEl) {
                                    const photoID = element.identifier.substring(element.identifier.indexOf('id=')+ 3,element.identifier.indexOf('&type'))
                                    // and put the data for this organism into an object. If more items, add items to object
                                    if (!medEl.hasOwnProperty('photoIDs')) {
                                        medEl.photoIDs = photoID
                                        medEl.photoIdentifiers = element.identifier
                                        medEl.licenses = element.license
                                        
                                    } else {
                                        tempArray = medEl.photoIDs.split(",")
                                        tempArray.push(photoID)
                                        medEl.photoIDs = tempArray.toString()
                                        
                                        tArrayIdentifiers = medEl.photoIdentifiers.split(",")
                                        tArrayIdentifiers.push(element.identifier)
                                        medEl.photoIdentifiers = tArrayIdentifiers.toString()

                                        tArrayLicenses = medEl.licenses.split(",")
                                        tArrayLicenses.push(element.license)
                                        medEl.licenses = tArrayLicenses.toString()
                                    }
                                }
                            })
                            orgArray.forEach(element => {
                                medEl2 = uniqueMediaObjArray.find(el => el.id1 === element.id)
                                if (medEl2) {
                                  //  if (!element.hasOwnProperty('photoIDs')) {
                                        element.photoIDs = medEl2.photoIDs
                                        element.photoIdentifiers = medEl2.photoIdentifiers
                                        element.licenses = medEl2.licenses
                                } else {
                                    element.photoIDs = ''
                                    element.photoIdentifiers = ''
                                    element.licenses = ''
                                }
                            })
                            
                            let newResults = papa.unparse(orgArray, {
                                delimiter: "\t",
                            })
                            fs.writeFileSync(outfileName, newResults)    

                        })
                    })
                })
            })
        })
    })
}

stitchCoremaFiles(birdOccurrenceFile,birdPreparationFile,birdAmplificationFile,birdMaterialsampleFile,birdPreservationFile,birdMultimediaFile,'../data/birds_stitched_file.txt')
//stitchCoremaFiles(mammalOccurrenceFile,mammalPreparationFile,mammalAmplificationFile,mammalMaterialsampleFile,mammalPreservationFile,mammalMultimediaFile,'../data/mammals_stitched_file.txt')
//stitchCoremaFiles(fishHerpOccurrenceFile,fishHerpPreparationFile,fishHerpAmplificationFile,fishHerpMaterialsampleFile,fishHerpPreservationFile,fishHerpMultimediaFile,'../data/dna_fish_herptiles_stitched_file.txt')
//stitchCoremaFiles(otherOccurrenceFile,otherPreparationFile,otherAmplificationFile,otherMaterialsampleFile,otherPreservationFile,otherMultimediaFile,'../data/dna_other_stitched_file.txt')