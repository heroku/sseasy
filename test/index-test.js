'use strict';

var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
chai.use(sinonChai);

var sseasy = require('../index');

describe('sseasy', function() {
  var req, res, next;
  var callMiddleware;

  beforeEach(function() {
    next = sinon.spy();
    req = { headers: {} };
    res = {
      writeHead: sinon.spy(),
      write: sinon.spy()
    };

    callMiddleware = function() {
      sseasy()(req, res, next);
    };
  });

  context('given a non event stream header', function() {
    beforeEach(function() {
      req.headers['Accept'] = 'application/json';
    });

    it('calls next', function() {
      callMiddleware();
      expect(next).to.have.been.calledOnce;
    });

    it('does not set SSE response headers', function() {
      callMiddleware();
      expect(res.writeHead).not.to.have.been.called;
    });
  });

  context('given an event stream header', function() {
    beforeEach(function() {
      req.headers['Accept'] = 'text/event-stream';
    });

    it('sends a 200 and event stream response headers', function() {
      callMiddleware();
      expect(res.writeHead).to.have.been.calledWith(200, {
        'Connection': 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache'
      });
    });

    it('adds an sse method to the response object', function() {
      callMiddleware();
      expect(res.sse).to.be.a('function');
    });

    describe('res.sse', function() {
      it('sends an id to the client first', function() {
        callMiddleware();
        res.sse('a message');
        expect(res.write.firstCall).to.have.been.calledWith('id: 0\n');
      });

      it('sends the string to the client second', function() {
        callMiddleware();
        res.sse('a message');
        expect(res.write.secondCall).to.have.been.calledWith('data: a message\n\n');
      });

      context('when called multiple times', function() {
        it('sends incrementing IDs to the client', function() {
          callMiddleware();
          res.sse('message 1');
          res.sse('message 2');

          expect(res.write).to.have.callCount(4);
          expect(res.write.getCall(0)).to.have.been.calledWith('id: 0\n');
          expect(res.write.getCall(1)).to.have.been.calledWith('data: message 1\n\n');
          expect(res.write.getCall(2)).to.have.been.calledWith('id: 1\n');
          expect(res.write.getCall(3)).to.have.been.calledWith('data: message 2\n\n');
        });
      });

      context('when given a multiline string', function() {
        it('sends each line as a new message', function() {
          callMiddleware();
          res.sse('message 1\nmessage 2');

          expect(res.write).to.have.callCount(4);
          expect(res.write.getCall(0)).to.have.been.calledWith('id: 0\n');
          expect(res.write.getCall(1)).to.have.been.calledWith('data: message 1\n\n');
          expect(res.write.getCall(2)).to.have.been.calledWith('id: 1\n');
          expect(res.write.getCall(3)).to.have.been.calledWith('data: message 2\n\n');
        });
      });

      context('when the client sends a last-event-id header', function() {
        beforeEach(function() {
          req.headers['last-event-id'] = 1;
          callMiddleware();
        });

        it('only sends messages after that id', function() {
          res.sse('message 1');
          res.sse('message 2');
          res.sse('message 3');

          expect(res.write).to.have.callCount(2);
          expect(res.write.getCall(0)).to.have.been.calledWith('id: 2\n');
          expect(res.write.getCall(1)).to.have.been.calledWith('data: message 3\n\n');
        });
      });
    });
  });
});
