var workspaceRef = '/workspace/33663719110'; //N Data

var topReleases = [];
var millisecondsInDay = 86400000;

var rally = require('rally'),
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
    var prompt = require('prompt');
    
    var schema = {
        properties: {
            create_releases: {
                message: 'Create timeboxes? yes/no',
                required: true
        },
            create_iterations: {
                message: 'Create features? yes/no',
                required: true
            }
    }
  };

    prompt.start();

    prompt.get(schema, function (err, result) {
        if (err) {
            return onErr(err);
        }
        else{
            console.log('input received:');
            if (result.create_releases === 'yes') {
                getProjects(workspaceRef);
            }
            return 1;
        }
        
                
    });

    function onErr(err) {
        console.log(err);
        return 1;
    }
    
    function getProjects(workspaceRef){
        var projectRefs = [];
        var topProjectRefs = [];
        rallyApi.query({
            ref: workspaceRef + '/projects',
            limit: Infinity,
            fetch: ['Name','ObjectID','State','Children','Parent'],
            query: queryUtils.where('State', '=', 'Open'),
            requestOptions: {}
            
        }).then(function(results) {
            for (var i=0; i<results.Results.length; i++){
                projectRefs.push(results.Results[i]._ref);
                if (results.Results[i].Parent === null) {
                    topProjectRefs.push(results.Results[i]._ref);
                }
            }
            createTimeboxes(projectRefs,topProjectRefs);
        }).fail(function(errors) {
            console.log(errors);
            return 0;
        
        });
    }
    
    
    function createTimeboxes(projectRefs, topProjectRefs){
        console.log('Count of Projects', projectRefs.length);
        for(var i=0;i<projectRefs.length;i++){
            console.log(projectRefs[i]);
        }
        createReleases(projectRefs);
        createIterations(projectRefs);
        createMilestones(topProjectRefs);
    }
    
    function createReleases(projectRefs){
        for(var i=0;i<projectRefs.length;i++){
            console.log('PROJECT REF', projectRefs[i]);
        }
        console.log('CREATING RELEASES...');
        var releases = [];
        var numOfReleasesEachProject = 2;//3 
        var releaseLength = 30;
        var today = new Date();
        
        for(var n=0; n<numOfReleasesEachProject; n++){
            var releaseStartDate = new Date(today.getTime() + millisecondsInDay*n*(releaseLength));
            var releaseDate = new Date(releaseStartDate.getTime() + millisecondsInDay*releaseLength);
            var releaseName = 'Release ' + n;
            
            for(var i=0;i<projectRefs.length;i++){
                rallyApi.create({
                type: 'release', 
                data: {
                    Name: releaseName,
                    ReleaseStartDate: releaseStartDate.toISOString(),
                    ReleaseDate: releaseDate.toISOString(),
                    State: 'Planning'
                },
                fetch: ['ObjectID'],  
                scope: {
                    project: projectRefs[i]
                },
                requestOptions: {} 
                }, function(error, result) {
                    if(error) {
                        console.log(error);
                    } else {
                        releases.push(result.Object._ref);
                    }
                });
            }
        }
    }
    
    function createIterations(projectRefs){
        console.log('CREATING ITERATIONS...');
        var iterations = [];
        var numOfIterationsEachProject = 2;//6
        var iterationLength = 15;

        var today = new Date();
        
        for(var n=0;n<numOfIterationsEachProject;n++){
            var iterationStartDate = new Date(today.getTime() + millisecondsInDay*n*(iterationLength));
            var iterationEndDate = new Date(iterationStartDate.getTime() + millisecondsInDay*iterationLength);
            var iterationName = 'Iteration ' + n;
            
            for(var i=0;i<projectRefs.length;i++){
                rallyApi.create({
                    type: 'iteration', 
                    data: {
                        Name: iterationName,
                        StartDate: iterationStartDate.toISOString(),
                        EndDate: iterationEndDate.toISOString(),
                        State: 'Planning'
                    },
                    fetch: ['ObjectID'],  
                    scope: {
                        project: projectRefs[i]
                    },
                    requestOptions: {} 
                },  function(error, result) {
                        if(error) {
                            console.log(error);
                        } else {
                            iterations.push(result.Object._ref);
                        }
                    });
            }
        }
    }
    
    function createMilestones(topProjectRefs){
        console.log('CREATING MILESTONES...');
        var randomDaysBeforeRelease = randomInt(1, 7);
        var milestones = [];
        for(var i=0;i<topProjectRefs.length;i++){
            rallyApi.query({
                type: 'release',        
                limit: Infinity,
                fetch: ['ReleaseStartDate', 'ReleaseDate','Project'],
                query: queryUtils.where('Project', '=', topProjectRefs[i])
            }).then(function(results) {
                console.log('going back ' + randomDaysBeforeRelease + ' days');
                for (var i=0; i<results.Results.length; i++){
                    topReleases.push(results.Results[i])
                    var milestoneDate = new Date((new Date(results.Results[i].ReleaseDate.substring(0,10))) - millisecondsInDay*randomDaysBeforeRelease);
                    var targetProjectRef = results.Results[i].Project._ref;
                    var targetProjectName = results.Results[i].Project._refObjectName;
                    var milestoneName = 'Milestone' + i + ' in ' + targetProjectName;
                    
                    rallyApi.create({
                        type: 'milestone',
                        data: {
                            Name: milestoneName,
                            TargetDate: milestoneDate,
                            TargetProject: targetProjectRef
                        },
                        fetch: ['ObjectID'],  
                        scope: {
                            project: targetProjectRef
                        },
                        requestOptions: {} 
                        },  function(error, result) {
                            if(error) {
                                console.log(error);
                            } else {
                                milestones.push(result.Object._ref);
                            }
                    });
                } 
            }).fail(function(errors) {
                console.log(errors);
                return 0;
            });
        }
    }
    
    function randomInt (low, high) {
        return Math.floor(Math.random() * (high - low) + low);
    }
    