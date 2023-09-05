// 28.2.23
// for one class, e.g. insecta, go through all families in Torstens file,
// find the three newest specimens for all species in each family, in the gapSpecies_all_insects_file
// and put them into the family-file from BGE with contribution
// but more important first step: put them in a separate musit-dump-file, with the fields Geir want

const xlsxReader = require('xlsx')
var fs = require('fs')
const csvParser = require('csv-parser')

let classVariable = "Insecta"
// file with families we concern ourselves with
// let NHMO_pri_families_file = "./../../../../../BGE_files/NHMO_priority_families.xlsx"
let NHMO_pri_families_file = "./../../../../../BGE_files/NHMO_priority_families_hymenoptera.xlsx"
// file with our records that we can contribute
let insectFile = "./BGE_gapSpecies_all_insects - 230112.csv"
// file to duplicate and add information into


const getFamilyFile = async (familyObject) => {
    let familyFile = `./../../../../../BGE_files/Arthropoda/Insecta/${familyObject.order}/${familyObject.family}.xls`
    return familyFile
}

// make list of families
const makeFamilyList = async () => {
    // read Torstens file
    const localFile = xlsxReader.readFile(NHMO_pri_families_file)
    // convert to json
    const temp = xlsxReader.utils.sheet_to_json(localFile.Sheets[localFile.SheetNames[0]]) 
    // pick out families
    let familyObjects = []
    temp.forEach(el => {
        if (el.Class === "Insecta") {
            familyObjects.push({"order": el.Order, "family": el.Family})
        }
    })
    return familyObjects
}

// makes a list of records for one fam
const recordsFromOneFam = async (familyObject) => {
    // read everything from excel-file
    const localFile = xlsxReader.readFile(insectFile)
    // create array of objects, one for each species/line
    const temp = xlsxReader.utils.sheet_to_json(localFile.Sheets[localFile.SheetNames[0]]) // skal det stå "file" her?
    let data = []
    let count = 0
    temp.forEach((res) => {
        if (count > 1) {
            if (res.family === familyObject.family) {
                if (res.eventDate) {
                    data.push(res)
                }
            }
        }
        count++
    })
    return data
}


// search for the three newest records for one species among the records that are input
// returns an object with key-information for, those three records
const pickThreeNewest = async (recordsOneSp) => {
    return new Promise(function (resolve, reject) {
        recordsOneSp.sort((a, b) => (a.yearCollected < b.yearCollected) ? 1 : -1)
        // find three newest
        let threeNewest = recordsOneSp.slice(0,3)
        // let relObject = {'species': threeNewest[0].scientificName}
        // add my data
        // if (threeNewest.length > 0) {
        //     relObject.cat1 = threeNewest[0].catalogNumber
        //     relObject.year1 = threeNewest[0].yearCollected
        //     relObject.country1 = threeNewest[0].country
        // }
        // if (threeNewest.length > 1) {
        //     relObject.cat2 = threeNewest[1].catalogNumber
        //     relObject.year2 = threeNewest[1].yearCollected
        //     relObject.country2 = threeNewest[1].country
        // }    
        // if (threeNewest.length > 2) {
        //     relObject.cat3 = threeNewest[2].catalogNumber
        //     relObject.year3 = threeNewest[2].yearCollected
        //     relObject.country3 = threeNewest[2].country
        // }
        // resolve (relObject)
        resolve (threeNewest)
    })
}

// search for the three newest records for one species among the records that are input
// returns an array with three objects
const pickThreeNewest2 = async (recordsOneSp) => {
    return new Promise(function (resolve, reject) {
        

        recordsOneSp.sort((a, b) => (a.yearCollected < b.yearCollected) ? 1 : -1)
        // find three newest
        let threeNewest = recordsOneSp.slice(0,3)
        // console.log(threeNewest)
        
        resolve (threeNewest)
    })
}

// for each family, pick out three newest records from insect-file
// families.forEach(family => {
//     console.log(family)
// })

