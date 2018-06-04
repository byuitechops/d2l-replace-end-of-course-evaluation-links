const canvas = require('canvas-api-wrapper');
const asyncLib = require('async');
const Logger = require('logger');
const logger = new Logger('End of Course Evaluation Links Replaced');

/* Get the module item that needs to be fixed */
async function getLink(course) {
    /* Loop through each module item and check if it has the old End of Course Evaluation link  */
    for (var i = 0; i < course.modules.length; i++) {
        for (var j = 0; j < course.modules[i].moduleItems.length; j++) {
            /* If it is an external url module item and it has the old url, then replace it with the new link and update the course */
            if (course.modules[i].moduleItems[j].type === 'ExternalUrl' && course.modules[i].moduleItems[j].external_url === 'http://abish.byui.edu/berg/evaluation/select.cfm') {
                /* Return the module item that has the old url */
                return course.modules[i].moduleItems[j];
            } else {
                return null;
            }
        }
    }
}

/* Fix the link in Canvas */
async function fixLink(moduleItem, courseID) {
    /* Save the old url to a variable for logging, and set the new url */
    var oldUrl = moduleItem.external_url;
    var newUrl = 'https://web.byui.edu/endofcourseevaluation/';

    await canvas.put(`/api/v1/courses/${courseID}/modules/${moduleItem.module_id}/items/${moduleItem.id}`, {
        'module_item[external_url]': newUrl
    }, (err) => {
        if (err) {
            console.error(err);
            return;
        }
        return {
            oldUrl,
            newUrl,
            moduleItem,
            courseID
        };
    });

}

/* Do a GET request to verify that the link was changed, and log everything */
async function verifyLink(logItems) {
    console.log(logItems);
    await canvas.get(`/api/v1/courses/${logItems.courseID}/modules/${logItems.moduleItem.module_id}/items/${logItems.moduleItem.id}`, {}, (err, returnedItem) => {
        if (err) {
            console.error(err);
            return;
        }
        /* Log it */
        logger.log(`End of Course Evaluation Link Replaced`, {
            'Course ID': logItems.courseID,
            'Module ID': logItems.moduleItem.module_id,
            'Module Item ID': logItems.moduleItem.id,
            'Old URL': logItems.oldUrl,
            'Verified New URL': returnedItem.external_url
        });
    });
}

/* Get the course info and replace the link, then log everything in various ways */
async function runMe() {
    /* If you don't want to fix the links, but want to only search the courses with the old url, then set discoverOnly to true */
    var discoverOnly = false;

    /* An array of each courses' ID */
    const courseIDs = [
        12940,
    ];

    /* Make the fix, one course at a time */
    for (var i = 0; i < courseIDs.length; i++) {
        var course = canvas.getCourse(courseIDs[i]);
        await course.modules.getComplete();

        var moduleItem = await getLink(course);

        if (moduleItem !== null && discoverOnly !== true) {
            var logItems = await fixLink(moduleItem, courseIDs[i]);
            await verifyLink(logItems);
        }
    }

    /* Log it all */
    logger.consoleReport();
    logger.htmlReport('./html-reports');
    logger.jsonReport('./json-reports');
}

/*********************
 * Start Here
 *********************/
runMe();