var prompt = require('prompt');
var fixCanvas = require('./canvas-fix.js');

function getPath() {
    return new Promise((resolve, reject) => {
        prompt.start();
        
        var schema = {
            properties: {
                path: {
                    type: 'string',
                    pattern: /.csv$/,
                    message: `(i.e. '../myExample.csv')`,
                    required: true
                },
                discoverOnly: {
                    type: 'string',
                    pattern: /true|false/i,
                    message: `(i.e. true/false)`,
                    required: true
                }
            }
        };
        
        prompt.get(schema, (err, userInput) => {
            if (err) {
                console.error(err);
                reject(err);
                return;
            }
            resolve(userInput);
        });
    });
}

async function run() {
    var userInput = await getPath()
    fixCanvas.main(userInput);
}

run();
// .catch((err)=> {
//     console.log(`Workingggg`);
//     if (err) {
//         console.error(err);
//     }
//     console.log(`Good job`);
// });