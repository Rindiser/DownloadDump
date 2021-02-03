const fs = require('fs')
const readline = require('readline')
const papa = require('papaparse')
const chalk = require('chalk');
// for å kunne skrive store mengder data til cvs
const { convertArrayToCSV } = require('convert-array-to-csv');
const converter = require('convert-array-to-csv');


// filenames

// from musit
const fungiOccurrenceFile = 'src/data/sopp_occurrence.txt' // switch to non-short
const lichenOccurrenceFile = 'src/data/lav_occurrence.txt' // switch to non-short
const entOccurrenceFile = 'src/data/entomologi_occurrence.txt' // switch to non-short
const plantOccurrenceFile = 'src/data/karplanter_occurrence.txt' // switch to non-short

// from corema
const funLichDnaOccurrenceFile = 'src/data/dna_fungi_lichens_occurrence.txt'
const funLichRelationshipFile = 'src/data/fungi_lichens_resourcerelationship.txt'
const funLichPreparationFile = 'src/data/dna_fungi_lichens_preparation.txt'
const funLichAmplificationFile = 'src/data/dna_fungi_lichens_amplification.txt'
const funLichMaterialsampleFile = 'src/data/dna_fungi_lichens_materialsample.txt'
const funLichPreservationFile = 'src/data/dna_fungi_lichens_preservation.txt'

const entDnaOccurrenceFile = 'src/data/dna_entomology_occurrence.txt'
const entRelationshipFile = 'src/data/dna_entomology_resourcerelationship.txt'
const entPreparationFile = 'src/data/dna_entomology_preparation.txt'
const entAmplificationFile = 'src/data/dna_entomology_amplification.txt'
const entMaterialsampleFile = 'src/data/dna_entomology_materialsample.txt'
const entPreservationFile = 'src/data/dna_entomology_preservation.txt'

const plantDnaOccurrenceFile = 'src/data/dna_plants_occurrence.txt' // switch to non-short
const plantRelationshipFile = 'src/data/dna_plants_resourcerelationship.txt'
const plantPreparationFile = 'src/data/dna_plants_preparation.txt'
const plantAmplificationFile = 'src/data/dna_plants_amplification.txt' // empty file, no amplification info for plants...
const plantMaterialsampleFile = 'src/data/dna_plants_materialsample.txt'
const plantPreservationFile = 'src/data/dna_plants_preservation.txt'


// one extra step for musit-files, to get preparations: add musitNo into corema-occurrence-file

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
        const parsedDumpResults = papa.parse(dumpResults, {
            delimiter: "\t",
            newline: "\n",
            quoteChar: '',
            header: true,
        })
        callback(undefined, parsedDumpResults.data)
    })
}

