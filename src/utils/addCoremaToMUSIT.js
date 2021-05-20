const readline = require('readline');
const fs = require('fs');
const fileList = require('./fileList');
const chalk = require('chalk');
const { resolve } = require('path');

const musitFile = 'src/data/test/karplanter_occurrence.txt';
const coremaFile = 'src/data/test/resourcerelationship.txt';
const OccurenceFile  = 'src/data/test/occurrence.txt';
const musitOutFile = 'src/data/test/karplanter_occurrence_Corema.txt';
const resourcerelationship = 'src/data/test/resourcerelationship.txt';
const coremaOutFile = 'src/data/test/coremaStichFile.txt';
const testPath = 'src/data/test/'
const coremaOccurenceOutFile = 'src/data/test/coremaoccurenceOUT.txt';
const orgUUIDobjekt = 'src/data/test/orgUUIDobjekt.txt'
const folderPath = 'src/data/test/'

const columnsIWant = ['organismID', 'id', 'modified', 'institutionCode', 'collectionCode', 'catalogNumber',  'recordedBy', 'eventDate', 'continent', 'waterBody', 'country', 'stateProvince', 'county', 'locality', 'decimalLatitude', 'decimalLongitude', 'identifiedBy', 'dateIdentified', 'typeStatus', 'scientificName', 'kingdom', 'class', 'order', 'family', 'genus',  'specificEpithet', 'infraspecificEpithet', 'verbatimTaxonRank']
const coremaCollectionsToMerge = ['dna_entomologi', 'dna_fungi_lichens' , 'dna_karplanter']

// Sorts the UUIDS alphabetically in the first column of the file
const sortCoremaOut = async (file) => {
return new Promise(function(resolve, reject) {
    try {
    console.log(chalk.green('3. starting:  sorCoremaOut'));
    let header = ''
    let elements = ''
        let filContent = fs.readFileSync(file,'utf8');
        arrayToSort = filContent.split('\n')
        filContent = '' // tøm variabel
        for (let index = 0; index < arrayToSort.length; index++) {
            let element = arrayToSort[index];
            if(index === 0) {
                header = element
            }
            let parts = element.split('\t')
            let part = parts[0].toString()
            if(part.indexOf('|') > -1) {
                uuidArray = part.split(' | ')
                uuidArray.sort();
                part = uuidArray.join(' | ')
                parts[0] = part
                element = parts.join('\t')
                elements = elements + element + '\n'
                uuidArray.length = 0
            }
            part = ''
            parts.length = 0
        }
        elements = header + '\n' + elements
        fs.writeFileSync(file, elements)
        console.log(chalk.blue('3. done:  sorCoremaOut'));
        resolve(true)
    } catch (error) {
        reject(error);
    }
}) 
}

// Sorter en array av arrays på en bestemt index
const sortArray = async (inputArray, index) => {
    return new Promise(function(resolve, reject) {
        try {
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

    resolve(inputArray)
    } catch (error) {
        reject(error);           
    }
}) 
}

// Tar en fil som består av OrgUUID og MusitNo per linje og gjør det om til et key value object, med orgUUID som key
const makeOrgUUIDandMusitNoObject = async (OrgUUIDMusitNoList, tilFil) => {
    return new Promise(function(resolve, reject) {
        try {
            console.log(chalk.green('3C. starting:  makeMusitNoKeyedObject'));
            let fixedValue = ''
            let keyName = ''
            let organismIdObject = {}
            let fraFilContent = fs.readFileSync(OrgUUIDMusitNoList,'utf8');
            fraArray = fraFilContent.split('\n')
            fraFilContent = '' // tøm variabel
            fraArray = sortArray(fraArray, 0)

            // bygge et objekt med key = organismeUUID value = resourcerelationship UUID
            for (let index = 0; index < fraArray.length; index++) {
                const lineArray = fraArray[index].split('\t');
                // bygg objekt
                    keyName = lineArray[0]
                    // remove urn:catalog: amd replace : with -
                    fixedValue = lineArray[1]
                    fixedValue = fixedValue.replace('urn:catalog:', '')
                    fixedValue = fixedValue.replace(':', '-')
                    fixedValue = fixedValue.replace(':', '-')
                    organismIdObject[keyName] = fixedValue
            }
            fixedValue = ''
            keyName = ''
            fraArray.length = 0
            fs.writeFileSync(tilFil, JSON.stringify(organismIdObject))
            console.log(chalk.blue('3C. Finnished:  makeMusitNoKeyedObject'));
            resolve(tilFil)
        } catch (error) {
            reject(new Error(error));    
        }
    })
}

