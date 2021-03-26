const readline = require('readline');
const fs = require('fs');
const fileList = require('./fileList');
const chalk = require('chalk');

const { convertArrayToCSV } = require('convert-array-to-csv');
const Papa = require('papaparse');
const { stringify } = require('querystring');

const musitFile = 'src/data/test/karplanter_occurrence.txt';
const coremaFile = 'src/data/test/resourcerelationship.txt';
const OccurenceFile  = 'src/data/test/occurrence.txt';
const musitOutFile = 'src/data/test/karplanter_occurrence_Corema.txt';
const resourcerelationship = 'src/data/test/resourcerelationship.txt';
const coremaOutFile = 'src/data/test/coremaStichFile.txt';
const testFile = 'testStich.txt'
const testPath = 'src/data/test/'
const coremaOccurenceOutFile = 'src/data/test/coremaoccurenceOUT.txt';
const orgUUIDobjekt = 'src/data/test/orgUUIDobjekt.txt'
let arrayOfContent = [];
let results = '';
let tempResults = '';
let UUID = [];
let tsvItems = '';
let tsvHeader = '';
let urnPrefix = 'urn:catalog:O:V:';
const folderPath = 'src/data/test/'


// Sorts the UUIDS alphabetically in the first column of the file
const sortCoremaOut = (file) => {
    console.log(chalk.blue('sorting....'));
    if (fs.existsSync(file)) {
        let filContent = fs.readFileSync(file,'utf8');
        arrayToSort = filContent.split('\n')
        console.log(arrayToSort[2])
        filContent = '' // tøm variabel
        for (let index = 0; index < arrayToSort.length; index++) {
            let element = arrayToSort[index];
            let parts = element.split('\t')
            let part = parts[0].toString()
            if(part.indexOf('|') > -1) {
                uuidArray = part.split(' | ')
                uuidArray.sort();
                part = uuidArray.join(' | ')
                parts[0] = part
                element = parts.join('\t')
                arrayToSort[index] = element
                uuidArray.length = 0
            }
            part = ''
            parts.length = 0
        }
        saveArrayToFile(arrayToSort, file, '')
    }
}

// Sorter en array av arrays på en bestemt index
const sortArray = (inputArray, index) => {
    // Overskriftsraden puttes i en egen array
    const headerArray = inputArray.shift()
    // Fjern tomme felter i array
    inputArray = inputArray.filter(Boolean)
    // sorts lines alphabethic as string
    inputArray.sort(function(a, b) {
        return a[index] - b[index];
    });
    // add header to the top
    inputArray.unshift(headerArray)
    inputArray = inputArray.flat() // for å unngå arrays inni arrays

    return inputArray
}

// data må være en array of arrays
const saveArrayToFile = (data, fileName, filePath) => {
    console.log('skriver til fil');
    let tsvItem = ''
    fileName = filePath + fileName
    // gjør array om til string'
    //Sjekk om det er en array of array eller bare en array

    if(data[0][0].length > 1) {
        for (let index = 0; index < data.length; index++) {
        tsvItem = data[index].join('\t')
        tsvItems =tsvItems + tsvItem + '\n'
        }
    } else{
        // hvis det er en array
        for (let index = 0; index < data.length; index++) {
            tsvItem = data[index]
            tsvItems =tsvItems + tsvItem + '\n'
            }
    }
    const writeStream = fs.createWriteStream(fileName);
    const pathName = writeStream.path;
    
    writeStream.write(tsvItems)
    writeStream.end()
    writeStream.on('finish', () => {
        console.log(`wrote all the array data to file ${pathName}`);
        });
    
        // handle the errors on the write process
    writeStream.on('error', (err) => {
        console.error(`There is an error writing the file ${pathName} => ${err}`)
    });
}

