var assert = require('assert');
var GameModeEnum = require('../src/models/gameModeEnum');
var assert = require('assert');

describe('GameModeEnum', function () {

    describe('#getValues()', function () {
        it('should return array', function () {
            var values = GameModeEnum.getValues();
            assert.equal(Object.prototype.toString.call(values) === '[object Array]', true)
        });
        it('should return not empty array', function () {
            var values = GameModeEnum.getValues();
            assert.equal(values.length > 0, true)
        });
        it('should return array which contains only objects (game modes)', function () {
            var values = GameModeEnum.getValues();
            assert.equal(values.every(item => typeof item === 'object') > 0, true)
        });
    });

    describe('#getById()', function () {
        it('should return UNKNOWN game mode if wrong id passed', function () {
            var gameMode = GameModeEnum.getById(-1);
            assert.equal(gameMode, GameModeEnum.UNKNOWN);
        });
        it('should return game mode for right id', function () {
            var gameMode = GameModeEnum.getById(1);
            assert.equal(gameMode, GameModeEnum.FFA);
        });
    });

    describe('#getByName()', function () {
        it('should return FFA game mode if no param specified', function () {
            var gameMode = GameModeEnum.getByName("");
            assert.equal(gameMode, GameModeEnum.FFA);
        });
        it('should return UNKNOWN game mode if wrong name passed', function () {
            var gameMode = GameModeEnum.getByName("some");
            assert.equal(gameMode, GameModeEnum.UNKNOWN);
        });
        it('should find game mode by name regardless of register', function () {
            var gameMode = GameModeEnum.getByName("fFa");
            assert.equal(gameMode, GameModeEnum.FFA);
        });
    });

    describe('Basic', function () {
        it("game modes list must be unchangable", function () {
            assert.equal(Object.isFrozen(GameModeEnum), true);
        });
        it("each game mode must be unchangable", function () {
            // for (var key in GameModeEnum.getValues()){
            //     console.log(Object.isFrozen(GameModeEnum[key]));
            // }
            assert.equal(GameModeEnum.getValues().every(item => Object.isFrozen(item)), true);
        });
        it('game modes should contains all needed fields', function () {
            var gameModes = GameModeEnum.getValues();
            var neededProperties = ["id", "name", "limit"];
            var res = gameModes.every(mode => {
                return neededProperties.every(item => mode.hasOwnProperty(item));
            });
            assert.equal(res, true);
        });
    });

    describe('adjustExp', function () {
        it("should apply appropriate exp normalization formula for each game mode", function () {
            //values for 5000 exp
            var expectedVals = {
                UNKNOWN: 0,
                FFA: 10000,
                TEAMS: 10000,
                EXPERIMENTAL: 10000,
                INSTANTMERGE: 5000,
                CRAZY: 70,
                SELFFEED: 14,
                TS2v2: 0,
                ULTRA: 0,
                CUSTOM: 0
            }
            var wrongVals = [];
            var fakeServer = { 
                current_players: 15 
            };
            var res = GameModeEnum.getValues().every(item => {
                var adjustedExp = GameModeEnum.adjustExp(item, 5000, fakeServer);
                if (adjustedExp != expectedVals[item.name]) {
                    wrongVals.push({ name: item.name, expected: expectedVals[item.name], actual: adjustedExp });
                    return false;
                } else {
                    return true;
                }
            })
            if (!res) {
                console.log(wrongVals)
            }
            assert.equal(res, true);
        });
        it("should set exp to 0 if server is almost empty (current_players < 10)", function () {
            var fakeServer = { 
                current_players: 5 
            };
            var res = GameModeEnum.adjustExp(GameModeEnum.TEAMS, 5000, fakeServer)
            assert.equal(res, 0);
        });
    });

});