// lag det totale coremaobjekt om til et objekt som er keyed med musit nummer
const makeMusitNoKeyedObject = async (coremaMergedObject,OrgUUIDMusitNoList, tilFil) => {
    return new Promise(function(resolve, reject) {
        try {
            let items = ''
            let item = ''
            let musitNo = ''
            console.log(chalk.green('8. starting:  makeMusitNoKeyedObject'));
            let coremaTotalObject = fs.readFileSync(coremaMergedObject,'utf8');
            coremaTotalObject = JSON.parse(coremaTotalObject)
            
            let MusitNoList = fs.readFileSync(OrgUUIDMusitNoList,'utf8');
            MusitNoList = JSON.parse(MusitNoList)

            // for (const key in coremaTotalObject) {
            //     if (Object.hasOwnProperty.call(coremaTotalObject, key)) {
            //         const element = coremaTotalObject[key];
            //         item = coremaTotalObject[value]
            //         MusitNoList[element]
                    
            //     }

            for (const [key, value] of Object.entries(coremaTotalObject)) {
                // console.log(key, value)
                musitNo = MusitNoList[key]
                // console.log(musitNo);
                }
            



            fs.writeFileSync(tilFil, items)
            console.log(chalk.blue('8. finnished:  makeMusitNoKeyedObject'));
            resolve(tilFil)
        } catch (error) {
            reject(new Error(error));    
        }
    })
}


// data må være en array of arrays
const saveArrayToFile = async (data, fileName, filePath) => {
    return new Promise(function(resolve, reject) {
        try {
            let tsvItems = '';
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
        resolve(fileName)

        } catch (error) {
            reject(new Error(error));     
        }
    })

}

