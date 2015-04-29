/*jshint browser: true */
/*globals _: false, FastClick: false */
(function () {

    'use strict';

    /**
     * Sets up hooks to run before and after objects' methods.
     */
    var advise = (function () {
        var objects = [];
        var runAdvices = function (advices) {
            _.forEach(advices, function (fn) {
                fn();
            });
        };
        var getAdvisingFunction = function (mutateAdviceData) {
            return function (object, methodName, advice) {
                var entry = _.find(objects, function (entry) {
                    return entry.object === object;
                });
                if (entry === undefined) {
                    entry = {
                        object: object,
                        methods: {}
                    };
                }
                var data;
                if (entry.methods.hasOwnProperty(methodName)) {
                    data = entry.methods[methodName];
                } else {
                    data = {
                        method: object[methodName],
                        before: [],
                        after: []
                    };
                    entry.methods[methodName] = data;
                }
                mutateAdviceData(data, advice);
                var method = data.method;
                object[methodName] = function () {
                    runAdvices(data.before);
                    method.apply(this, arguments);
                    runAdvices(data.after);
                };
            };
        };
        var before = getAdvisingFunction(function (data, advice) {
            data.before.unshift(advice);
        });
        var after = getAdvisingFunction(function (data, advice) {
            data.after.push(advice);
        });
        return {
            before: before,
            after: after
        };
    }());

    /**
     * Inserts a string into a target string, replacing characters in the string
     * up to the length of the inserted string. (Works like the INSERT key.)
     * Also, it always replaces at least 1 character.
     */
    var insertString = function (target, string, index) {
        // Length should always be treated as at least 1
        var length = (string.length > 0) ? string.length : 1;
        return target.substring(0, index) + string + target.substring(index + length);
    };

    /**
     * Writes an object to localStorage after a delay.
     */
    var queuePersist = (function () {
        var delay = 300;
        var queue = {};
        var cancel = clearTimeout;
        return function queuePersist(key, value) {
            if (queue.hasOwnProperty(key)) {
                var previouslyQueued = queue[key];
                cancel(previouslyQueued);
            }
            queue[key] = setTimeout(function () {
                localStorage.setItem(key, JSON.stringify(value));
            }, delay);
        };
    }());

    var unpersist = function (key) {
        return JSON.parse(localStorage.getItem(key));
    };

    /**
     * Abstract representation of a Yugioh player.
     */
    var makePlayer = function (spec) {
        var self = {};
        self.id = spec.id;
        self.lifePoints = spec.lifePoints === undefined ? 8000 : spec.lifePoints;
        var getId = function () {
            return self.id;
        };
        var getLifePoints = function () {
            return self.lifePoints;
        };
        var persist = function () {
            queuePersist('yc-player-' + self.id, self);
        };
        var lose = function (amount) {
            self.lifePoints -= amount;
            if (amount !== 0) {
                persist();
            }
        };
        var gain = function (amount) {
            self.lifePoints += amount;
            if (amount !== 0) {
                persist();
            }
        };
        queuePersist('yc-player-' + self.id, self);
        return {
            type: 'player',
            getId: getId,
            getLifePoints: getLifePoints,
            lose: lose,
            gain: gain
        };
    };

    var makePersistedPlayer = function (spec) {
        var persistedSpec = unpersist('yc-player-' + spec.id);
        if (persistedSpec) {
            return makePlayer(persistedSpec);
        } else {
            return makePlayer(spec);
        }
    };

    /**
     * DOM representation of a player object.
     */
    var makePlayerView = function (spec) {
        var player = spec.model;
        var element = spec.element;

        var previousLifePoints = NaN;

        var render = function () {
            var lifePoints = player.getLifePoints();
            if (previousLifePoints !== lifePoints) {
                element.textContent = lifePoints;
                if (String(lifePoints).length > 4) {
                    element.classList.add('yc-life-points-overflowing');
                } else {
                    element.classList.remove('yc-life-points-overflowing');
                }
                previousLifePoints = lifePoints;
            }
        };

        _.forEach([
            'lose',
            'gain'
        ], function (methodName) {
            advise.after(player, methodName, render);
        });

        return {
            render: render
        };
    };

    /**
     * Gets an arbitrary number of the string "0".
     */
    var getZeros = (function () {
        var getZero = _.constant('0');
        return function (times) {
            return _.times(times, getZero);
        };
    }());

    /**
     * Abstract representation of an operand (a number) in an expression.
     */
    var makeOperand = function () {
        var values = [];
        var getValue = function () {
            if (values.length === 0) {
                return '000';
            } else if (values.length === 1) {
                if (values[0] === 0) {
                    return '00';
                } else {
                    return values.concat(getZeros(2)).join('');
                }
            } else if (values.length >= 2) {
                if (values.length === 2 && values[0] === 0 && values[1] === 0) {
                    return '0';
                } else {
                    return values.concat(getZeros(4 - values.length)).join('');
                }
            }
        };
        var getNumericValue = function () {
            return parseFloat(getValue().replace());
        };
        var getIndex = function () {
            if (values.length === 0) {
                return 0;
            } else if (values.length === 1) {
                if (values[0] === 0) {
                    return 0;
                } else {
                    return 1;
                }
            } else if (values.length >= 2) {
                if (values.length === 2 && values[0] === 0 && values[1] === 0) {
                    return 0;
                } else {
                    return values.length;
                }
            }
        };
        var insertDigit = function (digit) {
            values.push(digit);
        };
        var deleteLastDigit = function () {
            values.pop();
        };
        return {
            type: 'operand',
            getValue: getValue,
            getNumericValue: getNumericValue,
            getIndex: getIndex,
            insertDigit: insertDigit,
            deleteLastDigit: deleteLastDigit
        };
    };

    /**
     * DOM representation of an operand object.
     */
    var makeOperandView = function (spec) {
        var operand = spec.model;

        var getDisplayedValue = function (isSelected) {
            var value = operand.getValue();
            var index = operand.getIndex();

            // Determine the "currently selected" character in the value (the
            // one that will be highlighted to show the user his index).
            var wrappedChar = value.charAt(index);
            if (_.contains(['', ' '], wrappedChar)) {
                wrappedChar = '&nbsp;';
            }

            var displayedValue;
            if (isSelected) {
                // Wrap that "currently selected" character.
                displayedValue =
                    value.substring(0, index) +
                    '<span class="yc-selected-operand-digit">' + wrappedChar + '</span>' +
                    value.substring(index + 1);
            } else {
                displayedValue = value;
            }

            // Remove leading zeroes in the displayed value.
            if (index > 0) {
                displayedValue = displayedValue.replace(/^0+/, function (match) {
                    return new Array(match.length + 1).join('');
                });
            }

            return displayedValue;
        };

        return {
            getDisplayedValue: getDisplayedValue
        };
    };

    /**
     * Abstract representation of a mathematical operator in an unevaluated
     * mathematical expression.
     */
    // var makeOperator = function (symbol) {
    //     var getSymbol = function () {
    //         return symbol;
    //     };
    //     return {
    //         type: 'operator',
    //         getSymbol: getSymbol
    //     };
    // };

    /**
     * DOM representation of an operator object.
     */
    var makeOperatorView = function () {

    };

    /**
     * Abstract representation of a mathematical expression to eventually
     * evaluate and then add or subtract from a player's life points.
     */
    var makeExpression = function () {
        var items;
        var index;
        var getItems = function () {
            return items;
        };
        var getIndex = function () {
            return index;
        };
        var getCurrentItem = function () {
            return items[index];
        };
        var insertDigit = function (digit) {
            getCurrentItem().insertDigit(digit);
        };
        var backspace = function () {
            var currentItem = getCurrentItem();
            var currentItemIndex = currentItem.getIndex();
            if (index > 0 && currentItemIndex === 0) {
                items.splice(items.length - 2, 2);
                index -= 2;
            } else if (currentItemIndex > 0) {
                currentItem.deleteLastDigit();
            }
        };
        var getValue = function () {
            return getCurrentItem().getNumericValue();
        };
        var clearValue = function () {
            items = [makeOperand()];
            index = 0;
        };
        clearValue();
        return {
            type: 'expression',
            getItems: getItems,
            getIndex: getIndex,
            getCurrentItem: getCurrentItem,
            insertDigit: insertDigit,
            backspace: backspace,
            getValue: getValue,
            clearValue: clearValue
        };
    };

    /**
     * DOM representation of an expression object.
     */
    var makeExpressionView = function (spec) {
        var expression = spec.model;
        var element = spec.element;

        var getDisplayedValue = function () {
            var itemsIndex = expression.getIndex();
            return _.reduce(expression.getItems(), function (previous, current, index) {
                var view;
                if (current.type === 'operand') {
                    view = makeOperandView({
                        model: current
                    });
                } else if (current.type === 'operator') {
                    view = makeOperatorView({
                        model: current
                    });
                }
                return previous + view.getDisplayedValue(index === itemsIndex);
            }, '');
        };

        var previousDisplayedValue = NaN;

        var render = function () {
            var displayedValue = getDisplayedValue();
            if (previousDisplayedValue !== displayedValue) {
                element.innerHTML = displayedValue;
                previousDisplayedValue = displayedValue;
            }
        };

        _.forEach([
            'insertDigit',
            'backspace',
            'clearValue'
        ], function (methodName) {
            advise.after(expression, methodName, render);
        });

        return {
            render: render
        };
    };


    /*
     * Static values.
     */

    var numberOfPlayers = 2;


    /*
     * State variables.
     */

    var players;
    var playerViews;
    var expression;
    var expressionView;


    /**
     * Performs one-time setup logic.
     */
    var initializeOnce = (function () {
        var getExpressionApplicationFunction = function (methodName) {
            return function (player) {
                player[methodName](expression.getValue());
                expression.clearValue();
            };
        };
        var lose = getExpressionApplicationFunction('lose');
        var gain = getExpressionApplicationFunction('gain');

        var sheet = (function() {
            // Create the <style> tag.
            var style = document.createElement('style');

            // WebKit hack.
            style.appendChild(document.createTextNode(''));

            // Add the <style> element to the page.
            document.head.appendChild(style);

            return style.sheet;
        }());

        var clearRules = function () {
            while (sheet.cssRules.length > 0) {
                sheet.deleteRule(0);
            }
        };

        var insertRule = function () {
            sheet.insertRule(Array.prototype.slice.call(arguments).join('\n'), sheet.cssRules.length);
        };

        var lifePointsHeightPercentage = 0.15;
        var lifePointsScaling = 0.85;
        var expressionHeightPercentage = 0.1;
        var expressionScaling = 0.9;
        var buttonHeightPercentage = 0.15;
        var buttonPaddingPercentage = 0.01;
        var buttonFontScaling = 0.85;
        var timerFontScaling = 0.75;

        var updateFontSizes = function () {
            var bodyHeight = document.body.clientHeight;
            var lifePointsHeightPx = bodyHeight * lifePointsHeightPercentage;
            var expressionHeightPx = bodyHeight * expressionHeightPercentage;
            var buttonHeightPx = bodyHeight * (buttonHeightPercentage - (2 * buttonPaddingPercentage));
            clearRules();
            insertRule(
                '.yc-life-points {',
                '    font-size: ' + (lifePointsHeightPx * lifePointsScaling) + 'px;',
                '}'
            );
            insertRule(
                '.yc-expression {',
                '    font-size: ' + (expressionHeightPx * expressionScaling) + 'px;',
                '}'
            );
            insertRule(
                '.yc-button {',
                '    font-size: ' + (buttonHeightPx * buttonFontScaling) + 'px;',
                '}'
            );
            insertRule(
                '.yc-timer {',
                '    font-size: ' + (buttonHeightPx * timerFontScaling) + 'px;',
                '}'
            );
        };

        return function () {
            expression = makeExpression();
            expressionView = makeExpressionView({
                model: expression,
                element: document.getElementById('yc-expression')
            });
            expressionView.render();
            // Use indices because only the index should be closured, not the
            // players.
            _.times(2, function (index) {
                document.getElementById('yc-button-minus-' + index)
                    .addEventListener('click', function () {
                        lose(players[index]);
                    }, false);
                document.getElementById('yc-button-plus-' + index)
                    .addEventListener('click', function () {
                        gain(players[index]);
                    }, false);
            });
            _.times(10, function (number) {
                document.getElementById('yc-button-digit-' + number)
                    .addEventListener('click', function () {
                        expression.insertDigit(number);
                    }, false);
            });
            document.getElementById('yc-button-cancel')
                .addEventListener('click', function () {
                    expression.clearValue();
                }, false);
            document.getElementById('yc-button-delete')
                .addEventListener('click', function () {
                    expression.backspace();
                }, false);
            document.getElementById('yc-button-reset-game')
                .addEventListener('click', function () {
                    restart();
                }, false);
            updateFontSizes();
            var onResizeFunction = _.debounce(updateFontSizes);
            _.forEach([
                'resize',
                'orientationchange'
            ], function (event) {
                window.addEventListener(event, onResizeFunction, false);
            });
        };
    }());

    /**
     * Performs per-game initialization logic. (Can be used to reset state.)
     */
    var getInitializeFunction = function (when) {
        var makePlayerFunction;
        if (when === 'first') {
            makePlayerFunction = makePersistedPlayer;
        } else if (when === 'subsequent') {
            makePlayerFunction = makePlayer;
        }
        return function () {
            players = _.times(numberOfPlayers, function (n) {
                return makePlayerFunction({
                    id: n
                });
            });
            playerViews = _.map(players, function (player, index) {
                return makePlayerView({
                    model: player,
                    element: document.getElementById('yc-player-' + index + '-life-points')
                });
            });
            _.forEach(playerViews, function (playerView) {
                playerView.render();
            });
        };
    };

    var initialize = getInitializeFunction('first');
    var restart = getInitializeFunction('subsequent');

    document.addEventListener('DOMContentLoaded', function() {
        initialize();
        initializeOnce();
        FastClick.attach(document.body);
    }, false);

}());
