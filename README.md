# D2L Replace End of Course Evaluation Links
### *Package Name*: d2l-replace-end-of-course-evaluation-links
### *Platform*: online/pathway/campus/all

## Purpose

All links to End of Course Evaluations are now deprecated and need to be replaced by a new link, both in D2L and in Canvas

## How to Install

```
npm install d2l-replace-end-of-course-evaluation-links
```

## To Run

`npm start` to be run for Canvas

To run on Brightspace/D2L, see documentation inside of `brightspace-fix.js`

## Process

1. Get the topics/module items from either Brightspace or Canvas
2. Parse through them to find one that has the old url
3. Replace/ update the item with the new url

## Log Categories

List the categories used in logging data in your module.

- End of Course Evaluation Link Replaced

## Requirements

This module is to find and replace all old End of Course Evaluation links in Canvas and Brightspace