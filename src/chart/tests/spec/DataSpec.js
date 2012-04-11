describe("Chart Data", function() ｛
    describe("指定label;", function() {
        var data1,
            json1,
            data2,
            json2,
            jsonmutibar;

        beforeEach(function() {
            json1 = {
                type: "Line",
                element: {
                    datas: [1, 2, 3, 4],
                    labels: ["na {name}", "nb {name}", "nc {data}", "nd"],
                    names: ["a1", "a2", "a3", "a4"],
                },
                config: {
                    numberFormat: "0.00"
                }
            };

            data1 = new Data(json1);

        });


        it("图表类型转化为小写", function() {
            expect(data1.type).toEqual("line");
        });

        it("输入数据转化中间格式;", function() {
            //elements
            expect(data1.elements()).toEqual([
                {
                    name: 'a1',
                    data: 1,
                    label: 'na a1',
                    format: '0.00'

                }, {
                    name: 'a2',
                    data: 2,
                    label: 'nb a2',
                    format: '0.00'

                }, {
                    name: 'a3',
                    data: 3,
                    label: 'nc 3.00',
                    format: '0.00'

                }, {
                    name: 'a4',
                    data: 4,
                    label: 'nd',
                    format: '0.00'

                }

            ]);
        });

        it('统计最大值', function() {
            expect(data1.max()).toEqual(4);

        });

        it('配置 config 处理', function() {
            expect(data1.config).toEqual({
                paddingTop: 30,
                paddingLeft: 40,
                paddingRight: 20,
                paddingBottom: 20,
                showLabels: true,
                colors: [],
                animationDuration: .5,
                animationEasing: "easeInStrong",
                hideYAxisName: false,
                hideXAxisName: true,
                backgroundStyle: false,
                axisTextColor: "#999",
                axisBackgroundColor: "rgba(238, 238, 238, 0.4)",
                axisGridColor: "#e4e4e4",
                numberFormat: "0.00",
                frameColor: "#d7d7d7",
                drawbg: -1
            });

        });
    });

    describe("不指定label;", function() {
        var data2,
            json2,
            jsonmutibar;

        beforeEach(function() {
            json2 = {
                type: "PIE",
                elements: [
                    {
                        data: 100,
                        name: "bb100"
                    },
                    {
                        data: 200,
                        name: "bb200"
                    },
                    {
                        data: 300,
                        name: "bb300"
                    }
                ]
            };
            data2 = new Data(json2);

        });


        it("图表类型转化为小写", function() {
            expect(data2.type).toEqual("pie")
        });

        it("输入数据转化中间格式; 指定label", function() {
            //elements
            expect(data2.elements()).toEqual([{
                name: 'bb100',
                data: 100,
                label: "bb100 - 100",
                format: null
            }, {
                name: 'bb200',
                data: 200,
                label: "bb200 - 200",
                format: null

            }, {
                name: 'bb300',
                data: 300,
                label: "bb300 - 300",
                format: null
            }]);

        });

        it('统计最大值', function() {
            expect(data2.max()).toEqual(300);

        });
    });



    describe("multi data", function() {
        var mjson = {
                type: "BAR",
                elements: [{
                    name: "muti_1",
                    datas: [1, 2, 3, 4, 5]
                }, {
                    name: "muti_2",
                    datas: [11, 12, 13, 14, 15]
                }]
            },
            mdata;

        beforeEach(function() {
            mdata = new Data(mjson);
        });

        it("输入数据转化中间格式", function() {
            expect(mdata.elements()[0].items).toEqual([{
                name: 'muti_1',
                data: 1,
                label: 'muti_1 - 1',
                format: null
            }, {
                name: 'muti_1',
                data: 2,
                label: 'muti_1 - 2',
                format: null
            }, {
                name: 'muti_1',
                data: 3,
                label: 'muti_1 - 3',
                format: null
            }, {
                name: 'muti_1',
                data: 4,
                label: 'muti_1 - 4',
                format: null
            }, {
                name: 'muti_1',
                data: 5,
                label: 'muti_1 - 5',
                format: null
            }]);
        });
    });

    describe("number Format", function() {

        var data;

        beforeEach(function() {

            data = new Data({
                type: 'pie',
                element: {
                    datas: [ 0, null, 1, -1],
                    names: [ "a", "b", "c", "d"]
                },

                config: {
                    numberFormat: '0.00'
                }
            });

        });

        it('format the number', function() {
            expect(data.elements()).toEqual([
                {
                    name: 'a',
                    data: 0,
                    label: 'a - 0.00',
                    format: '0.00'
                },
                {
                    name: 'b',
                    data: null,
                    label: 'b - null',
                    format: '0.00'
                },
                {
                    name: 'c',
                    data: 1,
                    label: 'c - 1.00',
                    format: '0.00'
                },
                {
                    name: 'd',
                    data: -1,
                    label: 'd - -1.00',
                    format: '0.00'
                }
            ]);
        });
    });
});