var q = require('q');
var _ = require('lodash');

var rally = null;
var workspaceRef = '/workspace/33663719110'; //N Data
var userOids = ['35492101293','35492816963','35493297168']; //kepler,tyhobrahe,klampakis
var scheduledStories = [];
var today = new Date().toISOString();

createRally();
findStoriesInCurrentIteration()
    .then(updateStories)
    .then(findEpicsLinkedToFeaturesInCurrentRelease)
    .then(setParent)
    .then(onSuccess)
    .fail(onError);




function createRally(){
    rally = require('rally'),
    queryUtils = rally.util.query,
    rallyApi = rally({
        apiKey: '_WrzFG5niQoOQ97Jj6GAxKYfuISNlELjmKeNTsRYgA',   
        server: 'https://rally1.rallydev.com',  
        requestOptions: {
            headers: {
                'X-RallyIntegrationName': 'Nick\'s node.js program',  
                'X-RallyIntegrationVendor': 'Rally Labs',             
                'X-RallyIntegrationVersion': '1.0'                    
            }
        }
    });
}



function findStoriesInCurrentIteration(result){
    return rallyApi.query({
        type: 'hierarchicalrequirement',
        limit: Infinity,
        fetch: ['FormattedID', 'Name', 'PlanEstimate', 'TaskEstimateTotal','Release'],
        query: (queryUtils.where('Iteration.StartDate', '<=', today)).and('Iteration.EndDate', '>=', today),
        scope: {
            workspace: workspaceRef
        },
    });   
}


function updateStories(result){
    console.log('stories length', result.Results.length);
    var stories = [];
    for(var i=0;i<result.Results.length;i++){
        var planEst = Math.floor(result.Results[i].TaskEstimateTotal/2);
        stories.push(rallyApi.update({
            ref: result.Results[i]._ref,
            data: {
                PlanEstimate: planEst
            },
            fetch: ['ObjectID','FormattedID','Release','Project','TaskEstimateTotal','PlanEstimate','Parent']
        }));
    }
    return q.all(stories);
}


function findEpicsLinkedToFeaturesInCurrentRelease(result){
    for(var i=0;i<result.length;i++){
        scheduledStories.push(result[i].Object);
    }
    var query = queryUtils.where('Feature.Release.ReleaseStartDate', '<=', today);
    query = query.and('Feature.Release.ReleaseDate', '>=', today);
    query = query.and('Release', '=', null);
    var queryString = query.toQueryString();
    
    return  rallyApi.query({
                type: 'hierarchicalrequirement',
                limit: Infinity,
                fetch: ['FormattedID', 'Name', 'Feature','Project','Children'],
                query: queryString,
                scope: {
                    workspace: workspaceRef
                }
    });   
   
}

function setParent(result){
    //Children collection on a parent is read-only, have to update Parent on each story
    console.log('epics length', result.Results.length);
    var stories = [];
    for(var i=0;i<scheduledStories.length;i++){
        var epicsInProject = _.filter(result.Results, function(epic){
            return epic.Project._refObjectName === scheduledStories[i].Project._refObjectName;
        });
        if (epicsInProject.length != 0) {
            var index = randomInt (0, epicsInProject.length - 1);
            var parentRef = epicsInProject[index]._ref;
            stories.push(rallyApi.update({
                ref: scheduledStories[i]._ref,
                data: {
                    Parent: parentRef
                },
                fetch: ['ObjectID','FormattedID','Release','Project','TaskEstimateTotal','PlanEstimate','Parent']
            }));
        }
    }
}

function setOwner() {
    var min = 0;
    var max = userOids.length-1;
    return 'https://rally1.rallydev.com/slm/webservice/v2.0/user/' + userOids[randomInt(min,max)];
}

function randomInt (low, high) {
        return Math.floor(Math.random() * (high - low + 1) + low);
}

function onSuccess(result) {
    console.log('Success!');
}


function onError(errors) {
    console.log('Failure!', errors);
}