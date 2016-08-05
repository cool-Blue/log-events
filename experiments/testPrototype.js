/**
 * Created by Admin on 8/4/2016.
 */
function Factory(x, y){
    if(!(this instanceof Factory))
        return new Factory(type, action);
    this.x=x;
    this.y=y
    this.instanceMethod = function(){
        console.log(`${this.x}\t${this.y}`)
    }
}
Factory.prototype.method = function(){
    console.log(`${this.x}\t${this.y}`)
};

var f1 = new Factory('x1', 'y1')
var f2 = new Factory('x2', 'y2')
console.log(`on prototype:\t${f1.method === f2.method}`)    // on prototype:	true
console.log(`cf prototype:\t${f1.method === Factory.prototype.method}`)    // cf prototype:	true
console.log(`on instance:\t${f1.instanceMethod === f2.instanceMethod}`) // on instance:	false

var obj = {};
obj.f1 = f1.method.bind(f1);
console.log(`on object:\t${f1.method === obj.f1.bind(f1)}`);    // on object:	false
obj.f1();   // x1	y1
obj.f2 = f2.method.bind(f2);
console.log(`on object:\t${f2.method === obj.f2.bind(f2)}`);    // on object:	false
obj.f2();   // x2	y2
