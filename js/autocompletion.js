async function getFloorNodes(floor) {
    let path = '../json/floor' + floor + '.json';
    try {
        const response = await fetch(path);
        const data = await response.json();
        let dataArray = data.items || [ data ];

        return dataArray;
    } catch (err) {
        console.error(err);
    }
}

async function getAllNodes() {
    let dataArray = [];
    try {
        for (var i = 1; i <= 5; i++)
            dataArray = [ ...dataArray, ...await getFloorNodes(i) ];
        return dataArray;
    } catch (err) {
        console.error(err);
    }
}

async function getJSONArray(type) {
    let path;
    if (type == "person") {
        path = '../json/person_infos.json';
        try {
            const response = await fetch(path);
            const data = await response.json();
            let dataArray = data.items || [ data ];

            dataArray.sort((a, b) => {
                if (a.name < b.name)
                    return -1;
                if (a.name > b.name)
                    return 1;
                return 0;
            });
            return dataArray;
        } catch (err) {
            console.error(err);
        }
    } else {
        let dataArray = await getAllNodes();
        dataArray.sort((a, b) => {
            if (a.name < b.name)
                return -1;
            if (a.name > b.name)
                return 1;
            return 0;
        });
        return dataArray;
    }
}

async function getRecommendedList(text, list, type, emphasize = true) {
    const regex = new RegExp(text, 'gi');
    let data = await list;
    if (type == "person") {
        data = await data.filter(infos => {
            infos.name = infos.name.replace('\n', '');
            return (infos.name || '').match(regex) || (infos.subject || '').match(regex) || (infos.class || '').match(regex) || (infos.office || '').match(regex);
        })
    } else {
        data = await data.filter(infos => {
            infos.name = infos.name.replace('\n', '');
            return (infos.code[ 0 ] == 'R') && ((infos.name || '').match(regex) || (infos.homeroomTeacher || '').match(regex));
        })
    }

    data.sort((a, b) => {
        if (Boolean((a.name || '').match(regex)) == Boolean((b.name || '').match(regex))) {
            if (a.name.search(regex) == b.name.search(regex)) {
                if (a.name < b.name)
                    return -1;
                else if (a.name > b.name)
                    return 1;
                return 0;
            }
            return a.name.search(regex) < b.name.search(regex) ? -1 : 1;
        }
        return (a.name || '').match(regex) ? -1 : 1;
    })

    if (emphasize == true) {
        if (type == 'person') {
            data = data.map(infos => {
                if (infos.type == '선생님') {
                    return {
                        ...infos,
                        name: infos.name.replace(regex, "<span class='emph'>$&</span>"),
                        subject: infos.subject.replace(regex, "<span class='subEmph'>$&</span>"),
                        class: infos.class.replace(regex, "<span class='subEmph'>$&</span>"),
                        office: infos.office.replace(regex, "<span class='subEmph'>$&</span>")
                    }
                } else {
                    return {
                        ...infos,
                        name: infos.name.replace(regex, "<span class='emph'>$&</span>"),
                        office: infos.office.replace(regex, "<span class='subEmph'>$&</span>")
                    }
                }
            })
        } else {
            data = data.map(infos => {
                return {
                    ...infos,
                    name: infos.name.replace(regex, "<span class='emph'>$&</span>"),
                    homeroomTeacher: infos.homeroomTeacher.replace(regex, "<span class='subEmph'>$&</span>")
                }
            })
        }
    }

    return data;
}

async function makeRecommendList(elem, type, emphasize = true) {
    var curText = elem.value;
    if (curText == "") {
        clearSuggestions(elem);
        return;
    }

    let list = await getJSONArray(type);
    let recommendedList = await getRecommendedList(curText, list, type, emphasize);

    // console.log(recommendedList);

    let suggestionListTag = document.getElementsByClassName('suggestionList').namedItem(elem.id);
    clearSuggestions(elem);

    if (recommendedList.length > 6)
        recommendedList.length = 6;

    recommendedList.forEach((a, i) => {
        const temp = document.createElement("div");
        if (type == "person") {
            if (recommendedList[ i ].type == "선생님")
                temp.innerHTML = '<div class=\"suggestion\" onclick=\"completeSuggestions(this)\">' +
                    '<span class=\"mainSuggestion\">' + recommendedList[ i ].name + '</span> ' + recommendedList[ i ].type +
                    '<ul class=\"subSuggestion\">' +
                    '<li> &bull; 과목: ' + recommendedList[ i ].subject + '</li>' +
                    '<li> &bull; 교무실: ' + recommendedList[ i ].office + '</li>' +
                    '<li> &bull; 담당: ' + recommendedList[ i ].class + '</li>' +
                    '</ul>'
                    + '</div>';
            else
                temp.innerHTML =
                    '<div class=\"suggestion\" onclick=\"completeSuggestions(this)\">' +
                    '<span class=\"mainSuggestion\">' + recommendedList[ i ].name + '</span> ' + recommendedList[ i ].type +
                    '<ul class=\"subSuggestion\">' +
                    '<li> &bull; 교무실: ' + recommendedList[ i ].office + '</li>' +
                    '</ul>'
                    + '</div>';
        }
        else {
            temp.innerHTML = '<div class=\"suggestion\" onclick=\"completeSuggestions(this)\">' +
                '<span class=\"mainSuggestion\">' + recommendedList[ i ].name + '</span> ' +
                '<ul class=\"subSuggestion\">' +
                '<li> &bull; 담당: ' + recommendedList[ i ].homeroomTeacher + ' 선생님</li>' +
                '</ul>' +
                '</div>'
        }
        suggestionListTag.append(temp);
    });
}

function clearSuggestions(elem) {
    let suggestionListTag = document.getElementsByClassName('suggestionList').namedItem(elem.id);
    suggestionListTag.innerHTML = '';
}

function completeSuggestions(elem) {
    document.getElementById(elem.parentElement.parentElement.id).value = elem.getElementsByClassName('mainSuggestion')[ 0 ].innerText;
    clearSuggestions(elem.parentElement.parentElement);
}
