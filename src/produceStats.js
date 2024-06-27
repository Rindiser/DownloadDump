// const filePath = '../../test'

// use  this for prod
// const filePath = '../../portal'
const readline = require('readline');
const fs = require('fs')
const path = require('path');


// making the path dynamic so that we easyly can swap between prod and test
const prodOrTest = require('./prodOrTest')
const basePath = prodOrTest()
console.log('basePath: ' + basePath);
const mediaBasePath = path.join(basePath, '/../../')
console.log('mediaBasePath: ' + mediaBasePath);

function combinePath(basePath, filePath) {
    const fullPath = path.join(basePath, filePath);
    const module = require(fullPath);
    return module;
  }
const fileListNhm = combinePath(basePath, '/utils/fileListNhm');
const fileListTmu = combinePath(basePath, '/utils/fileListTmu');
const fileListUm = combinePath(basePath, '/utils/fileListUm');
const fileListNbh = combinePath(basePath, '/utils/fileListNbh');




const statObject2 = require('./statObject')

const chalk = require('chalk');
const clone = require('clone');
const date = new Date()

// sett opp objekter og variable for å holde dataene som søkes opp. 
// Pga mutability problemer så lager vi ekstra objekter for å holde data som 
// vi siden knytter på hoveobjektet

// hovedobjektet der alle data blir lagret
let samlingsObj = {}
let statObject = {}
statObject = clone(statObject2) // deep clone av stat object
let totObject = {}
totObject = clone(statObject2) // deep clone av tot object

let totalcollectionSize = 0

let collectionsIncluded = {
    collectionsIncluded: []
}

// objekter for mellomlagring av data, 
// vi bruker array av objekter da dette kan sortes senere[{key:Norge, number:1233},{key:Sverige, number:4558}]
    let country = []
    let totcountry = ""
    let year = []
    let currentProblems = []
    let totYear = ""
    let akkumulativYear = []  
    let totAkkumulativYear = ""

    let collectionEvent = {
        date: {},
        collector: {}
    }
    let recordedBy = []
    let recordedByField = ""
    let totRecordedBy = ""

    let hasCoordinates = [
        {yes:0},
        {no:0}
    ]
    let totalhasCoordinates= [
        {yes:0},
        {no:0}
    ]
    let hasImage = 0
    let totHasImage = 0
    let taxon = {}
    let order = []
    let family = []
    let genus = []
    let typeStatus = []
    let totTypeStatus = ""
    let countryField = ""
    let catalogNummer = ""


// to reset the avariables between each museum
const resetGlobalVariables = () => {
    samlingsObj = {}; // Empty object
    statObject = clone(statObject2); // Deep clone of statObject2
    totObject = clone(statObject2); // Deep clone of totObject2
    
    totalcollectionSize = 0;
    
    collectionsIncluded = {
        collectionsIncluded: []
    };
    
    country = [];
    totcountry = "";
    currentProblems = []
    year = [];
    totYear = "";
    akkumulativYear = [];
    totAkkumulativYear = "";
    
    collectionEvent = {
        date: {},
        collector: {}
    };
    recordedBy = [];
    recordedByField = ""
    totRecordedBy = "";
    
    hasCoordinates = [
        { yes: 0 },
        { no: 0 }
    ];
    totalhasCoordinates = [
        { yes: 0 },
        { no: 0 }
    ];
    
    hasImage = 0;
    totHasImage = 0;
    
    taxon = {};
    order = [];
    family = [];
    genus = [];
    typeStatus = [];
    totTypeStatus = "";
    countryField = "";
    let catalogNummer = "";
    }
      

// Sorteringsfunskjon for å sortere objekter 
// https://www.sitepoint.com/sort-an-array-of-objects-in-javascript/
function compareValues(key, order = 'asc') {
  return function innerSort(a, b) {
    if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
      // property doesn't exist on either object
      return 0;
    }

    const varA = (typeof a[key] === 'string')
      ? a[key].toUpperCase() : a[key];
    const varB = (typeof b[key] === 'string')
      ? b[key].toUpperCase() : b[key];

    let comparison = 0;
    if (varA > varB) {
      comparison = 1;
    } else if (varA < varB) {
      comparison = -1;
    }
    return (
      (order === 'desc') ? (comparison * -1) : comparison
    );
  };
}


