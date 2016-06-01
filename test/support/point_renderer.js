var Canvas = require('canvas');
var request = require('request');
var _ = require('underscore');
var fs = require('fs');

var torque = require('../../lib/torque/index');


function getTile(jsonRelPath, cartocss, z, x, y, step, options, callback) {
    if (!callback) {
        callback = options;
        options = {};
    }
    var cartoCssOptions = torque.common.TorqueLayer.optionsFromCartoCSS(cartocss);

    var provider = new torque.providers.windshaft(_.extend({ no_fetch_map: true }, cartoCssOptions));
    var rendererOptions = _.extend(options, {cartocss: cartocss}, cartoCssOptions, {
        canvasClass: Canvas,
        imageClass: Canvas.Image,
        setImageSrc: function(img, url, callback) {
            var requestOpts = {
                url: url,
                method: 'GET',
                encoding: null
            };
            request(requestOpts, function (err, response, body) {
                if (!err && response.statusCode === 200) {
                    img.onload = function() {
                        callback(null);
                    };
                    img.onerror = function() {
                        callback(new Error('Could not load marker-file image: ' + url));
                    };
                    img.src = body;
                } else {
                    callback(new Error('Could not load marker-file image: ' + url));
                }
            });
        },
        qualifyURL: function(url) {
            return url;
        }
    });

    var rows = JSON.parse(fs.readFileSync(__dirname + '/../fixtures/json/' + jsonRelPath));

    var tileSize = options.tileSize || 256;
    var canvas = new Canvas(tileSize, tileSize);
    var pointRenderer = new torque.renderer.Point(canvas, rendererOptions);

    pointRenderer.renderTile(provider.proccessTile(rows, {x: x, y: y}, z), step, function(err) {
        if (err) {
            return callback(err, null);
        }
        pointRenderer.applyFilters();
        return callback(null, canvas);
    });
}

module.exports = {
    getTile: getTile
};
