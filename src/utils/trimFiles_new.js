const fs = require('fs')
const chalk = require('chalk');
const fileList = require('./fileList')
const Papa = require('papaparse')
const clone = require('clone');
const { convertArrayToCSV } = require('convert-array-to-csv');
const stich = require('./stichFiles')

function readAndParse(fileName) {
    let heleFila = fs.readFileSync(fileName, 'utf8')
    heleFila = heleFila.replace(/"/g,"") // fjerne " fra felter da dette skaper problemer med parsing
    heleFila = Papa.parse(heleFila,{header: false, delimiter: "\t"})
    return heleFila
}


function getHeadFields(source, type) {
    if(source === 'musit')
    {
        headerFields = ['CATALOGNUMBER','IDENTIFIER']
    } else if (source === 'corema') {
        headerFields = ['id', 'identifier']
    } else {
        console.log('her skulle vi ikke ha vært');
    }
    return headerFields
}
// Adding imagae File name to the end of each array, as an object
// {name1.jpg, name2.jpg}
// This is done by  looping trough the media file an match musitnummer, then exctracting image name
//input, array med objektdata
// output, samme array + image info
async function addImageName (slimArrayy, mediaFileName, source) {
    console.log(chalk.blue('legger til media fra: ') + mediaFileName)

    slimArrayy[0].push('associatedMedia')   // legg til en column for bilder i overskriften
    let heleFila = readAndParse(mediaFileName)
    
    // let heleFila = fs.readFileSync(mediaFileName, 'utf8')
    // heleFila = heleFila.replace(/"/g,"") // fjerne " fra felter da dette skaper problemer med parsing
    // heleFila = Papa.parse(heleFila,{header: false, delimiter: "\t"})
    
    let headerFields = getHeadFields(source)
    console.log(headerFields);
    let mediaArray = []
    let indexArray = []

      // det skal være litt forskjellig data om det er en MUSIT fil eller en COREMA fil  
    mediaArray.push(headerFields)
    // lager en mapping array med index til de feltene vi øsnker å beholde
    for (let i = 0; i < headerFields.length; i++) {
        indexArray.push(heleFila.data[0].indexOf(headerFields[i]))
    }
    console.log(chalk.green('starter med å lage mediaArray'));
    for (let i = 1, len = Object.keys(heleFila.data).length; i < len; ++i) {
        //https://stackoverflow.com/questions/33211799/filter-array-based-on-an-array-of-index
        mediaArray.push(indexArray.map((item) => heleFila.data[i][item]))   
    }
    console.log(chalk.yellow('ferdig med å lage mediaArray'));
    // sorter i stigende rekkefølge på musit nummer
    slimArrayy = slimArrayy.sort(function(a,b) {return a[0] - b[0];})
    mediaArray = mediaArray.sort(function(a,b) {return a[0] - b[0];})
    
    let wasFound = false
    let startpunkt = 1 // en variabel som brukes for å slippe å starte på begynnelsen av mediafila for hvert søk, 
                        // nå fortsetter vi bare der vi slapp
    let mediaCollection = [] // i Tilfelle en post har flere bilder, legges de i dette objektet som legges til slimArray

    for (let j = 1, len = slimArrayy.length; j < len; ++j) {  
        for (let i = startpunkt, len = mediaArray.length; i < len; ++i) {
            if (mediaArray[i][0] === slimArrayy[j][0]) {    // sjekk om musitnummeret er lik musit nummeret i linja vi leser
            // hvis det er flere bilder av en post, lag en array av linkene
                mediaCollection.push(mediaArray[i][1])
                wasFound = true           
            } else if (wasFound) {
                slimArrayy[j].push(mediaCollection)
                // console.log(slimArrayy[j]);
                mediaCollection = clone(mediaCollection)
                mediaCollection.length = 0
                wasFound = false
                startpunkt = i
                break
            } else if (+mediaArray[i][0] > +slimArrayy[j][0]) { //et lite + triks for å få dem til å oppføre seg som tall
                // console.log(mediaArray[i][0] + ' = ' + slimArrayy[j][0] + ' og i = ' + i);
                startpunkt = i
                break
            }
        }
    }
    headerFields.length = 0
    mediaArray.length = 0
    indexArray.length = 0
    console.log('ferdig med media');
    return slimArrayy
}

// funskjon for å ta ut fjerne colums fra datafilene som vi ikke skal bruke
// input: fileWithPath = filnavne med path som er en dump av databasen i Darwin Core format
// currentColl som er filnavn ut extention, eg. Vasular_o
async function deleteColumns(fileWithPath, source) {   
    console.log( 'Her er Source: ' + source);

    let parseFile = readAndParse(fileWithPath)

    // let parseFile = fs.readFileSync(fileWithPath, 'utf8')
    // parseFile = parseFile.replace(/"/g,"") // fjerne " fra felter da dette skaper problemer med parsing
    // parseFile = Papa.parse(parseFile,{header: false, delimiter: "\t"})
    
    console.log(fileWithPath);
    console.log(Object.keys(parseFile.data).length);
    let indexArray = []
    let slimArrayy = []
    let headerFields = []
    if(source === 'musit')
    {
        headerFields = ['catalogNumber', 'scientificName', 'identifiedBy', 'recordedBy', 'locality', 'county', 'stateProvince', 'country', 'habitat','bioGeoRegion', 'kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'dateIdentified', 'eventDate', 'decimalLongitude', 'decimalLatitude', 'ArtObsID', 'basisOfRecord', 'institutionCode', 'collectionCode']
    } else if (source === 'corema') {
        headerFields = ['id','catalogNumber','scientificName','recordedBy','identifiedBy','locality','county','stateProvince','country','eventDate','kingdom','class','order','family','genus','specificEpithet','infraspecificEpithet','decimalLatitude','decimalLongitude','preparations','disposition','dateIdentified']
    } else {
        console.log('her skulle vi ikke ha vært ' + source);
        return
    }
    // det skal være litt forskjellig data om det er en MUSIT fil eller en COREMA fil  
    slimArrayy.push(headerFields)
    // lager en mapping array med index til de feltene vi øsnker å beholde
    for (let i = 0; i < headerFields.length; i++) {
        indexArray.push(parseFile.data[0].indexOf(headerFields[i]))
    }
    for (let i = 1, len = Object.keys(parseFile.data).length; i < len; ++i) {
        //https://stackoverflow.com/questions/33211799/filter-array-based-on-an-array-of-index
        slimArrayy.push(indexArray.map((item) => parseFile.data[i][item]))   
    }
    indexArray.length = 0
    console.log('ferdig med å slanke');
    return slimArrayy
}

function writeFile (slimArrayy, outfileName, source) {
    const header = getHeadFields(source);
    let csvFromArrayOfArrays = convertArrayToCSV(slimArrayy, {
        header,
        separator: '\t'
      });
    slimArrayy.length = 0 // tøm array for å reducere minnebruk
    console.log(chalk.blue('her kommer replace fra no 1 fil'));
    csvFromArrayOfArrays = csvFromArrayOfArrays.replace(/"/g, "");
    console.log(chalk.blue('her kommer write'));
    fs.writeFileSync( outfileName,csvFromArrayOfArrays, {encoding: 'utf8'})
}

async function fixFile  () {
    console.log(stich);
    // for (i = 1, len = fileList.length; i < len; i++) {
        for (i = 1, len = fileList.length; i < 4; i++)  {
        let fileWithPath = "./src/data/renamed/" + fileList[i].name + '_occurrence.txt'
        let mediaFileName = "./src/data/renamed/" + fileList[i].name + fileList[i].mediaFile +'.txt'
        let filMedMerData = "./src/data/renamed/" + fileList[i].name+ '_' + fileList[0].coremaFiles[7] +'.txt'
        let source = fileList[i].source
        let fileName = "./src/data/renamed/" + fileList[i].name + '_occurrence.txt'
        // Slett de kollonner i occurencefila vi ikke trenger
        let slimArrayy = await deleteColumns(fileWithPath, source)
        // Add image File name from media file
        // slimArrayy = await addImageName(slimArrayy, mediaFileName, source)
       try {
        slimArrayy = await stich.addPropertyFromCorema(slimArrayy, filMedMerData, source, fileList[0].coremaFiles[7])
       } catch (error) {
           console.log(error);
       } 

        writeFile(slimArrayy, fileName, source)
        console.log(chalk.green('Done with: ' + fileName));
    }
}

fixFile()