/*global exports, require*/
exports.typeByExtension = {};
exports.typeByContentType = {};

exports.create = function (assetConfig) {
    if (!assetConfig.type) {
        throw new Error("assets.create: No type provided in assetConfig");
    }
    return new exports[assetConfig.type](assetConfig);
};

['JavaScript', 'HTML', 'CSS', 'HTC',
 'PNG', 'GIF', 'JPEG', 'ICO',
 'CacheManifest',
 'SpriteConfiguration'].forEach(function (assetType) {

    var Constructor = require('./' + assetType)[assetType],
        prototype = Constructor.prototype;
    prototype.type = assetType;
    exports[assetType] = Constructor;
    if (prototype.contentType) {
        exports.typeByContentType[prototype.contentType] = assetType;
    }
    if (prototype.defaultExtension) {
        exports.typeByExtension[prototype.defaultExtension] = assetType;
        exports.typeByExtension['.' + prototype.defaultExtension] = assetType; // Support path.extname
    }
    if (prototype.alternativeExtensions) {
        prototype.alternativeExtensions.forEach(function (alternativeExtension) {
            exports.typeByExtension[alternativeExtension] = assetType;
            exports.typeByExtension['.' + alternativeExtension] = assetType;
        });
    }
});