const saveVariableToFile = (data, FileName, filepath, callback) => {
    let tsvItems = '';
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

const addOrgIdtoMusitFiles = async (IdAndOrgIdfile, fraFil, newFile) => {
    return new Promise(function(resolve, reject) {
        try {
            console.time("mergeEventFiles");
            console.log(chalk.green('A2. starting:  addOrgIdtoMusitFiles'));
            let items = ''
            let itemArry = []

            fraFil = folderPath + fraFil + '.txt'
            let tilFilContent = fs.readFileSync(fraFil,'utf8');
            tilArray = tilFilContent.split('\n')
            tilFilContent = '' // tøm variabel
            const header = 'OrganismUUID' + '\t' + tilArray[0] 
            //remove header
            tilArray.splice(0,1)
            tilArray.sort()
            let coremaOutFileContent = fs.readFileSync(IdAndOrgIdfile,'utf8');
            coremaOutFileArray = coremaOutFileContent.split('\n')
            coremaOutFileContent = '' // tøm variabel

            coremaOutFileArray.splice(0,1)
            coremaOutFileArray.sort()


            
            for (let index = 1; index < tilArray.length; index++) {
                const element = tilArray[index];
                const elements = element.split('\t')
                const IDitem = elements[0]
                for (let i = 1; i < coremaOutFileArray.length; i++) {
                    const coremaElement = coremaOutFileArray[i];
                    const coremaElements = coremaElement.split('\t')
                    if(IDitem === coremaElements[0] ) {
                        items = coremaElements[1] + '\t' + element
                        itemArry.push(items)
                        items = ''
                        // fjern de linjene fra Array som vi allerede har sjekka
                        coremaOutFileArray.splice(0,i)
                        break
                    }
                coremaElements.length = 0
                }
                element.length = 0
            }
            //rewmove duplicates
            let cleanArray = []
            if(fraFil.includes('multimedia')) {
                let last = ''
                
                for (let index = 0; index < itemArry.length; index++) {
                    const element = itemArry[index];
                    const elements = element.split('\t')
                    const now = elements[0]

                    if(now !== last) {
                        cleanArray.push(element)
                    }
                    last = now
                }
            } else {
                cleanArray = itemArry
            }
            cleanArray.unshift(header)
            cleanArray = cleanArray.join('\n')
            // remove trailing linebreaks
            cleanArray = cleanArray.replace(/\n*$/, "");
            cleanArray = cleanArray.trim()
            fs.writeFileSync(newFile, cleanArray)
            itemArry.length = 0
            cleanArray.length = 0
            console.log(chalk.blue('A2. finnished:  addOrgIdtoMusitFiles'));
            console.timeEnd("mergeEventFiles");
            resolve(newFile)
        } catch (error) {
            reject(new Error(error));     
        }
    })
}

const addOrgIdtoEventFiles = async (IdAndOrgIdfile, fraFil, newFile) => {
    return new Promise(function(resolve, reject) {
        try {
            console.time("mergeEventFiles");
            console.log(chalk.green('A. starting:  mergeEventFiles'));
            let items = ''
            let itemArry = []

            fraFil = folderPath + fraFil + '.txt'
            let tilFilContent = fs.readFileSync(fraFil,'utf8');
            tilArray = tilFilContent.split('\n')
            tilFilContent = '' // tøm variabel
            const header = 'OrganismUUID' + '\t' + tilArray[0] 
            tilArray = sortArray(tilArray, 0)

            let coremaOutFileContent = fs.readFileSync(IdAndOrgIdfile,'utf8');
            coremaOutFileArray = coremaOutFileContent.split('\n')
            coremaOutFileContent = '' // tøm variabel

            coremaOutFileArray = sortArray(coremaOutFileArray, 0)


            
            for (let index = 1; index < tilArray.length; index++) {
                const element = tilArray[index];
                const elements = element.split('\t')
                const IDitem = elements[0]
                for (let i = 1; i < coremaOutFileArray.length; i++) {
                    const coremaElement = coremaOutFileArray[i];
                    const coremaElements = coremaElement.split('\t')
                    if(IDitem === coremaElements[0] ) {
                        items = coremaElements[1] + '\t' + element
                        itemArry.push(items)
                        items = ''
                        // fjern de linjene fra Array som vi allerede har sjekka
                        coremaOutFileArray.splice(0,i)
                        break
                    }
                coremaElements.length = 0
                }
                element.length = 0
            }
            //rewmove duplicates
            let cleanArray = []
            if(fraFil.includes('multimedia')) {
                let last = ''
                
                for (let index = 0; index < itemArry.length; index++) {
                    const element = itemArry[index];
                    const elements = element.split('\t')
                    const now = elements[0]

                    if(now !== last) {
                        cleanArray.push(element)
                    }
                    last = now
                }
            } else {
                cleanArray = itemArry
            }
            cleanArray.unshift(header)
            cleanArray = cleanArray.join('\n')
            // remove trailing linebreaks
            cleanArray = cleanArray.replace(/\n*$/, "");
            cleanArray = cleanArray.trim()
            fs.writeFileSync(newFile, cleanArray)
            itemArry.length = 0
            cleanArray.length = 0
            console.log(chalk.blue('A. finnished:  mergeEventFiles'));
            console.timeEnd("mergeEventFiles");
            resolve(newFile)
        } catch (error) {
            reject(new Error(error));     
        }
    })
}

//Add organism UUID to the first column of file
const addOrgamismUUIDtoFile = async (organisemUUIDObjekt, tilFil) => {
return new Promise(function(resolve, reject) {
    try {
        console.log(chalk.green('4B. starting:  addOrgamismUUIDtoFile'));
        console.time("addOrgamismUUIDtoFile");
        let UUIDObjekt = {}
        let item = ''
        let items = ''
        let headerRow = ''
            UUIDObjekt = fs.readFileSync(organisemUUIDObjekt,'utf8');
            UUIDObjekt = JSON.parse(UUIDObjekt)

            let tilFilContent = fs.readFileSync(tilFil,'utf8');
            tilArray = tilFilContent.split('\n')
            tilFilContent = '' // tøm variabel
            tilArray = sortArray(tilArray, 0)
  
        // add orgUUID to each line of tilFile
        for (let index = 0; index < tilArray.length; index++) {
            if(index ===0) {
                headerRow = 'organismUUID' + '\t' + tilArray[0]
            } else {
                const element = tilArray[index].split('\t');
                let objKey = element[0]
                if (objKey.includes('|')) {
                    tempArray = objKey.split('|')
                    objKey = tempArray[0]
                    objKey = objKey.trim()
                }
                item = UUIDObjekt[objKey] + '\t' + tilArray[index] + '\n'
                items = items + item
            }
        }
        items = headerRow + '\n' + items
        fs.writeFileSync(tilFil, items)
        console.log(chalk.blue('4B. finnished:  addOrgamismUUIDtoFile'));
        console.timeEnd("addOrgamismUUIDtoFile");
        resolve(tilFil)
    } catch (error) {
        reject(new Error(error));     
    }
})
}

//lager et objekt som kombinerer organisemUUID med resourceRelationship ID, skal brukes i addOrgamismUUIDtoFile, eventFile = multimedia.txt eller preparation.txt osv
const makeOrganimsUUIDobjekt = async (coremaOccuranceFile) => {
return new Promise(function(resolve, reject) {
    try {
    let tsvItems = '';
    console.log(chalk.green('4. starting:  makeOrganimsUUIDobject'));
    const organismIdObject = {}
    let keyName = ''
    let severalUUIDs = []
 
    let fraFilContent = fs.readFileSync(coremaOccuranceFile,'utf8');
    fraArray = fraFilContent.split('\n')
    fraFilContent = '' // tøm variabel
    fraArray = sortArray(fraArray, 0)
    // bygge et objekt med key = organismeUUID value = resourcerelationship UUID
    for (let index = 0; index < fraArray.length; index++) {
        const lineArray = fraArray[index].split('\t');
        // console.log(lineArray);
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

    const OutFile = testPath + 'orgUUIDobjekt.txt'
    // console.log(organismIdObject);
    fs.writeFileSync(OutFile, JSON.stringify(organismIdObject))
    console.log(chalk.blue('4. finnished:  makeOrganimsUUIDobject'));
    tsvItems = ''
    resolve(OutFile)

    } catch (error) {
        reject(new Error(error));
    }
})
}

// Legger til informasjon fra en Coremafile til  Occurance Fila
const AddPreparationToCoremaOUT = (tilFil, fraFil, OutFile) => {
    let results = '';
    let tempResults = '';
    let tsvHeader = '';

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


const mergeOccurencesPosts = async (OccurenceFile) => {
return new Promise(function(resolve, reject) {
    try {
    console.log(chalk.green('2. starting:  mergeOccurencesPosts'));
    const readInterface = readline.createInterface({
        input: fs.createReadStream(OccurenceFile),
        console: false
    })

    let count = 0  
    let lastItem = ''
    let tsvItems = '';
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

        const data = coremaOcurrenceHeader + '\n' + tsvItems + '\n'
        fs.writeFileSync(coremaOccurenceOutFile, data)
        console.log(chalk.blue('2. done:  mergeOccurencesPosts'));
        tsvItems = ''
        resolve(coremaOccurenceOutFile)
    })
    } catch (error) {
        reject(new Error(error)); 
    }
})     
}

// returns a file that contains Id and OrgID for every line in corema occurancefile
const IdAndOrgIDsFile = async (OccurenceFile, outFile) => {
    return new Promise(function(resolve, reject) {
        try {
            let tsvItems = '';
            console.log(chalk.green('0. starting:  IdAndOrgIDsFile :' + OccurenceFile ));
                const readInterface = readline.createInterface({
                    input: fs.createReadStream(OccurenceFile),
                    console: false
                })
                
                let count = 0  
                const coremaOcurrenceHeader = 'id' + '\t' + 'organismID'
                // Les corema fila linje for linje
                readInterface.on('line', function(line) {
                    count++
                    if (count === 1) {
                        // header row 
                        Header = line.split('\t')
                        indexOfID = Header.indexOf('id')
                        indexOforganismID = Header.indexOf('organismID')
        
                    } else {
                        item = line.split('\t')
                        let tsvItem = item[indexOfID] + '\t' + item[indexOforganismID]
                        tsvItems =tsvItems + tsvItem + '\n'
                        item.length = 0
                    }
        
                }).on('close', function  () {
                    let data = coremaOcurrenceHeader + '\n' + tsvItems
                    // remove trailing linebreaks
                    data = data.replace(/\n*$/, "");
                    data = data.trim()
                    fs.writeFileSync(outFile, data)
                    console.log(chalk.blue('1. done:  IdAndOrgIDsFile'));
                    tsvItems = ''
                    resolve(outFile)
                })
        } catch (error) {
            reject(new Error(error));
        }
    })
}

const  trimCoremaOccurenceFile = async (OccurenceFile) => {
return new Promise(function(resolve, reject) {
    try {
    let tsvItems = '';
    console.log(chalk.green('1. starting:  trimCoremaOccurenceFile :' + OccurenceFile ));
        const readInterface = readline.createInterface({
            input: fs.createReadStream(OccurenceFile),
            console: false
        })
        
        let count = 0  
        const coremaOcurrenceHeader = 'id' + '\t' + 'catalogNumber' + '\t' + 'organismID'+ '\t' + 'preparations'
        // Les MUSIT fila linje for linje
        readInterface.on('line', function(line) {
            count++
            if (count === 1) {
                // header row 
                Header = line.split('\t')
                indexOfID = Header.indexOf('id')
                indexOfcatalogNumber = Header.indexOf('catalogNumber')
                indexOforganismID = Header.indexOf('organismID')
                indexOfpreparations = Header.indexOf('preparations')          

            } else {
                item = line.split('\t')
                let tsvItem = item[indexOfID] + '\t' + item[indexOfcatalogNumber] + '\t' + item[indexOforganismID] + '\t' + item[indexOfpreparations]
                tsvItems =tsvItems + tsvItem + '\n'
                item.length = 0
            }

        }).on('close', function  () {
            const data = coremaOcurrenceHeader + '\n' + tsvItems + '\n'
            fs.writeFileSync(coremaOccurenceOutFile, data)
            console.log(chalk.blue('1. done:  trimCoremaOccurenceFile'));
            tsvItems = ''
            resolve(coremaOccurenceOutFile)
        })
    } catch (error) {
        reject(new Error(error));
    }
})
}

// lager en fil med id (UUID) og MUSIT nummer
const getRelationshipData = async (resourcerelationship) => {
return new Promise(function(resolve, reject) {
    try {
    console.log(chalk.green('3b. starting:  getRelationshipData :' + resourcerelationship ));
    let tsvItems = '';
    let urnPrefix = 'urn:catalog:O:V:';
    let arrayOfContent = [];

    let coremaFileContent = fs.readFileSync(resourcerelationship,'utf8');
    arrayOfContent = coremaFileContent.split('\n')
    coremaFileContent = '' // tøm variabel

    // 1. let igjennom resourcerelationship og plukk ut alle MUSI Tnr. og alle UUIDer
    const readInterface = readline.createInterface({
        input: fs.createReadStream(resourcerelationship),
        console: false
    })
    
    let count = 0  
    const coremaHeader = 'UUID' + '\t' + 'MusitNo'
       // Les MUSIT fila linje for linje
    readInterface.on('line', function(line) {
    
        count++
        if (count === 1) {
            // header row 
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
            }
        }
    }).on('close', function () {
        // fjerne duplikater og sortere dataene
        let tempArray = tsvItems.split('\n')
        let cleanArray = []
        let last = ''
                
        for (let k = 0; k < tempArray.length; k++) {
            const element = tempArray[k];
            const elements = element.split('\t')
            const now = elements[1]

            if(now !== last) {
                cleanArray.push(element)
            }
            last = now
        }
        cleanArray.sort()
        cleanArray = cleanArray.join('\n')
        // remove trailing linebreaks
        cleanArray = cleanArray.replace(/\n*$/, "");
        cleanArray = cleanArray.trim()
        tempArray.length = 0
 
        
        const data = coremaHeader + '\n' + cleanArray
        fs.writeFileSync(coremaOutFile, data)
        console.log(chalk.blue('3b. done:  getRelationshipData'));
        tsvItems = ''
        cleanArray.length = 0
        resolve(coremaOutFile)
    })
    } catch (error) {
        reject(new Error(error)); 
    }
})
}


