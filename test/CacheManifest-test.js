var vows = require('vows'),
    assert = require('assert'),
    urlTools = require('../lib/util/urlTools'),
    AssetGraph = require('../lib/AssetGraph'),
    transforms = AssetGraph.transforms;

vows.describe('Cache manifest').addBatch({
    'After loading a single-page test case with an existing cache manifest': {
        topic: function () {
            new AssetGraph({root: __dirname + '/CacheManifest/existingCacheManifest/'}).queue(
                transforms.loadAssets('index.html'),
                transforms.populate()
            ).run(this.callback);
        },
        'the graph should contain 4 relations': function (assetGraph) {
            assert.equal(assetGraph.findRelations().length, 4);
        },
        'the graph should contain 4 assets': function (assetGraph) {
            assert.equal(assetGraph.findAssets().length, 4);
        },
        'the graph contains a single cache manifest': function (assetGraph) {
            assert.equal(assetGraph.findAssets({type: 'CacheManifest'}).length, 1);
        },
        'the cache manifest has an outgoing relation to an image in the FALLBACK section': function (assetGraph) {
            var outgoingRelations = assetGraph.findRelations({from: assetGraph.findAssets({type: 'CacheManifest'})[0]});
            assert.equal(outgoingRelations.length, 1);
            assert.equal(outgoingRelations[0].to.type, 'Png');
            assert.equal(outgoingRelations[0].sectionName, 'FALLBACK');
        },
        'then running the addCacheManifestSinglePage transform': {
            topic: function (assetGraph) {
                assetGraph.queue(transforms.addCacheManifestSinglePage({isInitial: true})).run(this.callback);
            },
            'there should still be a single cache manifest asset': function (assetGraph) {
                assert.equal(assetGraph.findAssets({type: 'CacheManifest'}).length, 1);
            },
            'the manifest should have a relation to bar.png': function (assetGraph) {
                var barPng = assetGraph.urlIndex[urlTools.resolveUrl(assetGraph.root, 'bar.png')],
                    manifest = assetGraph.findAssets({type: 'CacheManifest'})[0];
                assert.equal(assetGraph.findRelations({from: manifest, to: barPng}).length, 1); // FIXME: query
            },
            'then get the manifest as text': {
                topic: function (assetGraph) {
                    return assetGraph.getAssetText(assetGraph.findAssets({type: 'CacheManifest'})[0]);
                },
                'it should only point to foo.png once': function (src) {
                    var fooPngMatches = src.match(/\bfoo.png/gm);
                    assert.isArray(fooPngMatches);
                    assert.equal(fooPngMatches.length, 1);
                },
                'it should still contain the original NETWORK and FALLBACK sections': function (src) {
                    assert.isTrue(src.indexOf("NETWORK:\n/helloworld.php\n") !== -1);
                    assert.isTrue(src.indexOf("FALLBACK:\nheresthething.asp foo.png\n") !== -1);
                },
                'then move the foo.png asset to a different url and get the manifest as text again': {
                    topic: function (previousSrc, assetGraph) {
                        assetGraph.setAssetUrl(assetGraph.findAssets({url: /foo.png$/})[0], urlTools.resolveUrl(assetGraph.root, 'somewhere/else/quux.png'));
                        return assetGraph.getAssetText(assetGraph.findAssets({type: 'CacheManifest'})[0]);
                    },
                    'there should be no mention of foo.png': function (src) {
                        assert.isNull(src.match(/\bfoo.png/gm));
                    },
                    'the entry in the FALLBACK section should point at the new url': function (src) {
                        assert.isTrue(src.indexOf("FALLBACK:\nheresthething.asp somewhere/else/quux.png\n") !== -1);
                    }
                }
            }
        }
    },
    'After loading a test case with no manifest': {
        topic: function () {
            new AssetGraph({root: __dirname + '/CacheManifest/noCacheManifest/'}).queue(
                transforms.loadAssets('index.html'),
                transforms.populate()
            ).run(this.callback);
        },
        'the graph contains 3 assets': function (assetGraph) {
            assert.equal(assetGraph.findAssets().length, 3);
        },
        'the graph contains 3 relations': function (assetGraph) {
            assert.equal(assetGraph.findRelations().length, 3);
        },
        'the graph contains a single Png asset': function (assetGraph) {
            assert.equal(assetGraph.findAssets({type: 'Png'}).length, 1);
        },
        'the graph contains a single Html asset': function (assetGraph) {
            assert.equal(assetGraph.findAssets({type: 'Html'}).length, 1);
        },
        'the graph contains a single Css asset': function (assetGraph) {
            assert.equal(assetGraph.findAssets({type: 'Css'}).length, 1);
        },
        'then adding a cache manifest to the Html file using the "single page" method': {
            topic: function (assetGraph) {
                assetGraph.queue(transforms.addCacheManifestSinglePage({isInitial: true})).run(this.callback);
            },
            'the graph should contain a cache manifest': function (assetGraph) {
                assert.equal(assetGraph.findAssets({type: 'CacheManifest'}).length, 1);
            },
            'the cache manifest should have 2 outgoing relations': function (assetGraph) {
                assert.equal(assetGraph.findRelations({from: assetGraph.findAssets({type: 'CacheManifest'})[0]}).length, 2); // FIXME: query
            }
        }
    },
    'After loading a multi-page test case with no manifest': {
        topic: function () {
            new AssetGraph({root: __dirname + '/CacheManifest/noCacheManifestMultiPage/'}).queue(
                transforms.loadAssets('*.html'),
                transforms.populate()
            ).run(this.callback);
        },
        'the graph contains 3 assets': function (assetGraph) {
            assert.equal(assetGraph.findAssets().length, 3);
        },
        'the graph contains 4 relations': function (assetGraph) {
            assert.equal(assetGraph.findRelations().length, 4);
        },
        'the graph contains 1 Png': function (assetGraph) {
            assert.equal(assetGraph.findAssets({type: 'Png'}).length, 1);
        },
        'the graph contains 2 Html assets': function (assetGraph) {
            assert.equal(assetGraph.findAssets({type: 'Html'}).length, 2);
        },
        'the graph contains an IFrame relation': function (assetGraph) {
            assert.equal(assetGraph.findRelations({type: 'HtmlIFrame'}).length, 1);
        },
        'the graph contains 2 Html image relations': function (assetGraph) {
            assert.equal(assetGraph.findRelations({type: 'HtmlImage'}).length, 2);
        },
        'then adding a cache manifest to the Html file using the "site map" method': {
            topic: function (assetGraph) {
                assetGraph.queue(transforms.addCacheManifestSiteMap({isInitial: true})).run(this.callback);
            },
            'the graph should contain the manifest': function (assetGraph) {
                assert.equal(assetGraph.findAssets({type: 'CacheManifest'}).length, 1);
            },
            'the manifest should have 3 outgoing relations': function (assetGraph) {
                assert.equal(assetGraph.findRelations({from: assetGraph.findAssets({type: 'CacheManifest'})[0]}).length, 3);
            },
            'the manifest should have 2 incoming relations': function (assetGraph) {
                assert.equal(assetGraph.findRelations({to: assetGraph.findAssets({type: 'CacheManifest'})[0]}).length, 2);
            }
        }
    },
    'After loading a multi-page test case with one existing manifest': {
        topic: function () {
            new AssetGraph({root: __dirname + '/CacheManifest/existingCacheManifestMultiPage/'}).queue(
                transforms.loadAssets('*.html'),
                transforms.populate()
            ).run(this.callback);
        },
        'the graph should contain two Html assets': function (assetGraph) {
            assert.equal(assetGraph.findAssets({type: 'Html'}).length, 2);
        },
        'the graph should contain a single cache manifest': function (assetGraph) {
            assert.equal(assetGraph.findAssets({type: 'CacheManifest'}).length, 1);
        },
        'the graph should contain a single Css asset': function (assetGraph) {
            assert.equal(assetGraph.findAssets({type: 'Css'}).length, 1);
        },
        'the graph should contain two Png assets': function (assetGraph) {
            assert.equal(assetGraph.findAssets({type: 'Png'}).length, 2);
        },
        'then running the addCacheManifestSiteMap transform': {
            topic: function (assetGraph) {
                assetGraph.queue(transforms.addCacheManifestSiteMap({isInitial: true})).run(this.callback);
            },
            'the graph should contain two cache manifests': function (assetGraph) {
                assert.equal(assetGraph.findAssets({type: 'CacheManifest'}).length, 2);
            },
            'the cache manifests should both refer to all assets': function (assetGraph) {
                var manifests = assetGraph.findAssets({type: 'CacheManifest'});
                assert.equal(assetGraph.findRelations({from: manifests[0]}).length, 6);
                assert.equal(assetGraph.findRelations({from: manifests[1]}).length, 6);
            }
        }
    }
})['export'](module);