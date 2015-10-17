// start slingin' some d3 here.
var gameOptions = {
  height: 450,
  width: 700,
  nEnemies: 30,
  padding: 20
};

var gameStats = {
  score: 0,
  bestScore: 0
};

var axes = {
  x: d3.scale.linear().domain([0,100]).range([0,gameOptions.width]),
  y: d3.scale.linear().domain([0,100]).range([0,gameOptions.height])
}

var gameBoard = d3.select('.board').append('svg:svg')
                .attr('width', gameOptions.width)
                .attr('height', gameOptions.height);

var enemies = [];

var updateScore = function() {
  d3.select('.current-score')
    .text(gameStats.score.toString());  
};

var updateBestScore = function() {
  gameStats.bestScore = Math.max(gameStats.bestScore, gameStats.score);
  d3.select('.best-score').text(gameStats.bestScore.toString())
};

var Player = function(){
  this.path = 'm-7.5,1.62413c0,-5.04095 4.08318,-9.12413 9.12414,-9.12413c5.04096,0 9.70345,5.53145 11.87586,9.12413c-2.02759,2.72372 -6.8349,9.12415 -11.87586,9.12415c-5.04096,0 -9.12414,-4.08318 -9.12414,-9.12415z';
  this.fill = '#ff6600';
  this.x = 0;
  this.y = 0;
  this.angle = 0;
  this.r = 5;
}

Player.prototype.render = function(to) {
  this.el = to.append('svg:path')
    .attr('d',this.path)
    .attr('fill', this.fill);
  var init = {
    x : gameOptions.width * 0.5,
    y : gameOptions.height * 0.5
  };
  this.transform(init);
  this.setUpDragging();
}

Player.prototype.setUpDragging = function(){
  var player = this;
  var dragMove = function () {
    //console.log(d3.event.dx+','+d3.event.dy);//
    return player.moveRelative(d3.event.dx, d3.event.dy);
  }
  var drag = d3.behavior.drag()
      .on('drag', dragMove.bind(player));
  this.el.call(drag);

}

Player.prototype.getX = function() {
  return this.x;
}
Player.prototype.setX = function(x) {
  var minX = gameOptions.padding;
  var maxX = gameOptions.width - gameOptions.padding;
  if (x <= minX) {
    x = minX;
  }
  if (x >= maxX) {
    x = maxX;
  }
  this.x = x;
}

Player.prototype.getY = function() {
  return this.y;
}
Player.prototype.setY = function(y) {
  var minY = gameOptions.padding;
  var maxY = gameOptions.width - gameOptions.padding;
  if (y <= minY) {
    y = minY;
  }
  if (y >= maxY) {
    y = maxY;
  }
  this.y = y;
}

Player.prototype.transform = function(opts) {
  this.angle = opts.angle || this.angle;
  this.setX(opts.x || this.x);
  this.setY(opts.y || this.y);

  this.el.attr('transform', 'rotate(' + this.angle + ',' + this.getX() + ',' + this.getY() + ') ' + 
      'translate(' + this.getX() + ',' + this.getY() + ')');
}

Player.prototype.moveAbsolute = function (x,y) {
  var opts = {
    x : x,
    y : y
  };
  this.transform(opts);
}

Player.prototype.moveRelative = function (dx, dy) {
  var opts = {
    x : this.getX()+dx,
    y : this.getY()+dy,
    angle : 360* (Math.atan2(dy,dx)/(Math.PI*2))
  };
  this.transform(opts);
}


// var x = new Player();
// x.render(gameBoard);

players = [];
players.push(new Player(gameOptions).render(gameBoard));

var createEnemies = function (){
  enemies = _.range(0, gameOptions.nEnemies);
  enemies = _.map(enemies, function(i) {
    return ( {
      id : i,
      x: Math.random()*100,
      y: Math.random()*100
    });
  })  
};

var renderEnemies = function(enemy_data) {
  enemies = gameBoard.selectAll('circle.enemy').data(enemy_data, function(d) {
    return d.id;
  });

  enemies.enter().append('svg:circle')
  .attr('class', 'enemy')
  .attr('cx', function(enemy) {
    return axes.x(enemy.x)})
  .attr('cy', function(enemy) { 
    return axes.y(enemy.y)})
  .attr('r', 1);

  enemies.exit().remove();

}

var checkCollision = function(enemy, collidedCallback) {
  _.each(players, function(player) {
    var radiusSum =  parseFloat(enemy.attr('r')) + player.r;
    var xDiff = parseFloat(enemy.attr('cx')) - player.x;
    var yDiff = parseFloat(enemy.attr('cy')) - player.y;
    var separation = Math.sqrt( Math.pow(xDiff,2) + Math.pow(yDiff,2) );
    if (separation < radiusSum){
      collidedCallback(player, enemy);
    }
  });
};

var onCollision = function() {
  updateBestScore();
  gameStats.score = 0;
  updateScore();
}

var tweenWithCollisionDetection = function(endData) {
  var enemy = d3.select(this);
  var startPos = {
    x: parseFloat(enemy.attr('cx')),
    y: parseFloat(enemy.attr('cy'))
  }
  var endPos = {
    x: axes.x(endData.x),
    y: axes.y(endData.y)
  }

  return ( function (t) {
    checkCollision(enemy, onCollision);

    var enemyNextPos = {
      x: startPos.x + (endPos.x - startPos.x) * t,
      y: startPos.y + (endPos.y - startPos.y) * t
    };

    enemy.attr('cx', enemyNextPos.x)
      .attr('cy', enemyNextPos.y);
  });


}



























