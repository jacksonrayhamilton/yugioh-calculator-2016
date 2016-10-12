/* eslint-env mocha */

'use strict';

var Player = require('./player');

describe('Player', function () {

  it('should bound life points to 99999 and -9999', function () {
    var player = new Player();
    player.gain(999999);
    expect(player.getLifePoints()).to.equal(99999);
    player.lose(999999);
    expect(player.getLifePoints()).to.equal(-9999);
  });

});
