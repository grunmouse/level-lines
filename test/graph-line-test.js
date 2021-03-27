
const jsc = require('jsverify');
const {
	env,
	prepForAll,
	bless,
	random
} = require('@grunmouse/jsverify-env');

//const {sortLines} = require('../index.js');
const {sortLines} = require('../graph-line.js');


const arbEdges = bless({
	generator(size){
		const n = env.integer(20,40).generator(size);
		const nodes = env.uarray(n, env.integer(50)).generator();
		const rev = env.array(n-1, env.bool).generator();
		let edges = [];
		for(let i=n-1; i--;){
			let edge = nodes.slice(i, i+2);
			if(rev[i]){
				edge.reverse();
			}
			edges.push(edge);
		}

		edges = env.uarray(edges.length, env.elements(edges)).generator();
		
		return {
			polyline:nodes,
			parts:edges
		};
	}
});

const arbParts = bless({
	generator(size){
		const n = env.integer(20,40).generator(size);
		const nodes = env.uarray(n, env.integer(50)).generator();
		const limits = env.decarray(env.integer(2,30).generator(), env.integer(1, n-2)).generator();
		limits.push(0);
		let parts = [], i=0, end = nodes.length;
		for(let pos of limits){
			let part = nodes.slice(pos, end);
			parts.push(part);
			end = pos+1;
		}
		parts = parts.filter(a=>(a.length>1));
		
		const rev = env.array(parts.length, env.bool).generator();
		
		for(let i=0; i<parts.length; ++i){
			if(rev[i]){
				parts.reverse();
			}
		}
		
		//console.log(parts);
		parts = env.uarray(parts.length, env.elements(parts)).generator();
		//console.log(parts);
		
		return {
			polyline:nodes,
			parts:parts
		};
	}
});

function moveToStart(array, n) {
	return [...array.slice(-n),...array.slice(0, array.length - n)]
}

function isCycleEqual(value, req){
	value = value.slice(0);
	let end = value.indexOf(req[0]);
	
	
	value = moveToStart(value, value.length - end);
	
	let a = jsc.utils.isEqual(req, value);
	if(a){
		return true;
	}
	
	value.reverse();
	value = moveToStart(value, 1);
	let b = jsc.utils.isEqual(req, value);
	
	return b;
}

function isRevEqual(value, req){
	value = value.slice(0);
	let a = jsc.utils.isEqual(req, value);
	if(a){
		return true;
	}
	value.reverse();
	let b = jsc.utils.isEqual(req, value);
	return b;
}

const prop = arb => jsc.forall(arb, env, ({polyline, parts})=>{
	
	//console.log(polyline);
	//console.log(parts);
	let result = sortLines(parts);
	
	//console.log(result);
	
	let opened = result.opened[0];
	
	//console.log(polyline);
	//console.log(opened);
	
	
	return isRevEqual(polyline, opened);
});	

const cycle = arb => jsc.forall(arb, env, ({polyline, parts})=>{
	
	parts.push([polyline[0], polyline[polyline.length-1]]);
	
	let result = sortLines(parts);
	
	//console.log(result);
	
	let opened = result.closed[0];
	
	return isCycleEqual(polyline, opened);;
});

describe('graph-line', ()=>{

	
	it('sortLines edge', ()=>{
		jsc.assert(prop(arbEdges));
	});	
	
	it('sortLines edge closed', ()=>{
		jsc.assert(cycle(arbEdges));
	});
	
	//console.log(prop(arbParts)(0).exc);
	
	it('sortLines', ()=>{
		jsc.assert(prop(arbEdges));
	});	
	
	it('sortLines closed', ()=>{
		jsc.assert(cycle(arbEdges));
	});
});