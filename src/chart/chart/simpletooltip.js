KISSY.add('chart/simpletooltip', function(S){

    /**
     * 工具提示，总是跟随鼠标
     */
    function SimpleTooltip(){
        var self = this;
        self.n_c = S.all("<div class='ks-chart-tooltip'>");
        self._offset = {left:0,top:0}
        self.hide();

        S.ready(function(){
            S.one('body')
                .append(self.n_c)
                .on("mousemove", self._mousemove, self);
        });

    }

    S.augment(SimpleTooltip,{
        _mousemove : function(ev){
            var self = this,
                ttx = ev.pageX,
                tty = ev.pageY;
            if(self._show){
                self._updateOffset(ttx, tty);
            }else{
                //save the position
                self._offset.left = ttx;
                self._offset.top = tty;
            }
        },

        _updateOffset : function(x,y){
            var Dom = S.DOM;

            if(x > Dom.scrollLeft() + Dom.viewportWidth() - 100){
                x -= this.n_c.width() + 6;
            }
            if(y > Dom.scrollTop() + Dom.viewportHeight() - 100){
                y -= this.n_c.height() + 20;
            }
            this.n_c.offset({left:x, top:y+12});
        },
        /**
         * show the tooltip
         * @param {String} the message to show
         */
        show : function(msg){
            // console.log('show')
            var self = this;
            self._show = true;

            self.n_c
                .html(msg)
                .css("display","block")

        },
        /**
         * hide the tooltip
         */
        hide : function(){
            // console.log('hide')
            var self = this;
            self._show = false;
            self.n_c.css("display","none");
        },

        _init : function(){}
    });

    return SimpleTooltip;
});
