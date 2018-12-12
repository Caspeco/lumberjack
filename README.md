# Lumberjack - 👓 log viewer for Application Insights

Lumberjack is an open source log viewer for reading exceptions and traces written to [Microsoft Application Insights](https://azure.microsoft.com/en-us/services/application-insights/).

The app gives you a graphical interface to view, navigate and query your logs.

It will give you an overview of your logs with a chart that shows you amount of traces vs errors & warnings. ![Chart](https://user-images.githubusercontent.com/357283/42462304-2b79834e-83a3-11e8-98fe-0abbcadb35ef.png).

## Features

* Fast Querying - Lumberjack runs the queries on your Microsoft Application Insights over rest.
* Fast rendering - We use backgroundworkers to parse the query result and to make sure the UI allows smooth scrolling through thousands of rows.
* Graph overview so you can easily spot outliers and context.
* Support for hashtags - if your trace message contains `#something` you can click and immediately search for the hasthag.
* Select & grep - Select any text and hit `ctrl+enter` to grep for that text.
* Search/filter property - Filter for any property, e.g. `client_City:Dublin`.
* Exclude filter - use `-` to exclude logs from your search, e.g. `-client_City:Dublin`.
* Auto refresh mode - Automatically refresh the logs every 60 seconds, perfect for dashboard screens.
* Clickable OperationID - to quickly view related logs and errors.
* Supports multiple App insights apps

## Hotkeys
 * `enter`: Refresh/run the query
 * `shift+left`: Go back in the query history (Also available through browser back button)
 * `shift+right`: Go forward in query history
 * `ctrl+enter`: Grep with currently selected text
 * `ctrl+click`: Open details view for row by ctrl+clicking on it

## Custom queries
Lumberjack allows you to inject custom query text to the `@@`-property or the shorthand `@` for simple customdimension properties.  
For example:

* `@@:"duration > 100"`
* `@@:"customDimensions.elapsedMilliseconds >= 900"`
* `@@:"customDimensions['elapsed'] > 100 and customDimensions['requestVerb'] == 'POST'"`

Since filtering on custom dimensions is common, it has a shortcut: `@:"elapsedMilliseconds >= 900"`. This shortcut will only work for simple scenarios where you filter on one condition and the customDimension-name does not include spaces. For advanced custom querying, use the `@@`-syntax.

Examples of customdimension queries:

* `@:"elapsed > 100"`
* `@:"CorrelationId == 'abc'"`
* `@:"CorrelationId startswith 'x1'"`

## To get started using it

1. Clone the repo
2. Install dependencies with `yarn`
3. Run `yarn start`.
4. Enter your Application Insights AppID and API key in settings.


