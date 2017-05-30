var quintusDialogue = function(Quintus) {
    "use strict";

    Quintus.Dialogue = function(Q) {

        if (Q._isUndefined(Quintus.Sprites)) {
            throw 'Quintus.Dialogue requires Quintus.Sprite Module';
        }
      
        if (Q._isUndefined(Quintus.UI)) {
            throw 'Quintus.Dialogue requires Quintus.UI Module';
        }  

        Q.Dialogue = {};

        //////////////////////////
        // Config of the dialog //
        //////////////////////////
        Q.Dialogue.SCENE_INDEX = 100; // Index of the scene that dialogue creates
        // !important: It must be bigger than all the
        // indexes of the other scenes or it will not
        // be shown
        Q.Dialogue.COLOR = "rgba(0,0,0,0.5)"; // Background color of the boxes
        Q.Dialogue.SHADOW = true; // true or false
        Q.Dialogue.SHADOWCOLOR = "grey"; // only applies if SHADOW is true
        Q.Dialogue.BORDER = "4"; // (Number) width of the border (0 = no border)
        Q.Dialogue.BORDERCOLOR = "white"; // Color of the border of the boxes
        Q.Dialogue.TEXTCOLOR = "#ffd54e"; // Color of the text
        Q.Dialogue.TEXTSIZE = 18; // Size of the text
        Q.Dialogue.FAMILYTEXT = "ethnocentric"; // Text family
        Q.Dialogue.CHARACTER_DIR = "characters";

        Q.Sprite.extend('Character', {
            init: function(p) {
                this._super(p, {
                    x: Q.width * 1 / 8,
                    y: Q.height * 9 / 16 + 16,
                    w: Q.width * 1 / 4 - 28,
                    h: Q.height * 1 / 4,
                    lastScaleX: 1,
                    lastScaleY: 1
                });
                var obj = this;
                Q.state.on("change.image", function() {
                    obj.matrix.scale(1 / obj.p.lastScaleX, 1 / obj.p.lastScaleY);
                    obj.p.asset = Q.state.get('image');
                    obj.size(true);
                    obj.p.lastScaleX = 1 / (obj.p.w / (Q.width * 1 / 4 - 28));
                    obj.p.lastScaleY = 1 / (obj.p.h / (Q.height * 1 / 4));
                    obj.matrix.scale(obj.p.lastScaleX, obj.p.lastScaleY);
                });
            }
        });

        /**
         * Play the dialog with the name given using the rate
         * @param  {string} dialogueName
         * @param  {Number} rate
         */
        Q.Dialogue.play = function(dialogueName, rate) {

            // Checking if dialogueName exists in the dialogue object
            if (!dialogue.hasOwnProperty(dialogueName)) {
                throw 'Quintus.Dialogue could not found the ' + dialogue + ' dialogue';
            }

            // Load the array of conversation
            const conversation = dialogue[dialogueName];

            createScene(dialogueName);
            displayConversation(conversation, rate);
        }

        /**
         * Creates the scene with the name: dialogue[param]
         * @param  {string} dialogueName
         */
        function createScene(dialogueName) {
            Q.scene('dialogue' + dialogueName, function(stage) {
                setupImageBox(stage);
                setupDialogueBox(stage);
                setupNameBox(stage);
            });

            Q.stageScene('dialogue' + dialogueName, Q.Dialogue.SCENE_INDEX);
        }


        ////////////////////////////
        // CreateScene submethods //
        ////////////////////////////
        function setupDialogueBox(stage) {
            var container = stage.insert(new Q.UI.Container({
                x: Q.width * 3 / 6,
                y: Q.height * 7 / 8,
                w: Q.width - 28,
                h: Q.height * 1 / 4 - 18,
                border: Q.Dialogue.BORDER,
                stroke: Q.Dialogue.BORDERCOLOR,
                shadow: Q.Dialogue.SHADOW,
                shadowColor: Q.Dialogue.SHADOWCOLOR,
                fill: Q.Dialogue.COLOR
            }));

            var text = container.insert(new Q.UI.Text({
                x: -container.p.w / 2 + 28,
                y: -container.p.h / 2 + 18,
                align: 'left',
                label: "",
                family: Q.Dialogue.FAMILYTEXT,
                size: Q.Dialogue.TEXTSIZE,
                color: Q.Dialogue.TEXTCOLOR
            }));

            Q.state.on("change.dialogue", function() {
                text.p.label = Q.state.get("dialogue");
            });
        }

        // Setup the box with the name of the character which is speaking
        function setupNameBox(stage) {
            var container = stage.insert(new Q.UI.Container({
                x: Q.width * 1 / 8,
                y: Q.height * 11 / 16 + 32,
                w: Q.width * 1 / 4 - 28,
                h: Q.height * 1 / 16,
                border: Q.Dialogue.BORDER,
                stroke: Q.Dialogue.BORDERCOLOR,
                shadow: Q.Dialogue.SHADOW,
                shadowColor: Q.Dialogue.SHADOWCOLOR,
                fill: Q.Dialogue.COLOR
            }));

            var name = container.insert(new Q.UI.Text({
                x: 0,
                y: -16,
                label: "",
                family: Q.Dialogue.FAMILYTEXT,
                size: Q.Dialogue.TEXTSIZE,
                color: Q.Dialogue.TEXTCOLOR
            }));


            Q.state.on("change.name", function() {
                name.p.label = Q.state.get("name");
            });
        }

        function setupImageBox(stage) {
            stage.insert(new Q.Character());
        }

        ///////////////////////////

        /**
         * Display conversation simulating writing machine
         * (recursive function)
         * @param  {Array} conversation conversation to show
         * @param  {Number} textIndex   text to display
         * @param  {Number} rate
         */
        function displayConversation(conversation, rate, textIndex) {

            textIndex = textIndex || 0;
            rate = rate || 50;


            if (!conversation[textIndex]) {
                clearConversation();
                return;
            }

            const text = conversation[textIndex].text || "...";
            const textLength = text.length;
            let currentMsg = "";
            let charCounter = 0;
            let name = conversation[textIndex].name || 'Unknown';
            let image = conversation[textIndex].sprite;
            Q.state.set("name", name);
            Q.state.set("image", image);

            const interval = setInterval(function() {
                const nextChar = text.charAt(charCounter);
                charCounter++;
                currentMsg = currentMsg.concat(nextChar);
                Q.state.set("dialogue", currentMsg);
                if (charCounter >= textLength) {
                    clearInterval(interval);
                    setTimeout(
                        function() {
                            displayConversation(conversation, rate, ++textIndex);
                        },
                        2000);
                }

            }, rate);
        }

        // Delete the dialog scene
        function clearConversation() {
            Q.clearStage(Q.Dialogue.SCENE_INDEX);
            Q.state.set("dialogue", "");
            Q.state.set("name", "");
            Q.state.set("image", "");
        }

    }
}

