const readline = require('readline');
const fs = require('fs');
const fileList = require('./fileList');
const columns = require('./stitchObject')
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

const coreamColumnsIWant = ['organismID', 'id', 'modified', 'institutionCode', 'collectionCode', 'catalogNumber',  'recordedBy', 'eventDate', 'continent', 'waterBody', 'country', 'stateProvince', 'county', 'locality', 'decimalLatitude', 'decimalLongitude', 'identifiedBy', 'dateIdentified', 'typeStatus', 'scientificName', 'kingdom', 'class', 'order', 'family', 'genus',  'specificEpithet', 'infraspecificEpithet', 'verbatimTaxonRank']
const musitColunmsIWant = []
const coremaCollectionsToMerge = ['dna_entomologi', 'dna_fungi_lichens' , 'dna_karplanter']


const prepareCoremaOccunaceFile = async (occuranceFile, outFile) => {
    return new Promise(function(resolve, reject) {
        try {
            console.log(chalk.green('1. starting:  prepareCoremaOccunaceFile :' + occuranceFile ));
            const readInterface = readline.createInterface({
                input: fs.createReadStream(occuranceFile),
                console: false
            })

            const writeStream = fs.createWriteStream(outFile);
            const pathName = writeStream.path;
            const totHeader = columns[0].totalColumnListFinal.join('\t')
            // console.log(totHeader);
            writeStream.write(columns[0].columnListCorema.join('\t'))
            // writeStream.write(totHeader)
            let count = 0  
            // mapping object for the order of columns
            let indexObj = {}
            for (let index = 0; index < columns[0].columnListCorema.length; index++) {
                indexObj[columns[0].columnListCorema[index]] = index
            }
            // push array with dummy data to create the same amount of couluns in Corema file as it is in Musit file
            let pushArray = []
            for (let k = 0; k < columns[0].columnsToAddToCoremaFile.length; k++) {
               const element = columns[0].columnsToAddToCoremaFile[k]
               pushArray.push(indexObj[element])
            }
            let mapArray = []
            readInterface.on('line', function(line) {
                count++
                let item = []
                let row = []

                if(count === 1){
                   
                    //  make an array with index of where the columns should be
                    item = line.split('\t')
                    for (let i = 0; i < columns[0].columnListCorema.length; i++) {
                        const element = columns[0].columnListCorema[i]
                        for (let index = 0; index < item.length; index++) {
                            if( element === item[index])
                            mapArray.push(index)
                        } 
                    }
                    item.length = 0
                } else {
                    item = line.split('\t')

                    // rearrange and reduce CoremaOccurrance file
                    row.push(mapArray.map(i => item[i]))
                    // console.log(pushArray);
                    //push dummy data to line
                    // for (let index = 0; index < pushArray.length; index++) {
                    //     const element = pushArray[index];
                    //     row.splice(element, 0, '')
                    // }
                    row = row.flat()
                    let newLine = row.join('\t')
                    writeStream.write(newLine + '\n')
                    item.length = 0
                    newLine = ''
                }

                // console.log(mapArray);asfd
            }).on('close', function  () {
                writeStream.end()
                writeStream.on('finish', () => {
                    console.log(`wrote all the array data to file ${pathName}`);
                    console.log(chalk.blue('1. done:  prepareCoremaOccunaceFile'));
                    resolve(outFile)
                    });
                // handle the errors on the write process
                writeStream.on('error', (err) => {
                    console.error(`There is an error writing the file ${pathName} => ${err}`)
                });
            })
        } catch (error) {
            reject(new Error(error));
        }
    })
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
            console.log(chalk.green('A. starting:  addOrgIdtoEventFiles'));
            let items = ''
            let itemArry = []

            fraFil = folderPath + fraFil + '.txt'
            let tilFilContent = fs.readFileSync(fraFil,'utf8');
            tilArray = tilFilContent.split('\n')
            tilFilContent = '' // tøm variabel
            const header = 'OrganismUUID' + '\t' + tilArray[0] 
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
            console.log(chalk.blue('A. finnished:  addOrgIdtoEventFiles'));
            console.timeEnd("mergeEventFiles");
            resolve(newFile)
        } catch (error) {
            reject(new Error(error));     
        }
    })
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
                            totElements = totElements + thisElement + '\n' 
                            thisElement = ''  
                            if(eventArray.length < 2){
                                eventArray.length = 0
                            } else {
                                eventArray.splice(0,i) 
                            }
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