const addCoremaData = (musitFile, urnPrefix) => {
    let arrayOfContent = [];
    let tsvItems = '';
    let tsvHeader = '';
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
                        tsvItem = item.join('\t')
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


// lager fra corema occurance array med OrgUUID i først kollonne, trimmer også bort unødige felter
const makeOccuranceFileArray = async (occuranceFile, outFile) => {
    return new Promise(function(resolve, reject) {
        try {
        console.log(chalk.green('C. starting:  makeOccuranceFileArray'));
        let occuranceOrgIDArray = []
        let occuranceData = ''
        let occuranceArray = []
        let headerRow = []
        let indexArray = []
        let orgUuuidPos = ''


        const titleArray = ["institutionCode","collectionCode","ownerInstitutionCode","basisOfRecord","informationWithheld","materialSampleID","occurrenceID","catalogNumber","recordNumber","recordedBy","sex","lifeStage","preparations","disposition","associatedMedia","organismID","eventDate","continent","waterBody","country","countryCode","stateProvince","county","locality","minimumElevationInMeters","maximumElevationInMeters","decimalLatitude","decimalLongitude","geodeticDatum","coordinateUncertaintyInMeters","coordinatePrecision","identifiedBy","dateIdentified","identificationQualifier","typeStatus","scientificNameID","scientificName","kingdom","class","order","family","genus","specificEpithet","infraspecificEpithet"]
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
           valueItem.unshift(orgUUID)   
           valueItem =  valueItem.flat()
           valueItem = valueItem.join('\t')
           occuranceOrgIDArray.push(valueItem)
        }
        occuranceOrgIDArray = occuranceOrgIDArray.join('\n')
        // remove trailing linebreaks
        occuranceOrgIDArray = occuranceOrgIDArray.replace(/\n*$/, "");
        occuranceOrgIDArray = occuranceOrgIDArray.trim()
        fs.writeFileSync(outFile, occuranceOrgIDArray)
        console.log(chalk.blue('C. finnished:  makeOccuranceFileArray'));
        resolve(outFile)
        } catch (error) {
            reject(new Error(error));
        }
    })
    }

