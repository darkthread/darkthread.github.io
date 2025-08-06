// 共享變數記錄狀態
let connectedPorts = [];
let sharedData = {
    messages: [],
};

onconnect = function(e) {
    const port = e.ports[0];
    connectedPorts.push(port);

    port.postMessage({
        command: 'init',
        messages: sharedData.messages
    });
    
    port.onmessage = function(e) {        
        const data = e.data;
        switch (data.command) {
            case 'speak':
                const newMessage = {
                    text: data.message.text,
                    user: data.message.user,
                    timestamp: new Date().toLocaleTimeString('sv')
                };
                sharedData.messages.push(newMessage);
                broadcastToAllPorts({
                    command: 'message',
                    message: newMessage
                });
                break;
            case 'status':
                port.postMessage({
                    command: 'statusInfo',
                    info: ` ${connectedPorts.length} ports connected`
                });
                break;
            case 'close':
                port.close();
                removePort(port);
                break;
        }
    };
    
    port.onerror = function(error) {
        console.error('Port error:', error);
        removePort(port);
    };
};

// 廣播訊息給所有連接的頁面
function broadcastToAllPorts(message) {
    connectedPorts.forEach(port => {
        try {
            port.postMessage(message);
        } catch (error) {
            console.error('Error sending message to port:', error);
            removePort(port);
        }
    });
}

// 移除已關閉的 port
function removePort(portToRemove) {
    const index = connectedPorts.indexOf(portToRemove);
    if (index > -1) {
        connectedPorts.splice(index, 1);
    }
}