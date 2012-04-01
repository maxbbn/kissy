describe("Chart Data", function() {
    describe("single Data", function() {
        var data1, json1, data2, json2, jsonmutibar;

        beforeEach(function() {
            json1 = {
                type: "Line",
                element: {
                    datas: [1, 2, 3, 4],
                    labels: ["n", "b", "n", "c"],
                    names: ["a1", "a2", "a3", "a4"],
                },
                config: {
                    numberFormat: "0.00"
                }
            };

            json2 = {
                type: "PIE",
                elements: [{
                    data: 100,
                    name: "bb100"
                }, {
                    data: 200,
                    name: "bb200"
                }, {
                    data: 300,
                    name: "bb300"
                }]
            };
            data1 = new Data(json1);
            data2 = new Data(json2);

        });


        it("图表类型转化为小写", function() {
            expect(data1.type).toEqual("line");
            expect(data2.type).toEqual("pie")
        });

        it("输入数据转化中间格式", function() {
            //elements
            expect(data1.elements()).toEqual([{
                data: 1,
                label: 'n',
                name: 'a1',
                format: '0.00'

            }, {
                data: 2,
                label: 'b',
                name: 'a2',
                format: '0.00'

            }, {
                data: 3,
                label: 'n',
                name: 'a3',
                format: '0.00'

            }, {
                data: 4,
                label: 'c',
                name: 'a4',
                format: '0.00'

            }

            ]);

            expect(data2.elements()).toEqual([{
                data: 100,
                name: 'bb100',
                format: null,
                label: null
            }, {
                data: 200,
                name: 'bb200',
                format: null,
                label: null

            }, {
                data: 300,
                name: 'bb300',
                format: null,
                label: null
            }]);
        });
        it('统计最大值', function() {
            expect(data1.max()).toEqual(4);
            expect(data2.max()).toEqual(300);

        });

        it('配置 config 处理', function() {
            expect(data1.config).toEqual({
                paddingTop: 30,
                paddingLeft: 20,
                paddingRight: 20,
                paddingBottom: 20,
                showLabels: true,
                colors: [],
                animationDuration: .5,
                animationEasing: "easeInStrong",
                backgroundStyle: false,
                axisTextColor: "#999",
                axisBackgroundColor: "#EEE",
                axisGridColor: "#e4e4e4",
                numberFormat: "0.00",
                frameColor: "#d7d7d7",
                drawbg: -1
            });

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
        };
        var mdata;

        beforeEach(function() {
            mdata = new Data(mjson);
        });

        it("输入数据转化中间格式", function() {
            expect(mdata.elements()[0].items).toEqual([{
                name: 'muti_1',
                data: 1,
                label: null,
                format: null
            }, {
                name: 'muti_1',
                data: 2,
                label: null,
                format: null
            }, {
                name: 'muti_1',
                data: 3,
                label: null,
                format: null
            }, {
                name: 'muti_1',
                data: 4,
                label: null,
                format: null
            }, {
                name: 'muti_1',
                data: 5,
                label: null,
                format: null
            }]);
        });
    });

    describe("numberFormat", function() {
        var data = new Data({
            element: {
                datas: [0, null, 1, -1, .99],
                names: ["a", "b", "c", "d"]
            },

            config: {
                numberFormat: '0.00'
            }
        });

        it('format the number', function() {
            expect(data.elements()).toEqual([{
                name: 'a'，
                data: 0,
                label: 'a 0.00',
                format: '0.00'
            }, {
                name: 'b'，
                data: null,
                label: 'b null',
                format: '0.00'
            }, {
                name: 'c'，
                data: 1,
                label: 'c 1.00',
                format: '0.00'
            }, {
                name: 'd'，
                data: -1,
                label: 'd 0.00',
                format: '0.00'
            }, {
                name: 'e'，
                data: .99,
                label: 'e .99',
                format: '0.00'
            }])
        });
    });
});