// legger til data fra coremas mange filer til corema occurance file
const addEventFileToOccuranceFile = async (occuranceFile, eventFile, outFile) => {
    return new Promise(function(resolve, reject) {
        try {
            console.log(chalk.green('B. starting:  addEventFileToOccuranceFile'));
            let occuranceItems = []
            let occuranceElement = []
            let totElements = ''
            let thisElement = ''
            let eventElement = []
            let eventItems = []   
            let dummyElement = ''  

            occuranceData = fs.readFileSync(occuranceFile,'utf8');
            occuranceArray = occuranceData.split('\n')
            occuranceHeader = occuranceArray[0]
            occuranceArray.splice(0,1)
            occuranceArray.sort()

            eventData = fs.readFileSync(eventFile,'utf8');
            eventArray = eventData.split('\n')
            eventHeader = eventArray[0]
            eventArray.splice(0,1)
            eventArray.sort()
            tempEventHeader = eventHeader.split('\t')

            totElements = occuranceHeader + '\t' + eventHeader + '\n'

            for (let j = 1; j < tempEventHeader.length; j++) {
                dummyElement = dummyElement + '\t';
            }
            tempEventHeader.length = 0

            for (let index = 0; index < occuranceArray.length; index++) {
                occuranceElement = occuranceArray[index];
                occuranceItems = occuranceElement.split('\t')
                if(eventArray.length < 1){
                    thisElement = occuranceElement + '\t' + dummyElement
                    totElements = totElements + thisElement + '\n'
                    thisElement = ''
                } else 
                {
                    for (let i = 0; i < eventArray.length; i++) {
                        eventElement = eventArray[i];
                        eventItems = eventElement.split('\t')
                        if(occuranceItems[0] === eventItems[0]){
                            thisElement = occuranceElement + '\t' + eventElement
                            if(eventArray.length > 2){
                                eventArray.length = 0
                            } else {
                                eventArray.splice(0,i) 
                            }
                            
                            totElements = totElements + thisElement + '\n' 
                            thisElement = ''
                            break
                        } 
                        else if (occuranceItems[0] < eventItems[0] ) {
                            thisElement = occuranceElement + '\t' + dummyElement
                            totElements = totElements + thisElement + '\n'
                            thisElement = ''
                            break
                        }
                         else if (i === (eventArray.length -1)) {
                            thisElement = occuranceElement + '\t' + dummyElement
                            totElements = totElements + thisElement + '\n'
                            thisElement = ''
                        }
                    }
                }
            }
            // remove trailing linebreaks
            totElements = totElements.replace(/\n*$/, "");
            totElements = totElements.trim()

            fs.writeFileSync(outFile, totElements)
            console.log(chalk.blue('B. finnished:  addEventFileToOccuranceFile'));
            resolve(outFile)
        } catch (error) {
            reject(new Error(error));
        }
    })
}