const saveVariableToFile = (data, FileName, filepath) => {
    console.log('saving file: ' + filepath + FileName );
    const OutFile = filepath + FileName
    const writeStream = fs.createWriteStream(OutFile);
    const pathName = writeStream.path;
    writeStream.write(data)
    writeStream.end()
    
    writeStream.on('finish', () => {
        console.log(`wrote all the array data to file ${pathName}`);
        tsvItems = ''
        });

    // handle the errors on the write process
    writeStream.on('error', (err) => {
        console.error(`There is an error writing the file ${pathName} => ${err}`)
    });

}
//Add organism UUID to the first column of file
const addOrgamismUUIDtoFile = (organisemUUIDObjekt, tilFil) => {
    console.time("addOrgUUID");
    let UUIDObjekt = {}
    let item = ''
    let items = ''
    let headerRow = ''
    if (fs.existsSync(organisemUUIDObjekt)) {
        UUIDObjekt = fs.readFileSync(organisemUUIDObjekt,'utf8');
        UUIDObjekt = JSON.parse(UUIDObjekt)
    } else {
        console.log(chalk.red('File not found:' + organisemUUIDObjekt ));
        return
    }
    tilFil = folderPath + tilFil + '.txt'
    if (fs.existsSync(tilFil)) {
        let tilFilContent = fs.readFileSync(tilFil,'utf8');
        tilArray = tilFilContent.split('\n')
        tilFilContent = '' // tøm variabel
        tilArray = sortArray(tilArray, 0)
    } else {
        console.log(chalk.red('File not found:' + tilFil ));
        return
    }
    // add orgUUID to each line of tilFile
    for (let index = 0; index < tilArray.length; index++) {
        if(index ===0) {
            headerRow = 'organismUUID' + '\t' + tilArray[0]
            console.log(headerRow);
        } else {
            const element = tilArray[index].split('\t');
            objKey = element[0]
            item = UUIDObjekt[objKey] + '\t' + tilArray[index] + '\n'
            items = items + item
        }
    }
    items = headerRow + '\n' + items
    saveVariableToFile(items, tilFil, '' )
    console.timeEnd("addOrgUUID");
}
//lager et objekt som kombinerer organisemUUID med resourceRelationship ID, skal brukes i addOrgamismUUIDtoFile
const makeOrganimsUUIDobjekt = (coremaOccuranceFile) => {
    const organismIdObject = {}
    let keyName = ''
    let severalUUIDs = []
    console.log('Start ny funksjon');
    if (fs.existsSync(coremaOccuranceFile)) {
        let fraFilContent = fs.readFileSync(coremaOccuranceFile,'utf8');
        fraArray = fraFilContent.split('\n')
        fraFilContent = '' // tøm variabel
        fraArray = sortArray(fraArray, 0)
        // bygge et objekt med key = organismeUUID value = resourcerelationship UUID
        for (let index = 0; index < fraArray.length; index++) {
            const lineArray = fraArray[index].split('\t');
            // bygg objekt
            if (lineArray[0].indexOf('|') > -1){
                // console.log(chalk.blue('har flere uuider'));
                severalUUIDs = lineArray[0].split('|')
                // trim whitespace
                for (var i = 0; i < severalUUIDs.length; i++) {
                    severalUUIDs[i] = severalUUIDs[i].trim()
                }


                for (let index = 0; index < severalUUIDs.length; index++) {
                keyName = severalUUIDs[index]
                organismIdObject[keyName] = lineArray[2]
                // console.log(organismIdObject[keyName]);   
                }
            } else {
                keyName = lineArray[0]
                organismIdObject[keyName] = lineArray[2]  
            }
        } 

    } else {
           console.log(chalk.red('File not found:' + coremaOccuranceFile)); 
    }
    console.log('Closing');
    const OutFile = testPath + 'orgUUIDobjekt.txt'
    const writeStream = fs.createWriteStream(OutFile);
    const pathName = writeStream.path;
    writeStream.write(JSON.stringify(organismIdObject))
    writeStream.end()
    
    writeStream.on('finish', () => {
        console.log(`wrote all the array data to file ${pathName}`);
        tsvItems = ''
        });

    // handle the errors on the write process
    writeStream.on('error', (err) => {
        console.error(`There is an error writing the file ${pathName} => ${err}`)
    });

}

