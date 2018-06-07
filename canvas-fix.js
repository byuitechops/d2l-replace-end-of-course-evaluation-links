const canvas = require('canvas-api-wrapper');
const asyncLib = require('async');
const Logger = require('logger');
const logger = new Logger('End of Course Evaluation Links Replaced');
const d3 = require('d3-dsv');
const fs = require('fs');

/*********************************************************** 
 * Perform the following steps on each specified course: 
 *  - Find the old End of Course Eval link
 *  - If discover only is false 
 *     - Replace the link 
 *     - Verify it has been fixed 
 *  - Log the results
 ***********************************************************/
function runTest(courseInfo, discoverOnly) {
    return new Promise(async (resolve, reject) => {

        var course = await canvas.getCourse(courseInfo.id);
        await course.modules.getComplete();

        var moduleItem = getLink(course);
        var modifiedModItem = '';

        if (moduleItem !== null && discoverOnly !== true) {
            var courseData = await fixLink(moduleItem, courseInfo.id);
            modifiedModItem = await verifyLink(courseData);
        }

        var logItems = {
            'Course Name': courseInfo.name,
            'Course ID': courseInfo.id,
            'Module ID': moduleItem ? moduleItem.module_id : '',
            'Module Item ID': moduleItem ? moduleItem.id : '',
            'URL Before Change': moduleItem ? moduleItem.external_url : '',
            'Verified New URL': modifiedModItem ? modifiedModItem.external_url : '',
            'Link to Module Item': moduleItem ? `https://byui.instructure.com/courses/${courseInfo.id}/modules#module_${moduleItem.module_id}` : ''
        };

        logger.log(`End of Course Evaluation Link Replacement`, logItems);
        resolve(logItems);
    });
}

/* Get the courses from the CSV specified in the cli prompt */
function getCourses(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, fileContents) => {
            if (err) {
                console.error(err);
                reject(err);
                return;
            }
            /* Use d3.dsv to turn the CSV file into an array of objects */
            var csvArray = d3.csvParse(fileContents);

            /* Retrieve the courses' ids and names from the CSV */
            var courses = csvArray.map(csv => {
                return {
                    id: csv.id, // expecting an id column in the CSV
                    name: csv.name // expecting a name column in the CSV
                }
            });
            resolve(courses);
        });
    });
}

/* Get the module item that needs to be fixed */
function getLink(course) {
    /* Loop through each module item and check if it has the old End of Course Evaluation link  */
    for (var i = 0; i < course.modules.length; i++) {
        for (var j = 0; j < course.modules[i].moduleItems.length; j++) {
            /* If it is an external url module item and it has the old url, then replace it with the new link and update the course */
            if (course.modules[i].moduleItems[j].type === 'ExternalUrl' && course.modules[i].moduleItems[j].external_url === 'http://abish.byui.edu/berg/evaluation/select.cfm') {
                /* Return the module item that has the old url */
                return course.modules[i].moduleItems[j];
            }
        }
    }
    return null;
}

/* Fix the link in Canvas */
async function fixLink(moduleItem, courseID) {
    return new Promise(async (resolve, reject) => {

        /* Save the old url to a variable for logging, and set the new url */
        var oldUrl = moduleItem.external_url;
        var newUrl = 'https://web.byui.edu/endofcourseevaluation/';

        await canvas.put(`/api/v1/courses/${courseID}/modules/${moduleItem.module_id}/items/${moduleItem.id}`, {
            'module_item': {
                'external_url': newUrl
            }
        }, (err) => {
            if (err) {
                console.error(err);
                reject(err);
                return;
            }
            resolve({
                courseID,
                oldUrl,
                newUrl,
                moduleItem,
                courseID
            });
        });
    });
}

/* Do a GET request to verify that the link was changed, and log everything */
async function verifyLink(data) {
    return new Promise(async (resolve, reject) => {

        await canvas.get(`/api/v1/courses/${data.courseID}/modules/${data.moduleItem.module_id}/items/${data.moduleItem.id}`, {}, (err, returnedItem) => {
            if (err) {
                console.error(err);
                reject(err);
                return;
            }

            resolve(returnedItem);
        });
    });
}


/* Get the course info and replace the link, then log everything in various ways */
async function main(userInput) {
    /* If you don't want to fix the links, but want to only search the courses with the old url, then set discoverOnly to true */
    /* Set discoverOnly and the file path to the user input */
    var discoverOnly = userInput.discoverOnly;
    var filePath = userInput.path;

    /* Get an array of each courses' id and name from the CSV */
    const courses = await getCourses(userInput.path);

    var csvData = [];

    /* Make the fix, one course at a time */
    for (var i = 0; i < courses.length; i++) {
        var logItems = await runTest(courses[i], discoverOnly);
        csvData.push(logItems);
    }

    /* Log it all */
    logger.consoleReport();
    logger.htmlReport('./html-reports');
    logger.jsonReport('./json-reports');

    var csvReport = d3.csvFormat(csvData, ["Course Name", "Course ID", "Module ID", "Module Item ID", "URL Before Change", "Verified New URL", "Link to Module Item"]);
    fs.writeFile('canvasLinkReplacementReport.csv', csvReport, (err) => {
        if (err) {
            console.error(err);
            logger.error(err);
        }
    });
}

module.exports = {
    main: main
};