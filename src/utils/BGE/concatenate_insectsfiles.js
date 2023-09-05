var fs = require('fs')
const csvParser = require('csv-parser')
const papa = require('papaparse')
const readline = require('readline')

// const toCsvFile = `./BGE_gapSpecies_all_insects.csv`


// fs.writeFile(toCsvFile, '', function(){console.log('done')})



// read all txt-files in a folder and append all their contents in one file
async function concatFiles (toCsvFile,folder) {
    let logger = fs.createWriteStream(toCsvFile, {
        flags: 'a' // means append
    })
    fs.readdir(folder, function (err, files) {
        files.forEach(function (file, index) {
            console.log(file)
            if (file.includes('txt')) {
                let resultsOneFile = []
                fs.createReadStream(file)
                .pipe(csvParser({ "separator": "\t" }))
                .on('data', (row) => {
                    resultsOneFile.push(row)
                })
                .on('end', () => {
                    let resultsToFile = papa.unparse(resultsOneFile, {
                        delimiter: "\t",
                    })
                    logger.write(resultsToFile)
                    // resolve('success')
               })    
            }
        })
    })
    
    
}

//// read one file with many lines per species, and put data for one species on one line
async function oneLinePerSpecies (toCsvFile,nameFile) {
    let logger2 = fs.createWriteStream(toCsvFile, {
        flags: 'a' // means append
    })
    
    const readInterface = readline.createInterface({
        input: fs.createReadStream(nameFile),
        console: false
    })
    let count = 0  // iterates over each line of the current file
    let insectSpecies = []
    readInterface.on('line', function(line) {
        if (count === 0) {
            // header
            // logger2.write(line)
            logger2.write('species\tnumber\torder\tfamily\tcollDate\tcountry\n')
        } else { 
            let variables = line.split("\t")
            // let species = variables[2]
            // let order = variables[9]
            // let family = variables[10]
            // let collDate = variables[21]
            // let country = variables[23]
            let species = variables[8]
            let order = variables[6]
            let family = variables[7]
            let collDate = variables[16]
            let country = variables[11]
            
            let existingRecord = insectSpecies.find(item => item.species === species)
            if (existingRecord) {
                existingRecord.number ++
                existingRecord.collDate.push(collDate)
                existingRecord.country.push(country)
                
            } else {
                insectSpecies.push({"species": species, "number": 1, "order": order, "family": family, "collDate": [collDate], "country": [country]})
            }
            
            // logger2.write('\n')
        }
    
        count++
    
    }).on('close', function () {
        // redlistObjects.sort((a, b) => {
        //     let fa = a.latinName.toLowerCase(),
        //     fb = b.latinName.toLowerCase()
        //     if (fa < fb) {
        //         return -1
        //     }
        //     if (fa > fb) {
        //         return 1
        //     }
        //     return 0
        // })
        insectSpecies.forEach(el=> {
            logger2.write(`${el.species}\t${el.number}\t${el.order}\t${el.family}\t${el.collDate.join(',')}\t${el.country.join(',')}\n`)
        })
        // logger2.write(insectSpecies.join('\t'))
    })
}




// read all txt-files in a folder and append all their contents in one file
// concatFiles (`./BGE_crustacea_species_list.csv`,'./')
// oneLinePerSpecies ('./BGE_crustacea_one_sp_per_line.csv',`./BGE_crustacea_species_list.csv`)
// concatFiles (`./BGE_other_krepsdyr_phyla.csv`,'./')
oneLinePerSpecies ('./BGE_other_krepsdyr_one_sp_per_line.csv','./BGE_other_krepsdyr_phyla.csv')