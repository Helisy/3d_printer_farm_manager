function isValidDateFormat(dateString) {
    var dateFormat = /^\d{4}-\d{2}-\d{2}$/;
    return dateFormat.test(dateString);
}

function countCharOccurrences(str, char) {
    let count = 0;

    for (let i = 0; i < str.length; i++) {
        if (str[i] === char) {
        count++;
        }
    }

    return count;
}

function validateObject(objA, objB) {
    for (let key in objA) {
      if (!objB.hasOwnProperty(key)) {
        delete objA[key];
      }
    }
}

function consoleLog(paramLog=null, paramType=null) {
	var strNow = new Date().toJSON().slice(0,23).replace('T',' ')
	var strType = paramType!=null?` [${paramType}] `:'';// INFO, WARNING, ERROR

	if(paramLog!=null)
		console.log(`${strNow} >>${strType}`, paramLog)
	else
		return `${strNow} >>${strType}`
}

function removeDuplicates(array) {
  const uniqueArray = [];
  array.forEach((item) => {
    if (!uniqueArray.some((obj) => isEqual(obj, item))) {
      uniqueArray.push(item);
    }
  });
  return uniqueArray;
}

function isEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

// Utility to sanitize SQL identifiers (to prevent SQL injection)
function sanitizeIdentifier(identifier) {
return identifier.replace(/[^a-zA-Z0-9_]/g, "");
}

function areAllItemsInArray(A, B) {
  // Check if all items in B are in A
  return B.every(item => A.includes(item));
}


module.exports = { isValidDateFormat, countCharOccurrences, validateObject, consoleLog, removeDuplicates, sanitizeIdentifier, areAllItemsInArray };