// Legger til informasjon fra en Coremafile til MUSIT Occurance Fila
const AddPreparationToCoremaOUT = (tilFil, fraFil, OutFile) => {
    console.time("searchAddDatafromDifferntFiles");
    fraFil = folderPath + fraFil + '.txt'
    if (fs.existsSync(fraFil)) {
        let fraFilContent = fs.readFileSync(fraFil,'utf8');
        fraArray = fraFilContent.split('\n')
        fraFilContent = '' // tøm variabel
        fraArray = sortArray(fraArray, 0)
        // console.log(fraArray);
        // get index for 'preparationMaterials', 'preparedBy' , 'preparationDate
        let tempHeader = fraArray[0].split('\t')
        indexOfpreparationMaterials = tempHeader.indexOf('preparationMaterials')
        indexOfpreparedBy = tempHeader.indexOf('preparedBy')
        indexOfpreparationDate = tempHeader.indexOf('preparationDate')
        tempHeader.length = 0
         // fjern headerraden
         fraArray.shift()
    } else {
        throw new Error ('File not found ' + fraFil)
    }

    if (fs.existsSync(tilFil)) {       
        const writeStream = fs.createWriteStream(OutFile);
        const pathName = writeStream.path;
        
        const readInterface = readline.createInterface({
            input: fs.createReadStream(tilFil),
            console: false
        })
        let count = 0 
        let item = '' 
        let a = ''
        let b = ''
        let c = ''
        let tsvItem = ''
        let tsvItems = ''
        let alreadyFound = 0
        let stopSeach = 0
        let raskTeller = 10
        let multipleTreff = 0
        let startIndex = 0
        // Les MUSIT fila linje for linje
        readInterface.on('line', function(line) {
            count++
            if(count === raskTeller) {
                console.log(chalk.red('vi er kommet til: ') + count);
                raskTeller = raskTeller + 1000 
            }

            if (count === 1) {
                // header row 
                Header =  line.split('\t')
                // legg til felt fr coremaUUID
                Header.push('preparationMaterials', 'preparedBy' , 'preparationDate')
                indexOfId = Header.indexOf('id')
                tsvHeader = Header.join('\t')
            } else {
                item = line.split('\t')
                // console.log(startIndex);

                for (i = 0; i < fraArray.length; i++) {
                    if (stopSeach === 1 && alreadyFound === 0) {
                        stopSeach = 0
                    // add the item to variable
                        tsvItem = line + '\t' + a + '\t' + b + '\t' + c;
                        tsvItems = tsvItems + tsvItem + '\n';
                        tsvItem = ''
                        a = ''
                        b = ''
                        c = ''

                        // fjern alle radene vi har søk med og fått treff på fra array
                        // startIndex = i - multipleTreff
                        // console.log('her skal vi strarte å slette: ' + startIndex );
                        // console.log(chalk.blue(' Så mange skal vi fjerne: ') + multipleTreff );
                        // sletta = fraArray.splice(startIndex, multipleTreff)
                        // console.log(fraArray.length);
                        // console.log(sletta)
                        // console.log(chalk('---'));
                        // console.log(tsvItem);
                        startIndex = i +1
                        // console.log(startIndex);
                        // multipleTreff = 0
                        break
                    } else {
                        // https://stackoverflow.com/questions/237104/how-do-i-check-if-an-array-includes-a-value-in-javascript/25765186#25765186
                        // hvis ID fra fromFile fins i CoremaOccurance file så..  
                        splitFraArray = fraArray[i].split('\t')
                        if (!!~item[indexOfId].indexOf(splitFraArray[0])) {
                            tempResults = fraArray[i]
                            tempResults = tempResults.split('\t')
                            if(alreadyFound === 0){
                                // If feltet er tomt bruk N/A i stedet
                                a = (tempResults[2] ? tempResults[2] : 'N/A');
                                b = (tempResults[3] ? tempResults[3] : 'N/A');
                                c = (tempResults[4] ? tempResults[4] : 'N/A');
                                a = a + ''
                                b = b + ''
                                c = c + ''
                                // add this to the item
                                // hvis vi ikke har noe der fra før
                                alreadyFound = 1
                                stopSeach = 1
                                // multipleTreff = 1
                            } else if (alreadyFound === 1) {
                                //hvis vi allerede har lagt
                                a = (tempResults[2] ? a + ' | ' + tempResults[2] : a + ' | ' + 'N/A');
                                b = (tempResults[3] ? b + ' | ' + tempResults[3] : b + ' | ' + 'N/A');
                                c = (tempResults[4] ? c + ' | ' + tempResults[4] : c + ' | ' + 'N/A');
                                a = a + ''
                                b = b + ''
                                c = c + ''
                                // multipleTreff++
                            }  
                            tempResults.length = 0;
                        } else {
                            alreadyFound = 0                           
                        }
                    }
                }
            }
        }).on('close', function () {
            console.log('Closing');
            const OutFile = testPath + 'dust.txt'
            const writeStream = fs.createWriteStream(OutFile);
            const pathName = writeStream.path;
            writeStream.write(`${tsvHeader}\n`)
            writeStream.write(`${tsvItems}\n`)
            writeStream.end()
            
            writeStream.on('finish', () => {
                console.log(`wrote all the array data to file ${pathName}`);
                tsvItems = ''
                });
        
            // handle the errors on the write process
            writeStream.on('error', (err) => {
                console.error(`There is an error writing the file ${pathName} => ${err}`)
            });

            console.timeEnd("searchAddDatafromDifferntFiles");
        })
    } else {
        throw new Error ('File not found ' + musitFile)
    }
}