const combineCoremaAndMusit = async (coremaCombineFile, MusitOccuranceFile, outFile, path) =>{
    return new Promise(function(resolve, reject) {
        try{
            console.log(chalk.green('6. starting:  combineCoremaAndMusit'));

            // make Musit dat into an array of Arrays
            MusitOccuranceFile = path + MusitOccuranceFile
            let  musitData =  fs.readFileSync(MusitOccuranceFile,'utf8')
            musitData = musitData.split('\n')
            const musitHeader = musitData[0].split('\t')
            const indexOfcatalogNumber = musitHeader.indexOf('catalogNumber')
            let musitDataArray = []
            for (let j = 0; j < musitData.length; j++) {
                musitDataArray.push(musitData[j].split('\t'))
            }
                 // Overskriftsraden puttes i en egen array
                 const headerArray1 = musitDataArray.shift()
                 // Fjern tomme felter i array
                 musitDataArray = musitDataArray.filter(Boolean)
                 // sorts lines alphabethic as string
                 musitDataArray.sort(function(a, b) {
                     return a[indexOfcatalogNumber] - b[indexOfcatalogNumber];
                 });
                 // add header to the top
                //  musitDataArray.unshift(headerArray1)
            
            // make CoremaData into a array of arrays
            coremaCombineFile = path + coremaCombineFile
            let coremaData = fs.readFileSync(coremaCombineFile,'utf8')
            coremaData = coremaData.split('\n')
            const coreamHeader = coremaData[0].split('\t')
            let dummyData = ''
            for (let p = 0; p < coreamHeader.length; p++) {
                dummyData = dummyData + '\t' + 'd'
            }
            const indexOfMusitNo = coreamHeader.indexOf('MusitNo')
            let item = ''
            let items = []
            for (let index = 0; index < coremaData.length; index++) {
                const element = coremaData[index];
                item = element.split('\t')
                items.push(item)
            }
            // fjerne urn:catalog:xxxx: fra musitnummer i coremafila
            for (let n = 0; n < items.length; n++) {
                let element = items[n][indexOfMusitNo];
                if(element)
                {
                    let cleanNo = element.substring(element.lastIndexOf(':')+1)
                    items[n].splice([indexOfMusitNo],1, cleanNo)
                }
            }

            // splits CoremaData in to two arrays, 1. those itmes containing a MUSIT number and 2. those Itmes that does not
            let arrayWithMusitNo = []
            let arrayWithOutMusitNo = []
            for (let i = 0; i < items.length; i++) {
                const element = items[i];

                if(element[indexOfMusitNo]){
                    arrayWithMusitNo.push(items[i])
                } else {
                    arrayWithOutMusitNo.push(items[i]) 
                }
                
            }
                let totData = ''
                let totItem = ''
            // sort array
                // Overskriftsraden puttes i en egen array
            const headerArray = arrayWithMusitNo.shift()
            // Fjern tomme felter i array
            items = arrayWithMusitNo.filter(Boolean)
            // sorts lines alphabethic as string
            arrayWithMusitNo.sort(function(a, b) {
                return a[indexOfMusitNo] - b[indexOfMusitNo];
            });
            // add header to the top
            // arrayWithMusitNo.unshift(headerArray)

            const writeStream = fs.createWriteStream(outFile);
            const pathName = writeStream.path;
            const totHeader = musitHeader.join('\t') + '\t' + coreamHeader.join('\t') + '\n'
            writeStream.write(totHeader)
            // combine Corema with MUSIT
            for (let k = 0; k < musitDataArray.length; k++) {
                for (let l = 0; l < arrayWithMusitNo.length; l++) {
                    if (arrayWithMusitNo[l][indexOfMusitNo] === musitDataArray[k][indexOfcatalogNumber]){
                        // console.log(chalk.yellowBright('yes'));
                        // console.log(arrayWithMusitNo[l][indexOfMusitNo] + ' = ' + musitDataArray[k][indexOfcatalogNumber]);
                        totItem = musitDataArray[k].join('\t') + '\t' + arrayWithMusitNo[l].join('\t')
                        totData = totData + '\n' + totItem
                        writeStream.write(totData)
                        totData = ''
                        totItem = ''
                        arrayWithMusitNo.splice(0,l)
                        break
                    } else {
                        if(musitDataArray[k]){
                            totItem = musitDataArray[k].join('\t') + '\t' + dummyData
                            totData = totData + '\n' + totItem 
                            writeStream.write(totData)
                            totData = ''
                            totItem = ''
                            break
                        }
                    }   
                }
            }
            // add items from Corema File that is not in MUSIT file
           
            for ( let r = 0; r < (arrayWithOutMusitNo.length - 1); r++) {
                if(arrayWithOutMusitNo[r]) {
                totData = '\n' + arrayWithOutMusitNo[r].join('\t')
                writeStream.write(totData)
                totData = ''  
                }
            }
            writeStream.write(totData)

            writeStream.end()
            writeStream.on('finish', () => {
                console.log(`wrote all the array data to file ${pathName}`);
                console.log(chalk.blue('6. finnished:  combineCoremaAndMusit'));
                resolve(outFile) 
                });
            // handle the errors on the write process
            writeStream.on('error', (err) => {
                console.error(`There is an error writing the file ${pathName} => ${err}`)
            });

        } catch (error) {
            reject(new Error(error));
        }
    })
}


