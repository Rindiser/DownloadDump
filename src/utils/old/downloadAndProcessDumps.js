// main file

const fetchApp = require('../../fetchApp')
const sqliteCode = require('../../sqliteCode_functions')

let update
update = 'update'
// update = 'empty_fill'

async function downloadAndProcessDumps () {
    try {
        await fetchApp.getFilesAllMuseum()
        await sqliteCode.mainSQLiteFunction(update)
        process.exit() // hvis alle filer er downloaded og unzipped så slå av programmet
    } catch (error) {
       console.log(error);   
    }
}

downloadAndProcessDumps()