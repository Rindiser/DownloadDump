const path = require('path');



function prodOrTest () {
    // Her bestemmer du om det er på test eller prod:

    // const pathToFiles = './../../test/src'
    const pathToFiles = './../../portal/src'

    return path.join(__dirname, pathToFiles);
}


module.exports = prodOrTest