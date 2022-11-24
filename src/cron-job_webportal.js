const CronJob = require('cron').CronJob
const job = new CronJob(
    '* * 00 * * *',
    function() {
        downloadAndProcessDumps.js
    },
    null,
    true,
    'Norway/Oslo'
)