// lager fra corema occurance et objekt med key:value, der key er orrguuid, trimmer også bort unødige felter
const makeOccuranceFileObject = async (occuranceFile) => {
return new Promise(function(resolve, reject) {
    try {
    console.log(chalk.green('5. starting:  makeOccuranceFileObject'));
    let occuranceObjekt = {}
    let occuranceData = ''
    let occuranceArray = []
    let valueItem = ''
    let headerRow = []
    let indexArray = []
    let orgUuuidPos = ''
    const outFile = testPath + 'OccuranceObject.txt'
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
    fs.writeFileSync(outFile, JSON.stringify(occuranceObjekt))
    console.log(chalk.blue('5. finnished:  makeOccuranceFileObject'));
    resolve(outFile)
    } catch (error) {
        reject(new Error(error));
    }
})
}


// megre 2 object that have the same key
// https://stackoverflow.com/questions/33850412/merge-javascript-objects-in-array-with-same-key
const mergeObj = async (tilFil, fraFil, outFile) => {
return new Promise(function(resolve, reject) {
    try {
        let obj1 = JSON.parse(fs.readFileSync(tilFil,'utf8'))
        let obj2 = JSON.parse(fs.readFileSync(fraFil,'utf8'))
       
        console.log(chalk.green('6. starting:  mergeObj'));
            for(key in obj1){
                
               if(obj2[key]){
                  console.log(obj2[key]);
                  obj1[key] = obj1[key] + ',' + obj2[key];
                  console.log(obj1[key]);
               };
            };
            fs.writeFileSync(outFile, JSON.stringify(obj1))
            console.log(chalk.blue('6. finnished:  mergeObj'));
            resolve(outFile) 
    } catch (error) {
        reject(new Error(error));
    }
})
}




