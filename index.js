const {sortLines} = require('./graph-line.js');

	/**
	 * @typedef {integer} NodeID - псевдоним типа, который служит ключём для идентификации узла сетки
	 */
	
	/**
	 * @typedef {Array[2]<number>} Point - пара координат (для узлов и расчётных точек)
	 * @property [0] - горизонтальная координата (x)
	 * @property [1] - вертикальная координата (y)
	 */

	/**
	 * @typedef {Array[2]<integer>} IntPoint - пара целочисленных координат (для точки сетки)
	 * @property [0] - горизонтальная координата (x)
	 * @property [1] - вертикальная координата (y)
	 */
	
	/**
	 * @typedef {Function<(number[0, 1]), (Point)>} ParamFunction - функция, выражающая зависимость координат точки от параметра
	 * @param {number[0, 1]} t - параметр
	 * @returned {Point}
	 */
	 
	/**
	 * @typedef {Function<(x, y), number} TargetFunction - целевая функция, задающая отображаемый рельеф
	 * @param {number} x - горизонтальная координата (x)
	 * @param {number} y - вертикальная координата (y)
	 * @returned {number}
	 */

	/**
	 * @typedef {Function<(number[0, 1]), (number)>} SubtargetFunction - целевая функция, определённая на отрезке [0, 1]
	 * @param {number[0, 1]} t - параметр
	 * @returned {number}
	 */

	/**
	 * Возвращает идентификатор узла линий рядом с точкой
	 * x, y - координаты точки
	 * n - относительное положение узла 
	 * Легенда n:
	   | | 
	  -0-1-
	   |P| 
	  -2-3-
	   | | 
	  P - точка (x;y)
	  0,1,2,3 - позиции узлов сетки, соответствующие значениям n
	  
	 * @param {integer} x
	 * @param {integer} y
	 * @param {ingeger[0, 3]} n
	 * @returned {NodeID}
	 */
	function nodeIndex(x, y, n){
		x = x + (n&1);
		y = y + ((n&2)>>>1);
		return y<<8 | x;
	}
	
	/**
	 * Возвращает координаты узла по его идентификатору
	 * @param {NodeID} index
	 * @returned {Point} - двухмерные координаты узла
	 */
	function nodeXY(index){
		let x = index & 0xFF, y = index >>> 8;
		return [x-0.5, y-0.5];
	}
	
	/**
	 * @function isVertical
	 * @param {Point} middle
	 * @returned {boolean}
	 */
	const isVertical = (middle)=>Number.isInteger(middle[0]);

	/**
	 * @function isHorizontal
	 * @param {Point} middle
	 * @returned {boolean}
	 */
	const isHorizontal = (middle)=>Number.isInteger(middle[1]);

	/**
	 * Находит координаты исходных точек по координатам точки между ними,
	 * предполагается, что координаты исходных точек всегда целые и различаются на 1 по одной оси
	 * @param {Point} middle
	 * @returned {Array[2]<IntPoint>} - координаты пары точек
	 */
	function getPointsPairForMiddlePoint(middle){
		if(isVertical(middle)){
			let x = middle[0];
			let y = Math.ceil(middle[1]);
			return [[x,y], [x, y+1]];
		}
		else if(isHorizontal(middle)){
			let x = Math.ceil(middle[0]);
			let y = middle[1];
			return [[x,y], [x+1, y]];
		}
	}
	
	/**
	 * Создаёт параметрическу функцию, которая представляет координаты исследуемого отрезка как функцию от параметра, причём 0 и 1 - концы отрезка
	 * отрезок должен быть строго вертикальным или горизонтальным, одна из координата точки отрезка растёт при возрастании t
	 * @param {Point} middle - координаты узла, находящегося на исследуемом отрезке
	 * @returned {ParamFunction} - параметрическая функция координат точки в пределах отрезка
	 */
	function parameterSection(middle){
		if(isVertical(middle)){
			let x = middle[0];
			let y = Math.ceil(middle[1]);
			return (t)=>([x, y+t]);
		}
		else if(isHorizontal(middle)){
			let x = Math.ceil(middle[0]);
			let y = middle[1];
			return (t)=>([x+t, y]);
		}
	}
	
	/**
	 * Уточняет координаты точки на вертикальном или горизонтальном отрезке
	 * @param {TargetFunction} f - функция рельефа
	 * @param {number} value - значение функции в искомой точке
	 * @param {Point} middle - предварительные координаты точки (координаты узла, находящегося на проверяемом отрезке)
	 * @param {Function<({SubtargetFunction}, {number}), (number[0, 1])} method
	 * @returned {Point} - уточнённые координаты точки
	 */
	function precissionPoint(f, value, middle, method){
		let par = parameterSection(middle);
		if(!par){
			return middle; //Невозможно уточнить точку
		}
		let fun = (t)=>(f(...par(t)));
		let t = method(fun, value);
		return par(t);
	}
	
	
