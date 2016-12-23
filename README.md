# Installation

## Setup the Development Environment

1) Install node:

```
brew install node
```

2) Set up the environment:

```
git clone ... ...
cd ...
virtualenv .
pip install nodeenv
nodeenv --python-virtualenv --clean-src .
```

3) Install this application:

```
npm install
```

Now you can run the service:

```
node .
```


# Using the service

Simply `POST` your code and arguments and receive the SVG in return.

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
var chart = barChart({data: data})(el);
```

or as follows:

```javascript
var chart = barChart(el);
d3.select(..).call(chart);
```

## POST request

Send the script together with the parameters as `JSON` to `http://127.0.0.1:1337/d3/svg`.
Add the scripts in order you want to run them (the latest d3js version is
already set up, no need to include it).

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

## PDF

There are some solutions for PDF rendering of SVG images:
- [Using LibRSVG](https://github.com/2gis/node-rsvg)
- [Using PDFKit](https://github.com/devongovett/svgkit)
- [Using PhantonJS](http://stackoverflow.com/a/16124992/3690178)


## PhantomJS

Using `jsdom` to render SVG's is probably not the best idea since it does not implement such things as getBBox - which we therefore need to implement ourselves. [PhantomJS](https://www.npmjs.com/package/phantomjs-prebuilt) would be probably a better option (and also solve the PDF rendering).