const stitchMusitCoremaFiles = (occurrenceFile, dnaOccurrenceFile, relationshipFile, preparationFile, amplificationFile, materialsampleFile, preservationFile, collSpecTextToReplace, collSpecPlacement, outfileName) => {
    // read musit-occurrence-file and store each accession as an object in an array [orgArray]
    console.log('Vi starter');
    readDumpFile(occurrenceFile, (error, occurrenceResults) => {
        // 1) create orgArray with all organisms from musit-file and add property musitNo (same as catalogNumber, with prefix) and other empty properties
        console.log(chalk.blue('1. Org Arry'));
        const orgArray = []
        occurrenceResults.forEach( element => orgArray.push(element))  
        orgArray.forEach(el => {
            el.musitNo = el.institutionCode + '-' + el.collectionCode + '-' + el.catalogNumber  // redundancy with new catalogNumber, see below, musitno should go, but uncertain of consequences
            el.organismID = ''
            el.itemUUIDs = 'dummyUUID' // to be able to list 'Voucher' as an item
            el.items = 'Voucher'
            el.itemNumbers = el.musitNo
            if (el.recordedBy) { el.recordedBy = el.recordedBy.trim() } // to clean up collectors field in entomology
            if (el.identifiedBy) { el.identifiedBy = el.identifiedBy.trim() }
            el.catalogNumber = el.institutionCode + '-' + el.collectionCode + '-' + el.catalogNumber    // redundancy with musitNo, musitno should go, but uncertain of consequences
        })
        
        // 2) create array uniqueRelationObjects with all itemUUIDs from corema, all relations from relation-file, and musitNo
        readDumpFile(relationshipFile, (error, relationshipResults) => {
            //there might be several relations for one itemUUIDs
            console.log(chalk.blue('2. uniqueRelationObjects'));
            const relationIDs = []
            relationshipResults.forEach(element => relationIDs.push(element.id))  // element.id = UUID      
            const uniqueRelationIDs = Array.from(new Set(relationIDs)) // remove duplicates
            //make these objects
            const uniqueRelationObjects = []
            uniqueRelationIDs.forEach (element => uniqueRelationObjects.push({id: element}))
            
            // add relations.. 
            relationshipResults.forEach(element => {
                relationEl = uniqueRelationObjects.find(el => el.id === element.id)
                if (element.relatedResourceID.includes('urn:catalog:O:') || element.relatedResourceID.includes('urn:catalog:NHMO:')) {
                    relationEl.musitNo = element.relatedResourceID.replace(collSpecTextToReplace, collSpecPlacement)
                }
            })

            // 3) read corema-occ-file and 4) add musitNo to this, and 5) add item-info to orgArray
            readDumpFile(dnaOccurrenceFile,(error, coremaResults) => {
                console.log(chalk.blue('3 og 4. add musit no til corema file and 5. itmes'));
                const coremaIDs = []    // for those corema-records that are not in musit
                coremaResults.forEach(element => {
                    // add musitNo to coremaOccurrenceData
                    const relationObject = uniqueRelationObjects.find(el => el.id === element.id)
                    if (relationObject) {
                        element.musitNo = relationObject.musitNo
                    } else {
                        element.musitNo = '#N/A'
                        
                        // add object from corema to orgArray
                        // is organism already in there?
                        const coremaEl = coremaIDs.find(el => el.organismID === element.organismID)
                        // if not, add element, 6)
                        if (!coremaEl) {
                            coremaIDs.push(element)
                            const lastIndex = coremaIDs.length - 1
                            coremaIDs[lastIndex].items = element.preparations
                            coremaIDs[lastIndex].itemNumbers = element.catalogNumber
                            coremaIDs[lastIndex].itemUUIDs = element.id
                            coremaIDs[lastIndex].catalogNumber = coremaIDs[lastIndex].catalogNumber.substring(0, coremaIDs[lastIndex].catalogNumber.indexOf("/"))
                        } else {
                            // if it is, add item to object
                            coremaEl.items = fillProperty(coremaEl.items, element.preparations)
                            coremaEl.itemNumbers = fillProperty(coremaEl.itemNumbers, element.catalogNumber)
                            coremaEl.itemUUIDs = fillProperty(coremaEl.itemUUIDs, element.id)
                        }
                    }    
                    // 5) add item-info to orgArray-objects from musit
                    const org = orgArray.find(el => el.musitNo === element.musitNo)
                    if (org) {
                        if (org.items === '') {
                            org.items = element.preparations
                            org.itemNumbers = element.catalogNumber
                            org.itemUUIDs = element.id
                        } else {
                            org.items = fillProperty(org.items, element.preparations)
                            org.items = org.items.replace(/,/g, ", ")
                            org.itemNumbers = fillProperty(org.itemNumbers, element.catalogNumber)
                            org.itemUUIDs = fillProperty(org.itemUUIDs, element.id)
                        }
                    }
                })

                // 7) add [coremaEl], which contains records from corema with no counterpart in musit, to [orgArray]; records from musit
                console.log(chalk.blue('7. push to org arry'));
                orgArray.push(...coremaIDs)
               
                // 8) add info about items from four different dump-files
                readDumpFile(preparationFile,(error, dnaResults) => {
                    console.log(chalk.blue('8. add info for 4 diff files'));
                    orgArray.forEach(element => {
                        if (element.accessRights) {
                            delete element.accessRights // very long text that we don't think we need 
                        }
                        tarray = element.itemUUIDs.split(",")
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
                                    dateArray.push('')    
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
                        console.log(chalk.blue('9?. amplification'));
                        orgArray.forEach(element => {
                            tarray = element.itemUUIDs.split(",")
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
                            console.log(chalk.blue('10. materialsampleFile'));
                            orgArray.forEach(element => {
                                tarray = element.itemUUIDs.split(",")
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
                                console.log(chalk.red('11. preservationFile'));
                                orgArray.forEach(element => {
                                    tarray = element.itemUUIDs.split(",")
                                    presArray = []
                                    tarray.forEach(uuid => {
                                        presEl = preservationResults.find(el => el.id === uuid)
                                        if (presEl) {
                                            if (uuid === 'dummyUUID') { // dette skulle gi 'Dried' i preservation feltet på nettsida for vouhcer-objektet, men dette funker ikke
                                                presArray.push('Dried')
                                            } else if (presEl.preservationType) {
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
                                let newResults = convertArrayToCSV(orgArray, {
                                    // header,
                                    separator: '\t'
                                  })
                                // let newResults = papa.unparse(orgArray, {
                                //     delimiter: "\t",
                                // })
                                fs.writeFileSync(outfileName, newResults)
                            })   
                        })
                    })
                })
            })
        })
    })
}

//stitchMusitCoremaFiles(fungiOccurrenceFile,funLichDnaOccurrenceFile,funLichRelationshipFile,funLichPreparationFile,funLichAmplificationFile,funLichMaterialsampleFile,funLichPreservationFile, 'urn:catalog:O:F:','O-F-', '../data/sopp_stitched_file.txt')
//stitchMusitCoremaFiles(lichenOccurrenceFile,funLichDnaOccurrenceFile,funLichRelationshipFile,funLichPreparationFile,funLichAmplificationFile,funLichMaterialsampleFile,funLichPreservationFile, 'urn:catalog:O:L:','O-L-','../data/lav_stitched_file.txt')
// stitchMusitCoremaFiles(entOccurrenceFile,entDnaOccurrenceFile,entRelationshipFile,entPreparationFile,entAmplificationFile,entMaterialsampleFile,entPreservationFile, 'urn:catalog:NHMO:ENT:','NHMO-ENT-','src/data/entomologi_stitched_file.txt')
stitchMusitCoremaFiles(plantOccurrenceFile,plantDnaOccurrenceFile,plantRelationshipFile,plantPreparationFile,plantAmplificationFile,plantMaterialsampleFile,plantPreservationFile, 'urn:catalog:O:V:','O-V-','src/data/karplanter_stitched_file.txt')