$(document).ready(function () {
    var model = new calculator.domain.Operations();
    var sinModel = new calculator.domain.Sins();
    var view = new calculator.view.Calculator();
    var controller = new calculator.controller.CalculatorController();
    var sinController = new calculator.controller.SinController();
    var parsingService = new calculator.service.ParsingService();
    var plottingService = new calculator.service.PlottingService();
    var cachingService = new calculator.service.CachingService();
    var simplifyingService = new calculator.service.SimplifyingService();
    view.setController(controller);
    model.setView(view);
    model.setCachingService(cachingService);
    sinModel.setView(view);
    sinModel.setCachingService(cachingService);
    controller.setModel(model);
    controller.setParsingService(parsingService);
    controller.setSimplifyingService(simplifyingService);
    controller.setView(view);
    sinController.setModel(sinModel);
    sinController.setPlottingService(plottingService);
    sinController.setView(view);
    view.setSubmitListener();
    view.setSinSubmitListener();
    view.setCachingSubmitListener();
    view.setSimplifyListener();
    view.setResetListener();
    view.setSinController(sinController);
    view.setCanvasParameters(3.14, 400, 300);
    view.setCanvas();
    view.setCanvasCtx();
    view.setCachingService(cachingService);
    parsingService.setController(controller);
    parsingService.setSimplifyingService(simplifyingService);
    plottingService.setController(sinController);
    cachingService.initialize(1000);
    view.updateCurrentCacheSize(1000);
    simplifyingService.setParsingService(parsingService);
    simplifyingService.setCachingService(cachingService);
    simplifyingService.setController(controller);
});
var calculator = {};
calculator.domain = {};
calculator.domain.Operations = (function () {
    function Operations() {
        var view = {};
        var cachingService = {};
        this.getOperation = function (arg1, arg2, op, caller) {
            var arg1NoParentheses = arg1.replace('(', '').replace(')', '');
            var arg2NoParentheses = arg2.replace('(', '').replace(')', '');
            var val = cachingService.lookUp(arg1NoParentheses + op + arg2NoParentheses);
            if (val === undefined) {
                $.ajax({
                    url: "http://localhost:8080/calculate",
                    data: {"arg1": arg1NoParentheses, "arg2": arg2NoParentheses, "op": op},
                    dataType: 'json',
                    success: function (data, textStatus, jqXHR) {
                        cachingService.add([arg1NoParentheses + op + arg2NoParentheses, data]);
                        caller.substitute(data.res);
                        view.update(data);
                    }
                });
            } else {
                view.update(val);
                caller.substitute(val.res);
            }

        };
        this.setView = function (v) {
            view = v;
        };
        this.setCachingService = function (s) {
            cachingService = s;
        };
        this.reset = function () {
            view.reset();
        };
    }
    return Operations;
})();
calculator.domain.Sins = (function () {
    function Sins() {
        var view = {};
        var cachingService = {};
        this.getSin = function (command, caller) {
            $.ajax({
                url: "http://localhost:8080/sin",
                data: {"command": command},
                success: function (data, textStatus, jqXHR) {
                    view.updateSin(data);
                }
            });
        };
        this.getValueForSinFunction = function (input, i, x, caller) {
            var val = cachingService.lookUp(input);
            if (val === undefined) {
                $.ajax({
                    url: "http://localhost:8080/sin",
                    data: {"command": input},
                    dataType: 'json',
                    success: function (data, textStatus, jqXHR) {
                        cachingService.add([input, data.res]);
                        caller.addValue(i, x, data.res);
                    }
                });
            } else {
                caller.addValue(i, x, val);
            }
        };
        this.setView = function (v) {
            view = v;
        };
        this.setCachingService = function (s) {
            cachingService = s;
        };
        this.reset = function () {
            view.reset();
        };
    }
    return Sins;
})();
calculator.view = {};
calculator.view.Calculator = (function () {
    function Calculator() {
        var controller = {};
        var sinController = {};
        var cachingService = {};
        var canvas = {};
        var canvasCtx = {};
        var maxXvalue = {};
        var maxYvalue = {};

        var canvasWidth = {};
        var canvasHeight = {};

        this.update = function (operation) {
            var textNode = document.createTextNode(operation.arg1 + " " + operation.op + " " + operation.arg2 + " = " + operation.res);
            var liElement = document.createElement("li");
            liElement.appendChild(textNode);
            $(liElement).appendTo($("#li-results"));
        };
        this.updateSin = function (data) {
            $("#img-sins").attr("src", "data:image/png;base64," + data);
        };
        this.updateInput = function (data) {
            $("#tb-input").val(data);
        };
        this.updateOriginalInput = function (data) {
            $("#p-original-input").text(data);
        };
        this.updateCurrentCacheSize = function (data) {
            $("#p-current-cache").text(data);
        };
        this.setSubmitListener = function () {
            $("#btn-submit").click(function () {
                this.updateOriginalInput($("#tb-input").val());
                controller.updateModel($("#tb-input").val());
            }.bind(this));
        };
        this.setResetListener = function () {
            $("#btn-reset").click(function () {
                this.updateOriginalInput('');
                controller.reset();
            }.bind(this));
        };
        this.setSinSubmitListener = function () {
            $("#btn-sins-submit").click(function () {
                sinController.updateModel($("#tb-sins-input").val());
            });
        };
        this.setSimplifyListener = function () {
            $("#btn-simplify").click(function () {
                controller.simplify($("#tb-input").val());
            });
        };
        this.setCachingSubmitListener = function () {
            $("#btn-caching-submit").click(function () {
                this.updateCurrentCacheSize($("#tb-caching-input").val());
                cachingService.setMax($("#tb-caching-input").val());
            }.bind(this));
        };
        this.reset = function () {
            $("#li-results").empty();
        };
        this.setController = function (c) {
            controller = c;
        };
        this.setSinController = function (c) {
            sinController = c;
        };
        this.setCachingService = function (s) {
            cachingService = s;
        };
        this.setCanvas = function () {
            canvas = document.getElementById('cv-plot');
            canvas.width = this.canvasWidth;
            canvas.height = this.canvasHeight;
        };
        this.setCanvasCtx = function () {
            canvasCtx = canvas.getContext('2d');
        };
        this.beginCanvasPath = function (point) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(point[0], point[1]);
        };
        this.canvasDrawLineTo = function (point) {
            canvasCtx.lineTo(point[0], point[1]);
        };
        this.closeCanvasPath = function () {
            canvasCtx.stroke();
        };
        this.resetCanvas = function () {
            delete canvas;
            delete canvasCtx;
            delete this.maxYvalue;
            this.setCanvas();
            this.setCanvasCtx();
        };
        this.setCanvasParameters = function (maxX, width, height) {
            this.maxXvalue = maxX;
            this.canvasWidth = width;
            this.canvasHeight = height;
        };
        this.plot = function (data, max) {
            this.resetCanvas();
            this.maxYvalue = max;
            this.beginCanvasPath(this.transformPointForCanvas(data[0]));
            for (var i = 1; i < data.length; i++) {
                this.canvasDrawLineTo(this.transformPointForCanvas(data[i]));
            }
            this.closeCanvasPath();
            this.setMinMaxCanvas();
        };
        this.setMinMaxCanvas = function () {
            canvasCtx.font = '12px serif';
            canvasCtx.fillText(Math.round(this.maxYvalue), 10, 10);
            canvasCtx.fillText(Math.round(-this.maxYvalue), 10, this.canvasHeight - 10);
        };
        this.transformPointForCanvas = function (point) {
            var tx = 0;
            var ty = 0;
            tx = this.canvasWidth / 2;
            tx = tx + (this.canvasWidth / (2 * this.maxXvalue) * point[0]);
            ty = (this.canvasHeight / 2);
            ty = ty - (this.canvasHeight / (2 * this.maxYvalue) * point[1]);
            return [tx, ty];
        };
    }
    return Calculator;
})();
calculator.controller = {};
calculator.controller.CalculatorController = (function () {
    function CalculatorController() {
        var model = {};
        var view = {};
        var parsingService = {};
        var simplifyingService = {};

        this.setModel = function (m) {
            model = m;
        };
        this.getModel = function () {
            return model;
        };
        this.setView = function (v) {
            view = v;
        };
        this.getView = function () {
            return view;
        };
        this.setParsingService = function (s) {
            parsingService = s;
        };
        this.setSimplifyingService = function (s) {
            simplifyingService = s;
        };
        this.reset = function () {
            model.reset();
            parsingService.reset();
        };
        this.simplify = function (input) {
            view.updateInput(simplifyingService.simplify(input));
        };
        this.updateModel = function (input) {
            parsingService.setInput(input);
            parsingService.parseInput();
        };
    }
    return CalculatorController;
})();
calculator.controller.SinController = (function () {
    function SinController() {
        var model = {};
        var plottingService = {};
        var view = {};

        this.setModel = function (m) {
            model = m;
        };
        this.getModel = function () {
            return model;
        };
        this.setView = function (v) {
            view = v;
        };
        this.getView = function () {
            return view;
        };
        this.setPlottingService = function (service) {
            plottingService = service;
        };
        this.reset = function () {
            model.reset();
        };
        this.updateModel = function (input) {
            plottingService.plot(input);
        };
        this.plot = function (input) {
            plottingService.plot(input);
        };
    }
    return SinController;
})();
calculator.service = {};
calculator.service.ParsingService = (function () {
    function ParsingService() {
        var input = {};
        var indexBefore1 = {};
        var indexBefore2 = {};
        var indexAfter1 = {};
        var indexAfter2 = {};
        var controller = {};
        var simplifyingService = {};

        this.setInput = function (input) {
            this.input = input;
        };
        this.setController = function (c) {
            controller = c;
        };
        this.setSimplifyingService = function (s) {
            simplifyingService = s;
        };

        this.reset = function () {
            this.input = {};
            this.indexBefore1 = {};
            this.indexAfter1 = {};
            this.indexBefore2 = {};
            this.indexAfter2 = {};
        };
        this.parseInput = function () {
            this.input = simplifyingService.simplifyRepeatedly(this.input);
            controller.getView().updateInput(this.input);
            if (this.input.includes('+')) {
                this.parseOperator(this.input.indexOf('+'));
                return;
            }
            if (this.indexOfFirstMinusOperator(this.input, 0) !== -1) {
                this.parseOperator(this.indexOfFirstMinusOperator(this.input, 0));
                return;
            }
            if (this.input.includes('*')) {
                this.parseOperator(this.input.indexOf('*'));
                return;
            }
            if (this.input.includes('/')) {
                this.parseOperator(this.input.indexOf('/'));
                return;
            }
        };
        this.parseInputForSimplifying = function (input, triedOperator, lastTriedIndice) {
            if (triedOperator === null) {
                if (input.includes('+')) {
                    return input.indexOf('+');
                }
                if (this.indexOfFirstMinusOperator(input, 0) !== -1) {
                    return this.indexOfFirstMinusOperator(input, 0);
                }
                if (input.includes('*')) {
                    return input.indexOf('*');
                }
                if (input.includes('/')) {
                    return input.indexOf('/');
                }
            } else {
                if (triedOperator === '+') {
                    if (input.includes('+', lastTriedIndice + 1)) {
                        return input.indexOf('+', lastTriedIndice + 1);
                    }
                }
                if (triedOperator === '-') {
                    if (this.indexOfFirstMinusOperator(input, lastTriedIndice + 1) !== -1) {
                        return this.indexOfFirstMinusOperator(input, lastTriedIndice + 1);
                    }
                }
                if (triedOperator === '*') {
                    if (input.includes('*', lastTriedIndice + 1)) {
                        return input.indexOf('*', lastTriedIndice + 1);
                    }
                }
                if (triedOperator === '/') {
                    if (input.includes('/', lastTriedIndice + 1)) {
                        return input.indexOf('/', lastTriedIndice + 1);
                    }
                }
            }
            return -1;
        };
        this.indexOfFirstMinusOperator = function (input, start) {
            if (!input.includes('-'))
                return -1;
            if (!input.includes('('))
                return input.indexOf('-', start);
            while (input.includes('(-')) {
                input = input.replace('(-', '  ');
            }
            if (input.includes('-')) {
                return input.indexOf('-', start);
            }
            return -1;
        };
        this.parseOperator = function (firstIndexOfOperator) {
            if ($.isNumeric(this.input))
                return;
            this.indexBefore1 = this.indexOfNumber(this.input, firstIndexOfOperator, true, true);
            this.indexBefore2 = this.indexOfNumber(this.input, firstIndexOfOperator, true, false);
            this.indexAfter1 = this.indexOfNumber(this.input, firstIndexOfOperator, false, true);
            this.indexAfter2 = this.indexOfNumber(this.input, firstIndexOfOperator, false, false);
            controller.getModel().getOperation(this.input.substring(this.indexBefore1, this.indexBefore2), this.input.substring(this.indexAfter1, this.indexAfter2), this.input[firstIndexOfOperator], this);
        };
        this.parseOperatorForSimplifying = function (input, firstIndexOfOperator) {
            var indexBefore1 = this.indexOfNumber(input, firstIndexOfOperator, true, true);
            var indexBefore2 = this.indexOfNumber(input, firstIndexOfOperator, true, false);
            var indexAfter1 = this.indexOfNumber(input, firstIndexOfOperator, false, true);
            var indexAfter2 = this.indexOfNumber(input, firstIndexOfOperator, false, false);
            var operation = [input.substring(indexBefore1, indexBefore2), input.substring(indexAfter1, indexAfter2), input[firstIndexOfOperator], indexBefore1, indexAfter2];
            return operation;
        };
        this.substitute = function (result) {
            var plus = '';
            if (indexBefore1 - 1 > 0
                    && input[indexBefore1 - 1] !== '-'
                    && input[indexBefore1 - 1] !== '+'
                    && input[indexBefore1 - 1] !== '*'
                    && input[indexBefore1 - 1] !== '/') {
                plus = '+';
            }
            if (result < 0)
                result = '(' + result + ')';
            this.input = this.input.substring(0, this.indexBefore1) + plus + result + this.input.substring(this.indexAfter2, this.input.length);
            this.parseInput();
        };
        this.substituteForSimplifying = function (input, result, indexBefore1, indexAfter2) {
            var plus = '';
            if (indexBefore1 - 1 > 0
                    && input[indexBefore1 - 1] !== '-'
                    && input[indexBefore1 - 1] !== '+'
                    && input[indexBefore1 - 1] !== '*'
                    && input[indexBefore1 - 1] !== '/') {
                plus = '+';
            }
            if (result < 0) {
                result = '(' + result + ')';
            }
            return input.substring(0, indexBefore1) + plus + result + input.substring(indexAfter2, input.length);
        };
        this.indexOfNumber = function (input, index, before, beginning) {
            var retValue = index;
            while (!$.isNumeric(input[retValue])) {
                if (before) {
                    retValue--;
                    if (input[retValue] === ')' && !beginning)
                        return retValue + 1;
                }
                else {
                    retValue++;
                    if (input[retValue] === '(' && beginning)
                        return retValue;
                }
            }
            if (!before && beginning)
                return retValue;
            if (before && !beginning)
                return retValue + 1;
            while ($.isNumeric(input[retValue]) || input[retValue] === '.') {
                if (beginning) {
                    retValue--;
                    if (input[retValue] === '-' && input[retValue - 1] === '(') {
                        return retValue - 1;
                    }
                }
                else {
                    retValue++;
                    if (input[retValue] === ')') {
                        return retValue + 1;
                    }
                }
            }
            if (before && beginning && input[retValue] === '-') {
                return retValue;
            }
            if (beginning)
                return retValue + 1;
            return retValue;
        };
    }
    return ParsingService;
})();
calculator.service.PlottingService = (function () {
    function PlottingService() {
        var controller = {};

        var data = {};
        var max = {};

        this.setController = function (c) {
            controller = c;
        };
        this.getController = function () {
            return controller;
        };
        this.getData = function () {
            return this.data;
        };
        this.getMax = function () {
            return this.max;
        };
        this.plot = function (input) {
            this.data = [];
            this.max = 0;
            var i = 0;
            for (var x = -3.14; x <= 3.14; x = x + 0.01) {
                controller.getModel().getValueForSinFunction(input.replace('x', x), i, x, this);
                i++;
            }
            this.waitForValues(this);
        };
        this.waitForValues = function () {
            var thisController = this;
            setTimeout(function () {
                thisController.testFunction(thisController);
            }, 400);
        };
        this.testFunction = function (service) {
            function allValuesReceived() {
                for (var j = 628; j >= 0; j--) {
                    if (!$.isArray(service.getData()[j])) {
                        return false;
                    }
                }
                return true;
            }
            if (allValuesReceived()) {
                service.getController().getView().plot(service.getData(), service.getMax());
            }
            else {
                service.waitForValues();
            }
        };
        this.addValue = function (i, argument, value) {
            if (Math.abs(value) > this.max) {
                this.max = Math.abs(value);
            }
            this.data[i] = [argument, value];
        };
    }
    return PlottingService;
})();
calculator.service.CachingService = (function () {
    function CachingService() {
        var array = {};
        var map = {};
        var maxSize = {};

        this.initialize = function (maxSize) {
            this.array = [];
            this.map = new Map();
            this.maxSize = maxSize;
        };
        this.lookUp = function (key) {
            var toBeReturned = this.map.get(key);
            this.resize();
            return toBeReturned;
        };
        this.add = function (cacheItem) {
            this.array.push(cacheItem[0]);
            this.map.set(cacheItem[0], cacheItem[1]);
            this.resize();
        };
        this.resize = function () {
            while (this.array.length > this.maxSize) {
                var toBeRemoved = this.array.shift();
                this.map.delete(toBeRemoved);
            }
        };
        this.setMax = function (input) {
            this.maxSize = parseInt(input);
            this.resize();
        };
    }
    return CachingService;
})();
calculator.service.SimplifyingService = (function () {
    function SimplifyingService() {
        var parsingService = {};
        var cachingService = {};
        var controller = {};

        this.setParsingService = function (s) {
            parsingService = s;
        };
        this.setCachingService = function (s) {
            cachingService = s;
        };
        this.setController = function (c) {
            controller = c;
        };
        this.simplify = function (input) {
            var triedOperator = null;
            var lastTriedIndice = null;
            while (true) {
                var index = parsingService.parseInputForSimplifying(input, triedOperator, lastTriedIndice);
                if (index !== -1) {
                    lastTriedIndice = index;
                    triedOperator = input[index];
                    var operationAndIndices = parsingService.parseOperatorForSimplifying(input, index);
                    var arg1NoParentheses = operationAndIndices[0].replace('(', '').replace(')', '');
                    var arg2NoParentheses = operationAndIndices[1].replace('(', '').replace(')', '');
                    var val = cachingService.lookUp(arg1NoParentheses + operationAndIndices[2] + arg2NoParentheses);
                    if (val !== undefined) {
                        controller.getView().update(val);
                        return parsingService.substituteForSimplifying(input, val.res, operationAndIndices[3], operationAndIndices[4]);
                    } else {
                        continue;
                    }
                } else {
                    return input;
                }
            }
        };
        this.simplifyRepeatedly = function (input) {
            var inputVersion1 = input;
            var inputVersion2 = input;
            inputVersion2 = this.simplify(input);
            while (inputVersion1 !== inputVersion2) {
                inputVersion1 = inputVersion2;
                inputVersion2 = this.simplify(inputVersion1);
            }
            return inputVersion2;
        };
    }
    return SimplifyingService;
})();