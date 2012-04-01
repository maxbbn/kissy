KISSY.add("chart/frame",function(S, Path){

    /**
     * The Border Layer
     */
    function Frame(data,cfg){
        this.data = data;
        this.path = new Path.RectPath(
                        cfg.paddingLeft,
                        cfg.paddingTop,
                        cfg.width - cfg.paddingRight - cfg.paddingLeft,
                        cfg.height - cfg.paddingBottom - cfg.paddingTop
                    );
    }
    S.augment(Frame,{
        draw : function(ctx,cfg){
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
    requires : ['./path']
});
