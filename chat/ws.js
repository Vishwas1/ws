const WebSocket = require('websocket')
const { clientStore } = require('./config')

function getFormatedMessage(op, data) {
    return JSON.stringify({
        op,
        data
    })
}

module.exports = (server) => {
    const TIME = () => new Date();
    const wss = new WebSocket.server({
        httpServer: server, // Tieing websocket to HTTP server
        autoAcceptConnections: false
    })

    wss.on('request', (request) => {
        const connection = request.accept(null, request.origin)
        console.log(`${TIME()} Client connected`)
        const clientId = clientStore.addClient(connection);
        connection.sendUTF(getFormatedMessage('init', 'http://localhost:4000/auth?challenge=' + clientId))
        connection.on('message', (m) => {})
        connection.on('close', (conn) => {
            console.log(`${TIME()} disconnected`)
        })
    })

}