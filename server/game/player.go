package game

import (
	"code.google.com/p/go.net/websocket"
	"fmt"
)

type player struct {
	id     uint32
	ws     *websocket.Conn
	send   chan *action
	toGame chan *action
}

func HandleNewPlayer(ws *websocket.Conn) {

	gameID := getGameID(ws)

	if gameID != "" {
		joinGame(ws, gameID)
	}
}

func getGameID(ws *websocket.Conn) string {
	for {
		var cmd command
		err := websocket.JSON.Receive(ws, &cmd)

		if err != nil || cmd.Data["gameID"] == nil {
			fmt.Println("Error handling player connection")
			break
		}

		var gameID string = cmd.Data["gameID"].(string)

		fmt.Println(gameID)
		g := games[gameID]

		if g != nil {
			return gameID
		} else {
			fmt.Println("This game session does not exist, try again")
		}
	}

	return ""
}

// player connected
func joinGame(ws *websocket.Conn, gameID string) {
	fmt.Println("Joining game ", gameID)

	g := games[gameID]
	g.count++
	playerID := g.count
	p := player{
		id:     playerID,
		ws:     ws,
		send:   make(chan *action, 1024),
		toGame: g.toGame,
	}

	g.register <- &p
	defer func() {
		g.removePlayer(&p) // TODO: use channels instead
	}()

	go p.sender()
	p.receiver()

}

// from player to game
func (p *player) receiver() {
	for {
		var cmd command
		err := websocket.JSON.Receive(p.ws, &cmd)
		if err != nil {
			fmt.Printf("Got from player: %+v\n", cmd)
			fmt.Printf("Error", err)
			break
		}
		fmt.Println("Adding command to toGame")
		act := wrapCommand(cmd, "updatePlayer", p.id)
		p.toGame <- &act
	}
}

// from game to player
func (p *player) sender() {
	for a := range p.send {
		fmt.Printf("Sending to player: %+v\n", a)
		err := websocket.JSON.Send(p.ws, a)
		if err != nil {
			fmt.Println("Error sending command to player " + string(p.id))
			break
		}
	}
}

func (p *player) clean() {
	close(p.send)
	go p.ws.Close()
}
