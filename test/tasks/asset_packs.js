var rewire = require('rewire'),
    sinon = require('sinon'),
    expect = require('chai').expect;

describe('grunt task', function() {
    var gruntMock, task, fsMock, assetMock;

    beforeEach(function() {
        var plugin = rewire('../../tasks/asset_packs');
        plugin.__set__('fs', fsMock = {
            existsSync: sinon.stub(),
            mkdirSync: sinon.stub(),
            writeFile: sinon.spy(function(path, content, cb) {
                cb && cb();
            })
        });
        plugin.__set__('AssetPacker', assetMock = function(opts) {
            assetMock.calls = assetMock.calls || [];
            assetMock.calls.push(opts);

            this.compiler = {
                name: opts.pack,
                base: opts.base,
                autowatch: opts.autowatch
            };
        });

        gruntMock = {
            registerMultiTask: sinon.spy(function(name, desc, cb) {
                this.mockName = name;
                this.mockDesc = desc;
                this.mockCb = cb;
            }),
            data: {
                dest: '/dest'
            },
            filesSrc: []
        };
        task = plugin(gruntMock);
    });

    it('should register multi-task', function() {
        expect(gruntMock.registerMultiTask.calledOnce).to.true;
        expect(gruntMock.mockName).to.equal('packs');
        expect(gruntMock.mockDesc).to.equal('Grunt Plugin for writing packs to disk');
        expect(gruntMock.mockCb).to.be.a('function');
    });

    describe('should create output directory', function() {
        it('if it exists', function(done) {
            gruntMock.async = function() {
                return done;
            };

            fsMock.existsSync.returns(true);
            gruntMock.mockCb();

            expect(fsMock.mkdirSync.callCount).to.equal(0);
        });

        it('if it does not exists', function(done) {
            gruntMock.async = function() {
                return done;
            };

            fsMock.existsSync.returns(false);
            gruntMock.mockCb();

            expect(fsMock.mkdirSync.calledOnce).to.true;
            expect(fsMock.mkdirSync.args[0][0]).to.equal('/dest');
            expect(fsMock.mkdirSync.args[0][1]).to.equal(511);
            expect(fsMock.mkdirSync.args[0][2]).to.equal(true);
        });
    });

    it('should create packs for matches', function(done) {
        gruntMock.async = function() {
            return done;
        };

        gruntMock.filesSrc = [
            'test/pack.json',
            'test2/pack.json'
        ];

        assetMock.prototype.getAllContent = function(done) {
            done({});
        };

        gruntMock.mockCb();

        expect(assetMock.calls.length).to.equal(2);
        expect(assetMock.calls[0].pack).to.equal('test/pack.json');
        expect(assetMock.calls[1].pack).to.equal('test2/pack.json');
        expect(assetMock.calls[0].base).to.equal('test');
        expect(assetMock.calls[1].base).to.equal('test2');
    });

    it('should should handle js files correctly and generate a manifest file', function(done) {
        gruntMock.async = function() {
            return function() {
                expect(fsMock.writeFile.callCount).to.equal(4);
                expect(fsMock.writeFile.args[0][0]).to.equal('/dest/test/pack.json-f1557bba077beb7498233a900bbc0205735f0a18.js');
                expect(fsMock.writeFile.args[0][1]).to.equal('(function(obj) { obj.alert("123"); })(window)');
                expect(fsMock.writeFile.args[1][0]).to.equal('/dest/test/pack.json-f1557bba077beb7498233a900bbc0205735f0a18.min.js');
                expect(fsMock.writeFile.args[1][1]).to.equal('!function(obj){obj.alert("123")}(window);\n//@ sourceMappingURL=test/pack.json-f1557bba077beb7498233a900bbc0205735f0a18.js.map');
                expect(fsMock.writeFile.args[2][0]).to.equal('/dest/test/pack.json-f1557bba077beb7498233a900bbc0205735f0a18.js.map');
                expect(fsMock.writeFile.args[2][1]).to.equal('{"version":3,"file":"test/pack.json-f1557bba077beb7498233a900bbc0205735f0a18.js.map","sources":["test/pack.json-f1557bba077beb7498233a900bbc0205735f0a18.js"],"names":["obj","alert","window"],"mappings":"CAAA,SAAUA,KAAOA,IAAIC,MAAM,QAAWC"}');
                
                expect(fsMock.writeFile.args[3][0]).to.equal('/dest/manifest.json');
                expect(fsMock.writeFile.args[3][1]).to.equal('{"test":{"js":"test/pack.json-f1557bba077beb7498233a900bbc0205735f0a18.min.js"}}');
                done();
            };
        };

        gruntMock.filesSrc = [
            'test/pack.json'
        ];

        assetMock.prototype.getAllContent = function(done) {
            if(this.compiler.name === 'test/pack.json') {
                done({
                    js: {
                        content: '(function(obj) { obj.alert("123"); })(window)'
                    }
                });
            } else {
                done();
            }
        };

        gruntMock.mockCb();
    });
});