const mergeOccurencesPosts = (OccurenceFile) => {
    if (fs.existsSync(OccurenceFile)) {

        // 1. let igjennom resourcerelationship og plukk ut alle MUSI Tnr. og alle UUIDer
        const readInterface = readline.createInterface({
            input: fs.createReadStream(OccurenceFile),
            console: false
        })
        const writeStream = fs.createWriteStream(coremaOccurenceOutFile);
        const pathName = writeStream.path;

        let count = 0  
        let lastItem = ''
        const coremaOcurrenceHeader = 'id' + '\t' + 'catalogNumber' + '\t' + 'organismID'+ '\t' + 'preparations'
        // Les MUSIT fila linje for linje
        readInterface.on('line', function(line) {
            count++
            if (count === 1) {
                Header = line.split('\t')
                indexOfID = Header.indexOf('id')
                indexOfcatalogNumber = Header.indexOf('catalogNumber')
                indexOforganismID = Header.indexOf('organismID')
                indexOfpreparations = Header.indexOf('preparations')
            } else if (count === 2){ //  les forste linje med data inn i minne
                lastItem = line.split('\t')
            } else {
                currentItem = line.split('\t')
                if (lastItem[indexOforganismID] !== currentItem[indexOforganismID]){
                    // hvis linjene tilhører forskjellige orgainismer skriv last item til fila og gjør currentitem til lastitem
                    let tsvItem = lastItem[indexOfID] + '\t' + lastItem[indexOfcatalogNumber] + '\t' + lastItem[indexOforganismID] + '\t' + lastItem[indexOfpreparations];
                    tsvItems =tsvItems + tsvItem + '\n';
                    lastItem.length = 0;
                    lastItem = [...currentItem];
                    
                } else {
                    // Hvis linjene komme fra samme orgamisme skal vi lage arrays av is, catalognummer og preparations
                    if (lastItem[indexOfID].indexOf('[') > -1){
                        // hvis vi allerede har slått sammen to poster må vi gjøre et triks for å unngå dobble [
                        lastItem[indexOfID] = lastItem[indexOfID].slice(0, -1) + ' | ' +  currentItem[indexOfID] + ']';
                        lastItem[indexOfcatalogNumber] = lastItem[indexOfcatalogNumber].slice(0, -1) + ' | ' +  currentItem[indexOfcatalogNumber] + ']';
                        lastItem[indexOfpreparations] = lastItem[indexOfpreparations].slice(0, -1) + ' | ' +  currentItem[indexOfpreparations] + ']';


                    } else {
                    lastItem[indexOfID] =  lastItem[indexOfID] + ' | ' +  currentItem[indexOfID] ;
                    lastItem[indexOfcatalogNumber] =  lastItem[indexOfcatalogNumber] + ' | ' +  currentItem[indexOfcatalogNumber] ;
                    lastItem[indexOfpreparations] =  lastItem[indexOfpreparations] + ' | ' +  currentItem[indexOfpreparations] ;

                    }

                }
            }
        }).on('close', function () {
    
            writeStream.write(`${coremaOcurrenceHeader}\n`)
            writeStream.write(`${tsvItems}\n`)
            writeStream.end()
            
            writeStream.on('finish', () => {
                console.log(`wrote all the array data to file ${pathName}`);
                tsvItems = ''
                });
        
                // handle the errors on the write process
            writeStream.on('error', (err) => {
                console.error(`There is an error writing the file ${pathName} => ${err}`)
            });
        })

    } else {
        throw new Error ('File not found' + OccurenceFile)
    }
        

}