// Teller antall ganger en key er i fila, f.eks. hvor mange ganger er land = Norge, 
// svaret er {key:value}, {Norge: 125}
// obj er et tomt array for å lagre dataene,
// lineField er arrayLine[a], det feltet i linja som inneholder f.eks. land
const countOccurrences = (obj, lineField) => {
    if (typeof lineField === 'string') { // sjekk om feltet inneholder en string
        if (!( lineField in obj)) {
            obj[lineField] = 1;
        } else {
            obj[lineField]++;
        }
    }
    return obj
}

// teller omen post har en egenskap eller ikke
// f.eks. har posten koordinater? 
//returnerer et en array på formmer [{true:125}, {false:455}]
// obj er et array [{true:0}, {false:0}] for å lagre dataene,
// lineField er arrayLine[a], det feltet i linja som inneholder f.eks. land
const occurrencesTrueOrFalse = (obj, lineField) => {   
    if(lineField){
       obj[0].yes++
    } else {
        obj[1].no++
    }
    return obj
}

// gjør om objektene objektet til et array av objekter på formen {key:value}, {Norge: 125} 
// til [{country: 'Norway, antall: 125}]
// obj = objektet som skal transformeres på formen {{key:value}, {key:value}}
// name = keynavnet til value, skal være en string
const transformObject = (obj, name) => {
    obj = Object.entries(obj)
    let hold = []      
    for (let i = 0; i < obj.length; i++) {     
        if (!isNaN(obj[i][1])){     
            hold[i] = {
            [name]: obj[i][0],
            number: obj[i][1]
            }
        } 
    }
    // sorter lista fra flest til minst
    hold.sort((a, b) => (a.number < b.number) ? 1 : (a.number === b.number) ? ((a.name > b.name) ? 1 : -1) : -1 )
    return hold
}

// summere opp samlingsstørrelsen på tvers av samlinger på år
// input year, variabelen der samlingsstørrelsen for en samling er lagret
//output akkumulativYear en array av objekter med samlingstørrelse per år [{year:1850, number:1233}, {year:1851, number: 1255}]
const calcAkkumulativtYear = (year) => {
    year.sort((a, b) => (b.year < a.year) ? 1 : (a.year === b.year) ? ((a.number - b.number) ? 1 : -1) : -1 )
    // akkumulativ samlingsstørrelse
    let element = 0
    let lengthTest = "" // for å test om årstallet har 4 nummer, eller blir det problemer
    const date = new Date()
    let thisYear = date.getFullYear()
    for (let i = 0; i < year.length; i++) {
        lengthTest = ' ' + year[i].year
        if (isNaN(year[i].number) ) {
            console.log('calcAkkumulativtYear() is year a number?' +  chalk.red('nei'));
        }
        else if (lengthTest.length <= 4) {
            console.log(year[i].year);
        } else if (year[i].year > thisYear || year[i].year < 1500) {
            console.log(year[i].year);
        } else {
        element += year[i].number;
        akkumulativYear[i] = {
            year: year[i].year,
            number: element
            }    
        }
    }
    akkumulativYear.sort((a, b) => (b.akkumulativYear < a.akkumulativYear) ? 1 : (a.akkumulativYear === b.akkumulativYear) ? ((a.number - b.number) ? 1 : -1) : -1 )
    return akkumulativYear
}
// Vi tar arrayen Years og legger sammen alle årene så vi får akkumulativ størrelse
// Denne trenger bare kjøre 1 gang etter at alle samlingene er gjennomgått, eller kjøres etter hver samling og skrive over
const addYearsAkkumulativt = (year) => {

    cloneYear = clone(year)
    cloneYear.sort(compareValues('year')) // from small to large
    let element = 0
    let lengthTest = "" // for å test om årstallet har 4 nummer, eller blir det problemer
    let accYear = []

    let thisYear = date.getFullYear()

    for (let i = 0; i < cloneYear.length; i++) {
        lengthTest = ' ' + year[i].year
        if (isNaN(year[i].number) || lengthTest.length <= 4 || year[i].year > thisYear || year[i].year < 1600) {
            continue;
        } else {
            element += cloneYear[i].number;
            accYear[i] = {
                year: cloneYear[i].year,
                number: element
            };   
        } 
    }
    return accYear

}


