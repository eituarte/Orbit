var game = function() {

// Set up an instance of the Quintus engine  and include
// the Sprites, Scenes, Input and 2D module. The 2D module
// includes the `TileLayer` class as well as the `2d` componet.
var Q = window.Q = Quintus({ audioSupported: [ 'mp3', 'ogg' ] })
        .include("Sprites, Scenes, Input, 2D, Anim, Touch, UI, TMX, Audio, Dialogue").enableSound()
        // Maximize this game to whatever the size of the browser is
        .setup({ maximize: true })
        // And turn on default input controls and touch input (for UI)
        .controls().touch();


Q.animations("Spaceship_anim", {
  still: { frames: [0], rate: 1, flip: false, loop: false},
  hit: { frames: [0,1,0,1,0,1,0], rate: 2/10, flip: false, loop: false, next: "still"}
});
Q.animations("spaceship_anim", {
  right: { frames: [1], rate: 1, flip: false, loop: false},
  left: { frames: [0], rate: 1, flip: false, loop: false},
  go_left: { frames: [2], rate: 1, flip: false, loop: false, next: "left"},
  go_right: { frames: [3], rate: 1, flip: false, loop: false, next: "right"},
  right_3D: { frames: [5], rate: 1, flip: false, loop: false},
  left_3D: { frames: [4], rate: 1, flip: false, loop: false}
});

Q.animations("explosion_anim", {
  explode: { frames: [0,0,0,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47], rate: 1/10, flip: false, loop: false, trigger: "finished"},
  explode_and_fire: { frames: [0,0,0,0, 1, 2,3,4,5,6,7,8], rate: 1/10, flip: false, loop: false, next: "fireExtension"},
  fireExtension: { frames: [9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36], rate: 1/10, flip: false, loop: true}
});

Q.Sprite.extend("Explosion", {
  init:function(paramX, paramY, paramScale, explode){
    this._super({
      sprite:"explosion_anim",
      sheet:"explosion",
      x: paramX,
      y: paramY,
      scale: paramScale,
      zIndex: 3
    });
    this.add('animation, tween');
    this.on("finish", this, "end");
    this.p.sensor = true;
    this.animate({scale: this.p.scale * 2}, 2);
    if(explode == "explode"){
      this.play("explode");
    }
    else{
      this.play("explode_and_fire");
    }
    Q.audio.play("explosion.mp3");
  },
  end: function(){
    this.destroy();
    // animar más cosas posiblemente
  }
});

Q.Sprite.extend("Station", {
  init:function(paramX, paramY, paramAsset){
    this._super({
      asset: paramAsset,
      x: paramX,
      y: paramY,
      scale: 1,
      zIndex: 2
    });
    this.add('animation, tween');
    this.p.sensor = true;
  }
});

Q.Sprite.extend("Tunnel", {
  init:function(paramX, paramY, paramAsset, z){
    this._super({
      asset: paramAsset,
      x: paramX,
      y: paramY, 
      gravity:0,
      scale: 0.1,
      zIndex: z,
      t: 0
    });
    this.add('2d, animation, tween');
    this.p.sensor=true;
    this.animate({scale: 0.6}, 14, Q.Easing.Quadratic.In);

  },
  step: function(){
    this.p.t++;
    if(this.p.t >= 800){
      this.destroy();
    }
  }
});

Q.Sprite.extend("Wormhole", {
  init:function(paramX, paramY, paramAsset, z){
    this._super({
      asset: paramAsset,
      x: paramX,
      y: paramY, 
      gravity:0,
      scale: 0.4,
      zIndex: 3
    });
    this.add('2d, animation, tween');
    //this.p.sensor=true;
    this.p.h = 5000;
    this.p.w = 5000;
    // Aumentar w y h para que colisione en cualquier caso.
    // Al colisionar, aumentar escala y comenzar event horizon, 
    // luego ya se eliminará wormhole y podrá salir por patas
  }
});

Q.Sprite.extend("Planet", {
  init: function(paramX, paramY, paramAsset, paramR, paramD, paramN, z){
    this._super({
      asset: paramAsset,
      x: paramX,
      y: paramY,
      d: paramD,
      r: paramR,
      n: paramN,
      zIndex: z
    });
    this.p.sensor = true;
  }
});
Q.Sprite.extend("Universe", {
  init: function(){
    this._super({
      asset: "bgHammer.png",
      x: 0,
      y: 0
    });
    this.p.sensor = true;
  }
});

function createPlanet(stage){
  var n = Q.state.get("nPlanet");
  var planets = Q.state.get("planets");
  var p = planets[n];
  stage.insert(new Q.Planet(p.x, p.y, n + ".png", p.r, p.d, n));
}

function createPlanets(stage){
  var universe = stage.insert(new Q.Universe());

  var planets = Q.state.get("planets");
  var orbits = {};
  for(var i = 1; i < 8; i++){
    var p = planets[i];
      stage.insert(new Q.Planet(p.x, p.y, i + ".png", p.r, p.d, i, 1), universe);
      orbits[i] = {x1: p.x - 2*(p.r + p.d), x2: p.x + 2*(p.r + p.d)};
  }
  var wh = planets["wormhole"];
  stage.insert(new Q.Blackhole(wh.x, wh.y, "interiorCircularInfluence.png", 1, 1), universe);
  orbits["wormhole"] = {x1: wh.x - 2*(wh.r + wh.d), x2: wh.x + 2*(wh.r + wh.d)};
  Q.state.set("orbits", orbits);
}

Q.Sprite.extend("Blackhole", {
  init:function(paramX, paramY, paramAsset, paramScale, z){
    this._super({
      asset: paramAsset,
      x: paramX,
      y: paramY, 
      gravity: 0,
      scale: paramScale,
      created: false,
      zIndex: z
    });
    this.add('2d, animation, tween');
    this.p.sensor=true;
    this.on("hit", this, function(collision){
      if(collision.obj.isA("Spaceship")){
        this.destroy();
      }
    });
  },

  step: function(){
    if(this.p.created == false){
      this.p.created = true;
      if(this.p.scale > 0.4 && this.p.asset != "wormhole.png"){
        this.animate({angle: 5000 * (1.2 - this.p.scale)}, 180);
        this.stage.insert(new Q.Blackhole((this.p.x + (this.p.w - this.p.w*this.p.scale)/100), (this.p.y + (this.p.h - this.p.h*this.p.scale)/100), "interiorCircularInfluence.png", this.p.scale - 0.2, 1));
      }
      else if (this.p.scale < 0.4 && this.p.scale > 0.2){
        this.stage.insert(new Q.Wormhole((this.p.x + (this.p.w - this.p.w*this.p.scale)/100), (this.p.y + (this.p.h - this.p.h*this.p.scale)/100), "wormhole.png", 2));
      }
    }
  }
});

// Clase que representa un lado del campo de estrellas de EventHorizon
Q.Sprite.extend("QuarterStarfield", {
  init:function(paramX, paramY, paramSide, z){
    this._super({
      asset:"quarterStarfield.png",
      x: paramX,
      y: paramY,
      scale: 0.25,
      gravity: 0.01,
      opacity: 0,
      side: paramSide,
      zIndex: z
    });
    if(Math.random() > 0.5 ){
      this.p.asset = "quarterStarfield.png";
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
    this.animate({scale: 0.4, opacity: 1}, 0.5, Q.Easing.Linear, {callback: function(){
      this.animate({scale: 3, opacity: 0}, 4); // Extendemos hacia fuera para dar efecto de túnel
    }});
    this.animate({angle: this.p.angle}); // Rotamos en función del side
    
    var self = this;
    setTimeout(function(){
      self.destroy(); // A los 4 segundos muere
    }, 4000);
  },
  step: function(){    
  }
});

// Clase Horizonte de sucesos
Q.Sprite.extend("EventHorizon", {
  init:function(paramX, paramY, stage, z){
    this._super({
      asset:"vortex.png",
      x: paramX,
      y: paramY,
      scale: 0.6,
      opacity: 0,
      t: 0, // Factor "tiempo"
      zIndex: z,
      created: false
    });
    this.add('animation, tween');
    this.p.sensor=true;
    this.animate({opacity: 0.5}, 2, {callback: function(){
    }}); 
    this.animate({angle: -1000}, 80); // Molaría que diese vueltas en loop
    Q.state.set('eventHorizon', this);
  },
  step: function(){
    this.p.t++;
    if(!this.p.created){
      this.stage.insert(new Q.Tunnel(this.p.x, this.p.y, "blackhole.png", 3));
      this.p.created = true;
    }
    if(this.p.t%100 == 0){ // Cada cierto tiempo creamos nuevos campos de estrellas
      this.stage.insert(new Q.QuarterStarfield(this.p.x, this.p.y + 50, "bottom", 2));
      this.stage.insert(new Q.QuarterStarfield(this.p.x, this.p.y - 50, "top", 2));
      this.stage.insert(new Q.QuarterStarfield(this.p.x + 30, this.p.y - 20, "right", 2));
      this.stage.insert(new Q.QuarterStarfield(this.p.x - 30, this.p.y - 20, "left", 2));
    }
    if(this.p.t >= 800){
      Q.state.set("dim", "2D");
      Q.state.set("minDistanceX", this.p.x - 200);
      this.animate({opacity: 0, scale: 2.5}, 2, {callback: function(){
        Q.Dialogue.play("conversacion2");
        this.destroy();
      }});
    }
  }
});

// Global Quintus variables
Q.state.set({
      nPlanet: 0, // Índice del planeta actual, cuando se incremente, creamos el planeta
      planets: { // Coordenadas, distancia de órbita, radio del planeta
        1: { x: 1540, y: 330, d: 400, r: 130, name: "Mars", g: 12}, // ( 1540 - 2x(530), 1540 + 2x())
        2: { x: 4240, y: 330, d: 450, r: 160, name: "Reddy", g: 12}, // ()
        3: { x: 8840, y: 330, d: 500, r: 210, name: "Greeny", g: 12},
        4: { x: 12340, y: 330, d: 550, r: 250, name: "Veggie", g: 12},
        5: { x: 20040, y: 330, d: 600, r: 300, name: "Bluey", g: 12},
        6: { x: 25200, y: 330, d: 400, r: 125, name: "Stormzy", g: 12},
        7: { x: 37200, y: 330, d: 700, r: 350, name: "Purply", g: 12}
      },
      debris: {
        1: {name: 'meteorite', asset:"debris1.png"},
        2: {name: 'satellite', asset:"debris2.png"},
      },
      numDebris:20,
      orbits: { // Estos datos se rellenan al crear la partida
        1: {x1: 0, x2: 0},
        2: {x1: 0, x2: 0},
        3: {x1: 0, x2: 0},
        4: {x1: 0, x2: 0},
        5: {x1: 0, x2: 0},
        6: {x1: 0, x2: 0},
        7: {x1: 0, x2: 0}
      },
      eventHorizon: undefined,
      player: {
        x: 100,
        y: 320,
        oxygen: 100,
        spaceSuit: 100
      },
      orbimeters: 150000,
      distanceToRadius: 0
});

function radar(x){
  var orbits = Q.state.get("orbits");
    
    if(x > orbits["1"].x1 && x < orbits["1"].x2){
      //console.log("En órbita de planeta 1");
      Q.state.set("nPlanet", 1);
    }
    else if(x > orbits["2"].x1 && x < orbits["2"].x2){
      //console.log("En órbita de planeta 2");
      Q.state.set("nPlanet", 2);
    }
    else if(x > orbits["wormhole"].x1 && x < orbits["wormhole"].x2){
      //console.log("En órbita de wormhole");
      Q.state.set("nPlanet", "wormhole");
    }
    else if(x > orbits["3"].x1 && x < orbits["3"].x2){
      //console.log("En órbita de planeta 3");
      Q.state.set("nPlanet", 3);
    }
    else if(x > orbits["4"].x1 && x < orbits["4"].x2){
      //console.log("En órbita de planeta 4");
      Q.state.set("nPlanet", 4);
    }
    else if(x > orbits["5"].x1 && x < orbits["5"].x2){
      //console.log("En órbita de planeta 5");
      Q.state.set("nPlanet", 5);
    }
    else if(x > orbits["6"].x1 && x < orbits["6"].x2){
      //console.log("En órbita de planeta 6");
      Q.state.set("nPlanet", 6);
    }
    else if(x > orbits["1"].x1 && x < orbits["1"].x2){
      //console.log("En órbita de planeta 7");
      Q.state.set("nPlanet", 7);
    }
    else{
      //console.log("Fuera de órbita");
      Q.state.set("nPlanet", 0);
    }
}


Q.Sprite.extend("Spaceship", {
  init:function(paramX, paramY, paramVx, paramVy, z, paramDim){
    this._super({
      sprite:"spaceship_anim",
      sheet:"spaceship",
      x: paramX,
      y: paramY,
      vx: paramVx,
      vy: paramVy,
      gravity:0,
      scale: 0.5,
      dir: "right",
      t: 0,
      m: 0,
      zIndex: z,
      dimension: paramDim
    });
    this.add('2d, animation, tween');
    this.play("right");
    
    this.on('hit.sprite', function(collision) {
      var p = Q.state.get("player");
      if(collision.obj.isA('Rocket')) {
        var life = p.spaceSuit + 20;
        if(life > 100 ) life = 100;
        var player = {
          oxygen: p.oxygen,
          spaceSuit: life
        }
        Q.state.set("player", player);
        collision.obj.destroy();
      }else{
        if(collision.obj.isA('Debris')) {
            if(collision.obj.p.dim == "3D" ){
              // Colisión o bien buena o bien mala
              if(collision.obj.p.scale <= 1.8 && collision.obj.p.scale >= 1.2){
                var life = p.spaceSuit - collision.obj.p.damage;
                if(life < 0 ) life = 0;
                var player = {
                  oxygen: p.oxygen,
                  spaceSuit: life
                }
                Q.state.set("player", player); // Dañamos la nave con el daño que haga el objeto
                console.log('d '+ collision.obj.p.damage);
                console.log('l '+ Q.state.get("player").spaceSuit);
                collision.obj.destroy();
                if(player.spaceSuit <= 0){ // Perdemos la partida si nos quedamos sin nave
                  Q.audio.play("explosion.mp3");
                  this.destroy();
                }
                console.log("Has colisionado con un objeto3D");
              }
            }
            else if(collision.obj.p.dim == "2D"){
              console.log('l '+ Q.state.get("player").spaceSuit);
              var life = p.spaceSuit - collision.obj.p.damage;
              if(life < 0 ) life = 0;
              var player = {
                oxygen: p.oxygen,
                spaceSuit: life
              }
              Q.state.set("player", player); // Dañamos la nave con el daño que haga el objeto
              console.log('d '+ collision.obj.p.damage);
              console.log('l '+ Q.state.get("player").spaceSuit);
              collision.obj.destroy();
              if(player.spaceSuit <= 0){ // Perdemos la partida si nos quedamos sin nave
                Q.audio.play("explosion.mp3");
                this.destroy();
              }
            }
        }else{
          if(collision.obj.isA('OxygenCharge')) {
            var oxy = p.oxygen + 20;
            if(oxy > 100 ) oxy = 100;
            var player = {
              oxygen: oxy,
              spaceSuit: p.spaceSuit
            }
            Q.state.set("player", player);
            this.p.oxygen += 20;
            collision.obj.destroy();
          }
        }
      }
    });
    this.p.sensor = true;
    this.p.h = 16;
    Q.input.on("up", this, function(){
      if(this.p.dimension == "2D"){
        this.play("go_" + this.p.dir);
        this.p.vy -= 80;
        if(this.p.vy < -320){
          this.p.vy = -320;
        }
      }
      else{
        this.play(this.p.dir + "_3D");
        this.p.vy = -120;
      }
    });
    Q.input.on("down", this, function(){
      if(this.p.dimension == "2D"){
        this.play("go_" + this.p.dir);
        this.p.vy += 80;
        if(this.p.vy > 320){
          this.p.vy = 320;
        }
      }
      else{
        this.play(this.p.dir + "_3D");
        this.p.vy = 120;
      }
    });
    Q.input.on("left", this, function(){
      this.p.dir = "left";
      if(this.p.dimension == "2D"){
        this.play("go_" + this.p.dir);
        this.p.vx -= 80;
        if(this.p.vx < -320){
          this.p.vx = -320;
        }
      }
      else{
        this.play(this.p.dir + "_3D");
        this.p.vx = -120;
      }
    });
    Q.input.on("right", this, function(){
      this.p.dir = "right";
      if(this.p.dimension == "2D"){
        this.play("go_" + this.p.dir);
        this.p.vx += 80;
        if(this.p.vx > 320){
          this.p.vx = 320;
        }
      }
      else{
        this.play(this.p.dir + "_3D");
        this.p.vx = 120;
      }
    });
    Q.input.on("fire", this, function(){
      var offsetX = (this.p.dir == "right" ? 25 : -25);
      Q.stage().insert(new Q.Bullet(this.p.x + offsetX, this.p.y + 5, this.p.dir , this.p.x, this.p.y));
      Q.audio.play("fireAux.mp3");
    });
    Q.input.on("S", this, function(){
      console.log("x: " + this.p.x);
      console.log("y: " + this.p.y);
    });

    Q.state.on("change", function(){
        Q.stageScene("RADAR", 1);
    });

    this.on("bump.top, bump.bottom, bump.left, bump.right", this, function(collision){
      if(collision.obj.isA("Wormhole")){
        // Primero escalar el agujero negro
          // Después crear el resto
        //this.destroy();
        this.p.zIndex = 30;
        this.animate({x: collision.obj.p.x, y: collision.obj.p.y}, 2);
        collision.obj.animate({scale: 40}, 2, Q.Easing.Quadratic.InOut, {callback: function(){
          collision.obj.destroy();
          this.stage.insert(new Q.EventHorizon(collision.obj.p.x, collision.obj.p.y, 1, 1));
          this.stage.insert(new Q.DebrisSpawner(this, "3D", this.p.x, this.p.y));
          Q.state.set("numDebris", 10);
          console.log("He pasado por aquí");
          //var spaceship = this.stage.insert(new Q.Spaceship(this.p.x, this.p.y, 0, 0, 10, "3D"));
          //this.stage.add("viewport").follow(spaceship,{ x: true, y: false });
          Q.state.set("dim", "3D"); // Cambiamos el modo de juego a 3D
         // collision.obj.animate({opacity: 0}, 1.5, {callback: function(){
          //}});
          Q.state.set("nPlanet", "0");
        }});

      }
      if(collision.obj.isA("Blackhole")){
        collision.obj.destroy();
        console.log("Has chocado con la circunferencia");
        Q.state.set("nPlanet", "0");
      }
    });

    Q.state.on("change.dim", this, function(){
      if(Q.state.get("dim") == "2D"){
        this.p.dimension = "2D";
        this.animate({scale: 0.5}, 2, Q.Easing.Quadratic.Out);
      }
      else{
        this.p.dimension = "3D";
        this.animate({scale: 1}, 2, Q.Easing.Quadratic.Out);
      }
    });
  },

  die: function(){
    this.destroy();
  },

  step: function(dt){

    //if(Q.state.get("dim") == "2D"){ // Activamos el radar cuando no esté en agujero negro
      radar(this.p.x);
    //}
    //

    if(this.p.vx != 0 && this.p.m%16*60 == 0)
        Q.state.set("orbimeters", Math.trunc(150000 - this.p.x));

    this.p.m++;
    this.p.t+= 1/(16*60); // Calculamos los segundos que han pasado
    var planets = Q.state.get("planets"); // Cogemos el objeto planetas de la variable global Q.state
    var nPlanet = Q.state.get("nPlanet"); // Cogemos el índice del planeta actual

    //console.log("nPlanet: " + nPlanet);
    //console.log("planets[nPlanet]: " + planets[nPlanet]);
    if (Q.state.get("dim") == "3D"){
      //console.log(parseInt(planets[nPlanet].x) - parseInt(planets[nPlanet].d) + ", " + parseInt(planets[nPlanet].x) + parseInt(planets[nPlanet].d) + ")");
      if(this.p.x < parseInt(planets[nPlanet].x) - parseInt(planets[nPlanet].d)/2){
        console.log("X nave: " + this.p.x);
        this.p.x = parseInt(planets[nPlanet].x) - parseInt(planets[nPlanet].d)/2;
      }
      else if(this.p.x > parseInt(planets[nPlanet].x) + parseInt(planets[nPlanet].d)/2){
        this.p.x = parseInt(planets[nPlanet].x) + parseInt(planets[nPlanet].d)/2;
        console.log("X nave: " + this.p.x);
      }
    }

    if(nPlanet != 0 && Q.state.get("dim") == "2D"){
      var d = Math.sqrt((planets[nPlanet].x - this.p.x) * (planets[nPlanet].x - this.p.x) + (planets[nPlanet].y - this.p.y) * (planets[nPlanet].y - this.p.y));
      if(this.p.m%16*60 == 0)
        Q.state.set("distanceToRadius", Math.trunc(d));
          //console.log("Distancia: " + d);
          //console.log("Distancia mínima: " + planets[nPlanet].d);

      // Si ha entrado en órbita (la distancia al planeta es menor que la distancia de órbita (planets[nPlanet].d)) y no ha llegado a la superficie (usamos el radio)
      if (d < planets[nPlanet].d && !(d > -planets[nPlanet].r && d < planets[nPlanet].r)){
            //console.log("Has entrado en el campo gravitatorio");
        // Calculamos distancias


        var dx = planets[nPlanet].x - this.p.x;
        var dy = planets[nPlanet].y - this.p.y;
        var g = planets[nPlanet].g;
        var ax = dx < 0 ? -g : g;
        var ay = dy < 0 ? -g : g;

        this.p.vx = ax*this.p.t + this.p.vx;
        this.p.vy = ay*this.p.t + this.p.vy;
      }
      else{
            //console.log("Has salido del campo gravitatorio");
      }
      // Si ha llegado a la superficie (Ha chocado con el planeta)
      if(d > -planets[nPlanet].r && d < planets[nPlanet].r && planets[nPlanet].g != 0){
        this.p.vx = 0;
        this.p.vy = 0;
        /*
        var self = this;
          if(self.x >= (planets[nPlanet].x + planets[nPlanet].r)){ // Propulsar a la derecha
            self.animate({x: self.p.x + planets[nPlanet].d/2}, 2, Q.Easing.InOut);
          }
          else{
            self.animate({x: self.p.x - planets[nPlanet].d/2}, 2, Q.Easing.InOut);
          }
          this.p.vx = 0;
          this.p.vy = 0;
          */
        // Escapar del planeta con propulsión (gasta nave)
      }
    }
    else if (nPlanet == 0){

    }  

    // Comprobamos que no se salga del mapa
    if(this.p.y < 10){
      this.p.y = 10;
    } 
    if(this.p.y > Q.height - 10){
      this.p.y = Q.height - 10;
    }

    // 
    if(this.p.x <= Q.state.get("minDistanceX")){
      this.p.x = Q.state.get("minDistanceX");
    }

    //comprobamos el tiempo para reducir la cantidad de oxígeno
    if(this.p.m%500 == 0){
      var player = Q.state.get('player');
      player.oxygen -= 1;
      Q.state.set('player', player);
      if(player.oxygen == 0){
        this.destroy();
      }
    }
  }

});

Q.Sprite.extend("Bullet", {
  init:function(paramX, paramY, paramDir, paramOrgX, paramOrgY){
    this._super({
      asset: "bullet.png",
      x: paramX,
      y: paramY,
      vx: 800,
      vy: 0,
      dir: paramDir,
      orgX: paramOrgX,
      orgY: paramOrgY,
      scale: 1
    });
    this.add('animation, tween');
    this.p.sensor=true;
    this.on('hit.sprite', function(collision) {
      if(collision.obj.isA('Debris')) {
        collision.obj.trigger('bullet.hit', {'bullet': this, 'col': collision});
        this.destroy();
        console.log("Bala ha chocado con debris");
      }
    });
    if(Q.state.get("dim") == "3D"){
       var evH = Q.state.get('eventHorizon');
      this.animate({x: evH.p.x, y: evH.p.y, scale: 0}, 1, {callback: function(){
        this.destroy();
      }});
    }
  },
  step: function(dt){
    if(Q.state.get('dim')== '2D'){
      if(this.p.dir == 'right'){
       this.p.x += dt*this.p.vx;
      }else{
        this.p.x -= dt*this.p.vx;
      }
      if(this.p.y < 0 || this.p.y>screen.height){
        this.destroy();
      }
    }/*else{
      var evH = Q.state.get('eventHorizon');
      // Si se sale de la pantalla o si llega al medio
      if(this.p.y < 0 || this.p.y>screen.height || (this.p.x == evH.p.x && this.p.y == evH.p.y)){
        this.destroy();
      }else{
        if(this.p.dir == 'right'){
          this.p.x += dt*this.p.vx;
          if(evH.p.x >= this.p.orgX){
            this.p.vy = this.p.vx;
            if(evH.p.y >= this.p.orgY){
              this.p.y += dt*this.p.vy;
            }else{
              this.p.y -= dt*this.p.vy;
            }
          }
          this.p.x += dt*this.p.vx;
        }else{
          this.p.x -= dt*this.p.vx;
          if(evH.p.x <= this.p.orgX){
            this.p.vy = this.p.vx;
            if(evH.p.y >= this.p.orgY){
              this.p.y += dt*this.p.vy;
            }else{
              this.p.y -= dt*this.p.vy;
            }
          }
        }
      }
    }*/
  }
});

Q.Sprite.extend("Rocket",{
  init: function(paramX, paramY){
    this._super({
      asset: 'rocket.png',
      x: paramX,
      y: paramY,
      vx: 0,
      vy: 0,
      name: 'rocket',
      scale: 0.2,
      gravity: 0
    });
    this.add('2d, animation, tween');
    this.animate({angle: -3000}, 80);
    this.p.sensor=true;
  },
  step: function(dt){
  }
});

Q.Sprite.extend("OxygenCharge",{
  init: function(paramX, paramY){
    this._super({
      asset: 'oxygen.png',
      x: paramX,
      y: paramY,
      vx: 0,
      vy: 0,
      name: 'oxygenCharge',
      scale: 0.2,
      gravity: 0
    });
    this.add('2d, animation, tween');
    this.animate({angle: -3000}, 80);
    this.p.sensor=true;
  },
  step: function(dt){
  }
});

// Clase que representa el objeto Debris (corresponde a la basura espacial)
Q.Sprite.extend("Debris", {
  init:function(paramX, paramY, paramVx, paramVy, paramName, paramAsset, paramScale, paramDamage, z, paramDim){
    this._super({
      asset:paramAsset,
      x: paramX,
      y: paramY,
      vx: paramVx,
      vy: paramVy,
      scale: paramScale,
      name: paramName,
      damage: paramDamage,
      opacity: 0,
      gravity: 0,
      t: 0, // Factor "tiempo"
      zIndex: z,
      dim: paramDim
    });
    this.add('2d,animation, tween');
    this.on('bullet.hit', this, 'hitBullet');
    this.p.sensor=true;
    if(this.p.dim == "3D"){ // Agregamos un efecto 3D
      this.animate({scale: this.p.scale * 5}, 5, Q.Easing.Linear, {callback: function(){
        this.animate({scale: 3, opacity: 0}, 4, Q.Easing.Linear, {callback: function(){
          this.destroy();
        }});
      }});
    }
    this.animate({opacity: 1}, 2); 
    this.animate({angle: -3000}, 80); // Molaría que diese vueltas en loop
  },
  step: function(dt){
    this.p.x += dt* this.p.vx;
    this.p.y += dt* this.p.vy;
    if(this.p.scale >= 1.25){
      this.p.zIndex = 15;
    }
    if(this.p.y < 0 || this.p.y>screen.height){
      this.destroy();
    }
  },
  hitBullet: function(){
    var posX = this.p.x; 
    var posY = this.p.y; 
    if(this.p.name == "meteorite"){
      if(this.p.scale != 0.2){
        //VELOCIDADES 1
        var dirX1 = Math.round(Math.random());
        if(dirX1 == 0){
          dirX1 = -1;
        }else{
          dirX1 = 1;
        }
        var velX1 = Math.round(Math.random()* 40)*dirX1; // velocidad en el eje x siempre negativa para que vaya a la izda.
        var dirY1 = 1;
        if(posY > (screen.height/2)){ //si la posY es mayor que la mitad de la pantalla va hacia arriba en caso contario hacia abajo
          dirY1 = -1;
        }
        var velY1 = Math.round(Math.random()* 40)* dirY1;

        //VELOCIDADES 2
        var dirX2 = Math.round(Math.random());
        if(dirX2 == 0){
          dirX2 = -1;
        }else{
          dirX2 = 1;
        }
        var velX2 = Math.round(Math.random()* 40)*dirX2; // velocidad en el eje x siempre negativa para que vaya a la izda.
        var dirY2 = 1;
        if(posY > (screen.height/2)){ //si la posY es mayor que la mitad de la pantalla va hacia arriba en caso contario hacia abajo
          dirY2 = -1;
        }
        var velY2 = Math.round(Math.random()* 40)* dirY2;
        if(this.p.scale == 1){

          Q.stage().insert(new Q.Debris(posX, posY, velX1, velY1, this.p.name, this.p.asset, 0.5, 10, 4, this.p.dim));
          Q.stage().insert(new Q.Debris(posX, posY, velX2, velY2, this.p.name, this.p.asset, 0.5, 10, 4, this.p.dim));
        }else{
          Q.stage().insert(new Q.Debris(posX, posY, velX1, velY1, this.p.name, this.p.asset, 0.2, 5, 4, this.p.dim));
          Q.stage().insert(new Q.Debris(posX, posY, velX2, velY2, this.p.name, this.p.asset, 0.2, 5, 4, this.p.dim));
        }
      }
    }else{
      var dirX = Math.round(Math.random());
      if(dirX == 0){
        dirX = -1;
      }else{
        dirX = 1;
      }
      var velX = Math.round(Math.random()* 40)*dirX1; // velocidad en el eje x siempre negativa para que vaya a la izda.
      var dirY = 1;
      if(posY > (screen.height/2)){ //si la posY es mayor que la mitad de la pantalla va hacia arriba en caso contario hacia abajo
        dirY = -1;
      }
      var velY = Math.round(Math.random()* 40)* dirY;
      var rand = Math.round(Math.random());
      if(rand == 0){
        Q.stage().insert(new Q.Rocket(posX, posY, velX, velY));
      }else{
        Q.stage().insert(new Q.OxygenCharge(posX, posY, velX, velY));
      }
    }
    this.destroy();
  }, 

});

// Clase que va introducionde objetos Debris de forma aleatoria
Q.Sprite.extend("DebrisSpawner", {
  init:function( player, paramDim, paramX, paramY){
    this._super({
      play: player,
      cont: 0,
      t: 0,
      dim: paramDim,
      x: paramX,
      y: paramY
    });
    console.log("Spawner");
  },
  step: function(dt){
    this.p.t++;
    if(this.p.dim != Q.state.get("dim")){ // En cuanto cambie la dimensión, lo eliminamos
      this.destroy();
    }
    var nDebris = Q.state.get('numDebris');
    if(this.p.t%100 == 0 && this.p.cont < nDebris && (Q.state.get('nPlanet') == 0 || Q.state.get("nPlanet") == "wormhole")){ // Cada cierto tiempo creamos nuevos campos de estrellas
      var num = Math.round(Math.random()); //si num es igual a 0 inserta un objeto debris
      if(num == 0){
        //POSICIONAMIENTO
        var scale = 1;
        if(this.p.dim == "2D"){
          var playX = this.p.play.p.x;  //posicion del jugador en el eje x
          var posX = Math.random()* ((playX+800) - (playX+200)) + (playX+200); //posicion del debris en el eje x entre [playX+200,playX+800]
          var posY = Math.random()* screen.height;  //posicion del debris en el eje y entre [0,altura de la pantalla]
          //VELOCIDADES
          var velX = Math.round(Math.random()* 40)*(-1); // velocidad en el eje x siempre negativa para que vaya a la izda.
          var dir = 1;
          if(posY > (screen.height/2)){ //si la posY es mayor que la mitad de la pantalla va hacia arriba en caso contario hacia abajo
            dir = -1;
          }
          var velY = Math.round(Math.random()* 40)* dir;

        }
        else if(this.p.dim == "3D"){
          var playX = this.p.play.p.x;  //posicion del jugador en el eje x
          var posX = this.p.x;
          var posY = this.p.y;
          //VELOCIDADES
          var velX = Math.round(Math.random()* 40)*(-1); // velocidad en el eje x siempre negativa para que vaya a la izda.
          var dir = 1;
          if(posY > (screen.height/2)){ //si la posY es mayor que la mitad de la pantalla va hacia arriba en caso contario hacia abajo
            dir = -1;
          }
          var velY = Math.round(Math.random()* 40)* dir;
          scale = 0.25;
        }
        //ASSETS
        var debrisNum = Math.round(Math.random()* (2 - 1) + 1);
        var debrisObj = Q.state.get('debris')[debrisNum];
        this.p.cont++;

        Q.stage().insert(new Q.Debris(posX, posY, velX, velY,debrisObj.name , debrisObj.asset, scale, debrisObj.damage, 4, this.p.dim));
      }
    }
  }
});

Q.component("defaultEnemy",{
  added:function(){
    this.entity.on("bump.left, bump.right, bump.bottom",function(collision) {
        if(collision.obj.isA("Mario") || collision.obj.isA("Prost")) {
            collision.obj.die();
        }
        if(collision.obj.isA("Spaceship")){
          this.destroy();
        }
    });
  }
});

Q.scene("RADAR", function(stage){

  var n = Q.state.get("nPlanet");

  if(n != 0){

    var planets = Q.state.get("planets");
    var distanceToRadius = Q.state.get("distanceToRadius");
    var planet = planets[n];

    var planetName = planet.name;
    var planetRadius = planet.r;
    var planetOrbit = planet.d;
    var planetGravity = planet.g;

    var textName = new Q.UI.Text({family: "ethnocentric",x: Q.width - 30, y: 40, label: "Planet: " + planetName, color: "#FFDA6C", outlineWidth: 3, size: 14, align: "right"});
    var textRadius = new Q.UI.Text({family: "ethnocentric",x: Q.width - 30, y: 60, label: "Radius: " + planetRadius, color: "#FFDA6C", outlineWidth: 3, size: 14, align: "right"});

    var textDistanceRadius = new Q.UI.Text({family: "ethnocentric",x: Q.width/2, y: 40, label: "Distance to core: " + distanceToRadius, color: "#FFDA6C", outlineWidth: 3, size: 14, align: "center"});
    var textOrbit = new Q.UI.Text({family: "ethnocentric",x: Q.width/2, y: 60, label: "Orbit: " + planetOrbit, color: "#FFDA6C", outlineWidth: 3, size: 14, align: "center"});
    var textGravity = new Q.UI.Text({family: "ethnocentric",x: Q.width/2, y: 80, label: "Gravity: " + planetGravity, color: "#FFDA6C", outlineWidth: 3, size: 14, align: "center"});

    stage.insert(textName);
    stage.insert(textRadius);
    stage.insert(textDistanceRadius);
    stage.insert(textOrbit);
    stage.insert(textGravity);
  }
});

Q.scene("HUD", function(stage){

  var orbimeters = Q.state.get("orbimeters");
  var textOrbimeters = new Q.UI.Text({family: "ethnocentric", x: Q.width - 30, y: 10, label: "Orbimeters to Station: " + orbimeters, color: "#FFDA6C", outlineWidth: 3, size: 14, align: "right"});
  stage.insert(textOrbimeters);

  // Datos de la nave
  var player = Q.state.get("player");
  var oxygen = player["oxygen"];
  var textOxygen = new Q.UI.Text({family: "ethnocentric", x: 30, y: 40, label: "Oxygen: " + oxygen + "%", color: "#FFDA6C", outlineWidth: 3, size: 14, align: "left"});
  stage.insert(textOxygen);

  var ship = player["spaceSuit"];
  var textShip = new Q.UI.Text({family: "ethnocentric", x: 30, y: 60, label: "Ship: " + ship + "%", color: "#FFDA6C", outlineWidth: 3, size: 14, align: "left"});
  stage.insert(textShip);

  Q.state.on("change", function(){
    var p = Q.state.get("player");
    var orbimeters = Q.state.get("orbimeters");
    textOrbimeters.p.label = "Orbimeters to Station: " + orbimeters;
    textOxygen.p.label = "Oxygen: " + p.oxygen + "%";
    textShip.p.label = "Ship: " + p.spaceSuit + "%";
  });

});
/*
Q.scene("HUD",function(stage) {


  // Contador descendente del poder del martillo
  var SpaceshipSecs = Q.state.get("Spaceship");
  var remainingSecs = new Q.UI.Text({x: Q.width/2, y: 90, label: SpaceshipSecs, color: "#707070", outlineWidth: 3});
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


Q.load(["space_station1.png", "space_station2.png", "space_station3.png", "explosion.json","explosion.png", "Starship_Pilot.png", "Space_Captain.png", "Space_Commander.png", "fireAux.mp3","explosion.mp3", "interstellar.mp3", "spaceship.png", "spaceship.json", "1.png","2.png", "3.png","4.png","5.png","6.png","7.png",
  "8.png","blackhole.png", "quarterStarfield.png", 
  "quarterStarfield2.png", "vortex.png", "wormhole.png", 
  "interiorCircularInfluence.png", "exteriorCircularInfluence.png", 
  "galaxy.png", "Spaceship.png", "Spaceship.json", "thunder.png", 
  "thunder.json", "prost_small.png", "prost.json", "mainTitle.png",
  "princess.png","coin.png","coin.json","mario_small.png", 
  "mario_small.json", "goomba.png", "goomba.json", "bloopa.png", 
  "bloopa.json", "bgProst.png", "fondo.png", "debris1.png", "debris2.png",  "bgHammer.png", "bullet.png", "rocket.png", "oxygen.png"], function(){
        Q.compileSheets("prost_small.png", "prost.json");
        Q.compileSheets("Spaceship.png", "Spaceship.json");
        Q.compileSheets("thunder.png", "thunder.json");
        Q.compileSheets("mario_small.png", "mario_small.json");
        Q.compileSheets("goomba.png", "goomba.json");
        Q.compileSheets("bloopa.png", "bloopa.json");
        Q.compileSheets("coin.png", "coin.json");
        Q.compileSheets("spaceship.png", "spaceship.json");
        Q.compileSheets("explosion.png", "explosion.json");

    //Q.audio.play('interstellar.mp3',{ loop: true });
    Q.stageScene("menu");
    
    //Q.debug = true;
});


Q.scene("level1",function(stage) {
      stage.insert(new Q.Repeater({ asset: "bgProst.png", speedX: 0.2, speedY: 0.2, type: 0 }));
      
      //var wormhole=stage.insert(new Q.Wormhole(550, 320, "wormhole.png"));
      //var blackhole=stage.insert(new Q.Blackhole(150, 320, "interiorCircularInfluence.png", 1));
      //var vortex=stage.insert(new Q.EventHorizon(850, 320));
      createPlanets(stage);
      var Spaceship = stage.insert(new Q.Spaceship(200, 520, 20, 0, 10, "2D"));
      var spawner = stage.insert(new Q.DebrisSpawner(Spaceship, "2D"));
      stage.add("viewport").follow(Spaceship,{ x: true, y: false });
});

Q.scene("Intro",function(stage) {
     
  
  setTimeout(function(){
      Q.Dialogue.play("conversacion1");
  }, 2000);
  
  var s1, s2, s3;

  setTimeout(function(){
      stage.insert(new Q.Explosion(Q.width/3+50, Q.height/3+20, 0.5, "explode"));
      s2.animate({angle: 60, y: s1.p.y - 100, x: s1.p.x + 120}, 40);
  }, 14000);
  setTimeout(function(){
      stage.insert(new Q.Explosion(Q.width/2+20, Q.height/3+10, 0.3, "explode"));
      
  }, 15000);
  setTimeout(function(){
      stage.insert(new Q.Explosion(Q.width/2, Q.height/2, 0.8, "explode"));
      s1.animate({angle: -20, y: s1.p.y - 100, x: s1.p.x + 120}, 40);
      s3.animate({angle: 40, y: s1.p.y - 100, x: s1.p.x - 120}, 40);
  }, 16000);

  setTimeout(function(){
      s1.animate({opacity: 0}, 2);
      s2.animate({opacity: 0}, 2);
      s3.animate({opacity: 0}, 2);
  }, 50000);

  setTimeout(function(){
      Q.clearStages();

    Q.state.reset({
      dim: "2D",
      nPlanet: 0, // Índice del planeta detectado por el radar
      planets: { // Coordenadas, distancia de órbita, radio del planeta
        0: {},
        1: { x: 1540, y: 330, d: 400, r: 130, name: "Fiery", g: 9.8},
        2: { x: 4240, y: 330, d: 450, r: 160, name: "Reddy", g: 6},
        wormhole : { x: 6240, y: 330, d: 850, r: 10, name: "Gargantua", g: 0},
        3: { x: 8840, y: 330, d: 500, r: 210, name: "Greeny", g: 4},
        4: { x: 12340, y: 330, d: 250, r: 250, name: "Veggie", g: 8},
        5: { x: 20040, y: 530, d: 600, r: 300, name: "Bluey", g: 2},
        6: { x: 25200, y: 230, d: 400, r: 125, name: "Stormzy", g: 10},
        7: { x: 37200, y: 30, d: 700, r: 350, name: "Purply", g: 12}
      },
      debris: {
        1: {name: 'meteorite', asset:"debris1.png", damage: 30},
        2: {name: 'satellite', asset:"debris2.png", damage: 50}
      },
      numDebris: 4,
      orbits: { // Estos datos se rellenan al crear la partida
        1: {x1: 0, x2: 0},
        2: {x1: 0, x2: 0},
        3: {x1: 0, x2: 0},
        4: {x1: 0, x2: 0},
        5: {x1: 0, x2: 0},
        6: {x1: 0, x2: 0},
        7: {x1: 0, x2: 0},
        wormhole: {x1: 0, x2: 0}
      },
      eventHorizon: undefined,
      player: {
        oxygen: 100,
        spaceSuit: 100
      },
      orbimeters: 150000,
      distanceToRadius: 0,
      minDistanceX: 0
    });
  
    Q.stageScene('level1', 0);
    //Q.stageScene('playerScene', 3);
    //Q.audio.play("interstellar.mp3", {loop: true});
    Q.stageScene('HUD', 2);
    Q.stageScene('RADAR', 3);
  }, 52000);

  var button = stage.insert(new Q.UI.Button({x: screen.width/2, y: screen.height/2,fill: "#CCCCCC", w: screen.width, h: screen.height, asset: "bgProst.png"}));
  
  var s2 = stage.insert(new Q.Station(Q.width/2, Q.height/2, "space_station2.png"));
  var s1 = stage.insert(new Q.Station(Q.width/2, Q.height/2, "space_station1.png"));
  var s3 = stage.insert(new Q.Station(Q.width/2, Q.height/2, "space_station3.png"));
  
  button.on("click",function() {
    Q.clearStages();

    Q.state.reset({
      dim: "2D",
      nPlanet: 0, // Índice del planeta detectado por el radar
      planets: { // Coordenadas, distancia de órbita, radio del planeta
        0: {},
        1: { x: 1540, y: 330, d: 400, r: 130, name: "Fiery", g: 9.8},
        2: { x: 4240, y: 330, d: 450, r: 160, name: "Reddy", g: 6},
        wormhole : { x: 6240, y: 330, d: 850, r: 10, name: "Gargantua", g: 0},
        3: { x: 8840, y: 330, d: 500, r: 210, name: "Greeny", g: 4},
        4: { x: 12340, y: 330, d: 250, r: 250, name: "Veggie", g: 8},
        5: { x: 20040, y: 530, d: 600, r: 300, name: "Bluey", g: 2},
        6: { x: 25200, y: 230, d: 400, r: 125, name: "Stormzy", g: 10},
        7: { x: 37200, y: 30, d: 700, r: 350, name: "Purply", g: 12}
      },
      debris: {
        1: {name: 'meteorite', asset:"debris1.png", damage: 30},
        2: {name: 'satellite', asset:"debris2.png", damage: 50}
      },
      numDebris: 4,
      orbits: { // Estos datos se rellenan al crear la partida
        1: {x1: 0, x2: 0},
        2: {x1: 0, x2: 0},
        3: {x1: 0, x2: 0},
        4: {x1: 0, x2: 0},
        5: {x1: 0, x2: 0},
        6: {x1: 0, x2: 0},
        7: {x1: 0, x2: 0},
        wormhole: {x1: 0, x2: 0}
      },
      eventHorizon: undefined,
      player: {
        oxygen: 100,
        spaceSuit: 100
      },
      orbimeters: 150000,
      distanceToRadius: 0,
      minDistanceX: 0
    });
  
    Q.stageScene('level1', 0);
    //Q.stageScene('playerScene', 3);
    //Q.audio.play("interstellar.mp3", {loop: true});
    Q.stageScene('HUD', 2);
    Q.stageScene('RADAR', 3);

  });
});
/*
Q.loadTMX("levelProst.tmx", function() {
    //Q.stageScene("level1");
    Q.stageScene("menu");
    //Q.debug = true;
});
*/
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
    //Q.state.reset({score: 0, Spaceship: " ", game: "playing", lifePoints: 5, hint: "Hint: find the power of the Gods"});
    //Q.audio.play('music_main.mp3',{ loop: true });
    Q.stageScene('level1', 0);
    //Q.stageScene('playerScene', 3);
    //Q.audio.play("interstellar.mp3", {loop: true});
    Q.stageScene('HUD', 2);
    Q.stageScene('RADAR', 3);
  });


  container.fit(20);
});


Q.scene('menu',function(stage) {
  var button = stage.insert(new Q.UI.Button({x: screen.width/2 - 100, y: screen.height/2,fill: "#CCCCCC", w: screen.width, h: screen.height, asset:"fondo.png" }));

  button.on("click",function() {
    Q.stageScene('Intro', 0);
  });

});
}
