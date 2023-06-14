const bodyParser = require('body-parser');
const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(bodyParser.json(limit: '10mb'));

app.post('/d3/svg', function(req, res) {
    const data = req.body;

    if (data.scripts && data.main && data.params) {
        // Render page using headless-chrome
        (async () => {
            var browser
            try {
                browser = await puppeteer.launch({headless: true, executablePath: '/usr/bin/chromium-browser'});
                const page = await browser.newPage();
                await page.setViewport({
                    width: data.params.viewport_width || 1000,
                    height: data.params.viewport_height || 1000,
                    deviceScaleFactor: 1,
                });
                await page.setContent(
                    '<html><head><meta charset="utf-8"></head><body></body></html>',
                    {waitUntil: 'domcontentloaded'}
                );
                await page.addScriptTag({path: 'd3.min.js'});

                var scripts = '';
                for (var i = 0; i < data.scripts.length; i++) {
                    scripts += '\n' + data.scripts[i];
                }
                var params = 'var params=JSON.parse(\'' + JSON.stringify(data.params) + '\');';
                var main = data.main + '(params)(d3.select("body").node());';
                await page.evaluate(scripts + params + main);
                const svg = await page.evaluate(function() {return (new XMLSerializer()).serializeToString(document.querySelector('svg'));});
                res.header('Content-Type', 'image/svg+xml; charset=utf-8');
                res.send(svg);
            } finally {
                if (browser) { await browser.close(); }
            }
        })();
    } else {
        res.statusCode = 400;
        res.send(
            "Missing parameters. Make sure to send a valid JSON request."
        );
    }
});

app.post('/d3/pdf', function(req, res) {
    const data = req.body;

    if (data.scripts && data.main && data.params) {
        // Render page using headless-chrome
        (async () => {
            var browser;
            try {
                browser = await puppeteer.launch({headless: true, executablePath: '/usr/bin/chromium-browser'});
                const page = await browser.newPage();
                await page.setContent(
                    '<html><head></head><body><div id="viewport"></div></body></html>',
                    {waitUntil: 'domcontentloaded'}
                );
                await page.addScriptTag({path: 'd3.min.js'});

                // Run the script on the viewport, save as window.chart
                var scripts = '';
                for (var i = 0; i < data.scripts.length; i++) {
                    scripts += '\n' + data.scripts[i];
                }
                var params = 'var params=JSON.parse(\'' + JSON.stringify(data.params) + '\');';
                var main = 'window.chart = ' + data.main + '(params)(d3.select("#viewport").node());';
                await page.evaluate(scripts + params + main);

                // Set the viewport
                const width = await page.evaluate(function(){
                    if (window.chart && window.chart.width) return window.chart.width();
                    return null;
                });
                const height = await page.evaluate(function(){
                    if (window.chart && window.chart.height) return window.chart.height();
                    return null;
                });
                await page.setViewport({
                    width: data.params.viewport_width || width || 1000,
                    height: data.params.viewport_height || height || 1000,
                    deviceScaleFactor: 1,
                });

                const clipRect = await page.evaluate(function() {
                    return document.getElementById('viewport').getBoundingClientRect();
                });
                const pdf_buffer = await page.pdf({
                    // if we didn't get a bounding rect we need to add some
                    // margins ourselves so the PDF doesn't get split to
                    // two pages
                    height: clipRect.height || (height + 16),
                    width: clipRect.width || (width + 16)
                });
                const pdf = pdf_buffer.toString('base64');

                // Return the PDF
                res.header('Content-Type', 'application/base64');
                res.header('Content-Length', pdf.length.toString());
                res.send(pdf);
            } finally {
                if (browser) { await browser.close(); }
            }
        })();
    } else {
        res.statusCode = 400;
        res.send(
            "Missing parameters. Make sure to send a valid JSON request."
        );
    }
});

app.post('/d3/png', function(req, res) {
    const data = req.body;

    if (data.scripts && data.main && data.params) {
        // Render page using headless-chrome
        (async () => {
            var browser
            try {
                browser = await puppeteer.launch({headless: true, executablePath: '/usr/bin/chromium-browser'});
                const page = await browser.newPage();
                await page.setContent(
                    '<html><head></head><body><div id="viewport"></div></body></html>',
                    {waitUntil: 'domcontentloaded'}
                );
                await page.addScriptTag({path: 'd3.min.js'});

                // Run the script on the viewport, save as window.chart
                var scripts = '';
                for (var i = 0; i < data.scripts.length; i++) {
                    scripts += '\n' + data.scripts[i];
                }
                var params = 'var params=JSON.parse(\'' + JSON.stringify(data.params) + '\');';
                var main = 'window.chart = ' + data.main + '(params)(d3.select("#viewport").node());';
                await page.evaluate(scripts + params + main);

                // Set the viewport
                const width = await page.evaluate(function(){
                    if (window.chart && window.chart.width) return window.chart.width();
                    return null;
                });
                const height = await page.evaluate(function(){
                    if (window.chart && window.chart.height) return window.chart.height();
                    return null;
                });
                await page.setViewport({
                    // The png seems to get cut off with the actual width
                    width: data.params.viewport_width + 16 || width + 16 || 1000,
                    // The height seems to get expanded automatically
                    height: data.params.viewport_height || height || 1
                });

                // Save the PNG
                const clipRect = await page.evaluate(function() {
                    return document.getElementById('viewport').getBoundingClientRect();
                });
                const png_buffer = await page.screenshot({type: 'png', clip: {
                    x: clipRect.x || 0,
                    y: clipRect.y || 0,
                    width: clipRect.width || width,
                    height: clipRect.height || height,
                }});
                const png = png_buffer.toString('base64');
                await browser.close();

                // Return the PNG
                res.header('Content-Type', 'application/base64');
                res.header('Content-Length', png.length.toString());
                res.send(png);
            } finally {
                if (browser) { await browser.close(); }
            }
        })();
    } else {
        res.statusCode = 400;
        res.send(
            "Missing parameters. Make sure to send a valid JSON request."
        );
    }
});

app.listen(1337);

console.log('Listening on port 1337.');

