'use strict';

module.exports = function() {
  return function sse(req, res, next){
    if (req.headers['Accept'] !== 'text/event-stream') { return next(); }

    res.writeHead(200, {
      'Connection': 'keep-alive',
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache'
    });

    /*
     *  If the client is reconnecting, they will send this header. Now we know
     *  not to spam them with messages which they have already recieved.
     */
    var firstId = req.headers['last-event-id'] ? (parseInt(req.headers['last-event-id'], 10) + 1) : 0;
    var nextId  = 0;

    /*
     * Accept a string and send each line as a new SSE message. We keep track of
     * ID to allow reconnections
     */
    res.sse = function(string){
      string.toString().split('\n').forEach(function(string) {
        if (firstId > nextId) { return nextId++; }
        res.write('id: ' + nextId + '\n');
        res.write('data: ' + string + '\n\n');
        nextId++;
      });
    };

    next();
  };
};