/**
 * @param {Array<number>} levels - значения уровней, для которых ищутся изолинии, индекс в массиве - считается номером уровня.
 * Массив должен быть отсторирован по возрастанию
 * @return {Function<(Number,Number)=>Array[2]<Integer>>} - функция поиска номеров уровней, между значениями аргументов
 */
function levelsGetter(levels){
	/**
	 * Возвращает номер ближайшего уровня, строго большего z
	 */
	function findLevel(z){
		let n, p, m = levels.length-1;
		if(z>levels[m]){
			return levels.length;
		}
		if(z<levels[0]){
			return 0;
		}
		n=0; p = m;
		m = (n+p)>>>1;
		while(p-n>1){
			if(z == levels[m]){
				return m+1;
			}
			else if(z>levels[m]){
				n=m;
			}
			else if(z<levels[m]){
				p=m;
			}
			m = (n+p)>>>1;
		}
		return p;
	}

	/**
	 * Возвращает пару номеров, между которыми заключены номера уровней, между значениями z1 и z2
	 * такую, что для любого номера i, z1<z[i]<z2, r[0]<=i<r[1];
	 * @param {number} z1
	 * @param {number} z2
	 * @returned {Array[2]<integer>} r
	 */
	function getLevel(z1, z2){
		return [z1,z2].map(findLevel).sort();
	}
	
	return getLevel;
}

/**
 * @typedef {Array[2]<NodeID>} Edge  - кортеж (массив) из двух индексов узлов
 */
	
/**
 * Находит элементарные отрезки изолиний и складывает их в массивы
 * @param {TargetFunction} f - функция расчёта значений, адаптированная, чтобы принимать аргументы 0<=x<xmax, 0<=y<ymax
 * @param {Array<number>} levels - массив уровней, для которых строятся изолинии
 * @param xmax - верхние пределы аргументов
 * @param ymax
 * @returned {Array[levels.length]<Array<Edge>>}
 *		- массив, каждый элемент которого соответствует уровню, индексы элементов соответствуют индексам уровней в массиве level
 *			- уровень представляет собой массив рёбер
 *				- ребро представляет собой пару индексов узлов.
 */
function findLevelEdges(f, levels, xmax, ymax){
	// Массив, каждый элемент - массив рёбер одного уровня, индекс - номер уровня
	let levelEdges = levels.map(()=>([]));
	
	let getLevel = levelsGetter(levels);

	/**
	 * Добавляет ребро edge в каждый уровень из списка levels
	 * @param {Array<integer>} levels - массив номеров уровней
	 * @param {Edge} edge - кортеж (массив) из двух индексов узлов
	 */
	function addEdges(levels, edge){
		for(let i=levels[0]; i<levels[1]; ++i){
			levelEdges[i].push(edge);
		}
	}
	
	//обходит квадраты поля, проверяет, являются ли левая и верхняя границы этого квадрата отрезками линий уровней, 
	//	добавляет это ребро в массивы соответствующих уровней.
	let prevLine = [];
	for(let y=0; y<ymax; ++y){
		let prevValue;
		for(let x=0; x<xmax; ++x){
			let val = f(x, y);
			if(!isNaN(val)){	//Функция должна возвращать NaN за пределами области определения
				if(x>0 && !isNaN(prevValue)){
					addEdges(getLevel(val, prevValue), [nodeIndex(x,y,0), nodeIndex(x,y,2)]); //Проверка на вертикаль слева от квадрата
				}
				if(y>0 && !isNaN(prevLine[x])){
					addEdges(getLevel(val, prevLine[x]), [nodeIndex(x,y,0), nodeIndex(x,y,1)]); //Проверка на горизонталь сверху от квадрата
				}
			}
			prevLine[x] = val;
			prevValue = val;
		}
	}
	return levelEdges;
}

