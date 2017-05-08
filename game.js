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
  init:function(paramX, paramY, paramAsset){
    this._super({
      asset: paramAsset,
      x: paramX,
      y: paramY, 
      gravity:0,
      scale: 0.4
    });
    this.add('2d, animation, tween');
    this.p.sensor=true;
    //this.animate({scale: 2}, 1);
    var self = this;
    setTimeout(function(){
      self.destroy();
    }, 9000);
  }
});

Q.Sprite.extend("Planet", {
  init: function(paramX, paramY, paramAsset){
    this._super({
      asset: paramAsset,
      x: paramX,
      y: paramY
    });
    this.p.sensor = true;
  }
});

function createPlanet(stage){
  var n = Q.state.get("nPlanet");
  var planets = Q.state.get("planets");
  var p = planets[n];
  stage.insert(new Q.Planet(p.x, p.y, n + ".png"));
}

function createPlanets(stage){
  var planets = Q.state.get("planets");
  for(var i = 1; i < 8; i++){
    var p = planets[i];
      stage.insert(new Q.Planet(p.x, p.y, i + ".png"));
  }
}

Q.Sprite.extend("Blackhole", {
  init:function(paramX, paramY, paramAsset, paramScale){
    this._super({
      asset: paramAsset,
      x: paramX,
      y: paramY, 
      gravity: 0,
      scale: paramScale,
      created: false
    });
    this.add('2d, animation, tween');
    this.p.sensor=true;
  },

  step: function(){
    if(this.p.created == false){
      this.p.created = true;
      if(this.p.scale > 0.4 && this.p.asset != "wormhole.png"){
        this.animate({angle: 5000 * (1.2 - this.p.scale)}, 180);
        console.log("Scale: " + this.p.scale);
        this.stage.insert(new Q.Blackhole((this.p.x + (this.p.w - this.p.w*this.p.scale)/100), (this.p.y + (this.p.h - this.p.h*this.p.scale)/100), "interiorCircularInfluence.png", this.p.scale - 0.2));
      }
      else if (this.p.scale < 0.4 && this.p.scale > 0.2){
        console.log("Blackhole: " + this.p.scale)
        this.stage.insert(new Q.Blackhole((this.p.x + (this.p.w - this.p.w*this.p.scale)/100), (this.p.y + (this.p.h - this.p.h*this.p.scale)/100), "wormhole.png", 0.4));
      }
    }
  }
});

/*
// Estas dos son clases para dar un efecto de distorsión del espacio alrededor del Wormhole
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
*/

// Clase que representa un lado del campo de estrellas de EventHorizon
Q.Sprite.extend("QuarterStarfield", {
  init:function(paramX, paramY, paramSide){
    this._super({
      asset:"quarterStarfield.png",
      x: paramX,
      y: paramY,
      scale: 0.25,
      gravity: 0.01,
      side: paramSide
    });
    if(Math.random() > 0.5 ){
      this.p.asset = "quarterStarfield2.png";
    }
    if(this.p.side == "bottom"){
      this.p.vy = 180;
      this.p.angle = 0;
    }
    else if (this.p.side == "top"){
      this.p.vy = -180;
      this.p.angle = 180;
    }
    else if (this.p.side == "right"){
      this.p.vx = 180;
      this.p.angle = -90;
    }
    else if (this.p.side == "left"){
      this.p.vx = -180;
      this.p.angle = 90;
    }
    this.add('animation, tween');
    this.p.sensor=true;
    this.animate({angle: this.p.angle}); // Rotamos en función del side
    this.animate({scale: 2, opacity: 0}, 8); // Extendemos hacia fuera para dar efecto de túnel
    var self = this;
    setTimeout(function(){
      self.destroy(); // A los 8 segundos muere
    }, 8000);
  },
  step: function(){    
  }
});

// Clase
Q.Sprite.extend("EventHorizon", {
  init:function(paramX, paramY){
    this._super({
      asset:"vortex.png",
      x: paramX,
      y: paramY,
      scale: 1,
      opacity: 0,
      t: 0 // Factor "tiempo"
    });
    this.add('animation, tween');
    this.p.sensor=true;
    this.animate({opacity: 1}, 2); 
    this.animate({angle: -3000}, 80); // Molaría que diese vueltas en loop
  },
  step: function(){
    this.p.t++;
    if(this.p.t%100 == 0){ // Cada cierto tiempo creamos nuevos campos de estrellas
      this.stage.insert(new Q.QuarterStarfield(this.p.x, this.p.y + 100, "bottom"));
      this.stage.insert(new Q.QuarterStarfield(this.p.x, this.p.y - 100, "top"));
      this.stage.insert(new Q.QuarterStarfield(this.p.x + 80, this.p.y - 20, "right"));
      this.stage.insert(new Q.QuarterStarfield(this.p.x - 80, this.p.y - 20, "left"));
      this.stage.insert(new Q.Wormhole(this.p.x, this.p.y, "blackhole.png"));
    }
  }
});

