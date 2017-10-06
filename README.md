# OMS Query

This sample shows how to query the Log Analytics component of Operational Management Suite.

## Configuration

* Create a Log Analytics resource in Azure and point it to your OMS instance (or create a new OMS instance).
* Create a Azure AD Web App and grant it READER rights on the subscription or at least the Resource Group that contains Log Analytics.
* Rename the config/sample.default.json to config/default.json.
* Put all the connectivity information into the config/default.json file.

## Execution

```bash
node index.js
```

## Info

You can run the command like this...

```bash
node index.js info
```

...to get the information about the workspace in the file or...

```bash
node index.js --workspace myworkspace info
```

...to get information about a specified workspace.

One reason to get the workspace information is to find out what version of the query system you are using. The version can be found under "properties/features/searchVersion".

* 0 is the legacy query syntax
* 1 is the new query syntax