const trimCoremaOccurenceFile = (OccurenceFile) => {

    if (fs.existsSync(OccurenceFile)) {
        // 1. let igjennom resourcerelationship og plukk ut alle MUSI Tnr. og alle UUIDer
        const readInterface = readline.createInterface({
            input: fs.createReadStream(OccurenceFile),
            console: false
        })
        
        const writeStream = fs.createWriteStream(coremaOccurenceOutFile);
        const pathName = writeStream.path;

        let count = 0  
        const coremaOcurrenceHeader = 'id' + '\t' + 'catalogNumber' + '\t' + 'organismID'+ '\t' + 'preparations'
        // Les MUSIT fila linje for linje
        readInterface.on('line', function(line) {
            count++
            if (count === 1) {
                // header row 
                console.log(coremaOcurrenceHeader);
                Header = line.split('\t')
                indexOfID = Header.indexOf('id')
                indexOfcatalogNumber = Header.indexOf('catalogNumber')
                indexOforganismID = Header.indexOf('organismID')
                indexOfpreparations = Header.indexOf('preparations')
            

            } else {
                item = line.split('\t')
                
                // write the item to a new file
                let tsvItem = item[indexOfID] + '\t' + item[indexOfcatalogNumber] + '\t' + item[indexOforganismID] + '\t' + item[indexOfpreparations]
                tsvItems =tsvItems + tsvItem + '\n'
                item.length = 0


            }

        }).on('close', function () {
    
            writeStream.write(`${coremaOcurrenceHeader}\n`)
            writeStream.write(`${tsvItems}\n`)
            writeStream.end()
            
            writeStream.on('finish', () => {
                console.log(`wrote all the array data to file ${pathName}`);
                tsvItems = ''
                });
        
                // handle the errors on the write process
            writeStream.on('error', (err) => {
                console.error(`There is an error writing the file ${pathName} => ${err}`)
            });
        })


    } else {
        throw new Error ('File not found' + OccurenceFile)
    }

}


const getRelationshipData = (resourcerelationship) => {
    if (fs.existsSync(resourcerelationship)) {
        // coremaFileContent = det som skal sorteres, 
        let coremaFileContent = fs.readFileSync(resourcerelationship,'utf8');
        arrayOfContent = coremaFileContent.split('\n')
        coremaFileContent = '' // tøm variabel

        // 1. let igjennom resourcerelationship og plukk ut alle MUSI Tnr. og alle UUIDer
        const readInterface = readline.createInterface({
            input: fs.createReadStream(resourcerelationship),
            console: false
        })
        
        const writeStream = fs.createWriteStream(coremaOutFile);
        const pathName = writeStream.path;

        let count = 0  
        const coremaHeader = 'UUID' + '\t' + 'MusitNo'
        // Les MUSIT fila linje for linje
        readInterface.on('line', function(line) {
        
            count++
            if (count === 1) {
                // header row 
                console.log(coremaHeader);
                Header = line.split('\t')
                indexOfMusitNo = Header.indexOf('relatedResourceID')
                indexOfID = Header.indexOf('id')

            } else {
                if(line.indexOf(urnPrefix)> -1){
                item = line.split('\t')
                
                // write the item to a new file
                let tsvItem = item[indexOfID] + '\t' + item[indexOfMusitNo]
                tsvItems =tsvItems + tsvItem + '\n'
                item.length = 0
                // console.log(tsvItems);

                }


            }
        }).on('close', function () {
 
            writeStream.write(`${coremaHeader}\n`)
            writeStream.write(`${tsvItems}\n`)
            
            writeStream.end()
            writeStream.on('finish', () => {
                console.log(`wrote all the array data to file ${pathName}`);
                tsvItems = ''
                arrayOfContent.length = 0
                });
        
                // handle the errors on the write process
            writeStream.on('error', (err) => {
                console.error(`There is an error writing the file ${pathName} => ${err}`)
            });
        })

    } else {
        throw new Error ('File not found' + resourcerelationship)
    }




}


