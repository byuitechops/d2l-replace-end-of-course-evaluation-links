/********************************************************************************************
 * Description: 
 * This tool is to find the topic in each course that has the old 'End of Course Evaluation'
 * link and replace it with the new one proveded in the PUT object, as seen below. 
 * 
 * The process is as follows:
 * Get the Course's TOC
 * Traverse through it and create an array of all the topics in the course
 * Find the topic that has the old url, if there is one
 * PUT the topic to Brightspace with the new URL, the old name, and the TopicId
 * 
 * To run: You must upload this file to a Brightspace course. Upon opening the file in 
 * Brightspace, it will run. I (Seth Childers) created a module item, titled 'test', in a new 
 * module named 'api test' in my Brightspace Sandbox to run this tool. As I wrote the tool, 
 * I created a mapped network drive to the file in Brightspace from my local computer, so as
 * to avoid having to re-upload the file to Brightspace every time I modified the code.
 ********************************************************************************************/

/*********************************************
 * Get the modules and topics in the course
 * from the course's Table of Contents (TOC)
 * 
 * Returns the TOC object
 *********************************************/
function getCourseTOC(courseID) {
	return new Promise((resolve, reject) => {
		var $ = window.top.jQuery;

		$.ajax({
			dataType: "json",
			url: `/d2l/api/le/1.24/${courseID}/content/toc`,
			success: resolve,
			method: 'GET',
			error: reject
		});
	});
}

/*********************************************
 * Iterate through the TOC and create a flat
 * array of all the topics in the course.
 * 
 * Returns the flattened array of topic objects
 *********************************************/
function getTopics(tableOfContents) {
	var topics = [];

	/********************************************************************************
	 * A recursive function that will iterate through the TOC tree and push 
	 * all the leaf nodes (Topics, not empty Modules) onto a 'topics' array
	 * 
	 * If there are submodules in a module, then this function will be called 
	 * recursively and take the current module's 'Modules' array as its parameters
	 * ******************************************************************************/
	function recurseTOC(modules) {
		/* If modules is empty or undefined, return */
		if (!modules) {
			return;
		}

		/* If there are submodules, push their topics onto the topics array and iterate through their modules recursively */
		modules.forEach(mod => {
			/* First add whatever topics are in the module */
			if (mod.Topics && mod.Topics.length !== 0) {
				topics.push(mod.Topics);
			}
			/* Then if there are submodules, recurse through them */
			if (mod.Modules && mod.Modules.length !== 0) {
				recurseTOC(mod.Modules);
			}
		});
	}

	/* Call the function once. If it has submodules, it will be called recursively */
	recurseTOC(tableOfContents.Modules);

	/* Return a flattened array of topics */
	return topics.reduce((acc, currArray) => acc.concat(currArray), []);
}

/*******************************************************************************
 * PUT the new topic to Brightspace with the correct URL and its old title
 *******************************************************************************/
function putTopic(topic, courseID) {
	return new Promise((resolve, reject) => {
		console.log(`Topic before put: ${JSON.stringify(topic)}`);
		var $ = window.top.jQuery;

		$.ajax({
			// dataType: "json",
			processData: false,
			contentType: "application/json; charset=UTF-8",
			data: JSON.stringify({
				"Title": topic.Title,
				"ShortTitle": "short",
				"Type": 1,
				"TopicType": 3,
				"Url": "https://web.byui.edu/endofcourseevaluation/",
				"StartDate": null,
				"EndDate": null,
				"DueDate": null,
				"IsHidden": false,
				"IsLocked": false,
				"OpenAsExternalResource": true,
				"Description": null,
				"MajorUpdate": null,
				"MajorUpdateText": "update",
				"ResetCompletionTracking": null,
				"Duration": null
			}),
			url: `https://byui.brightspace.com/d2l/api/le/1.24/${courseID}/content/topics/${topic.TopicId}`,
			success: resolve,
			method: 'PUT',
			headers: {
				'X-Csrf-Token': localStorage.getItem("XSRF.Token")
			},
			error: reject
		});

	});
}

/*******************************************************
 * This function will loop through the array of courses
 *******************************************************/
async function runAllCourses() {
	/* An array of all the courses' OUs */
	var courses = [
		65448,
		65437,
	];

	/* A log of all the course IDs, their old urls, and their new urls to be put into the CSV */
	var data = [];

	/* Loop through and do the following for each course */
	for (var i = 0; i < courses.length; i++) {
		var logInfo = await run(courses[i]);
		data.push(logInfo);
	}

	/* Format and create the CSV file with the log data */
	var csvData = d3.csvFormat(data, ["Course ID", "Old URL", "Verified New URL"]);

	/* Log the csv, and download it */
	console.log(JSON.stringify(csvData));
	download(csvData, 'myCSV.csv');
}

/******************************************************************************************
 * This function will act as main for this program, as follows: 
 * 
 * 		Get the table of contents/ all the modules
 * 		Get a flat array of the topics in the course from the table of contents
 * 		Find the topic that has the old End of Course Evaluation link
 * 		If the old End of Course Evaluation link exists in the course, then PUT the topic
 ******************************************************************************************/
async function run(courseID) {
	var tableOfContents = await getCourseTOC(courseID);
	var topics = getTopics(tableOfContents);
	var endOfCourseEval = topics.find(topic => topic.Url === 'http://abish.byui.edu/berg/evaluation/select.cfm');


	/* If discoverOnly is true, then the old link will logged but not changed */
	if (endOfCourseEval !== undefined) {
		console.log(`Topic with wrong url: ${JSON.stringify(endOfCourseEval)}`);
		if (discoverOnly === false) {
			await putTopic(endOfCourseEval, courseID);
			var newLink = await verify(endOfCourseEval, courseID);

			/* Return the log info */
			return {
				'Course ID': courseID,
				'Old URL': endOfCourseEval.Url,
				'Verified New URL': newLink
			};
		}
	} else {
		console.log(`Course: - Did not find old link to End of Course Evaluation`);

		/* Return the log info */
		return {
			'Course ID': courseID,
			'Old URL': 'Old link not found',
			'Verified New URL': 'No new link added'
		};
	}
}

/**************************************************************
 * After the PUT request, this function is called to check
 * the changed topic's Url to verify that it has been changed
 **************************************************************/
function verify(topic, courseID) {
	return new Promise((resolve, reject) => {
		var $ = window.top.jQuery;

		var myString = 'hello world';

		$.ajax({
			dataType: "json",
			url: `/d2l/api/le/1.24/${courseID}/content/topics/${topic.TopicId}`,
			success: (returnedTopic) => {
				console.log(`Replaced Link - : ${JSON.stringify(returnedTopic.Url)}`);
				resolve(returnedTopic.Url);
			},
			method: 'GET',
			error: reject
		});
	});
}

/*********************************
 * Start Here
 *********************************/
// if you only want to look at whether or not the course has the old link, set discoverOnly to true
// if you want to replace the link as well, set discoverOnly to false
const discoverOnly = false;
window.top.addEventListener('load', runAllCourses);