/*global window,document,jQuery,console,Modernizr,Image*/
/*jslint plusplus: true */
/**
 * Name:            CanvasDraw
 * File:            jquery.canvasdraw.js
 * Version:         0.2
 * Authors:         Viren Patel (viren.r.patel@gmail.com)
                    Rashid Fayyaz (rashidfiaz@gmail.com)
 *                  Raship Shah (shahraship@gmail.com)                    
 * Description:     This jquery plugin is written to enable drawing on canvas.
 * USAGE:
 * ------------------------------------------------------------------------------------
 * $('#canvas').canvasdraw(); //this is default.
 * ===================================================================================
 */
(function ($) {
    'use strict';
    var notUsingExCanvas = (window.G_vmlCanvasManager === 'undefined');
    //var notUsingExCanvas = (window.G_vmlCanvasManager === 'undefined' || window.G_vmlCanvasManager ===  undefined);

    //private functions.
    function getContext($cnvs) {
        var ctx = null;
        if (!$cnvs[0].getContext) {
            if (notUsingExCanvas === false) {
                ctx = window.G_vmlCanvasManager.initElement($cnvs[0]).getContext("2d");
            }
        } else {
            ctx = $cnvs[0].getContext('2d');
        }
        return ctx;
    }
    function wordwrap(str, int_width, str_break, cut) {
        var m = ((arguments.length >= 2) ? int_width : 75),
            b = ((arguments.length >= 3) ? str_break : "\n"),
            c = ((arguments.length >= 4) ? cut : false),
            i,
            j,
            l,
            s,
            r;
        str += '';
        if (m < 1) {
            return str;
        }
        for (i = -1, l = (r = str.split(/\r\n|\n|\r/)).length; ++i < l; r[i] += s) {
            for (s = r[i], r[i] = ""; s.length > m; r[i] += s.slice(0, j) + ((s = s.slice(j)).length ? b : "")) {
                j = c === 2 || (j = s.slice(0, m + 1).match(/\S*(\s)?$/))[1] ? m : j.input.length - j[0].length || (c === 1 && m) || j.input.length + (j = s.slice(m).match(/^\S*/)).input.length;
            }
        }
        return r.join("\n");
    }

    $.fn.canvasdraw = function (options) {
        var settings = $.extend({}, $.fn.canvasdraw.defaults, options);
        //init each canvas
        return this.each(function () {
            try {
                //private variables.
                var $workarea = $(this).parent(),
                    $cnvs = $(this),
                    ctx = getContext($cnvs),
                    tmpctx = null,
                    myctx = null,
                    $tmpcnvs = null,
                    mouse = {x: 0, y: 0},
                    ppts = [],
                    width = 0,
                    height = 0,
                    rect = {x: 0, y: 0, w: 0, h: 0},
                    ctxHistory = [],
                    drawLine = false,
                    txtAreaOldVal = "",
                    myevts = [],
                    tmpcnvsevts = {},
                    cnvsevts = {};
                $cnvs.attr('width', $workarea.width() - 2);
                $cnvs.attr('height', $workarea.height() - 1);
                width = $cnvs.width();
                height = $cnvs.height();
                if (ctx) {
                    $cnvs.on('canvasdraw.setcolor', function (e, color) {
                        settings.writemodecolor = color;
                        if (settings.mode === 'write' || settings.mode === 'type' || settings.mode === 'erase' ) {
                            tmpctx.fillStyle = settings.writemodecolor;
                            tmpctx.strokeStyle = settings.writemodecolor;
                        }

                        /*tmpctx.lineWidth = settings.mode === 'erase' ? 10 : 1;*/
                    });

                    $cnvs.on('canvasdraw.addctxhistory', function () {
                        if (ctxHistory.length === 15) {
                            ctxHistory.shift();
                        }
                        ctxHistory.push(ctx.getImageData(0, 0, $cnvs.width() - 1, $cnvs.height() - 1));
                    });
                    $cnvs.on('canvasdraw.undoctxhistory', function () {
                        if (ctxHistory.length > 0) {
                            ctx.setTransform(1, 0, 0, 1, 0, 0);
                            ctx.clearRect(0, 0, $cnvs.width(), $cnvs.height());
                            if (!notUsingExCanvas) {
                                ctx.putImageData(ctxHistory[ctxHistory.length - 1], 0, 0);
                            }
                            ctxHistory.pop();
                        }
                    });
                    $cnvs.on('canvasdraw.getimgdatauri', function () {
                        return $cnvs[0].toDataURL();
                    });
                    $cnvs.on('canvasdraw.loadimageurl', function (e, data) {
                        var img = new Image();
                        img.onload = function () {
                            if (data.width && data.height) {
                                ctx.drawImage(img, 0, 0, data.width, data.height);
                            } else {
                                var maxwidth = 1000;
                                var ratio = maxwidth / img.width;
                                var maxheight = img.height * ratio;
                                ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, maxwidth, maxheight);
                            }
                        };
                        img.src = data.url;
                    });
                    $cnvs.on('canvasdraw.getsettings', function () {
                        return settings;
                    });
                    $cnvs.on('canvasdraw.loadboardurl', function (e, data) {
                        var img = new Image();
                        img.onload = function () {
                            if (data.width && data.height) {
                                ctx.drawImage(img, 0, 0, data.width, data.height);
                            } else {
                                ctx.drawImage(img, 0, 0, img.width, img.height);
                            }
                        };
                        img.src = data.url;
                    });
                    $cnvs.on('canvasdraw.resizeto', function (e, w, h) {
                        var imgData = null,
                            $resizeCnvs,
                            scalew,
                            scaleh,
                            myctx1;
                        if (settings.fixedsize && w !== settings.fixedsize.width) {
                            w = settings.fixedsize.width;
                        }
                        if (settings.fixedsize && h !== settings.fixedsize.height) {
                            h = settings.fixedsize.height;
                        }
                        if (w < width || h < height) {
                            $resizeCnvs = $('<canvas />').attr('width', width).attr('height', height);
                            scalew = w / width;
                            scaleh = h / height;
                            myctx1 = getContext($resizeCnvs);
                            myctx1.scale(scalew, scaleh);
                            if (!notUsingExCanvas) {
                                myctx1.drawImage($cnvs[0], 0, 0);
                            }
                            $cnvs.attr('width', w);
                            $cnvs.attr('height', h);
                            if (!notUsingExCanvas) {
                                ctx.drawImage($resizeCnvs[0], 0, 0);
                            }
                        } else {
                            if (!notUsingExCanvas) {
                                imgData = ctx.getImageData(0, 0, width - 1, height - 1);
                            }
                            $cnvs.attr('width', w);
                            $cnvs.attr('height', h);
                            if (!notUsingExCanvas) {
                                ctx.putImageData(imgData, 0, 0);
                            }
                        }
                        if ($tmpcnvs) {
                            $tmpcnvs.attr('width', w);
                            $tmpcnvs.attr('height', h);
                        }
                        width = w;
                        height = h;
                    });
                    $cnvs.on('canvasdraw.setmode', function (e, mode) {
                        var prevMode = settings.mode;
                        settings.mode = mode;
                        if (settings.mode === 'erase') {
                            $tmpcnvs.hide();
                            ctx.globalAlpha = 1;
                            if (!notUsingExCanvas) {
                                ctx.globalCompositeOperation = 'destination-out';
                                ctx.strokeStyle = 'rgba(0,0,0,1)';
                            }
                            ctx.fillStyle = 'rgba(0,0,0,1)';
                            ctx.lineWidth = 10;
                            myctx = ctx;
                        } else if (settings.mode === 'write') {
                            //settings.writemodecolor = settings.lastwritemodecolor;

                            if (!notUsingExCanvas) {
                                $tmpcnvs.show();
                                ctx.globalCompositeOperation = 'source-over';
                                ctx.strokeStyle = settings.writemodecolor;
                            }
                            ctx.globalAlpha = 1;
                            ctx.fillStyle = settings.writemodecolor;
                            ctx.lineWidth = 2;
                            $cnvs.trigger('canvasdraw.setcolor', [settings.writemodecolor]);
                            if (settings.scope && settings.method !== 'passive') {
                                //settings.scope.$broadcast('canvaspush', {'canvasdraw.setcolor': settings.writemodecolor, id: $cnvs.attr('id')});
                                settings.scope.$broadcast('canvaspush', {'event' :'canvasdraw.setcolor', 'data':[settings.writemodecolor], id: $cnvs.attr('id')});
                            }
                            if (!notUsingExCanvas) {
                                myctx = tmpctx;
                            } else {
                                myctx = ctx;
                            }
                        } else if (settings.mode === 'highlight') {
                            $tmpcnvs.hide();
                            if (!notUsingExCanvas) {
                                ctx.globalCompositeOperation = 'source-over';
                                ctx.strokeStyle = 'rgba(255, 255, 0, 0.05)';
                            }
                            ctx.globalAlpha = 0.3;
                            ctx.fillStyle = 'rgba(255, 204, 0, 0.05)';
                            ctx.lineWidth = 5;
                            myctx = ctx;
                        } else if (settings.mode === 'clear') {
                            if (!notUsingExCanvas) {
                                $cnvs.trigger('canvasdraw.addctxhistory', [true]);
                                if (settings.scope && settings.method !== 'passive') {
                                    //settings.scope.$broadcast('canvaspush', {'canvasdraw.addctxhistory': true, id: $cnvs.attr('id')});
                                    settings.scope.$broadcast('canvaspush', {'event' :'canvasdraw.addctxhistory', 'data':[true], id: $cnvs.attr('id')});
                                }
                            }
                            ctx.save();
                            ctx.setTransform(1, 0, 0, 1, 0, 0);
                            ctx.clearRect(0, 0, $cnvs.width(), $cnvs.height());
                            ctx.restore();
                            $cnvs.trigger('canvasdraw.setmode', [prevMode]);
                            if (settings.scope && settings.method !== 'passive') {
                                //settings.scope.$broadcast('canvaspush', {'canvasdraw.setmode': prevMode, id: $cnvs.attr('id')});
                                settings.scope.$broadcast('canvaspush', {'event' :'canvasdraw.setmode', 'data':[prevMode], id: $cnvs.attr('id')});
                            }
                        } else if (settings.mode === 'type') {
                            if (!notUsingExCanvas) {
                                $tmpcnvs.show();
                                ctx.globalCompositeOperation = 'source-over';
                                ctx.strokeStyle = settings.writemodecolor;
                            }
                            ctx.globalAlpha = 1;
                            ctx.font = "16px Arial";
                            ctx.fillStyle = settings.writemodecolor;
                            ctx.lineWidth = 2;
                            $cnvs.trigger('canvasdraw.setcolor', [settings.writemodecolor]);
                            if (settings.scope && settings.method !== 'passive') {
                                //settings.scope.$broadcast('canvaspush', {'canvasdraw.setcolor': settings.writemodecolor, id: $cnvs.attr('id')});
                                settings.scope.$broadcast('canvaspush', {'event' :'canvasdraw.setcolor', 'data':[settings.writemodecolor], id: $cnvs.attr('id')});
                            }
                            if (!notUsingExCanvas) {
                                myctx = tmpctx;
                            } else {
                                myctx = ctx;
                            }
                        }
                    });
                    $cnvs.on('canvasdraw.paintcnvs', function (e, ppts) {
                        var b, i, c, d;
                        if (myctx) {
                            if (ppts.length < 3) {
                                b = ppts[0];
                                myctx.beginPath();
                                myctx.arc(b.x, b.y, tmpctx.lineWidth / 2, 0, Math.PI * 2, true);
                                myctx.fill();
                                myctx.closePath();
                                return;
                            }
                            myctx.beginPath();
                            myctx.moveTo(ppts[0].x, ppts[0].y);
                            for (i = 1; i < ppts.length - 2; i++) {
                                c = (ppts[i].x + ppts[i + 1].x) / 2;
                                d = (ppts[i].y + ppts[i + 1].y) / 2;
                                myctx.quadraticCurveTo(ppts[i].x, ppts[i].y, c, d);
                            }
                            myctx.quadraticCurveTo(
                                ppts[i].x,
                                ppts[i].y,
                                ppts[i + 1].x,
                                ppts[i + 1].y
                            );
                            myctx.stroke();
                        }
                    });
                    $cnvs.on('canvasdraw.startlinedraw', function () {
                        drawLine = true;
                        tmpctx.clearRect(0, 0, $tmpcnvs.width(), $tmpcnvs.height());
                    });
                    $cnvs.on('canvasdraw.linepoints', function (e, data) {
                        var clearwidth = $cnvs.width(), clearheight = $cnvs.height();
                        if (data.cw && data.ch) {
                            data.x0 = data.x0 * data.cw / width;
                            data.y0 = data.y0 * data.ch / height;
                            data.x = data.x * data.cw / width;
                            data.y = data.y * data.ch / height;
                        }
                        if (clearwidth <= 0 || clearheight <= 0) {
                            clearwidth = width;
                            clearheight = height;
                        }
                        tmpctx.clearRect(0, 0, clearwidth, clearheight);
                        tmpctx.beginPath();
                        tmpctx.moveTo(data.x0, data.y0);
                        tmpctx.lineTo(data.x, data.y);
                        tmpctx.stroke();
                        tmpctx.closePath();
                    });
                    $cnvs.on('canvasdraw.stoplinedraw', function () {
                        if (!notUsingExCanvas) {
                            ctx.drawImage($tmpcnvs[0], 0, 0);
                        }
                        tmpctx.clearRect(0, 0, $tmpcnvs.width(), $tmpcnvs.height());
                        mouse = {x: 0, y: 0};
                    });
                    $cnvs.on('canvasdraw.startpath', function () {
                        tmpctx.clearRect(0, 0, $tmpcnvs.width(), $tmpcnvs.height());
                        ppts = [];
                    });
                    $cnvs.on('canvasdraw.pathpoints', function (e, data) {
                        if (data.cw && data.ch) {
                            data.x = data.x * data.cw / width;
                            data.y = data.y * data.ch / height;
                        }
                        ppts.push({x: data.x, y: data.y});
                        $cnvs.trigger('canvasdraw.paintcnvs', [ppts]);
                    });
                    $cnvs.on('canvasdraw.stoppath', function () {
                        if (!notUsingExCanvas) {
                            ctx.drawImage($tmpcnvs[0], 0, 0);
                        }
                        tmpctx.clearRect(0, 0, $tmpcnvs.width(), $tmpcnvs.height());
                        mouse = {x: 0, y: 0};
                        ppts = [];
                    });
                    $cnvs.on('canvasdraw.startextarea', function () {
                        tmpctx.clearRect(0, 0, $tmpcnvs.width(), $tmpcnvs.height());
                    });
                    $cnvs.on('canvasdraw.textareapoints', function (e, data) {
                        var clearwidth = $tmpcnvs.width(), clearheight = $tmpcnvs.height();
                        if (data.cw && data.ch) {
                            data.x = data.x * data.cw / width;
                            data.y = data.y * data.ch / height;
                            data.w = data.w * data.cw / width;
                            data.h = data.h * data.ch / height;
                        }
                        if (clearwidth <= 0 || clearheight <= 0) {
                            clearwidth = width;
                            clearheight = height;
                        }
                        tmpctx.clearRect(0, 0, clearwidth, clearheight);
                        rect = {x: data.x, y: data.y, w: data.w, h: data.h};
                        tmpctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
                    });
                    $cnvs.on('canvasdraw.drawtextarea', function (e, rect) {
                        var $cnvstxtarea = $workarea.find('#txtr_' + $cnvs.attr('id')),
                            $txtArea,
                            $btnSave,
                            $btnCancel;
                        if ($cnvstxtarea.length === 1) {
                            $cnvstxtarea.css({top: rect.x, left: rect.y, width: rect.w, height: rect.h});
                        } else {
                            $cnvstxtarea = $('<div id="txtr_' + $cnvs.attr('id') + '" class="cnvstxtarea" />').css({position: 'absolute', top: rect.x, left: rect.y, width: rect.w, height: rect.h + 25, margin: 0, padding: 0});
                            $txtArea = $('<textarea class="form-control" />').css({height: rect.h});
                            $btnSave = $('<button class="btn btn-xs btn-primary">save</button>');
                            $btnCancel = $('<button class="btn btn-xs">cancel</button>');
                            if (settings.method !== 'active') {
                                $txtArea.attr('disabled', 'disabled');
                                $btnSave.attr('disabled', 'disabled');
                                $btnCancel.attr('disabled', 'disabled');
                            } else {
                                $txtArea.on('change keyup paste keypress', function () {
                                    var currentVal = $(this).val();
                                    if (currentVal === txtAreaOldVal) {
                                        return;
                                    }
                                    txtAreaOldVal = $(this).val();
                                    if (settings.scope) {
                                        //settings.scope.$broadcast('canvaspush', {'canvasdraw.updatetextarea': $(this).val(), id: $cnvs.attr('id')});
                                        settings.scope.$broadcast('canvaspush', {'event' :'canvasdraw.updatetextarea', 'data':[$(this).val()], id: $cnvs.attr('id')});
                                    }
                                });
                            }
                            $btnSave.click(function () {
                                $cnvs.trigger('canvasdraw.savetextarea', [{val: $txtArea.val(), rect: rect, id: $cnvs.attr('id')}]);
                                if (settings.method === 'active' && settings.scope) {
                                    //settings.scope.$broadcast('canvaspush', {'canvasdraw.savetextarea': {val: $txtArea.val(), rect: rect}, id: $cnvs.attr('id')});
                                    settings.scope.$broadcast('canvaspush', {'event' :'canvasdraw.savetextarea', 'data':[{val: $txtArea.val(), rect: rect}], id: $cnvs.attr('id')});
                                }
                                $btnCancel.trigger('click');
                            });
                            $btnCancel.click(function () {
                                $cnvs.trigger('canvasdraw.removetextarea', [true]);
                                if (settings.method === 'active' && settings.scope) {
                                    //settings.scope.$broadcast('canvaspush', {'canvasdraw.removetextarea': true, id: $cnvs.attr('id')});
                                    settings.scope.$broadcast('canvaspush', {'event' :'canvasdraw.removetextarea', 'data':[true], id: $cnvs.attr('id')});
                                }
                            });
                            $cnvstxtarea.append($txtArea);
                            $cnvstxtarea.append($btnSave);
                            $cnvstxtarea.append($btnCancel);
                            $cnvstxtarea.insertAfter($tmpcnvs);
                            //$workarea.append($cnvstxtarea);
                            $txtArea.focus();
                        }
                    });
                    $cnvs.on('canvasdraw.savetextarea', function (e, data) {
                        var txt = $.trim(data.val),
                            tmpLines,
                            lineTxt,
                            lines,
                            rect = data.rect;
                        if (txt.length > 0) {
                            tmpLines = txt.split(/\r?\n/);
                            lineTxt = '';
                            $.each(tmpLines, function (i, tmpLine) {
                                lineTxt += wordwrap($.trim(tmpLine)) + '\n';
                            });
                            lines = $.trim(lineTxt).split(/\n/);
                            $.each(lines, function (i, line) {
                                ctx.fillText(line, rect.x, rect.y + (20 * i));
                            });
                        }
                    });
                    $cnvs.on('canvasdraw.removetextarea', function () {
                        var $cnvstxtarea = $('#txtr_' + $cnvs.attr('id'));
                        $cnvstxtarea.remove();
                    });
                    $cnvs.on('canvasdraw.updatetextarea', function (e, data) {
                        var $txtArea = $('#txtr_' + $cnvs.attr('id') + ' textarea');
                        $txtArea.val(data);
                    });
                    $cnvs.on('canvasdraw.stoptextarea', function () {
                        var clearwidth = $tmpcnvs.width(), clearheight = $tmpcnvs.height();
                        if (rect.w !== 0 && rect.h !== 0) {
                            $cnvs.trigger('canvasdraw.drawtextarea', [rect]);
                        }
                        if (clearwidth <= 0 || clearheight <= 0) {
                            clearwidth = width;
                            clearheight = height;
                        }
                        tmpctx.clearRect(0, 0, clearwidth, clearheight);
                        rect = {x: 0, y: 0, w: 0, h: 0};
                    });
                    $tmpcnvs = $('<canvas />').addClass('tmpcnvs cnvsresize');
                    $tmpcnvs.attr('width', width);
                    $tmpcnvs.attr('height', height);
                    $cnvs.after($tmpcnvs);
                    tmpctx = getContext($tmpcnvs);
                    if (settings.method === 'active') {
                        //Only Instructor can have access on canvas to draw. Student can receive events ...
                        if(settings.usertype == "S") {
                            myevts = {};
                        } else {
                            myevts = {
                                start: 'mousedown touchstart',
                                stop: 'mouseup touchend',
                                move: 'mousemove touchmove',
                                out: 'mouseout.canvasdraw touchleave.canvasdraw'
                            };
                        }
                        $workarea.on('mouseenter.canvasdraw', function () {
                            $(document).on('keydown.canvasdraw', function (e) {
                                if ((e.ctrlKey || e.metaKey) && e.which === 'Z'.charCodeAt()) {
                                    $cnvs.trigger('canvasdraw.undoctxhistory', [true]);
                                    if (settings.scope) {
                                        //settings.scope.$broadcast('canvaspush', {'canvasdraw.undoctxhistory': true, id: $cnvs.attr('id')});
                                        settings.scope.$broadcast('canvaspush', {'event' :'canvasdraw.undoctxhistory', 'data':[true], id: $cnvs.attr('id')});
                                    }
                                }
                            });
                        }).on('mouseleave.canvasdraw', function () {
                            $(document).off('keydown.canvasdraw');
                        });
                        tmpcnvsevts[myevts.start] = function (e) {
                            e.preventDefault();
                            $workarea.on(myevts.out, function () {
                                $tmpcnvs.trigger(myevts.stop);
                            });
                            if (!notUsingExCanvas) {
                                $cnvs.trigger('canvasdraw.addctxhistory', [true]);
                                if (settings.scope) {
                                    //settings.scope.$broadcast('canvaspush', {'canvasdraw.addctxhistory': true, id: $cnvs.attr('id')});
                                    settings.scope.$broadcast('canvaspush', {'event' :'canvasdraw.addctxhistory', 'data':[true], id: $cnvs.attr('id')});
                                }
                            }
                            var parentOffset = $(this).parent().offset(),
                                x0,
                                y0;
                            if (e.originalEvent && e.originalEvent.targetTouches && e.originalEvent.targetTouches.length > 0) {
                                x0 = e.originalEvent.targetTouches[0].pageX - parentOffset.left;
                                y0 = e.originalEvent.targetTouches[0].pageY - parentOffset.top;
                            } else {
                                x0 = e.pageX - parentOffset.left;
                                y0 = e.pageY - parentOffset.top;
                            }
                            drawLine = false;
                            if (e.shiftKey) {
                                $cnvs.trigger('canvasdraw.startlinedraw', [true]);
                                if (settings.scope) {
                                    //settings.scope.$broadcast('canvaspush', {'canvasdraw.startlinedraw': true, id: $cnvs.attr('id')});
                                    settings.scope.$broadcast('canvaspush', {'event' :'canvasdraw.startlinedraw', 'data':[true], id: $cnvs.attr('id')});
                                }
                            } else {
                                if (settings.mode === 'write') {
                                    $cnvs.trigger('canvasdraw.startpath', [true]);
                                    if (settings.scope) {
                                        //settings.scope.$broadcast('canvaspush', {'canvasdraw.startpath': true, id: $cnvs.attr('id')});
                                        settings.scope.$broadcast('canvaspush', {'event' :'canvasdraw.startpath', 'data':[true], id: $cnvs.attr('id')});
                                    }
                                } else {
                                    $cnvs.trigger('canvasdraw.startextarea', [true]);
                                    /*if (settings.scope) {
                                     //settings.scope.$broadcast('canvaspush', {'canvasdraw.startextarea': true, id: $cnvs.attr('id')});
                                     settings.scope.$broadcast('canvaspush', {'event' :'canvasdraw.startextarea', 'data':[true], id: $cnvs.attr('id')});
                                     }*/
                                }
                            }
                            $(this).on(myevts.move, function (e) {
                                e.preventDefault();
                                if (e.originalEvent && e.originalEvent.targetTouches && e.originalEvent.targetTouches.length > 0) {
                                    mouse.x = e.originalEvent.targetTouches[0].pageX - parentOffset.left;
                                    mouse.y = e.originalEvent.targetTouches[0].pageY - parentOffset.top;
                                } else {
                                    mouse.x = e.pageX - parentOffset.left;
                                    mouse.y = e.pageY - parentOffset.top;
                                }
                                if (!isNaN(mouse.x) && !isNaN(mouse.y)) {
                                    if (settings.mode === 'write') {
                                        if (!drawLine) {
                                            $cnvs.trigger('canvasdraw.pathpoints', [{x: mouse.x, y: mouse.y}]);
                                            if (settings.scope) {
                                                //settings.scope.$broadcast('canvaspush', {'canvasdraw.pathpoints': {x: mouse.x, y: mouse.y, cw: width, ch: height}, id: $cnvs.attr('id')});
                                                settings.scope.$broadcast('canvaspush', {'event' :'canvasdraw.pathpoints', 'data':[{x: mouse.x, y: mouse.y, cw: width, ch: height}], id: $cnvs.attr('id')});
                                            }
                                        } else {
                                            $cnvs.trigger('canvasdraw.linepoints', [{x0: x0, y0: y0, x: mouse.x, y: mouse.y}]);
                                            if (settings.scope) {
                                                //settings.scope.$broadcast('canvaspush', {'canvasdraw.linepoints': {x0: x0, y0: y0, x: mouse.x, y: mouse.y, cw: width, ch: height}, id: $cnvs.attr('id')});
                                                settings.scope.$broadcast('canvaspush', {'event' :'canvasdraw.linepoints', 'data':[{x0: x0, y0: y0, x: mouse.x, y: mouse.y, cw: width, ch: height}], id: $cnvs.attr('id')});
                                            }
                                        }
                                    } else if (settings.mode === 'type') {
                                        $cnvs.trigger('canvasdraw.textareapoints', [{x: Math.min(mouse.x, x0), y: Math.min(mouse.y, y0), w: Math.abs(mouse.x - x0), h: Math.abs(mouse.y - y0)}]);
                                        /*if (settings.scope) {
                                         //settings.scope.$broadcast('canvaspush', {'canvasdraw.textareapoints': {x: Math.min(mouse.x, x0), y: Math.min(mouse.y, y0), w: Math.abs(mouse.x - x0), h: Math.abs(mouse.y - y0), cw: width, ch: height}, id: $cnvs.attr('id')});
                                         settings.scope.$broadcast('canvaspush', {'event' :'canvasdraw.textareapoints', 'data':[{x: Math.min(mouse.x, x0), y: Math.min(mouse.y, y0), w: Math.abs(mouse.x - x0), h: Math.abs(mouse.y - y0), cw: width, ch: height}], id: $cnvs.attr('id')});
                                         }*/
                                    }
                                }
                            });
                            $(this).trigger(myevts.move);
                        };
                        tmpcnvsevts[myevts.stop] = function (e) {
                            e.preventDefault();
                            $(this).off(myevts.move);
                            $workarea.off(myevts.out);
                            if (settings.mode === 'write') {
                                if (!drawLine) {
                                    $cnvs.trigger('canvasdraw.stoppath', [true]);
                                    if (settings.scope) {
                                        //settings.scope.$broadcast('canvaspush', {'canvasdraw.stoppath': true, id: $cnvs.attr('id')});
                                        settings.scope.$broadcast('canvaspush', {'event' :'canvasdraw.stoppath', 'data':[true], id: $cnvs.attr('id')});
                                    }
                                } else {
                                    $cnvs.trigger('canvasdraw.stoplinedraw', [true]);
                                    if (settings.scope) {
                                        settings.scope.$broadcast('canvaspush', {'canvasdraw.stoplinedraw': true, id: $cnvs.attr('id')});
                                    }
                                }
                            } else if (settings.mode === 'type') {
                                $cnvs.trigger('canvasdraw.stoptextarea', [true]);
                                /*if (settings.scope) {
                                 //settings.scope.$broadcast('canvaspush', {'canvasdraw.stoptextarea': true, id: $cnvs.attr('id')});
                                 settings.scope.$broadcast('canvaspush', {'event' :'canvasdraw.stoptextarea', 'data':[true], id: $cnvs.attr('id')});
                                 }*/
                            }
                        };
                        $tmpcnvs.on(tmpcnvsevts);
                        cnvsevts[myevts.start] = function (e) {
                            e.preventDefault();
                            $workarea.on(myevts.out, function () {
                                $cnvs.trigger(myevts.stop);
                            });
                            if (!notUsingExCanvas) {
                                $cnvs.trigger('canvasdraw.addctxhistory', [true]);
                                if (settings.scope) {
                                    //settings.scope.$broadcast('canvaspush', {'canvasdraw.addctxhistory': true, id: $cnvs.attr('id')});
                                    settings.scope.$broadcast('canvaspush', {'event' :'canvasdraw.addctxhistory', 'data':[true], id: $cnvs.attr('id')});
                                }
                            }
                            $cnvs.trigger('canvasdraw.startpath', [true]);
                            if (settings.scope) {
                                //settings.scope.$broadcast('canvaspush', {'canvasdraw.startpath': true, id: $cnvs.attr('id')});
                                settings.scope.$broadcast('canvaspush', {'event' :'canvasdraw.startpath', 'data':[true], id: $cnvs.attr('id')});
                            }
                            $(this).on(myevts.move, function (e) {
                                e.preventDefault();
                                var parentOffset = $(this).parent().offset();
                                if (e.originalEvent && e.originalEvent.targetTouches && e.originalEvent.targetTouches.length > 0) {
                                    mouse.x = e.originalEvent.targetTouches[0].pageX - parentOffset.left;
                                    mouse.y = e.originalEvent.targetTouches[0].pageY - parentOffset.top;
                                } else {
                                    mouse.x = e.pageX - parentOffset.left;
                                    mouse.y = e.pageY - parentOffset.top;
                                }
                                if (!isNaN(mouse.x) && !isNaN(mouse.y)) {
                                    $cnvs.trigger('canvasdraw.pathpoints', [{x: mouse.x, y: mouse.y}]);
                                    if (settings.scope) {
                                        //settings.scope.$broadcast('canvaspush', {'canvasdraw.pathpoints': {x: mouse.x, y: mouse.y, cw: width, ch: height}, id: $cnvs.attr('id')});
                                        settings.scope.$broadcast('canvaspush', {'event' :'canvasdraw.pathpoints', 'data':[{x: mouse.x, y: mouse.y, cw: width, ch: height}], id: $cnvs.attr('id')});
                                    }
                                }
                            });
                            $(this).trigger(myevts.move);
                        };
                        cnvsevts[myevts.stop] = function (e) {
                            e.preventDefault();
                            $(this).off(myevts.move);
                            $workarea.off(myevts.out);
                            $cnvs.trigger('canvasdraw.stoppath', [true]);
                            if (settings.scope) {
                                //settings.scope.$broadcast('canvaspush', {'canvasdraw.stoppath': true, id: $cnvs.attr('id')});
                                settings.scope.$broadcast('canvaspush', {'event' :'canvasdraw.stoppath', 'data':[true], id: $cnvs.attr('id')});
                            }
                        };
                        $cnvs.on(cnvsevts);
                    }
                    $cnvs.trigger('canvasdraw.setmode', [settings.mode]);
                }
            } catch (e) { console.log(e); }
        });
    };
    $.fn.canvasdraw.defaults = {
        mode: 'write',
        writemodecolor: '#000000',
        method: 'passive',
        fixedsize: {width: 846, height: 579},
        scope: null,
        usertype:"I"
    };
}(jQuery));
