(function() {
	
  var gameId =  document.querySelector('#gameId');
  var gameIdQuery = document.querySelector('#gameIdQuery');
  var tictactoe = document.querySelector('#tictactoe');
  var output = document.querySelector('#output');
  var whosTurn = document.getElementById('whosTurn');
  var chatWindow = document.querySelector('#chatWindow');
  var input = document.getElementById('input');
  var button = document.getElementById('button');
  
  document.getElementById("button").addEventListener("click", function(event){
    event.preventDefault();
    publishPosition('','',input.value);
	input.value='';
});

  var gameid = '';
  var rand = (Math.random() * 9999).toFixed(0);

  gameid = (getGameId()) ? getGameId() : rand;

  gameId.textContent = gameid;

  var oppoenetUrl = 'file:///C:/Users/IBM_ADMIN/Documents/api-guide-with-tictactoe-master_my/tictactoewithchat-master/plain.html?id=' +gameid;
  gameIdQuery.innerHTML = '<a href="' +oppoenetUrl+ '" target="_blank">' +oppoenetUrl+ '</a>';

  var channel = 'tictactoe--' + gameid;
  console.log('Channel: ' + channel);
  
  var uuid = PubNub.generateUUID();

  var pubnub = new PubNub({
    subscribeKey: 'sub-c-7e12bd38-36ea-11e8-9da7-9e748936d455',
    publishKey: 'pub-c-9cf152d1-8010-4082-9eb8-acce3975e678',
	uuid: uuid,
    ssl: true
  });

  // instantiating PubNub generates a UUID for you and stores it in localStorage
  // and reuses that UUID from localStorage on subsequent PubNub instantiations
  

  function displayOutput(msg) {
    if (!msg) return;
    return '<li><strong>' +  msg.player + '</strong>: ' + msg.position +'</li>';
  }

  /*
   * Tic-tac-toe
   * Based on http://jsfiddle.net/5wKfF/378/
   * Two player feature with PubNub
   */

  var mySign = 'X';
  
    pubnub.addListener({
    // message events callback - handles all messages published to the subscribed channels
    message: function(event) {
      // Display the move
	  
	  chatWindow.innerHTML = chatWindow.innerHTML +'<br>'+ event.message.value;
      if (document.querySelector('#moves')) {
        var movesOutput = document.querySelector('#moves');
        movesOutput.innerHTML =  movesOutput.innerHTML + displayOutput(event.message);
      }

      // Display the move on the board
      var el = document.querySelector('[data-position="'+ event.message.position + '"]');
	  if(el==null)return;
	  else{
      el.firstChild.nodeValue = event.message.player;}
	  console.log(event.message);
      console.log(el);

      checkGameStatus(event.message.player, el);

      // this is for Pub/Sub explained section.
      subscribed(event.message);
    },

    // presence events callback - handles all presence events for all channels subscribed withPresence
    presence: function(event) {
      console.log(event);

      if (event.uuid === uuid && event.action === 'join') {
        if (event.occupancy < 2) {
          whosTurn.textContent = 'Waiting for your opponent...';
        }
        else if (event.occupancy === 2) {
          mySign = 'O';
        }
        else if (event.occupancy > 2) {
          alert('This game already have two players!');
          tictactoe.className = 'disabled';
        }
      }

      if (event.occupancy === 2) {
        tictactoe.className = '';
        startNewGame();
      }

      document.getElementById('you').textContent = mySign;

      // For Presence Explained Section only
      if (document.querySelector('.presence')) {
        showPresenceExamples(event);
      }
    },

    // status events callback - handles network connectivity status events for all subscribed channels
    status: function(event) {
      if (event.category == "PNConnectedCategory") {
          play();
      }
    }
  });

  // subscribe to the game channel and monitor presence events on that channel
  pubnub.subscribe({
    channels: [channel],
    withPresence: true
  });

  function publishPosition(player, position,value) {
    pubnub.publish(
      {
        channel: channel,
		uuid:uuid,
        message: {player: player, position: position,value: value}
      },
      function (status, response) {
        if (status.error) {
            // handle error
            console.error(status);
        }
        else {
            console.log("message Published w/ timetoken", response.timetoken);
        }
      }
    );
  }
  

  function getGameId(){
    // If the uRL comes with referral tracking queries from the URL
    if (window.location.search.substring(1).split('?')[0].split('=')[0] !== 'id') {
      return null;
    }
    else {
      return window.location.search.substring(1).split('?')[0].split('=')[1];
    }
  }

  var squares = [];
  var EMPTY = '\xA0';
  var score;
  var moves;
  var turn = 'X';
  var wins = [7, 56, 448, 73, 146, 292, 273, 84];

  function startNewGame() {
    turn = 'X';
    score = {'X': 0, 'O': 0};
    moves = 0;

    for (var i = 0; i < squares.length; i += 1) {
      squares[i].firstChild.nodeValue = EMPTY;
    }

    whosTurn.textContent = (turn === mySign) ? 'Your turn' : 'Your opponent\'s turn';
  }

  function win(score) {
    for (var i = 0; i < wins.length; i += 1) {
      if ((wins[i] & score) === wins[i]) {
          return true;
      }
    }
    return false;
  }

  function checkGameStatus(player, el) {
    moves += 1;
    console.log('Moves: ' + moves);
    score[player] += el.indicator;
    console.log('Score for player, ' + player + ': ' + score[player]);

    if (win(score[turn])) {
      alert(turn + ' wins!');
    }
    else if (moves === 9) {
      alert('Boooo!');
    }
    else {
      turn = (turn === 'X') ? 'O' : 'X';
      whosTurn.textContent = (turn === mySign) ? 'Your turn' : 'Your opponent\'s turn';
    }
  }

  function set() {  
    if (turn !== mySign) return;
    if (this.firstChild.nodeValue !== EMPTY) return;
    publishPosition(mySign, this.dataset.position,input.value);
	input.value='';

    // this is for Pub/Sub explained section.
    toBePublished(mySign, this.dataset.position);
  }

  function play() {
    var indicator = 1;
    var i, j;
    var row, cell;
    var board = document.createElement('table');
    board.border = 1;

    for (i = 1; i < 4; i += 1) {
      row = document.createElement('tr');
      board.appendChild(row);

      for (j = 1; j < 4; j += 1) {
        cell = document.createElement('td');
        cell.dataset.position = i + '-' + j;
        cell.width = cell.height = 50;
        cell.align = cell.valign = 'center';
        cell.indicator = indicator;
        cell.onclick = set;
        cell.appendChild(document.createTextNode(''));
        row.appendChild(cell);
        squares.push(cell);
        indicator += indicator;
      }
    }
	
    tictactoe = document.getElementById('tictactoe');
    tictactoe.appendChild(board);
    startNewGame();
  }

  /*
   * Pub/Sub Explained section
   */

  function toBePublished(player, position,value) {
    if (!document.getElementById('pubPlayer')) return;
    document.getElementById('pubPlayer').textContent = '"' + player + '"';
    document.getElementById('pubPosition').textContent = '"' + position + '"';
  }

  function subscribed(msg) {
    if (!document.getElementById('subPlayer')) return;
    document.getElementById('subPlayer').textContent = '"' + msg.player + '"';
    document.getElementById('subPosition').textContent = '"' + msg.position + '"';
  }

  /*
   * History API Explained section
   */

  if (document.getElementById('history')) {
    var showResultButton = document.getElementById('showResultButton');
    var select = document.getElementById('count');
    var reverseCheck = document.getElementById('reverse');
    var timeCheck = document.getElementById('time');
    var timeSelect = document.getElementById('timeSpan');

    timeCheck.addEventListener('change', function(e) {
      if (timeCheck.checked) {
        timeSelect.hidden = false;
        reverseCheck.disabled = true;
      }
      else {
        timeSelect.hidden = true;
        reverseCheck.disabled = false;
      }
    });

    showResultButton.addEventListener('click', function(e) {
      output.innerHTML = '';

      var count = select.options[select.selectedIndex].value;
      console.log('Getting ' + count + ' messages from history...');

      var isReversed = reverseCheck.checked;
      console.log('Reverse: ' + isReversed);

      var timespan = (timeCheck.checked) ? timeSelect.value : null;

      getHistory(count, isReversed, timespan);
    }, false);
  }

  function getHistory(count, isReversed, timespan) {
    if (timespan) {
      var start = (new Date().getTime() - (timespan * 60 * 1000)) * 10000;
      var end = new Date().getTime() * 10000;

      console.log(start, end)

      pubnub.history(
        {
          channel: channel,
          count: count,
          start: start,
          end: end
        },
        function(status, response) {
          response.messages.forEach(function(msg) {
            console.log(msg);
            output.innerHTML =  output.innerHTML + displayOutput(msg);
          });
        }
      );
    }
    else {
      pubnub.history(
        {
          channel: channel,
          count: count,
          reverse: isReversed
        },
        function(status, response) {
          response.messages.forEach(function(msg){
            console.log(msg);
            output.innerHTML =  output.innerHTML + displayOutput(msg);
          });
        }
      );
    }
  }

  /*
   * Presence API Explained section
   */

  function showPresenceExamples(msg) {
    showPresenceConsole(msg);

    document.querySelector('.presence').classList.remove('two');
    document.querySelector('.presence strong').textContent = msg.occupancy;
    document.querySelector('.presence span').textContent = 'player';

    if (msg.occupancy > 1) {
      document.querySelector('.presence span').textContent = 'players';
      document.querySelector('.presence').classList.add('two');
    }
  }

  function showPresenceConsole(msg) {
    var console = document.querySelector('#presenceConsole');
    var child = document.createElement('div');
    var text = document.createTextNode(JSON.stringify(msg));
    child.appendChild(text);
    console.appendChild(child);
  }

  if (document.getElementById('quitButton')) {
    var quitButton = document.getElementById('quitButton');

    quitButton.addEventListener('click', function(e) {
      pubnub.unsubscribe({
        channels: [channel],
        callback: function(msg) {
          console.log(msg);
          showPresenceConsole(msg);
        }
      });
    });
  }
   
  
})();
