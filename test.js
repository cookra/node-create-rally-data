var rally = null;
var workspaceRef = '/workspace/33663719110'; //N Data
var millisecondsInDay = 86400000;

createRally();

getProjects()
    .then(makeReleases)
    //.then(makeIterations)
    .then(onSuccess)
    .fail(onError);


function createRally(){
    rally = require('rally'),
    queryUtils = rally.util.query,
    rallyApi = rally({
        apiKey: '_abc123', 
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


function getProjects() {
    return rallyApi.query({
        ref: workspaceRef + '/projects',
        limit: Infinity,
        fetch: ['Name','ObjectID','State','Children','Parent'],
        query: queryUtils.where('State', '=', 'Open'),
        requestOptions: {}
    });
}


function makeReleases(result) {
    console.log('CREATING RELEASES...');
    var releases = [];
    var numOfReleasesEachProject = 2;
    var releaseLength = 30;
    var today = new Date();
        for(var n=0; n<numOfReleasesEachProject; n++){
            var releaseStartDate = new Date(today.getTime() + millisecondsInDay*n*(releaseLength));
            var releaseDate = new Date(releaseStartDate.getTime() + millisecondsInDay*releaseLength);
            var releaseName = 'Release ' + n;
            for(var i=0; i<result.Results.length; i++){    
                releases.push(rallyApi.create({
                    type: 'release',
                    data: {
                        Name: releaseName,
                        ReleaseStartDate: releaseStartDate.toISOString(),
                        ReleaseDate: releaseDate.toISOString(),
                        State: 'Planning'
                    },
                    fetch: ['ObjectID','Project'],  
                    scope: {
                        project: result.Results[i]
                    },
                }));
            }
        }
    return releases;
}

function onSuccess(result) {
    console.log('Success!', result);
}


function onError(errors) {
    console.log('Failure!', errors);
}