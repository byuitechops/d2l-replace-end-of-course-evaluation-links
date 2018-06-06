const canvas = require('canvas-api-wrapper');
const asyncLib = require('async');
const Logger = require('logger');
const logger = new Logger('End of Course Evaluation Links Replaced');
const d3 = require('d3-dsv');
const fs = require('fs');


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
async function verifyLink(data, csvData) {
    return new Promise(async (resolve, reject) => {

        await canvas.get(`/api/v1/courses/${data.courseID}/modules/${data.moduleItem.module_id}/items/${data.moduleItem.id}`, {}, (err, returnedItem) => {
            if (err) {
                console.error(err);
                reject(err);
                return;
            }

            var logItems = {
                'Course ID': data.courseID,
                'Module ID': data.moduleItem.module_id,
                'Module Item ID': data.moduleItem.id,
                'Old URL': data.oldUrl,
                'Verified New URL': returnedItem.external_url,
                'Link to Module Item': `https://byui.instructure.com/courses/${data.courseID}/modules#module_${data.moduleItem.module_id}`
            };

            /* csvData was passed in and this instance of it should be a pointer */
            csvData.push(logItems);

            /* Log it */
            logger.log(`End of Course Evaluation Link Replaced`, logItems);
            resolve();
        });
    });
}

/* Get the course info and replace the link, then log everything in various ways */
async function runMe() {
    /* An array of each courses' ID */
    const courseIDs = [
        12940,
        12971
    ];

    var csvFixedData = [];
    var csvUnchangedData = [];
    var csvCurrentData = [];

    /* Make the fix, one course at a time */
    for (var i = 0; i < courseIDs.length; i++) {
        var course = await canvas.getCourse(courseIDs[i]);
        await course.modules.getComplete();

        var moduleItem = getLink(course);

        if (moduleItem !== null && discoverOnly !== true) {
            var courseData = await fixLink(moduleItem, courseIDs[i]);
            await verifyLink(courseData, csvFixedData);
        } else if (moduleItem !== null && discoverOnly === true) {
            var logItems = {
                'Course ID': courseIDs[i],
                'Current End of Course Evaluation Link': moduleItem.external_url,
                'Link to Course': `https://byui.instructure.com/courses/${courseIDs[i]}`
            }
            csvCurrentData.push(logItems);
            logger.log('Current End of Course Evaluation Link', logItems);
        } else {
            var logItems = {
                'Course ID': courseIDs[i],
                'Link to Course': `https://byui.instructure.com/courses/${courseIDs[i]}`
            };
            csvUnchangedData.push(logItems);
            logger.log('End of Course Evaluation Link Not Found', logItems);
        }
    }

    /* Log it all */
    logger.consoleReport();
    logger.htmlReport('./html-reports');
    logger.jsonReport('./json-reports');

    /* If running in discover mode */
    if (discoverOnly === true) {
        /* Format and create the CSV file with the log data */
        var csvCurrentLinks = d3.csvFormat(csvCurrentData, ["Course ID", "Current End of Course Evaluation Link", "Link to Course"]);

        /* Write the CSVs to their respective files, then download the files */
        fs.writeFile('csvCurrentLinks.csv', csvCurrentLinks, (err) => {
            if (err) console.error(err);
        });
        return;
    }
    
    /* Format and create the CSV files with the log data */
    var csvFixedReport = d3.csvFormat(csvFixedData, ["Course ID", "Module ID", "Module Item ID", "Old URL", "Verified New URL", "Link to Module Item"]);
    var csvUnchangedReport = d3.csvFormat(csvUnchangedData, ["Course ID", "Link to Course"]);

    /* Write the CSVs to their respective files, then download the files */
    fs.writeFile('csvFixedReport.csv', csvFixedReport, (err) => {
        if (err) console.error(err);
    });

    fs.writeFile('csvUnchangedReport.csv', csvUnchangedReport, (err) => {
        if (err) console.error(err);
    });

}

/*********************
 * Start Here
 *********************/
/* If you don't want to fix the links, but want to only search the courses with the old url, then set discoverOnly to true */
var discoverOnly = true;
runMe();