/**
 * Находит точки пересечения линий уровней с кривой заданной curve
 * @param {TargetFunction} f - функция расчёта значений, адаптированная, чтобы принимать аргументы 0<=x<xmax, 0<=y<ymax
 * @param {Array<number>} levels - массив уровней, для которых строятся изолинии
 * @param {Function<(number), (Point)>} - функция задающая кривую как функцию точки от параметра t
 * @param {number} tmax - верхний предел параметра t
 * @returned {Array[levels.length]<Array<number>>} - 
 *		- массив, каждый элемент которого соответствует уровню, индексы элементов соответствуют индексам уровней в массиве level
 *			- уровень представляет собой массив значений параметра t, в которых ожидается пересечение изолинии с кривой
 */
function findLevelCrossCurve(f, levels, curve, tmax){
	let levelPoints = levels.map(()=>([]));
	function addPoints(levels, t){
		for(let i=levels[0]; i<levels[1]; ++i){
			levelPoints[i].push(t);
		}
	}
	
	let getLevel = levelsGetter(levels);
	
	let prevValue;
	for(let t=0; t<=tmax; ++t){
		let point = curve(t);
		let val = f(...point);
		if(t>0){
			addPoints(getLevel(val, prevValue), t-0.5);
		}
		prevValue = val;
	}
	
	return levelPoints;
}

/**
 * @typedef {Array<NodeID>} NodePolyline - ломаная, соединяющая узлы в порядке их следования
 */
 
/**
 * @typedef {object} LevelStructure<P> - структура, представляющая ломаные одного уровня
 * @param {Array<P>} opened - разомкнутые ломаные
 * @param {Array<P>} closed - замкнутые ломаные
 */


/**
 * @typedef {Array<Point>} Polyline - ломаная, выраженная массивом координат точек
 */

/**
 * Преобразует линию, выраженную массивом индексов узлов в линию, выраженную массивом массивов координат узлов
 * @function convertXY
 * @param {NodesPolyline} line
 * @returned <Polyline>
 */
const convertXY = (line)=>(line.map((node)=>(nodeXY(node))));

/**
 * Создаёт на базе ломаной новую ломаную, вершины которой находятся в серединах рёбер первой
 * @param {Polyline} line
 * @returned {Polyline}
 */
function convertMiddlePoints(line){
	let result = [];
	let prev = line[0];
	let last = line[line.length-1];
	const close = (prev[0] === last[0] && prev[1] === last[1]);
	for(let i=1, len = line.length; i<len; ++i){
		let cur = line[i];
		result.push([(cur[0]+prev[0])/2, (cur[1]+prev[1])/2]);
		prev = cur;
	}
	if(close){
		result.push(result[0]); //сохраняем признак замкнутости линии
	}
	return result;
}

/**
 * Функция, обходящая LevelStructure
 * @param {LevelStructure<A>} - исходная структура
 * @param {Function<(A), (B)>} callback - функция, преобразующая ломаные
 * @returned {LevelStructure<B>}
 */
function mapLevelStructure(struct, callback){
	const result = {
		closed:struct.closed.map(callback),
		opened:struct.opened.map(callback)
	};
	return result;
}

