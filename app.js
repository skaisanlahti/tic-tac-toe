/*=== App overview ===
- Loose coupling with Event Module (PubSub)
- State Module that broadcasts variable changes to View
- View Module that reacts to State changes
- Logic Module that saves variables to State Module and contains core logic
=============================================================================*/

/*=== Main Application Module ===
Wrapper for the whole application to keep clean global state.
=============================================================================*/
const TicTacToe = (() => {
    
    /*=== Factories ===
    =============================================================================*/
    const createPlayer = (name, marker) => {
        return { name, marker };
    };
    const createGameBoard = (size) => {
        let board = [];
        for (let i = 0; i < size; i++){
            board.push("");
        }
        return board;
    };

    /*=== Event Module ===
    Basic PubSub event system for communication between modules.
    =============================================================================*/
    const EventModule = (() => {
        let events = {};
        return {
            addListener: function(eventName, listener){
                events[eventName] = events[eventName] || []; // returns an empty array if event doesn't exist
                events[eventName].push(listener);
            },
            removeListener: function(eventName, listener){
                if (events[eventName]){
                    for (let i = 0; i < events[eventName].length; i++){
                        if (events[eventName][i] === listener){
                            events[eventName].splice(i, 1);
                            break;
                        }
                    }
                }
            },
            trigger: function(eventName, data){
                if (events[eventName]){
                    events[eventName].forEach(function(listener){
                        listener(data);
                    });
                }
            }
        };
    })();

    /*=== State Module ===
    Keeps track of application state and adds event triggers to setters.
    =============================================================================*/
    const StateModule = (() => {
        // State object
        let state = {};
        // Boardcast events when values are set to state
        state = new Proxy(state, {
            set: function(target, key, value){
                target[key] = value;
                EventModule.trigger(`${key}Changed`, target);
                return true;
            }
        })
        return { state };
    })();
    
    /*=== View Module ===
    Module for game UI and DOM methods.
    =============================================================================*/
    const ViewModule = (() => {

        // DOM Elements
        const player1NameElement = document.querySelector(".ttt-main__player-name--1");
        const player2NameElement = document.querySelector(".ttt-main__player-name--2");
        const board = Array.from(document.querySelectorAll(".ttt-main__cell"));
        const reset = document.querySelector(".ttt-main__reset");
        const winner = document.querySelector(".ttt-main__winner");
        
        // Click Events
        for (let cell = 0; cell < board.length; cell++){
            board[cell].addEventListener("click", ()=> {
                EventModule.trigger("makeMove", cell);
            });
        }
        player1NameElement.addEventListener("click", () => {
            EventModule.trigger("editPlayer", "player1");
        });
        player2NameElement.addEventListener("click", () => {
            EventModule.trigger("editPlayer", "player2");
        });
        reset.addEventListener("click", () => {
            EventModule.trigger("resetGame");
        });


        // Render Methods
        const render = (element, source) => {
            element.innerText = source;
        }
        const highlightActivePlayer = function(state){
            if (state.activePlayer === state.player1) {
                player1NameElement.classList.add("active-player");
                player2NameElement.classList.remove("active-player");
            }else if (state.activePlayer === state.player2){
                player2NameElement.classList.add("active-player");
                player1NameElement.classList.remove("active-player");
            }else {
                player1NameElement.classList.remove("active-player");
                player2NameElement.classList.remove("active-player");
            }
        }

        // Event Handlers
        EventModule.addListener(`player1Changed`, (state) => {
            render(player1NameElement, state.player1.name);
        });
        EventModule.addListener(`player2Changed`, (state) => {
            render(player2NameElement, state.player2.name);
        });
        EventModule.addListener(`boardChanged`, (state) => {
            for (let i = 0; i < state.board.length; i++){
                render(board[i], state.board[i]);
            }
        });
        EventModule.addListener(`winnerChanged`, (state) => {
            if (state.winner){
                winner.innerText = `Winner is ${state.winner.name}!`;
            }else {
                winner.innerText = `The game is a draw!`;
            }

        });
        EventModule.addListener(`activePlayerChanged`, highlightActivePlayer);
        EventModule.addListener(`resetGame`, () => {
            winner.innerText = `The game is a draw!`;
            reset.classList.add("invisible");
            winner.classList.add("invisible");
        });
        EventModule.addListener(`endGame`, () => {
            reset.classList.remove("invisible");
            winner.classList.remove("invisible");
        });
    })();

    /*=== Logic Module ===
    Application logic.
    =============================================================================*/
    const LogicModule = (() => {

        // Initialize StateModule Variables
        StateModule.state.player1 = createPlayer("Player 1", "X");
        StateModule.state.player2 = createPlayer("Player 2", "O");
        StateModule.state.activePlayer = StateModule.state.player1;
        StateModule.state.board = createGameBoard(9);
        StateModule.state.winner = null;
        StateModule.state.endGame = false;

        // Handle ViewModule Events
        EventModule.addListener("makeMove", (cell) => {
            if (StateModule.state.activePlayer && StateModule.state.endGame === false){
                let newBoard = StateModule.state.board;
                if (!newBoard[cell]){
                    newBoard[cell] = StateModule.state.activePlayer.marker;
                    StateModule.state.board = newBoard;

                    // Horizontals
                    let row1 = [newBoard[0], newBoard[1], newBoard[2]];
                    let row2 = [newBoard[3], newBoard[4], newBoard[5]];
                    let row3 = [newBoard[6], newBoard[7], newBoard[8]];
                    // Verticals
                    let row4 = [newBoard[0], newBoard[3], newBoard[6]];
                    let row5 = [newBoard[1], newBoard[4], newBoard[7]];
                    let row6 = [newBoard[2], newBoard[5], newBoard[8]];
                    // Diagonals
                    let row7 = [newBoard[0], newBoard[4], newBoard[8]];
                    let row8 = [newBoard[2], newBoard[4], newBoard[6]];

                    // Check win condition
                    let rows = [row1, row2, row3, row4, row5, row6, row7, row8];
                    function checkWin(row){
                        if (row[0] === row[1] && row[1] === row[2] && !row.includes("")) return true;
                        else return false;
                    }
                    for (let i = 0; i < rows.length; i++){
                        if (checkWin(rows[i])){
                            StateModule.state.endGame = true;
                            StateModule.state.winner = StateModule.state.activePlayer;
                            EventModule.trigger("endGame");
                            break;
                        }else if(!newBoard.includes("")){
                            StateModule.state.endGame = true;
                            EventModule.trigger("endGame");
                        }else {
                            endGame = false;
                        }
                    }
                    
                    // Change active player
                    if (StateModule.state.activePlayer === StateModule.state.player1 && !StateModule.state.endGame) {
                        StateModule.state.activePlayer = StateModule.state.player2;
                    }else if (StateModule.state.activePlayer === StateModule.state.player2 && !StateModule.state.endGame){
                        StateModule.state.activePlayer = StateModule.state.player1;
                    }else {
                        StateModule.state.activePlayer = null;
                    }

                }
            }else{
                console.log("Can't make anymore moves.");
            }
        });
        EventModule.addListener("resetGame", () => {
            StateModule.state.activePlayer = StateModule.state.player1;
            StateModule.state.endGame = false;
            StateModule.state.board = createGameBoard(9);
        });
        EventModule.addListener("editPlayer", (player) => {
            let newPlayer = {}
            while (!newPlayer.name){
                newPlayer.name = prompt("What name do you want to use?");
            }
            StateModule.state[player] = Object.assign(StateModule.state[player], newPlayer);
        });
    })();

})();