// put together the suspisious years
const getSuspiciousYears = (museum, currentColl, problemArray) => {
    console.log(chalk.green('from getSuspiciousYears'));
    const cloneproblemArray = clone(problemArray)
    const problemObj = {}
    problemObj[museum] = {}; // Create an empty object for museum key
    problemObj[museum][currentColl] = [cloneproblemArray];
    return problemObj;
}

// add objects so we get totalnumbers for collection
//input [{key: value},{key:value},{key:value}], sortby sier om resultatet skal sortres etter key eller value
const sumData = (arr, currentArr, sortby = 'value') => {
    // Legge sammen antall objekter per land
    if (!arr){
        arr = clone(currentArr)
    } else {
        arr = arr.concat(currentArr)
        arr = clone(arr)
    }

    const res = Object.values(arr.reduce((acc, {number, ...r}) => {
        const key = Object.entries(r).join('-');
        acc[key] = (acc[key]  || {...r, number: 0});
        return (acc[key].number += number, acc);
    }, {}));  
    
    if(sortby === 'value'){
        res.sort((a, b) => (b.number - a.number) ? 1 : (a.number === b.number) ? ((a.key > b.key) ? 1 : -1) : -1 )
    } else {
        res.sort((a, b) => (b.key < a.key) ? 1 : (a.key === b.key) ? ((a.number - b.number) ? 1 : -1) : -1 )  
    }
    return res
}

// sum av poster med koordinater
// input 2 av array av typen [{yes:0},{no:0}], et med totalen og et med enkel samlingen (denne)
// output arrray [{yes:877},{no:9970}]
const sumYesNo = (total,denne) => {
    total[0].yes = total[0].yes + denne[0].yes
    total[1].no = total[1].no + denne[1].no

    return total   
}

// Lagre samlingsobjectet til fil
// input et object
// resultat_ en fil med navn statData.json på JSON format
 async function saveObjectToFile(samlingsObj, museum) {

    return new Promise((resolve, reject) => {
        // stringify JSON Object' 
        const jsonContent = JSON.stringify(samlingsObj);
        
        // fs.writeFile(filePath + "/src/data/" + museum + "statData.json", jsonContent, 'utf8', function (err) {
        fs.writeFile(path.join( basePath, 'data', museum, "statData.json"), jsonContent, 'utf8', function (err) {
            if (err) {
                console.log("An error occured while writing JSON Object to File.");
                return console.log(err);
            }
        })

            resolve('finished');
    })
}