const main = async () =>  {
    try { 
        // add orgUUID to all the eventfiles in corema
        let fileName = ''
        let filB = ''
        const fil0 = await IdAndOrgIDsFile(OccurenceFile, 'src/data/test/IdAndOrgId.txt')
        const filA = await makeOccuranceFileArray(OccurenceFile,  'src/data/test/OrgUUIDCoremaFile.txt')

        console.log('fil0: ' +  fil0);
        console.log('filA: ' +  filA);
        
        // legg tl MUSIT nummer til Coerma fila
        const fil4 = await getRelationshipData(resourcerelationship)
        console.log('fil4: ' +  fil4);
        fileName = await addOrgIdtoMusitFiles(fil0,'coremaStichFile', 'src/data/test/orgUUIDMusit.txt')
        console.log('Eventfil: ' +  fileName);
        filB = await addEventFileToOccuranceFile(filA, fileName, 'src/data/test/occuranceAndMusitNombers.txt')


        //slå sammen Corema Occurance fil med Eventfiler
        for (let i = 2; i < 6; i++) {
            fileName = await addOrgIdtoEventFiles(fil0,fileList[0].coremaFiles[i], 'src/data/test/orgUUID' + fileList[0].coremaFiles[i] + '.txt')
            console.log('Eventfil: ' +  fileName);
            filB = await addEventFileToOccuranceFile(filA, fileName, 'src/data/test/occuranceAndEvent' + fileList[0].coremaFiles[i] + '.txt')
            console.log('filB: ' +  filB);
        }

        

        console.log('fil0: ' +  fil0);
        console.log('filA: ' +  filA);
        console.log('fil4: ' +  fil4);




        // const fil1 = await trimCoremaOccurenceFile(OccurenceFile)
        // const fil2 = await mergeOccurencesPosts(fil1)
        // await sortCoremaOut(fil2)
        // const fil4 = await getRelationshipData(resourcerelationship)
        // const fil4c = await makeOrgUUIDandMusitNoObject(fil4, 'src/data/test/OrgUUIDandMusitNoObject.txt')
        // const fil5 = await makeOrganimsUUIDobjekt(fil2, fileList[0].coremaFiles[5])
        // const fil5b = await addOrgamismUUIDtoFile(fil5, fil2)
        // const fil6 = await makeOccuranceFileObject('src/data/test/occurrence.txt')
 
        // const fil7 = await mergeObj(fil6,fil5, 'src/data/test/mergedObjects.txt' )
        // const fil8 = await makeMusitNoKeyedObject(fil7,fil4c,'src/data/test/coremaReadyObject.txt' )


        // console.log('fil1: ' +  fil1);
        // console.log('fil2: ' +  fil2);
        // console.log('fil4: ' +  fil4);
        // console.log('fil4c: ' +  fil4c);
        // console.log('fil5: ' +  fil5);
        // console.log('fil5b: ' + fil5b);
        // console.log('fil6: ' +  fil6);     
        // console.log('fil7: ' +  fil7);
        // console.log('fil8: ' +  fil8);

    } catch (error) {
        console.log('her kommer en feil: ');
        console.log(error);
    }
}


