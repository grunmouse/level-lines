
const jsc = require('jsverify');
const {
	env,
	prepForAll,
	bless,
	random
} = require('@grunmouse/jsverify-env');

const {sortLines} = require('../index.js');


const arbEdges = bless({
	generator(size){
		const n = env.integer(20,40).generator(size);
		const nodes = env.uarray(n, env.integer).generator();
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
		const nodes = env.uarray(n, env.integer).generator();
		const limits = env.decarray(env.integer(2,30).generator(), env.integer(1, n-2)).generator();
		
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

describe('sortLines', ()=>{
	const prop = jsc.forall(arbEdges, env, ({polyline, parts})=>{
		
		let result = sortLines(parts);
		
		let opened = result.opened[0];
		
		//console.log(polyline);
		//console.log(opened);
		
		let a = jsc.utils.isEqual(polyline, opened);
		opened.reverse();
		let b = jsc.utils.isEqual(polyline, opened);
		
		
		return a || b;
	});
	it('sortLines', ()=>{
		jsc.assert(prop);
	});
});