// funskjon for å ta ut data fra filene
// input: fileWithPath = filnavne med path som er en dump av databasen i Darwin Core format
// currentColl som er filnavn ut extention, eg. Vasular_o
async function processLineByLine(fileWithPath, currentColl, collList, museum) {   
    console.log('museum: ' + museum + '     currentColl: ' + chalk.green(currentColl.name))
    let currentProblem = ''
    
   return new Promise((resolve, reject) => {
   const readInterface = readline.createInterface({      
       input: fs.createReadStream(fileWithPath),
       console: false
   })
    
    // for å lagre databasestørrelsen; teller antall linjer i fila
    let linesCount = 0
    // går igennom fila for å finner ut hvilken kolonne de forskejllige temaene står i 
    readInterface.on('line', (line) => {    
        const  arrayLine = line.split("\t"); //lag en arry splittet på tab         
        if (linesCount === 0) {
            catalogNummer = arrayLine.indexOf('catalogNumber')
            countryField = arrayLine.indexOf('country')
            recordedByField = arrayLine.indexOf('recordedBy')
            orderField  = arrayLine.indexOf('order')
            familyField  = arrayLine.indexOf('family')
            genusField  = arrayLine.indexOf('genus')
            if (arrayLine.indexOf('eventDate') !== -1) {
                yearField = arrayLine.indexOf('eventDate');
            } else if (arrayLine.indexOf('year') !== -1) {
                yearField = arrayLine.indexOf('year');
            } else {
                yearField = ''
            }
            
            console.log('index of yearFiled: ' + chalk.blue(yearField));
            coordinatesLatField = arrayLine.indexOf('decimalLatitude')  
            typeStatusField = arrayLine.indexOf('typeStatus')                      
        }
       if (linesCount !== 0) { // Hopp over tittellinja 
           //Year hent ut år fra en dato
           // datoen må være på dette formatet YYYY-MM-DD f.eks. 1899-07-15
           // Year = tilvekst per år

           let modifiedDate = ""
            if (arrayLine[yearField]) {
                if(!fileWithPath.includes('malmer') && !fileWithPath.includes('oslofeltet') && !fileWithPath.includes('fisk') && !fileWithPath.includes('utad') && !fileWithPath.includes('crustacea')  && !fileWithPath.includes('entomology_types')) {
                    if (arrayLine[yearField].includes('-')) {
                        modifiedDate = arrayLine[yearField].substring(0,arrayLine[yearField].indexOf('-'))
                        year = countOccurrences(year, modifiedDate)
                    }
                } else {
                    modifiedDate = arrayLine[yearField]
                }

                const thisYear = date.getFullYear()
                try {
                    if (modifiedDate.length === 4 && (modifiedDate > thisYear || modifiedDate < 1500)) {
                        currentProblem = museum + '\t' + currentColl.name + '\t' + arrayLine[catalogNummer] + '\t' + modifiedDate + '\n';
                        currentProblems.push(currentProblem)
                        console.log('currentProblems:');
                        console.log(currentProblems);
                    }
                } catch (error) {
                        // do nothing
                }
            }

            //land
            country = countOccurrences(country,arrayLine[countryField])          
            //innsamler, her er noen ganger flere innsamlere klumpet sammen, disse må skilles frahverandre
            recordedBy = countOccurrences(recordedBy,arrayLine[recordedByField])       
            //order
            order = countOccurrences(order, arrayLine[orderField])
            // family
            family = countOccurrences(family,arrayLine[familyField])
            // genus
            genus = countOccurrences(genus, arrayLine[genusField])
            // typeStatus
            // Side det er så få poster som er typer bruker vi en if statment til å sjekke om de typer før vi legger de sammen
            // hvis dump fila ikke inneholder typeStatusFelt, ka vi slutte med en gang
            if (arrayLine[typeStatusField] != null){
            // hvis typestatusfeltet er tomt e.g. 'sting' kortere enn 2 bokstaver så avslutter vi
                if (arrayLine[typeStatusField].length > 2){
                typeStatus = countOccurrences(typeStatus, arrayLine[typeStatusField])
                }
            }
            //has coordinates
            hasCoordinates = occurrencesTrueOrFalse(hasCoordinates, arrayLine[coordinatesLatField])
       }     
       linesCount++; // on each linebreak, add +1 to 'linesCount'    
    }).on('close', () => {
        country = transformObject(country, 'country')
        year = transformObject(year, 'year')
        // regn ut samlingsstørrelse på år for currentCollection
        akkumulativYear = calcAkkumulativtYear(year)
        recordedBy = transformObject(recordedBy, 'recordedBy')
        order = transformObject(order, 'order')
        family = transformObject(family, 'family')
        genus = transformObject(genus, 'genus')
        typeStatus = transformObject(typeStatus, 'typeStatus')
        // sett sammen taxon objektet
        taxon.order = order
        taxon.family = family
        taxon.genus = genus

        // lage total object
        totalcollectionSize = totalcollectionSize + linesCount
        // regn ut samlingsstørrelse på for alle samlingene
        // totAkkumulativYear = sumData(totAkkumulativYear, akkumulativYear, 'key')
        totcountry = sumData(totcountry, country)
        totYear = sumData(totYear, year, 'key')
        // totProblemYears = getSuspiciousYears(museum, currentColl.name, currentProblems)

        totAkkumulativYear =  addYearsAkkumulativt(totYear)
        totRecordedBy = sumData(totRecordedBy, recordedBy)
        totTypeStatus = sumData(totTypeStatus, typeStatus)
        // summer opp antallet poster med koordinater og uten koordinater
        hasCoordinates = clone(hasCoordinates)
        totalhasCoordinates = sumYesNo(totalhasCoordinates,hasCoordinates)
 
        // lagre tall for enkelt samlinger
        statObject[0].collectionEvent.year = year
        statObject[0].collectionEvent.suspiciousYears = currentProblems
        statObject[0].collectionEvent.collector = recordedBy
        statObject[1].geography.country = country
        statObject[1].geography.coordinates = hasCoordinates
        statObject[3].collectionSize = linesCount
        statObject[3].accumulativeSize = akkumulativYear
        statObject[4].taxon = taxon
        statObject[4].typeStatus = typeStatus

        // lagre tall for sum av samlinger          
        totObject[0].collectionEvent.year = totYear
        // totObject[0].collectionEvent.suspiciousYears = totProblemYears
        totObject[0].collectionEvent.collector = totRecordedBy
        totObject[1].geography.country = totcountry
        totObject[1].geography.coordinates = totalhasCoordinates
        totObject[3].collectionSize = totalcollectionSize
        totObject[3].accumulativeSize =totAkkumulativYear
        totObject[3].collections = collList
        totObject[4].typeStatus = totTypeStatus

        // hekte på objektene(statObject) for hver samling til et felles objekt(samlingsObj)
        samlingsObj[currentColl.name] = statObject
        samlingsObj['total'] = totObject
        samlingsObj = JSON.parse(JSON.stringify(samlingsObj))
        samlingsObj = clone(samlingsObj) // deep clone

        // tømme objektene før neste runde
        country.length = 0
        recordedBy.length = 0
        year.length = 0
        statObject.length = 0
        taxon.length = 0
        order.length = 0
        family.length = 0
        genus.length = 0
        typeStatus.length = 0
        akkumulativYear.length = 0
        hasCoordinates[0].yes = 0
        hasCoordinates[1].no = 0

        statObject = clone(statObject2) // lager et "nyt" template statObject

        resolve(samlingsObj)


    }).on('error', err => {
        reject(err);
    })
});
}