async function copyFile (filenameIn,filenameOut) {
    return new Promise(function (resolve, reject) {
        fs.copyFile(filenameIn ,filenameOut, (err) => {
            if (err) {
            console.log("Error Found:", err);
            }
            else {
                resolve (filenameOut)
            }
        })
    })
}

async function findRelObj (arrayCandOneFam, newTemp, index2) {
    return new Promise(function (resolve, reject) {
        let obj = arrayCandOneFam.find((el) => el.species === newTemp[index2].Taxon)
        console.log('obj ' + obj)
    //   resolve ( arrayCandOneFam.find((el) => el.species === newTemp[index2].Taxon))
        
    })   
}

async function makeSpeciesList (recArray) {
    return new Promise(function (resolve, reject) {
        let speciesList = []
        for (a=0; a<recArray.length; a++) {
            speciesList.push(recArray[a].scientificName)
        }
        // remove duplicates
        let uniqueSpList = [...new Set(speciesList)]
        delete speciesList
        resolve(uniqueSpList)
    })
}
async function exchangeProp (anObject) {
    return new Promise(function (resolve, reject) {
        let index = 0
        for (const property in anObject) {
            if (index === 5) {
                anObject['Taxon'] = anObject[property]
                delete anObject[property]
            }
            index++
        }
        resolve(anObject)
    })
}


// go through all steps - what is done, and what do I want to do? two sides of a sheet of paper.
async function main() {
    // make list of family-objects (including order)
    let familyObjects = await makeFamilyList()
    // console.log(familyObjects.length)

    // for each family, make specieslist and pick out three newest
    let arrayCandOneFam = []

    const toCsvFile = `./Hymenoptera_all_rel_records2.csv`
    fs.writeFileSync(toCsvFile,'')
    let logger = fs.createWriteStream(toCsvFile, {
        flags: 'a' // means append
    })
   
    let regnoArray = []
  
    for (i=0;i<familyObjects.length;i++) {
        // get all records from musit for this family that have eventDate:
        let recordsOneFam = await recordsFromOneFam(familyObjects[i])
        // make species list for this fam
        let speciesList = await makeSpeciesList(recordsOneFam)
        for (j=0;j<speciesList.length;j++) {
            // make array with all records for the species
            let candidatesOneSp = []
            for (k=0;k<recordsOneFam.length;k++) {
                if (recordsOneFam[k].scientificName === speciesList[j]) {
                    candidatesOneSp.push(recordsOneFam[k])
                }
                // return
            }
            // console.log(candidatesOneSp[0])
            // pick out three newest, push to array for fam
            const threeCandOneSp = await pickThreeNewest(candidatesOneSp)
            threeCandOneSp.forEach((el) => arrayCandOneFam.push(el))
            
        }

        const familyFile = xlsxReader.readFile(`./../../../../../BGE_files/Arthropoda/Insecta/${familyObjects[i].order}/${familyObjects[i].family}.xls`)
        const temp = xlsxReader.utils.sheet_to_json(familyFile.Sheets[familyFile.SheetNames[0]])
        let newTemp = []
        for (l=0;l<temp.length;l++) {
            newObj = await exchangeProp(temp[l])
            newTemp.push(newObj)
        }
        
        // for (index2=2;index2<newTemp.length;index2++) {
            
        //     let relObject = arrayCandOneFam.find((el) => el.scientificName === newTemp[index2].Taxon)
        //     if (relObject) {
                
                
        for (i3=0;i3<arrayCandOneFam.length;i3++) {
            let speciesObject = newTemp.find((el) => el.Taxon === arrayCandOneFam[i3].scientificName)
            if (speciesObject) {
                //write recordsOneFam[i3] to file
                // regnoArray.push(recordsOneFam[i3].catalogNumber)            
                regnoArray.push(arrayCandOneFam[i3].catalogNumber)
                
                
                
            }
        }
                    
        
    }
    
    logger.write(regnoArray.toString().replace(/[,]/g,'\n'))
}

main()
