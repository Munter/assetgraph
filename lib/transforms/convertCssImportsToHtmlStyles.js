var _ = require('underscore'),
    relations = require('../relations');

module.exports = function (queryObj) {
    return function convertCssImportsToHtmlStyles(assetGraph) {
        assetGraph.findAssets(_.extend({type: 'Html'}, queryObj)).forEach(function (htmlAsset) {
            assetGraph.findRelations({type: 'HtmlStyle', from: htmlAsset}).forEach(function (htmlStyle) {
                assetGraph.eachAssetPostOrder(htmlStyle, {type: 'CssImport'}, function (cssAsset, incomingRelation) {
                    if (incomingRelation.type === 'CssImport') {
                        var newHtmlStyle = new relations.HtmlStyle({
                            from: htmlAsset,
                            to: cssAsset
                        });
                        assetGraph.attachAndAddRelation(newHtmlStyle, 'before', htmlStyle);
                        if (incomingRelation.cssRule.media.length) {
                            newHtmlStyle.node.setAttribute('media', incomingRelation.cssRule.media.mediaText);
                        }
                        assetGraph.detachAndRemoveRelation(incomingRelation);
                    }
                });
            });
        });
    };
};