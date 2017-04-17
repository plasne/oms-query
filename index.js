
// import
const config = require("config");
const adal = require("adal-node");
const request = require("request");

// configuration
const authority = config.get("authority");
const directory = config.get("directory");
const subscription = config.get("subscription");
const resourceGroup = config.get("resourceGroup");
const workspace = config.get("workspace");
const clientId = config.get("clientId");
const clientSecret = config.get("clientSecret");

// authenticate
const context = new adal.AuthenticationContext(authority + directory);
context.acquireTokenWithClientCredentials("https://management.core.windows.net/", clientId, clientSecret, (error, tokenResponse) => {
    if (!error) {

        // query
        request.post({
            "uri": "https://management.azure.com/subscriptions/" + subscription + "/resourceGroups/" + resourceGroup + "/providers/Microsoft.OperationalInsights/workspaces/" + workspace + "/search?api-version=2015-03-20",
            "headers": {
                "Authorization": "bearer " + tokenResponse.accessToken
            },
            body: {
                "top": 100,
                "query": "*",
                "start": "2017-04-17T00:00:00Z",
                "end": "2017-04-17T23:59:59Z"
            },
            json: true
        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                console.log(body);
            } else {
                if (error) { console.error("error(101): " + error) } else { console.error("error(102)"); console.log(body); };
            }
        });

    } else {
        console.error("error(100): " + error);
    }
});
