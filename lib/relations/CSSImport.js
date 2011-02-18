/*global require, exports*/
var util = require('util'),
    _ = require('underscore'),
    error = require('../error'),
    Base = require('./Base').Base;

function CSSImport(config) {
    Base.call(this, config);
}

util.inherits(CSSImport, Base);

_.extend(CSSImport.prototype, {
    remove: function () {
        this.parentRule.deleteRule(this.parentRule.cssRules.indexOf(this.cssRule));
        delete this.cssRule;
    },

    _setRawUrlString: function (url) {
        this.cssRule.href = url;
    }
});

exports.CSSImport = CSSImport;