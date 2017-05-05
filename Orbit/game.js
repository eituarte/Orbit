var game = function() {

// Set up an instance of the Quintus engine  and include
// the Sprites, Scenes, Input and 2D module. The 2D module
// includes the `TileLayer` class as well as the `2d` componet.
var Q = window.Q = Quintus({ audioSupported: [ 'mp3', 'ogg' ] })
        .include("Sprites, Scenes, Input, 2D, Anim, Touch, UI, TMX, Audio").enableSound()
        // Maximize this game to whatever the size of the browser is
        .setup({ maximize: true })
        // And turn on default input controls and touch input (for UI)
        .controls().touch();


Q.animations("hammer_anim", {
  still: { frames: [0], rate: 1, flip: false, loop: false},
  hit: { frames: [0,1,0,1,0,1,0], rate: 2/10, flip: false, loop: false, next: "still"}
});

Q.Sprite.extend("Wormhole", {
  init:function(paramX, paramY){
    this._super({
      asset:"wormhole.png",
      x: paramX,
      y: paramY, 
      gravity:0
    });
    this.add('2d');
    this.p.sensor=true;
    //this.p.animate({this.p.h: 600, this.p.w: 600}, 1);
  }
});


Q.Sprite.extend("exteriorCircularInfluence", {
  init:function(paramX, paramY){
    this._super({
      asset:"exteriorCircularInfluence.png",
      x: paramX,
      y: paramY
    });
    this.add('animation, tween');
    this.p.sensor=true;
    this.animate({angle: 500}, 180);
  }
});
Q.Sprite.extend("interiorCircularInfluence", {
  init:function(paramX, paramY){
    this._super({
      asset:"interiorCircularInfluence.png",
      x: paramX,
      y: paramY
    });
    this.add('animation, tween');
    this.p.sensor=true;
    this.animate({angle: 1500}, 180);
  },
  step: function(){
  }
});

// Global Quintus variables
Q.state.set({
  nPlanet: 1,
  planets: {
    1: { x: 540, y: 330, d: 400, r: 60}
  },
  player: {
    x: 100,
    y: 320
  }
});

Q.Sprite.extend("Hammer", {
  init:function(paramX, paramY, paramVx, paramVy){
    this._super({
      sprite:"hammer_anim",
      sheet:"hammer",
      x: paramX,
      y: paramY,
      vx: paramVx,
      vy: paramVy,
      velX: paramVx,
      velY: paramVy,
      gravity:0,
      stage: "going",
      t: 0
    });
    this.add('2d, animation, tween, platformerControls');
    this.p.sensor=true;
    this.p.h = 16;
    Q.input.on("up", this, function(){
      this.p.vy = -40;
    });
    Q.input.on("down", this, function(){
      this.p.vy = 40;
    });
  },

  die: function(){
    this.destroy();
  },

  step: function(dt){
    // Calculamos distancia con planeta
    this.p.t+= 1/(16*60); // Calculamos los segundos que han pasado
    var planets = Q.state.get("planets");
    var nPlanet = Q.state.get("nPlanet");
    var d = Math.sqrt((planets[nPlanet].x - this.p.x) * (planets[nPlanet].x - this.p.x) + (planets[nPlanet].y - this.p.y) * (planets[nPlanet].y - this.p.y));
    //console.log("Distancia: " + d);
    //console.log("Distancia mínima: " + planets[nPlanet].d);
    if (d < planets[nPlanet].d && !(d > -planets[nPlanet].r && d < planets[nPlanet].r)){
      //console.log("Has entrado en el campo gravitatorio");
      // Aplicar fuerzas
      var dx = planets[nPlanet].x - this.p.x;
      var dy = planets[nPlanet].y - this.p.y;
      var ax = dx < 0 ? -9.8 : 9.8;
      var ay = dy < 0 ? -9.8 : 9.8;
      
      this.p.velX = ax*this.p.t + this.p.velX;
      this.p.vx = this.p.velX;
      this.p.velY = ay*this.p.t + this.p.velY;
      this.p.vy = this.p.velY;

      //this.p.x = (1/2*ax*this.p.t*this.p.t) + this.p.vx*this.p.t + this.p.x;
      //this.p.y = (1/2*ay*this.p.t*this.p.t) + this.p.vy*this.p.t + this.p.y;
      //console.log("x: " + this.p.x);

      //console.log("vx: " + this.p.vx);
      //console.log("vy: " + this.p.vy);
    }
    else{
      //console.log("Has salido del campo gravitatorio");
    }
    if(d > -planets[nPlanet].r && d < planets[nPlanet].r){
      console.log("Quieto");
      this.p.vx = 0;
      this.p.vy = 0;
    }
  }

});

Q.component("defaultEnemy",{
  added:function(){
    this.entity.on("bump.left, bump.right, bump.bottom",function(collision) {
        if(collision.obj.isA("Mario") || collision.obj.isA("Prost")) { 
            collision.obj.die();
        }
        if(collision.obj.isA("Hammer")){
          this.destroy();
        }
    });
  }
});

/*
Q.scene("HUD",function(stage) {

  
  // Contador descendente del poder del martillo
  var hammerSecs = Q.state.get("hammer");
  var remainingSecs = new Q.UI.Text({x: Q.width/2, y: 90, label: hammerSecs, color: "#707070", outlineWidth: 3});
  stage.insert(remainingSecs);

  // Contador ascendente de puntos por monedas
  var nCoins = Q.state.get("score");
  var text = new Q.UI.Text({x:80, y: 40, label: "Score: "+ nCoins, color: "#ffc600", outlineWidth: 3, outline: "#ff7200"});
  stage.insert(text);

  // Contador descendente de puntos de vida
  var lifePoints = Q.state.get("lifePoints");
  var life =new Q.UI.Text({x:110, y: 70, label: "Life points: "+ lifePoints, color: "#ffc600", outlineWidth: 3, outline: "#ff7200"});
  stage.insert(life);

  var hint = Q.state.get("hint");
  var help =new Q.UI.Text({x: Q.width/2, y: 20, label: hint, color: "#ffc600", outlineWidth: 3, outline: "#ff7200"});
  stage.insert(help);
});
*/
/*
Q.load(["Woof.mp3", "metalBang.mp3", "Hammer.mp3", "Victory.mp3","music_main.mp3", "coin.mp3", "music_level_complete.mp3" ], function() { 
  //Q.audio.play('music_main.mp3',{ loop: true });
});
*/

Q.load(["wormhole.png", "interiorCircularInfluence.png", "exteriorCircularInfluence.png", "galaxy.png", "hammer.png", "hammer.json", "thunder.png", "thunder.json", "prost_small.png", "prost.json", "mainTitle.png","princess.png","coin.png","coin.json","mario_small.png", "mario_small.json", "goomba.png", "goomba.json", "bloopa.png", "bloopa.json", "bgProst.png"], function(){
        Q.compileSheets("prost_small.png", "prost.json");
        Q.compileSheets("hammer.png", "hammer.json");
        Q.compileSheets("thunder.png", "thunder.json");
        Q.compileSheets("mario_small.png", "mario_small.json");
        Q.compileSheets("goomba.png", "goomba.json");
        Q.compileSheets("bloopa.png", "bloopa.json");
        Q.compileSheets("coin.png", "coin.json");
      });


Q.scene("level1",function(stage) {
      stage.insert(new Q.Repeater({ asset: "bgProst.png", speedX: 0.2, speedY: 0.2, type: 0 }));
      //stage.insert(new Q.Repeater({ asset: "galaxy.png", speedX: 0.5, speedY: 0.5, type: 0 }));
      
      //var extCircle=stage.insert(new Q.exteriorCircularInfluence(350, 250));
      
      var extCircle=stage.insert(new Q.exteriorCircularInfluence(550, 320));
      var intCircle=stage.insert(new Q.interiorCircularInfluence(550, 320));
      
      var wormhole=stage.insert(new Q.Wormhole(550, 320));

      var hammer = stage.insert(new Q.Hammer(100, 520, 20, 0));
      
      //Q.stageTMX("levelProst.tmx",stage);
      stage.add("viewport").follow(hammer,{ x: true, y: false });
});

Q.loadTMX("levelProst.tmx", function() {
    //Q.stageScene("level1");
    Q.stageScene("menu");
    //Q.debug = true;
});

Q.scene('endGame',function(stage) {
  var container = stage.insert(new Q.UI.Container({
    x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
  }));

  var button = container.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC",
                                                  label: "Play Again" }));         
  var label = container.insert(new Q.UI.Text({x:5, y: -10 - button.p.h, 
                                                   label: stage.options.label, color: "#FFFFFF" }));
  button.on("click",function() {
    Q.clearStages();
    Q.audio.stop();
    Q.state.reset({score: 0, hammer: " ", game: "playing", lifePoints: 5, hint: "Hint: find the power of the Gods"});
    //Q.audio.play('music_main.mp3',{ loop: true });
    Q.stageScene('level1', 0);
    Q.stageScene('HUD', 1);
  });

  container.fit(20);
});

Q.scene('menu',function(stage) {
  var container = stage.insert(new Q.UI.Container({
    x: Q.width/2, y: Q.height/2, fill: "rgba(0,0,0,0.5)"
  }));

  var button = container.insert(new Q.UI.Button({ x: 0, y: 0, fill: "#CCCCCC", w:Q.width, h:Q.height, asset:"mainTitle.png" })); 
  /*
  this.on("confirm", function(){
    Q.clearStages();
    Q.state.reset({score: 0, hammer: " ", game: "playing", lifePoints: 5, hint: "Hint: find the power of the Gods"});
    Q.stageScene('level1', 0);
    Q.stageScene('HUD', 1);
  });*/

  button.on("click",function() {
    Q.clearStages();
    Q.state.reset({
      nPlanet: 1,
      planets: {
        1: { x: 540, y: 330, d: 400, r : 60}
      },
      player: {
        x: 100,
        y: 320
      }
    });
    Q.stageScene('level1', 0);
    Q.stageScene('HUD', 1);
  });

});

}