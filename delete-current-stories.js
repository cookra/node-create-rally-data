var workspaceRef = '/workspace/33663719110'; //N Data
var today = new Date().toISOString();

var rally = require('rally'),
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

findAll();
    
function findAll(){
    rallyApi.query({
        type: 'hierarchicalrequirement',
        query: (queryUtils.where('Iteration.StartDate', '<=', today)).and('Iteration.EndDate', '>=', today),
        limit: Infinity, 
        scope: {
            workspace: workspaceRef 
    },
    requestOptions: {} 
    }, function(error, result) {
        if(error) {
            console.log(error);
        } else {
            bulkDelete(result.Results);
        }
    });
  
}
    

function bulkDelete(results){
    console.log('deleting ' + results.length + ' stories');
    for(var i=0;i<results.length;i++){
        rallyApi.del({
            ref: results[i]._ref, 
            scope: {
                workspace: workspaceRef 
            },
            requestOptions: {} 
        }).then(function(result) {
            console.log(result);
        }).fail(function(errors) {
             console.log(errors);
        });
    }
    
}