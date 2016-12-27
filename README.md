# Installation

## Setup the Development Environment

```
brew install node
git clone git@github.com:seantis/d3-renderer.git
cd d3-renderer
npm install
```

Now you can run the service:

```
node .
```

Or the PhantomJS version:

```
phantomjs server.js
```

The node version is faster but doesn't support PDF generation at the moment and bounding boxes only to some extent.

# Using the service

Simply `POST` your code to `http://127.0.0.1:1337` and arguments and receive the SVG or PDF in return.

## Client side code

The service expects code following a slightly modified version of [Mike Bostocks reusable charts pattern](https://bost.ocks.org/mike/chart).
Define your code as follows.

```javascript
var myNewChart = function(params) {
    var data = {};
    // add more parameters such as width, height, ...

    if (params) {
        if (params.data) data = params.data;
        // initalize the other parameter ...
    }

    var chart = function(container) {
        var svg = d3.select(container).append('svg')
            .attr('xmlns', "http://www.w3.org/2000/svg")
            .attr('version', '1.1');
        // more rendering ...
        return chart;
    };

    // optionally add chained getter/setters ...

    return chart;
};
```

The code can then be used locally as follows:
```javascript
var chart = barChart({option: value})(el);
```

or as follows:

```javascript
var chart = barChart(el);
d3.select(..).call(chart);
```

## POST request

Send the script together with the parameters as `JSON` to `http://127.0.0.1:1337/d3/svg` or  `http://127.0.0.1:1337/d3/pdf` .
Add the scripts in order you want to run them (the latest d3js version is already set up, no need to include it).

```json
{
    "scripts": [
        "/* content of d3 plugins (optionally) */",
        "/* your code */",
    ],
    "main": "myNewChart",
    "params": {
        "data": {}
    }
}
```

# Improvements

## PDF for the node version

There are some solutions for PDF rendering of SVG images:
- [Using LibRSVG](https://github.com/2gis/node-rsvg)
- [Using PDFKit](https://github.com/devongovett/svgkit)

