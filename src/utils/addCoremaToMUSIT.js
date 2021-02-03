const readline = require('readline');
const fs = require('fs');
const fileList = require('./fileList');

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

let arrayOfContent = [];
let results = '';
let tempResults = '';
let UUID = [];
let tsvItems = '';
let tsvHeader = '';
let urnPrefix = 'urn:catalog:O:V:';
const folderPath = 'src/data/test/'




// Sorter en array av arrays på en bestemt index
const sortArray = (inputArray, index) => {
    // Overskriftsraden puttes i en egen array
    const headerArray = inputArray.slice(0,1)
    
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



const saveDataToFile = (data, fileName, filePath) => {
    console.log('skriver til fil');
    let tsvItem = ''
    fileName = filePath + fileName
    // gjør array om til string
    for (let index = 0; index < data.length; index++) {
    tsvItem = data[index].join('\t')
    tsvItems =tsvItems + tsvItem + '\n'
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


const searchAddDatafromDifferntFiles = (tilFil, fraFil, OutFile) => {
    fraFil = folderPath + fraFil + '.txt'
    if (fs.existsSync(fraFil)) {
        let fraFilContent = fs.readFileSync(fraFil,'utf8');
        fraArray = fraFilContent.split('\n')
        fraFilContent = '' // tøm variabel
        // get index for 'preparationMaterials', 'preparedBy' , 'preparationDate
        let tempHeader = fraArray[0].split('\t')
        indexOfpreparationMaterials = tempHeader.indexOf('preparationMaterials')
        indexOfpreparedBy = tempHeader.indexOf('preparedBy')
        indexOfpreparationDate = tempHeader.indexOf('preparationDate')
        tempHeader.length = 0
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
        // Les MUSIT fila linje for linje
        readInterface.on('line', function(line) {
            count++
            if (count === 1) {
                // header row 
                Header =  line.split('\t')
                // legg til felt fr coremaUUID
                Header.push('preparationMaterials', 'preparedBy' , 'preparationDate')
                indexOfId = Header.indexOf('id')
                tsvHeader = Header.join('\t')
            } else {
                item = line.split('\t')
                for (i = 0; i < fraArray.length; i++) {

                // https://stackoverflow.com/questions/237104/how-do-i-check-if-an-array-includes-a-value-in-javascript/25765186#25765186
                // hvis ID fra fromFile fins i CoremaOccurance file så..    
                    if (!!~fraArray[i].indexOf(item[indexOfId])> - 1) {
                        tempResults = fraArray[i]
                        tempResults = tempResults.split('\t')
                            // If feltet er tomt bruk N/A i stedet
                            a = (fraArray[i][2] ? fraArray[i][2] : 'N/A');
                            b = (fraArray[i][3] ? fraArray[i][3] : 'N/A');
                            c = (fraArray[i][4] ? fraArray[i][4] : 'N/A');
                        // add this to the item 
                        item.push(tempResults[0])
                        // write the item to a new file
                        let tsvItem = item.join('\t')
                        tsvItems =tsvItems + tsvItem + '\n'
                        tempResults.length = 0


                    }
                }
            }


        })


    } else {
        throw new Error ('File not found ' + musitFile)
    }
}

const OLDsearchAddDatafromDifferntFiles = (coremaOccurenceOutFile, coremaDataFile) => {
    let fraArray = ''
    let tilArray = ''
    let tempArray = ''
    // 1. les den sammensatte Coremafila inn i minne
    if (fs.existsSync(coremaOccurenceOutFile)) {
        // coremaFileContent = det som skal sorteres, 
        let coremaFileContent = fs.readFileSync(coremaOccurenceOutFile,'utf8');
        tempArray = Papa.parse(coremaFileContent)
        tilArray = tempArray.data
        // Fjern tomme felter i array
        tilArray = tilArray.filter(Boolean)
        tempArray.length = 0

    } else {
        throw new Error ('File not found' + coremaOccurenceOutFile)
    }
    // 2. les fil vi skal ha data fra inn i minne
    const coremaPreparationFile = folderPath + coremaDataFile + '.txt'
    if (fs.existsSync(coremaPreparationFile)) {
        // coremaFileContent = det som skal sorteres, 
        let coremaFraFileContent = fs.readFileSync(coremaPreparationFile,'utf8');
        tempArray = Papa.parse(coremaFraFileContent)
        fraArray = tempArray.data
        // Fjern tomme felter i array
        fraArray = fraArray.filter(Boolean)
        coremaFraFileContent = '' // tøm variabel
        tempArray.length = 0
    } else {
        console.log(coremaPreparationFile);
        throw new Error ('File not found' + coremaPreparationFile)
    }
    // 3. søk igjennom tilfila (1.) etter mathcer basert på frafila (2)
    // 3.1 finn kollonnen som inneholder ID som vi skal bruke til å matche søk i frafila
    let indexOfId = fraArray[0].indexOf("id")
    // 4. legg dataene til i tilfila
    // 4.1 legg til header row
    tilArray[0].push('preparationMaterials', 'preparedBy' , 'preparationDate') 
    // 4.2 søk et treff
    for (let i = 1, len = fraArray.length; i < len; i++) {
        count++
            // console.log(fraArray[i][1]);
        // https://stackoverflow.com/questions/237104/how-do-i-check-if-an-array-includes-a-value-in-javascript/25765186#25765186
        try {
            if (count === 2){ //  les forste linje med data inn i minne
                lastItem = fraArray[i]
            
                if (!!~tilArray[i][0].indexOf(fraArray[i][indexOfId])> -1) {
                    // If feltet er tomt bruk N/A i stedet
                    a = (fraArray[i][2] ? fraArray[i][2] : 'N/A');
                    b = (fraArray[i][3] ? fraArray[i][3] : 'N/A');
                    c = (fraArray[i][4] ? fraArray[i][4] : 'N/A');
                    // sjekke i til array om det fins noe der fra før og merge dette

                    tilArray[i].push(a,b,c);
                    // legg til 
                    
                } else {
                    console.log('Disse bomma');
                    console.log(fraArray[i]);
                }
            }
        } catch (error) {
            console.log(error);
            console.log(i);
            console.log(tilArray[i]);
            console.log(fraArray[i]);
            break
        }
    }
    saveDataToFile(tilArray, testFile, testPath)
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
                    lastItem[indexOfID] = '[' + lastItem[indexOfID] + ' | ' +  currentItem[indexOfID] + ']';
                    lastItem[indexOfcatalogNumber] = '[' + lastItem[indexOfcatalogNumber] + ' | ' +  currentItem[indexOfcatalogNumber] + ']';
                    lastItem[indexOfpreparations] = '[' + lastItem[indexOfpreparations] + ' | ' +  currentItem[indexOfpreparations] + ']';

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

searchAddDatafromDifferntFiles(coremaOccurenceOutFile, fileList[0].coremaFiles[5], 'utfil.txt')
// mergeOccurencesPosts(OccurenceFile)
// addCoremaData(musitFile, urnPrefix)
// getRelationshipData(resourcerelationship)
// trimCoremaOccurenceFile(OccurenceFile)