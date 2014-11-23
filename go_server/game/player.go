package game

import (
	"code.google.com/p/go.net/websocket"
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
			break
		}

		var gameID string = cmd.Data["gameID"].(string)
		g := games[gameID]
		if g != nil {
			return gameID
		}
	}

	return ""
}

// player connected
func joinGame(ws *websocket.Conn, gameID string) {
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
		g.unregister <- &p
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
			break
		}
		act := wrapCommand(cmd, "updatePlayer", p.id)
		p.toGame <- &act
	}
}

// from game to player
func (p *player) sender() {
	for a := range p.send {
		err := websocket.JSON.Send(p.ws, a)
		if err != nil {
			break
		}
	}
}

func (p *player) clean() {
	close(p.send)
	go p.ws.Close()
}
