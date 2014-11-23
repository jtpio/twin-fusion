package game

import (
	"../utils"
	"code.google.com/p/go.net/websocket"
)

const (
	GAME_ID_LENGTH = 3
)

type game struct {
	gameID     string
	count      uint32
	ws         *websocket.Conn
	register   chan *player
	unregister chan *player
	players    map[uint32]*player
	toGame     chan *action
}

// input
type command struct {
	Cmd      string                 `json:"cmd"`
	PlayerID uint32                 `json:"playerID"`
	Data     map[string]interface{} `json:"data"`
}

type action struct {
	Action string  `json:"action"`
	Data   command `json:"data"`
}

func wrapCommand(cmd command, a string, playerID uint32) action {
	var act action
	act.Action = a
	cmd.PlayerID = playerID
	act.Data = cmd
	return act
}

var games map[string]*game = make(map[string]*game)

// Generate a new <GAME_ID_LENGTH> characters game ID until one is available
func generateGameID(res chan string) {
	for {
		id := utils.RandomString(GAME_ID_LENGTH)
		if games[id] == nil {
			res <- id
			break
		}
	}
	close(res)
}

// Create a new game session using the provided websocket connection
func CreateNewGame(ws *websocket.Conn) {
	gameIDChan := make(chan string)
	go generateGameID(gameIDChan)
	gameID := <-gameIDChan

	g := game{
		gameID:     gameID,
		count:      0,
		ws:         ws,
		register:   make(chan *player),
		unregister: make(chan *player),
		players:    make(map[uint32]*player),
		toGame:     make(chan *action),
	}

	games[gameID] = &g

	defer func() {
		g.clean()
	}()

	go g.registration()
	go g.sender()

	// send back game ID

	a := wrapCommand(command{
		Data: map[string]interface{}{
			"gameID": gameID,
		},
	}, "gameID", 0)

	g.toGame <- &a
	g.receiver()

}

// from web game to players
func (g *game) receiver() {
	for {
		var cmd command
		err := websocket.JSON.Receive(g.ws, &cmd)
		if err != nil {
			break
		}
		if cmd.PlayerID > 0 && g.players[cmd.PlayerID] != nil {
			p := g.players[cmd.PlayerID]
			a := wrapCommand(cmd, "update", cmd.PlayerID)
			p.send <- &a
		}
	}
}

// from players to web game
func (g *game) sender() {
	for cmd := range g.toGame {
		err := websocket.JSON.Send(g.ws, cmd)
		if err != nil {
			break
		}
	}
}

func (g *game) registration() {
	toClose := false
	for {
		select {
		case p, ok := <-g.register:
			if !ok {
				toClose = true
				break
			}
			g.players[p.id] = p

			connectCmd := command{
				PlayerID: p.id,
			}

			// ack player
			p.send <- &action{
				Action: "connect",
				Data:   connectCmd,
			}

			// ack game
			g.toGame <- &action{
				Action: "addPlayer",
				Data:   connectCmd,
			}
		case p, ok := <-g.unregister:
			if !ok {
				toClose = true
				break
			}
			g.removePlayer(p)
		}

		if toClose {
			break
		}
	}
}

func (g *game) removePlayer(p *player) {
	if _, in := g.players[p.id]; in {
		g.toGame <- &action{
			Action: "removePlayer",
			Data: command{
				PlayerID: p.id,
			},
		}
		delete(g.players, p.id)
		p.clean()
	}
}

func (g *game) clean() {
	for _, p := range g.players {
		g.removePlayer(p)
	}
	close(g.toGame)
	delete(games, g.gameID)
	go g.ws.Close()
}
