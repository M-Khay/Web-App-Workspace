var kk = {
	 name:"Kush",
	 lastname: "Ahuja"
}

console.log(kk.name);


function Person(first, last) {
  this.first = first;
  this.last = last;
  this.fullName = function() {
    return this.first + ' ' + this.last;
  };
  this.fullNameReversed = function() {
    return this.last + ', ' + this.first;
  };
}

var s = new Person('Simon', 'Willison');
console.log(s.fullName());



function personFullName() {
  return this.first + ' ' + this.last;
}
function personFullNameReversed() {
  return this.last + ', ' + this.first;
}
function Person(first, last) {
  this.first = first;
  this.last = last;
  this.fullName = personFullName;
  this.fullNameReversed = personFullNameReversed;
}


var p = new Person("kk", "Blowing");
console.log(p.fullName());

var myArray = ["k","U","S","H", 420];

for (var j = 0; j<myArray.length;j++){
	console.log(myArray[j]);
}


var arrayExample2 = ['dog', 'cat', 'hen'];

for(let a of arrayExample2){
	console.log(a);	 // this for loops copies actual content into a from arrayExample2
}


for(let a in arrayExample2){
	console.log(arrayExample2[a]);	 // this for loops does not copies actual content into "a" but rather a holds position.
}



function Student(first, last) {
  this.first = first;
  this.last = last;
}
Student.prototype.fullName = function() {
  return this.first + ' ' + this.last;
};
Student.prototype.fullNameReversed = function() {
  return this.last + ', ' + this.first;
};

var student =  new Student("Get","High");
console.log(student.fullName);

console.log()