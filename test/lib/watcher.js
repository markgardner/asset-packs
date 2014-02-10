var path = require('path'),
    rewire = require('rewire'),
    sinon = require('sinon'),
    expect = require('chai').expect;

describe('watcher', function() {
    var watcher, _watches,
        pathMock, fsMock,
        watchHandleStub;

    function configurePathMock() {
        pathMock = {
            dirname: sinon.stub(),
            join: path.join
        };
        pathMock.dirname.withArgs('/root/is-file.txt').returns('/root');
        pathMock.dirname.throws(); // Throw exception for all else

        return pathMock;
    }

    function configureFsMock() {
        fsMock = {
            statSync: sinon.stub(),
            watch: sinon.stub(),
            existsSync: sinon.stub()
        };
        fsMock.statSync.withArgs('/root/is-file.txt').returns({
            isFile: sinon.stub().returns(true),
            isDirectory: sinon.stub().returns(false)
        });
        fsMock.statSync.withArgs('/root/is-directory').returns({
            isFile: sinon.stub().returns(false),
            isDirectory: sinon.stub().returns(true)
        });
        fsMock.statSync.throws(); // Throw exception for all else

        fsMock.existsSync.withArgs('/root/is-directory').returns(true);
        fsMock.existsSync.returns(false);

        fsMock.watch.returns({
            type: 'watcher',
            close: sinon.spy()
        });

        return fsMock;
    }

    beforeEach(function() {
        watcher = rewire('../../lib/watcher');
        watcher.__set__('path', configurePathMock());
        watcher.__set__('fs', configureFsMock());

        _watches = watcher.__get__('watches');
        watchHandleStub = sinon.stub();
    });

    it('should convert files to directories', function() {
        var addWatchSpy = sinon.spy();
        watcher.__set__('addWatch', addWatchSpy);

        watcher([
            '/root/is-file.txt',
            '/root/is-directory'
        ], watchHandleStub);

        expect(fsMock.statSync.callCount).to.equal(2);
        expect(addWatchSpy.callCount).to.equal(2);

        expect(addWatchSpy.calledWithExactly('/root', watchHandleStub)).to.be.true;
        expect(addWatchSpy.calledWithExactly('/root/is-directory', watchHandleStub)).to.be.true;
    });

    it('should check cache for duplicate watches', function() {
        var addWatchSpy = sinon.spy();
        watcher.__set__('addWatch', addWatchSpy);

        // Manually add item to cache
        _watches['/root/is-directory'] = {};

        watcher([
            '/root/is-directory',
            '/root/is-directory'
        ], watchHandleStub);

        expect(fsMock.statSync.callCount).to.equal(2);
        expect(addWatchSpy.callCount).to.equal(0);
    });

    it('should correctly add watches', function() {
        watcher([
            '/root/is-file.txt',
            '/root/is-directory'
        ], watchHandleStub);

        expect(fsMock.watch.calledWith('/root', { persistent: false })).to.be.true;
        expect(fsMock.watch.calledWith('/root/is-directory', { persistent: false })).to.be.true;

        expect(_watches['/root'].type).to.equal('watcher');
        expect(_watches['/root/is-directory'].type).to.equal('watcher');
    });

    it('should ignore events without a filename', function() {
        watcher([
            '/root/is-file.txt',
            '/root/is-directory'
        ], watchHandleStub);

        fsMock.watch.args[0][2]('change');

        expect(watchHandleStub.callCount).to.equal(0);
    });

    it('should ignore events from *.tmp files', function() {
        watcher([
            '/root/is-file.txt',
            '/root/is-directory'
        ], watchHandleStub);

        fsMock.watch.args[0][2]('change', 'file.tmp');

        expect(watchHandleStub.callCount).to.equal(0);
    });

    it('should handle changes', function() {
        watcher([
            '/root/is-file.txt',
            '/root/is-directory'
        ], watchHandleStub);

        fsMock.watch.args[0][2]('change', 'test.txt');

        expect(watchHandleStub.calledOnce).to.be.true;
        expect(watchHandleStub.calledWithExactly('change', '/root/test.txt')).to.be.true;
    });

    it('should handle creates', function() {
        var addWatchSpy = sinon.spy();

        watcher([
            '/root/is-file.txt',
            '/root/is-directory'
        ], watchHandleStub);
        watcher.__set__('addWatch', addWatchSpy);

        fsMock.watch.args[0][2]('rename', 'is-directory');

        expect(watchHandleStub.calledOnce).to.be.true;
        expect(watchHandleStub.calledWithExactly('create', '/root/is-directory')).to.be.true;
        expect(addWatchSpy.calledOnce).to.be.true;
        expect(addWatchSpy.calledWithExactly('/root/is-directory', sinon.match.func)).to.be.true;
    });

    it('should handle deletes', function() {
        var watchObj;

        watcher([
            '/root/is-file.txt',
            '/root/is-directory'
        ], watchHandleStub);

        fsMock.existsSync = sinon.stub().returns(false);
        watchObj = _watches['/root/is-directory'];

        fsMock.watch.args[0][2]('rename', 'is-directory');

        expect(_watches['/root/is-directory']).to.be.an('undefined');
        expect(watchObj.close.calledOnce).to.be.true;
        expect(watchHandleStub.calledOnce).to.be.true;
        expect(watchHandleStub.calledWithExactly('delete', '/root/is-directory')).to.be.true;
    });

    it('should close all and remove from cache', function() {
        var watchObj;

        watcher([
            '/root/is-file.txt',
            '/root/is-directory'
        ], watchHandleStub);

        watchObj = _watches['/root/is-directory'];

        watcher.closeAll();

        expect(Object.keys(_watches).length).to.equal(0);
        expect(watchObj.close.calledTwice).to.be.true;
    });
});