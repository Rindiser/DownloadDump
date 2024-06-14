const fs = require('fs')
const csvParser = require('csv-parser')

return new Promise(function (resolve, reject) {
    const catalogNumbers = []
    fs.createReadStream('./../../coremaDumper/NHMO-BI/simpledwc.txt')
                    .pipe(csvParser({ "separator": "\t" }))
                    .on('data', (row) => {
                        catNo = row.catalogNumber.substr(0,row.catalogNumber.indexOf('/'))
                        catalogNumbers.push(catNo)
                    })
                    .on('end', () => {
                        console.log(catalogNumbers[1])
                        console.log("before " + catalogNumbers.length)
                        uniqueNumbers = [...new Set(catalogNumbers)]
                        console.log("unique " + uniqueNumbers.length)
                        resolve('success')
                    })
   
})