# SSEasy

[![Build Status](https://travis-ci.org/heroku/sseasy.svg?branch=master)](https://travis-ci.org/heroku/sseasy)

[![NPM](https://nodei.co/npm/sseasy.png)](https://nodei.co/npm/sseasy/)

Server sent events middleware for [Connect](https://github.com/senchalabs/connect) & [Express](http://expressjs.com/).

All messages in a single connection are sent with incrementing IDs. If the client passes an ID in a `last-event-id` header, the middleware ignores messages until that ID is reached.

## Use

On the server as a writeable stream:

```js
var sse = require('sseasy');
var fs  = require('fs');

app.get('/stream', sse(), function(req, res) {
  fs.createReadStream('/some/file.txt').pipe(res.sse);
});
```

On the server with manual events:
```js
var sse = require('sseasy');

app.get('/stream', sse(), function(req, res) {
  res.sse.write('a message');
  setTimeout(function() {
    res.sse.write('a second message');
  }, 2000);
});
```

On the client (initial connection):
```js
var source = new EventSource('/stream');
source.addEventListener('message', function(ev) {
  console.log('id: ', ev.lastEventId);
  console.log('message: ', ev.data);
});

// id: 0
// message: a message

// id: 1
// message: a second message
```

On the client (reconnect `sending last-event-id: 0` header ):
```js
var source = new EventSource('/stream');
source.addEventListener('message', function(ev) {
  console.log('id: ', ev.lastEventId);
  console.log('message: ', ev.data);
});

// (message 0 was skipped)
// id: 1
// message: a second message
```
