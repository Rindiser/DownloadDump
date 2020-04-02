const readline = require('readline');
const fs = require('fs')
const fileList = require('./fileList')
const statObject2 = require('./statObject')
const chalk = require('chalk');
const moment = require('moment');
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
// variabler for å de 5 siste årene
    let thisYear = moment().format('YYYY')
    thisYear = parseInt(thisYear, 10); // gjør om thisYear til et tall
    const lastYear = thisYear - 1
    const twoYearsAgo = thisYear - 2
    const threeYearsAgo = thisYear - 3
    const fourYearsAgo = thisYear - 4


// objekter for mellomlagring av data, 
// vi bruker array av objekter da dette kan sortes senere
    let country = []
    let totcountry = ""
    let year = []
    let akkumulativYear = []  
    let date = [
        {year: thisYear,  antall: 0},
        {year: lastYear,  antall: 0},
        {year: twoYearsAgo,  antall: 0},
        {year: threeYearsAgo,  antall: 0},
        {year: fourYearsAgo,  antall: 0},
    ]
    let collectionEvent = {
        date: {},
        collector: {}
    }
    let recordedBy = []
    let hasCoordinates = [
        {yes:0},
        {no:0}
    ]
    totalhasCoordinates= [
        {yes:0},
        {no:0}
    ]
    let hasImage = 0

    let taxon = {}
    let order = []
    let family = []
    let genus = []
 
   let countryField = ""
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
    // if (name === 'country') {
    //     console.log(name);
        
    // console.log(obj);
    // }

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
//output akkumulativYear en array av objekter med samlingstørrelse per år [{year:1850, number:1233}, {year:181, number: 1255}]
const calcAkkumulativtYear = (year) => {
    year.sort((a, b) => (a.year > b.year) ? 1 : (a.year === b.year) ? ((a.name > b.name) ? 1 : -1) : -1 )
    // akkumulativ samlingsstørrelse
    let element = 0
    for (let i = 0; i < year.length; i++) {
        if (isNaN(year[i].number) ) {
            console.log('nei');
        }
        element += year[i].number;
        akkumulativYear[i] = {
            year: year[i].year,
            number: element
            } 
    }
    return akkumulativYear
}

// add objects so we get totalnumbers for collection
//input [{key: value},{key:value},{key:value}]
const sumData = (arr) => {
    const res = Object.values(arr.reduce((acc, {number, ...r}) => {
        const key = Object.entries(r).join('-');
        acc[key] = (acc[key]  || {...r, number: 0});
        return (acc[key].number += number, acc);
    }, {}));
    res.sort((a, b) => (a.number < b.number) ? 1 : (a.number === b.number) ? ((a.key > b.key) ? 1 : -1) : -1 )
    return res
}

