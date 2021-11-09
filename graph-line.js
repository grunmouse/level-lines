/**
 * Абстрагированная функция поиска непрерывных путей в двухвалентных графах
 */

/**
 * @typedef NodeID - любое значение, которое может служить ключём
 */

/**
 * @typedef {Array[2]<NodeID>} Edge  - кортеж (массив) из двух индексов узлов
 */

/**
 * @typedef {Array<NodeID>} NodePolyline - ломаная, соединяющая узлы в порядке их следования
 */
 
/**
 * @typedef {object} LevelStructure<P> - структура, представляющая ломаные одного уровня
 * @param {Array<P>} opened - разомкнутые ломаные
 * @param {Array<P>} closed - замкнутые ломаные
 */

/**
 * сортирует объединяет смежные рёбра в непрерывные цепочки узлов
 * @param {Array<NodePolyline>} edges - массив фрагментов линий
 * @returned LevelStructure<NodePolyline>
 */
function sortLines(edges){
	/**
	 * @var {Map<NodeID, NodePolyline>} linesMap
	 * для каждого узла, являющегося концом ломаной, содержит соответствующую ломаную
	 */
	let linesMap = new Map();
	/**
	 * @var {Array<NodePolyline>} closeLines
	 * Массив замкнутых линий
	 */
	let closeLines = [];

	/**
	 * Проверяет, не замкнута ли ломаная после добавления узла node
	 * если замкнута - добавляет её в массив closeLines и удаляет из мапы вторую ссылку на неё,
	 * если нет - добавляет её в мапу под индексом node
	 * @param {NodePolyline} line - ломаная, выраженная массивом индексов узлов
	 * @param {NodeID} node - индекс нового концевого узла
	 */
	function renameLine(line, node){
		if(line[0] === line[line.length-1]){
			closeLines.push(line);
			linesMap.delete(line[0]);
			line.pop();
		}
		else if(linesMap.has(node)){
			concatLines(line, node);
		}
		else{
			linesMap.set(node, line);
		}
	}
	
	/**
	 * Соединяет две линии, удаляет из мапы общий узел, если он там был, добавляет полученную линию по ключам её концов
	 * @param {NodePolyline} line1
	 * @param {NodeID} node - общий узел
	 * @param {NodePolyline} line2
	 * @return {NodeID} - второй узел line2
	 */
	function concatTwoLines(line1, node, line2){
		if(line1[0]===node){
			if(line2[0]===node){
				//Начало к началу
				line2.reverse();
			}
			if(line2.pop()===node){
				//Конец к началу
				line1.unshift(...line2);
				linesMap.delete(node);
				
				let n2 = line1[0];

				return n2;
			}
		}
		else if(line1[line1.length-1]===node){
			if(line2[line2.length-1]===node){
				//Конец к концу
				line2.reverse();
			}
			if(line2.shift()===node){
				//Начало к концу
				line1.push(...line2);
				linesMap.delete(node);
				
				let n2 = line1[line1.length-1];
				
				return n2;
			}
		}
		else{
			throw new Error("Inconsistent line "+node);
		}
	}

	/**
	 * Дополняет линию line1, содержащую узел node 
	 * узлами из линии line2, находящейся в мапе по ключу node
	 * удаляет из мапы линию по ключу node - это line2,
	 * заменяет линию, по ключу с другого конца line2 (это line2) на результат объединения
	 * @param {NodePolyline} line1
	 * @param {NodeID} node
	 */
	function concatLines(line1, node){
		let line2 = linesMap.get(node);
		let n2 = concatTwoLines(line1, node, line2);
		linesMap.set(n2, line1);
	}
	
	/**
	 * Находит в карте линию, один из концов которой равен n1
	 *	добавляет с соответствующего конца новый фрагмент line2
	 * @param {NodeID} node
	 * @param {NodePolyline} line2
	 */
	function handle(node, line2){
		let line1 = linesMap.get(node);
		let n2 = concatTwoLines(line1, node, line2);
		renameLine(line1, n2);
	}
	
	//Обходит все рёбра, проверяет есть ли в мапе линии начинающиеся с одного из узлов очередного ребра,
	//	если да - то дополняет и переименовывает эту линию этим узлом
	//	если нет, то добавляет ребро в мапу как новую линию, доступную по двум индексам - номерам её узлов
	for(let e of edges){
		let first = e[0];
		let last = e[e.length-1];
		let line = [...e];
		if(linesMap.has(first)){
			handle(first, line);
		}
		else if(linesMap.has(last)){
			handle(last, line);
		}
		else{
			linesMap.set(first, line);
			linesMap.set(last, line);
		}
	}
	//После работы все замкнутые линии перенесены в closeLines, мапа содержит только разомкнутые, причем по две ссылки на каждую
	let uncloseLines = Array.from(new Set(linesMap.values()));
	return {
		closed:closeLines,
		opened:uncloseLines
	};
}

module.exports = {
	sortLines
};