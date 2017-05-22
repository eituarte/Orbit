var quintusDialogue = function(Quintus) {
    "use strict";

    Quintus.Dialogue = function(Q) {

        if (Q._isUndefined(Quintus.UI)) {
            throw 'Quintus.Dialogue requires Quintus.UI Module';
        }

        Q.Dialogue = {};

        /**
         Creates a Text-UI element.

         Options for `p` are very similar to the ones for Q.Sprite.

           * label        - text to display
           * weight       - weight of the text [800]
           * size         - size of the text in px [24]
           * family       - font family [Arial]
           * color        - color of the text [black]
           * outline      - outline color of the text [black]
           * outlineWidth - thickness of the outline [0]
           * lineHeight   - distance between the base lines of each line of text expressed in em [1.2]

         @class Q.UI.Text
         @extends Q.Sprite
         @for Q.UI
         @param {Object} p - as described above
         */
        Q.Dialogue.Text = Q.Sprite.extend("Dialog.Text", {
            init: function(p, defaultProps) {
                this._super(Q._defaults(p || {}, defaultProps), {
                    type: Q.SPRITE_DIALOG,
                    size: 24,
                    lineHeight: 1.2,
                });

                if (this.p.label) {
                    this.calcSize();
                }
            },

            calcSize: function() {
                var p = this.p;

                this.setFont(Q.ctx);
                this.splitLabel = p.label.split("\n");
                var maxLabel = "";
                p.w = 0;

                for (var i = 0; i < this.splitLabel.length; i++) {
                    var metrics = Q.ctx.measureText(this.splitLabel[i]);
                    if (metrics.width > p.w) {
                        p.w = metrics.width;
                    }
                }


                p.lineHeightPx = p.size * p.lineHeight;
                p.h = p.lineHeightPx * this.splitLabel.length;
                p.halfLeading = 0.5 * p.size * Math.max(0, p.lineHeight - 1);

            },

            // *** Ignorar, no se usa
            prerender: function() {
                if (this.p.oldLabel === this.p.label) {
                    return;
                }
                this.p.oldLabel = this.p.label;
                this.calcSize();
                this.el.width = this.p.w;
                this.el.height = this.p.h * 4;
                this.ctx.clearRect(0, 0, this.p.w, this.p.h);

                this.ctx.fillStyle = "#FF0";
                this.ctx.fillRect(0, 0, this.p.w, this.p.h / 2);
                this.setFont(this.ctx);

                this.ctx.fillText(this.p.label, 0, 0);
            },

            draw: function(ctx) {
                var p = this.p;
                if (p.opacity === 0) {
                    return;
                }

                if (p.oldLabel !== p.label) {
                    this.calcSize();
                }

                this.setFont(ctx);
                if (p.opacity !== void 0) {
                    ctx.globalAlpha = p.opacity;
                }
                for (var i = 0; i < this.splitLabel.length; i++) {
                    if (p.outlineWidth) {
                        ctx.strokeText(this.splitLabel[i], 0, p.halfLeading + i * p.lineHeightPx);
                    }
                    ctx.fillText(this.splitLabel[i], 0, p.halfLeading + i * p.lineHeightPx);
                }
            },

            /**
             Returns the asset of the element

             @method asset
             @for Q.Dialogue.Text
            */
            asset: function() {
                return this.el;
            },

            /**
             Sets the textfont using parameters of `p`.
             Defaults: see Class description!

             @method setFont
             @for Q.Dialogue.Text
            */
            setFont: function(ctx) {
                ctx.textBaseline = "top";
                ctx.font = this.font();
                ctx.fillStyle = this.p.color || "black";
                ctx.textAlign = this.p.align || "left";
                ctx.strokeStyle = this.p.outlineColor || "black";
                ctx.lineWidth = this.p.outlineWidth || 0;
            },

            font: function() {
                if (this.fontString) {
                    return this.fontString;
                }

                this.fontString = (this.p.weight || "800") + " " +
                    (this.p.size || 24) + "px " +
                    (this.p.family || "Arial");

                return this.fontString;
            }
        });


        /**
         * Play the dialog with the name given using the rate 
         * @param  {string} dialogueName 
         * @param  {Number} rate         
         */
        Q.Dialogue.play = function(dialogueName, rate) {
            console.log(dialogueName);

            // Checking if dialogueName exists in the dialogue object
            if (!dialogue.hasOwnProperty(dialogueName)) {
                throw 'Quintus.Dialogue could not found the ' + dialogue + ' dialogue';
            }

            // Load the array of conversation
            const conversation = dialogue[dialogueName];

            createScene(dialogueName);
            displayConversation(conversation, 0, 100);
        }

        function createScene(dialogueName) {
            Q.scene('dialogue' + dialogueName, function(stage) {
                var container = stage.insert(new Q.UI.Container({
                    x: Q.width * 3 / 6,
                    y: Q.height * 7 / 8,
                    w: Q.width - 28,
                    h: Q.height * 1 / 4 - 18,
                    border: "8",
                    stroke: "#02516E",
                    shadow: true,
                    shadowColor: "#03688E",
                    fill: "#0491C7"
                }));

                var text = container.insert(new Q.Dialogue.Text({
                    label: ""
                }));

                Q.state.on("change", function() {
                    text.destroy();

                    text = container.insert(new Q.Dialogue.Text({
                        label: Q.state.get("dialogueText")
                    }));
                });

            });

            Q.stageScene('dialogue' + dialogueName, 100);
        }

        /**
         * Show conversation character per character
         * @param {Array} conversation 
         */
        /**
         * Display conversation simulating writing machine
         * (recursive function)
         * @param  {Array} conversation conversation to show
         * @param  {Number} textIndex   text to display
         * @param  {Number} rate         
         */
        function displayConversation(conversation, textIndex, rate) {

            textIndex = textIndex || 0;
            rate = rate || 100;


            if (!conversation[textIndex]) {
                //clearConversation();
                return;
            }

            const text = conversation[textIndex].text;
            const textLength = text.length;
            let currentMsg = "";
            let charCounter = 0;

            const interval = setInterval(function() {
                const nextChar = text.charAt(charCounter);
                charCounter++;
                currentMsg = currentMsg.concat(nextChar);
                console.log(currentMsg);
                Q.state.set("dialogueText", currentMsg);
                if (charCounter >= textLength) {
                    /*displayConversation(conversation, ++textIndex, rate);*/
                    clearInterval(interval);
                }

            }, rate);
        }


    }
}

const dialogue = {
    conversacion1: [{
        nombre: "Javier",
        sprite: "javier.png",
        text: "Hola tio, que tal?\nEl comandante exige un informe del estado del juego"
    }, {
        nombre: "Henry",
        sprite: "henry.png",
        text: "Bien tio"
    }, {
        nombre: "Javier",
        sprite: "javier.png",
        text: "Me alegro, yo igual"
    }, {
        nombre: "Henry",
        sprite: "henry.png",
        text: "Has hecho el modulo de dialogos?"
    }, {
        nombre: "Javier",
        sprite: "javier.png",
        text: "En ello estoy, o no me ves?"
    }]
};


if (typeof Quintus === 'undefined') {
    module.exports = quintusDialogue;
} else {
    quintusDialogue(Quintus);
}