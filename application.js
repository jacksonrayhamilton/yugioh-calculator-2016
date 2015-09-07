/*jshint browser: true */
/*globals _: false, FastClick: false */
(function () {

    'use strict';

    /**
     * Makes an object that can emit named events to listeners.
     */
    var makeEventEmitter = function () {
        var events = {};
        var on = function (event, handler) {
            if (!Object.prototype.hasOwnProperty.call(events, event)) {
                events[event] = [];
            }
            events[event].push(handler);
        };
        var off = function (event, handler) {
            if (handler === undefined) {
                events[event] = [];
            } else {
                while (true) {
                    var index = _.indexOf(events[event], handler);
                    if (index === -1) {
                        break;
                    }
                    events[event].splice(index, 1);
                }
            }
        };
        var emit = function (event, data) {
            if (Object.prototype.hasOwnProperty.call(events, event)) {
                _.forEach(events[event], function (handler) {
                    handler(data);
                });
            }
        };
        return {
            on: on,
            off: off,
            emit: emit
        };
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

    /**
     * Reads an object from localStorage synchronously.
     */
    var unpersist = function (key) {
        return JSON.parse(localStorage.getItem(key));
    };

    /**
     * Abstract representation of a Yugioh player.
     */
    var makePlayer = function (spec) {
        spec = spec === undefined ? {} : spec;
        var self = makeEventEmitter();
        var id = spec.id;
        var lifePoints = spec.lifePoints === undefined ? 8000 : spec.lifePoints;
        var getId = function () {
            return id;
        };
        var getLifePoints = function () {
            return lifePoints;
        };
        var persist = function () {
            queuePersist('yc-player-' + id, {
                id: id,
                lifePoints: lifePoints
            });
        };
        var lose = function (amount) {
            lifePoints -= amount;
            if (amount !== 0) {
                persist();
                self.emit('change');
            }
        };
        var gain = function (amount) {
            lifePoints += amount;
            if (amount !== 0) {
                persist();
                self.emit('change');
            }
        };
        persist();
        return _.assign(self, {
            type: 'player',
            getId: getId,
            getLifePoints: getLifePoints,
            lose: lose,
            gain: gain
        });
    };

    /**
     * Reanimate a persisted player object.
     */
    var makePersistedPlayer = function (spec) {
        spec = spec === undefined ? {} : spec;
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
        spec = spec === undefined ? {} : spec;
        var player = spec.model;
        var element = spec.element;

        var render = function () {
            var lifePoints = player.getLifePoints();
            element.textContent = lifePoints;
            if (String(lifePoints).length > 4) {
                element.classList.add('yc-life-points-overflowing');
            } else {
                element.classList.remove('yc-life-points-overflowing');
            }
        };

        player.on('change', render);

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
        spec = spec === undefined ? {} : spec;
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
        var self = makeEventEmitter();
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
            self.emit('change');
        };
        var backspace = function () {
            var currentItem = getCurrentItem();
            var currentItemIndex = currentItem.getIndex();
            if (index > 0 && currentItemIndex === 0) {
                items.splice(items.length - 2, 2);
                index -= 2;
                self.emit('change');
            } else if (currentItemIndex > 0) {
                currentItem.deleteLastDigit();
                self.emit('change');
            }
        };
        var getValue = function () {
            return getCurrentItem().getNumericValue();
        };
        var clearValue = function () {
            items = [makeOperand()];
            index = 0;
            self.emit('change');
        };
        clearValue();
        return _.assign(self, {
            type: 'expression',
            getItems: getItems,
            getIndex: getIndex,
            getCurrentItem: getCurrentItem,
            insertDigit: insertDigit,
            backspace: backspace,
            getValue: getValue,
            clearValue: clearValue
        });
    };

    /**
     * DOM representation of an expression object.
     */
    var makeExpressionView = function (spec) {
        spec = spec === undefined ? {} : spec;
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

        var render = function () {
            element.innerHTML = getDisplayedValue();
        };

        expression.on('change', render);

        return {
            render: render
        };
    };

    var getTimestamp;
    var formatMs;
    (function () {

        /**
         * Pads a 2-digit number with a leading zero, if needed.
         */
        var pad = function (number) {
            return number < 10 ? '0' + number : '' + number;
        };

        /**
         * Gets a timestamp in the format "hh:mm:ss A".
         */
        getTimestamp = function (ms) {
            var date = typeof ms === 'undefined' ? new Date() : new Date(ms);
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var seconds = date.getSeconds();
            var period;
            if (hours < 12) {
                if (hours === 0) {
                    hours = 12;
                }
                period = 'AM';
            } else {
                if (hours > 12) {
                    hours -= 12;
                }
                period = 'PM';
            }
            return [pad(hours), pad(minutes), pad(seconds)].join(':') + ' ' + period;
        };

        /**
         * Formats milliseconds as "00:00" (MINS:SECS).
         */
        formatMs = function (ms) {
            // Round to make for a more-accurate end result.
            ms = Math.round(ms / 1000) * 1000;
            var seconds = Math.floor(ms / 1000) % 60;
            var minutes = Math.floor(ms / 60000);
            return pad(minutes) + ':' + pad(seconds);
        };

    }());

    var timerUpdateFrequency = 1000; // 1 second
    var matchTime = 40 * 60 * 1000;  // 40 minutes

    /**
     * Abstract representation of a Yugioh match timer.
     */
    var makeTimer = function (spec) {
        spec = spec === undefined ? {} : spec;
        var self = makeEventEmitter();
        var startTime = spec.startTime;
        var timeout;
        var getTimePassed = function () {
            return Date.now() - startTime;
        };
        var getTimeLeft = function () {
            return matchTime - getTimePassed();
        };
        var isInOvertime = function () {
            return getTimePassed() > matchTime;
        };
        var tick = function () {
            if (isInOvertime()) {
                self.emit('overtime');
            } else {
                self.emit('tick');
                timeout = setTimeout(tick, timerUpdateFrequency);
            }
        };
        var persist = function () {
            queuePersist('yc-timer', {
                startTime: startTime
            });
        };
        var restart = function () {
            clearTimeout(timeout);
            startTime = Date.now();
            persist();
            tick();
        };
        if (startTime === undefined) {
            restart();
        } else {
            tick();
        }
        persist();
        return _.assign(self, {
            restart: restart,
            getTimeLeft: getTimeLeft,
            isInOvertime: isInOvertime
        });
    };

    /**
     * Reanimate a persisted timer object.
     */
    var makePersistedTimer = function (spec) {
        spec = spec === undefined ? {} : spec;
        var persistedSpec = unpersist('yc-timer');
        if (persistedSpec) {
            return makeTimer(persistedSpec);
        } else {
            return makeTimer(spec);
        }
    };

    /**
     * DOM representation of a timer object.
     */
    var makeTimerView = function (spec) {
        spec = spec === undefined ? {} : spec;
        var timer = spec.model;
        var element = spec.element;
        var renderOvertime = function () {
            element.textContent = 'TIME';
        };
        var renderTime = function () {
            element.textContent = formatMs(timer.getTimeLeft());
        };
        var render = function () {
            if (timer.isInOvertime()) {
                renderOvertime();
            } else {
                renderTime();
            }
        };
        render();
        timer.on('tick', renderTime);
        timer.on('overtime', renderOvertime);
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
    var timer;
    var timerView;


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

        // Stylesheet for dynamic rule insertion.
        var sheet = (function() {
            var style = document.createElement('style');
            style.appendChild(document.createTextNode('')); // WebKit hack
            document.head.appendChild(style);
            return style.sheet;
        }());

        var clearRules = function () {
            while (sheet.cssRules.length > 0) {
                sheet.deleteRule(0);
            }
        };

        var insertRule = function () {
            var rule = Array.prototype.slice.call(arguments).join('\n');
            sheet.insertRule(rule, sheet.cssRules.length);
        };

        var lifePointsHeightPercentage = 0.15;
        var lifePointsScaling = 0.85;
        var lifePointsOverflowingScaling = 0.7;
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
                '.yc-life-points-overflowing {',
                '    font-size: ' + (lifePointsHeightPx * lifePointsOverflowingScaling) + 'px;',
                '}'
            );
            insertRule(
                '.yc-expression {',
                '    font-size: ' + (expressionHeightPx * expressionScaling) + 'px;',
                '}'
            );
            insertRule(
                '.yc-selected-operand-digit {',
                '    line-height: ' + (expressionHeightPx) + 'px;',
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
                    });
                document.getElementById('yc-button-plus-' + index)
                    .addEventListener('click', function () {
                        gain(players[index]);
                    });
            });
            _.times(10, function (number) {
                document.getElementById('yc-button-digit-' + number)
                    .addEventListener('click', function () {
                        expression.insertDigit(number);
                    });
            });
            document.getElementById('yc-button-cancel')
                .addEventListener('click', function () {
                    expression.clearValue();
                });
            document.getElementById('yc-button-delete')
                .addEventListener('click', function () {
                    expression.backspace();
                });
            document.getElementById('yc-button-reset-game')
                .addEventListener('click', function () {
                    restart();
                });
            document.getElementById('yc-button-reset-timer')
                .addEventListener('click', function () {
                    timer.restart();
                });
            updateFontSizes();
            var onResizeFunction = _.debounce(updateFontSizes);
            _.forEach([
                'resize',
                'orientationchange'
            ], function (event) {
                window.addEventListener(event, onResizeFunction);
            });
            timer = makePersistedTimer();
            timerView = makeTimerView({
                model: timer,
                element: document.getElementById('yc-timer')
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
    });

}());
