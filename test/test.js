$(function() {
  $('.pong').autopong({
      onWin: function(game, winner) {
        alert('The ' + winner + ' side wins!')
        game.restart()
      }
    })
})