/**
 * Рассчитывает изолинии функции по заданным уровням
 * @param {TargetFunction} f - функция расчёта значений, адаптированная, чтобы принимать аргументы 0<=x<xmax, 0<=y<ymax
 * @param {Array<number>} levels - массив уровней, для которых строятся изолинии
 * @param {number} xmax - верхние пределы аргументов
 * @param {number} ymax
 * @returned {Array[levels.length]<LevelStructure<Polyline>>}
 *		- массив уровней, индексы которых совпадают с индексами levels,	
 *		- каждый элемент - множество ломаных уровня
 */
function getIsolines(f, levels, Xmax, Ymax){
	return findLevelEdges(f, levels, Xmax, Ymax).map((edges, i)=>{
		let struct = sortLines(edges);
		//Получены цепочки нодов
		const convert = (a)=>{
			//На входе цепочка NodeID
			let b = convertXY(a);
			//Получена ломаная, проходящая через середины квадратов, между рассчитанными точками
			let c = convertMiddlePoints(b);
			//Получена ломаная, проходящая через середины отрезков, между рассчитанными точками
			return c;
		};
		let result = mapLevelStructure(struct, convert);
		return result;
	});
}

/**
 * @typedef {object} EndOfPolyline - конец ломаной
 * @property {integer} i - номер ломаной 
 * @property {Polyline} line - ссылка на ломаную
 * @property {integer} index - позиция конца ломаной в массиве её точек
 * @property {Point} point - ссылка на конец ломаной
 */
 
/**
 * @param {EndOfPolyline} - конец ломаной, к которому нужно добавить точку
 * @param {Point} - добавляемая точка
 */
function appendPoint(lineend, newpoint){
	const {line, index} = lineend;
	if(index === 0){
		line.unshift(newpoint);
	}
	else if(index === line.length-1){
		line.push(newpoint);
	}
	else{
		throw new Error('Incorrect EndOfLine #' + lineend.i);
	}
}

/**
 * Находит для каждой точки ближайший к ней конец линии.
 * @param {Array<Point>} points
 * @param {Array<Polyline>} lines
 * @returned {Array[points.length]<([(Point), (EndOfPolyline)])>} - массив кортежей из ссылки на точку и конца ломаной
 */
function getLineEndsForPoints(points, lines){
	/**
	 * @var {Array<EndOfPolyline>} endGroup - массив структур, описывающих концы ломаных
	 */
	const endGroup = [].concat(
		...lines.map(
			(line, i)=>(
				[
					{i, line, index:0, point:line[0]}, 
					{i, line, index:line.length-1, point:line[line.lenght-1]}
				]
			)
		)
	);
	
	/**
	 * @function getEnd - ищет конец для точки
	 * @param {Point} point
	 * @returned [{Point}, {EndOfPolyline}]
	 */
	const getEnd = (point)=>{
		//Выбирает из массива концов концы, достаточно близкие к заданной точке, если их несколько - возвращает ближайший
		let g = endGroup.filter((e)=>(Math.abs(e.point[0]-point[0])<2 && Math.abs(e.point[1]-point[1])<2));
		let res;
		if(g.length){
			if(g.length>1){
				g.sort((a, b)=>{
					//Квадраты расстояний a и b до point
					let da = (a.point[0]-point[0])**2 + (a.point[1]-point[1])**2;
					let db = (b.point[0]-point[0])**2 + (b.point[1]-point[1])**2;
					return da-db;
				});
			}
			res = g[0];
		}
		return [point, res];
	};
	
	return points.map(getEnd);
}

function precissionMaper(f, value, method){
	return (line)=>(line.map((point)=>{
		return precissionPoint(f, value, middle, method);
	});
}

module.exports = {
	getIsolines,
	sortLines,
	findLevelCrossCurve,
	getLineEndsForPoints,
	appendPoint,
	precissionMaper,
	precission: require('./precission-methods.js'),
	mapLevelStructure
}