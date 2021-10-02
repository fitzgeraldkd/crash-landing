// import { event } from "jquery";

$(function() {
    type Vector2 = [number, number];
    type ObstacleNames = 'dustStorm' | 'smallCrater' | 'largeRock';

    type Weather = {
        windDirection: Vector2;
        windSpeed: number;
        temperature: number;
    }

    // TODO: finish defining GameData
    type GameData = {
        score: number;
        rover: Vector2;
        battery: number;
        powerUsage: number;
        isStuck: boolean;
        plutonium: Vector2;
        hasPlutonium: boolean;
        solarPanels: Vector2;
        hasSolarPanels: boolean;
        weather: Weather;
        obstacles: {
            dustStorm: Vector2;
            smallCrater: Vector2;
            largeRock: Vector2;
        };
        gameOver: boolean;
        victory: boolean;
    };

    let gameData: GameData;

    function newGame() {
        // TODO: finish defining GameData
        gameData = {
            score: 0,
            rover: [0, 0],
            battery: 100,
            powerUsage: 5,
            isStuck: false,
            plutonium: [0, 0],
            hasPlutonium: false,
            solarPanels: [0, 0],
            hasSolarPanels: false,
            weather: getWeather(),
            obstacles: {
                dustStorm: [0, 0],
                smallCrater: [0, 0],
                largeRock: [0, 0]
            },
            gameOver: false,
            victory: false
        };
        gameData.plutonium = randomPosition(8, 7);
        gameData.solarPanels = randomPosition(4, 3);
        gameData.obstacles.dustStorm = randomPosition(6, 4);
        gameData.obstacles.smallCrater = randomPosition(4, 2);
        gameData.obstacles.largeRock = randomPosition(4, 1, [gameData.plutonium, gameData.solarPanels, gameData.obstacles.smallCrater]);
        console.table(gameData);
        clearMessages();
        startingMessages();
        updateDisplay();
    }

    function getWeather() {
        let weather: Weather = {
            windDirection: [randomInt(-1, 1), randomInt(-1, 1)],
            windSpeed: 6,
            temperature: -60
        };
        return weather;
    }

    function randomPosition(boundary: number, distance: number, prohibited: Vector2[] = []) {
        // TODO: implement a failsafe for if no positions are possible
        let newPosition: Vector2 = [0, 0];
        do {
            newPosition = [randomInt(-boundary, boundary), randomInt(-boundary, boundary)];
        } while (onObject([0, 0], newPosition, distance) || prohibited.some(position => (
            position[0] === newPosition[0] && position[1] === newPosition[1]
        )));
        return newPosition;
    }

    function logMessage(message: string, fromUser=false) {
        const prefix = fromUser ? '>>' : '<<';
        $('#command-history-div tbody').append(`<tr><td>${prefix}</td><td>${message}</td></tr>`);
        let scrollHeight = $('#command-history-div').prop('scrollHeight');
        if (typeof scrollHeight === 'number') $('#command-history-div').scrollTop(scrollHeight);
    }

    function clearMessages() {
        $('#command-history-div tbody').empty();
    }

    function startingMessages() {
        logMessage('Crash Landing!');
        logMessage('');
        logMessage('You play as a rover that has just had a crash landing on Mars.');
        logMessage('The rover lost its two power sources in the crash.');
        logMessage('Plutonium is the rover\'s main power source.');
        logMessage('The goal of the game is to retrieve the plutonium before the battery depletes.');
        logMessage('Retrieving the rover\'s solar panels will allow you to travel more efficiently.');
        logMessage('Type "help" at any time to review the controls.');
        logMessage('Good luck!');
        logMessage('');
    }

    function helpMessages() {
        logMessage('Help:');
        logMessage('');
        logMessage('Movement:');
        logMessage('You can move by clicking the buttons with the cardinal directions.');
        logMessage('You can also move through text commands. Examples of valid commands:');
        logMessage('>> move n');
        logMessage('>> move north');
        logMessage('');
        logMessage('Look around for hints of where the components might be. Examples of valid commands:');
        logMessage('>> look n');
        logMessage('>> look north');
        logMessage('>> look down');
        logMessage('');
        logMessage('Be careful of your surroundings, Mars is a hazardous planet.');
        logMessage('Your score is based on your battery life.');
        logMessage('Additional points can be earned by finding points of interest.');
        logMessage('');
        logMessage('Type "new game" at any point to start a new game.');
    }

    function parseCommand(command: string) {
        command = command.toLowerCase().replace(/\s/ig, '');
        if (!gameData.gameOver) {
            if (command.startsWith('move')) {
                commandMove(command.slice(4));
            } else if (command.startsWith('look')) {
                // TODO: finish
            }
            updateDisplay();
        }
    }
    

    function commandMove(direction: string) {
        const originalPosition = gameData.rover;
        let success = true;
        let obstacle: ObstacleNames;
        for (obstacle in gameData.obstacles) {
            let obstacleLocation = gameData.obstacles[obstacle];
            if (onObject(originalPosition, gameData.obstacles[obstacle])) {
                if (obstacle === 'dustStorm' && chance(50)) {
                    gameData.powerUsage += 3;
                    logMessage('Sand has gotten stuck in the treads. Moving becomes less efficient.');
                }
                if (obstacle === 'smallCrater' && chance(50)) {
                    if (gameData.isStuck) {
                        gameData.isStuck = false;
                        logMessage('You are no longer stuck.');
                    } else {
                        gameData.isStuck = true;
                        logMessage('You are stuck!');
                    }
                }
            }
        }

        let newPosition = originalPosition;
        if (!gameData.isStuck) {
            if ($.inArray(direction, ['north', 'n']) > -1) {
                newPosition = [originalPosition[0], originalPosition[1]+1];
            } else if ($.inArray(direction, ['east', 'e']) > -1) {
                newPosition = [originalPosition[0]+1, originalPosition[1]];
            } else if ($.inArray(direction, ['south', 's']) > -1) {
                newPosition = [originalPosition[0], originalPosition[1]-1];
            } else if ($.inArray(direction, ['west', 'w']) > -1) {
                newPosition = [originalPosition[0]-1, originalPosition[1]];
            } else {
                success = false;
            }

            if (onObject(newPosition, gameData.obstacles.largeRock)) {
                newPosition = originalPosition;
                success = false;
                logMessage('You cannot move there.');
            }
        } else {
            logMessage('You were unable to get out of the crater.')
            success = false;
        }

        if (success) {
            // TODO: move dust storm

            logMessage(`Your new location is ${newPosition[0]}, ${newPosition[1]}.`);
            gameData.battery -= gameData.powerUsage;

            if (onObject(newPosition, gameData.solarPanels) && !gameData.hasSolarPanels) {
                gameData.hasSolarPanels = true;
                logMessage('You have retrieved the solar panels!');
                logMessage('It will take less energy to traverse the terrain of Mars now!');
            }

            if (onObject(newPosition, gameData.plutonium) && !gameData.hasPlutonium) {
                gameData.hasPlutonium = true;
                logMessage('You have retrieved the plutonium!');

                gameData.victory = true;
                gameData.gameOver = true;
                // TODO: calculate and apply score
                
            }

            gameData.rover = newPosition;
        }
    }

    function commandLook(direction: string) {
        
    }

    function submitCommand(e: JQuery.Event) {
        e.preventDefault();
        let command = $('#command-input').val();
        if (typeof command === 'string') {
            logMessage(command, true);
            parseCommand(command);
        }
        $('#command-input').val('');
        $('#command-input').trigger('focus');

        console.table(gameData);
    }

    function onObject(location1: Vector2, location2: Vector2, radius=1) {
        let deltaX = Math.abs(location1[0] - location2[0]);
        let deltaY = Math.abs(location1[1] - location2[1]);
        return (deltaX + deltaY < radius);
    }

    function chance(successPercent: number) {
        return Math.random() < successPercent / 100;
    }

    function randomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    function updateDisplay() {
        $('#battery-remaining').html(gameData.battery.toString());
        $('#coordinates').html(`${gameData.rover[0]}, ${gameData.rover[1]}`);
    }

    ['n', 'e', 's', 'w'].forEach(direction => {
        $(`#bttn-move-${direction}`).on('click', () => {
            $('#command-input').val(`move ${direction}`);
            $('#command-form').trigger('submit');
        })
    });
    $('#command-form').on('submit', submitCommand);
    $('#command-input').trigger('focus');
    newGame();
});