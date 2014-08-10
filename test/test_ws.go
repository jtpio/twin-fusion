package main

import (
	"code.google.com/p/go.net/websocket"
	"fmt"
	"net/http"
)

type T struct {
	Msg   string
	Count int
}

type command struct {
	Cmd string `json:"cmd"`
	// Data map[string]interface{} `json:"data"`
}

// Echo the data received on the WebSocket.
func EchoServer(ws *websocket.Conn) {

	/*a := &command{
		cmd:      "connect",
		playerID: 3,
	}*/

	data := &T{
		Msg:   "test",
		Count: 1,
	}
	websocket.JSON.Send(ws, data)

	var cmd T
	err := websocket.JSON.Receive(ws, &cmd)
	if err != nil {
		fmt.Printf("Got from player: %+v\n", cmd)
		fmt.Printf("Error", err)
	}
}

// This example demonstrates a trivial echo server.
func main() {
	http.Handle("/", http.FileServer(http.Dir(".")))
	http.Handle("/echo", websocket.Handler(EchoServer))
	err := http.ListenAndServe(":12345", nil)
	if err != nil {
		panic("ListenAndServe: " + err.Error())
	}
}
