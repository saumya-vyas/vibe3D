const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';


class WebSocketManager {
  constructor() {
    this.ws = null
    this.messageHandlers = new Set()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000 // Start with 1 second
  }

  connect() {
    if (this.ws) {
      return
    }

    this.ws = new WebSocket(WS_URL)

    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
      this.reconnectDelay = 1000
    }

    //id, status ,data, type
    this.ws.onmessage = (response) => {
      try {
        const result = JSON.parse(response.data)
        if(result.type === 'enhance'){
          for (const handler of this.messageHandlers) {
            if(handler.name === 'enhanceMessageHandler'){
              handler(result)
            }
          }
        }else if(result.type === 'render'){
          for (const handler of this.messageHandlers) {
            if(handler.name === 'renderMessageHandler'){
              handler(result)
            }
          }
        }else{
          console.log(response);
          console.log('-*-')
        }
        
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    }

    this.ws.onclose = () => {
      console.log('WebSocket disconnected')
      this.ws = null
      this.attemptReconnect()
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    this.reconnectDelay *= 2 // Exponential backoff

    console.log(`Attempting to reconnect in ${this.reconnectDelay}ms...`)
    setTimeout(() => this.connect(), this.reconnectDelay)
  }

  sendMessage(message) {
    if (this.ws) {
      this.ws.send(JSON.stringify(message))
    }
  }

  addMessageHandler(handler) {
    this.messageHandlers.add(handler)
  }

  removeMessageHandler(handler) {
    this.messageHandlers.delete(handler)
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

const wsManager = new WebSocketManager()
export default wsManager 