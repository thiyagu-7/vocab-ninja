function scrapeData() {
    let shortBlurb = !!document.querySelectorAll(".section.blurb")[0] ?
        document.querySelectorAll(".section.blurb")[0].getElementsByClassName("short")[0].innerHTML : "N/A"

    let longBlurb = !!document.querySelectorAll(".section.blurb")[0] ?
        document.querySelectorAll(".section.blurb")[0].getElementsByClassName("long")[0].innerHTML : "N/A"

    let groups = document.querySelectorAll(".group")
    let allGroupsData = [];

    for (let i = 0; i < groups.length; i++) {
        let groupData = []; //all ordinals within a group

        sibling = groups[i].firstElementChild.nextElementSibling
        while (sibling != null) {
            definitions = sibling.querySelectorAll(".sense > .definition")

            var ordinalData = [];
            for (let j = 0; j < definitions.length; j++) {
                ordinalData.push({
                    "partOfSpeech": definitions[j].firstElementChild.innerText,
                    "definition": definitions[j].firstElementChild.nextSibling.data.trim()
                })
            }
            groupData.push(ordinalData);
            sibling = sibling.nextElementSibling;
        }
        allGroupsData.push(groupData)
    }
    let vocabularyData = {
        "shortBlurb": shortBlurb,
        "longBlurb": longBlurb,
        "definitions": allGroupsData
    }
    return vocabularyData
}

scrapeData()