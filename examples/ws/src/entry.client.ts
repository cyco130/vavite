let ws: WebSocket;

function connectWebSocket() {
	ws = new WebSocket("/ws");

	ws.onopen = () => {
		console.log("WebSocket connection established!");
		ws.send("Hello, server!");
	};

	ws.onmessage = (event) => {
		console.log("Received message:", event.data);
	};

	ws.onclose = () => {
		console.log("WebSocket connection closed, attempting to reconnect...");
		// Probably add some delay here before reconnecting in a real application
		connectWebSocket();
	};

	ws.onerror = (error) => {
		console.error("WebSocket error:", error);
	};
}

connectWebSocket();
