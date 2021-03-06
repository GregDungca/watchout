// start slingin' some d3 here.
var gameOptions = {
  height: 450,
  width: 700,
  nEnemies: 30,
  padding: 20
};

var gameStats = {
  score: 0,
  bestScore: 0,
  collisionCount: 0
};

var axes = {
  x: d3.scale.linear().domain([0,100]).range([0,gameOptions.width]),
  y: d3.scale.linear().domain([0,100]).range([0,gameOptions.height])
}

var gameBoard = d3.select('.board').append('svg:svg')
                .attr('width', gameOptions.width)
                .attr('height', gameOptions.height);
                // .attr('xmlns', 'http://www.w3.org/2000/svg')
                // .attr('xlink', 'http://www.w3.org/1999/xlink');


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
  var dragMove = function () {
    this.moveRelative(d3.event.dx, d3.event.dy);
  }
  var player = this;
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




var players = [];
players.push(new Player(gameOptions));
players[0].render(gameBoard);

var createEnemies = function (){
  var arr = _.range(0, gameOptions.nEnemies);
  return _.map(arr, function(i) {
    return ( {
      id : i,
      x: Math.random()*100,
      y: Math.random()*100
    });
  });
};

var renderEnemies = function(enemy_data) {
  var enemies = gameBoard.selectAll('image').data(enemy_data, function(d) {
    return d.id;
  });

  enemies.enter().append('svg:image')
  .attr('class', 'enemy')
  .attr('x', function(enemy) {
    return axes.x(enemy.x)})
  .attr('y', function(enemy) { 
    return axes.y(enemy.y)})
  .attr('r', 1)
  .attr('xlink:href','Star.png')
  .attr('height', '40px')
  .attr('width', '40px')
  // .attr('transform', function(enemy) {
  //   return 'rotate(300 ' + axes.x(enemy.x) + ' ' + axes.y(enemy.y) + ')';
  // });

  //this.el.attr('transform', 'rotate(' + this.angle + ',' + this.getX() + ',' + this.getY() + ') ' + 
      //'translate(' + this.getX() + ',' + this.getY() + ')');

  enemies.exit().remove();
  enemies
    .transition().duration(500).attr('r',10)
    .transition().duration(2000).tween('custom',tweenWithCollisionDetection);

}

var checkCollision = function(enemy, collidedCallback) {
  _.each(players, function(player) {
    var radiusSum =  parseFloat(enemy.attr('r')) + player.r;
    var xDiff = parseFloat(enemy.attr('x')) - player.x;
    var yDiff = parseFloat(enemy.attr('y')) - player.y;
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
  updateCollisionCount();
}

var updateCollisionCount = function() {
  gameStats.collisionCount ++;
  d3.select('.collision-count').text(gameStats.collisionCount.toString());

}

var tweenWithCollisionDetection = function(endData) {
  var enemy = d3.select(this);
  var startPos = {
    x: parseFloat(enemy.attr('x')),
    y: parseFloat(enemy.attr('y'))
  }
  var endPos = {
    x: axes.x(endData.x),
    y: axes.y(endData.y)
  }
  
  return ( function (t) {
    checkCollision(enemy, onCollision);
    console.log('ran');

    var enemyNextPos = {
      x: startPos.x + (endPos.x - startPos.x) * t,
      y: startPos.y + (endPos.y - startPos.y) * t
    };

    enemy.attr('x', enemyNextPos.x)
      .attr('y', enemyNextPos.y);
  });


}

// var tween = function (d,i,a) {
//   return d3.interpolateString("rotate(0,100,100)","rotate(720,100,100)");
// }

var play = function() {
  var gameTurn = function() {
    renderEnemies(createEnemies());
  }
  var increaseScore = function() {
    gameStats.score++;
    updateScore();
  }
  gameTurn();
  setInterval(gameTurn, 2000);

  setInterval(increaseScore, 50);

  gameBoard.selectAll('image')
    .transition().duration(2000).tween('custom',tweenWithCollisionDetection);
    // .attrTween('transform',tween);

  // gameBoard.selectAll('image')
  //   .transition().duration(2000)
  //   .attrTween('transform', function (d,i,a) {
  //     return d3.interpolateString("rotate(0)","rotate(720)");
  //   });
}


























