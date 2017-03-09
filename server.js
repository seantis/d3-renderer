var fs = require('fs');
var Routes = require('./Routes.js');
var webpage = require('webpage');

function renderElementToPdf(page, selector) {
    if (!fs.exists('tmp')) {
        fs.makeDirectory('tmp');
    }
    var filename = 'tmp/' + (new Date().getTime().toString()) + '.pdf';

	var prevClipRect = page.clipRect;
	page.clipRect = page.evaluate(function(selector) {
		return document.querySelector(selector).getBoundingClientRect();
	}, selector);
    page.render(filename, { format: 'pdf' });
	page.clipRect = prevClipRect;

    var pdf = fs.read(filename);
    fs.remove(filename);

	return pdf;
}

function renderElementToPng(page, selector) {
	var prevClipRect = page.clipRect;
	page.clipRect = page.evaluate(function(selector) {
		return document.querySelector(selector).getBoundingClientRect();
	}, selector);
    png = page.renderBase64('png');
	page.clipRect = prevClipRect;

	return png;
}


var app = new Routes();

app.post('/d3/svg', function(req, res) {
    data = JSON.parse(req.post);

    if (data.scripts && data.main && data.params) {
        page = webpage.create();
        page.viewportSize = {width: 1000, height: 1000};
        page.setContent('<html<body></body></html>', 'http://www.nohost.org');
        page.injectJs('d3.min.js');

        var scripts = '';
        for (var i = 0; i < data.scripts.length; i++) {
            scripts += '\n' + data.scripts[i];
        }
        var params = 'var params=JSON.parse(\'' + JSON.stringify(data.params) + '\');';
        var main = data.main + '(params)(d3.select("body").node());';
        page.evaluateJavaScript('function(){' + scripts + params + main + '}');

        var svg = page.evaluate(function() {return (new XMLSerializer()).serializeToString(document.querySelector('svg'));});
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
        page = webpage.create();
        page.viewportSize = {width: 1000, height: 1000};
        page.setContent(
            '<html><head></head><body><div id="viewport"></div></body></html>',
            'http://www.nohost.org'
        );
        page.injectJs('d3.min.js');

        var scripts = '';
        for (var i = 0; i < data.scripts.length; i++) {
            scripts += '\n' + data.scripts[i];
        }
        var params = 'var params=JSON.parse(\'' + JSON.stringify(data.params) + '\');';
        var main = data.main + '(params)(d3.select("#viewport").node());';
        page.evaluateJavaScript('function(){' + scripts + params + main + '}');

        var pdf = renderElementToPdf(page, '#viewport');
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
        page = webpage.create();
        page.viewportSize = {width: 1000, height: 1000};
        page.setContent(
            '<html><head></head><body><div id="viewport"></div></body></html>',
            'http://www.nohost.org'
        );
        page.injectJs('d3.min.js');

        var scripts = '';
        for (var i = 0; i < data.scripts.length; i++) {
            scripts += '\n' + data.scripts[i];
        }
        var params = 'var params=JSON.parse(\'' + JSON.stringify(data.params) + '\');';
        var main = data.main + '(params)(d3.select("#viewport").node());';
        page.evaluateJavaScript('function(){' + scripts + params + main + '}');

        var png = renderElementToPng(page, '#viewport');
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