// funksjon for å ta ut data fra filene
// input: fileWithPath = filnavne med path som er en dump av databasen i Darwin Core format
// currentColl som er filnavn ut extention, eg. Vasular_o
async function processMediaLineByLine(mediaFileWithPath, currentColl, samlingsObj) {   
    return new Promise((resolve, reject) => {
        const readInterface = readline.createInterface({
            input: fs.createReadStream(mediaFileWithPath),
            console: false
        })
        // for å lagre databasestørrelsen; teller antall linjer i fila
        let linesCount = 0
        // går igennom fila for å finner ut hvilken kolonne de forskejllige temaene står i 
        readInterface.on('line', (line) => { 
            const  arrayLine = line.toLowerCase().split("\t"); //lag en array splittet på tab   
            // header row
            if (linesCount === 0) {
                stillImageField = arrayLine.indexOf('identifier')         
            }
            if (linesCount !== 0) { // Etter tittellinja 
                // der det er flere bilder av samme objekt skal vi bare telle en de
                let imageLastLine = ""
                if(imageLastLine !== arrayLine[stillImageField]){
                    hasImage ++ 
                    imageLastLine = arrayLine[stillImageField]
                }
            }  
        linesCount++; // on each linebreak, add +1 to 'linesCount'    

        }).on('close', () => {
            // legge sammen bildene per del samling en totalsum
            totHasImage = totHasImage + hasImage
            samlingsObj[currentColl.name][5].media.stillImage = hasImage
            samlingsObj['total'][5].media.stillImage = totHasImage
            samlingsObj = clone(samlingsObj) // deep clone
            hasImage = 0

            resolve(samlingsObj)
            
        }).on('error', err => {
            reject(err);
        })
    })
}