const main = async () =>  {
    console.time('Main')
    try { 
        // prepare filse by deleting and add columns
        await prepareCoremaOccunaceFile( OccurenceFile , 'src/data/test/coremaOccurance.txt')


/*
        // add orgUUID to all the eventfiles in corema
        let fileName = ''
        let filB = ''
        let testFile = ''
        const fil0 = await IdAndOrgIDsFile(OccurenceFile, 'src/data/test/IdAndOrgId.txt')
        const filA = await makeOccuranceFileArray(OccurenceFile,  'src/data/test/OrgUUIDCoremaFile.txt')


        // legg tl MUSIT nummer til Coerma fila
        const fil4 = await getRelationshipData(resourcerelationship)
        console.log('fil4: ' +  fil4);
        fileName = await addOrgIdtoMusitFiles(fil0,'coremaStichFile', 'src/data/test/orgUUIDMusit.txt')
        console.log('Eventfil: ' +  fileName);
        testFile = await addEventFileToOccuranceFile(filA, fileName, 'src/data/test/occuranceAndMusitNombers.txt')


        //slå sammen Corema Occurance fil med Eventfiler
        for (let i = 2; i < 6; i++) {
            fileName = await addOrgIdtoEventFiles(fil0,fileList[0].coremaFiles[i], 'src/data/test/orgUUID' + fileList[0].coremaFiles[i] + '.txt')
            console.log('Eventfil: ' +  fileName);
            filB = await addEventFileToOccuranceFile(filA, fileName, 'src/data/test/occuranceAndEvent' + fileList[0].coremaFiles[i] + '.txt')
            // filB = await addEventFileToOccuranceFile(filA, fileName, filB)
            console.log('filB: ' +  filB);
        }

        //combine CoremaCombinedFile with Musit OccuranceFile
        const fileC = await combineCoremaAndMusit(testFile,'src/data/test/karplanter_occurrence.txt', 'src/data/test/totFile.txt', '' )
        

        console.log('fil0: ' +  fil0);
        console.log('filA: ' +  filA);
        console.log('fil4: ' +  fil4);
        console.log('testFile: ' + testFile);
        console.log('fileC: ' +  fileC);


*/

        const fil1 = await trimCoremaOccurenceFile(OccurenceFile)
        const fil2 = await mergeOccurencesPosts(fil1)
        await sortCoremaOut(fil2)
        const fil4 = await getRelationshipData(resourcerelationship)
        const fil4c = await makeOrgUUIDandMusitNoObject(fil4, 'src/data/test/OrgUUIDandMusitNoObject.txt')
        const fil5 = await makeOrganimsUUIDobjekt(fil2, fileList[0].coremaFiles[5])
        const fil5b = await addOrgamismUUIDtoFile(fil5, fil2)
        const fil6 = await makeOccuranceFileObject('src/data/test/occurrence.txt')
 
        const fil7 = await mergeObj(fil6,fil5, 'src/data/test/mergedObjects.txt' )
        const fil8 = await makeMusitNoKeyedObject(fil7,fil4c,'src/data/test/coremaReadyObject.txt' )


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
        console.error(error.name + ': ' + error.message);
    }
    console.timeEnd('Main')
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