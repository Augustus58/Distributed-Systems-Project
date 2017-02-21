$(document).ready(function () {
    // Initialize the application.
    var initialCacheSize = 1000;
    var operationModel = new calculator.domain.Operations();
    var sineModel = new calculator.domain.Sines();
    var view = new calculator.view.Calculator();
    var calculatorController = new calculator.controller.CalculatorController();
    var sinController = new calculator.controller.SineController();
    var parsingService = new calculator.service.ParsingService();
    var plottingService = new calculator.service.PlottingService();
    var cachingService = new calculator.service.CachingService();
    var simplifyingService = new calculator.service.SimplifyingService();
    view.setController(calculatorController);
    operationModel.setView(view);
    operationModel.setCachingService(cachingService);
    sineModel.setView(view);
    sineModel.setCachingService(cachingService);
    calculatorController.setModel(operationModel);
    calculatorController.setParsingService(parsingService);
    calculatorController.setSimplifyingService(simplifyingService);
    calculatorController.setView(view);
    sinController.setModel(sineModel);
    sinController.setPlottingService(plottingService);
    sinController.setView(view);
    view.setSubmitListener();
    view.setSinSubmitListener();
    view.setCachingSubmitListener();
    view.setSimplifyListener();
    view.setResetListener();
    view.setSinController(sinController);
    view.setCanvasParameters(3.14, 400, 300);
    view.initializeCanvas();
    view.setCanvasCtx();
    view.setCachingService(cachingService);
    parsingService.setController(calculatorController);
    parsingService.setSimplifyingService(simplifyingService);
    plottingService.setController(sinController);
    cachingService.initialize(initialCacheSize);
    view.updateCurrentCacheSize(initialCacheSize);
    simplifyingService.setParsingService(parsingService);
    simplifyingService.setCachingService(cachingService);
    simplifyingService.setController(calculatorController);
});
var calculator = {};
calculator.domain = {};
// Model for operations.
calculator.domain.Operations = (function () {
    function Operations() {
        var view = {};
        var cachingService = {};
        this.getOperation = function (arg1, arg2, op, caller) {
            var arg1NoParentheses = arg1.replace('(', '').replace(')', '');
            var arg2NoParentheses = arg2.replace('(', '').replace(')', '');
            // First lookup from the cachingService.
            var val = cachingService.lookUp(arg1NoParentheses + op + arg2NoParentheses);
            // If lookup failed, get a result for operation from the server and update the cache.
            if (val === undefined) {
                $.ajax({
                    url: "http://localhost:8080/calculate",
                    data: {"arg1": arg1NoParentheses, "arg2": arg2NoParentheses, "op": op},
                    dataType: 'json',
                    success: function (data, textStatus, jqXHR) {
                        // Update the cache.
                        cachingService.add([arg1NoParentheses + op + arg2NoParentheses, data]);
                        // Call substitute method from caller.
                        caller.substitute(data.res);
                        // Update view.
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
// Model for sines.
calculator.domain.Sines = (function () {
    function Sines() {
        var view = {};
        var cachingService = {};
        // Get plot pic for the command from the server.
        this.getSin = function (command, caller) {
            $.ajax({
                url: "http://localhost:8080/sin",
                data: {"command": command},
                success: function (data, textStatus, jqXHR) {
                    // Update the view.
                    view.updateSine(data);
                }
            });
        };
        // Get single value for single operation.
        this.getValueForSinFunction = function (input, i, x, caller) {
            // If value for the operation is found from the cache, no ajax call is sent.
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
                // Call callers addValue method.
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
    return Sines;
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

        // Update intermediate results list.
        this.update = function (operation) {
            var textNode = document.createTextNode(operation.arg1 + " " + operation.op + " " + operation.arg2 + " = " + operation.res);
            var liElement = document.createElement("li");
            liElement.appendChild(textNode);
            $(liElement).appendTo($("#li-results"));
        };
        // Update the whole sine img.
        this.updateSine = function (data) {
            $("#img-sins").attr("src", "data:image/png;base64," + data);
        };
        this.updateInput = function (data) {
            $("#tb-input").val(data);
        };
        // Update original input p element.
        this.updateOriginalInput = function (data) {
            $("#p-original-input").text(data);
        };
        // Update p element informing about current cache size.
        this.updateCurrentCacheSize = function (data) {
            $("#p-current-cache").text(data);
        };
        // Set listeners for the ui.
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
        // Reset the intermediate results list.
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
        this.setCanvasParameters = function (maxX, width, height) {
            this.maxXvalue = maxX;
            this.canvasWidth = width;
            this.canvasHeight = height;
        };
        // Initialize canvas.
        this.initializeCanvas = function () {
            canvas = document.getElementById('cv-plot');
            canvas.width = this.canvasWidth;
            canvas.height = this.canvasHeight;
        };
        // Set context for the canvas.
        this.setCanvasCtx = function () {
            canvasCtx = canvas.getContext('2d');
        };
        // Begin path on the canvas.
        this.beginCanvasPath = function (point) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(point[0], point[1]);
        };
        // Draw line from path end point to given point.
        this.canvasDrawLineTo = function (point) {
            canvasCtx.lineTo(point[0], point[1]);
        };
        // Close the path on the canvas.
        this.closeCanvasPath = function () {
            canvasCtx.stroke();
        };
        // Reset canvas.
        this.resetCanvas = function () {
            delete canvas;
            delete canvasCtx;
            delete this.maxYvalue;
            this.initializeCanvas();
            this.setCanvasCtx();
        };
        // Plot the data on the canvas.
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
        // Draw values implying plotting value range.
        this.setMinMaxCanvas = function () {
            canvasCtx.font = '12px serif';
            canvasCtx.fillText(Math.round(this.maxYvalue), 10, 10);
            canvasCtx.fillText(Math.round(-this.maxYvalue), 10, this.canvasHeight - 10);
        };
        // Transform traditional point to point suitable for the canvas.
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
calculator.controller.SineController = (function () {
    function SineController() {
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
    return SineController;
})();
calculator.service = {};
// Service for parsing inputs. Helps also in simplifying.
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
        // Start parsing by choosing an operator for calculating an operation.
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
        // Some indice of an operator is given. This method is responsible
        // for searhing arguments for the operation. Additionally
        // result for the operation is requested from the operations model.
        // Reference to this is offered, because in the model substitution
        // method of this is used.
        this.parseOperator = function (firstIndexOfOperator) {
            if ($.isNumeric(this.input))
                return;
            this.indexBefore1 = this.indexOfArgument(this.input, firstIndexOfOperator, true, true);
            this.indexBefore2 = this.indexOfArgument(this.input, firstIndexOfOperator, true, false);
            this.indexAfter1 = this.indexOfArgument(this.input, firstIndexOfOperator, false, true);
            this.indexAfter2 = this.indexOfArgument(this.input, firstIndexOfOperator, false, false);
            controller.getModel().getOperation(this.input.substring(this.indexBefore1, this.indexBefore2), this.input.substring(this.indexAfter1, this.indexAfter2), this.input[firstIndexOfOperator], this);
        };
        // This method is used for substituting a result of an operation
        // to the input.
        // If substitution is not to be substituted to the begeinning of the
        // input, then it is checked that is there need for inserting '+' char
        // just before the result being substituted.
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
        // Returns an primary operator index (first one with highest priority)
        // from the input.
        // If in the simplifying service some operation was already
        // searched from the cache and not found,
        // then only operator indices relating to the same operator
        // used in the searhed operation (indice points to an same operator
        // in the input) are allowed. Cannot simplify operations with lower
        // priority if some operation with higher priority cannot be found from
        // the cache.
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
        // Some indice of an operator is given. Also an input is given.
        // This method is responsible
        // for searhing arguments for the operation from the input.
        // Additionally the parsed operation is returned along with
        // indices pointing to starting index of the operation in the input
        // and to ending index (index which points to first char just after
        // the operation) of the operation in the input.
        this.parseOperatorForSimplifying = function (input, firstIndexOfOperator) {
            var indexBefore1 = this.indexOfArgument(input, firstIndexOfOperator, true, true);
            var indexBefore2 = this.indexOfArgument(input, firstIndexOfOperator, true, false);
            var indexAfter1 = this.indexOfArgument(input, firstIndexOfOperator, false, true);
            var indexAfter2 = this.indexOfArgument(input, firstIndexOfOperator, false, false);
            var operation = [input.substring(indexBefore1, indexBefore2), input.substring(indexAfter1, indexAfter2), input[firstIndexOfOperator], indexBefore1, indexAfter2];
            return operation;
        };
        // This method is used for substituting a result of an operation
        // to an input for the simplifying service.
        // If substitution is not to be substituted to the begeinning of the
        // input, then it is checked that is there need for inserting '+' char just
        // before the result being substituted.
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
        // Special method for finding first minus operator starting from some
        // indice. This is needed, because there can be e.g. "+(-4)*" strings
        // in input strings. I.e. '-' is not an operator in all cases.
        this.indexOfFirstMinusOperator = function (input, start) {
            if (!input.includes('-'))
                return -1;
            if (!input.includes('(', start))
                return input.indexOf('-', start);
            while (input.includes('(-')) {
                input = input.replace('(-', '  ');
            }
            if (input.includes('-', start)) {
                return input.indexOf('-', start);
            }
            return -1;
        };
        // This method is used for searching argument indices for operations.
        // Starting and ending indices for arg1 are needed. Furthermore
        // Starting and ending indices for arg2 are needed.
        // Argument index refers to index pointing to the operator in the input
        // string. If argument before is true, then arg1 is in question.
        // Furthermore if if argument before is false, then arg2 is in question.
        // And if argument beginning is true, then starting index of an
        // operation argument is in question. Furthermore if argument beginning
        // is false, then ending index of an
        // operation argument is in question.
        this.indexOfArgument = function (input, index, before, beginning) {
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
// Service for plotting functions following n*sin(x) form.
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
        // Method for plotting. Step is hardcoded to be 0.01.
        // Value of function with some argument is requested from the model.
        // Model automatically asks for it from the caching service.
        // At the end of the method waitForValues method is called.
        // Purpose for that is to wait for all values. Plotting in the view
        // is designed so that all values must be there before starting
        // actual plotting.
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
        // Method for checking that is all values there for plotting.
        // Waits 400ms and checks.
        this.waitForValues = function () {
            var thisController = this;
            setTimeout(function () {
                thisController.testFunction(thisController);
            }, 400);
        };
        // Method for testing that are all values received. Starting checking
        // from the end of the array, because it is assumed that
        // the array gets filled from the beginning first.
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
        // Method for adding a value to the array holding values to be plotted.
        this.addValue = function (i, argument, value) {
            if (Math.abs(value) > this.max) {
                this.max = Math.abs(value);
            }
            this.data[i] = [argument, value];
        };
    }
    return PlottingService;
})();
// Service for caching.
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
        // If the cache is too big, it is shortened to fit the
        // maxSize.
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
        // Try to simplify the input. If some operation is searched from the
        // cache, then next search operations can be only done with same
        // operator as in the earlier searched operation.
        // Parsing service is utilized for searching for operations to be
        // searched from the cache.
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
        // Do as many simplifications as possible.
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