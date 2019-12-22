let saveWord = document.getElementById('saveWord');
let reSaveWord = document.getElementById('reSaveWord');

let activeButton;

reSaveWord.onclick = saveWord.onclick = function (element) {
    showSpinnerAndDisableButton()
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        chrome.tabs.executeScript(
            tabs[0].id, {
                file: 'dataScrapper.js'
            },
            async function (results) {
                console.log(results);
                await save(decodeURI(tabs[0].url.substring(tabs[0].url.lastIndexOf("/") + 1)), results)
                hideSpinnerAndButton(true)
            });
    });
};

//Call on page load
checkWordExistence();

async function checkWordExistence() {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, async function (tabs) {
        let word = decodeURI(tabs[0].url.substring(tabs[0].url.lastIndexOf("/") + 1))
        let res = await findNotes(word);
        if (res.length == 0) {
            console.log("New word")
            document.getElementById("new-word").style.display = 'block';
            document.getElementById("existing-word").style.display = 'none';
            activeButton = document.getElementById("new-word");
        } else {
            console.log("Word already exists " + res)
            document.getElementById("new-word").style.display = 'none';
            document.getElementById("existing-word").style.display = 'block';
            activeButton = document.getElementById("existing-word");
        }
    });
}

var opts = {
    lines: 16, // The number of lines to draw
    length: 0, // The length of each line
    width: 11, // The line thickness
    radius: 28, // The radius of the inner circle
    scale: 0.45, // Scales overall size of the spinner
    corners: 1, // Corner roundness (0..1)
    color: '#000000', // CSS color or array of colors
    fadeColor: 'transparent', // CSS color or array of colors
    speed: 1.7, // Rounds per second
    rotate: 43, // The rotation offset
    animation: 'spinner-line-shrink', // The CSS animation name for the lines
    direction: 1, // 1: clockwise, -1: counterclockwise
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    className: 'spinner', // The CSS class to assign to the spinner
    top: '50%', // Top position relative to parent
    left: '50%', // Left position relative to parent
    shadow: '0 0 1px transparent', // Box-shadow for the lines
    position: 'absolute' // Element positioning
};
spinner = new Spinner(opts).spin(document.getElementById('loader'));

function showSpinnerAndDisableButton() {
    spinner = new Spinner(opts).spin(document.getElementById('loader'));
    activeButton.disabled = true;
    spinner.spin()
    document.getElementById('loading').style.display = 'block';
}

function hideSpinnerAndButton(success) {
    spinner.stop()
    activeButton.style.display = 'none';
    document.getElementById('loading').style.display = 'none';
    if (success) {
        document.getElementById('saveSuccess').style.display = 'block';
    } else {
        document.getElementById('saveFail').style.display = 'block';
    }
}

async function findNotes(word) {
    return await (invoke('findNotes', 6, {
        "query": "deck:VocabularyNinja Word:" + word
    }))
}

async function save(word, vocabularyData) {
    const res = await findNotes(word)
    if (res.length > 1) {
        alert("More than one note found for the word " + word)
        return
    }
    if (res.length == 0) {
        const result = await invoke('addNote', 6, {
            "note": {
                "deckName": "VocabularyNinja",
                "modelName": "VocabularyNinja",
                "fields": {
                    "Word": word,
                    "ShortBlurb": vocabularyData[0].shortBlurb,
                    "LongBlurb": vocabularyData[0].longBlurb,
                    "Definitions": JSON.stringify(vocabularyData[0].definitions)
                },
                "options": {
                    "allowDuplicate": false
                },
                "tags": []
            }
        });

    } else {
        const result = await invoke('updateNoteFields', 6, {
            "note": {
                "id": res[0],
                "fields": {
                    "Word": word,
                    "ShortBlurb": vocabularyData[0].shortBlurb,
                    "LongBlurb": vocabularyData[0].longBlurb,
                    "Definitions": JSON.stringify(vocabularyData[0].definitions)
                }
            }
        });
    }
    /*  alert("Done..")
     alert(vocabularyData)
     alert(JSON.stringify(vocabularyData))
     alert(JSON.stringify(JSON.stringify(vocabularyData))) */
}


async function invoke(action, version, params = {}) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener('error', () => {
            alert("Faled to issue request. Check if AnkiConnect is up at localhost:8765")
            hideSpinnerAndButton(false)
            reject('failed to issue request');
        });
        xhr.addEventListener('load', () => {
            try {
                const response = JSON.parse(xhr.responseText);
                if (Object.getOwnPropertyNames(response).length != 2) {
                    throw 'response has an unexpected number of fields';
                }
                if (!response.hasOwnProperty('error')) {
                    throw 'response is missing required error field';
                }
                if (!response.hasOwnProperty('result')) {
                    throw 'response is missing required result field';
                }
                if (response.error) {
                    throw response.error;
                }
                resolve(response.result);
            } catch (e) {
                alert(e)
                hideSpinnerAndButton(false)
                reject(e);
            }
        });

        xhr.open('POST', 'http://127.0.0.1:8765');
        xhr.send(JSON.stringify({
            action,
            version,
            params
        }));
    });
}