/**
 * Created by heke on 16/1/18.
 */

var BLANK = 0,//空格
    NO_MINE = 1,//没雷的区域
    MINE = -1,//雷
    CLICKED_MINE = -2,//被点击的雷
    UNTOUCHED_MINE = -3,//没有点击的雷
    WRONG_MINE = -4,//标记错误的雷
    CLEARED_MINE = -5,//成功标记的雷
    QUESTION_MINE = -6,//被问号标记的雷
    NO_MARK = 0,//没有标记
    FLAG_MARK = 1,//排雷
    QUESTION_MARK = 2,//问号
    left = false,
    right = false;
var MINE_SETTINGS = {easy: [9, 9, 10], medium: [16, 16, 40], heigher: [16, 30, 99]};//难度配置

function MineGame() {
    this.count = 0;//方块点击数
    this.max_r = MINE_SETTINGS.easy[0];//默认行数为9
    this.max_c = MINE_SETTINGS.easy[1];//默认列数为9
    this.number = MINE_SETTINGS.easy[2];//默认雷数
    this.tbArray = new Array(this.max_r);//游戏主数组,用于存储雷和雷的状态
    this.minesArray = new Array(this.max_r);//存储每个方块周围的雷数,用于之后显示数字
    this.squareArray = new Array(this.max_r);//存储每个方块的标记状态
    //用表格显示整个游戏界面(只需要初始化一次)
    this.table = document.getElementById("game-box");
    this.tbody = document.createElement("tbody");
    this.restartBtn = document.getElementById("restart");
    this.version = document.getElementsByName("version");
    this.end = document.getElementById("success");
    this.surrounding = new Array();
    //只需绑定一次的事件
    this.addHandler(this.restartBtn, "click", this.restart.bind(this));
    this.addHandler(this.version[0], "click", this.restart.bind(this));
    this.addHandler(this.version[1], "click", this.restart.bind(this));
    this.addHandler(this.version[2], "click", this.restart.bind(this));

    this.switchLevel();//游戏开始初始化,难度选择
}

