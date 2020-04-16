# ws
Demo applications built using WebSocket on node js 

### Introduction


> "The WebSocket protocol enables two-way communication between a client running untrusted code in a controlled environment to a remote host that has opted-in to communications from that code."

### Goal

> "The goal of this technology is to provide a mechanism for browser-based applications that need two-way communication with servers that does not rely on opening multiple HTTP connections."


### The problem with TCP

Historically, creating web applications that need bidirectional communication between a client and a server (e.g., instant messaging and gaming applications) has required an abuse of HTTP to **poll** the server for updates

- The server is forcer to use a _number of different_ underlying TCP connections for each client. 
- High overhead with each client to server message having an HTTP header.
- The client side script is forced to maintain a mapping from the outgoing connections to the incoming connections to track replies. 

### Solution

Use TCP connection for traffic in both directions. This is what webSocket provides. It is combined with WebSocket API ([WSAPI](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)), it provides an altenative to **HTTP Polling** for two-way communication from a webpage to a remote server.

### Examples

- games 
- stock tickers
- multiuser applications with simultaneous editing
- user interfaces exposing server-side services in real time
- etc.

### Notes:

- Client server paradigm just like TCP
- It combines the parts of UDP and TCP: it's message based like UDP, but it's reliable like TCP. 
- Bidirectional communication between client and server