//hovedtall
const main = async function (file, museum)  {

    // const currentMuseum = museum
    // museum = museum + '/'
    // her skal den lese igjennom hver fil og returnere poster som er registrer
    // https://codepen.io/rustydev/pen/GBKGKG?editors=0010
    try {
        for (i = 1, len = file.length; i < len; i++) {

            if (file[i].name) {
                const currentColl = file[i]
                fileWithPath = path.join( basePath, 'data', museum, currentColl.name + currentColl.occurrenceFileSuffix)

                mediaFileWithPath = path.join( basePath, 'data', museum, currentColl.name + "_media.txt") 
                mediaFileNotMovedMusit = path.join(mediaBasePath, 'musitDumps', currentColl.zipFileName, currentColl.zipFileName + currentColl.mediaFile + '.txt') 
                if(currentColl.source === 'corema'){
                    mediaFileNotMovedCorema = path.join(mediaBasePath, 'coremaDumper_forPortal', currentColl.akronym, 'multimedia.txt')
                }
                
                multiMediaFileWithPath = path.join( basePath, 'data', museum, currentColl.name + "_multimedia.txt") 
    
                // test om fila fins før vi prøver å lage stat
                if (fs.existsSync(fileWithPath)) {
                    // collectionsIncluded.collectionsIncluded[i-1] = file[i].name
                    collectionsIncluded.collectionsIncluded.push(file[i].name)
                    collList = collectionsIncluded
                    const samlingsObj = await processLineByLine(fileWithPath, currentColl, collList, museum);
                    await saveObjectToFile(samlingsObj, museum)
                    
                } else {
                    console.log(chalk.red('Denne fila eksisterer ikke: ' + fileWithPath)); 
                }
                if (fs.existsSync(mediaFileWithPath)) {
                    const imageResults = await processMediaLineByLine(mediaFileWithPath, currentColl, samlingsObj);   
                    await saveObjectToFile(imageResults, museum)
                } else if (fs.existsSync(mediaFileNotMovedMusit)) {
                    const imageResults = await processMediaLineByLine(mediaFileNotMovedMusit, currentColl, samlingsObj);   
                    await saveObjectToFile(imageResults, museum)
                } else if (fs.existsSync(multiMediaFileWithPath)) {
                    const imageResults = await processMediaLineByLine(multiMediaFileWithPath, currentColl, samlingsObj);   
                    await saveObjectToFile(imageResults, museum)
                } else if (fs.existsSync(mediaFileNotMovedCorema)) {
                    const imageResults = await processMediaLineByLine(mediaFileNotMovedCorema, currentColl, samlingsObj);   
                    await saveObjectToFile(imageResults, museum)
                }else {
                    console.log(chalk.red('Denne fila eksisterer ikke: ' + mediaFileWithPath));
                }
            }
        }

    } catch (e) {
        console.error(e);
    }
    console.log('*********************')
    console.log(collectionsIncluded)
    console.log('*********************')

    collectionsIncluded.collectionsIncluded.filter(function(el) {return el} )

}

async function getStatsAllMuseum() {
    try {
        // await main(fileListNbh, 'nbh')
        // resetGlobalVariables()
        // await main(fileListUm, 'um')
        // resetGlobalVariables()
        // await main(fileListTmu, 'tmu')
        // resetGlobalVariables()
        await main(fileListNhm, 'nhm')
        console.log(chalk.green('Finnish with all collections'));
        // return true
    } catch (error) {
        console.log(error);       
    }
}

  getStatsAllMuseum()

// exportere funksjonen ut
module.exports = { 
    getStatsAllMuseum
 } 