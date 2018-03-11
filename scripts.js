'use strict';
/* global io */
/* global $ */

const tryGuess = document.getElementById('tryGuess');
tryGuess.addEventListener('click', nextRound);

// let inputImageLink = document.getElementById('inputImageLink');
let guessedPicture = document.getElementById('guessedPicture');
let playersGuesses = document.getElementById('playersGuesses');
let inputNickname = document.getElementById('inputNickname');
let scoreText = document.getElementById('scoreText');
let totalTags = document.getElementById('totalTags');

let tagsFromAzure;
let scoreData = [];

const pb2 = new PB2('https://pb2-2018.jelastic.metropolia.fi/', 'guessTags');

pb2.setReceiver(function(response) {
    const status = response.json.status;
    if (status == 'prepComplete') {
        timeToGuess(response.json.tags, response.json.imageLink);
    }
    if (status == 'showScore') {
        showScore(response.json.nickname, response.json.score);
    }
});

function showScore(nickname, score) {
    let found = false;
    for (let i in scoreData) {
        if (scoreData[i].nickname == nickname) {
            scoreData[i].score = score;
            found = true;
        }
    }
    if (!found) {
        scoreData.push({nickname: nickname, score: score});
    }
    console.log(scoreData);
    let line = 'Your personal total score: ' + localStorage.totalScore + '\n';
    for (let i = 0; i < scoreData.length; i++) {
        line = line + scoreData[i].nickname + ': ' + scoreData[i].score + '\n';
    }
    scoreText.innerText = line;
}

function showAnswer() {
    playersGuesses.disabled='disabled';

    let line = 'There were total: ' + tagsFromAzure.length + ' tags. \n';
    for (let i = 0; i < tagsFromAzure.length; i++) {
        line = line + tagsFromAzure[i] + ' ';
    }
    totalTags.innerText = line;

    let guesses = playersGuesses.value
                                .toLowerCase()
                                .split(' ')
                                .filter(onlyUnique);
    let n = countGuesses(guesses, tagsFromAzure);

    if (localStorage.nickname != inputNickname.value) {
        localStorage.nickname = inputNickname.value;
    }

    if (localStorage.totalScore) {
        localStorage.totalScore = Number(localStorage.totalScore) + n;
    } else {
        localStorage.totalScore = n;
    }

    pb2.sendJson({
        status: 'showScore',
        nickname: localStorage.nickname,
        score: n,
    });
}

function timeToGuess(tags, link) {
    playersGuesses.value = '';
    playersGuesses.disabled='';

    guessedPicture.src = link;
    tagsFromAzure = tags;
    setTimeout(showAnswer, 20000);
}

function nextRound(event) {
    let imageLink = 'https://picsum.photos/400/300/?image=' + Math.floor(Math.random() * 1000);

    let subscriptionKey = '774fca6e4c7a429db5c705125a74aec4';
    let uriBase = 'https://westcentralus.api.cognitive.microsoft.com/vision/v1.0/analyze';
    // Request parameters.
    let params = {
        'visualFeatures': 'Categories,Description,Color',
        'details': '',
        'language': 'en',
    };
    // Perform the REST API call.
    $.ajax({
        url: uriBase + '?' + $.param(params),

        // Request headers.
        beforeSend: function(xhrObj) {
            xhrObj.setRequestHeader('Content-Type', 'application/json');
            xhrObj.setRequestHeader('Ocp-Apim-Subscription-Key',
                                    subscriptionKey);
        },
        type: 'POST',
        // Request body.
       // data: '{"url": ' + '"' + inputImageLink.value + '"}',
       data: '{"url": ' + '"' + imageLink + '"}',
    })

    .done(function(data) {
        pb2.sendJson({
            status: 'prepComplete',
            tags: data.description.tags,
            // imageLink: inputImageLink.value
            imageLink: imageLink,
        });
    })

    .fail(function(jqXHR, textStatus, errorThrown) {
        alert('Bad link');
        return -1;
    });
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function countGuesses(guesses, tags) {
    let a = 0;
    for (let i = 0; i < tags.length; i++) {
        for (let j = 0; j < guesses.length; j++) {
            if (tags[i] == guesses[j]) {
                console.log(tags[i]);
                a++;
            }
        }
    }
    return a;
}

function onLoadFunctions() {
    playersGuesses.disabled='disabled';
    if (localStorage.nickname) {
        inputNickname.value = localStorage.nickname;
    } else {
        localStorage.nickname = 'noname';
        inputNickname.value = localStorage.nickname;
    }
    // nextRound();
}
window.onload = onLoadFunctions;
