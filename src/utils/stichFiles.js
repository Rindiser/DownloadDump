const fs = require('fs')
const chalk = require('chalk');
const fileList = require('./fileList')
const Papa = require('papaparse')
const clone = require('clone');


const resourceRelationshipHeader = ['id', 'relatedResourceID']



const getColumnName = (fileName) => {
    console.log('fileName: ' + fileName);
    if (fileName === fileList[0].coremaFiles[7]) {
        console.log('fant riktig fil!!');
        return resourceRelationshipHeader
    }

}

function getHeadFields(source) {
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

// for recourceRelationship fila må vi bygge om musit nummer fra urn:catalog:O:F:248229 til O-F-248229
function fixMUSITNummer(string){
    console.log('vi bytter ut urn:catalog:O:F:248229');
    const search = 'urn:catalog:O:F:';
    const replaceWith = 'O-F-';

    const result = string.replaceAll(search, replaceWith);
    return result
}


function readAndParse(fileName) {
    let heleFila = fs.readFileSync(fileName, 'utf8')
     if (fileName === fileList[0].coremaFiles[7]) {
        console.log('vi er på resource rel');
        heleFila = fixMUSITNummer(heleFila)
    }

    heleFila = heleFila.replace(/"/g,"") // fjerne " fra felter da dette skaper problemer med parsing
    heleFila = Papa.parse(heleFila,{header: false, delimiter: "\t"})
    return heleFila
}

async function addPropertyFromCorema(slimArrayy, filMedMerData, source, fileType) {
    console.log(chalk.red('Stich'));
    console.log(chalk.blue('legger til data fra: ') + filMedMerData)

    let columnName = getColumnName(fileType)

    slimArrayy[0].push(columnName[0])   // legg til en column for property'en i overskriften
    let heleFila = readAndParse(filMedMerData)


    let propertyArray = []
    let indexArray = []

    propertyArray.push(columnName)
    // lager en mapping array med index til de feltene vi ønsker å beholde, hvis vi ønsker å beholde column 1 og 3, så vil indexArray inneholde [0,2]
    for (let i = 0; i < columnName.length; i++) {
        indexArray.push(heleFila.data[0].indexOf(columnName[i]))
    }
    // Bruker indexArray for å lage en propertyArray med kun de columns som vi er interessert i
    for (let i = 1; i < Object.keys(heleFila.data).length;   ++i) {
        //https://stackoverflow.com/questions/33211799/filter-array-based-on-an-array-of-index
        propertyArray.push(indexArray.map((item) => heleFila.data[i][item]))   
    }

    // sorter i stigende rekkefølge på musit nummer
    slimArrayy = slimArrayy.sort(function(a,b) {return a[0] - b[0];})
    propertyArray = propertyArray.sort(function(a,b) {return a[0] - b[0];})
    
    //søke etter match mellom poster i forskjellige filer
    let wasFound = false
    let startpunkt = 1 // en variabel som brukes for å slippe å starte på begynnelsen av mediafila for hvert søk, 
                        // nå fortsetter vi bare der vi slapp
    let propertyCollection = [] // i tilfelle en post har flere properties, legges de i dette array som legges til slimArray

    for (let j = 1; j < slimArrayy.length;  ++j) {  
        for (let i = startpunkt; i < propertyArray.length; ++i) {
            if (propertyArray[i][0] === slimArrayy[j][0]) {    // sjekk om musitnummeret er lik musit nummeret i linja vi leser
            // hvis det er flere bilder av en post, lag en array av linkene
                propertyCollection.push(propertyArray[i][1])
                wasFound = true           
            } else if (wasFound) {
                slimArrayy[j].push(propertyCollection)
                console.log(slimArrayy[j]);
                propertyCollection = clone(propertyCollection)
                propertyCollection.length = 0
                wasFound = false
                startpunkt = i
                break
            } else if (+propertyArray[i][0] > +slimArrayy[j][0]) { //et lite + triks for å få dem til å oppføre seg som tall
                // console.log(propertyArray[i][0] + ' = ' + slimArrayy[j][0] + ' og i = ' + i);
                startpunkt = i
                break
            }
        }
    }
    headerFields.length = 0
    propertyArray.length = 0
    indexArray.length = 0
    console.log('ferdig med media');
    return slimArrayy
}

module.exports = { addPropertyFromCorema } 