# OMS Query

This sample shows how to query the Log Analytics component of Operational Management Suite.

## Configuration

* Create a Log Analytics resource in Azure and point it to your OMS instance (or create a new OMS instance).
* Create a Azure AD Web App and grant it READER rights on the subscription, the Resource Group, or Log Analystics resource.
* Rename the config/sample.default.json to config/default.json.
* Put all the connectivity information into the config/default.json file.

To use the ARM API:
* You will need to follow the additional steps detailed here: https://dev.loganalytics.io/documentation/1-Tutorials/ARM-API
* Reading Log Analytics data using the application permissions says it requires administrative consent (that wasn't true in my testing), but you might need to run the consent instructions below.

## Query

There are 3 different query endpoints you can call...

```bash
node oms --api legacy query
node oms --api direct query
node oms --api arm query
```

Optionally, you can supply parameters to override the Resource Group, Workspace, and Workpace ID in the configuration file.

```bash
  Usage: oms [options] [command]


  Options:

    -V, --version                 output the version number
    --api <value>                 Specify the API to use between: legacy, direct, azure.
    --docs                        Show all documentation links.
    -r, --resource-group <value>  Specify a Resource Group other than the one in the settings file.
    -w, --workspace <value>       Specify a Workspace Name other than the one in the settings file.
    -i, --workspace-id <value>    Specify a Workspace ID other than the one in the settings file.
    -h, --help                    output usage information


  Commands:

    docs      Show all documentation links.
    consent   Get the consent URL for the new API.
    info      Get the info regarding the workspace.
    query     Query OMS.
```

## Info

You can run the command like this...

```bash
node oms info
```

...to get the information about the workspace in the file or...

```bash
node oms --workspace myworkspace info
```

...to get information about a specified workspace.

One reason to get the workspace information is to find out what version of the query system you are using. The version can be found under "properties/features/searchVersion".

* 0 is the legacy query syntax
* 1 is the new query syntax

## Consent

To apply administrative consent (which didn't actually appear to be required despite the notification), you can run...

```bash
node oms consent
```

You can then use an administrative account to go through administrative consent to approve the application.