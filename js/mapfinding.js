// 지도 전역변수 설정
let nodeList = [ null ];
let adjList = new Map();
let nodeInfo = new Map();
let codeNInfo = new Map();
let curFloor = 1;

// FUNCTIONS

async function fetchHtmlAsText(url) {
    return await (await fetch(url)).text();
}

async function importPage(target) {
    document.querySelector('#' + target).innerHTML = await fetchHtmlAsText(target + '.html');
}

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

function getNodeInfoByName(name, nodeList) {
    nodeList.forEach((a, i) => {
        if (a.name == name)
            return a;
    })
    return -1;
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
    //console.log(level);
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
    await changeOpacity(mapElem, 0);
    mapElem.innerHTML = await fetchHtmlAsText("floors/floor" + floor + ".html");
    svg = document.getElementById("mp");
    floorData = await getFloorNodes(floor);
    for (e of floorData) {
        ////////////////////////////////////////////////////////////// for debug
        if (e.code[ 0 ] == 'R' || e.code[ 0 ] == 'E') {
            var txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
            txt.setAttributeNS(null, "x", e.pos[ 0 ]);
            txt.setAttributeNS(null, "y", e.pos[ 1 ]);
            txt.setAttributeNS(null, "fill", "black");
            txt.setAttributeNS(null, "style", "font-size: " + e.fontSize);
            txt.setAttributeNS(null, "text-anchor", "middle");
            const str = e.name.split("\n");
            txt.textContent = str[ 0 ];
            svg.appendChild(txt);
            for (let i = 1; i < str.length; i++) {
                var t = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
                t.setAttributeNS(null, "x", parseInt(e.pos[ 0 ]));
                t.setAttributeNS(null, "y", parseInt(e.pos[ 1 ]) + i * 10);
                t.setAttributeNS(null, "fill", "black");
                t.setAttributeNS(null, "style", "font-size: " + e.fontSize);
                t.setAttributeNS(null, "text-anchor", "middle");
                t.textContent = str[ i ];
                //console.log(t);
                svg.childNodes[ svg.childNodes.length - 1 ].appendChild(t);

            }
        }
    }
    //$('img[usemap]').rwdImageMaps();
    curFloor = floor;
    await fadeIn(mapElem);
    findMap();

    let curFloorBtn = document.getElementById('floorBtn' + curFloor);
    curFloorBtn.checked = true;
}

//cost function f(n) = g(n) + h(n)
async function gCost(start, cur) {
    return Math.round(Math.sqrt(Math.pow((cur.pos[ 0 ] - start.pos[ 0 ]), 2) + Math.pow((cur.pos[ 1 ] - start.pos[ 1 ]), 2))) + 400 * Math.abs(cur.code[ 1 ] - start.code[ 1 ]);
}
async function hCost(cur, end) {
    return Math.abs(cur.pos[ 0 ] - end.pos[ 0 ]) + Math.abs(cur.pos[ 1 ] - end.pos[ 1 ]) + 400 * Math.abs(cur.code[ 1 ] - end.code[ 1 ]);
}
async function cost(start, cur, end) {
    return await gCost(start, cur) + await hCost(cur, end);
}

// A Priority Queue Class
// REFERENCE: https://velog.io/@treejy/Priority-Queue-Heap-%EA%B0%9C%EB%85%90-%EB%B0%8F-JavaScript-%EA%B5%AC%ED%98%84
class PriorietyQueue {
    constructor() {
        this.heap = [ null ];
    }
    front() {
        return this.heap[ 1 ];
    }
    size() {
        return this.heap.length - 1;
    }
    empty() {
        return this.heap.length < 2;
    }
    push(node) { // node: [name, cost, parent]로 이루어진 parameter.
        let cur = this.heap.length;
        while (cur > 1) {
            const parent = Math.floor(cur / 2);
            if (this.heap[ parent ][ 1 ] > node[ 1 ]) {
                this.heap[ cur ] = this.heap[ parent ];
                cur = parent;
            } else break;
        }
        this.heap[ cur ] = node;
    }
    pop() {
        let min = this.heap[ 1 ];

        if (this.heap.length > 2) {
            this.heap[ 1 ] = this.heap[ this.heap.length - 1 ];
            this.heap.splice(this.heap.length - 1);

            let current = 1;
            let leftChildIndex = current * 2;
            let rightChildIndex = current * 2 + 1;

            while (this.heap[ leftChildIndex ]) {
                let childIndexToCompare = leftChildIndex;
                if (
                    this.heap[ rightChildIndex ] &&
                    this.heap[ rightChildIndex ][ 1 ] < this.heap[ childIndexToCompare ][ 1 ]
                )
                    childIndexToCompare = rightChildIndex;

                if (this.heap[ current ][ 1 ] > this.heap[ childIndexToCompare ][ 1 ]) {
                    [ this.heap[ current ], this.heap[ childIndexToCompare ] ] = [
                        this.heap[ childIndexToCompare ],
                        this.heap[ current ],
                    ];
                    current = childIndexToCompare;
                } else break;

                leftChildIndex = current * 2;
                rightChildIndex = current * 2 + 1;
            }
        } else if (this.heap.length === 2) {
            this.heap.splice(1, 1);
        } else {
            return null;
        }

        return min;
    }

}

