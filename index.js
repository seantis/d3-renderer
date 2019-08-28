var bodyParser = require('body-parser');
var d3 = require('d3');
var express = require('express');
var jsdom = require('jsdom');
var vm = require('vm');

var app = express();
app.use(bodyParser.json());

function createChart(scripts, main, params) {
    // Create and patch the jsdom document to calculate the bounding box.
    // This is very limited, no child elements, only pixel font sizes.
    // See https://gist.github.com/TorsteinHonsi/e8a1e6971608523eb8dd.
    var document = jsdom.jsdom();
    var oldCreateElementNS = document.createElementNS;
    document.createElementNS = function(ns, tagName) {
        var elem = oldCreateElementNS.call(this, ns, tagName);
        elem.getBBox = function () {
            var fontSize = parseInt(elem.style.fontSize, 10) || 0;
            var height = Math.max(
                parseInt(elem.getAttribute('height'), 10) || 0,
                fontSize < 24 ? fontSize + 3 : Math.round(fontSize * 1.2)
            );
            var width = Math.max(
                parseInt(elem.getAttribute('width'), 10) || 0,
                elem.textContent.length * fontSize * 0.55
            );
            return {x: 0, y: 0, width: width, height: height};
        };
        elem.getComputedTextLength = function() {
            var fontSize = parseInt(elem.style.fontSize, 10) || 0;
            var width = Math.max(
                parseInt(elem.getAttribute('width'), 10) || 0,
                elem.textContent.length * fontSize * 0.55
            );
            return width;
        };
        return elem;
    };

    // Set up the context & execute the scripts and main function ('chart(params)(container)')
    var context = new vm.createContext({
        d3: d3,
        params: params,
        container: document.body
    });
    for (var i = 0; i < scripts.length; i++) {
        vm.runInContext(scripts[i], context);
    }
    vm.runInContext(main + '(params)(container)', context);

    // Extract the svg
    var svg = '';
    elements = context.container.getElementsByTagName('svg');
    if (elements.length) {
        svg = d3.select(elements[0]).node().outerHTML;
    }

    return svg;
}

app.post('/d3/svg', function(req, res) {
    if (req.body.scripts && req.body.main && req.body.params) {
        try {
            var svg = createChart(req.body.scripts, req.body.main, req.body.params);

            res.writeHead(200, {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
              'Access-Control-Request-Method': '*',
              'Access-Control-Allow-Methods': '*',
              'Content-Type': 'image/svg+xml; charset=utf-8'
            });
            res.end(svg);
        } catch(e) {
            res.status(400);
            res.send(e.stack);
        }
    } else {
        res.status(400);
        res.send(
            "Missing parameters. Make sure to send a valid JSON request."
        );
    }
});

var server = app.listen(1337, function () {
    var host = server.address().address;
    var port = server.address().port;
});
