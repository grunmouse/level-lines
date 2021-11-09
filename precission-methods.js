/**
 * Методы уточнения положения точки на отрезке [0, 1]
 */
/** 
 * typedef {Function} Finder
 * @param fun : Function - целевая функция
 * @param value : Number - значение функции, которое следует искать на отрезке
 * @return Number - приближенный аргумент функции для этого значения
 */

	/**
	 * Числовой поиск, до тех пор, пока шаг аргумента не станет меньше допуска
	 * @param eps : Number - величина допуска
	 * @return Finder
	 */
	function nummericFindToStep(eps){
		return (fun, value)=>{
			let n=0, p=1;
			while(p-n<eps){
				m=(p+n)/2;
				let mval = fun(m);
				if(mval>value){
					p = m;
				}
				else if(mval < value){
					n = m;
				}
				else if(mval === value){
					return m;
				}
				else{
					throw new Error("Function returned NaN: " + mval);
				}
			}
			return p;
		}
	}

	/**
	 * Числовой поиск, до тех пор, пока шаг приращение функции не станет меньше допуска
	 * @param eps : Number - величина допуска
	 * @return Finder
	 */
	function nummericFindToValue(eps){
		return (fun, value)=>{
			let n=0, p=1;
			while(p-n<0){
				m=(p+n)/2;
				let mval = fun(m);
				if(mval>value){
					p = m;
				}
				else if(mval < value){
					n = m;
				}
				else if(Math.abs(mval - value)<eps){
					return m;
				}
				else{
					throw new Error("Function returned NaN: " + mval);
				}
			}
			return p;
		}
	}
	
	/**
	 * Линейная интерполяция функции от аргумента [0;1]
	 * @Implements Finder
	 */
	function linearInterpol(fun, value){
		let f0 = fun(0);
		let k = fun(1) - f0;
		let t = (value-f0)/k;
		
		return t;
	}
	
module.exports = {
	nummericFindToStep,
	nummericFindToValue,
	linearInterpol
};