const addCoremaData = (musitFile, urnPrefix) => {
    if (fs.existsSync(coremaFile)) {
        // coremaFileContent = det som skal sorteres, 
        let coremaFileContent = fs.readFileSync(coremaFile,'utf8');
        arrayOfContent = coremaFileContent.split('\n')
        coremaFileContent = '' // tøm variabel
    } else {
        throw new Error ('File not found ' + coremaFile)
    }

    if (fs.existsSync(musitFile)) {       
        const writeStream = fs.createWriteStream(musitOutFile);
        const pathName = writeStream.path;
        
        const readInterface = readline.createInterface({
            input: fs.createReadStream(musitFile),
            console: false
        })

        let count = 0  
        // Les MUSIT fila linje for linje
        readInterface.on('line', function(line) {
        
            count++
            if (count === 1) {
                // header row 
                Header =  line.split('\t')
                // legg til felt fr coremaUUID
                Header.push('coremaUUID')
                indexOfMusitNo = Header.indexOf('catalogNumber')
                tsvHeader = Header.join('\t')

            } else {
                item = line.split('\t')
                let MusitNo = urnPrefix + item[indexOfMusitNo]
                // leter i resourcerelationship.txt etter MUSIT nummer og returnerer UUID
                for (i = 0; i < arrayOfContent.length; i++) {
                   if ( arrayOfContent[i].indexOf(MusitNo)> - 1) {
                        tempResults = arrayOfContent[i]
                        tempResults = tempResults.split('\t')
                        console.log(i);
                        // add this to the item 
                        item.push(tempResults[0])
                        // write the item to a new file
                        let tsvItem = item.join('\t')
                        tsvItems =tsvItems + tsvItem + '\n'
                        break; 
                    }

                }

                // hvis vi fikk treff, så bruk UUID til å finne coremaNo
                // if (tempResults) {
                //    UUID = tempResults.split('\t')
                //     console.log(UUID[0]);
                //     for (i = 0; i < arrayOfContent.length; i++) {
                //         if ((arrayOfContent[i].indexOf(UUID[0])> - 1) && (arrayOfContent[i].indexOf('urn:catalog:O:DP:O-DP-')> - 1)) {
                //             results = results + arrayOfContent[i] + '\n';
                //             break; 
                //         }
                //     }
                // tempResults.length = 0 // tøm array
                // UUID.length = 0
                // }
                
            }
        }).on('close', function () {
            const resultsAndLine = {results, count }  
            writeStream.write(`${tsvHeader}\n`)
            writeStream.write(`${tsvItems}\n`)
            writeStream.end()
            writeStream.on('finish', () => {
                console.log(`wrote all the array data to file ${pathName}`);
                });
        
                // handle the errors on the write process
            writeStream.on('error', (err) => {
                console.error(`There is an error writing the file ${pathName} => ${err}`)
            });

            // console.log(results);
            // console.log('Dette var resultatene');    
            // callback(undefined, resultsAndLine)
        })
    } else {
        throw new Error ('File not found ' + musitFile)
    }
}

// skal brukes
// lager fra corema occurance et objekt med key:value, der key er orrguuid, trimmer også bort unødige felter
const makeOccuranceFileObject = (occuranceFile) => {
    let occuranceObjekt = {}
    let occuranceData = ''
    let occuranceArray = []
    let valueItem = ''
    let headerRow = []
    let indexArray = []
    let orgUuuidPos = ''
    // const indexArray = [0,8,9,15,17,24,25,26,27,28,29,30,31,34,35,3,40,44,45,46,47,48,49,50,51]
    const titleArray = ["institutionCode","collectionCode","ownerInstitutionCode","basisOfRecord","informationWithheld","materialSampleID","occurrenceID","catalogNumber","recordNumber","recordedBy","sex","lifeStage","preparations","disposition","associatedMedia","organismID","eventDate","continent","waterBody","country","countryCode","stateProvince","county","locality","minimumElevationInMeters","maximumElevationInMeters","decimalLatitude","decimalLongitude","geodeticDatum","coordinateUncertaintyInMeters","coordinatePrecision","identifiedBy","dateIdentified","identificationQualifier","typeStatus","scientificNameID","scientificName","kingdom","class","order","family","genus","specificEpithet","infraspecificEpithet"]
    const orgUUIDpos = 23 // organismUUID har posisjon 23 
    if (fs.existsSync(occuranceFile)) {
        occuranceData = fs.readFileSync(occuranceFile,'utf8');
    } else {
        console.log(chalk.red('File not found:' + occuranceFile ));
        return
    }
    occuranceArray = occuranceData.split('\n')
    headerRow = occuranceArray[0].split('\t')
    // console.log(headerRow);
    // finn posisjonen til hvert element i titleArray
    titleArray.forEach(element => {
        tempEl = element
        for (let index = 0; index < headerRow.length; index++) {
            if (tempEl === headerRow[index]) {
                indexArray.push(index)
                if(tempEl === 'organismID') {
                    orgUuuidPos = index
                }    
            }
        }
    });
    
    // gjør hver linje av fila til et objekt key:organismUUID og value: er resten av linja
    
    for (let index = 0; index < occuranceArray.length; index++) {
        const element = occuranceArray[index];
        tempArray = element.split('\t')
        const orgUUID =  tempArray[orgUuuidPos]
        let valueItem = []
            //https://stackoverflow.com/questions/33211799/filter-array-based-on-an-array-of-index
            valueItem.push(indexArray.map((item) => tempArray[item]))
        // assing to object on key:value per line
        occuranceObjekt[orgUUID] = valueItem
        
        
        
    }
    // console.log(occuranceObjekt);
    const dataString = JSON.stringify(occuranceObjekt)
    saveVariableToFile(dataString, 'OccuranceObject.txt', testPath)
}


