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
function getCourseTOC() {
	var $ = window.top.jQuery;
	var modules = [];

	$.ajax({
		dataType: "json",
		url: '/d2l/api/le/1.24/65448/content/toc',
		success: run,
		method: 'GET',
	});
}

/*********************************************
 * Iterate through the TOC and create a flat
 * array of all the topics in the course.
 * 
 * Returns the flattened array of topic objects
 *********************************************/
function getTopics(modules) {
	var topics = [];
	var recursiveCount = 0;

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
	recurseTOC(modules.Modules);

	/* Return a flattened array of topics */
	return topics.reduce((acc, currArray) => acc.concat(currArray), []);
}

/*******************************************************************************
 * PUT the new topic to Brightspace with the correct URL and its old title
 *******************************************************************************/
function putTopic(topic) {
	console.log(topic)
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
		url: `https://byui.brightspace.com/d2l/api/le/1.24/65448/content/topics/${topic.TopicId}`,
		success: console.log,
		method: 'PUT',
		headers: {
			'X-Csrf-Token': localStorage.getItem("XSRF.Token")
		}
	});

}

/******************************************************************
 * After getting the Course's TOC in getCourseTOC(), the GET request
 * from in getCourseTOC() will call this function on success. This
 * function will act as main for this program 
 ******************************************************************/
function run(modules) {
	/* Get a flat array of the topics in the course from the table of contents */
	var topics = getTopics(modules);
	
	/* Find the topic that has the old End of Course Evaluation link */
	var endOfCourseEval = topics.find(topic => topic.Url === 'http://abish.byui.edu/berg/evaluation/select.cfm');

	/* If the old End of Course Evaluation link exists in the course, call putTopic() */
	if (endOfCourseEval !== undefined) {
		putTopic(endOfCourseEval);
	} else {
		console.log(`Did not find old link to End of Course Evaluation`);
	}
}

/*********************************
 * Start Here
 *********************************/
window.top.addEventListener('load', getCourseTOC);