// An A* Algorithm Function
// REFERENCE: https://recall.tistory.com/40, http://www.gisdeveloper.co.kr/?p=3897, https://velog.io/@dolarge/Java-Script-Set-%EA%B3%BC-Map
// f(n) = g(n) + h(n);
// we use g(n): Euclidean Distance between Current Node and Next Node
// we use h(n): Manhattan Distance between Current Node and End Node
// nodeList: All infos of nodes
// adjList: Infos of nodes' adjacent nodes

async function findMap() {
    let mapDiv = document.getElementById('mp');
    for (e of mapDiv.querySelectorAll('line')) {
        mapDiv.removeChild(e);
    }
    //console.log('debug1');
    let pq = new PriorietyQueue();
    let visited = new Map();
    if (!nodeInfo.get(document.getElementById('startInput').value)) {
        document.getElementById('startInput').animate({ backgroundColor: "#FF8988" }, 500);
        return;
    }
    if (!nodeInfo.get(document.getElementById('endInput').value)) {
        document.getElementById('endInput').animate({ backgroundColor: "#FF8988" }, 500);
        return;
    }
    let startNode = nodeInfo.get(document.getElementById('startInput').value).code;
    let endNode = nodeInfo.get(document.getElementById('endInput').value).code;
    //console.log(nodeInfo.get(startNode));

    pq.push([ startNode, await cost(codeNInfo.get(startNode), codeNInfo.get(startNode), codeNInfo.get(endNode)), startNode ]);
    while (!pq.empty()) {
        let cur = pq.pop();
        //console.log(cur);
        if (!visited.has(cur[ 0 ]) || visited.get(cur[ 0 ])[ 1 ] < cur[ 1 ])
            visited.set(cur[ 0 ], cur);
        if (cur[ 0 ] == endNode)
            break;
        if (adjList.get(cur[ 0 ]) != null) {
            for (e of adjList.get(cur[ 0 ])) {
                if (!visited.has(e) && codeNInfo.has(e)) {
                    pq.push([ e, await cost(codeNInfo.get(startNode), codeNInfo.get(e), codeNInfo.get(endNode)), cur[ 0 ] ]);
                }
            }
        }
    }
    let cur = endNode;
    let path = [ endNode ];
    while (cur != startNode) {
        cur = visited.get(cur)[ 2 ];
        path = [ cur, ...path ];
    }
    //console.log(path);

    let p1, p2;
    for (let i = 0; i < path.length - 1; i++) {
        //console.log(path[ i ]);
        //console.log(path[ i ][ 1 ]);
        if (parseInt(path[ i ][ 1 ]) == curFloor && parseInt(path[ i + 1 ][ 1 ]) == curFloor) {
            p1 = codeNInfo.get(path[ i ]).pos;
            p2 = codeNInfo.get(path[ i + 1 ]).pos;
            var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttributeNS(null, "x1", p1[ 0 ]);
            line.setAttributeNS(null, "y1", p1[ 1 ]);
            line.setAttributeNS(null, "x2", p2[ 0 ]);
            line.setAttributeNS(null, "y2", p2[ 1 ]);
            line.setAttributeNS(null, "stroke", "#5500CC");
            line.setAttributeNS(null, "stroke-width", "5");
            line.setAttributeNS(null, "stroke-linecap", "round");
            mapDiv.appendChild(line);
        }
    }
}

// webpage load - map mode settings

async function webpageOnload() {
    nodeList = await getAllNodes();
    for (node of nodeList) {
        adjList.set(node.code, node.adjList);
        nodeInfo.set(node.name.replace('\n', ''), node);
        codeNInfo.set(node.code, node);
    }
    loadFloorMap(1);
    //setMainMapMode(); //mainMap animation; deleted cuz it's not needed
}
