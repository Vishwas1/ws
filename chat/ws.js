const WebSocket = require('websocket')



module.exports = (server) => {
    const TIME = () => new Date();
    const wss = new WebSocket.server({ 
        httpServer: server, // Tieing websocket to HTTP server
        autoAcceptConnections: false
     })
    
    let clients = []
    let history = []
    let colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
    // ... in random order
    colors.sort((a,b) => { return Math.random() > 0.5; } )
    
    const htmlEntities = (str) => {
        return String(str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      }
    
    wss.on('request', (request) => {
        console.log(`${TIME()} Client connection from ${request.origin} receieved`)
        const connection = request.accept(null, request.origin)
        console.log(`${TIME()} Client accepted`)
    
        let index = clients.push(connection) - 1;
        let userName = false;
        let userColor = false;
    
        if(history.length > 0){
            connection.sendUTF(JSON.stringify({
                type: 'history',
                data: history
            }))
        }
    
        connection.on('message', (m) => {        
            if(m.type != 'utf8'){
                client[index].sendUTF(JSON.stringify({
                    type: 'error',
                    data: "Only text is accepted"
                }))
                return
            }
    
            // First message sent by user, becomes their name
            if(userName){
                console.log((TIME()) + ' Received Message from ' + userName + ': ' + m.utf8Data);
                const obj = {
                    time: TIME().getTime(),
                    text: htmlEntities(m.utf8Data),
                    author: userName,
                    color: userColor
                }
                history.push(obj)
                history = history.slice(-100)
    
                const mToBroad = JSON.stringify({
                    type : 'message',
                    data: obj
                })
    
                clients.forEach(client => {
                    client.sendUTF(mToBroad)
                })
            }else{
                userName = htmlEntities(m.utf8Data)
                userColor = colors.shift()
                connection.sendUTF(JSON.stringify({
                    type : 'color',
                    data: userColor
                }))
                const newJoinee = JSON.stringify({
                    type: 'newJoinee',
                    data: userName
                })
                clients.forEach((client, i) => {
                    if(i != index) {
                        client.sendUTF(newJoinee)    
                    }
                })
                console.log(TIME() + ' User is known as: ' + userName + ' with ' + userColor + ' color.');
            }
        })
    
        connection.on('close', (conn) => {
            console.log(`WS connection closed`)
            if(userName !== false && userColor !== false){
                console.log(`${TIME()} User ${userName} disconnected`)
                clients.splice(index, 1)
                colors.push(userColor)
            }
    
        })
    })
    
}