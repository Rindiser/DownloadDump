const CronJob = require('cron').CronJob
// const download = require('utils/downloadAndProcessDumps')
// const stat = require('utils/produceStats')
const job = new CronJob(
    '* * * * *',
    function() {
        downloadAndProcessDumps.js
        produceStats.js
        // await download
        // await stat
    },
    null,
    true,
    // 'Norway/Oslo'
    'system'
)