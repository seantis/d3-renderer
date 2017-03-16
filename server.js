var fs = require('fs');
var Routes = require('./Routes.js');
var webpage = require('webpage');

var app = new Routes();

app.post('/d3/svg', function(req, res) {
    data = JSON.parse(req.post);

    if (data.scripts && data.main && data.params) {
        page = webpage.create();
        page.viewportSize = {
            width: data.params.viewport_width || 1000,
            height: data.params.viewport_height || 1000
        };
        page.setContent('<html><head><meta charset="utf-8"></head><body></body></html>', 'http://www.nohost.org');
        page.injectJs('d3.min.js');

        var scripts = '';
        for (var i = 0; i < data.scripts.length; i++) {
            scripts += '\n' + data.scripts[i];
        }
        var params = 'var params=JSON.parse(\'' + JSON.stringify(data.params) + '\');';
        var main = data.main + '(params)(d3.select("body").node());';
        page.evaluateJavaScript('function(){' + scripts + params + main + '}');

        var svg = page.evaluate(function() {return (new XMLSerializer()).serializeToString(document.querySelector('svg'));});
        res.header('Content-Type', 'image/svg+xml; charset=utf-8');
        res.send(svg);
    } else {
        res.statusCode = 400;
        res.send(
            "Missing parameters. Make sure to send a valid JSON request."
        );
    }
});

app.post('/d3/pdf', function(req, res) {
    data = JSON.parse(req.post);

    if (data.scripts && data.main && data.params) {
        // Create the page
        page = webpage.create();
        page.setContent(
            '<html><head></head><body><div id="viewport"></div></body></html>',
            'http://www.nohost.org'
        );
        page.injectJs('d3.min.js');

        // Run the script on the viewport, save as window.chart
        var scripts = '';
        for (var i = 0; i < data.scripts.length; i++) {
            scripts += '\n' + data.scripts[i];
        }
        var params = 'var params=JSON.parse(\'' + JSON.stringify(data.params) + '\');';
        var main = 'window.chart = ' + data.main + '(params)(d3.select("#viewport").node());';
        page.evaluateJavaScript('function(){' + scripts + params + main + '}');

        // Set the viewport
        width = page.evaluate(function(){
            if (window.chart && window.chart.width) return window.chart.width();
            return null;
        });
        height = page.evaluate(function(){
            if (window.chart && window.chart.height) return window.chart.height();
            return null;
        });
        page.viewportSize = {
            width: data.params.viewport_width || width || 1000,
            height: data.params.viewport_height || height || 1000
        };

        // Save as PDF
        if (!fs.exists('tmp')) {
            fs.makeDirectory('tmp');
        }
        var filename = 'tmp/' + (new Date().getTime().toString()) + '.pdf';

    	page.clipRect = page.evaluate(function() {
    		return document.querySelector('#viewport').getBoundingClientRect();
    	});
        page.render(filename, {format: 'pdf'});

        var pdf = btoa(fs.open(filename, 'rb').read());
        fs.remove(filename);

        // Return the PDF
        res.header('Content-Type', 'application/base64');
        res.header('Content-Length', pdf.length.toString());
        res.send(pdf);
    } else {
        res.statusCode = 400;
        res.send(
            "Missing parameters. Make sure to send a valid JSON request."
        );
    }
});

app.post('/d3/png', function(req, res) {
    data = JSON.parse(req.post);

    if (data.scripts && data.main && data.params) {
        // Create Webpage
        page = webpage.create();
        page.setContent(
            '<html><head></head><body><div id="viewport"></div></body></html>',
            'http://www.nohost.org'
        );
        page.injectJs('d3.min.js');

        // Run the script on the viewport, save as window.chart
        var scripts = '';
        for (var i = 0; i < data.scripts.length; i++) {
            scripts += '\n' + data.scripts[i];
        }
        var params = 'var params=JSON.parse(\'' + JSON.stringify(data.params) + '\');';
        var main = 'window.chart = ' + data.main + '(params)(d3.select("#viewport").node());';
        page.evaluateJavaScript('function(){' + scripts + params + main + '}');

        // Set the viewport
        width = page.evaluate(function(){
            if (window.chart && window.chart.width) return window.chart.width();
            return null;
        });
        height = page.evaluate(function(){
            if (window.chart && window.chart.height) return window.chart.height();
            return null;
        });
        page.viewportSize = {
            // The png seems to get cut off with the actual width
            width: data.params.viewport_width + 16 || width + 16 || 1000,
            // The height seems to get expanded automatically
            height: data.params.viewport_height || height || 1
        };

        // Save the PNG
    	page.clipRect = page.evaluate(function() {
    		return document.querySelector('#viewport').getBoundingClientRect();
    	});
        var png = page.renderBase64('png');

        // Return the PNG
        res.header('Content-Type', 'application/base64');
        res.header('Content-Length', png.length.toString());
        res.send(png);
    } else {
        res.statusCode = 400;
        res.send(
            "Missing parameters. Make sure to send a valid JSON request."
        );
    }
});

app.listen(1337);

console.log('Listening on port 1337.');
