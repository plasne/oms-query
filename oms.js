
// import
const config = require("config");
const adal = require("adal-node");
const request = require("request");
const cmd = require("commander");
const qs = require("querystring");
const crypto = require("crypto");

// configuration
const authority = config.get("authority");
const directory = config.get("directory");
const subscription = config.get("subscription");
const clientId = config.get("clientId");
const clientSecret = config.get("clientSecret");
const resourceGroup = config.get("resourceGroup");
const workspace = config.get("workspace");
const workspaceId = config.get("workspaceId");
const workspaceKey = config.get("workspaceKey");

cmd
    .version("0.2.0")
    .option("-r, --resource-group <value>", "Specify a Resource Group other than the one in the settings file.")
    .option("-w, --workspace <value>", "Specify a Workspace Name other than the one in the settings file.")
    .option("-i, --workspace-id <value>", "Specify a Workspace ID other than the one in the settings file.");

const use_resourceGroup = cmd.resourceGroup || resourceGroup;
const use_workspace = cmd.workspace || workspace;
const use_workspaceId = cmd.workspaceId || workspaceId;

cmd
    .command("docs")
    .description("Show all documentation links.")
    .action(_ => {
        console.log("New Query API:")
        console.log("  https://docs.loganalytics.io/");
        console.log("  https://dev.loganalytics.io/");
        console.log("  https://dev.loganalytics.io/documentation/1-Tutorials/ARM-API - you must follow these instructions to configure application permissions.")
    });

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
    .action(_ => {
        const context = new adal.AuthenticationContext(authority + directory);
        context.acquireTokenWithClientCredentials("https://management.azure.com/", clientId, clientSecret, (error, tokenResponse) => {
            if (!error) {
                request.get({
                    uri: `https://management.azure.com/subscriptions/${subscription}/resourcegroups/${use_resourceGroup}/providers/Microsoft.OperationalInsights/workspaces/${use_workspace}?api-version=2015-03-20`,
                    headers: {
                        Authorization: `Bearer ${tokenResponse.accessToken}`
                    },
                    json: true
                }, (error, response, body) => {
                    if (!error && response.statusCode == 200) {
                        console.log(body);
                    } else if (error) {
                        console.error(`error(401): ${error}`);
                    } else {
                        console.error(`error(402) ${response.statusCode}: ${response.statusMessage}`);
                    }
                });
            } else {
                console.error("error(400): " + error);
            }
        });
    });

cmd
    .command("post")
    .description("Posts a message to the OMS workspace.")
    .action(_ => {

        // create a demo message
        const message = {
            "field1": "stuff",
            "field2": "things"
        };

        // create the signature
        const ts = (new Date()).toUTCString(); // current timestamp in RFC-1123
        const payload = JSON.stringify(message);
        const len = payload.length;
        const code = `POST\n${len}\napplication/json\nx-ms-date:${ts}\n/api/logs`;
        const hmac = crypto.createHmac("sha256", new Buffer(workspaceKey, "base64"));
        const signature = hmac.update(code, "utf-8").digest("base64");

        // post
        request.post({
            uri: `https://${use_workspaceId}.ods.opinsights.azure.com/api/logs?api-version=2016-04-01`,
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Log-Type": "demo",
                "x-ms-date": ts,
                "Authorization": `SharedKey ${use_workspaceId}:${signature}`
            },
            body: payload
        }, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                console.log("posted successfully");
            } else if (error) {
                console.error(`error(301): ${error}`);
            } else {
                console.error(`error(302) ${response.statusCode}: ${response.statusMessage}`);
            }
        });

    });

cmd
    .command("query <api>")
    .description("Query OMS.")
    .action(api => {
        switch (api) {

            case "legacy":

                // query using the legacy API
                const context1 = new adal.AuthenticationContext(authority + directory);
                context1.acquireTokenWithClientCredentials("https://management.azure.com/", clientId, clientSecret, (error, tokenResponse) => {
                    if (!error) {
                        request.post({
                            uri: `https://management.azure.com/subscriptions/${subscription}/resourceGroups/${use_resourceGroup}/providers/Microsoft.OperationalInsights/workspaces/${use_workspace}/search?api-version=2015-03-20`,
                            headers: {
                                Authorization: `Bearer ${tokenResponse.accessToken}`
                            },
                            body: {
                                top: 5,
                                query: "*",
                                start: new Date(new Date() - 24 * 60 * 60 * 1000).toISOString(),
                                end: new Date().toISOString()
                            },
                            json: true
                        }, (error, response, body) => {
                            if (!error && response.statusCode == 200) {
                                console.log(body);
                            } else if (error) {
                                console.error(`error(101): ${error}`);
                            } else {
                                console.error(`error(102) ${response.statusCode}: ${response.statusMessage}`);
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
                            uri: `https://api.loganalytics.io/v1/workspaces/${use_workspaceId}/query`,
                            headers: {
                                Authorization: `Bearer ${tokenResponse.accessToken}`
                            },
                            body: {
                                query: "search * | limit 5",
                                timespan: "PT24H"
                            },
                            json: true
                        }, (error, response, body) => {
                            if (!error && response.statusCode == 200) {
                                console.log(body);
                            } else if (error) {
                                console.error(`error(201): ${error}`);
                            } else {
                                console.error(`error(202) ${response.statusCode}: ${response.statusMessage}`);
                                console.log("NOTE: This error is expected since the Direct API does not currently support application permissions, only delegate permissions.");
                            }
                        });
                    } else {
                        console.error("error(200): " + error);
                    }
                });
                break;

            case "arm":

                // query using the new ARM API
                const context3 = new adal.AuthenticationContext(authority + directory);
                context3.acquireTokenWithClientCredentials("https://management.azure.com/", clientId, clientSecret, (error, tokenResponse) => {
                    if (!error) {
                        request.post({
                            uri: `https://management.azure.com/subscriptions/${subscription}/resourceGroups/${use_resourceGroup}/providers/Microsoft.OperationalInsights/workspaces/${use_workspace}/query?api-version=2017-10-01`,
                            headers: {
                                Authorization: `Bearer ${tokenResponse.accessToken}`
                            },
                            body: {
                                query: "demo_CL | limit 5",
                                timespan: "PT24H"
                            },
                            json: true
                        }, (error, response, body) => {
                            if (!error && response.statusCode == 200) {
                                console.log(body.tables[0].columns);
                                console.log(body.tables[0].rows);
                            } else if (error) {
                                console.error(`error(301): ${error}`);
                            } else {
                                console.error(`error(302) ${response.statusCode}: ${response.statusMessage}`);
                            }
                        });
                    } else {
                        console.error(`error(300): ${error}`);
                    }
                });
                break;

        }
    });

cmd.parse(process.argv);