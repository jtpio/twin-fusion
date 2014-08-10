package main

import (
	"./game"
	"code.google.com/p/go.net/websocket"
	"flag"
	"log"
	"net/http"
)

var addr = flag.String("addr", ":8080", "http service address")

func handleConnection(ws *websocket.Conn) {
	var clientType string
	err := websocket.Message.Receive(ws, &clientType)

	if err != nil {
		log.Fatal("Bad init message from client, disconnecting")
		return
	}

	if clientType == "server" {
		game.CreateNewGame(ws)
	} else if clientType == "player" {
		game.HandleNewPlayer(ws)
	}
}

func main() {
	flag.Parse()
	http.Handle("/", http.FileServer(http.Dir("public/")))
	http.Handle("/ws", websocket.Handler(handleConnection))

	log.Println("Server listening on port", *addr)
	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("unable to start server")
	}
}
