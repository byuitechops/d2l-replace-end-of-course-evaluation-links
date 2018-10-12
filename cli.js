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
                    required: true,
                    default: 'canvasCourses.csv'
                },
                discoverOnly: {
                    type: 'string',
                    pattern: /true|false/i,
                    message: `(i.e. true/false)`,
                    required: true,
                    default: true
                }
            }
        };
        
        prompt.get(schema, (err, userInput) => {
            if (err) {
                console.error(err);
                return reject(err);
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