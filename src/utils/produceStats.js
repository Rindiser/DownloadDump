const readline = require('readline');
const fs = require('fs')
const fileListNhm = require('./fileList')
const fileListTmu = require('./fileListTmu')
const fileListUm = require('./fileListUm')
const statObject2 = require('./statObject')
const chalk = require('chalk');
const clone = require('clone');

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

// objekter for mellomlagring av data, 
// vi bruker array av objekter da dette kan sortes senere[{key:Norge, number:1233},{key:Sverige, number:4558}]
    let country = []
    let totcountry = ""
    let year = []
    let totYear = ""
    let akkumulativYear = []  
    let totAkkumulativYear = ""

    let collectionEvent = {
        date: {},
        collector: {}
    }
    let recordedBy = []
    let totRecordedBy = ""

    let hasCoordinates = [
        {yes:0},
        {no:0}
    ]
    totalhasCoordinates= [
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


// Sorterings funskjon for å sortere objekter 
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
// const calcAkkumulativtYear = (year) => {
//     year.sort((a, b) => (b.year < a.year) ? 1 : (a.year === b.year) ? ((a.number - b.number) ? 1 : -1) : -1 )
//     // akkumulativ samlingsstørrelse
//     let element = 0
//     let lengthTest = "" // for å test om årstallet har 4 nummer, eller blir det problemer
//     for (let i = 0; i < year.length; i++) {
//         lengthTest = ' ' + year[i].year
//         if (isNaN(year[i].number) ) {
//             console.log('nei');
//         }
//         else if (lengthTest.length <= 4) {
//             console.log(year[i].year);
//         } else if (year[i].year > 2021 || year[i].year < 1500) {
//             console.log(year[i].year);
//         } else {
//         element += year[i].number;
//         akkumulativYear[i] = {
//             year: year[i].year,
//             number: element
//             }    
//         }
//     }
//     akkumulativYear.sort((a, b) => (b.akkumulativYear < a.akkumulativYear) ? 1 : (a.akkumulativYear === b.akkumulativYear) ? ((a.number - b.number) ? 1 : -1) : -1 )
//     return akkumulativYear
// }
// Vi tar arrayen Years og legger sammen alle årene så vi får akkumulativ størrelse
// Denne trenger bare kjøre 1 gang etter at alle samlingene er gjennomgått, eller kjøres etter hver samling og skrive over
const addYearsAkkumulativt = (year) => {
    cloneYear = clone(year)
    cloneYear.sort(compareValues('year')) // from small to large
    let element = 0
    let lengthTest = "" // for å test om årstallet har 4 nummer, eller blir det problemer
    let accYear = []
    for (let i = 0; i < cloneYear.length; i++) {
        lengthTest = ' ' + year[i].year
        if (isNaN(year[i].number) ) {
            console.log('nei');
        }
        else if (lengthTest.length <= 4) {
            console.log(year[i].year);
        } else if (year[i].year > 2021 || year[i].year < 1500) {
            console.log(year[i].year);
        } else {
        element += cloneYear[i].number;
        accYear[i] = {
            year: cloneYear[i].year,
            number: element
            }   
        } 
    };
    return accYear

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
    console.log(chalk.red('vi lagrer....'));
    return new Promise((resolve, reject) => {
        // stringify JSON Object' 
        const jsonContent = JSON.stringify(samlingsObj);
        fs.writeFile("./src/data/renamed/" + museum + "statData.json", jsonContent, 'utf8', function (err) {
            if (err) {
                console.log("An error occured while writing JSON Object to File.");
                return console.log(err);
            }
        })
            console.log("JSON file has been saved.");
            resolve('finished');
    })
}

// funskjon for å ta ut data fra filene
// input: fileWithPath = filnavne med path som er en dump av databasen i Darwin Core format
// currentColl som er filnavn ut extention, eg. Vasular_o
async function processLineByLine(fileWithPath, currentColl) {   
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
            countryField = arrayLine.indexOf('country')
            recordedByField = arrayLine.indexOf('recordedBy')
            orderField  = arrayLine.indexOf('order')
            familyField  = arrayLine.indexOf('family')
            genusField  = arrayLine.indexOf('genus')
            yearField = arrayLine.indexOf('eventDate')
            coordinatesLatField = arrayLine.indexOf('decimalLatitude')  
            typeStatusField = arrayLine.indexOf('typeStatus')                      
        }
       if (linesCount !== 0) { // Hopp over tittellinja 
           //Year hent ut år fra en dato
           // datoen må være på dette formatet YYYY-MM-DD f.eks. 1899-07-15
           // Year = tilvekst per år
           let modifiedDate
           if (arrayLine[yearField].includes('-')) {
                modifiedDate = arrayLine[yearField].substring(0,arrayLine[yearField].indexOf('-'))
                year = countOccurrences(year, modifiedDate)
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
        // akkumulativYear = calcAkkumulativtYear(year)
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
        totAkkumulativYear =  addYearsAkkumulativt(totYear)
        totRecordedBy = sumData(totRecordedBy, recordedBy)
        totTypeStatus = sumData(totTypeStatus, typeStatus)
        // summer opp antallet poster med koordinater og uten koordinater
        hasCoordinates = clone(hasCoordinates)
        totalhasCoordinates = sumYesNo(totalhasCoordinates,hasCoordinates)
 
        // lagre tall for enkelt samlinger
        statObject[0].collectionEvent.year = year
        statObject[0].collectionEvent.collector = recordedBy
        statObject[1].geography.country = country
        statObject[1].geography.coordinates = hasCoordinates
        statObject[3].collectionSize = linesCount
        statObject[3].accumulativeSize = akkumulativYear
        statObject[4].taxon = taxon
        statObject[4].typeStatus = typeStatus

        // lagre tall for sum av samlinger          
        totObject[0].collectionEvent.year = totYear
        totObject[0].collectionEvent.collector = totRecordedBy
        totObject[1].geography.country = totcountry
        totObject[1].geography.coordinates = totalhasCoordinates
        totObject[3].collectionSize = totalcollectionSize
        totObject[3].accumulativeSize =totAkkumulativYear
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
            console.log(chalk.blue('her kommer bildene'));
            console.log(hasImage);
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
    museum = museum + '/'
    // her skal den lese igjennom hver fila og returnere poster som er registrert siste 5 år og poster som samle inn siste 5 år
    // https://codepen.io/rustydev/pen/GBKGKG?editors=0010
    try {
    for (i = 1, len = file.length; i < len; i++) {
        // for (i = 1, len = 3; i < len; i++) {
                let currentColl = file[i]
                
                fileWithPath = "./src/data/renamed/" + museum + file[i].name + "_occurrence.txt" 
                mediaFileWithPath = "./src/data/renamed/" + museum + file[i].name + "_media.txt" 
                multiMediaFileWithPath = "./src/data/renamed/" + museum + file[i].name + "_multimedia.txt" 
                // mediaFileWithPath = "./src/data/renamed/karplanter_media.txt" 
                console.log(fileWithPath);

                // test om fila fins før vi prøver å lage stat
                if (fs.existsSync(fileWithPath)) {
                    const samlingsObj = await processLineByLine(fileWithPath, currentColl);
                            await saveObjectToFile(samlingsObj, museum)
                } else {
                    console.log(chalk.red('Denne fila eksisterer ikke: ' + fileWithPath)); 
                }
                if (fs.existsSync(mediaFileWithPath)) {
                const imageResults = await processMediaLineByLine(mediaFileWithPath, currentColl, samlingsObj);   
                    await saveObjectToFile(imageResults, museum)
                } else if (fs.existsSync(multiMediaFileWithPath)) {
                    const imageResults = await processMediaLineByLine(multiMediaFileWithPath, currentColl, samlingsObj);   
                        await saveObjectToFile(imageResults, museum)
                } else {
                    console.log(chalk.red('Denne fila eksisterer ikke: ' + mediaFileWithPath));
                }
        }
        if (i= len) {
        console.log(chalk.blue('vi er ferdige med ' + len + ' filer'));
        }
        
    } catch (e) {
        console.error(e);
    }
}

async function getStatsAllMuseum() {
    await main(fileListUm, 'um')
    await main(fileListTmu, 'tmu')
    await main(fileListNhm, 'nhm')
  }

  getStatsAllMuseum()

// exportere funksjonen ut
module.exports = { 
    getStatsAllMuseum
 } 