(function () {

    'use strict';

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

    var makePlayer = function () {
        var lifePoints = 8000;
        var getLifePoints = function () {
            return lifePoints;
        };
        var lose = function (amount) {
            lifePoints -= amount;
        };
        var gain = function (amount) {
            lifePoints += amount;
        };
        return {
            getLifePoints: getLifePoints,
            lose: lose,
            gain: gain
        };
    };

    var makePlayerView = function (spec) {
        var player = spec.model;
        var element = spec.element;

        var previousLifePoints = player.getLifePoints();

        var applyDelta = function () {
            var newLifePoints = player.getLifePoints();
            if (previousLifePoints !== newLifePoints) {
                element.textContent = newLifePoints;
            }
        };

        advise.after(player, 'lose', applyDelta);
        advise.after(player, 'gain', applyDelta);
    };

    var players;
    var playerViews;

    var initialize = function () {
        players = _.times(2, makePlayer);
        playerViews = _.map(players, function (player, index) {
            return makePlayerView({
                model: player,
                element: document.getElementById('yc-player-' + index + '-life-points')
            });
        });
    };

    initialize();

}());
