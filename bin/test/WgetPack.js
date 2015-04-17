var WgetPack = {
    // В качестве базы данных используем softJsonDB
    _wb: new alasql.Database(),
    _folder: '',
    thread: true,
    timer: false,
    wgetPath: AppData + '\\DRPSu',
    init: function () {
        if (!FSO.FolderExists(this.wgetPath)) {
            FSO.CreateFolder(this.wgetPath);
        }
        if (!FSO.FolderExists(this.wgetPath + '\\LOGS')) {
            FSO.CreateFolder(this.wgetPath + '\\LOGS');
        }
        WgetPack._wb.exec("CREATE TABLE download");
    },
    SQL: function (query) {
        //alert(query);
        //alert(this._wb.exec(query));
        return this._wb.exec(query);

    },
    html: function () {
        document.getElementById("m-pc").parentNode.classList.remove("green");
        document.getElementById("m-apps").parentNode.classList.remove("green");
        document.getElementById("m-down").parentNode.classList.add("green");
        //alert(JSON.stringify(this._wb.tables['download'].data));
        var wgets = this.SQL("SELECT * FROM download");
        var tbodys = document.getElementById('list').getElementsByTagName('tbody');
        for (var i = 0, n = tbodys.length; i < n; i++) {
            if (i in tbodys) {
                tbodys[i].innerHtml = '';
            }
        }
        document.getElementById('loader').style.display = 'block';
        var newTbody = document.createElement('tbody');
        for (var i = 0; i < wgets.length; i++) {
            if (wgets[i]) {

                    //var descr = this.SQL("SELECT * FROM download WHERE Name='" + wgets[i].Name + "'")[0];
                    newTbody.innerHTML += "<!-- { SINGLE LIST ITEM } -->" +
                            "<tr>" +
                            "<td class='list-first'><img id='drv-generic' src='img/blank.gif' /></td>" +
                            "<td class='list-second'>" + wgets[i].Name + "</td>" +
                            "<td class='list-third'><b>" + wgets[i].complite + "%</b></td>" +
                            "<td class='list-last'></td>" +
                            "</tr>";
            }
        }
        var tbodys = document.getElementById('list').getElementsByTagName('tbody');
        if (tbodys.length) {
            document.getElementById('list').removeChild(tbodys[0]);
        }
        document.getElementById('list').appendChild(newTbody);
        document.getElementById('loader').style.display = 'none';
        if (wgets.length){
            setTimeout(function () {
                WgetPack.get().proccess();
           }, 300);
       }
            
    },
    get: function (json) {

        var _this = this;
        if (json) {
            if (typeof json == 'string') {
                if (json[0] == '(') {
                    json = json.substr(1, json.length - 2);
                }
                ;
                json = JSON.parse(json);
            }
            _this.folder = '';
            json.complite = '';
            if (WgetPack._wb.tables['download'].columns.length === 0) {
                for (var column in json) {
                    if (json.hasOwnProperty(column)) {
                        WgetPack._wb.exec('ALTER TABLE download ADD COLUMN ' + column + ' STRING');
                    }
                }
            }
            //alert(JSON.stringify(json));
            WgetPack._wb.exec('INSERT INTO download VALUES ?', [json]);
        }
        //WgetPack._wb.tables['download'].data.push(json[0]);

        var additionFunctions = {
            download: function (url) {
                if (_this.exists('Tools\\wget.exe')) {
                    if (FSO.GetFileName(url).lastIndexOf(".exe")) {
                        _this.folder = _this.wgetPath + '\\PROGRAMS';
                    } else if (FSO.GetFileName(url).lastIndexOf(".zip")) {
                        _this.folder = _this.wgetPath + '\\DRIVERS';
                    } else {
                        _this.folder = _this.wgetPath;
                    }

                    if (!_this.exists(_this.folder + "\\" + FSO.GetFileName(url))) {
                        if (!FSO.FolderExists(_this.folder)) {
                            FSO.CreateFolder(_this.folder);
                        }
                        WshShell.Run('"Tools\\wget.exe" -P "' + _this.folder + '" ' + url + " -o " + _this.wgetPath + "\\LOGS\\" + FSO.GetFileName(url).slice(0, FSO.GetFileName(url).lastIndexOf(".")) + ".txt", 0, _this._thread);

                    } else {
                        return false;
                    }
                }
            },
            proccess: function () {
                var downloads = _this.SQL("SELECT * FROM download");
                if (downloads.length > 0) {
                    for (var i = 0; i < downloads.length; i++) {
                        var tempfile, line;
                        if (_this.exists(_this.wgetPath + "\\LOGS\\" + FSO.GetFileName(downloads[i].URL).slice(0, FSO.GetFileName(downloads[i].URL).lastIndexOf(".")) + ".txt")) {
                            tempfile = FSO.OpenTextFile(_this.wgetPath + "\\LOGS\\" + FSO.GetFileName(downloads[i].URL).slice(0, FSO.GetFileName(downloads[i].URL).lastIndexOf(".")) + ".txt", 1, false);
                            line = tempfile.ReadAll();
                            _this.SQL("UPDATE download SET complite = " + line.slice(line.lastIndexOf("%") - 3, line.lastIndexOf("%")) + " WHERE URL = '" + downloads[i].URL + "'");
                            tempfile.Close();
                            if (line.slice(line.lastIndexOf("%") - 3, line.lastIndexOf("%")) === '100') {
                                _this.get().complite(downloads[i].URL);
                            }
                        }
                    }
                    setTimeout(function () {
                         WgetPack.html();
                    }, 500);
                }
            },
            complite: function (url) {
                _this.SQL("DELETE FROM download WHERE URL = '" + url + "'");
            }
        };
        return additionFunctions;

    },
    exists: function (file) {

        if (FSO.FileExists(file)) {
            return true;
        } else {
            return false;
        }
    }

};
WgetPack.init();
// 'SELECT * FROM soft WHERE Lang like \'r%\''  -  не забываем про вид запросов




