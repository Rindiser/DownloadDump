const readline = require('readline');
const fs = require('fs')

const localFiles = require('./localFiles')


//hovedtall
const main = () => {
    // her skal den lese igjennom hver fila og returnere poster som er registrert siste 5 år og poster som samle inn siste 5 år
    // https://codepen.io/rustydev/pen/GBKGKG?editors=0010
    const readInterface = readline.createInterface({
        input: fs.createReadStream(localFiles[1].file),
        console: false
    })
    let linesCount = 0;
    let year2019Reg = 0  // iterates over each line of the current file
    let year2018Reg = 0 
    let year2017Reg = 0 
    let year2019Event = 0
    let year2018Event = 0
    let year2017Event = 0

 
    
    readInterface
        .on('line', function(line) {
        linesCount++; // on each linebreak, add +1 to 'linesCount'   
        const  arrayLine = line.split("\t"); //lag en arry splittet på tab
            
            if (arrayLine[2].includes('2019') ) {
                year2019Reg ++
            } else if (arrayLine[2].includes('2018')) {
                year2018Reg ++
            }  else if (arrayLine[2].includes('2017')) {
                year2017Reg ++
            } 
            // event date
            if (arrayLine[23].includes('2019')) {
                year2019Event ++
            } else if (arrayLine[23].includes('2018')) {
                year2018Event ++
            } else if (arrayLine[23].includes('2017')) {
                year2017Event ++
            } 
  
        })
        .on('close', function () {
            console.log(year2019Reg);
            console.log(year2018Reg);
            console.log(year2017Reg);
            console.log(year2019Event);
            console.log(year2018Event);
            console.log(year2017Event);
            console.log('databasestørrelse ' + linesCount);
        });
}


// exportere funksjonen ut
module.exports = { 
    main
 } 