////////////////////////////////////////////////////
// Fill this object with your games conversations //
////////////////////////////////////////////////////

const dialogue = {
    conversacion1: [{
        name: "Capitán AJ4",
        sprite: "Space_Captain.png",
        text: "Buenos días General Newton. ¿Qué tal el día en Beta47?"
    }, {
        name: "General Newton",
        sprite: "Space_Commander.png",
        text: "Aquí Beta47. Le habla el General Newton."
    }, {
        name: "Capitán AJ4",
        sprite: "Space_Captain.png"
    }, {
        name: "Capitán AJ4",
        sprite: "Space_Captain.png",
        text: "Informe de la misión Onyxia017-.\n¿General Newton?"
    }, {
        name: "Capitán AJ4",
        sprite: "Space_Captain.png"
    }, {
        name: "Capitán AJ4",
        sprite: "Space_Captain.png",
        text: "¿General Newton?"
    }, {
        name: "Beta47",
        sprite: "Starship_Pilot.png",
        text: "Aquí Piloto Hawkins.\nVeo una explosión en el Satélite de Comunicaciones Interestelares. \nParece que tenemos una misión Capitán..."
    },{
        name: "Capitán AJ4",
        sprite: "Space_Captain.png",
        text: "Mensaje a la tripulación: \n\nAquí Capitán AJ4.\nLes informo de que ha habido una terrible explosión en la estación de ondas interestelares."
    }, {
        name: "Capitán AJ4",
        sprite: "Space_Captain.png",
        text: "Hemos perdido el contacto con la Estación Beta47.\nLa nave se ve obligada a realizar un viaje de vuelta. \nVolvemos a casa."
    }],

    conversacion2: [{
        name: "Capitán AJ4",
        sprite: "Space_Captain.png",
        text: "Aquí Capitán AJ4 ..... ¿Me reciben?\nHemos sufrido una explosión en los propulsores de la nave, \nlos mandos de Onyxia estan dañados\n¿Me reciben? Necesitamos ayuda"
    }, {
        sprite: "2.png",
        text: "Beta47 le recibe capitán"
    }, {
        name: "Beta47",
        sprite: "1.png"
    }, {
        name: "Capitán AJ4",
        sprite: "2.png",
        text: "Beta47, la señal no es clara, si nos recibe, vaya a buscar ayuda a la estación base. Cambio y corto"
    }, {
        name: "Beta47",
        sprite: "1.png",
        text: "Parece que tenemos una misión comandante..."
    }]
};

if (typeof Quintus === 'undefined') {
    module.exports = quintusDialogue;
} else {
    quintusDialogue(Quintus);
}