// megre 2 object that have the same key
// https://stackoverflow.com/questions/33850412/merge-javascript-objects-in-array-with-same-key
const getMergedObjs = (...objs) => Object.fromEntries(Object.entries([{},...objs].map((e,i,a) => i ? Object.entries(e).map(f => (a[0][f[0]] ? a[0][f[0]].push(...([f[1]].flat())) : (a[0][f[0]] = [f[1]].flat()))) : e)[0]).map(e => e.map((f,i) => i ? (f.length > 1 ? f : f[0]) : f)));



// Nei? legger til perparation data til corema fila
// AddPreparationToCoremaOUT(coremaOccurenceOutFile, fileList[0].coremaFiles[5], 'utfil.txt')

// A. gjør om occurancefila til et objekt
// makeOccuranceFileObject(OccurenceFile)

// 2. add relationship uuids tooccurance file
// mergeOccurencesPosts(OccurenceFile)

// 3. Hvis det er flere UUIDer lagret i første kollonne, vil dette sortere disse alfabetisk
// sortCoremaOut(coremaOccurenceOutFile)

// nei?
// addCoremaData(musitFile, urnPrefix)

// Nei? add UUIDs to CoremaOccurenceFile
// getRelationshipData(resourcerelationship)

// 1. removes unwanted data from the corema occurence file
// trimCoremaOccurenceFile(OccurenceFile)

//3, lager et objekt der alle hendelses UUIDer blir koblet mot organisme UUID, forusetter at getRelationshipDAta() har blitt kjørt
// makeOrganimsUUIDobjekt(coremaOccurenceOutFile,fileList[0].coremaFiles[5])

// 2, legger til organisme UUID til en av coremas mange filer
// addOrgamismUUIDtoFile(orgUUIDobjekt,fileList[0].coremaFiles[3])

//***********************************************
// Sette sammen de forskjellige coremafilene og koble de mot orgUUID

// 1. removes unwanted data from the corema occurence file
// trimCoremaOccurenceFile(OccurenceFile)


// 2. add relationshpi uuids tooccurance file
// mergeOccurencesPosts(OccurenceFile)

// 2b. Hvis det er flere UUIDer lagret i første kollonne, vil dette sortere disse alfabetisk
// sortCoremaOut(coremaOccurenceOutFile)

// 3. add UUIDs to CoremaOccurenceFile
// getRelationshipData(resourcerelationship)

//4. lager et objekt der alle hendelses UUIDer blir koblet mot organisme UUID, forusetter at getRelationshipDAta() har blitt kjørt
// loop alle corema filene
// makeOrganimsUUIDobjekt(coremaOccurenceOutFile,fileList[0].coremaFiles[5])

//**************************************************
// Sette sammen CoremaOccurenceFile med data fra de andre coremafilene

// A. gjør om occurancefila til et objekt
// makeOccuranceFileObject(OccurenceFile)

// merg objectes together that have indentical  keys
// getMergedObjs(a,b,c); 