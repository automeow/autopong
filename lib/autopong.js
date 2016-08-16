(function($) {
  var KEYS = {
    left: {
      up:   87, // w
      down: 83  // s
    },
    right: {
      up:   38, // up arrow
      down: 40  // down arrow
    }
  }

  function PongObject(width, height, element) {
    this.width   = width
    this.height  = height
    this.element = element
    this.x       = 0
    this.y       = 0
    this.element.css({
      position: 'absolute',
      width:    this.unitize(width),
      height:   this.unitize(height),
      background: 'red'
    })
  }

  PongObject.prototype.set = function(x, y) {
    this.x = this.fixPosition(x, this.width)
    this.y = this.fixPosition(y, this.height)
    this.element.css({
      left: this.unitize(this.x - (this.width  / 2)),
      top:  this.unitize(this.y - (this.height / 2))
    })
  }

  PongObject.prototype.move = function(x, y) {
    this.set(this.x + x, this.y + y)
  }

  PongObject.prototype.fixPosition = function(pos, size) {
    return Math.min(Math.max(pos, size / 2), 100 - (size / 2))
  }

  PongObject.prototype.unitize = function(number) {
    return number.toString() + '%'
  }

  PongObject.prototype.left = function() {
    return this.x - (this.width / 2)
  }

  PongObject.prototype.right = function() {
    return this.x + (this.width / 2)
  }

  PongObject.prototype.top = function() {
    return this.y - (this.height / 2)
  }

  PongObject.prototype.bottom = function() {
    return this.y + (this.height / 2)
  }

  PongObject.prototype.touchingBox = function(x1, y1, x2, y2) {
    return(
        this.left()   < x2 &&
        this.right()  > x1 &&
        this.top()    < y2 &&
        this.bottom() > y1
      )
  }

  PongObject.prototype.touching = function(object) {
    return this.touchingBox(
        object.left(),
        object.top(),
        object.right(),
        object.bottom()
      )
  }

  function PongBall(e) {
    var self = this
    PongObject.call(self, 2, 2, e)
    self.triggers = []
    self.velocity = { x: 0, y: 0 }
    self.timer    = setInterval(function() { self.tick() }, 1)
    e.css('border-radius', self.unitize(50))
  }
  PongBall.prototype = Object.create(PongObject.prototype)

  PongBall.prototype.stop = function() {
    clearTimeout(this.timer)
    this.element.remove()
  }

  PongBall.prototype.tick = function() {
    this.move(this.velocity.x, this.velocity.y)
    for(var i = 0; i < this.triggers.length; i++) {
      this.triggers[i](this)
    }
  }

  PongBall.prototype.trigger = function(f) {
    this.triggers.push(f)
  }

  PongBall.prototype.travel = function(x, y) {
    this.velocity = { x: x, y: y }
  }

  PongBall.prototype.target = function(pongObject) {
    this.targets.push(pongObject)
  }

  function KeyChecker(interval = 0) {
    var self = this
    self.callbacks = []
    self.timers    = {}
    self.interval  = interval

    $('body').keydown(function(e) {
      self.start(e.which)
    })

    $('body').keyup(function(e) {
      self.kill(e.which)
    })
  }

  KeyChecker.prototype.callers = function(key) {
    for(var i = 0; i < this.callbacks.length; i++) {
      if(this.callbacks[i].key == key) {
        this.callbacks[i].callback()
      }
    }
  }

  KeyChecker.prototype.start = function(key) {
    var self = this
    self.kill(key)
    self.timers[key] = setInterval(function() {
      self.callers(key)
    }, self.interval)
  }

  KeyChecker.prototype.killAll = function() {
    for(var i in this.timers) {
      this.kill(i)
    }
  }

  KeyChecker.prototype.kill = function(key) {
    if(this.timers[key]) {
      clearTimeout(this.timers[key])
      this.timers[key] = null
    }
  }

  KeyChecker.prototype.register = function(key, callback) {
    this.callbacks.push({ key: key, callback: callback })
  }

  function PongGame(element, onWin) {
    var self = this

    self.multiplier = 1.1
    self.movement   = 0.5
    self.element    = element
    self.left       = new PongObject(2, 20, $('<div />'))
    self.right      = new PongObject(2, 20, $('<div />'))
    self.keys       = new KeyChecker(5)
    self.onWin      = onWin

    element.css('position', 'relative')
    element.append(self.left.element, self.right.element)

    self.keys.register(KEYS.left.up,    function(){ self.left.move(0,  -self.movement) })
    self.keys.register(KEYS.left.down,  function(){ self.left.move(0,   self.movement) })
    self.keys.register(KEYS.right.up,   function(){ self.right.move(0, -self.movement) })
    self.keys.register(KEYS.right.down, function(){ self.right.move(0,  self.movement) })

    self.start()
  }

  PongGame.prototype.start = function() {
    this.left.set(0, 50)
    this.right.set(100, 50)
    this.setupBall()
  }

  PongGame.prototype.restart = function() {
    this.ball.stop()
    this.keys.killAll()
    this.start()
  }

  PongGame.prototype.setupBall = function() {
    var self = this
    self.ball = new PongBall($('<div />'))
    self.element.append(self.ball.element)
    self.ball.set(50, 50)
    self.lastTouch = null

    self.ball.trigger(function(ball) {
      if(ball.touching(self.left)) {
        self.hit(self.left)
      } else if(ball.touching(self.right)) {
        self.hit(self.right)
      }
      if(ball.touchingBox(0, 0, 100, 0.1)) {
        ball.travel(ball.velocity.x, -ball.velocity.y)
      } else if(ball.touchingBox(0, 99.9, 100, 100)) {
        ball.travel(ball.velocity.x, -ball.velocity.y)
      } else if(ball.touchingBox(0, 0.1, 0.1, 100)) {
        self.endGame(self.right)
      } else if(ball.touchingBox(99.9, 0, 100, 100)) {
        self.endGame(self.left)
      }
    })
    self.ball.travel(Math.random() > 0.5 ? 0.1 : -0.1, Math.random() * 0.01)
  }

  PongGame.prototype.endGame = function(winner) {
    this.ball.stop()
    this.keys.killAll()
    switch(winner) {
      case this.left: {
        this.onWin(this, 'left')
        break
      }
      case this.right: {
        this.onWin(this, 'right')
        break
      }
      default: {
        console.log('Error: who won??')
      }
    }
  }

  PongGame.prototype.hit = function(object) {
    if(self.lastTouch != object) {
      self.lastTouch = object
      this.ball.travel(
        -this.ball.velocity.x * this.multiplier,
        (this.ball.y - object.y) * 0.02 + this.variance()
      )
    }
  }

  PongGame.prototype.variance = function() {
    return Math.random() * 0.01
  }

  var games = []

  $.fn.autopong = function(options = {}) {
    var id = games.length
    $(this).data('autopong', id)
    games.push(new PongGame($(this), function(game, winner) {
      if(options.onWin) {
        options.onWin(game, winner)
      }
    }))
    return this
  }
}(jQuery))