// Global Quintus variables
Q.state.set({
  nPlanet: 0, // Índice del planeta actual, cuando se incremente, creamos el planeta
  planets: { // Coordenadas, distancia de órbita, radio del planeta
    1: { x: 540, y: 330, d: 400, r: 60, name: "Pandora", g: 12}, // El radio ha de ser la mitad de la longitud de la imagen
    2: { x: 1240, y: 330, d: 400, r: 160, name: "Reddy", g: 12},
    3: { x: 1840, y: 330, d: 400, r: 210, name: "Greeny", g: 12},
    4: { x: 2340, y: 330, d: 400, r: 250, name: "Veggie", g: 12},
    5: { x: 4040, y: 330, d: 400, r: 300, name: "Bluey", g: 12},
    6: { x: 5200, y: 330, d: 400, r: 125, name: "Stormzy", g: 12},
    7: { x: 7200, y: 330, d: 400, r: 350, name: "Purply", g: 12}
  },
  player: {
    x: 100,
    y: 320,
    oxygen: 100,
    spaceSuit: 100
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
    Q.input.on("S", this, function(){
      console.log("x: " + this.p.x);
      console.log("y: " + this.p.y);
    });
  },

  die: function(){
    this.destroy();
  },

  step: function(dt){
    
    this.p.t+= 1/(16*60); // Calculamos los segundos que han pasado
    var planets = Q.state.get("planets"); // Cogemos el objeto planetas de la variable global Q.state
    var nPlanet = Q.state.get("nPlanet"); // Cogemos el índice del planeta actual
    if(nPlanet > 0){
       var d = Math.sqrt((planets[nPlanet].x - this.p.x) * (planets[nPlanet].x - this.p.x) + (planets[nPlanet].y - this.p.y) * (planets[nPlanet].y - this.p.y));
          //console.log("Distancia: " + d);
          //console.log("Distancia mínima: " + planets[nPlanet].d);
    // Si ha entrado en órbita (la distancia al planeta es menor que la distancia de órbita (planets[nPlanet].d)) y no ha llegado a la superficie (usamos el radio)
    if (d < planets[nPlanet].d && !(d > -planets[nPlanet].r && d < planets[nPlanet].r)){
          //console.log("Has entrado en el campo gravitatorio");
      // Calculamos distancias
      var dx = planets[nPlanet].x - this.p.x;
      var dy = planets[nPlanet].y - this.p.y;
      // Calculamos la gravedad en función de la posición (habría que usar la fórmula gravitacional)
      var ax = dx < 0 ? -9.8 : 9.8;
      var ay = dy < 0 ? -9.8 : 9.8;
      
      // Calculamos las velocidades en ambos ejes (guardamos en variable auxiliar porque si no no funciona)
      this.p.velX = ax*this.p.t + this.p.vx;
      this.p.vx = this.p.velX;
      this.p.velY = ay*this.p.t + this.p.vy;
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
    // Si ha llegado a la superficie (Ha chocado con el planeta)
    if(d > -planets[nPlanet].r && d < planets[nPlanet].r){
      console.log("Quieto");
      this.p.vx = 0;
      this.p.vy = 0;
    }
    }
    // Calculamos distancia en línea recta con el planeta
   
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

Q.load(["1.png","2.png", "3.png","4.png","5.png","6.png","7.png","8.png","blackhole.png", "quarterStarfield.png", "quarterStarfield2.png", "vortex.png", "wormhole.png", "interiorCircularInfluence.png", "exteriorCircularInfluence.png", "galaxy.png", "hammer.png", "hammer.json", "thunder.png", "thunder.json", "prost_small.png", "prost.json", "mainTitle.png","princess.png","coin.png","coin.json","mario_small.png", "mario_small.json", "goomba.png", "goomba.json", "bloopa.png", "bloopa.json", "bgProst.png"], function(){
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
      
      //var extCircle=stage.insert(new Q.exteriorCircularInfluence(550, 320));
      //var intCircle=stage.insert(new Q.interiorCircularInfluence(550, 320));
      
      //var wormhole=stage.insert(new Q.Wormhole(550, 320, "wormhole.png"));
      //var blackhole=stage.insert(new Q.Blackhole(550, 320, "interiorCircularInfluence.png", 1));
      //var vortex=stage.insert(new Q.EventHorizon(850, 320));
      createPlanets(stage);
      var hammer = stage.insert(new Q.Hammer(200, 520, 20, 0));
      stage.add("viewport").follow(hammer,{ x: true, y: false });
});

Q.scene("playerScene",function(stage) {

      //var hammer = stage.insert(new Q.Hammer(100, 520, 20, 0));
      
      //Q.stageTMX("levelProst.tmx",stage);
      //stage.add("viewport").follow(hammer,{ x: true, y: false });
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
      nPlanet: 1, // Índice del planeta actual, cuando se incremente, creamos el planeta
      planets: { // Coordenadas, distancia de órbita, radio del planeta
        1: { x: 540, y: 330, d: 400, r: 134, name: "Pandora", g: 12}, // El radio ha de ser la mitad de la longitud de la imagen
        2: { x: 1240, y: 330, d: 400, r: 160, name: "Reddy", g: 12},
        3: { x: 1840, y: 330, d: 400, r: 210, name: "Greeny", g: 12},
        4: { x: 2340, y: 330, d: 400, r: 250, name: "Veggie", g: 12},
        5: { x: 4040, y: 330, d: 400, r: 300, name: "Bluey", g: 12},
        6: { x: 5200, y: 330, d: 400, r: 125, name: "Stormzy", g: 12},
        7: { x: 7200, y: 330, d: 400, r: 350, name: "Purply", g: 12}
      },
      player: {
        x: 100,
        y: 320,
        oxygen: 100,
        spaceSuit: 100
      }
    });
    Q.stageScene('level1', 0);
    //Q.stageScene('playerScene', 1);
    Q.stageScene('HUD', 2);
  });

});

}