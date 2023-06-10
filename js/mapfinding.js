async function fetchHtmlAsText(url) {
    return await (await fetch(url)).text();
}

async function importPage(target) {
    document.querySelector('#' + target).innerHTML = await fetchHtmlAsText(target + '.html');
}

function getNodeInfoByName(name) {
}

async function setMainMapMode() {
    // ISOMETRIC ANIMATION - CSS
    mapElem = document.getElementsByClassName("map")[ 0 ];
    mapElem.innerHTML = await fetchHtmlAsText("mainMap.html");
}

function changeOpacity(elem, level) {
    var obj = elem;
    obj.style.opacity = level;
    obj.style.MozOpacity = level;
    obj.style.KhtmlOpacity = level;
    obj.style.msFilter = "'progid:DXImageTransform.Microsoft.Alpha(Opacity=" + (level * 100) + ")'";
    obj.style.filter = "alpha(opacity=" + (level * 100) + ");";
}

function internal_fadeOut(elem, level, outTimer) {
    level = level - 0.1;
    console.log(level);
    changeOpacity(elem, level);
    if (level < 0)
        clearInterval(outTimer);
    return level;
}

function internal_fadeIn(elem, level, inTimer) {
    level = level + 0.1;
    changeOpacity(elem, level);
    if (level > 1)
        clearInterval(inTimer);
    return level;
}

function fadeOut(elem) {
    var opacity = 1;
    var outTimer = null;
    outTimer = setInterval(function () {
        opacity = internal_fadeOut(elem, opacity, outTimer);
    }, 50);
}

function fadeIn(elem) {
    var opacity = 0;
    var inTimer = null;
    inTimer = setInterval(function () {
        opacity = internal_fadeIn(elem, opacity, inTimer);
    }, 50);
}

async function loadFloorMap(floor) {
    mapElem = document.getElementsByClassName("map")[ 0 ];
    await fadeOut(mapElem);
    mapElem.innerHTML = "<img src=\"img/floor" + floor + ".png\" width=120% height=100%>";
    await fadeIn(mapElem);
}

// webpage load - map mode settings

async function webpageOnload() {
    setMainMapMode();
}
