const fs = require('fs')
const Papa = require('papaparse')
const chalk = require('chalk');
const clone = require('clone');
const fileList = require('./fileList')

function readFile(fileName) {
    console.log(chalk.redBright('Reading file........'));
    try {
        let heleFila = fs.readFileSync(fileName, 'utf8')
        return heleFila
    } catch (error) {
        console.log(chalk.red(error));
    }
}


function parseFile(file) {
    console.log(chalk.redBright('Parsing........'));
    file = file.replace(/"/g,"") // fjerne " fra felter da dette skaper problemer med parsing
    file = Papa.parse(file, {
        delimiter: "\t",
        newline: "\n",
        quoteChar: '',
        header: false,
    }) // gir arrays med value objects
    return file.data
}


function removeUnusedColumns(OccurrenceFileArray, source){
    console.log(chalk.redBright('removeUnusedColumns........'));
    let propertyArray = []
    let indexArray = []
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
    propertyArray.push(headerFields)
    // lager en mapping array med index til de feltene vi ønsker å beholde, hvis vi ønsker å beholde column 1 og 3, så vil indexArray inneholde [0,2]
    for (let i = 0; i < headerFields.length; i++) {
        indexArray.push(OccurrenceFileArray[0].indexOf(headerFields[i]))
    }
    // Bruker indexArray for å lage en propertyArray med kun de columns som vi er interessert i
    for (let i = 1; i < OccurrenceFileArray.length;   ++i) {
        //https://stackoverflow.com/questions/33211799/filter-array-based-on-an-array-of-index
        propertyArray.push(indexArray.map((item) => OccurrenceFileArray[i][item]))   
    }
    return propertyArray
}


function getMediaHeaders(source) {
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


function addProperties(array) {
    const itemsHeaderToAdd = [ 'associatedMedia', 'organismID', 'itemUUIDs', 'items']
    const itemsToAdd = ['','dummyUUID', '', 'Voucher' ]

    array[0].push(itemsHeaderToAdd)
    array[0] = array[0].flat()
    for (let index = 1; index < array.length; index++) {
        array[index].push(itemsToAdd)
        array[index] = array[index].flat()
    }
    return array
}

// Adding imagae File name to the end of each array, as an object
// {name1.jpg, name2.jpg}
// This is done by  looping trough the media file an matach musitnummer, then exctracting image name
//input, array med objektdata
// output, samme array + image info
async function addMedia (heleFila, mediaFileName, source) {
    console.log(chalk.blue('legger til media fra: ') + mediaFileName)
    const mediaIndexInArry = heleFila[0].indexOf('associatedMedia')
    let mediaFile = readFile(mediaFileName)
        mediaFile = parseFile(mediaFile)
    const headerFields = getMediaHeaders(source)
    let mediaArray = []
    let indexArray = []

      // det skal være litt forskjellig data om det er en MUSIT fil eller en COREMA fil  
    mediaArray.push(headerFields)
    // lager en mapping array med index til de feltene vi øsnker å beholde
    for (let i = 0; i < headerFields.length; i++) {
        indexArray.push(mediaFile[0].indexOf(headerFields[i]))
    }

    for (let i = 1, len = mediaFile.length; i < len; ++i) {
        mediaArray.push(indexArray.map((item) => mediaFile[i][item]))    //https://stackoverflow.com/questions/33211799/filter-array-based-on-an-array-of-index
    }
    // sorter i stigende rekkefølge på musit nummer
    heleFila = heleFila.sort(function(a,b) {return a[0] - b[0];})
    mediaArray = mediaArray.sort(function(a,b) {return a[0] - b[0];})
    
    let wasFound = false
    let startpunkt = 1 // en variabel som brukes for å slippe å starte på begynnelsen av mediafila for hvert søk, 
                        // nå fortsetter vi bare der vi slapp
    let mediaCollection = [] // i Tilfelle en post har flere bilder, legges de i dette arrayet som legges til slimArray

    for (let j = 1, len = heleFila.length; j < len; ++j) {  
        for (let i = startpunkt, len = mediaArray.length; i < len; ++i) {
            if (mediaArray[i][0] === heleFila[j][0]) {    // sjekk om musitnummeret er lik musit nummeret i linja vi leser
            // hvis det er flere bilder av en post, lag en array av linkene
                mediaCollection.push(mediaArray[i][1])
                wasFound = true           
            } else if (wasFound) {
                heleFila[j].splice( mediaIndexInArry,1,mediaCollection )
                // heleFila[j].push(mediaCollection)
                // console.log(heleFila[j]);
                mediaCollection = clone(mediaCollection)
                mediaCollection.length = 0
                wasFound = false
                startpunkt = i
                break
            } else if (+mediaArray[i][0] > +heleFila[j][0]) { //et lite + triks for å få dem til å oppføre seg som tall
                // console.log(mediaArray[i][0] + ' = ' + heleFila[j][0] + ' og i = ' + i);
                startpunkt = i
                break
            }
        }
    }
    headerFields.length = 0
    mediaArray.length = 0
    indexArray.length = 0
    console.log('ferdig med media');
    return heleFila
}


// for recourceRelationship fila må vi bygge om musit nummer fra urn:catalog:O:F:248229 til O-F-248229
function fixMUSITNummer(filAsString){
    const searchRegExp = /urn:catalog:O:V:/g;
    const replaceWith = 'O-V-';
    
    const result = filAsString.replace(searchRegExp, replaceWith);
    // kan brukes når NodeJs bli oppdatert
    // const search = 'urn:catalog:O:F:';
    // const replaceWith = 'O-F-';
    // const result = filAsString.replaceAll(search, replaceWith);
    return result
}


function findAndAddMatch(hayStack, needle, compareColumn, returnColumn, searchCondition = false, replaceOrInsert= 0) {
    console.log(chalk.redBright('Searching.........'));

    const ComparehayStackIndex = hayStack[0].indexOf(compareColumn)
    const CompareNeedleIndex = hayStack[0].indexOf(compareColumn)
    const returnInArry = hayStack[0].indexOf(returnColumn)
     // sorter i stigende rekkefølge på musit nummer

     hayStack = hayStack.sort(function(a,b) {return a[0] - b[0];})
     needle = needle.sort(function(a,b) {return a[0] - b[0];})

     let wasFound = false
     let startpunkt = 1 // en variabel som brukes for å slippe å starte på begynnelsen av mediafila for hvert søk, 
                         // nå fortsetter vi bare der vi slapp
     let CollectionOfMatches = [] // i Tilfelle en post har flere bilder, legges de i dette arrayet som legges til slimArray  && needle[i][CompareNeedleIndex] === searchCondition
 
     for (let j = 1; j < hayStack.length;  ++j) {  
        for (let i = startpunkt; i < needle.length; ++i) {
             if (needle[i][CompareNeedleIndex] === hayStack[j][ComparehayStackIndex]) {    // sjekk om needle er lik hayStack i linja vi leser
             // hvis det er flere bilder av en post, lag en array av linkene
             CollectionOfMatches.push(needle[i][1])
                 wasFound = true           
             } else if (wasFound) {
                 if (CollectionOfMatches.length = 1){
                    hayStack[j].splice( returnInArry,replaceOrInsert,CollectionOfMatches.toString() )
                 } else {
                    hayStack[j].splice( returnInArry,replaceOrInsert,CollectionOfMatches )
                } 
                 // console.log(hayStack[j]);

                 CollectionOfMatches = clone(CollectionOfMatches)
                 CollectionOfMatches.length = 0
                 wasFound = false
                 startpunkt = i
                 break
             } else if (+needle[i][CompareNeedleIndex] > +hayStack[j][ComparehayStackIndex]) { //et lite + triks for å få dem til å oppføre seg som tall
                 // console.log(needle[i][CompareNeedleIndex] + ' = ' + hayStack[j][ComparehayStackIndex] + ' og i = ' + i);
                 startpunkt = i
                 break
             }
         }
     }
     console.log(hayStack[1]);
     console.log(hayStack[30000]);
     return hayStack
}


function findCoremaRelationship(relationshipFileName) {
    console.log(chalk.yellowBright('Finner Relationships for: ' + relationshipFileName));
    let relationshipFile = readFile(relationshipFileName)
        relationshipFile = fixMUSITNummer(relationshipFile)
        relationshipFile = parseFile(relationshipFile)

    // Reduce array to only contain UUIDs
    const idIndexInArry = []
    idIndexInArry.push(relationshipFile[0].indexOf('id'))
    let RelationIDs = [] // 
    for (let i = 1; i < relationshipFile.length; ++i) {
    RelationIDs.push(idIndexInArry.map((item) => relationshipFile[i][item]))    //https://stackoverflow.com/questions/33211799/filter-array-based-on-an-array-of-index
    }

    // Remove duplicates
    RelationIDs = RelationIDs.flat()
    RelationIDs = RelationIDs.sort(function(a,b) {return a[0] - b[0];})
    RelationIDs = Array.from(new Set(RelationIDs)) 
    // Make array of Arrays again
    let uniqueRelationIDs = [['id']]
    for(var i=1; i<RelationIDs.length; i++){
        uniqueRelationIDs.push([RelationIDs[i]]);
    }
    RelationIDs.length = 0
    uniqueRelationIDs = findAndAddMatch(uniqueRelationIDs,relationshipFile, 'id', 'relatedResourceID', 'O-V-' )


return uniqueRelationIDs
}


function findCoremaOccuranceMatch (hayStack, needle, heleFila, searchItems ) {
    console.log(chalk.redBright('Searching.........'));

    const hayStackIndex = hayStack[0].indexOf(searchItems.haystackColumnName)
    const needleIndex = hayStack[0].indexOf(searchItems.haystackColumnName)
    const returnInArry = hayStack[0].indexOf(returnColumn)

    hayStack = hayStack.sort(function(a,b) {return a[hayStackIndex] - b[hayStackIndex];})
    needle = needle.sort(function(a,b) {return a[needleIndex] - b[needleIndex];})

    let wasFound = false
    let startpunkt = 1 // en variabel som brukes for å slippe å starte på begynnelsen av mediafila for hvert søk, nå fortsetter vi bare der vi slapp

    for (let j = 1; j < hayStack.length;  ++j) {  
        for (let i = startpunkt; i < needle.length; ++i) {
            if (needle[i][needleIndex] === hayStack[j][hayStackIndex]) {    // sjekk om needle er lik hayStack i linja vi leser
            CollectionOfMatches.push(needle[i][1])
            startpunkt = i
                break
            } else if (+needle[i][needleIndex] > +hayStack[j][hayStackIndex]) { //et lite + triks for å få dem til å oppføre seg som tall
                startpunkt = i
                break
            }
        }
    }
    return heleFila
}

function getCoremaOccurancesData(heleFila, uniqueRelationIDs, coremaOccuranceFileName) {
    console.log(chalk.redBright('Getting Corema Occurance Data......'));
    const coremaIDs = []    // for those corema-records that are not in musit
    const searchItems = {
        needleColumnName: 'id',
        haystackColumnName: 'id'
    }
    let coremaOccuranceFile = readFile(coremaOccuranceFileName)
    coremaOccuranceFile = parseFile(coremaOccuranceFile)

    heleFila = findCoremaOccuranceMatch (coremaOccuranceFileName, uniqueRelationIDs, heleFila, searchItems )



    return heleFila
}



// main function
const stichFiles = async (MUSITOccurrenceFile, mediaFileName, relationshipFileName,coremaOccuranceFileName, source)  => {

    // 1.1 readfiles
    console.log( 'Working on: ' + MUSITOccurrenceFile);
    let heleFila = readFile(MUSITOccurrenceFile)

    //1.2
    heleFila = parseFile(heleFila)

    //1,3
    heleFila = removeUnusedColumns(heleFila, fileList[i].source)

    //1.4
    heleFila = addProperties(heleFila)

    // 2. MUSIT media
    // ***************************************************************
    if (source === 'musit') {
        try {
            heleFila = await addMedia(heleFila, mediaFileName, source)
        } catch (error) {
            console.log('No media file');
        }
    }

    //3. Add Corema data
    // 3.1
    try {
        console.log('Nå skal vi finne relationship fila: ' + relationshipFileName);
        if (fs.existsSync(relationshipFileName)) {
            uniqueRelationIDs = findCoremaRelationship(relationshipFileName)
          } else {
            console.log('No relationshipfil');
          }
    } catch (error) {
        console.log('No relationship' + error);
    }

    // 3.2 Add Corema Occurance data
    try {
        if (fs.existsSync(relationshipFileName)) {
            heleFila = getCoremaOccurancesData(heleFila, uniqueRelationIDs, coremaOccuranceFileName)
          } else {
            console.log('No Corema Occurance File');
          }
    } catch (error) {
        console.log('No corema occurance fil for: ' + coremaOccuranceFile);
    }



    
}


async function main () {
    const pathToFiles = './src/data/renamed/'
    const fileExtension = '.txt'
    const dnaPrefix = 'dna_'
    // for (i = 1; i < fileList.length; i++) {
        for (i = 1, len = fileList.length; i < 4; i++)  {

        let MUSITOccurrenceFile = pathToFiles + fileList[i].name + '_occurrence' + fileExtension
        let mediaFileName = pathToFiles + fileList[i].name + fileList[i].mediaFile + fileExtension
        let relationshipFileName = pathToFiles + dnaPrefix + fileList[i].name + '_' + fileList[0].coremaFiles[7] + fileExtension
        let coremaOccuranceFileName = pathToFiles + dnaPrefix + fileList[i].name + '_' + fileList[0].coremaFiles[0] + fileExtension
        let source = fileList[i].source
        let fileName = pathToFiles + fileList[i].name + '_occurrence' + fileExtension
        if (fileList[i].source === 'musit'){
            try {
                slimArrayy = await stichFiles(MUSITOccurrenceFile, mediaFileName, relationshipFileName,coremaOccuranceFileName, source )
            } catch (error) {
                console.log(error);
            } 
        }
        console.log(chalk.green('Done with: ' + fileName));
    }
}

main()