
// import
const config = require("config");
const adal = require("adal-node");
const request = require("request");
const cmd = require("commander");
const qs = require("querystring");

// configuration
const authority = config.get("authority");
const directory = config.get("directory");
const subscription = config.get("subscription");
const clientId = config.get("clientId");
const clientSecret = config.get("clientSecret");
const resourceGroup = config.get("resourceGroup");
const workspace = config.get("workspace");
const workspaceId = config.get("workspaceId");

cmd
    .version("0.2.0")
    .option("--api <value>", "Specify the API to use between: legacy, direct, azure.");

cmd
    .command("consent")
    .description("Get the consent URL for the new API.")
    .action(_ => {
        const stateToken = "not_needed";
        const redirectUri = "http://fakeuri";
        const resource = "https://api.loganalytics.io";
        const consent = authority + directory + "/oauth2/authorize?response_type=code&client_id=" + qs.escape(clientId) + "&redirect_uri=" + qs.escape(redirectUri) + "&state=" + qs.escape(stateToken) + "&resource=" + qs.escape(resource) + "&prompt=consent";
        console.log("The consent URL is:\n" + consent);
    });

cmd
    .command("info")
    .description("Get the info regarding the workspace.")
    .option("-w, --workspace <value>", "Specify a workspace other than the one in the settings file")
    .action(options => {
        const effective_workspace = options.workspace || workspace;
        const context = new adal.AuthenticationContext(authority + directory);
        context.acquireTokenWithClientCredentials("https://management.azure.com/", clientId, clientSecret, (error, tokenResponse) => {
            if (!error) {
                request.get({
                    uri: `https://management.azure.com/subscriptions/${subscription}/resourcegroups/${resourceGroup}/providers/Microsoft.OperationalInsights/workspaces/${effective_workspace}?api-version=2015-03-20`,
                    headers: {
                        Authorization: `Bearer ${tokenResponse.accessToken}`
                    },
                    json: true
                }, (error, response, body) => {
                    if (!error && response.statusCode == 200) {
                        console.log(body);
                    } else {
                        if (error) { console.error("error(401): " + error) } else { console.error("error(402)"); console.log(body); };
                    }
                });
            } else {
                console.error("error(400): " + error);
            }
        });
    });

cmd
    .command("query")
    .description("Query OMS.")
    .action(_ => {
        switch (cmd.api) {

            case "legacy":

                // query using the legacy API
                const context1 = new adal.AuthenticationContext(authority + directory);
                context1.acquireTokenWithClientCredentials("https://management.azure.com/", clientId, clientSecret, (error, tokenResponse) => {
                    if (!error) {
                        request.post({
                            uri: `https://management.azure.com/subscriptions/${subscription}/resourceGroups/${resourceGroup}/providers/Microsoft.OperationalInsights/workspaces/${workspace}/search?api-version=2015-03-20`,
                            headers: {
                                Authorization: `Bearer ${tokenResponse.accessToken}`
                            },
                            body: {
                                top: 100,
                                query: "Type=Event or Type=Syslog",
                                start: "2017-04-17T00:00:00Z",
                                end: "2017-04-17T23:59:59Z"
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
                break;

            case "direct":

                // query using the direct API
                const context2 = new adal.AuthenticationContext(authority + directory);
                context2.acquireTokenWithClientCredentials("https://api.loganalytics.io", clientId, clientSecret, (error, tokenResponse) => {
                    if (!error) {
                        request.post({
                            uri: `https://api.loganalytics.io/v1/workspaces/${workspaceId}/query`,
                            headers: {
                                Authorization: `Bearer ${tokenResponse.accessToken}`
                            },
                            body: {
                                query: "Perf",
                                timespan: "PT12H"
                            },
                            json: true
                        }, (error, response, body) => {
                            if (!error && response.statusCode == 200) {
                                console.log(body);
                            } else {
                                if (error) { console.error("error(201): " + error) } else { console.error("error(202)"); console.log(body); };
                            }
                        });
                    } else {
                        console.error("error(200): " + error);
                    }
                });
                break;

            case "azure":

                // query using the new Azure API
                const context3 = new adal.AuthenticationContext(authority + directory);
                context3.acquireTokenWithClientCredentials("https://management.azure.com/", clientId, clientSecret, (error, tokenResponse) => {
                    if (!error) {
                        request.post({
                            uri: `https://management.azure.com/subscriptions/${subscription}/resourceGroups/${resourceGroup}/providers/Microsoft.OperationalInsights/workspaces/${workspaceId}/query?api-version=2017-04-26-preview`,
                            headers: {
                                Authorization: `Bearer ${tokenResponse.accessToken}`
                            },
                            body: {
                                query: "union Event, Syslog",
                                timespan: "PT12H"
                            },
                            json: true
                        }, (error, response, body) => {
                            if (!error && response.statusCode == 200) {
                                console.log(body);
                            } else {
                                if (error) { console.error("error(301): " + error) } else { console.error("error(302)"); console.log(body); };
                            }
                        });
                    } else {
                        console.error("error(300): " + error);
                    }
                });
                break;

        }
    });

cmd.parse(process.argv);