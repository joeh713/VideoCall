/*
版本:1.0
作者:Josephzhou
继承:无
依赖:无
参数：options{sServiceType:pao} 可自定义sServiceType，默认会取当前链接的一级域名
*/
WXJssdkInit = function(options) {

    if (!options) options = {};
    var jssdk = 'http://res.wx.qq.com/open/js/jweixin-1.0.0.js'; //微信的sdk
    var jssdkGetSignature = "http://apps.game.qq.com/ams/wx/jo/getSign.php" //获取jssdk签名接口包含参数sServiceType=feiji和sUrl
    var jssdkGetSignatureCharset = 'utf-8' //获取jssdk签名接口编码

    var scriptLoader = function() {
        var firstScript = document.getElementsByTagName('script')[0];
        var scriptHead = firstScript.parentNode;
        var re = /ded|co/;
        var onload = 'onload';
        var onreadystatechange = 'onreadystatechange';
        var readyState = 'readyState';

        var load = function(src, fn, charset) {
            var script = document.createElement('script');
            script.charset = charset;
            script[onload] = script[onreadystatechange] = function() {
                if (!this[readyState] || re.test(this[readyState])) {
                    script[onload] = script[onreadystatechange] = null;
                    fn && fn(script);
                    script = null;
                }
            };
            script.async = true;
            script.src = src;
            scriptHead.insertBefore(script, firstScript);
        };
        return function(srces, fn, charset) {
            charset = charset || 'gb2312';
            if (typeof srces == 'string') {
                load(srces, fn, charset);
            } else {
                var src = srces.shift();
                load(src, function() {
                    if (srces.length) {
                        scriptLoader(srces, fn, charset);
                    } else {
                        fn && fn();
                    }
                }, charset);
            }
        };
    }();
    var xhrFactory = function() {
        this.init.apply(this, arguments);
    }
    xhrFactory.prototype = {
        init: function() {
            this.xhr = this.create();
        },
        create: function() {
            var xhr = null;
            try {
                if (window.XMLHttpRequest) {
                    xhr = new XMLHttpRequest();
                } else if (window.ActiveXObject) {
                    xhr = new ActiveXObject("Msxml2.Xmlhttp");
                }
            } catch (err) {
                xhr = new ActiveXObject("Microsoft.Xmlhttp");
            }
            return xhr;
        },
        readystate: function(timeout, callback) {
            var self = this;
            self.xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    callback(eval("(" + this.responseText + ")"));
                } else {
                    setTimeout(function() {
                        self.xhr.abort();
                    }, !timeout ? 15000 : timeout);
                }

            }
        },
        para: function(data) {
            return data;
        },
        get: function(url, data, callback, async, timeout) {
            this.readystate(timeout, callback);
            var newurl = url;
            var datastr = this.para(data);
            newurl = url + "?" + datastr;
            this.xhr.open("get", newurl, !async ? true : async);
            this.xhr.send(null);
        },
        post: function(url, data, callback, async, timeout) {
            this.readystate(timeout, callback);
            var newurl = url;
            var datastr = this.para(data);
            this.xhr.open("post", newurl, !async ? true : async);
            this.xhr.setRequestHeader("content-type", "x-www-form-urlencoded");
            this.xhr.send(!datastr ? null : datastr);
        }
    }

    /*
	  fn为回调方法，传递wx对象
	  appId 可选,为相应公众号appid,留空会根据页面url寻找
	  jsApiList可选,为api功能接口，留空取得全部,
	  ifDebug可选,为是否进行调试，留空不进行调试
	*/
    this.init = function(fn, appId, jsApiList, ifDebug) {
        var getSign = function(fn, appId, jsApiList, ifDebug, options, definetmp) {
            if (options.sServiceType) {
                var sServiceType = options.sServiceType;
            } else {
                var r = window.location.host;
                if (r) {
                    var sServiceType = r;
                } else {
                    if (ifDebug) {
                        console.log('Not support local test,please use url start with http//.');
                        alert('Not support local test,please use url start with http//.');
                    }
                    return;
                }
            }
            var xhr = new xhrFactory();

            xhr.get(jssdkGetSignature, 'sServiceType=' + sServiceType + '&sUrl=' + encodeURIComponent(location.href.replace(/[\#][\s\S]*/, '')) + ((appId) ? ('&sAppId=' + appId) : ''), function(data) {

                if (data.iRet == '0') {
                    //获取签名
                    var signature = data.jData.signature;
                    if (!jsApiList) {
                        jsApiList = ['checkJsApi', 'onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ', 'onMenuShareWeibo','onMenuShareQZone', 'hideMenuItems', 'showMenuItems', 'hideAllNonBaseMenuItem', 'showAllNonBaseMenuItem', 'translateVoice', 'startRecord', 'stopRecord', 'onRecordEnd', 'playVoice', 'pauseVoice', 'stopVoice', 'uploadVoice', 'downloadVoice', 'chooseImage', 'previewImage', 'uploadImage', 'downloadImage', 'getNetworkType', 'openLocation', 'getLocation', 'hideOptionMenu', 'showOptionMenu', 'closeWindow', 'scanQRCode', 'chooseWXPay', 'openProductSpecificView', 'addCard', 'chooseCard', 'openCard'];
                    }
                    var ops = {
                        debug: ifDebug, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
                        appId: data.jData.appId, // 必填，公众号的唯一标识
                        timestamp: data.jData.timestamp, // 必填，生成签名的时间戳
                        nonceStr: data.jData.nonceStr, // 必填，生成签名的随机串
                        signature: data.jData.signature, // 必填，签名，见附录1
                        jsApiList: jsApiList // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
                    };
                    if (typeof wx == 'object') {
                        wx.config(ops);
                        wx.ready(function() {

                            fn(wx);
                        });
                    } else {
                        fn({
                            'msg': 'wx is null.'
                        });
                    }
                    if (typeof define != 'undefined' && typeof define.amd != 'undefined' && typeof definetmp != 'undefined') {
                        define.amd = definetmp;
                    }
                } else {
                    console.log(data.sMsg);
                    if (ifDebug) {
                        alert(data.sMsg);
                    }
                }
            });
        }
        //如果已经引进了jweixin-1.0.0.js
        if (typeof define != 'undefined' && typeof define.amd != 'undefined') {
            var definetmp = define.amd;
            define.amd = false;
        }
        scriptLoader(jssdk, function() {
            getSign(fn, appId, jsApiList, ifDebug, options);
        }, jssdkGetSignatureCharset);


    }
}
WXJssdk = new WXJssdkInit(); /*  |xGv00|bcca137235273fa246484f7f56e5c88b */