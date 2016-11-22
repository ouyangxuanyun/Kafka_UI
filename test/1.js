// var array=[];
var array=new Object();
// array.push('1');
// array.push('2');
// array.push('3');
array['test']='2222';
array['exam']='exam';
// delete(array['test']);
var j = JSON.stringify(array)
console.log(array);
console.log(j);
console.log(j[4]);
console.log("####" + array.test)

var arr = ['a','b','c'];
arr.splice(1,1);
console.log(arr);

var a = {a:1,b:2,c:3};

var b = JSON.stringify(a);

console.log(b)