// Lagre samlingsobjectet tl fil
//input et object
// resultat_ en fil med navn statData.json på JSON format
 async function saveObjectToFile(samlingsObj) {
    console.log(chalk.red('vi lagrer....'));
    return new Promise((resolve, reject) => {
        // stringify JSON Object' 
        const jsonContent = JSON.stringify(samlingsObj);
        fs.writeFile("./src/data/renamed/statData.json", jsonContent, 'utf8', function (err) {
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
        }
       if (linesCount !== 0) { // Hopp over tittellinja 
           if (arrayLine[yearField].includes(thisYear)) {
               date[0].antall++
           } else if (arrayLine[yearField].includes(lastYear)) {
               date[1].antall++
           }  else if (arrayLine[yearField].includes(twoYearsAgo)) {
               date[2].antall++
           }  else if (arrayLine[yearField].includes(threeYearsAgo)) {
               date[3].antall++
           }  else if (arrayLine[yearField].includes(fourYearsAgo)) {
               date[4].antall++
           } 

           //Year hent ut år fra en dato
           // hvis datoen er på dette formate 1899-07-15
           let modifiedDate
           if (arrayLine[yearField].includes('-')) {
                modifiedDate = arrayLine[yearField].substring(0,arrayLine[yearField].indexOf('-'))
                year = countOccurrences(year, modifiedDate)
            }
            //land
            country = countOccurrences(country,arrayLine[countryField])          
            //innsamler
            recordedBy = countOccurrences(recordedBy,arrayLine[recordedByField])       
            //order
            order = countOccurrences(order, arrayLine[orderField])
            // family
            family = countOccurrences(family,arrayLine[familyField])
            // genus
            genus = countOccurrences(genus, arrayLine[genusField])
            //has coordinates
            hasCoordinates = occurrencesTrueOrFalse(hasCoordinates, arrayLine[coordinatesLatField])
       }     
       linesCount++; // on each linebreak, add +1 to 'linesCount'    

    }).on('close', () => {
        // console.log('has coordinates ');
        // console.log(hasCoordinates);
            country = transformObject(country, 'country')
            if (!totcountry){
                totcountry = clone(country)
            } else {
            totcountry = totcountry.concat(country)
            totcountry = clone(totcountry)
            totcountry = sumData(totcountry)
            }
            console.log('her er totcountry added together');
            console.log(totcountry);

        year = transformObject(year, 'year')
        // regn ut samlingsstørrelse på år for alle samlinger
        calcAkkumulativtYear(year)
        recordedBy = transformObject(recordedBy, 'recordedBy')
        order = transformObject(order, 'order')
        family = transformObject(family, 'family')
        genus = transformObject(genus, 'genus')
        taxon.order = order
        taxon.family = family
        taxon.genus = genus
        console.log(chalk.yellow(currentColl.name));
        console.log('databasestørrelse ' + linesCount);
 
        // lage total object
        totalcollectionSize = totalcollectionSize + linesCount


        // const sumCoord = () => {
        //     totalhasCoordinates[0].yes = totalhasCoordinates[0].yes + hasCoordinates[0].yes
        //     totalhasCoordinates[1].no = totalhasCoordinates[1].no + hasCoordinates[1].no
        //     console.log(totalhasCoordinates);   
        // } 
        // sumCoord()
            
        statObject[0].collectionEvent.date = date
        statObject[0].collectionEvent.year = year
        statObject[0].collectionEvent.collector = recordedBy
        statObject[1].geography.country = country
        statObject[3].collectionSize = linesCount
        statObject[3].accumulativeSize =akkumulativYear
        statObject[4].taxon = taxon
                    
        totObject[0].collectionEvent.date = date
        totObject[0].collectionEvent.year = year
        totObject[0].collectionEvent.collector = recordedBy
        totObject[1].geography.country = country
        totObject[3].collectionSize = linesCount
        totObject[3].accumulativeSize =akkumulativYear
        totObject[4].taxon = taxon

        samlingsObj[currentColl.name] = statObject
        samlingsObj['total'] = totObject
        samlingsObj = JSON.parse(JSON.stringify(samlingsObj))
        samlingsObj = clone(samlingsObj) // deep clone
        country.length = 0
        recordedBy.length = 0
        year.length = 0
        statObject.length = 0
        taxon.length = 0
        order.length = 0
        family.length = 0
        genus.length = 0

        akkumulativYear.length = 0

        statObject = clone(statObject2) // lager et "nyt" template statObject

        resolve(samlingsObj)


    }).on('error', err => {
        reject(err);
    })
});
}

// funskjone for å ta ut data fra filene
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

            samlingsObj[currentColl.name][5].media.stillImage = hasImage
            samlingsObj = clone(samlingsObj) // deep clone
            resolve(samlingsObj)
            hasImage = 0
        }).on('error', err => {
            reject(err);
        })
    })
}


//hovedtall
const main = async function (file)  {
    // her skal den lese igjennom hver fila og returnere poster som er registrert siste 5 år og poster som samle inn siste 5 år
    // https://codepen.io/rustydev/pen/GBKGKG?editors=0010
    try {
    for (i = 1, len = file.length; i < len; i++) {
        // for (i = 1, len = 3; i < len; i++) {
                let currentColl = file[i]
                
                fileWithPath = "./src/data/renamed/" + file[i].name + "_occurrence.txt" 
                mediaFileWithPath = "./src/data/renamed/" + file[i].name + "_media.txt" 
                // mediaFileWithPath = "./src/data/renamed/karplanter_media.txt" 
                console.log(fileWithPath);

                const samlingsObj = await processLineByLine(fileWithPath, currentColl);
                    await saveObjectToFile(samlingsObj)
                const imageResults = await processMediaLineByLine(mediaFileWithPath, currentColl, samlingsObj);   
                    await saveObjectToFile(imageResults)
        }
        if (i= len) {
        console.log('vi er ferdige ' + len);
        }
        
    } catch (e) {
        console.error(e);
    }
}

main(fileList)


// exportere funksjonen ut
module.exports = { 
    main
 } 