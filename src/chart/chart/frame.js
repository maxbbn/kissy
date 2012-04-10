KISSY.add("chart/frame",function(S, Path){

    /**
     * The Border Layer
     */
    function Frame(chart, data){
        var self = this,
            config = data.config,
            width = chart.width,
            height = chart.height;

        this.data = data;

        this.path = new Path.RectPath(
                        config.paddingLeft,
                        config.paddingTop,
                        width - config.paddingRight - config.paddingLeft,
                        height - config.paddingBottom - config.paddingTop
                    );
    }

    S.augment(Frame,{
        draw : function(ctx){
            ctx.save();
            ctx.strokeStyle = this.data.config.frameColor;
            ctx.lineWidth = 2.0;
            this.path.draw(ctx);
            ctx.stroke();
            ctx.restore();
        }
    });

    return Frame;
}, {
    requires : ['chart/path']
});