main()

//**************************************************
// Sette sammen CoremaOccurenceFile med data fra de andre coremafilene

// A. gjør om occurancefila til et objekt
// makeOccuranceFileObject(OccurenceFile)

// merg objectes together that have indentical  keys
// getMergedObjs(a,b,c); 


// Sette sammen de forskjellige coremafilene og koble de mot orgUUID
// 1. removes unwanted data from the corema occurence file
// returns coremaoccurenceOUT.txt
// trimCoremaOccurenceFile(OccurenceFile).then(result => {
 


// 2b. Hvis det er flere UUIDer lagret i første kollonne, vil dette sortere disse alfabetisk
// returns coremaoccurenceOUT.txt
// await sortCoremaOut(coremaOccurenceOutFile)


//3. add UUIDs to CoremaOccurenceFile
// returns coremaStichFile.txt
// getRelationshipData(resourcerelationship)

//4. lager et objekt der alle hendelses UUIDer blir koblet mot organisme UUID, forusetter at getRelationshipDAta() har blitt kjørt
// loop alle corema filene
// return orgUUIDobjekt.txt
// await makeOrganimsUUIDobjekt(coremaOccurenceOutFile,fileList[0].coremaFiles[5])


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

// 1. removes unwanted data from the corema occurence file, returns coremaOutFile
// trimCoremaOccurenceFile(OccurenceFile)


//2, lager et objekt der alle hendelses UUIDer blir koblet mot organisme UUID, forusetter at getRelationshipDAta() har blitt kjørt
// return orgUUIDobjekt.txt
// makeOrganimsUUIDobjekt(coremaOccurenceOutFile,fileList[0].coremaFiles[5])


// 3, legger til organisme UUID til en av coremas mange filer
// return samme fil som den fikk inn
// addOrgamismUUIDtoFile(orgUUIDobjekt,fileList[0].coremaFiles[3])

//***********************************************