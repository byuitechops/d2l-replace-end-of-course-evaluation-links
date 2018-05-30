const canvas = require('canvas-api-wrapper');
const asyncLib = require('async');
const Logger = require('logger');
const logger = new Logger('End of Course Evaluation Links Replaced');

/* Pass one course ID at a time */
async function replaceLink(courseID) {
    var courseID = 12940; // Replace this with an array of all the course IDs and loop through them one at a time
    const course = canvas.getCourse(courseID);
    await course.modules.getComplete();

    /* Loop through each module item and check if it has the old End of Course Evaluation link  */
    for (var i = 0; i < course.modules.length; i++) {
        for (var j = 0; j < course.modules[i].moduleItems.length; j++) {
            /* If it is an external url module item and it has the old url, then replace it with the new link and update the course */
            if (course.modules[i].moduleItems[j].type === 'ExternalUrl' && course.modules[i].moduleItems[j].external_url === 'http://abish.byui.edu/berg/evaluation/select.cfm') {
                /* Save the old url to a variable for logging, and set the new url */
                var oldUrl = course.modules[i].moduleItems[j].external_url;
                course.modules[i].moduleItems[j].external_url = 'https://web.byui.edu/endofcourseevaluation/';
                await course.update();

                /* Log it */
                logger.log(`End of Course Evaluation Link Replaced`, {
                    'Course ID': courseID,
                    'Module ID': course.modules[i].id,
                    'Module Item ID': course.modules[i].moduleItems[j].id,
                    'Old URL': oldUrl,
                    'New URL': course.modules[i].moduleItems[j].external_url
                });
            }
        }
    }
}

/* Get the course info and replace the link, then log everything in various ways */
async function runMe() {
    /* An array of each courses' ID */
    const courseIDs = [
        12940,
    ];

    /* Make the fix, one course at a time */
    for (var i = 0; i < courseIDs.length; i++) {
        await replaceLink(courseIDs[i]);
    }

    /* Log it all */
    logger.consoleReport();
    logger.htmlReport('./html-reports');
    logger.jsonReport('./json-reports');
}

runMe();