MineGame.prototype = {
    //初始化游戏表格及各数组(用于多次初始化)
    init: function (max_r, max_c, number) {
        this.max_r = max_r;
        this.max_c = max_c;
        this.number = number;
        this.table.appendChild(this.tbody);
        for (var i = 0; i < this.max_r; i++) {
            this.tbody.insertRow(i);
            this.tbArray[i] = new Array(this.max_c);
            this.minesArray[i] = new Array(this.max_c);
            this.squareArray[i] = new Array(this.max_c);
            for (var j = 0; j < this.max_c; j++) {
                this.tbody.rows[i].insertCell(j);
                //变成二维数组方便存储行列信息
                this.tbArray[i][j] = BLANK;
                this.minesArray[i][j] = 0;
                this.squareArray[i][j] = NO_MARK;
            }
        }
        this.addHandler(this.tbody, "mousedown", this.operate.bind(this));
        this.addHandler(this.tbody, "mouseup", this.operateOver.bind(this));
        this.show();

    },
    //检测目标元素，即被点击的元素
    getEventTarget:function(event) {
    var e = event || window.event;
    return e.target || e.srcElement;
    },
    addHandler: function (element, type, handler) {
        if (element.addEventListener) {
            element.addEventListener(type, handler, false);
        } else if (element.attachEvent) {
            element.attachEvent("on" + type, handler);
        } else {
            element["on" + type] = handler;
        }
    },
    removeHandler: function (element, type, handler) {
        if (element.removeEventListener) {
            element.removeEventListener(type, handler, false);
        } else if (element.detachEvent) {
            element.detachEvent("on" + type, handler);
        } else {
            element["on" + type] = null;
        }
    },
    operate: function (e) {
        //只点击左键,不碰右键键
        if (e.which == 1 && !right) {
            left = true;
           this.gameStart(event);
            this.check(event);
            this.gameOver();
           this.show();
        }
        //只点击右键,不碰左键
        else if (e.which == 3 && !left) {
            right = true;
            this.changeSquare(event);
            this.show();

        }

    },
    operateOver: function (e) {
        if (e.which == 1) {
            left = false;
        }
        else if (e.which == 3) {
            right = false;
        }
    },
    getSurrounding: function (i, j) {
        //先对四个角判断，每个角周围有三格
        var self = this;
        var surrounding = [];
        if (i == 0 && j == 0) {
            surrounding = [0, 1, 0, 1];
        } else if (i == 0 && j == (self.max_c - 1)) {
            surrounding = [0, 1, j - 1, j];
        } else if (i == (self.max_r - 1) && j == 0) {
            surrounding = [i - 1, i, 0, 1];
        } else if (i == (self.max_r - 1) && j == (self.max_c - 1)) {
            surrounding = [i - 1, i, j - 1, j];
        } else if (i == 0) {	//第一行 周围有5格
            surrounding = [0, 1, j - 1, j + 1];
        } else if (i == (self.max_r - 1)) {	//最后一行
            surrounding = [i - 1, i, j - 1, j + 1];
        } else if (j == 0) {	//第一列
            surrounding = [i - 1, i + 1, j, j + 1];
        } else if (j == (self.max_c - 1)) {	//最后一列
            surrounding = [i - 1, i + 1, j - 1, j];
        } else {	//周围有八个格
            surrounding = [i - 1, i + 1, j - 1, j + 1];
        }
        return surrounding;
    },
    //第一次点击后游戏开始,开始埋雷

    createMines: function (event, number) {
        var self = this;
        var target = self.getEventTarget(event);//获取被点击的单元格位置，用于第一次点击后布雷
        var r = target.parentElement.rowIndex;//行数
        var c = target.cellIndex;//列数
        while (self.number > 0) {
            var i = Math.floor(Math.random() * 100 % self.max_r);
            var j = Math.floor(Math.random() * 100 % self.max_c);
            //保证第一点击那格及其四周无雷
            if (self.firstClickCheck(r, c, i, j)) {
                //设置不重复的，规定数目的雷
                if (self.tbArray[i][j] != MINE) {
                    self.tbArray[i][j] = MINE;
                    self.number--;
                }
            }
        }
    },
    //检测第一次点击没有雷
    firstClickCheck: function (i, j, r, c) {
        var result;
        var self = this;
        var surrounding = self.getSurrounding(i, j);
        result = self.checkAroundMines(surrounding[0], surrounding[1], surrounding[2], surrounding[3], r, c);
        return result;
    },
    checkAroundMines: function (x1, x2, y1, y2, r, c) {
        for (var i = x1; i <= x2; i++) {
            if (i == r) {
                for (var j = y1; j <= y2; j++) {
                    if (j == c) {
                        return false;
                    }
                }
            }
        }
        return true;
    },

    //扩展显示无雷区域,释出空白(被点击格及其周围，还有周围格的周围也都没有雷的，就全显示)
    spread: function (r, c) {
        var self = this;
        self.checkNoMines(r, c);

    },
    checkNoMines: function (r, c) {
        var self = this;
        var surrounding = self.getSurrounding(r, c)
        if (self.checkAroundNoMines(surrounding[0], surrounding[1], surrounding[2], surrounding[3]) == true) {
            self.respondNoMines(surrounding[0], surrounding[1], surrounding[2], surrounding[3]);
        }
    },
    //检查被点击格子四周没有雷返回true，有雷返回false
    checkAroundNoMines: function (x1, x2, y1, y2) {
        var self = this;
        for (var i = x1; i <= x2; i++) {
            for (var j = y1; j <= y2; j++) {
                if (self.tbArray[i][j] == MINE || self.tbArray[i][j] == CLICKED_MINE) {
                    return false;
                }
            }
        }
        return true;
    },
    //没雷，释出空白，然后递归的对四周的四周进行检查
    respondNoMines: function (x1, x2, y1, y2) {
        var self = this;
        for (var i = x1; i <= x2; i++) {
            for (var j = y1; j <= y2; j++) {
                if (self.tbArray[i][j] == BLANK && self.squareArray[i][j] != FLAG_MARK) {
                    if (self.squareArray[i][j] == QUESTION_MARK) {
                        self.squareArray[i][j] = NO_MARK;
                    }
                    self.tbArray[i][j] = NO_MINE;
                    self.checkNoMines(i, j);
                }
            }
        }
    },
    //统计周边雷数
    statistics: function () {
        var self = this;
        for (var i = 0; i < self.max_r; i++) {
            for (var j = 0; j < self.max_c; j++) {
                //先对四个角统计
                var surrounding = self.getSurrounding(i, j);
                self.minesArray[i][j] = statisticsEachAround(surrounding[0], surrounding[1], surrounding[2], surrounding[3]);
            }
        }
        //统计一个格子的四周的雷数，返回该雷数
        function statisticsEachAround(x1, x2, y1, y2) {
            var num = 0;
            for (var i = x1; i <= x2; i++) {
                for (var j = y1; j <= y2; j++) {
                    if (self.tbArray[i][j] == MINE) {
                        num++;
                    }
                }
            }
            return num;
        }
    },

    //判断是否踩雷
    check: function (event) {
        var self = this;
        var target = self.getEventTarget(event);
        var surrounding = self.getSurrounding(target.parentElement.rowIndex, target.cellIndex);
        //踩雷
        if (self.tbArray[target.parentElement.rowIndex][target.cellIndex] == MINE) {
            self.tbArray[target.parentElement.rowIndex][target.cellIndex] = CLICKED_MINE;
            //对已排除的雷 和未排除的进行区分
            for (var i = 0; i < self.max_r; i++) {
                for (var j = 0; j < self.max_c; j++) {
                    if (self.tbArray[i][j] == BLANK && self.squareArray[i][j] == FLAG_MARK) {
                        self.tbArray[i][j] = WRONG_MINE;
                        self.squareArray[i][j] = NO_MARK;
                    } else if (self.tbArray[i][j] == MINE && self.squareArray[i][j] == FLAG_MARK) {
                        self.tbArray[i][j] = CLEARED_MINE;
                        self.squareArray[i][j] = NO_MARK;
                    } else if (self.tbArray[i][j] == MINE && self.squareArray[i][j] == QUESTION_MARK) {
                        self.tbArray[i][j] = QUESTION_MINE;
                        self.squareArray[i][j] = NO_MARK;
                    } else if (self.tbArray[i][j] == MINE) {
                        self.tbArray[i][j] = UNTOUCHED_MINE;
                    }
                }
            }
            self.removeHandler(self.tbody, "mousedown", self.operate.bind(self));
            self.removeHandler(self.tbody, "mouseup", self.operateOver.bind(self));
            //显示结束画面
            self.show();
            self.end.innerHTML = "不好意思，你炸了！";
        } else if (self.tbArray[target.parentElement.rowIndex][target.cellIndex] == BLANK && self.squareArray[target.parentElement.rowIndex][target.cellIndex] != FLAG_MARK) {
            //没有踩雷
            self.tbArray[target.parentElement.rowIndex][target.cellIndex] = NO_MINE;
            if (self.squareArray[target.parentElement.rowIndex][target.cellIndex] == QUESTION_MARK) {
                self.squareArray[target.parentElement.rowIndex][target.cellIndex] = NO_MARK;
            }
            self.spread(target.parentElement.rowIndex, target.cellIndex);
        }
    },

    //检查是否扫完了雷
    checkEnd: function () {
        for (var i = 0; i < this.max_r; i++) {
            for (var j = 0; j < this.max_c; j++) {
                if (this.tbArray[i][j] == BLANK) {
                    return false;
                }
            }
        }
        //显示全部的雷
        for (var i = 0; i < this.max_r; i++) {
            for (var j = 0; j < this.max_c; j++) {
                if (this.tbArray[i][j] < BLANK) {
                    this.tbArray[i][j] = UNTOUCHED_MINE;
                }
            }
        }
        return true;
    },

    // 右键 切换方块，小旗及问号
    changeSquare: function (event) {
        var target = this.getEventTarget(event);
        var r = target.parentElement.rowIndex;
        var c = target.cellIndex;
        //只有没有打开的方块可以使用右键
        if (this.tbArray[r][c] == BLANK || this.tbArray[r][c] == MINE) {
            if (this.squareArray[r][c] == NO_MARK) {
                //方块变排雷
                this.squareArray[r][c] = FLAG_MARK;
            } else if (this.squareArray[r][c] == FLAG_MARK) {
                //排雷变问号
                this.squareArray[r][c] = QUESTION_MARK;
            } else if (this.squareArray[r][c] == QUESTION_MARK) {
                //变回原样
                this.squareArray[r][c] = NO_MARK;
            }
        }
    },

    //显示游戏界面,由tbArray这个数组记录了每个单元块的状态,让状态显示与数据操作分离
    show: function () {
        for (var i = 0; i < this.max_r; i++) {
            for (var j = 0; j < this.max_c; j++) {
                if (this.tbArray[i][j] == MINE) {
                    this.tbody.rows[i].cells[j].className = "square";
                } else if (this.tbArray[i][j] == CLICKED_MINE) {	//被点击了的雷
                    this.tbody.rows[i].cells[j].className = "mines-b";
                } else if (this.tbArray[i][j] == UNTOUCHED_MINE) {
                    //结束时没有排除的雷显示（包括成功结束游戏但没插旗情况）
                    this.tbody.rows[i].cells[j].className = "mines";
                } else if (this.tbArray[i][j] == WRONG_MINE) {
                    //失败结束时被排错的地方显示(被标错地方)
                    this.tbody.rows[i].cells[j].className = "mines-x";
                } else if (this.tbArray[i][j] == CLEARED_MINE) {
                    //失败结束时已排除雷显示（旗插对了地方）
                    this.tbody.rows[i].cells[j].className = "mines-flag";
                } else if (this.tbArray[i][j] == QUESTION_MINE) {
                    //失败结束时 问号标记的是雷（问号下面是雷,没有扫出雷就视为标记错误）
                    this.tbody.rows[i].cells[j].className = "mines-mark";
                }
                else if (this.tbArray[i][j] == NO_MINE) {
                    //点开后无雷的区域
                    this.tbody.rows[i].cells[j].className = "no-mines";
                } else if (this.tbArray[i][j] == BLANK) {
                    //未点击的区域（仍被盖住的）
                    this.tbody.rows[i].cells[j].className = "square";
                }
                //插入周围雷的数字（点开后无雷，但其周围有雷）
                if (this.minesArray[i][j] != 0 && this.tbArray[i][j] == NO_MINE && this.squareArray[i][j] != FLAG_MARK) {
                    this.tbody.rows[i].cells[j].innerHTML = this.minesArray[i][j];
                    this.tbody.rows[i].cells[j].className = "color-" + this.minesArray[i][j];
                }

                //显示方块被标记小旗 及 问号
                if (this.squareArray[i][j] == FLAG_MARK) {
                    this.tbody.rows[i].cells[j].className = "flag";
                } else if (this.squareArray[i][j] == QUESTION_MARK) {
                    this.tbody.rows[i].cells[j].className = "mark";
                }
            }
        }
    },

    //选择游戏难度
    switchLevel: function () {
        var version = this.version;
        for (var i = 0; i < version.length; i++) {
            if (version[i].checked == true) {
                if (version[i].value == 1) {
                    //9*9网格  默认10个雷,理论有9个格不可以有雷
                    this.init(MINE_SETTINGS.easy[0], MINE_SETTINGS.easy[1], MINE_SETTINGS.easy[2]);
                } else if (version[i].value == 2) {
                    // 16*16网格 默认40个雷
                    this.init(MINE_SETTINGS.medium[0], MINE_SETTINGS.medium[1], MINE_SETTINGS.medium[2]);
                } else if (version[i].value == 3) {
                    //16*30网格 默认99个雷
                    this.init(MINE_SETTINGS.heigher[0], MINE_SETTINGS.heigher[1], MINE_SETTINGS.heigher[2]);
                }
            }
        }
    },
    //游戏结束
    gameOver: function () {
        var self = this;
        if (self.checkEnd() == true) {
            self.removeHandler(self.tbody, "mousedown", operate);
            self.removeHandler(self.tbody, "mouseup", over);
            self.end.innerHTML = "恭喜,成功排雷!"
        }
    },
    //游戏开始
    gameStart: function (event) {
        var self = this;
        self.count++;
        if (self.count == 1) {
            //开始埋雷
            self.createMines(event, self.number);
            self.statistics();
        }
    },
    restart: function () {
        var tbody = this.tbody;
        var tbodyChild = tbody.childNodes;
        for (var i = tbodyChild.length - 1; i >= 0; i--) {
            tbody.removeChild(tbodyChild[i]);
        }
        this.count = 0;
        this.end.innerHTML = "";
        this.switchLevel();
    }
}





